import type { UserMotivationTrack } from '@machinefit/shared';
import { randomUUID } from 'node:crypto';
import { getPool } from '../config/database.js';
import {
  clearMockDefault,
  deleteMockTrack,
  getMockTrack,
  insertMockTrack,
  listMockTracks,
  setMockDefault,
  updateMockTrack,
} from '../data/user-motivation-track.mock.js';

function mapRow(row: Record<string, unknown>): UserMotivationTrack {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title ?? ''),
    sourceType: row.source_type as UserMotivationTrack['sourceType'],
    mediaUrl: String(row.media_url ?? ''),
    storagePath: (row.storage_path as string | null) ?? null,
    originalFilename: (row.original_filename as string | null) ?? null,
    mimeType: (row.mime_type as string | null) ?? null,
    fileSizeBytes: row.file_size_bytes == null ? null : Number(row.file_size_bytes),
    durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
    isDefault: Boolean(row.is_default),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export type InsertUserMotivationTrackInput = {
  id?: string;
  userId: string;
  title: string;
  sourceType: UserMotivationTrack['sourceType'];
  mediaUrl: string;
  storagePath?: string | null;
  originalFilename?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  durationSeconds?: number | null;
  isDefault?: boolean;
};

export const userMotivationTrackRepository = {
  async listByUser(userId: string): Promise<UserMotivationTrack[]> {
    const pool = getPool();
    if (!pool) return listMockTracks(userId);

    const result = await pool.query(
      `SELECT * FROM user_motivation_tracks
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    return result.rows.map((row) => mapRow(row));
  },

  async countByUser(userId: string): Promise<number> {
    const pool = getPool();
    if (!pool) return listMockTracks(userId).length;

    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM user_motivation_tracks WHERE user_id = $1`,
      [userId]
    );
    return Number(result.rows[0]?.count ?? 0);
  },

  async getById(userId: string, trackId: string): Promise<UserMotivationTrack | null> {
    const pool = getPool();
    if (!pool) return getMockTrack(userId, trackId);

    const result = await pool.query(
      `SELECT * FROM user_motivation_tracks WHERE id = $1 AND user_id = $2`,
      [trackId, userId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async insert(input: InsertUserMotivationTrackInput): Promise<UserMotivationTrack> {
    const pool = getPool();
    const id = input.id ?? randomUUID();
    const isDefault = Boolean(input.isDefault);

    if (!pool) {
      if (isDefault) clearMockDefault(input.userId);
      return insertMockTrack({
        id,
        userId: input.userId,
        title: input.title,
        sourceType: input.sourceType,
        mediaUrl: input.mediaUrl,
        storagePath: input.storagePath ?? null,
        originalFilename: input.originalFilename ?? null,
        mimeType: input.mimeType ?? null,
        fileSizeBytes: input.fileSizeBytes ?? null,
        durationSeconds: input.durationSeconds ?? null,
        isDefault,
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (isDefault) {
        await client.query(
          `UPDATE user_motivation_tracks SET is_default = FALSE WHERE user_id = $1 AND is_default = TRUE`,
          [input.userId]
        );
      }
      const result = await client.query(
        `INSERT INTO user_motivation_tracks (
           id, user_id, title, source_type, media_url, storage_path,
           original_filename, mime_type, file_size_bytes, duration_seconds, is_default
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          id,
          input.userId,
          input.title,
          input.sourceType,
          input.mediaUrl,
          input.storagePath ?? null,
          input.originalFilename ?? null,
          input.mimeType ?? null,
          input.fileSizeBytes ?? null,
          input.durationSeconds ?? null,
          isDefault,
        ]
      );
      await client.query('COMMIT');
      return mapRow(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async update(
    userId: string,
    trackId: string,
    patch: {
      title?: string;
      isDefault?: boolean;
      durationSeconds?: number | null;
    }
  ): Promise<UserMotivationTrack | null> {
    const pool = getPool();
    if (!pool) {
      if (patch.isDefault) setMockDefault(userId, trackId);
      return updateMockTrack(userId, trackId, patch);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (patch.isDefault === true) {
        await client.query(
          `UPDATE user_motivation_tracks SET is_default = FALSE WHERE user_id = $1 AND is_default = TRUE`,
          [userId]
        );
      }

      const fields: string[] = [];
      const values: unknown[] = [];
      let index = 1;

      if (patch.title !== undefined) {
        fields.push(`title = $${index++}`);
        values.push(patch.title);
      }
      if (patch.isDefault !== undefined) {
        fields.push(`is_default = $${index++}`);
        values.push(patch.isDefault);
      }
      if (patch.durationSeconds !== undefined) {
        fields.push(`duration_seconds = $${index++}`);
        values.push(patch.durationSeconds);
      }

      if (!fields.length) {
        await client.query('ROLLBACK');
        return this.getById(userId, trackId);
      }

      values.push(trackId, userId);
      const result = await client.query(
        `UPDATE user_motivation_tracks
         SET ${fields.join(', ')}
         WHERE id = $${index++} AND user_id = $${index}
         RETURNING *`,
        values
      );
      await client.query('COMMIT');
      return result.rows[0] ? mapRow(result.rows[0]) : null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async delete(userId: string, trackId: string): Promise<UserMotivationTrack | null> {
    const pool = getPool();
    if (!pool) return deleteMockTrack(userId, trackId);

    const result = await pool.query(
      `DELETE FROM user_motivation_tracks
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [trackId, userId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },
};
