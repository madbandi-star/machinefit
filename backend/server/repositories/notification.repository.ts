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

    const count = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM notifications WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(count.rows[0]?.count ?? '0', 10);

    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, (page - 1) * limit]
    );

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
};
