import type {
  AdminAuditLog,
  ComplianceOverview,
  LegalDocument,
  PrivacyDataSummary,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketMessage,
  UserConsentRecord,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

function mapLegalDoc(row: Record<string, unknown>): LegalDocument {
  return {
    id: String(row.id),
    regionCode: String(row.region_code),
    docType: String(row.doc_type),
    version: String(row.version),
    title: String(row.title),
    summary: (row.summary as string | null) ?? null,
    bodyMd: (row.body_md as string | null) ?? null,
    effectiveAt: String(row.effective_at),
    isActive: Boolean(row.is_active),
  };
}

function mapTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    category: String(row.category),
    subject: String(row.subject),
    status: String(row.status),
    priority: String(row.priority),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    resolvedAt: (row.resolved_at as string | null) ?? null,
    latestMessagePreview: (row.latest_preview as string | null) ?? null,
  };
}

function mapMessage(row: Record<string, unknown>): SupportTicketMessage {
  return {
    id: String(row.id),
    ticketId: String(row.ticket_id),
    authorId: String(row.author_id),
    authorRole: String(row.author_role),
    body: String(row.body),
    createdAt: String(row.created_at),
  };
}

export const complianceRepository = {
  async listLegalDocuments(regionCode: string, docType?: string): Promise<LegalDocument[]> {
    const pool = getPool();
    if (!pool) return [];
    const params: unknown[] = [regionCode];
    let sql = `SELECT * FROM legal_documents WHERE is_active = TRUE AND region_code = $1`;
    if (docType) {
      params.push(docType);
      sql += ` AND doc_type = $2`;
    }
    sql += ` ORDER BY doc_type ASC, effective_at DESC`;
    const result = await pool.query(sql, params);
    return result.rows.map((r) => mapLegalDoc(r as Record<string, unknown>));
  },

  async upsertLegalDocument(input: {
    regionCode: string;
    docType: string;
    version: string;
    title: string;
    summary?: string;
    bodyMd?: string;
    isActive?: boolean;
    createdBy?: string;
  }): Promise<LegalDocument> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query(
      `INSERT INTO legal_documents (
         region_code, doc_type, version, title, summary, body_md, is_active, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (region_code, doc_type, version)
       DO UPDATE SET
         title = EXCLUDED.title,
         summary = EXCLUDED.summary,
         body_md = EXCLUDED.body_md,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()
       RETURNING *`,
      [
        input.regionCode,
        input.docType,
        input.version,
        input.title,
        input.summary ?? null,
        input.bodyMd ?? null,
        input.isActive ?? true,
        input.createdBy ?? null,
      ]
    );
    return mapLegalDoc(result.rows[0] as Record<string, unknown>);
  },

  async listConsents(userId: string): Promise<UserConsentRecord[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT id, consent_type, version, agreed, agreed_at, region_code, source
       FROM user_consents WHERE user_id = $1
       ORDER BY agreed_at DESC`,
      [userId]
    );
    return result.rows.map((r) => ({
      id: String(r.id),
      consentType: String(r.consent_type),
      version: String(r.version),
      agreed: Boolean(r.agreed),
      agreedAt: String(r.agreed_at),
      regionCode: r.region_code ? String(r.region_code) : undefined,
      source: r.source ? String(r.source) : undefined,
    }));
  },

  async recordConsentMeta(
    userId: string,
    items: Array<{ type: string; version: string; agreed: boolean }>,
    meta?: {
      regionCode?: string;
      ipAddress?: string | null;
      userAgent?: string | null;
      source?: string;
    }
  ): Promise<void> {
    const pool = getPool();
    if (!pool || items.length === 0) return;
    for (const item of items) {
      await pool.query(
        `INSERT INTO user_consents (
           user_id, consent_type, version, agreed, region_code, ip_address, user_agent, source
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (user_id, consent_type, version)
         DO UPDATE SET
           agreed = EXCLUDED.agreed,
           agreed_at = NOW(),
           region_code = EXCLUDED.region_code,
           ip_address = EXCLUDED.ip_address,
           user_agent = EXCLUDED.user_agent,
           source = EXCLUDED.source`,
        [
          userId,
          item.type,
          item.version,
          item.agreed,
          meta?.regionCode ?? 'KR',
          meta?.ipAddress ?? null,
          meta?.userAgent ?? null,
          meta?.source ?? 'app',
        ]
      );
    }
  },

  async setPrivacyFlags(
    userId: string,
    flags: {
      marketingOptIn?: boolean;
      eventOptIn?: boolean;
      locationOptIn?: boolean;
      pushServiceOptIn?: boolean;
    }
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    const sets: string[] = [];
    const params: unknown[] = [userId];
    if (flags.marketingOptIn !== undefined) {
      params.push(flags.marketingOptIn);
      sets.push(`marketing_opt_in = $${params.length}`);
    }
    if (flags.eventOptIn !== undefined) {
      params.push(flags.eventOptIn);
      sets.push(`event_opt_in = $${params.length}`);
    }
    if (flags.locationOptIn !== undefined) {
      params.push(flags.locationOptIn);
      sets.push(`location_opt_in = $${params.length}`);
    }
    if (flags.pushServiceOptIn !== undefined) {
      params.push(flags.pushServiceOptIn);
      sets.push(`push_service_opt_in = $${params.length}`);
    }
    if (sets.length === 0) return;
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $1`, params);
  },

  async getPrivacySummary(userId: string): Promise<PrivacyDataSummary | null> {
    const pool = getPool();
    if (!pool) return null;
    const userResult = await pool.query(
      `SELECT id, email, display_name, gender, height_cm, weight_kg, age, workout_goal,
              experience_level, home_gym_name, marketing_opt_in, event_opt_in, location_opt_in,
              push_service_opt_in, privacy_processing_suspended_at, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    const u = userResult.rows[0];
    if (!u) return null;

    const locResult = await pool.query(
      `SELECT country_code, state_id, city_id, district_id, latitude, longitude, visibility
       FROM user_locations WHERE user_id = $1`,
      [userId]
    );
    const loc = locResult.rows[0];

    const count = async (sql: string) => {
      const r = await pool.query<{ count: string }>(sql, [userId]);
      return parseInt(r.rows[0]?.count ?? '0', 10);
    };

    const consents = await this.listConsents(userId);

    return {
      profile: {
        id: String(u.id),
        email: '',
        displayName: String(u.display_name),
        gender: u.gender ?? null,
        heightCm: u.height_cm != null ? parseFloat(String(u.height_cm)) : null,
        weightKg: u.weight_kg != null ? parseFloat(String(u.weight_kg)) : null,
        age: u.age ?? null,
        workoutGoal: u.workout_goal ?? null,
        experienceLevel: u.experience_level ?? null,
        homeGymName: u.home_gym_name ?? null,
        marketingOptIn: Boolean(u.marketing_opt_in),
        eventOptIn: Boolean(u.event_opt_in ?? u.marketing_opt_in),
        locationOptIn: Boolean(u.location_opt_in),
        pushServiceOptIn: u.push_service_opt_in !== false,
        privacyProcessingSuspended: Boolean(u.privacy_processing_suspended_at),
        createdAt: String(u.created_at),
      },
      location: loc
        ? {
            countryCode: loc.country_code ?? null,
            stateId: loc.state_id ?? null,
            cityId: loc.city_id ?? null,
            districtId: loc.district_id ?? null,
            hasCoordinates: loc.latitude != null && loc.longitude != null,
            visibility: loc.visibility ?? null,
          }
        : null,
      consents,
      counts: {
        workoutLogs: await count(
          `SELECT COUNT(*)::text AS count FROM workout_logs WHERE user_id = $1`
        ).catch(() => 0),
        favorites: await count(
          `SELECT COUNT(*)::text AS count FROM favorites WHERE user_id = $1`
        ).catch(() => 0),
        photoPosts: await count(
          `SELECT COUNT(*)::text AS count FROM photo_posts WHERE user_id = $1`
        ).catch(() => 0),
        communityPosts: await count(
          `SELECT COUNT(*)::text AS count FROM posts WHERE user_id = $1`
        ).catch(() => 0),
      },
    };
  },

  async buildExportPayload(userId: string): Promise<Record<string, unknown> | null> {
    const summary = await this.getPrivacySummary(userId);
    if (!summary) return null;
    const pool = getPool();
    if (!pool) return { exportedAt: new Date().toISOString(), ...summary };

    const tickets = await pool.query(
      `SELECT id, category, subject, status, created_at FROM support_tickets
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );

    const workoutLogs = await pool
      .query(
        `SELECT id, machine_id, log_date, set_count, set_weights_kg, created_at
         FROM workout_logs WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 500`,
        [userId]
      )
      .catch(() => ({ rows: [] as unknown[] }));

    const favorites = await pool
      .query(
        `SELECT machine_id, created_at FROM favorites WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 200`,
        [userId]
      )
      .catch(() => ({ rows: [] as unknown[] }));

    const providers = await pool
      .query(
        `SELECT provider, provider_email, created_at FROM auth_providers WHERE user_id = $1`,
        [userId]
      )
      .catch(() => ({ rows: [] as unknown[] }));

    const paymentHistory = await pool
      .query(
        `SELECT id, amount_cents, currency, status, payment_provider, created_at
         FROM payment_history WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 100`,
        [userId]
      )
      .catch(() => ({ rows: [] as unknown[] }));

    const loginEvents = await pool
      .query(
        `SELECT success, failure_reason, created_at
         FROM auth_login_events WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 50`,
        [userId]
      )
      .catch(() => ({ rows: [] as unknown[] }));

    return {
      exportedAt: new Date().toISOString(),
      regionHint: 'KR',
      notice:
        'This export is provided for personal data access/portability. Binary media blobs (photos) are omitted. Login events exclude IP/UA in this download.',
      summary,
      linkedProviders: providers.rows,
      workoutLogs: workoutLogs.rows,
      favorites: favorites.rows,
      paymentHistory: paymentHistory.rows,
      recentLoginEvents: loginEvents.rows,
      supportTickets: tickets.rows,
    };
  },

  async createSupportTicket(
    userId: string,
    input: { category: string; subject: string; body: string }
  ): Promise<SupportTicketDetail> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const ticketResult = await pool.query(
      `INSERT INTO support_tickets (user_id, category, subject)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, input.category, input.subject]
    );
    const ticket = ticketResult.rows[0];
    await pool.query(
      `INSERT INTO support_ticket_messages (ticket_id, author_id, author_role, body)
       VALUES ($1, $2, 'user', $3)`,
      [ticket.id, userId, input.body]
    );
    return this.getSupportTicket(String(ticket.id), userId) as Promise<SupportTicketDetail>;
  },

  async listUserTickets(userId: string): Promise<SupportTicket[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT t.*,
              (SELECT LEFT(m.body, 120) FROM support_ticket_messages m
               WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS latest_preview
       FROM support_tickets t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT 100`,
      [userId]
    );
    return result.rows.map((r) => mapTicket(r as Record<string, unknown>));
  },

  async getSupportTicket(
    ticketId: string,
    userId?: string
  ): Promise<SupportTicketDetail | null> {
    const pool = getPool();
    if (!pool) return null;
    const params: unknown[] = [ticketId];
    let sql = `SELECT * FROM support_tickets WHERE id = $1`;
    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $2`;
    }
    const ticketResult = await pool.query(sql, params);
    const t = ticketResult.rows[0];
    if (!t) return null;
    const msgResult = await pool.query(
      `SELECT * FROM support_ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC`,
      [ticketId]
    );
    return {
      ...mapTicket(t as Record<string, unknown>),
      messages: msgResult.rows.map((r) => mapMessage(r as Record<string, unknown>)),
    };
  },

  async addTicketMessage(
    ticketId: string,
    authorId: string,
    authorRole: 'user' | 'admin',
    body: string
  ): Promise<SupportTicketMessage> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query(
      `INSERT INTO support_ticket_messages (ticket_id, author_id, author_role, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ticketId, authorId, authorRole, body]
    );
    if (authorRole === 'admin') {
      await pool.query(
        `UPDATE support_tickets
         SET status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
             updated_at = NOW()
         WHERE id = $1`,
        [ticketId]
      );
    } else {
      await pool.query(`UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`, [
        ticketId,
      ]);
    }
    return mapMessage(result.rows[0] as Record<string, unknown>);
  },

  async listAdminTickets(status?: string): Promise<SupportTicket[]> {
    const pool = getPool();
    if (!pool) return [];
    const params: unknown[] = [];
    let sql = `SELECT t.*,
              (SELECT LEFT(m.body, 120) FROM support_ticket_messages m
               WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS latest_preview
       FROM support_tickets t`;
    if (status) {
      params.push(status);
      sql += ` WHERE t.status = $1`;
    }
    sql += ` ORDER BY t.created_at DESC LIMIT 200`;
    const result = await pool.query(sql, params);
    return result.rows.map((r) => mapTicket(r as Record<string, unknown>));
  },

  async updateAdminTicket(
    ticketId: string,
    input: { status?: string; priority?: string; assignedAdminId?: string }
  ): Promise<SupportTicket | null> {
    const pool = getPool();
    if (!pool) return null;
    const sets: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [ticketId];
    if (input.status) {
      params.push(input.status);
      sets.push(`status = $${params.length}`);
      if (input.status === 'resolved' || input.status === 'closed') {
        sets.push(`resolved_at = COALESCE(resolved_at, NOW())`);
      }
    }
    if (input.priority) {
      params.push(input.priority);
      sets.push(`priority = $${params.length}`);
    }
    if (input.assignedAdminId) {
      params.push(input.assignedAdminId);
      sets.push(`assigned_admin_id = $${params.length}`);
    }
    const result = await pool.query(
      `UPDATE support_tickets SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );
    if (!result.rows[0]) return null;
    return mapTicket(result.rows[0] as Record<string, unknown>);
  },

  async writeAuditLog(input: {
    actorId?: string | null;
    actorRole?: string | null;
    action: string;
    targetType?: string;
    targetId?: string;
    meta?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `INSERT INTO admin_audit_logs (
         actor_id, actor_role, action, target_type, target_id, meta, ip_address, user_agent
       ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)`,
      [
        input.actorId ?? null,
        input.actorRole ?? null,
        input.action,
        input.targetType ?? null,
        input.targetId ?? null,
        JSON.stringify(input.meta ?? {}),
        input.ipAddress ?? null,
        input.userAgent ?? null,
      ]
    );
  },

  async listAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT $1`,
      [Math.min(limit, 500)]
    );
    return result.rows.map((r) => ({
      id: String(r.id),
      actorId: r.actor_id ? String(r.actor_id) : null,
      actorRole: r.actor_role ? String(r.actor_role) : null,
      action: String(r.action),
      targetType: r.target_type ? String(r.target_type) : null,
      targetId: r.target_id ? String(r.target_id) : null,
      meta: (r.meta as Record<string, unknown>) ?? {},
      ipAddress: r.ip_address ? String(r.ip_address) : null,
      createdAt: String(r.created_at),
    }));
  },

  async recordLoginEvent(input: {
    userId?: string | null;
    email?: string | null;
    success: boolean;
    failureReason?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `INSERT INTO auth_login_events (
         user_id, email, success, failure_reason, ip_address, user_agent
       ) VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        input.userId ?? null,
        input.email ?? null,
        input.success,
        input.failureReason ?? null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
      ]
    );
  },

  /** Null IP/UA on old consent rows; keep type/version/agreed for audit. */
  async scrubConsentIpMetaOlderThan(ttlDays: number): Promise<number> {
    const pool = getPool();
    if (!pool || ttlDays < 1) return 0;
    const result = await pool.query(
      `UPDATE user_consents
       SET ip_address = NULL,
           user_agent = NULL
       WHERE agreed_at < NOW() - ($1::text || ' days')::interval
         AND (ip_address IS NOT NULL OR user_agent IS NOT NULL)`,
      [String(ttlDays)]
    );
    return result.rowCount ?? 0;
  },

  async deleteLoginEventsOlderThan(ttlDays: number): Promise<number> {
    const pool = getPool();
    if (!pool || ttlDays < 1) return 0;
    const result = await pool.query(
      `DELETE FROM auth_login_events
       WHERE created_at < NOW() - ($1::text || ' days')::interval`,
      [String(ttlDays)]
    );
    return result.rowCount ?? 0;
  },

  async createCommunityReport(input: {
    reporterId: string;
    postId?: string | null;
    commentId?: string | null;
    reason: string;
    description?: string;
  }): Promise<{ id: string }> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query<{ id: string }>(
      `INSERT INTO reports (reporter_id, post_id, comment_id, reason, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        input.reporterId,
        input.postId ?? null,
        input.commentId ?? null,
        input.reason,
        input.description ?? null,
      ]
    );
    return { id: result.rows[0].id };
  },

  async listCommunityReports(): Promise<
    Array<{
      id: string;
      reporterId: string;
      postId?: string | null;
      commentId?: string | null;
      reason: string;
      description?: string | null;
      status: string;
      createdAt: string;
    }>
  > {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT id, reporter_id, post_id, comment_id, reason, description, status, created_at
       FROM reports ORDER BY created_at DESC LIMIT 200`
    );
    return result.rows.map((r) => ({
      id: String(r.id),
      reporterId: String(r.reporter_id),
      postId: r.post_id ? String(r.post_id) : null,
      commentId: r.comment_id ? String(r.comment_id) : null,
      reason: String(r.reason),
      description: r.description ? String(r.description) : null,
      status: String(r.status),
      createdAt: String(r.created_at),
    }));
  },

  async resolveCommunityReport(
    reportId: string,
    status: string,
    adminId: string,
    hidePost?: boolean
  ): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const result = await pool.query(
      `UPDATE reports
       SET status = $2, resolved_by = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING post_id`,
      [reportId, status, adminId]
    );
    if ((result.rowCount ?? 0) === 0) return false;
    const postId = result.rows[0]?.post_id;
    if (hidePost && postId) {
      await pool.query(`UPDATE posts SET is_hidden = TRUE, updated_at = NOW() WHERE id = $1`, [
        postId,
      ]);
    }
    return true;
  },

  async createSanction(input: {
    userId: string;
    sanctionType: string;
    reason?: string;
    createdBy?: string;
    endsAt?: string | null;
  }): Promise<{ id: string }> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query<{ id: string }>(
      `INSERT INTO user_sanctions (user_id, sanction_type, reason, created_by, ends_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        input.userId,
        input.sanctionType,
        input.reason ?? null,
        input.createdBy ?? null,
        input.endsAt ?? null,
      ]
    );
    return { id: result.rows[0].id };
  },

  async getOverview(): Promise<ComplianceOverview> {
    const pool = getPool();
    if (!pool) {
      return {
        pendingSupportTickets: 0,
        pendingCommunityReports: 0,
        marketingOptInUsers: 0,
        locationOptInUsers: 0,
        activeLegalDocuments: 0,
        recentLoginFailures: 0,
        pendingPrivacyRightsRequests: 0,
      };
    }
    const q = async (sql: string) => {
      const r = await pool.query<{ count: string }>(sql);
      return parseInt(r.rows[0]?.count ?? '0', 10);
    };
    return {
      pendingSupportTickets: await q(
        `SELECT COUNT(*)::text AS count FROM support_tickets WHERE status IN ('open','in_progress')`
      ),
      pendingCommunityReports: await q(
        `SELECT COUNT(*)::text AS count FROM reports WHERE status = 'pending'`
      ),
      marketingOptInUsers: await q(
        `SELECT COUNT(*)::text AS count FROM users WHERE is_active AND marketing_opt_in`
      ),
      locationOptInUsers: await q(
        `SELECT COUNT(*)::text AS count FROM users WHERE is_active AND location_opt_in`
      ),
      activeLegalDocuments: await q(
        `SELECT COUNT(*)::text AS count FROM legal_documents WHERE is_active`
      ),
      recentLoginFailures: await q(
        `SELECT COUNT(*)::text AS count FROM auth_login_events
         WHERE success = FALSE AND created_at > NOW() - INTERVAL '24 hours'`
      ),
      pendingPrivacyRightsRequests: await q(
        `SELECT COUNT(*)::text AS count FROM privacy_rights_requests
         WHERE status IN ('received','reviewing')`
      ).catch(() => 0),
    };
  },

  async adminSearchConsents(userId?: string, limit = 100) {
    const pool = getPool();
    if (!pool) return [];
    if (userId) {
      return this.listConsents(userId);
    }
    const result = await pool.query(
      `SELECT c.id, c.user_id, c.consent_type, c.version, c.agreed, c.agreed_at,
              c.region_code, c.source
       FROM user_consents c
       ORDER BY c.agreed_at DESC
       LIMIT $1`,
      [Math.min(limit, 500)]
    );
    return result.rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      email: '',
      consentType: String(r.consent_type),
      version: String(r.version),
      agreed: Boolean(r.agreed),
      agreedAt: String(r.agreed_at),
      regionCode: r.region_code ? String(r.region_code) : undefined,
      source: r.source ? String(r.source) : undefined,
    }));
  },
};
