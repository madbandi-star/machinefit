import type {
  MotivationMediaItem,
  MotivationMediaType,
  MotivationMediaSlotInput,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import {
  getMockMotivationMedia,
  getMockMotivationPlaylist,
  replaceMockMotivationMedia,
} from '../data/motivation-media.mock.js';
import { extractYoutubeId } from '../utils/youtube.util.js';
import { randomUUID } from 'node:crypto';

function mapRow(row: Record<string, unknown>): MotivationMediaItem {
  return {
    id: String(row.id),
    mediaType: row.media_type as MotivationMediaType,
    title: String(row.title ?? ''),
    mediaUrl: String(row.media_url ?? ''),
    youtubeId: (row.youtube_id as string | null) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    isSelected: Boolean(row.is_selected),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : undefined,
  };
}

function normalizeSlot(
  mediaType: MotivationMediaType,
  slot: MotivationMediaSlotInput
): MotivationMediaItem | null {
  const title = slot.title.trim();
  const mediaUrl = slot.mediaUrl.trim();
  if (!title && !mediaUrl) return null;
  if (!title || !mediaUrl) return null;

  const youtubeId = mediaType === 'video' ? extractYoutubeId(mediaUrl) : null;

  return {
    id: slot.id ?? randomUUID(),
    mediaType,
    title,
    mediaUrl,
    youtubeId,
    sortOrder: slot.sortOrder,
    isSelected: slot.isSelected,
    isActive: slot.isActive ?? true,
  };
}

export const motivationMediaRepository = {
  async listAdmin(): Promise<{ music: MotivationMediaItem[]; video: MotivationMediaItem[] }> {
    const pool = getPool();
    if (!pool) {
      return {
        music: getMockMotivationMedia('music'),
        video: getMockMotivationMedia('video'),
      };
    }

    const result = await pool.query(
      `SELECT * FROM motivation_media
       WHERE is_active = TRUE
       ORDER BY media_type ASC, sort_order ASC`
    );
    const items = result.rows.map((row) => mapRow(row));
    return {
      music: items.filter((i) => i.mediaType === 'music'),
      video: items.filter((i) => i.mediaType === 'video'),
    };
  },

  async listPlaylist(): Promise<{ music: MotivationMediaItem[]; video: MotivationMediaItem[] }> {
    const pool = getPool();
    if (!pool) return getMockMotivationPlaylist();

    const result = await pool.query(
      `SELECT * FROM motivation_media
       WHERE is_active = TRUE AND is_selected = TRUE
       ORDER BY media_type ASC, sort_order ASC`
    );
    const items = result.rows.map((row) => mapRow(row));
    return {
      music: items.filter((i) => i.mediaType === 'music'),
      video: items.filter((i) => i.mediaType === 'video'),
    };
  },

  async replaceType(
    mediaType: MotivationMediaType,
    slots: MotivationMediaSlotInput[]
  ): Promise<MotivationMediaItem[]> {
    const normalized = slots
      .map((slot) => normalizeSlot(mediaType, slot))
      .filter((item): item is MotivationMediaItem => item !== null)
      .slice(0, 5);

    const pool = getPool();
    if (!pool) {
      return replaceMockMotivationMedia(mediaType, normalized);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM motivation_media WHERE media_type = $1`, [mediaType]);

      for (const item of normalized) {
        await client.query(
          `INSERT INTO motivation_media (
             id, media_type, title, media_url, youtube_id, sort_order, is_selected, is_active
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            item.id,
            item.mediaType,
            item.title,
            item.mediaUrl,
            item.youtubeId,
            item.sortOrder,
            item.isSelected,
            item.isActive,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const admin = await this.listAdmin();
    return mediaType === 'music' ? admin.music : admin.video;
  },
};
