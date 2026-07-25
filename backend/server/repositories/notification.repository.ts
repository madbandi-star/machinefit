import type { Notification, NotificationType } from '@machinefit/shared';
import type { LocalizedString } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import {
  mockNotifications,
  createMockNotification,
  getUserNotifications,
  getUnreadCount,
} from '../data/notification.mock.js';
import { AppError } from '../middlewares/error.middleware.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';

export const notificationRepository = {
  async list(userId: string, page = 1, limit = 20) {
    const pool = getPool();
    if (!pool) {
      const items = getUserNotifications(userId);
      const start = (page - 1) * limit;
      return {
        items: items.slice(start, start + limit),
        meta: buildPaginationMeta(page, limit, items.length),
      };
    }

    const countPromise = pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM notifications WHERE user_id = $1',
      [userId]
    );
    const resultPromise = pool.query(
      `SELECT id, user_id, type, title, body, payload, is_read, created_at, updated_at
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, (page - 1) * limit]
    );
    const [count, result] = await Promise.all([countPromise, resultPromise]);
    const total = parseInt(count.rows[0]?.count ?? '0', 10);

    const items: Notification[] = result.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      title: r.title,
      body: r.body,
      payload: r.payload,
      isRead: r.is_read,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async unreadCount(userId: string): Promise<number> {
    const pool = getPool();
    if (!pool) return getUnreadCount(userId);

    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  },

  async markRead(userId: string, notificationId: string): Promise<void> {
    const pool = getPool();
    if (!pool) {
      const n = mockNotifications.find((x) => x.id === notificationId && x.userId === userId);
      if (!n) throw new AppError(404, 'NOT_FOUND', 'Notification not found');
      n.isRead = true;
      n.updatedAt = new Date().toISOString();
      return;
    }

    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Notification not found');
  },

  async markAllRead(userId: string): Promise<number> {
    const pool = getPool();
    if (!pool) {
      let count = 0;
      for (const n of mockNotifications) {
        if (n.userId === userId && !n.isRead) {
          n.isRead = true;
          n.updatedAt = new Date().toISOString();
          count++;
        }
      }
      return count;
    }

    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE RETURNING id',
      [userId]
    );
    return result.rowCount ?? 0;
  },

  async create(
    userId: string,
    type: NotificationType,
    title: LocalizedString,
    body?: LocalizedString,
    payload?: Record<string, unknown>
  ): Promise<Notification> {
    const pool = getPool();
    if (!pool) {
      return createMockNotification(userId, type, title, body, payload);
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, payload)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, type, JSON.stringify(title), body ? JSON.stringify(body) : null, payload ? JSON.stringify(payload) : null]
    );
    const r = result.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      type: r.type,
      title: r.title,
      body: r.body,
      payload: r.payload,
      isRead: r.is_read,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  /**
   * Bulk insert for campaign fan-out. One round-trip instead of N sequential inserts
   * (admin all_users was timing out the 15s browser client).
   */
  async createMany(
    rows: Array<{
      userId: string;
      type: NotificationType;
      title: LocalizedString;
      body?: LocalizedString;
      payload?: Record<string, unknown>;
    }>
  ): Promise<number> {
    if (rows.length === 0) return 0;

    const pool = getPool();
    if (!pool) {
      for (const row of rows) {
        createMockNotification(row.userId, row.type, row.title, row.body, row.payload);
      }
      return rows.length;
    }

    const CHUNK = 200;
    let inserted = 0;
    for (let offset = 0; offset < rows.length; offset += CHUNK) {
      const chunk = rows.slice(offset, offset + CHUNK);
      const values: string[] = [];
      const params: unknown[] = [];
      let i = 1;
      for (const row of chunk) {
        values.push(`($${i++},$${i++},$${i++}::jsonb,$${i++}::jsonb,$${i++}::jsonb)`);
        params.push(
          row.userId,
          row.type,
          JSON.stringify(row.title),
          row.body ? JSON.stringify(row.body) : null,
          row.payload ? JSON.stringify(row.payload) : null
        );
      }
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, payload)
         VALUES ${values.join(',')}`,
        params
      );
      inserted += result.rowCount ?? chunk.length;
    }
    return inserted;
  },
};
