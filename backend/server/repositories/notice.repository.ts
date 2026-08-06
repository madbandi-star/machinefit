import type {
  CreateNoticeInput,
  NoticeAttachment,
  NoticeCategory,
  NoticeDetail,
  NoticeLanguage,
  NoticeListItem,
  NoticeListQuery,
  NoticeStatus,
  NoticeTranslation,
  UpdateNoticeInput,
} from '@machinefit/shared';
import {
  NOTICE_NEW_BADGE_DAYS,
  NOTICE_VIEW_DEDUPE_MS,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { plainTextFromHtml } from '../utils/html-sanitize.js';

interface NoticeRow {
  id: string;
  category: string;
  status: string;
  is_pinned: boolean;
  is_important: boolean;
  is_banner: boolean;
  is_popup: boolean;
  publish_at: Date | string | null;
  view_count: number;
  created_by: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
  title?: string | null;
  content?: string | null;
  views_last_30_days?: string | number | null;
}

interface TranslationRow {
  language: string;
  title: string;
  content: string;
}

interface AttachmentRow {
  id: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  public_url: string | null;
  sort_order: number;
  is_inline_image: boolean;
  created_at: Date | string;
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.toISOString();
}

function isNewBadge(publishAt: string | undefined, createdAt: string): boolean {
  const base = publishAt ? new Date(publishAt).getTime() : new Date(createdAt).getTime();
  if (Number.isNaN(base)) return false;
  return Date.now() - base <= NOTICE_NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;
}

function pickTranslation(
  rows: TranslationRow[],
  language: NoticeLanguage
): { title: string; content: string } {
  const order: NoticeLanguage[] = [language, 'en', 'ko', 'ja', 'zh'];
  for (const lang of order) {
    const hit = rows.find((row) => row.language === lang);
    if (hit) return { title: hit.title, content: hit.content };
  }
  return { title: rows[0]?.title ?? '', content: rows[0]?.content ?? '' };
}

function mapAttachment(row: AttachmentRow): NoticeAttachment {
  return {
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSizeBytes: Number(row.file_size_bytes),
    publicUrl: row.public_url ?? undefined,
    sortOrder: row.sort_order,
    isInlineImage: row.is_inline_image,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  };
}

function mapListItem(
  row: NoticeRow,
  title: string,
  content: string
): NoticeListItem {
  const createdAt = toIso(row.created_at) ?? new Date().toISOString();
  const publishAt = toIso(row.publish_at);
  return {
    id: row.id,
    category: row.category as NoticeCategory,
    status: row.status as NoticeStatus,
    isPinned: row.is_pinned,
    isImportant: row.is_important,
    isBanner: row.is_banner,
    isPopup: row.is_popup,
    publishAt,
    viewCount: Number(row.view_count) || 0,
    title,
    excerpt: plainTextFromHtml(content),
    isNew: isNewBadge(publishAt, createdAt),
    createdAt,
    updatedAt: toIso(row.updated_at) ?? createdAt,
  };
}

const mockNotices: {
  row: NoticeRow;
  translations: TranslationRow[];
  attachments: AttachmentRow[];
}[] = [];

export const noticeRepository = {
  async list(
    query: NoticeListQuery,
    options: { language: NoticeLanguage; admin: boolean }
  ): Promise<{ items: NoticeListItem[]; total: number }> {
    const pool = getPool();
    const language = options.language;
    const page = query.page;
    const pageSize = query.pageSize;
    const offset = (page - 1) * pageSize;

    if (!pool) {
      let rows = mockNotices.filter((item) => !item.row.deleted_at);
      if (!options.admin) {
        rows = rows.filter((item) => item.row.status === 'PUBLISHED');
      } else if (query.status) {
        rows = rows.filter((item) => item.row.status === query.status);
      } else if (!query.includeDrafts) {
        rows = rows.filter((item) => item.row.status !== 'DRAFT');
      }
      if (query.category) rows = rows.filter((item) => item.row.category === query.category);
      if (query.q) {
        const q = query.q.toLowerCase();
        rows = rows.filter((item) => {
          const tr = pickTranslation(item.translations, language);
          const inTitle = tr.title.toLowerCase().includes(q);
          const inContent = tr.content.toLowerCase().includes(q);
          if (query.searchIn === 'title') return inTitle;
          if (query.searchIn === 'content') return inContent;
          return inTitle || inContent;
        });
      }
      rows.sort((a, b) => {
        if (a.row.is_pinned !== b.row.is_pinned) return a.row.is_pinned ? -1 : 1;
        const aTime = new Date(a.row.publish_at ?? a.row.created_at).getTime();
        const bTime = new Date(b.row.publish_at ?? b.row.created_at).getTime();
        return bTime - aTime;
      });
      const total = rows.length;
      const slice = rows.slice(offset, offset + pageSize).map((item) => {
        const tr = pickTranslation(item.translations, language);
        return mapListItem(item.row, tr.title, tr.content);
      });
      return { items: slice, total };
    }

    const params: unknown[] = [];
    const where: string[] = ['n.deleted_at IS NULL'];

    if (!options.admin) {
      where.push(`n.status = 'PUBLISHED'`);
      where.push(`(n.publish_at IS NULL OR n.publish_at <= NOW())`);
    } else if (query.status) {
      params.push(query.status);
      where.push(`n.status = $${params.length}`);
    } else if (!query.includeDrafts) {
      where.push(`n.status <> 'DRAFT'`);
    }

    if (query.category) {
      params.push(query.category);
      where.push(`n.category = $${params.length}`);
    }

    if (query.q) {
      params.push(`%${query.q}%`);
      const idx = params.length;
      if (query.searchIn === 'title') {
        where.push(`EXISTS (
          SELECT 1 FROM notice_translations t
          WHERE t.notice_id = n.id AND t.title ILIKE $${idx}
        )`);
      } else if (query.searchIn === 'content') {
        where.push(`EXISTS (
          SELECT 1 FROM notice_translations t
          WHERE t.notice_id = n.id AND t.content ILIKE $${idx}
        )`);
      } else {
        where.push(`EXISTS (
          SELECT 1 FROM notice_translations t
          WHERE t.notice_id = n.id AND (t.title ILIKE $${idx} OR t.content ILIKE $${idx})
        )`);
      }
    }

    const whereSql = where.join(' AND ');
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM notices n WHERE ${whereSql}`,
      params
    );
    const total = Number(countResult.rows[0]?.count ?? 0);

    params.push(language);
    const langIdx = params.length;
    params.push(pageSize);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const result = await pool.query<NoticeRow>(
      `SELECT n.*,
              COALESCE(tr.title, tr_fallback.title, '') AS title,
              COALESCE(tr.content, tr_fallback.content, '') AS content
       FROM notices n
       LEFT JOIN notice_translations tr
         ON tr.notice_id = n.id AND tr.language = $${langIdx}
       LEFT JOIN LATERAL (
         SELECT title, content
         FROM notice_translations t2
         WHERE t2.notice_id = n.id
         ORDER BY CASE t2.language
           WHEN 'en' THEN 1 WHEN 'ko' THEN 2 WHEN 'ja' THEN 3 ELSE 4 END
         LIMIT 1
       ) tr_fallback ON TRUE
       WHERE ${whereSql}
       ORDER BY n.is_pinned DESC,
                COALESCE(n.publish_at, n.created_at) DESC,
                n.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    const items = result.rows.map((row) =>
      mapListItem(row, row.title ?? '', row.content ?? '')
    );
    return { items, total };
  },

  async getById(
    id: string,
    options: { language: NoticeLanguage; admin: boolean; includeAllTranslations?: boolean }
  ): Promise<NoticeDetail | null> {
    const pool = getPool();
    if (!pool) {
      const found = mockNotices.find((item) => item.row.id === id && !item.row.deleted_at);
      if (!found) return null;
      if (!options.admin && found.row.status !== 'PUBLISHED') return null;
      const tr = pickTranslation(found.translations, options.language);
      const base = mapListItem(found.row, tr.title, tr.content);
      return {
        ...base,
        content: tr.content,
        translations: options.includeAllTranslations
          ? found.translations.map((t) => ({
              language: t.language as NoticeLanguage,
              title: t.title,
              content: t.content,
            }))
          : undefined,
        attachments: found.attachments.map(mapAttachment),
        createdBy: found.row.created_by ?? undefined,
        prevId: null,
        nextId: null,
      };
    }

    const result = await pool.query<NoticeRow>(
      `SELECT n.*,
         (SELECT COUNT(*)::int FROM notice_views v
           WHERE v.notice_id = n.id AND v.viewed_at >= NOW() - INTERVAL '30 days') AS views_last_30_days
       FROM notices n
       WHERE n.id = $1 AND n.deleted_at IS NULL`,
      [id]
    );
    const row = result.rows[0];
    if (!row) return null;
    if (!options.admin && row.status !== 'PUBLISHED') return null;

    const translations = await pool.query<TranslationRow>(
      `SELECT language, title, content FROM notice_translations WHERE notice_id = $1`,
      [id]
    );
    const tr = pickTranslation(translations.rows, options.language);
    const attachments = await pool.query<AttachmentRow>(
      `SELECT id, file_name, mime_type, file_size_bytes, public_url, sort_order, is_inline_image, created_at
       FROM notice_attachments WHERE notice_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [id]
    );

    let prevId: string | null = null;
    let nextId: string | null = null;
    if (!options.admin) {
      const nav = await pool.query<{ prev_id: string | null; next_id: string | null }>(
        `WITH ordered AS (
           SELECT id,
             LAG(id) OVER (ORDER BY is_pinned DESC, COALESCE(publish_at, created_at) DESC, created_at DESC) AS prev_id,
             LEAD(id) OVER (ORDER BY is_pinned DESC, COALESCE(publish_at, created_at) DESC, created_at DESC) AS next_id
           FROM notices
           WHERE deleted_at IS NULL AND status = 'PUBLISHED'
             AND (publish_at IS NULL OR publish_at <= NOW())
         )
         SELECT prev_id, next_id FROM ordered WHERE id = $1`,
        [id]
      );
      prevId = nav.rows[0]?.prev_id ?? null;
      nextId = nav.rows[0]?.next_id ?? null;
    }

    const base = mapListItem(row, tr.title, tr.content);
    return {
      ...base,
      content: tr.content,
      translations: options.includeAllTranslations
        ? translations.rows.map((t) => ({
            language: t.language as NoticeLanguage,
            title: t.title,
            content: t.content,
          }))
        : undefined,
      attachments: attachments.rows.map(mapAttachment),
      createdBy: row.created_by ?? undefined,
      prevId,
      nextId,
      viewsLast30Days: Number(row.views_last_30_days ?? 0),
    };
  },

  async create(
    userId: string,
    input: CreateNoticeInput,
    translations: NoticeTranslation[]
  ): Promise<string> {
    const pool = getPool();
    if (!pool) {
      const id = crypto.randomUUID();
      mockNotices.unshift({
        row: {
          id,
          category: input.category,
          status: input.status,
          is_pinned: input.isPinned,
          is_important: input.isImportant,
          is_banner: input.isBanner,
          is_popup: input.isPopup,
          publish_at: input.publishAt ?? null,
          view_count: 0,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        },
        translations: translations.map((t) => ({
          language: t.language,
          title: t.title,
          content: t.content,
        })),
        attachments: [],
      });
      return id;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO notices (
           category, status, is_pinned, is_important, is_banner, is_popup, publish_at, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [
          input.category,
          input.status,
          input.isPinned,
          input.isImportant,
          input.isBanner,
          input.isPopup,
          input.publishAt ?? null,
          userId,
        ]
      );
      const id = inserted.rows[0]!.id;
      for (const tr of translations) {
        await client.query(
          `INSERT INTO notice_translations (notice_id, language, title, content)
           VALUES ($1,$2,$3,$4)`,
          [id, tr.language, tr.title, tr.content]
        );
      }
      await client.query('COMMIT');
      return id;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  },

  async update(
    id: string,
    input: UpdateNoticeInput,
    translations?: NoticeTranslation[]
  ): Promise<boolean> {
    const pool = getPool();
    if (!pool) {
      const found = mockNotices.find((item) => item.row.id === id && !item.row.deleted_at);
      if (!found) return false;
      if (input.category !== undefined) found.row.category = input.category;
      if (input.status !== undefined) found.row.status = input.status;
      if (input.isPinned !== undefined) found.row.is_pinned = input.isPinned;
      if (input.isImportant !== undefined) found.row.is_important = input.isImportant;
      if (input.isBanner !== undefined) found.row.is_banner = input.isBanner;
      if (input.isPopup !== undefined) found.row.is_popup = input.isPopup;
      if (input.publishAt !== undefined) found.row.publish_at = input.publishAt;
      found.row.updated_at = new Date().toISOString();
      if (translations) {
        found.translations = translations.map((t) => ({
          language: t.language,
          title: t.title,
          content: t.content,
        }));
      }
      return true;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const fields: string[] = [];
      const params: unknown[] = [];
      const push = (sql: string, value: unknown) => {
        params.push(value);
        fields.push(`${sql} = $${params.length}`);
      };
      if (input.category !== undefined) push('category', input.category);
      if (input.status !== undefined) push('status', input.status);
      if (input.isPinned !== undefined) push('is_pinned', input.isPinned);
      if (input.isImportant !== undefined) push('is_important', input.isImportant);
      if (input.isBanner !== undefined) push('is_banner', input.isBanner);
      if (input.isPopup !== undefined) push('is_popup', input.isPopup);
      if (input.publishAt !== undefined) push('publish_at', input.publishAt);

      if (fields.length) {
        params.push(id);
        const result = await client.query(
          `UPDATE notices SET ${fields.join(', ')}, updated_at = NOW()
           WHERE id = $${params.length} AND deleted_at IS NULL`,
          params
        );
        if ((result.rowCount ?? 0) === 0) {
          await client.query('ROLLBACK');
          return false;
        }
      } else {
        const exists = await client.query(
          `SELECT 1 FROM notices WHERE id = $1 AND deleted_at IS NULL`,
          [id]
        );
        if (!exists.rows[0]) {
          await client.query('ROLLBACK');
          return false;
        }
      }

      if (translations) {
        await client.query(`DELETE FROM notice_translations WHERE notice_id = $1`, [id]);
        for (const tr of translations) {
          await client.query(
            `INSERT INTO notice_translations (notice_id, language, title, content)
             VALUES ($1,$2,$3,$4)`,
            [id, tr.language, tr.title, tr.content]
          );
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  },

  async softDelete(id: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) {
      const found = mockNotices.find((item) => item.row.id === id && !item.row.deleted_at);
      if (!found) return false;
      found.row.deleted_at = new Date().toISOString();
      return true;
    }
    const result = await pool.query(
      `UPDATE notices SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async setFlag(
    id: string,
    flag: 'is_pinned' | 'is_important' | 'is_banner' | 'is_popup',
    value: boolean
  ): Promise<boolean> {
    const pool = getPool();
    if (!pool) {
      const found = mockNotices.find((item) => item.row.id === id && !item.row.deleted_at);
      if (!found) return false;
      if (flag === 'is_pinned') found.row.is_pinned = value;
      if (flag === 'is_important') found.row.is_important = value;
      if (flag === 'is_banner') found.row.is_banner = value;
      if (flag === 'is_popup') found.row.is_popup = value;
      return true;
    }
    const result = await pool.query(
      `UPDATE notices SET ${flag} = $2, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [id, value]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async setStatus(
    id: string,
    status: NoticeStatus,
    publishAt?: string | null
  ): Promise<boolean> {
    const pool = getPool();
    if (!pool) {
      const found = mockNotices.find((item) => item.row.id === id && !item.row.deleted_at);
      if (!found) return false;
      found.row.status = status;
      if (publishAt !== undefined) found.row.publish_at = publishAt;
      if (status === 'PUBLISHED' && !found.row.publish_at) {
        found.row.publish_at = new Date().toISOString();
      }
      return true;
    }
    const result = await pool.query(
      `UPDATE notices
       SET status = $2,
           publish_at = COALESCE($3::timestamptz, publish_at, CASE WHEN $2 = 'PUBLISHED' THEN NOW() ELSE NULL END),
           updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [id, status, publishAt ?? null]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async recordView(id: string, viewerKey: string): Promise<boolean> {
    const pool = getPool();
    const cutoff = new Date(Date.now() - NOTICE_VIEW_DEDUPE_MS).toISOString();
    if (!pool) {
      return true;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query<{ viewed_at: Date | string }>(
        `SELECT viewed_at FROM notice_views WHERE notice_id = $1 AND viewer_key = $2 FOR UPDATE`,
        [id, viewerKey]
      );
      const last = existing.rows[0]?.viewed_at;
      if (last && new Date(last).toISOString() > cutoff) {
        await client.query('COMMIT');
        return false;
      }

      await client.query(
        `INSERT INTO notice_views (notice_id, viewer_key, viewed_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (notice_id, viewer_key)
         DO UPDATE SET viewed_at = NOW()`,
        [id, viewerKey]
      );
      await client.query(
        `UPDATE notices SET view_count = view_count + 1 WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  },

  async addAttachment(
    noticeId: string,
    data: {
      fileName: string;
      mimeType: string;
      fileSizeBytes: number;
      storagePath: string;
      publicUrl?: string;
      sortOrder: number;
      isInlineImage: boolean;
    }
  ): Promise<NoticeAttachment> {
    const pool = getPool();
    if (!pool) {
      const att: AttachmentRow = {
        id: crypto.randomUUID(),
        file_name: data.fileName,
        mime_type: data.mimeType,
        file_size_bytes: data.fileSizeBytes,
        public_url: data.publicUrl ?? null,
        sort_order: data.sortOrder,
        is_inline_image: data.isInlineImage,
        created_at: new Date().toISOString(),
      };
      const found = mockNotices.find((item) => item.row.id === noticeId);
      found?.attachments.push(att);
      return mapAttachment(att);
    }
    const result = await pool.query<AttachmentRow>(
      `INSERT INTO notice_attachments (
         notice_id, file_name, mime_type, file_size_bytes, storage_path, public_url, sort_order, is_inline_image
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, file_name, mime_type, file_size_bytes, public_url, sort_order, is_inline_image, created_at`,
      [
        noticeId,
        data.fileName,
        data.mimeType,
        data.fileSizeBytes,
        data.storagePath,
        data.publicUrl ?? null,
        data.sortOrder,
        data.isInlineImage,
      ]
    );
    return mapAttachment(result.rows[0]!);
  },

  async countAttachments(noticeId: string): Promise<number> {
    const pool = getPool();
    if (!pool) {
      return mockNotices.find((item) => item.row.id === noticeId)?.attachments.length ?? 0;
    }
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM notice_attachments WHERE notice_id = $1`,
      [noticeId]
    );
    return Number(result.rows[0]?.count ?? 0);
  },

  async getAttachment(
    noticeId: string,
    attachmentId: string
  ): Promise<(NoticeAttachment & { storagePath: string }) | null> {
    const pool = getPool();
    if (!pool) {
      const found = mockNotices
        .find((item) => item.row.id === noticeId)
        ?.attachments.find((att) => att.id === attachmentId);
      if (!found) return null;
      return { ...mapAttachment(found), storagePath: `mock/${found.id}` };
    }
    const result = await pool.query<AttachmentRow & { storage_path: string }>(
      `SELECT id, file_name, mime_type, file_size_bytes, public_url, sort_order, is_inline_image, created_at, storage_path
       FROM notice_attachments WHERE notice_id = $1 AND id = $2`,
      [noticeId, attachmentId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return { ...mapAttachment(row), storagePath: row.storage_path };
  },

  async deleteAttachment(noticeId: string, attachmentId: string): Promise<string | null> {
    const pool = getPool();
    if (!pool) {
      const notice = mockNotices.find((item) => item.row.id === noticeId);
      if (!notice) return null;
      const idx = notice.attachments.findIndex((att) => att.id === attachmentId);
      if (idx < 0) return null;
      notice.attachments.splice(idx, 1);
      return `mock/${attachmentId}`;
    }
    const result = await pool.query<{ storage_path: string }>(
      `DELETE FROM notice_attachments WHERE notice_id = $1 AND id = $2 RETURNING storage_path`,
      [noticeId, attachmentId]
    );
    return result.rows[0]?.storage_path ?? null;
  },

  async listDueReserved(limit = 50): Promise<string[]> {
    const pool = getPool();
    if (!pool) {
      const now = Date.now();
      return mockNotices
        .filter(
          (item) =>
            !item.row.deleted_at &&
            item.row.status === 'RESERVED' &&
            item.row.publish_at &&
            new Date(item.row.publish_at).getTime() <= now
        )
        .slice(0, limit)
        .map((item) => item.row.id);
    }
    const result = await pool.query<{ id: string }>(
      `SELECT id FROM notices
       WHERE deleted_at IS NULL AND status = 'RESERVED'
         AND publish_at IS NOT NULL AND publish_at <= NOW()
       ORDER BY publish_at ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => row.id);
  },

  async getHomeBanner(language: NoticeLanguage): Promise<NoticeListItem | null> {
    const { items } = await this.list(
      {
        page: 1,
        pageSize: 1,
        searchIn: 'both',
        includeDrafts: false,
      },
      { language, admin: false }
    );
    // Prefer banner-flagged; fall back to latest published.
    const pool = getPool();
    if (!pool) {
      const banner = mockNotices.find(
        (item) =>
          !item.row.deleted_at &&
          item.row.status === 'PUBLISHED' &&
          item.row.is_banner
      );
      if (!banner) return items[0] ?? null;
      const tr = pickTranslation(banner.translations, language);
      return mapListItem(banner.row, tr.title, tr.content);
    }
    const result = await pool.query<NoticeRow>(
      `SELECT n.*,
              COALESCE(tr.title, '') AS title,
              COALESCE(tr.content, '') AS content
       FROM notices n
       LEFT JOIN notice_translations tr
         ON tr.notice_id = n.id AND tr.language = $1
       WHERE n.deleted_at IS NULL AND n.status = 'PUBLISHED' AND n.is_banner = TRUE
         AND (n.publish_at IS NULL OR n.publish_at <= NOW())
       ORDER BY n.is_important DESC, COALESCE(n.publish_at, n.created_at) DESC
       LIMIT 1`,
      [language]
    );
    if (result.rows[0]) {
      const row = result.rows[0];
      return mapListItem(row, row.title ?? '', row.content ?? '');
    }
    return items[0] ?? null;
  },

  async getActivePopup(language: NoticeLanguage): Promise<NoticeListItem | null> {
    const pool = getPool();
    if (!pool) {
      const popup = mockNotices.find(
        (item) =>
          !item.row.deleted_at &&
          item.row.status === 'PUBLISHED' &&
          item.row.is_popup
      );
      if (!popup) return null;
      const tr = pickTranslation(popup.translations, language);
      return mapListItem(popup.row, tr.title, tr.content);
    }
    const result = await pool.query<NoticeRow>(
      `SELECT n.*,
              COALESCE(tr.title, '') AS title,
              COALESCE(tr.content, '') AS content
       FROM notices n
       LEFT JOIN notice_translations tr
         ON tr.notice_id = n.id AND tr.language = $1
       WHERE n.deleted_at IS NULL AND n.status = 'PUBLISHED' AND n.is_popup = TRUE
         AND (n.publish_at IS NULL OR n.publish_at <= NOW())
       ORDER BY n.is_important DESC, COALESCE(n.publish_at, n.created_at) DESC
       LIMIT 1`,
      [language]
    );
    const row = result.rows[0];
    if (!row) return null;
    return mapListItem(row, row.title ?? '', row.content ?? '');
  },

  async adminStats(language: NoticeLanguage) {
    const pool = getPool();
    if (!pool) {
      const published = mockNotices.filter(
        (item) => !item.row.deleted_at && item.row.status === 'PUBLISHED'
      );
      return {
        totalPublished: published.length,
        totalViews: published.reduce((sum, item) => sum + item.row.view_count, 0),
        viewsLast30Days: 0,
        popular: published
          .slice()
          .sort((a, b) => b.row.view_count - a.row.view_count)
          .slice(0, 5)
          .map((item) => ({
            id: item.row.id,
            title: pickTranslation(item.translations, language).title,
            viewCount: item.row.view_count,
          })),
      };
    }
    const totals = await pool.query<{
      total_published: string;
      total_views: string;
      views_30d: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PUBLISHED')::text AS total_published,
         COALESCE(SUM(view_count), 0)::text AS total_views,
         (SELECT COUNT(*)::text FROM notice_views WHERE viewed_at >= NOW() - INTERVAL '30 days') AS views_30d
       FROM notices WHERE deleted_at IS NULL`
    );
    const popular = await pool.query<{ id: string; title: string; view_count: number }>(
      `SELECT n.id, COALESCE(tr.title, '') AS title, n.view_count
       FROM notices n
       LEFT JOIN notice_translations tr ON tr.notice_id = n.id AND tr.language = $1
       WHERE n.deleted_at IS NULL AND n.status = 'PUBLISHED'
       ORDER BY n.view_count DESC, n.created_at DESC
       LIMIT 5`,
      [language]
    );
    return {
      totalPublished: Number(totals.rows[0]?.total_published ?? 0),
      totalViews: Number(totals.rows[0]?.total_views ?? 0),
      viewsLast30Days: Number(totals.rows[0]?.views_30d ?? 0),
      popular: popular.rows.map((row) => ({
        id: row.id,
        title: row.title,
        viewCount: Number(row.view_count) || 0,
      })),
    };
  },
};
