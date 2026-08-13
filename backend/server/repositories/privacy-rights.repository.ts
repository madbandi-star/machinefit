import {
  PRIVACY_DELETION_INVENTORY,
  computePrivacyRightsDueAt,
  privacyRightsDueState,
  type CreatePrivacyRightsRequestInput,
  type PrivacyRightsRequest,
  type PrivacyRightsRequestStatus,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

function mapRow(row: Record<string, unknown>): PrivacyRightsRequest {
  const status = String(row.status) as PrivacyRightsRequestStatus;
  const dueAt = String(row.due_at);
  return {
    id: String(row.id),
    userId: String(row.user_id),
    requestType: String(row.request_type),
    status,
    subject: String(row.subject ?? ''),
    detail: row.detail != null ? String(row.detail) : null,
    payload:
      row.payload && typeof row.payload === 'object'
        ? (row.payload as Record<string, unknown>)
        : {},
    resultMessage: row.result_message != null ? String(row.result_message) : null,
    rejectionReason:
      row.rejection_reason != null ? String(row.rejection_reason) : null,
    dueAt,
    dueState: privacyRightsDueState(dueAt, status),
    processedAt: row.processed_at != null ? String(row.processed_at) : null,
    processedBy: row.processed_by != null ? String(row.processed_by) : null,
    processorEmail: null,
    requesterEmail: null,
    requesterDisplayName:
      row.requester_display_name != null
        ? String(row.requester_display_name)
        : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const DEFAULT_SUBJECTS: Record<string, string> = {
  access: '개인정보 열람 요청',
  correction: '개인정보 정정 요청',
  deletion: '개인정보 삭제 요청',
  processing_stop: '개인정보 처리정지 요청',
  consent_withdraw: '동의 철회 요청',
};

export const privacyRightsRepository = {
  getProcessingPurposes() {
    return {
      purposes: [
        {
          key: 'account',
          titleKey: 'compliance.rights.purposeAccount',
          retentionKey: 'compliance.rights.retentionAccount',
          required: true,
        },
        {
          key: 'workout',
          titleKey: 'compliance.rights.purposeWorkout',
          retentionKey: 'compliance.rights.retentionWorkout',
          required: true,
        },
        {
          key: 'body_metrics',
          titleKey: 'compliance.rights.purposeBody',
          retentionKey: 'compliance.rights.retentionBody',
          required: false,
        },
        {
          key: 'birth_profile',
          titleKey: 'compliance.rights.purposeBirth',
          retentionKey: 'compliance.rights.retentionBirth',
          required: false,
        },
        {
          key: 'location',
          titleKey: 'compliance.rights.purposeLocation',
          retentionKey: 'compliance.rights.retentionLocation',
          required: false,
        },
        {
          key: 'marketing',
          titleKey: 'compliance.rights.purposeMarketing',
          retentionKey: 'compliance.rights.retentionMarketing',
          required: false,
        },
        {
          key: 'payment',
          titleKey: 'compliance.rights.purposePayment',
          retentionKey: 'compliance.rights.retentionPayment',
          required: true,
        },
      ],
      deletionInventory: {
        deletable: [...PRIVACY_DELETION_INVENTORY.deletable],
        retained: [...PRIVACY_DELETION_INVENTORY.retained],
      },
    };
  },

  async listForUser(userId: string): Promise<PrivacyRightsRequest[]> {
    const pool = getPool();
    if (!pool) return [];
    const { rows } = await pool.query(
      `SELECT r.*,
              u.email AS requester_email,
              u.display_name AS requester_display_name,
              p.email AS processor_email
       FROM privacy_rights_requests r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN users p ON p.id = r.processed_by
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [userId]
    );
    return rows.map((r: Record<string, unknown>) => mapRow(r));
  },

  async getForUser(
    requestId: string,
    userId: string
  ): Promise<PrivacyRightsRequest | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query(
      `SELECT r.*,
              u.email AS requester_email,
              u.display_name AS requester_display_name,
              p.email AS processor_email
       FROM privacy_rights_requests r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN users p ON p.id = r.processed_by
       WHERE r.id = $1 AND r.user_id = $2`,
      [requestId, userId]
    );
    const row = rows[0];
    return row ? mapRow(row as Record<string, unknown>) : null;
  },

  async getById(requestId: string): Promise<PrivacyRightsRequest | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query(
      `SELECT r.*,
              u.email AS requester_email,
              u.display_name AS requester_display_name,
              p.email AS processor_email
       FROM privacy_rights_requests r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN users p ON p.id = r.processed_by
       WHERE r.id = $1`,
      [requestId]
    );
    const row = rows[0];
    return row ? mapRow(row as Record<string, unknown>) : null;
  },

  async listAdmin(filters?: {
    status?: string;
    requestType?: string;
    limit?: number;
  }): Promise<PrivacyRightsRequest[]> {
    const pool = getPool();
    if (!pool) return [];
    const params: unknown[] = [];
    const where: string[] = [];
    if (filters?.status) {
      params.push(filters.status);
      where.push(`r.status = $${params.length}`);
    }
    if (filters?.requestType) {
      params.push(filters.requestType);
      where.push(`r.request_type = $${params.length}`);
    }
    params.push(filters?.limit ?? 100);
    const { rows } = await pool.query(
      `SELECT r.*,
              u.email AS requester_email,
              u.display_name AS requester_display_name,
              p.email AS processor_email
       FROM privacy_rights_requests r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN users p ON p.id = r.processed_by
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY
         CASE WHEN r.status IN ('received', 'reviewing') THEN 0 ELSE 1 END,
         r.due_at ASC,
         r.created_at DESC
       LIMIT $${params.length}`,
      params
    );
    return rows.map((r: Record<string, unknown>) => mapRow(r));
  },

  async countPending(): Promise<number> {
    const pool = getPool();
    if (!pool) return 0;
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM privacy_rights_requests
       WHERE status IN ('received', 'reviewing')`
    );
    return parseInt(rows[0]?.count ?? '0', 10);
  },

  async create(
    userId: string,
    input: CreatePrivacyRightsRequestInput,
    extras?: {
      status?: PrivacyRightsRequestStatus;
      resultMessage?: string;
      payload?: Record<string, unknown>;
    }
  ): Promise<PrivacyRightsRequest> {
    const pool = getPool();
    if (!pool) throw new Error('Database unavailable');
    const dueAt = computePrivacyRightsDueAt();
    const payload = {
      fieldKey: input.fieldKey,
      currentValue: input.currentValue,
      requestedValue: input.requestedValue,
      consentTarget: input.consentTarget,
      acknowledgedInventory: input.acknowledgedInventory,
      confirmed: input.confirmed,
      ...(extras?.payload ?? {}),
    };
    const subject =
      input.subject?.trim() ||
      DEFAULT_SUBJECTS[input.requestType] ||
      input.requestType;
    const status = extras?.status ?? 'received';
    const { rows } = await pool.query(
      `INSERT INTO privacy_rights_requests (
         user_id, request_type, status, subject, detail, payload, due_at,
         result_message, processed_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6::jsonb, $7,
         $8, CASE WHEN $3 = 'completed' THEN NOW() ELSE NULL END
       )
       RETURNING *`,
      [
        userId,
        input.requestType,
        status,
        subject,
        input.detail ?? null,
        JSON.stringify(payload),
        dueAt.toISOString(),
        extras?.resultMessage ?? null,
      ]
    );
    return mapRow(rows[0] as Record<string, unknown>);
  },

  async updateAdmin(
    requestId: string,
    adminId: string,
    input: {
      status: PrivacyRightsRequestStatus;
      resultMessage?: string;
      rejectionReason?: string;
    }
  ): Promise<PrivacyRightsRequest | null> {
    const pool = getPool();
    if (!pool) return null;
    const done = input.status === 'completed' || input.status === 'rejected';
    const { rows } = await pool.query(
      `UPDATE privacy_rights_requests
       SET status = $2,
           result_message = COALESCE($3, result_message),
           rejection_reason = COALESCE($4, rejection_reason),
           processed_by = $5,
           processed_at = CASE WHEN $6 THEN NOW() ELSE processed_at END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        requestId,
        input.status,
        input.resultMessage ?? null,
        input.rejectionReason ?? null,
        adminId,
        done,
      ]
    );
    const row = rows[0];
    if (!row) return null;
    return this.getById(requestId);
  },

  async deleteByIds(ids: string[]): Promise<number> {
    const pool = getPool();
    if (!pool || ids.length === 0) return 0;
    const { rowCount } = await pool.query(
      `DELETE FROM privacy_rights_requests WHERE id = ANY($1::uuid[])`,
      [ids]
    );
    return rowCount ?? 0;
  },

  async cancelForUser(
    requestId: string,
    userId: string,
    resultMessage: string
  ): Promise<PrivacyRightsRequest | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query(
      `UPDATE privacy_rights_requests
       SET status = 'cancelled',
           result_message = $3,
           processed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
         AND user_id = $2
       RETURNING id`,
      [requestId, userId, resultMessage]
    );
    if (!rows[0]) return null;
    return this.getForUser(requestId, userId);
  },

  async setProcessingSuspended(
    userId: string,
    suspended: boolean,
    note?: string
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    if (suspended) {
      await pool.query(
        `UPDATE users
         SET privacy_processing_suspended_at = COALESCE(privacy_processing_suspended_at, NOW()),
             privacy_processing_suspend_note = COALESCE($2, privacy_processing_suspend_note),
             marketing_opt_in = FALSE,
             event_opt_in = FALSE,
             updated_at = NOW()
         WHERE id = $1`,
        [userId, note ?? null]
      );
    } else {
      await pool.query(
        `UPDATE users
         SET privacy_processing_suspended_at = NULL,
             privacy_processing_suspend_note = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );
    }
  },
};
