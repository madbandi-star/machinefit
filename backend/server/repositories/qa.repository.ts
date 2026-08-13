import type {
  CreateQaArticleInput,
  QaAdminStats,
  QaArticleDetail,
  QaArticleListItem,
  QaCategory,
  QaFeedbackValue,
  QaListQuery,
  QaPriority,
  UpdateQaArticleInput,
} from '@machinefit/shared';
import type { Pool } from 'pg';
import { getPool } from '../config/database.js';

function requirePool(): Pool {
  const pool = getPool();
  if (!pool) throw new Error('Database not configured');
  return pool;
}

interface QaRow {
  id: string;
  category: string;
  priority: number;
  title: string;
  answer: string;
  keywords: string[] | null;
  slug: string | null;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  display_order: number;
  is_published: boolean;
  needs_impl_review: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  my_feedback?: boolean | null;
}

function toIso(value: Date | string): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function excerptFrom(answer: string, max = 120): string {
  const plain = answer.replace(/\s+/g, ' ').trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1).trim()}…`;
}

function mapListItem(row: QaRow, popularIds?: Set<string>): QaArticleListItem {
  return {
    id: row.id,
    category: row.category as QaCategory,
    priority: row.priority as QaPriority,
    title: row.title,
    excerpt: excerptFrom(row.answer),
    keywords: row.keywords ?? [],
    viewCount: Number(row.view_count) || 0,
    helpfulCount: Number(row.helpful_count) || 0,
    notHelpfulCount: Number(row.not_helpful_count) || 0,
    displayOrder: Number(row.display_order) || 0,
    isPublished: Boolean(row.is_published),
    needsImplReview: Boolean(row.needs_impl_review),
    isPopular: popularIds ? popularIds.has(row.id) : undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapDetail(row: QaRow): QaArticleDetail {
  let myFeedback: QaFeedbackValue | null | undefined;
  if (row.my_feedback === true) myFeedback = 'helpful';
  else if (row.my_feedback === false) myFeedback = 'not_helpful';
  else if (row.my_feedback === null) myFeedback = null;

  return {
    ...mapListItem(row),
    answer: row.answer,
    slug: row.slug,
    myFeedback,
  };
}

function orderSql(sort: QaListQuery['sort']): string {
  switch (sort) {
    case 'views':
      return 'view_count DESC, priority ASC, display_order ASC';
    case 'helpful':
      return 'helpful_count DESC, view_count DESC, display_order ASC';
    case 'order':
      return 'display_order ASC, priority ASC';
    case 'updated':
      return 'updated_at DESC';
    case 'priority':
    default:
      return 'priority ASC, display_order ASC, created_at DESC';
  }
}

export const qaRepository = {
  async list(
    query: QaListQuery,
    options: { includeUnpublished: boolean }
  ): Promise<{ items: QaArticleListItem[]; total: number }> {
    const pool = requirePool();
    const params: unknown[] = [];
    const where: string[] = [];

    if (!options.includeUnpublished) {
      where.push('is_published = TRUE');
    }

    if (query.category) {
      params.push(query.category);
      where.push(`category = $${params.length}`);
    }

    if (query.q && query.q.trim()) {
      const q = `%${query.q.trim()}%`;
      params.push(q);
      const i = params.length;
      params.push(query.q.trim());
      const j = params.length;
      where.push(
        `(title ILIKE $${i} OR answer ILIKE $${i} OR EXISTS (
          SELECT 1 FROM unnest(keywords) kw WHERE kw ILIKE $${i}
        ) OR $${j} = ANY(keywords))`
      );
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM qa_articles ${whereSql}`,
      params
    );
    const total = Number(countRes.rows[0]?.count ?? 0);

    const page = query.page;
    const pageSize = query.pageSize;
    params.push(pageSize);
    const limitIdx = params.length;
    params.push((page - 1) * pageSize);
    const offsetIdx = params.length;

    const listRes = await pool.query<QaRow>(
      `SELECT id, category, priority, title, answer, keywords, slug,
              view_count, helpful_count, not_helpful_count, display_order,
              is_published, needs_impl_review, created_at, updated_at
       FROM qa_articles
       ${whereSql}
       ORDER BY ${orderSql(query.sort)}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return { items: listRes.rows.map((r) => mapListItem(r)), total };
  },

  async listPopular(limit: number): Promise<QaArticleListItem[]> {
    if (limit <= 0) return [];
    const pool = requirePool();
    const res = await pool.query<QaRow>(
      `SELECT id, category, priority, title, answer, keywords, slug,
              view_count, helpful_count, not_helpful_count, display_order,
              is_published, needs_impl_review, created_at, updated_at
       FROM qa_articles
       WHERE is_published = TRUE
       ORDER BY view_count DESC, helpful_count DESC, priority ASC, display_order ASC
       LIMIT $1`,
      [limit]
    );
    const ids = new Set(res.rows.map((r) => r.id));
    return res.rows.map((r) => mapListItem(r, ids));
  },

  async categoryCounts(publishedOnly: boolean): Promise<{ category: QaCategory; count: number }[]> {
    const pool = requirePool();
    const res = await pool.query<{ category: string; count: string }>(
      `SELECT category, COUNT(*)::text AS count
       FROM qa_articles
       ${publishedOnly ? 'WHERE is_published = TRUE' : ''}
       GROUP BY category
       ORDER BY category`
    );
    return res.rows.map((r) => ({
      category: r.category as QaCategory,
      count: Number(r.count) || 0,
    }));
  },

  async getById(
    id: string,
    options: { includeUnpublished: boolean; userId?: string }
  ): Promise<QaArticleDetail | null> {
    const pool = requirePool();
    const params: unknown[] = [id];
    let feedbackJoin = '';
    let feedbackSelect = 'NULL::boolean AS my_feedback';
    if (options.userId) {
      params.push(options.userId);
      feedbackJoin = `LEFT JOIN qa_feedback f ON f.article_id = a.id AND f.user_id = $${params.length}`;
      feedbackSelect = 'f.is_helpful AS my_feedback';
    }
    const pubFilter = options.includeUnpublished ? '' : 'AND a.is_published = TRUE';
    const res = await pool.query<QaRow>(
      `SELECT a.id, a.category, a.priority, a.title, a.answer, a.keywords, a.slug,
              a.view_count, a.helpful_count, a.not_helpful_count, a.display_order,
              a.is_published, a.needs_impl_review, a.created_at, a.updated_at,
              ${feedbackSelect}
       FROM qa_articles a
       ${feedbackJoin}
       WHERE a.id = $1 ${pubFilter}
       LIMIT 1`,
      params
    );
    const row = res.rows[0];
    return row ? mapDetail(row) : null;
  },

  async incrementView(id: string): Promise<void> {
    const pool = requirePool();
    await pool.query(
      `UPDATE qa_articles SET view_count = view_count + 1, updated_at = updated_at WHERE id = $1`,
      [id]
    );
  },

  async create(input: CreateQaArticleInput, userId?: string): Promise<QaArticleDetail> {
    const pool = requirePool();
    const res = await pool.query<QaRow>(
      `INSERT INTO qa_articles (
         category, priority, title, answer, keywords, slug,
         display_order, is_published, needs_impl_review, created_by, updated_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
       RETURNING id, category, priority, title, answer, keywords, slug,
                 view_count, helpful_count, not_helpful_count, display_order,
                 is_published, needs_impl_review, created_at, updated_at`,
      [
        input.category,
        input.priority,
        input.title,
        input.answer,
        input.keywords ?? [],
        input.slug ?? null,
        input.displayOrder,
        input.isPublished,
        input.needsImplReview,
        userId ?? null,
      ]
    );
    return mapDetail(res.rows[0]);
  },

  async update(
    id: string,
    input: UpdateQaArticleInput,
    userId?: string
  ): Promise<QaArticleDetail | null> {
    const pool = requirePool();
    const fields: string[] = [];
    const params: unknown[] = [];

    const set = (col: string, value: unknown) => {
      params.push(value);
      fields.push(`${col} = $${params.length}`);
    };

    if (input.category !== undefined) set('category', input.category);
    if (input.priority !== undefined) set('priority', input.priority);
    if (input.title !== undefined) set('title', input.title);
    if (input.answer !== undefined) set('answer', input.answer);
    if (input.keywords !== undefined) set('keywords', input.keywords);
    if (input.slug !== undefined) set('slug', input.slug);
    if (input.displayOrder !== undefined) set('display_order', input.displayOrder);
    if (input.isPublished !== undefined) set('is_published', input.isPublished);
    if (input.needsImplReview !== undefined) set('needs_impl_review', input.needsImplReview);
    if (input.viewCount !== undefined) set('view_count', input.viewCount);

    if (!fields.length) {
      return this.getById(id, { includeUnpublished: true });
    }

    params.push(userId ?? null);
    fields.push(`updated_by = $${params.length}`);
    fields.push('updated_at = NOW()');
    params.push(id);

    const res = await pool.query<QaRow>(
      `UPDATE qa_articles SET ${fields.join(', ')}
       WHERE id = $${params.length}
       RETURNING id, category, priority, title, answer, keywords, slug,
                 view_count, helpful_count, not_helpful_count, display_order,
                 is_published, needs_impl_review, created_at, updated_at`,
      params
    );
    const row = res.rows[0];
    return row ? mapDetail(row) : null;
  },

  async setPublished(id: string, isPublished: boolean, userId?: string): Promise<boolean> {
    const pool = requirePool();
    const res = await pool.query(
      `UPDATE qa_articles
       SET is_published = $2, updated_by = $3, updated_at = NOW()
       WHERE id = $1`,
      [id, isPublished, userId ?? null]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async remove(id: string): Promise<boolean> {
    const pool = requirePool();
    const res = await pool.query(`DELETE FROM qa_articles WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async reorder(items: { id: string; displayOrder: number }[]): Promise<void> {
    const pool = requirePool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query(
          `UPDATE qa_articles SET display_order = $2, updated_at = NOW() WHERE id = $1`,
          [item.id, item.displayOrder]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async upsertFeedback(
    articleId: string,
    userId: string,
    isHelpful: boolean
  ): Promise<QaArticleDetail | null> {
    const pool = requirePool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const prev = await client.query<{ is_helpful: boolean }>(
        `SELECT is_helpful FROM qa_feedback WHERE article_id = $1 AND user_id = $2`,
        [articleId, userId]
      );
      const existing = prev.rows[0];

      if (existing && existing.is_helpful === isHelpful) {
        await client.query('COMMIT');
        return this.getById(articleId, { includeUnpublished: false, userId });
      }

      if (existing) {
        await client.query(
          `UPDATE qa_feedback
           SET is_helpful = $3, updated_at = NOW()
           WHERE article_id = $1 AND user_id = $2`,
          [articleId, userId, isHelpful]
        );
        if (existing.is_helpful) {
          await client.query(
            `UPDATE qa_articles
             SET helpful_count = GREATEST(helpful_count - 1, 0),
                 not_helpful_count = not_helpful_count + 1,
                 updated_at = updated_at
             WHERE id = $1`,
            [articleId]
          );
        } else {
          await client.query(
            `UPDATE qa_articles
             SET not_helpful_count = GREATEST(not_helpful_count - 1, 0),
                 helpful_count = helpful_count + 1,
                 updated_at = updated_at
             WHERE id = $1`,
            [articleId]
          );
        }
      } else {
        await client.query(
          `INSERT INTO qa_feedback (article_id, user_id, is_helpful)
           VALUES ($1, $2, $3)`,
          [articleId, userId, isHelpful]
        );
        if (isHelpful) {
          await client.query(
            `UPDATE qa_articles
             SET helpful_count = helpful_count + 1, updated_at = updated_at
             WHERE id = $1`,
            [articleId]
          );
        } else {
          await client.query(
            `UPDATE qa_articles
             SET not_helpful_count = not_helpful_count + 1, updated_at = updated_at
             WHERE id = $1`,
            [articleId]
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return this.getById(articleId, { includeUnpublished: false, userId });
  },

  async adminStats(): Promise<QaAdminStats> {
    const pool = requirePool();
    const summary = await pool.query<{
      total: string;
      published: string;
      unpublished: string;
      total_views: string;
      total_helpful: string;
      total_not_helpful: string;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE is_published)::text AS published,
         COUNT(*) FILTER (WHERE NOT is_published)::text AS unpublished,
         COALESCE(SUM(view_count),0)::text AS total_views,
         COALESCE(SUM(helpful_count),0)::text AS total_helpful,
         COALESCE(SUM(not_helpful_count),0)::text AS total_not_helpful
       FROM qa_articles`
    );
    const s = summary.rows[0];
    const byCategory = await this.categoryCounts(false);
    const topViewed = await pool.query<{ id: string; title: string; view_count: number }>(
      `SELECT id, title, view_count FROM qa_articles
       ORDER BY view_count DESC, helpful_count DESC LIMIT 10`
    );
    const topHelpful = await pool.query<{
      id: string;
      title: string;
      helpful_count: number;
      not_helpful_count: number;
    }>(
      `SELECT id, title, helpful_count, not_helpful_count FROM qa_articles
       ORDER BY helpful_count DESC, view_count DESC LIMIT 10`
    );

    return {
      total: Number(s?.total ?? 0),
      published: Number(s?.published ?? 0),
      unpublished: Number(s?.unpublished ?? 0),
      totalViews: Number(s?.total_views ?? 0),
      totalHelpful: Number(s?.total_helpful ?? 0),
      totalNotHelpful: Number(s?.total_not_helpful ?? 0),
      byCategory,
      topViewed: topViewed.rows.map((r) => ({
        id: r.id,
        title: r.title,
        viewCount: Number(r.view_count) || 0,
      })),
      topHelpful: topHelpful.rows.map((r) => ({
        id: r.id,
        title: r.title,
        helpfulCount: Number(r.helpful_count) || 0,
        notHelpfulCount: Number(r.not_helpful_count) || 0,
      })),
    };
  },

  async countAll(): Promise<number> {
    const pool = requirePool();
    const res = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM qa_articles`);
    return Number(res.rows[0]?.count ?? 0);
  },
};
