import type {
  PublishTemplateShareInput,
  TemplateShareAdminListQuery,
  TemplateShareAdminStats,
  TemplateShareComment,
  TemplateShareDetail,
  TemplateShareDownloadResult,
  TemplateShareListItem,
  TemplateShareListQuery,
  TemplateShareListResponse,
  TemplateShareReport,
  TemplateShareReportStatus,
  TemplateShareSort,
  TemplateShareStatus,
  UpdateTemplateShareInput,
  WorkoutCardTemplateItem,
} from '@machinefit/shared';
import {
  TEMPLATE_SHARE_VIEW_DEDUPE_MS,
} from '@machinefit/shared';
import type pg from 'pg';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';

function requirePool(): pg.Pool {
  const pool = getPool();
  if (!pool) {
    throw new AppError(503, 'DB_UNAVAILABLE', 'Database is not configured');
  }
  return pool;
}

interface PostRow {
  id: string;
  author_user_id: string;
  source_template_id: string | null;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  tags: string[] | null;
  thumbnail_url: string | null;
  payload: WorkoutCardTemplateItem[] | unknown;
  status: string;
  view_count: string | number;
  download_count: string | number;
  use_count: string | number;
  like_count: string | number;
  comment_count: string | number;
  favorite_count: string | number;
  published_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
  author_name?: string | null;
  liked_by_me?: boolean | null;
  favorited_by_me?: boolean | null;
  downloaded_by_me?: boolean | null;
}

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: Date | string;
  updated_at: Date | string;
  author_name?: string | null;
}

interface ReportRow {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  reporter_user_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: Date | string;
  post_title?: string | null;
}

const AUTHOR_NAME_SQL = `COALESCE(NULLIF(TRIM(u.display_name), ''), 'User')`;

function toIso(value: Date | string): string {
  return typeof value === 'string' ? value : value.toISOString();
}

function toNum(value: string | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : Number(value) || 0;
}

function parsePayload(raw: unknown): WorkoutCardTemplateItem[] {
  if (!Array.isArray(raw)) return [];
  return raw as WorkoutCardTemplateItem[];
}

function popularScoreSql(alias = 'p'): string {
  return `(${alias}.like_count * 2 + ${alias}.download_count * 3 + ${alias}.use_count * 4)`;
}

function sortSql(sort: TemplateShareSort): string {
  switch (sort) {
    case 'popular':
      return `${popularScoreSql('p')} DESC, p.published_at DESC`;
    case 'downloads':
      return 'p.download_count DESC, p.published_at DESC';
    case 'uses':
      return 'p.use_count DESC, p.published_at DESC';
    case 'likes':
      return 'p.like_count DESC, p.published_at DESC';
    default:
      return 'p.published_at DESC';
  }
}

function computeBadges(row: PostRow): TemplateShareListItem['badges'] {
  const badges: NonNullable<TemplateShareListItem['badges']> = [];
  const publishedAt = new Date(row.published_at).getTime();
  const ageMs = Date.now() - publishedAt;
  if (ageMs >= 0 && ageMs < 7 * 24 * 60 * 60 * 1000) {
    badges.push({ key: 'new', label: 'New' });
  }
  const score =
    toNum(row.like_count) * 2 +
    toNum(row.download_count) * 3 +
    toNum(row.use_count) * 4;
  if (score >= 20) {
    badges.push({ key: 'popular', label: 'Popular' });
  }
  if (toNum(row.use_count) >= 10) {
    badges.push({ key: 'most_used', label: 'Most used' });
  }
  return badges.length > 0 ? badges : undefined;
}

function mapListItem(row: PostRow): TemplateShareListItem {
  const items = parsePayload(row.payload);
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category as TemplateShareListItem['category'],
    difficulty: row.difficulty as TemplateShareListItem['difficulty'],
    tags: Array.isArray(row.tags) ? row.tags : [],
    thumbnailUrl: row.thumbnail_url,
    authorUserId: row.author_user_id,
    authorName: row.author_name?.trim() || 'User',
    status: row.status as TemplateShareStatus,
    viewCount: toNum(row.view_count),
    downloadCount: toNum(row.download_count),
    useCount: toNum(row.use_count),
    likeCount: toNum(row.like_count),
    commentCount: toNum(row.comment_count),
    favoriteCount: toNum(row.favorite_count),
    likedByMe: row.liked_by_me ?? undefined,
    favoritedByMe: row.favorited_by_me ?? undefined,
    downloadedByMe: row.downloaded_by_me ?? undefined,
    itemCount: items.length,
    badges: computeBadges(row),
    publishedAt: toIso(row.published_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapDetail(row: PostRow): TemplateShareDetail {
  const base = mapListItem(row);
  const items = parsePayload(row.payload);
  return {
    ...base,
    sourceTemplateId: row.source_template_id,
    items,
    canDownload: row.status === 'published',
    sharePath: `/template-shares/${row.id}`,
  };
}

function viewerFlagsSelect(viewerId: string | undefined, startIdx: number): {
  sql: string;
  params: unknown[];
  nextIdx: number;
} {
  if (!viewerId) {
    return {
      sql: `FALSE AS liked_by_me, FALSE AS favorited_by_me, FALSE AS downloaded_by_me`,
      params: [],
      nextIdx: startIdx,
    };
  }
  return {
    sql: `EXISTS (
            SELECT 1 FROM template_share_likes l
            WHERE l.post_id = p.id AND l.user_id = $${startIdx}
          ) AS liked_by_me,
          EXISTS (
            SELECT 1 FROM template_share_favorites f
            WHERE f.post_id = p.id AND f.user_id = $${startIdx}
          ) AS favorited_by_me,
          EXISTS (
            SELECT 1 FROM template_share_downloads d
            WHERE d.post_id = p.id AND d.user_id = $${startIdx}
          ) AS downloaded_by_me`,
    params: [viewerId],
    nextIdx: startIdx + 1,
  };
}

function buildSearchFilter(
  q: string | undefined,
  params: unknown[],
  startIdx: number
): { clause: string; nextIdx: number } {
  if (!q?.trim()) return { clause: '', nextIdx: startIdx };
  const idx = startIdx;
  params.push(`%${q.trim()}%`);
  params.push(q.trim());
  return {
    clause: ` AND (
      p.title ILIKE $${idx}
      OR p.description ILIKE $${idx}
      OR array_to_string(p.tags, ' ') ILIKE $${idx}
      OR p.payload::text ILIKE $${idx}
      OR to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.description, ''))
         @@ plainto_tsquery('simple', $${idx + 1})
    )`,
    nextIdx: startIdx + 2,
  };
}

export const templateShareRepository = {
  async list(
    query: TemplateShareListQuery,
    viewerId?: string
  ): Promise<TemplateShareListResponse> {
    const pool = requirePool();
    const page = query.page;
    const pageSize = query.pageSize;
    const sort = query.sort ?? 'latest';
    const params: unknown[] = [];
    let idx = 1;
    const where: string[] = [`p.status = 'published'`];

    if (query.category) {
      where.push(`p.category = $${idx++}`);
      params.push(query.category);
    }
    if (query.difficulty) {
      where.push(`p.difficulty = $${idx++}`);
      params.push(query.difficulty);
    }
    if (query.tag?.trim()) {
      where.push(`$${idx} = ANY(p.tags)`);
      params.push(query.tag.trim());
      idx += 1;
    }
    if (query.authorId) {
      where.push(`p.author_user_id = $${idx++}`);
      params.push(query.authorId);
    }
    if (query.favoritedByMe) {
      if (!viewerId) {
        return { items: [], total: 0, page, pageSize, sort };
      }
      where.push(
        `EXISTS (SELECT 1 FROM template_share_favorites fav WHERE fav.post_id = p.id AND fav.user_id = $${idx++})`
      );
      params.push(viewerId);
    }

    const search = buildSearchFilter(query.q, params, idx);
    idx = search.nextIdx;

    const whereSql = where.join(' AND ') + search.clause;
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM template_share_posts p
       WHERE ${whereSql}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10) || 0;

    const flags = viewerFlagsSelect(viewerId, idx);
    const limitIdx = flags.nextIdx;
    const offsetIdx = flags.nextIdx + 1;
    const listParams = [...params, ...flags.params, pageSize, (page - 1) * pageSize];

    const result = await pool.query<PostRow>(
      `SELECT p.*, ${AUTHOR_NAME_SQL} AS author_name, ${flags.sql}
       FROM template_share_posts p
       JOIN users u ON u.id = p.author_user_id
       WHERE ${whereSql}
       ORDER BY ${sortSql(sort)}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams
    );

    return {
      items: result.rows.map(mapListItem),
      total,
      page,
      pageSize,
      sort,
    };
  },

  async getById(
    id: string,
    viewerId?: string,
    options?: { forAdmin?: boolean }
  ): Promise<TemplateShareDetail | null> {
    const pool = requirePool();
    const flags = viewerFlagsSelect(viewerId, 2);
    const params: unknown[] = [id, ...flags.params];
    const statusFilter = options?.forAdmin ? '' : ` AND p.status = 'published'`;

    const result = await pool.query<PostRow>(
      `SELECT p.*, ${AUTHOR_NAME_SQL} AS author_name, ${flags.sql}
       FROM template_share_posts p
       JOIN users u ON u.id = p.author_user_id
       WHERE p.id = $1${statusFilter}`,
      params
    );
    const row = result.rows[0];
    return row ? mapDetail(row) : null;
  },

  async getRawPost(id: string): Promise<{
    id: string;
    authorUserId: string;
    sourceTemplateId: string | null;
    title: string;
    description: string;
    status: TemplateShareStatus;
    payload: WorkoutCardTemplateItem[];
    authorName: string;
  } | null> {
    const pool = requirePool();
    const result = await pool.query<PostRow>(
      `SELECT p.*, ${AUTHOR_NAME_SQL} AS author_name
       FROM template_share_posts p
       JOIN users u ON u.id = p.author_user_id
       WHERE p.id = $1`,
      [id]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      authorUserId: row.author_user_id,
      sourceTemplateId: row.source_template_id,
      title: row.title,
      description: row.description ?? '',
      status: row.status as TemplateShareStatus,
      payload: parsePayload(row.payload),
      authorName: row.author_name?.trim() || 'User',
    };
  },

  async publish(
    userId: string,
    input: PublishTemplateShareInput,
    frozen: {
      payload: WorkoutCardTemplateItem[];
      sourceTemplateId: string;
    }
  ): Promise<TemplateShareDetail> {
    const pool = requirePool();
    const result = await pool.query<PostRow>(
      `INSERT INTO template_share_posts (
         author_user_id, source_template_id, title, description, category, difficulty,
         tags, thumbnail_url, payload, status, published_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8, $9::jsonb, 'published', NOW())
       ON CONFLICT (source_template_id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         difficulty = EXCLUDED.difficulty,
         tags = EXCLUDED.tags,
         thumbnail_url = EXCLUDED.thumbnail_url,
         payload = EXCLUDED.payload,
         status = 'published',
         published_at = CASE
           WHEN template_share_posts.status = 'published' THEN template_share_posts.published_at
           ELSE NOW()
         END,
         updated_at = NOW()
       WHERE template_share_posts.author_user_id = $1
       RETURNING *`,
      [
        userId,
        frozen.sourceTemplateId,
        input.title,
        input.description ?? '',
        input.category,
        input.difficulty,
        input.tags ?? [],
        input.thumbnailUrl ?? null,
        JSON.stringify(frozen.payload),
      ]
    );
    const row = result.rows[0];
    if (!row) {
      throw new AppError(
        403,
        'SHARE_NOT_ALLOWED',
        'Cannot publish: template share post is owned by another user'
      );
    }
    const author = await pool.query<{ author_name: string }>(
      `SELECT ${AUTHOR_NAME_SQL} AS author_name FROM users u WHERE u.id = $1`,
      [userId]
    );
    row.author_name = author.rows[0]?.author_name ?? 'User';
    return mapDetail(row);
  },

  async update(
    id: string,
    userId: string,
    input: UpdateTemplateShareInput
  ): Promise<TemplateShareDetail | null> {
    const pool = requirePool();
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (input.title !== undefined) {
      sets.push(`title = $${idx++}`);
      params.push(input.title);
    }
    if (input.description !== undefined) {
      sets.push(`description = $${idx++}`);
      params.push(input.description);
    }
    if (input.category !== undefined) {
      sets.push(`category = $${idx++}`);
      params.push(input.category);
    }
    if (input.difficulty !== undefined) {
      sets.push(`difficulty = $${idx++}`);
      params.push(input.difficulty);
    }
    if (input.tags !== undefined) {
      sets.push(`tags = $${idx++}::text[]`);
      params.push(input.tags);
    }
    if (input.thumbnailUrl !== undefined) {
      sets.push(`thumbnail_url = $${idx++}`);
      params.push(input.thumbnailUrl);
    }
    if (input.status !== undefined) {
      sets.push(`status = $${idx++}`);
      params.push(input.status);
    }

    if (sets.length === 0) {
      return this.getById(id, userId, { forAdmin: true });
    }

    sets.push('updated_at = NOW()');
    params.push(id, userId);
    const result = await pool.query<PostRow>(
      `UPDATE template_share_posts
       SET ${sets.join(', ')}
       WHERE id = $${idx} AND author_user_id = $${idx + 1}
         AND status <> 'removed'
       RETURNING *`,
      params
    );
    const row = result.rows[0];
    if (!row) return null;
    const author = await pool.query<{ author_name: string }>(
      `SELECT ${AUTHOR_NAME_SQL} AS author_name FROM users u WHERE u.id = $1`,
      [userId]
    );
    row.author_name = author.rows[0]?.author_name ?? 'User';
    return mapDetail(row);
  },

  async adminUpdateStatus(
    id: string,
    status: TemplateShareStatus
  ): Promise<TemplateShareDetail | null> {
    const pool = requirePool();
    const result = await pool.query<PostRow>(
      `UPDATE template_share_posts
       SET status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status]
    );
    const row = result.rows[0];
    if (!row) return null;
    const author = await pool.query<{ author_name: string }>(
      `SELECT ${AUTHOR_NAME_SQL} AS author_name FROM users u WHERE u.id = $1`,
      [row.author_user_id]
    );
    row.author_name = author.rows[0]?.author_name ?? 'User';
    return mapDetail(row);
  },

  async adminList(query: TemplateShareAdminListQuery): Promise<{
    items: TemplateShareListItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const pool = requirePool();
    const params: unknown[] = [];
    let idx = 1;
    const where: string[] = ['TRUE'];

    if (query.status) {
      where.push(`p.status = $${idx++}`);
      params.push(query.status);
    }
    const search = buildSearchFilter(query.q, params, idx);
    idx = search.nextIdx;

    const whereSql = where.join(' AND ') + search.clause;
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM template_share_posts p WHERE ${whereSql}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10) || 0;
    const listParams = [...params, query.pageSize, (query.page - 1) * query.pageSize];

    const result = await pool.query<PostRow>(
      `SELECT p.*, ${AUTHOR_NAME_SQL} AS author_name
       FROM template_share_posts p
       JOIN users u ON u.id = p.author_user_id
       WHERE ${whereSql}
       ORDER BY p.updated_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      listParams
    );

    return {
      items: result.rows.map(mapListItem),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  async recordView(postId: string, viewerKey: string): Promise<boolean> {
    const pool = requirePool();
    const cutoff = new Date(Date.now() - TEMPLATE_SHARE_VIEW_DEDUPE_MS).toISOString();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query<{ viewed_at: Date | string }>(
        `SELECT viewed_at FROM template_share_views
         WHERE post_id = $1 AND viewer_key = $2
         FOR UPDATE`,
        [postId, viewerKey]
      );
      const last = existing.rows[0]?.viewed_at;
      if (last && new Date(last).toISOString() > cutoff) {
        await client.query('COMMIT');
        return false;
      }
      await client.query(
        `INSERT INTO template_share_views (post_id, viewer_key, viewed_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (post_id, viewer_key)
         DO UPDATE SET viewed_at = NOW()`,
        [postId, viewerKey]
      );
      await client.query(
        `UPDATE template_share_posts SET view_count = view_count + 1 WHERE id = $1`,
        [postId]
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

  async download(
    postId: string,
    userId: string
  ): Promise<TemplateShareDownloadResult> {
    const pool = requirePool();
    const existing = await pool.query<{ copied_template_id: string | null }>(
      `SELECT copied_template_id FROM template_share_downloads
       WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );
    if (existing.rows[0]?.copied_template_id) {
      return {
        templateId: existing.rows[0].copied_template_id,
        postId,
        alreadyOwned: true,
      };
    }

    const post = await this.getRawPost(postId);
    if (!post || post.status !== 'published') {
      throw new AppError(404, 'NOT_FOUND', 'Share post not found');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const race = await client.query<{ copied_template_id: string | null }>(
        `SELECT copied_template_id FROM template_share_downloads
         WHERE post_id = $1 AND user_id = $2
         FOR UPDATE`,
        [postId, userId]
      );
      if (race.rows[0]?.copied_template_id) {
        await client.query('COMMIT');
        return {
          templateId: race.rows[0].copied_template_id,
          postId,
          alreadyOwned: true,
        };
      }

      const insertTpl = await client.query<{ id: string }>(
        `INSERT INTO workout_card_templates (
           user_id, gym_id, name, payload,
           is_original, original_template_id, source_template_id, source_share_post_id,
           origin_author_name, origin_title
         )
         VALUES ($1, NULL, $2, $3::jsonb, FALSE, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          userId,
          post.title,
          JSON.stringify(post.payload),
          post.sourceTemplateId,
          post.sourceTemplateId,
          post.id,
          post.authorName,
          post.title,
        ]
      );
      const templateId = insertTpl.rows[0]?.id;
      if (!templateId) throw new Error('Failed to copy template');

      await client.query(
        `INSERT INTO template_share_downloads (post_id, user_id, copied_template_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (post_id, user_id) DO NOTHING`,
        [postId, userId, templateId]
      );

      const confirmed = await client.query<{ copied_template_id: string | null }>(
        `SELECT copied_template_id FROM template_share_downloads
         WHERE post_id = $1 AND user_id = $2`,
        [postId, userId]
      );
      const ownedId = confirmed.rows[0]?.copied_template_id ?? templateId;

      if (ownedId === templateId) {
        await client.query(
          `UPDATE template_share_posts
           SET download_count = download_count + 1, updated_at = NOW()
           WHERE id = $1`,
          [postId]
        );
      } else {
        // Lost race: another insert won UNIQUE; drop orphan copy
        await client.query(`DELETE FROM workout_card_templates WHERE id = $1`, [
          templateId,
        ]);
        await client.query('COMMIT');
        return { templateId: ownedId, postId, alreadyOwned: true };
      }

      await client.query('COMMIT');
      return { templateId: ownedId, postId, alreadyOwned: false };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  },

  async toggleLike(
    postId: string,
    userId: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    const pool = requirePool();
    const post = await pool.query(`SELECT id FROM template_share_posts WHERE id = $1 AND status = 'published'`, [
      postId,
    ]);
    if (!post.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Share post not found');

    const liked = await pool.query(
      `SELECT 1 FROM template_share_likes WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );
    if (liked.rowCount) {
      await pool.query(
        `DELETE FROM template_share_likes WHERE post_id = $1 AND user_id = $2`,
        [postId, userId]
      );
      await pool.query(
        `UPDATE template_share_posts
         SET like_count = GREATEST(like_count - 1, 0), updated_at = NOW()
         WHERE id = $1`,
        [postId]
      );
    } else {
      await pool.query(
        `INSERT INTO template_share_likes (post_id, user_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [postId, userId]
      );
      await pool.query(
        `UPDATE template_share_posts
         SET like_count = like_count + 1, updated_at = NOW()
         WHERE id = $1`,
        [postId]
      );
    }
    const count = await pool.query<{ like_count: number }>(
      `SELECT like_count FROM template_share_posts WHERE id = $1`,
      [postId]
    );
    return {
      liked: !liked.rowCount,
      likeCount: count.rows[0]?.like_count ?? 0,
    };
  },

  async toggleFavorite(
    postId: string,
    userId: string
  ): Promise<{ favorited: boolean; favoriteCount: number }> {
    const pool = requirePool();
    const post = await pool.query(
      `SELECT id FROM template_share_posts WHERE id = $1 AND status = 'published'`,
      [postId]
    );
    if (!post.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Share post not found');

    const fav = await pool.query(
      `SELECT 1 FROM template_share_favorites WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );
    if (fav.rowCount) {
      await pool.query(
        `DELETE FROM template_share_favorites WHERE post_id = $1 AND user_id = $2`,
        [postId, userId]
      );
      await pool.query(
        `UPDATE template_share_posts
         SET favorite_count = GREATEST(favorite_count - 1, 0), updated_at = NOW()
         WHERE id = $1`,
        [postId]
      );
    } else {
      await pool.query(
        `INSERT INTO template_share_favorites (post_id, user_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [postId, userId]
      );
      await pool.query(
        `UPDATE template_share_posts
         SET favorite_count = favorite_count + 1, updated_at = NOW()
         WHERE id = $1`,
        [postId]
      );
    }
    const count = await pool.query<{ favorite_count: number }>(
      `SELECT favorite_count FROM template_share_posts WHERE id = $1`,
      [postId]
    );
    return {
      favorited: !fav.rowCount,
      favoriteCount: count.rows[0]?.favorite_count ?? 0,
    };
  },

  async listComments(
    postId: string,
    viewerId?: string
  ): Promise<TemplateShareComment[]> {
    const pool = requirePool();
    const result = await pool.query<CommentRow>(
      `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, c.updated_at,
              ${AUTHOR_NAME_SQL} AS author_name
       FROM template_share_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`,
      [postId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      authorName: row.author_name?.trim() || 'User',
      content: row.content,
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      canEdit: Boolean(viewerId && viewerId === row.user_id),
      canDelete: Boolean(viewerId && viewerId === row.user_id),
    }));
  },

  async createComment(
    postId: string,
    userId: string,
    content: string
  ): Promise<TemplateShareComment> {
    const pool = requirePool();
    const post = await pool.query(
      `SELECT id FROM template_share_posts WHERE id = $1 AND status = 'published'`,
      [postId]
    );
    if (!post.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Share post not found');

    const result = await pool.query<CommentRow>(
      `INSERT INTO template_share_comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, post_id, user_id, content, created_at, updated_at`,
      [postId, userId, content]
    );
    await pool.query(
      `UPDATE template_share_posts
       SET comment_count = comment_count + 1, updated_at = NOW()
       WHERE id = $1`,
      [postId]
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to create comment');
    const author = await pool.query<{ author_name: string }>(
      `SELECT ${AUTHOR_NAME_SQL} AS author_name FROM users u WHERE u.id = $1`,
      [userId]
    );
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      authorName: author.rows[0]?.author_name ?? 'User',
      content: row.content,
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      canEdit: true,
      canDelete: true,
    };
  },

  async updateComment(
    postId: string,
    commentId: string,
    userId: string,
    content: string
  ): Promise<TemplateShareComment | null> {
    const pool = requirePool();
    const result = await pool.query<CommentRow>(
      `UPDATE template_share_comments
       SET content = $4, updated_at = NOW()
       WHERE id = $2 AND post_id = $1 AND user_id = $3 AND deleted_at IS NULL
       RETURNING id, post_id, user_id, content, created_at, updated_at`,
      [postId, commentId, userId, content]
    );
    const row = result.rows[0];
    if (!row) return null;
    const author = await pool.query<{ author_name: string }>(
      `SELECT ${AUTHOR_NAME_SQL} AS author_name FROM users u WHERE u.id = $1`,
      [userId]
    );
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      authorName: author.rows[0]?.author_name ?? 'User',
      content: row.content,
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      canEdit: true,
      canDelete: true,
    };
  },

  async softDeleteComment(
    postId: string,
    commentId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<boolean> {
    const pool = requirePool();
    const result = await pool.query(
      isAdmin
        ? `UPDATE template_share_comments
           SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = $2 AND post_id = $1 AND deleted_at IS NULL
           RETURNING id`
        : `UPDATE template_share_comments
           SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = $2 AND post_id = $1 AND user_id = $3 AND deleted_at IS NULL
           RETURNING id`,
      isAdmin ? [postId, commentId] : [postId, commentId, userId]
    );
    if ((result.rowCount ?? 0) === 0) return false;
    await pool.query(
      `UPDATE template_share_posts
       SET comment_count = GREATEST(comment_count - 1, 0), updated_at = NOW()
       WHERE id = $1`,
      [postId]
    );
    return true;
  },

  /**
   * Record one usage event per (post, user, userTemplate, date).
   * Increments use_count only when a new row is inserted.
   */
  async recordUsage(input: {
    postId: string;
    userId: string;
    userTemplateId: string;
    workoutLogId?: string | null;
    usedOnDate: string;
  }): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;

    const result = await pool.query<{ id: string }>(
      `INSERT INTO template_share_usage_events (
         post_id, user_id, user_template_id, workout_log_id, used_on_date
       )
       VALUES ($1, $2, $3, $4, $5::date)
       ON CONFLICT (post_id, user_id, user_template_id, used_on_date) DO NOTHING
       RETURNING id`,
      [
        input.postId,
        input.userId,
        input.userTemplateId,
        input.workoutLogId ?? null,
        input.usedOnDate,
      ]
    );
    if ((result.rowCount ?? 0) === 0) return false;

    await pool.query(
      `UPDATE template_share_posts
       SET use_count = use_count + 1, updated_at = NOW()
       WHERE id = $1`,
      [input.postId]
    );
    return true;
  },

  async createReport(input: {
    postId: string;
    commentId?: string;
    reporterUserId: string;
    reason: string;
    description: string;
  }): Promise<TemplateShareReport> {
    const pool = requirePool();
    const result = await pool.query<ReportRow>(
      `INSERT INTO template_share_reports (
         post_id, comment_id, reporter_user_id, reason, description
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, post_id, comment_id, reporter_user_id, reason, description, status, created_at`,
      [
        input.postId,
        input.commentId ?? null,
        input.reporterUserId,
        input.reason,
        input.description ?? '',
      ]
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to create report');
    return {
      id: row.id,
      postId: row.post_id,
      commentId: row.comment_id,
      reason: row.reason,
      description: row.description ?? '',
      status: row.status as TemplateShareReportStatus,
      reporterUserId: row.reporter_user_id,
      createdAt: toIso(row.created_at),
    };
  },

  async listReports(status?: TemplateShareReportStatus): Promise<TemplateShareReport[]> {
    const pool = requirePool();
    const params: unknown[] = [];
    let where = '';
    if (status) {
      where = ' WHERE r.status = $1';
      params.push(status);
    }
    const result = await pool.query<ReportRow>(
      `SELECT r.id, r.post_id, r.comment_id, r.reporter_user_id, r.reason, r.description,
              r.status, r.created_at, p.title AS post_title
       FROM template_share_reports r
       LEFT JOIN template_share_posts p ON p.id = r.post_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT 200`,
      params
    );
    return result.rows.map((row) => ({
      id: row.id,
      postId: row.post_id,
      commentId: row.comment_id,
      postTitle: row.post_title ?? undefined,
      reason: row.reason,
      description: row.description ?? '',
      status: row.status as TemplateShareReportStatus,
      reporterUserId: row.reporter_user_id,
      createdAt: toIso(row.created_at),
    }));
  },

  async resolveReport(
    reportId: string,
    status: TemplateShareReportStatus,
    resolvedBy: string
  ): Promise<TemplateShareReport | null> {
    const pool = requirePool();
    const result = await pool.query<ReportRow>(
      `UPDATE template_share_reports
       SET status = $2,
           resolved_at = NOW(),
           resolved_by = $3
       WHERE id = $1
       RETURNING id, post_id, comment_id, reporter_user_id, reason, description, status, created_at`,
      [reportId, status, resolvedBy]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      postId: row.post_id,
      commentId: row.comment_id,
      reason: row.reason,
      description: row.description ?? '',
      status: row.status as TemplateShareReportStatus,
      reporterUserId: row.reporter_user_id,
      createdAt: toIso(row.created_at),
    };
  },

  async adminStats(): Promise<TemplateShareAdminStats> {
    const pool = requirePool();
    const result = await pool.query<{
      total_published: string;
      total_hidden: string;
      total_downloads: string;
      total_uses: string;
      total_likes: string;
      total_comments: string;
      open_reports: string;
    }>(
      `SELECT
         (SELECT COUNT(*)::text FROM template_share_posts WHERE status = 'published') AS total_published,
         (SELECT COUNT(*)::text FROM template_share_posts WHERE status = 'hidden') AS total_hidden,
         (SELECT COALESCE(SUM(download_count), 0)::text FROM template_share_posts) AS total_downloads,
         (SELECT COALESCE(SUM(use_count), 0)::text FROM template_share_posts) AS total_uses,
         (SELECT COALESCE(SUM(like_count), 0)::text FROM template_share_posts) AS total_likes,
         (SELECT COALESCE(SUM(comment_count), 0)::text FROM template_share_posts) AS total_comments,
         (SELECT COUNT(*)::text FROM template_share_reports WHERE status = 'open') AS open_reports`
    );
    const row = result.rows[0];
    return {
      totalPublished: parseInt(row?.total_published ?? '0', 10) || 0,
      totalHidden: parseInt(row?.total_hidden ?? '0', 10) || 0,
      totalDownloads: parseInt(row?.total_downloads ?? '0', 10) || 0,
      totalUses: parseInt(row?.total_uses ?? '0', 10) || 0,
      totalLikes: parseInt(row?.total_likes ?? '0', 10) || 0,
      totalComments: parseInt(row?.total_comments ?? '0', 10) || 0,
      openReports: parseInt(row?.open_reports ?? '0', 10) || 0,
    };
  },
};
