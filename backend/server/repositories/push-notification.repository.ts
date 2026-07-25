import type {
  PushAudienceType,
  PushCampaign,
  PushDeliveryLog,
  PushKind,
  RoleCode,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';

export interface CreatePushCampaignInput {
  senderId: string;
  senderRole: RoleCode;
  kind: PushKind;
  title: string;
  body: string;
  imageUrl?: string | null;
  deepLink?: string | null;
  audienceType: PushAudienceType;
  audienceFilter: Record<string, unknown>;
  recipientCount?: number;
  successCount?: number;
}

export interface CreatePushDeliveryLogInput {
  campaignId: string;
  senderId: string;
  senderRole: RoleCode;
  recipientId: string;
  recipientRole?: RoleCode | null;
  title: string;
  body: string;
  success: boolean;
  errorCode?: string | null;
}

const mockCampaigns: PushCampaign[] = [];
const mockDeliveryLogs: PushDeliveryLog[] = [];

function mapCampaign(row: {
  id: string;
  sender_id: string;
  sender_role: string;
  kind: string;
  title: string;
  body: string;
  image_url: string | null;
  deep_link: string | null;
  audience_type: string;
  audience_filter: Record<string, unknown> | string;
  recipient_count: number;
  success_count: number;
  created_at: string | Date;
}): PushCampaign {
  const filter =
    typeof row.audience_filter === 'string'
      ? (JSON.parse(row.audience_filter) as Record<string, unknown>)
      : row.audience_filter ?? {};
  return {
    id: row.id,
    senderId: row.sender_id,
    senderRole: row.sender_role as RoleCode,
    kind: row.kind as PushKind,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    deepLink: row.deep_link,
    audienceType: row.audience_type as PushAudienceType,
    audienceFilter: filter,
    recipientCount: Number(row.recipient_count) || 0,
    successCount: Number(row.success_count) || 0,
    createdAt:
      typeof row.created_at === 'string'
        ? row.created_at
        : row.created_at.toISOString(),
  };
}

function mapLog(row: {
  id: string;
  campaign_id: string;
  sender_id: string;
  sender_role: string;
  recipient_id: string;
  recipient_role: string | null;
  title: string;
  body: string;
  success: boolean;
  error_code: string | null;
  created_at: string | Date;
}): PushDeliveryLog {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    senderId: row.sender_id,
    senderRole: row.sender_role as RoleCode,
    recipientId: row.recipient_id,
    recipientRole: (row.recipient_role as RoleCode | null) ?? undefined,
    title: row.title,
    body: row.body,
    success: row.success,
    errorCode: row.error_code,
    createdAt:
      typeof row.created_at === 'string'
        ? row.created_at
        : row.created_at.toISOString(),
  };
}

/** Test/dev helper — clear in-memory stores. */
export function resetPushNotificationMocks(): void {
  mockCampaigns.length = 0;
  mockDeliveryLogs.length = 0;
}

export const pushNotificationRepository = {
  async createCampaign(input: CreatePushCampaignInput): Promise<PushCampaign> {
    const pool = getPool();
    if (!pool) {
      const campaign: PushCampaign = {
        id: crypto.randomUUID(),
        senderId: input.senderId,
        senderRole: input.senderRole,
        kind: input.kind,
        title: input.title,
        body: input.body,
        imageUrl: input.imageUrl ?? null,
        deepLink: input.deepLink ?? null,
        audienceType: input.audienceType,
        audienceFilter: input.audienceFilter,
        recipientCount: input.recipientCount ?? 0,
        successCount: input.successCount ?? 0,
        createdAt: new Date().toISOString(),
      };
      mockCampaigns.unshift(campaign);
      return campaign;
    }

    const result = await pool.query(
      `INSERT INTO push_campaigns (
         sender_id, sender_role, kind, title, body, image_url, deep_link,
         audience_type, audience_filter, recipient_count, success_count
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
       RETURNING *`,
      [
        input.senderId,
        input.senderRole,
        input.kind,
        input.title,
        input.body,
        input.imageUrl ?? null,
        input.deepLink ?? null,
        input.audienceType,
        JSON.stringify(input.audienceFilter ?? {}),
        input.recipientCount ?? 0,
        input.successCount ?? 0,
      ]
    );
    return mapCampaign(result.rows[0]);
  },

  async updateCampaignCounts(
    campaignId: string,
    recipientCount: number,
    successCount: number
  ): Promise<PushCampaign | null> {
    const pool = getPool();
    if (!pool) {
      const c = mockCampaigns.find((x) => x.id === campaignId);
      if (!c) return null;
      c.recipientCount = recipientCount;
      c.successCount = successCount;
      return c;
    }

    const result = await pool.query(
      `UPDATE push_campaigns
       SET recipient_count = $2, success_count = $3
       WHERE id = $1
       RETURNING *`,
      [campaignId, recipientCount, successCount]
    );
    return result.rows[0] ? mapCampaign(result.rows[0]) : null;
  },

  async createDeliveryLog(input: CreatePushDeliveryLogInput): Promise<PushDeliveryLog> {
    const created = await this.createDeliveryLogs([input]);
    return created[0]!;
  },

  async createDeliveryLogs(
    inputs: CreatePushDeliveryLogInput[]
  ): Promise<PushDeliveryLog[]> {
    if (inputs.length === 0) return [];

    const pool = getPool();
    if (!pool) {
      const logs = inputs.map((input) => {
        const log: PushDeliveryLog = {
          id: crypto.randomUUID(),
          campaignId: input.campaignId,
          senderId: input.senderId,
          senderRole: input.senderRole,
          recipientId: input.recipientId,
          recipientRole: input.recipientRole ?? undefined,
          title: input.title,
          body: input.body,
          success: input.success,
          errorCode: input.errorCode ?? null,
          createdAt: new Date().toISOString(),
        };
        mockDeliveryLogs.unshift(log);
        return log;
      });
      return logs;
    }

    const CHUNK = 200;
    const all: PushDeliveryLog[] = [];
    for (let offset = 0; offset < inputs.length; offset += CHUNK) {
      const chunk = inputs.slice(offset, offset + CHUNK);
      const values: string[] = [];
      const params: unknown[] = [];
      let i = 1;
      for (const input of chunk) {
        values.push(
          `($${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++})`
        );
        params.push(
          input.campaignId,
          input.senderId,
          input.senderRole,
          input.recipientId,
          input.recipientRole ?? null,
          input.title,
          input.body,
          input.success,
          input.errorCode ?? null
        );
      }
      const result = await pool.query(
        `INSERT INTO push_delivery_logs (
           campaign_id, sender_id, sender_role, recipient_id, recipient_role,
           title, body, success, error_code
         ) VALUES ${values.join(',')}
         RETURNING *`,
        params
      );
      all.push(...result.rows.map(mapLog));
    }
    return all;
  },

  async listCampaigns(options: {
    senderId?: string;
    all?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PushCampaign[]> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const pool = getPool();

    if (!pool) {
      let items = [...mockCampaigns];
      if (!options.all && options.senderId) {
        items = items.filter((c) => c.senderId === options.senderId);
      }
      return items.slice(offset, offset + limit);
    }

    if (options.all) {
      const result = await pool.query(
        `SELECT * FROM push_campaigns
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows.map(mapCampaign);
    }

    const result = await pool.query(
      `SELECT * FROM push_campaigns
       WHERE sender_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [options.senderId, limit, offset]
    );
    return result.rows.map(mapCampaign);
  },

  async findCampaignById(campaignId: string): Promise<PushCampaign | null> {
    const pool = getPool();
    if (!pool) {
      return mockCampaigns.find((c) => c.id === campaignId) ?? null;
    }
    const result = await pool.query(`SELECT * FROM push_campaigns WHERE id = $1`, [
      campaignId,
    ]);
    return result.rows[0] ? mapCampaign(result.rows[0]) : null;
  },

  async listDeliveryLogs(
    campaignId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PushDeliveryLog[]> {
    const limit = options?.limit ?? 200;
    const offset = options?.offset ?? 0;
    const pool = getPool();

    if (!pool) {
      return mockDeliveryLogs
        .filter((l) => l.campaignId === campaignId)
        .slice(offset, offset + limit);
    }

    const result = await pool.query(
      `SELECT * FROM push_delivery_logs
       WHERE campaign_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [campaignId, limit, offset]
    );
    return result.rows.map(mapLog);
  },

  async requireCampaignAccess(
    campaignId: string,
    requesterId: string,
    isAdmin: boolean
  ): Promise<PushCampaign> {
    const campaign = await this.findCampaignById(campaignId);
    if (!campaign) throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
    if (!isAdmin && campaign.senderId !== requesterId) {
      throw new AppError(403, 'FORBIDDEN', 'Not allowed to view this campaign');
    }
    return campaign;
  },
};
