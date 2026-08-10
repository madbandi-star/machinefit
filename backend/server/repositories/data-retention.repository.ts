import type {
  DataRetentionRecord,
  DataRetentionSummary,
  DeletionExecutionLog,
  RetentionConsentCatalogItem,
  RetentionPolicy,
  RetentionPolicyCreateInput,
  RetentionPolicyListQuery,
  RetentionPolicyUpdateInput,
  RetentionPolicyVersion,
  RetentionScheduledQuery,
} from '@machinefit/shared';
import { addRetentionPeriod, daysRemainingUntil } from '@machinefit/shared';
import { getPool } from '../config/database.js';

function mapConsent(row: Record<string, unknown>): RetentionConsentCatalogItem {
  return {
    id: String(row.id),
    code: String(row.code),
    nameKo: String(row.name_ko),
    nameEn: String(row.name_en ?? ''),
    consentKind: String(row.consent_kind),
    isRequired: Boolean(row.is_required),
    withdrawable: Boolean(row.withdrawable),
    description: String(row.description ?? ''),
    isActive: Boolean(row.is_active),
  };
}

function mapPolicy(row: Record<string, unknown>): RetentionPolicy {
  const periodValue = Number(row.period_value ?? 0);
  const periodUnit = String(row.period_unit ?? 'day') as RetentionPolicy['periodUnit'];
  const sampleStart = new Date();
  const sampleEnd = addRetentionPeriod(sampleStart, periodValue, periodUnit);
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    description: String(row.description ?? ''),
    dataCategory: String(row.data_category) as RetentionPolicy['dataCategory'],
    tableNames: Array.isArray(row.table_names)
      ? (row.table_names as string[])
      : [],
    retentionReason: String(row.retention_reason) as RetentionPolicy['retentionReason'],
    isLegalHold: Boolean(row.is_legal_hold),
    legalBasisNote: String(row.legal_basis_note ?? ''),
    relatedPolicyDoc: String(row.related_policy_doc ?? ''),
    relatedTermsDoc: String(row.related_terms_doc ?? ''),
    consentCatalogId: row.consent_catalog_id ? String(row.consent_catalog_id) : null,
    consentCode: row.consent_code ? String(row.consent_code) : null,
    consentNameKo: row.consent_name_ko ? String(row.consent_name_ko) : null,
    periodValue,
    periodUnit,
    startBasis: String(row.start_basis) as RetentionPolicy['startBasis'],
    autoDelete: Boolean(row.auto_delete),
    deletionMethod: String(row.deletion_method) as RetentionPolicy['deletionMethod'],
    retryLimit: Number(row.retry_limit ?? 3),
    isActive: Boolean(row.is_active),
    currentVersion: Number(row.current_version ?? 1),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    updatedBy: row.updated_by ? String(row.updated_by) : null,
    sampleScheduledDeletionAt: sampleEnd.toISOString(),
    sampleDaysRemaining: daysRemainingUntil(sampleEnd),
  };
}

function mapRecord(row: Record<string, unknown>): DataRetentionRecord {
  const scheduled = new Date(String(row.scheduled_deletion_at));
  return {
    id: String(row.id),
    policyId: String(row.policy_id),
    policyCode: String(row.policy_code),
    policyName: String(row.policy_name),
    policyVersion: Number(row.policy_version ?? 1),
    subjectType: String(row.subject_type),
    subjectId: String(row.subject_id),
    userId: row.user_id ? String(row.user_id) : null,
    userDisplayName: row.user_display_name ? String(row.user_display_name) : null,
    retentionStartAt: new Date(String(row.retention_start_at)).toISOString(),
    scheduledDeletionAt: scheduled.toISOString(),
    daysRemaining: daysRemainingUntil(scheduled),
    status: String(row.status) as DataRetentionRecord['status'],
    hold: Boolean(row.hold),
    holdReason: String(row.hold_reason ?? ''),
    holdUntil: row.hold_until ? new Date(String(row.hold_until)).toISOString() : null,
    lastError: row.last_error ? String(row.last_error) : null,
    retryCount: Number(row.retry_count ?? 0),
    deletedAt: row.deleted_at ? new Date(String(row.deleted_at)).toISOString() : null,
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

const POLICY_SELECT = `
  SELECT p.*,
         c.code AS consent_code,
         c.name_ko AS consent_name_ko
  FROM retention_policies p
  LEFT JOIN retention_consent_catalog c ON c.id = p.consent_catalog_id
`;

export const dataRetentionRepository = {
  async tableReady(): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const { rows } = await pool.query<{ ok: boolean }>(
      `SELECT to_regclass('public.retention_policies') IS NOT NULL AS ok`
    );
    return Boolean(rows[0]?.ok);
  },

  async summary(): Promise<DataRetentionSummary> {
    const empty: DataRetentionSummary = {
      policyTotal: 0,
      policyActive: 0,
      scheduledTotal: 0,
      dueIn7Days: 0,
      dueIn30Days: 0,
      deleteFailed: 0,
      onHold: 0,
      completed: 0,
      anonymized: 0,
    };
    const pool = getPool();
    if (!pool || !(await this.tableReady())) return empty;

    const [policies, records] = await Promise.all([
      pool.query<{ total: string; active: string }>(
        `SELECT COUNT(*)::text AS total,
                COUNT(*) FILTER (WHERE is_active)::text AS active
         FROM retention_policies`
      ),
      pool.query<{
        scheduled: string;
        d7: string;
        d30: string;
        failed: string;
        hold: string;
        completed: string;
        anonymized: string;
      }>(
        `SELECT
           COUNT(*) FILTER (WHERE status IN ('RETENTION','DELETE_SCHEDULED','DELETE_PENDING'))::text AS scheduled,
           COUNT(*) FILTER (
             WHERE status IN ('RETENTION','DELETE_SCHEDULED','DELETE_PENDING')
               AND hold = FALSE
               AND scheduled_deletion_at <= NOW() + INTERVAL '7 days'
           )::text AS d7,
           COUNT(*) FILTER (
             WHERE status IN ('RETENTION','DELETE_SCHEDULED','DELETE_PENDING')
               AND hold = FALSE
               AND scheduled_deletion_at <= NOW() + INTERVAL '30 days'
           )::text AS d30,
           COUNT(*) FILTER (WHERE status = 'DELETE_FAILED')::text AS failed,
           COUNT(*) FILTER (WHERE hold = TRUE OR status = 'HOLD')::text AS hold,
           COUNT(*) FILTER (WHERE status = 'DELETE_COMPLETED')::text AS completed,
           COUNT(*) FILTER (WHERE status = 'ANONYMIZED')::text AS anonymized
         FROM data_retention_records`
      ),
    ]);

    return {
      policyTotal: Number(policies.rows[0]?.total ?? 0),
      policyActive: Number(policies.rows[0]?.active ?? 0),
      scheduledTotal: Number(records.rows[0]?.scheduled ?? 0),
      dueIn7Days: Number(records.rows[0]?.d7 ?? 0),
      dueIn30Days: Number(records.rows[0]?.d30 ?? 0),
      deleteFailed: Number(records.rows[0]?.failed ?? 0),
      onHold: Number(records.rows[0]?.hold ?? 0),
      completed: Number(records.rows[0]?.completed ?? 0),
      anonymized: Number(records.rows[0]?.anonymized ?? 0),
    };
  },

  async listPolicies(
    query: RetentionPolicyListQuery
  ): Promise<{ items: RetentionPolicy[]; total: number }> {
    const pool = getPool();
    if (!pool || !(await this.tableReady())) return { items: [], total: 0 };
    const where: string[] = ['1=1'];
    const params: unknown[] = [];
    if (query.q?.trim()) {
      params.push(`%${query.q.trim()}%`);
      where.push(
        `(p.name ILIKE $${params.length} OR p.code ILIKE $${params.length} OR p.description ILIKE $${params.length})`
      );
    }
    if (query.dataCategory) {
      params.push(query.dataCategory);
      where.push(`p.data_category = $${params.length}`);
    }
    if (query.retentionReason) {
      params.push(query.retentionReason);
      where.push(`p.retention_reason = $${params.length}`);
    }
    if (query.isActive !== undefined) {
      params.push(query.isActive);
      where.push(`p.is_active = $${params.length}`);
    }
    if (query.autoDelete !== undefined) {
      params.push(query.autoDelete);
      where.push(`p.auto_delete = $${params.length}`);
    }
    const whereSql = where.join(' AND ');
    const countRes = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM retention_policies p WHERE ${whereSql}`,
      params
    );
    const total = Number(countRes.rows[0]?.c ?? 0);
    const limit = query.limit;
    const offset = (query.page - 1) * limit;
    params.push(limit, offset);
    const result = await pool.query(
      `${POLICY_SELECT}
       WHERE ${whereSql}
       ORDER BY p.data_category ASC, p.name ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { items: result.rows.map(mapPolicy), total };
  },

  async getPolicy(id: string): Promise<RetentionPolicy | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query(`${POLICY_SELECT} WHERE p.id = $1`, [id]);
    return result.rows[0] ? mapPolicy(result.rows[0]) : null;
  },

  async getPolicyByCode(code: string): Promise<RetentionPolicy | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query(`${POLICY_SELECT} WHERE p.code = $1`, [code]);
    return result.rows[0] ? mapPolicy(result.rows[0]) : null;
  },

  async listPolicyVersions(policyId: string): Promise<RetentionPolicyVersion[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT * FROM retention_policy_versions
       WHERE policy_id = $1
       ORDER BY version DESC`,
      [policyId]
    );
    return result.rows.map((row) => ({
      id: String(row.id),
      policyId: String(row.policy_id),
      version: Number(row.version),
      snapshot: (row.snapshot ?? {}) as Record<string, unknown>,
      changeReason: String(row.change_reason ?? ''),
      effectiveFrom: new Date(String(row.effective_from)).toISOString(),
      effectiveTo: row.effective_to
        ? new Date(String(row.effective_to)).toISOString()
        : null,
      createdBy: row.created_by ? String(row.created_by) : null,
      createdAt: new Date(String(row.created_at)).toISOString(),
    }));
  },

  async createPolicy(
    input: RetentionPolicyCreateInput,
    actorId: string | null
  ): Promise<RetentionPolicy> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query(
      `INSERT INTO retention_policies (
         code, name, description, data_category, table_names, retention_reason,
         is_legal_hold, legal_basis_note, related_policy_doc, related_terms_doc,
         consent_catalog_id, period_value, period_unit, start_basis,
         auto_delete, deletion_method, retry_limit, is_active,
         created_by, updated_by
       ) VALUES (
         $1,$2,$3,$4,$5::text[],$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$19
       ) RETURNING id`,
      [
        input.code,
        input.name,
        input.description ?? '',
        input.dataCategory,
        input.tableNames ?? [],
        input.retentionReason ?? 'operations',
        Boolean(input.isLegalHold),
        input.legalBasisNote ?? '',
        input.relatedPolicyDoc ?? '',
        input.relatedTermsDoc ?? '',
        input.consentCatalogId ?? null,
        input.periodValue,
        input.periodUnit,
        input.startBasis,
        input.autoDelete ?? true,
        input.deletionMethod ?? 'hard_delete',
        input.retryLimit ?? 3,
        input.isActive ?? true,
        actorId,
      ]
    );
    const id = String(result.rows[0].id);
    await pool.query(
      `INSERT INTO retention_policy_versions (policy_id, version, snapshot, change_reason, created_by)
       SELECT id, current_version, to_jsonb(retention_policies) - 'id', $2, $3
       FROM retention_policies WHERE id = $1`,
      [id, input.changeReason ?? 'create', actorId]
    );
    const created = await this.getPolicy(id);
    if (!created) throw new Error('Failed to load policy');
    return created;
  },

  async updatePolicy(
    id: string,
    input: RetentionPolicyUpdateInput,
    actorId: string | null
  ): Promise<RetentionPolicy | null> {
    const pool = getPool();
    if (!pool) return null;
    const current = await this.getPolicy(id);
    if (!current) return null;

    const next = {
      name: input.name ?? current.name,
      description: input.description ?? current.description,
      dataCategory: input.dataCategory ?? current.dataCategory,
      tableNames: input.tableNames ?? current.tableNames,
      retentionReason: input.retentionReason ?? current.retentionReason,
      isLegalHold: input.isLegalHold ?? current.isLegalHold,
      legalBasisNote: input.legalBasisNote ?? current.legalBasisNote,
      relatedPolicyDoc: input.relatedPolicyDoc ?? current.relatedPolicyDoc,
      relatedTermsDoc: input.relatedTermsDoc ?? current.relatedTermsDoc,
      consentCatalogId:
        input.consentCatalogId !== undefined
          ? input.consentCatalogId
          : current.consentCatalogId,
      periodValue: input.periodValue ?? current.periodValue,
      periodUnit: input.periodUnit ?? current.periodUnit,
      startBasis: input.startBasis ?? current.startBasis,
      autoDelete: input.autoDelete ?? current.autoDelete,
      deletionMethod: input.deletionMethod ?? current.deletionMethod,
      retryLimit: input.retryLimit ?? current.retryLimit,
      isActive: input.isActive ?? current.isActive,
    };

    await pool.query('BEGIN');
    try {
      await pool.query(
        `UPDATE retention_policy_versions
         SET effective_to = NOW()
         WHERE policy_id = $1 AND effective_to IS NULL`,
        [id]
      );
      const version = current.currentVersion + 1;
      await pool.query(
        `UPDATE retention_policies SET
           name = $2, description = $3, data_category = $4, table_names = $5::text[],
           retention_reason = $6, is_legal_hold = $7, legal_basis_note = $8,
           related_policy_doc = $9, related_terms_doc = $10, consent_catalog_id = $11,
           period_value = $12, period_unit = $13, start_basis = $14,
           auto_delete = $15, deletion_method = $16, retry_limit = $17,
           is_active = $18, current_version = $19, updated_by = $20, updated_at = NOW()
         WHERE id = $1`,
        [
          id,
          next.name,
          next.description,
          next.dataCategory,
          next.tableNames,
          next.retentionReason,
          next.isLegalHold,
          next.legalBasisNote,
          next.relatedPolicyDoc,
          next.relatedTermsDoc,
          next.consentCatalogId,
          next.periodValue,
          next.periodUnit,
          next.startBasis,
          next.autoDelete,
          next.deletionMethod,
          next.retryLimit,
          next.isActive,
          version,
          actorId,
        ]
      );
      await pool.query(
        `INSERT INTO retention_policy_versions (policy_id, version, snapshot, change_reason, created_by)
         SELECT id, current_version, to_jsonb(retention_policies) - 'id', $2, $3
         FROM retention_policies WHERE id = $1`,
        [id, input.changeReason, actorId]
      );
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
    return this.getPolicy(id);
  },

  async listScheduled(
    query: RetentionScheduledQuery
  ): Promise<{ items: DataRetentionRecord[]; total: number }> {
    const pool = getPool();
    if (!pool || !(await this.tableReady())) return { items: [], total: 0 };
    const where: string[] = [
      `r.status IN ('RETENTION','DELETE_SCHEDULED','DELETE_PENDING','DELETE_FAILED','HOLD')`,
    ];
    const params: unknown[] = [];
    if (query.policyCode) {
      params.push(query.policyCode);
      where.push(`p.code = $${params.length}`);
    }
    if (query.status) {
      params.push(query.status);
      where.push(`r.status = $${params.length}`);
    }
    if (query.hold !== undefined) {
      params.push(query.hold);
      where.push(`r.hold = $${params.length}`);
    }
    if (query.window === 'today') {
      where.push(`r.scheduled_deletion_at::date = CURRENT_DATE`);
    } else if (query.window === '7d') {
      where.push(`r.scheduled_deletion_at <= NOW() + INTERVAL '7 days'`);
    } else if (query.window === '30d') {
      where.push(`r.scheduled_deletion_at <= NOW() + INTERVAL '30 days'`);
    } else if (query.window === '90d') {
      where.push(`r.scheduled_deletion_at <= NOW() + INTERVAL '90 days'`);
    }
    const whereSql = where.join(' AND ');
    const countRes = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM data_retention_records r
       JOIN retention_policies p ON p.id = r.policy_id
       WHERE ${whereSql}`,
      params
    );
    const total = Number(countRes.rows[0]?.c ?? 0);
    params.push(query.limit, (query.page - 1) * query.limit);
    const result = await pool.query(
      `SELECT r.*, p.code AS policy_code, p.name AS policy_name,
              u.display_name AS user_display_name
       FROM data_retention_records r
       JOIN retention_policies p ON p.id = r.policy_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE ${whereSql}
       ORDER BY r.scheduled_deletion_at ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { items: result.rows.map(mapRecord), total };
  },

  async listDeletionLogs(limit = 50): Promise<DeletionExecutionLog[]> {
    const pool = getPool();
    if (!pool || !(await this.tableReady())) return [];
    const result = await pool.query(
      `SELECT l.*, p.code AS policy_code
       FROM deletion_execution_logs l
       LEFT JOIN retention_policies p ON p.id = l.policy_id
       ORDER BY l.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: String(row.id),
      recordId: row.record_id ? String(row.record_id) : null,
      policyId: row.policy_id ? String(row.policy_id) : null,
      policyCode: row.policy_code ? String(row.policy_code) : null,
      action: String(row.action),
      success: Boolean(row.success),
      rowsAffected: Number(row.rows_affected ?? 0),
      errorMessage: row.error_message ? String(row.error_message) : null,
      actorId: row.actor_id ? String(row.actor_id) : null,
      createdAt: new Date(String(row.created_at)).toISOString(),
    }));
  },

  async listConsentCatalog(): Promise<RetentionConsentCatalogItem[]> {
    const pool = getPool();
    if (!pool || !(await this.tableReady())) return [];
    const result = await pool.query(
      `SELECT * FROM retention_consent_catalog WHERE is_active = TRUE ORDER BY name_ko ASC`
    );
    return result.rows.map(mapConsent);
  },

  async createConsentCatalogItem(input: {
    code: string;
    nameKo: string;
    nameEn?: string;
    consentKind: string;
    isRequired?: boolean;
    withdrawable?: boolean;
    description?: string;
  }): Promise<RetentionConsentCatalogItem> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query(
      `INSERT INTO retention_consent_catalog (
         code, name_ko, name_en, consent_kind, is_required, withdrawable, description
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        input.code,
        input.nameKo,
        input.nameEn ?? '',
        input.consentKind,
        Boolean(input.isRequired),
        input.withdrawable ?? true,
        input.description ?? '',
      ]
    );
    return mapConsent(result.rows[0]);
  },

  async upsertWithdrawnUserRecords(): Promise<number> {
    const pool = getPool();
    if (!pool || !(await this.tableReady())) return 0;
    const policy = await this.getPolicyByCode('deactivated_account_purge');
    if (!policy || !policy.isActive) return 0;

    const users = await pool.query<{ id: string; deactivated_at: Date }>(
      `SELECT id, deactivated_at
       FROM users
       WHERE is_active = FALSE
         AND deactivated_at IS NOT NULL
         AND data_purged_at IS NULL`
    );

    let upserted = 0;
    for (const u of users.rows) {
      const start = new Date(u.deactivated_at);
      const scheduled = addRetentionPeriod(start, policy.periodValue, policy.periodUnit);
      const status =
        scheduled.getTime() <= Date.now() ? 'DELETE_SCHEDULED' : 'RETENTION';
      await pool.query(
        `INSERT INTO data_retention_records (
           policy_id, policy_version, subject_type, subject_id, user_id,
           retention_start_at, scheduled_deletion_at, status
         ) VALUES ($1,$2,'user',$3,$3,$4,$5,$6)
         ON CONFLICT (policy_id, subject_type, subject_id)
         DO UPDATE SET
           scheduled_deletion_at = EXCLUDED.scheduled_deletion_at,
           retention_start_at = EXCLUDED.retention_start_at,
           policy_version = EXCLUDED.policy_version,
           status = CASE
             WHEN data_retention_records.status IN ('DELETE_COMPLETED','ANONYMIZED','EXEMPTED')
               THEN data_retention_records.status
             WHEN data_retention_records.hold THEN 'HOLD'
             ELSE EXCLUDED.status
           END,
           updated_at = NOW()`,
        [policy.id, policy.currentVersion, u.id, start.toISOString(), scheduled.toISOString(), status]
      );
      upserted += 1;
    }
    return upserted;
  },

  async markRecordStatus(
    id: string,
    status: string,
    patch?: { lastError?: string | null; deletedAt?: Date | null; retryCount?: number }
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE data_retention_records SET
         status = $2,
         last_error = COALESCE($3, last_error),
         deleted_at = COALESCE($4, deleted_at),
         retry_count = COALESCE($5, retry_count),
         updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        status,
        patch?.lastError ?? null,
        patch?.deletedAt ?? null,
        patch?.retryCount ?? null,
      ]
    );
  },

  async setHold(
    id: string,
    input: { hold: boolean; holdReason: string; holdUntil?: string | null; holdBy: string | null }
  ): Promise<DataRetentionRecord | null> {
    const pool = getPool();
    if (!pool) return null;
    await pool.query(
      `UPDATE data_retention_records SET
         hold = $2,
         hold_reason = $3,
         hold_until = $4::timestamptz,
         hold_by = $5,
         status = CASE WHEN $2 THEN 'HOLD' ELSE
           CASE WHEN scheduled_deletion_at <= NOW() THEN 'DELETE_SCHEDULED' ELSE 'RETENTION' END
         END,
         updated_at = NOW()
       WHERE id = $1`,
      [id, input.hold, input.holdReason, input.holdUntil ?? null, input.holdBy]
    );
    const result = await pool.query(
      `SELECT r.*, p.code AS policy_code, p.name AS policy_name,
              u.display_name AS user_display_name
       FROM data_retention_records r
       JOIN retention_policies p ON p.id = r.policy_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0] ? mapRecord(result.rows[0]) : null;
  },

  async insertDeletionLog(input: {
    recordId?: string | null;
    policyId?: string | null;
    jobBatchId?: string | null;
    action: string;
    success: boolean;
    rowsAffected?: number;
    errorMessage?: string | null;
    actorId?: string | null;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `INSERT INTO deletion_execution_logs (
         record_id, policy_id, job_batch_id, action, success, rows_affected,
         error_message, actor_id, meta
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
      [
        input.recordId ?? null,
        input.policyId ?? null,
        input.jobBatchId ?? null,
        input.action,
        input.success,
        input.rowsAffected ?? 0,
        input.errorMessage ?? null,
        input.actorId ?? null,
        JSON.stringify(input.meta ?? {}),
      ]
    );
  },

  async countOpenRecordsForPolicy(policyId: string): Promise<number> {
    const pool = getPool();
    if (!pool) return 0;
    const result = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM data_retention_records
       WHERE policy_id = $1
         AND status IN ('RETENTION','DELETE_SCHEDULED','DELETE_PENDING','HOLD','DELETE_FAILED')`,
      [policyId]
    );
    return Number(result.rows[0]?.c ?? 0);
  },

  async previewPeriodChangeImpact(
    policyId: string,
    periodValue: number,
    periodUnit: RetentionPolicy['periodUnit']
  ): Promise<{
    affectedRecords: number;
    scheduleChanged: number;
    sample: Array<{ recordId: string; subjectId: string; before: string; after: string }>;
  }> {
    const pool = getPool();
    if (!pool) {
      return { affectedRecords: 0, scheduleChanged: 0, sample: [] };
    }
    const result = await pool.query<{
      id: string;
      subject_id: string;
      retention_start_at: Date;
      scheduled_deletion_at: Date;
    }>(
      `SELECT id, subject_id, retention_start_at, scheduled_deletion_at
       FROM data_retention_records
       WHERE policy_id = $1
         AND status IN ('RETENTION','DELETE_SCHEDULED','DELETE_PENDING','HOLD','DELETE_FAILED')
       ORDER BY scheduled_deletion_at ASC
       LIMIT 500`,
      [policyId]
    );
    const sample: Array<{
      recordId: string;
      subjectId: string;
      before: string;
      after: string;
    }> = [];
    let scheduleChanged = 0;
    for (const row of result.rows) {
      const after = addRetentionPeriod(
        new Date(row.retention_start_at),
        periodValue,
        periodUnit
      );
      const beforeIso = new Date(row.scheduled_deletion_at).toISOString();
      const afterIso = after.toISOString();
      if (beforeIso !== afterIso) scheduleChanged += 1;
      if (sample.length < 8) {
        sample.push({
          recordId: String(row.id),
          subjectId: String(row.subject_id),
          before: beforeIso,
          after: afterIso,
        });
      }
    }
    const affectedRecords = await this.countOpenRecordsForPolicy(policyId);
    return { affectedRecords, scheduleChanged, sample };
  },

  async rescheduleOpenRecordsForPolicy(
    policyId: string,
    periodValue: number,
    periodUnit: RetentionPolicy['periodUnit']
  ): Promise<number> {
    const pool = getPool();
    if (!pool) return 0;
    const result = await pool.query<{ id: string; retention_start_at: Date }>(
      `SELECT id, retention_start_at FROM data_retention_records
       WHERE policy_id = $1
         AND hold = FALSE
         AND status IN ('RETENTION','DELETE_SCHEDULED','DELETE_PENDING','DELETE_FAILED')`,
      [policyId]
    );
    let updated = 0;
    for (const row of result.rows) {
      const scheduled = addRetentionPeriod(
        new Date(row.retention_start_at),
        periodValue,
        periodUnit
      );
      const status =
        scheduled.getTime() <= Date.now() ? 'DELETE_SCHEDULED' : 'RETENTION';
      await pool.query(
        `UPDATE data_retention_records
         SET scheduled_deletion_at = $2,
             status = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [row.id, scheduled.toISOString(), status]
      );
      updated += 1;
    }
    return updated;
  },

  async findRecordByPolicyAndSubject(
    policyCode: string,
    subjectId: string
  ): Promise<{ id: string; policyId: string } | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{ id: string; policy_id: string }>(
      `SELECT r.id, r.policy_id
       FROM data_retention_records r
       JOIN retention_policies p ON p.id = r.policy_id
       WHERE p.code = $1 AND r.subject_type = 'user' AND r.subject_id = $2
       LIMIT 1`,
      [policyCode, subjectId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return { id: String(row.id), policyId: String(row.policy_id) };
  },

  /** Operational days for a code — falls back to null when missing/inactive. */
  async getActivePeriodDays(code: string): Promise<number | null> {
    const policy = await this.getPolicyByCode(code);
    if (!policy || !policy.isActive) return null;
    if (policy.periodUnit === 'day') return policy.periodValue;
    if (policy.periodUnit === 'month') return policy.periodValue * 30;
    return policy.periodValue * 365;
  },
};
