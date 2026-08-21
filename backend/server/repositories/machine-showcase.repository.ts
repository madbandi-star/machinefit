import { randomUUID } from 'node:crypto';
import {
  hasMinRole,
  isRoleCode,
  Role,
  type AdminMachineRarityListQuery,
  type AdminMachineRarityPatch,
  type AdminMachineShowcasePostPatch,
  type ClaimGymMachineInput,
  type CreateMachineShowcaseCommentInput,
  type CreateMachineShowcasePostInput,
  type CreateMachineShowcaseReportInput,
  type MachineDexEntry,
  type MachineDexSummary,
  type MachineGymsResponse,
  type MachineRarityAdmin,
  type MachineRarityGrade,
  type MachineRarityPublic,
  type MachineShowcaseComment,
  type MachineShowcaseImageMeta,
  type MachineShowcaseListQuery,
  type MachineShowcasePost,
  type MachineShowcasePostDetail,
  type MachineShowcaseReport,
  type RoleCode,
  type UpdateMachineShowcaseCommentInput,
  type UpdateMachineShowcasePostInput,
  type UserGymHoldingsSummary,
  MACHINE_RARITY_GRADES,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { pickLocalized } from '../utils/localize.util.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import { showcaseImageUrl } from '../utils/public-api-base.js';

const VISIBLE = `p.deleted_at IS NULL AND p.is_hidden = FALSE AND p.status = 'published'`;

type ProcessedImage = {
  buffer: Buffer;
  thumb: Buffer;
  mimeType: string;
  width: number;
  height: number;
  fileSizeBytes: number;
};

type PostRow = {
  id: string;
  user_id: string;
  machine_id: string;
  user_gym_id: string | null;
  gym_id: string | null;
  caption: string;
  tags: string[] | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  bookmark_count: number;
  created_at: string;
  updated_at: string;
  display_name: string | null;
  role_code: string | null;
  machine_code: string;
  machine_name: Record<string, string> | null;
  muscle_group: string | null;
  brand_code: string | null;
  brand_name: Record<string, string> | null;
  user_gym_name: string | null;
  gym_name: string | null;
  gym_city: string | null;
  rarity_grade: MachineRarityGrade | null;
  rarity_score: number | null;
  rarity_gyms: number | null;
  rarity_posts: number | null;
  rarity_discoveries: number | null;
  cover_id: string | null;
  cover_mime: string | null;
  cover_width: number | null;
  cover_height: number | null;
  discovery_rank: number | null;
  liked_by_me?: boolean | null;
  bookmarked_by_me?: boolean | null;
};

function mapRarity(row: PostRow): MachineRarityPublic {
  return {
    machineId: row.machine_id,
    machineCode: row.machine_code,
    grade: row.rarity_grade ?? 'COMMON',
    score: row.rarity_score ?? 0,
    gymHoldingCount: row.rarity_gyms ?? 0,
    postCount: row.rarity_posts ?? 0,
    discoveryCount: row.rarity_discoveries ?? 0,
  };
}

function mapCover(row: PostRow): MachineShowcaseImageMeta | undefined {
  if (!row.cover_id) return undefined;
  return {
    id: row.cover_id,
    postId: row.id,
    sortOrder: 0,
    mimeType: row.cover_mime ?? 'image/webp',
    width: row.cover_width ?? undefined,
    height: row.cover_height ?? undefined,
    thumbUrl: showcaseImageUrl(row.cover_id, 'thumb'),
    mainUrl: showcaseImageUrl(row.cover_id, 'main'),
  };
}

function mapPost(row: PostRow, locale = 'ko', images?: MachineShowcaseImageMeta[]): MachineShowcasePost {
  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.display_name ?? undefined,
    authorRoleCode: isRoleCode(row.role_code) ? row.role_code : undefined,
    machineId: row.machine_id,
    machineCode: row.machine_code,
    machineName:
      pickLocalized(row.machine_name, locale) ?? row.machine_code,
    brandCode: row.brand_code ?? undefined,
    brandName: row.brand_name ? pickLocalized(row.brand_name, locale) : undefined,
    muscleGroup: row.muscle_group ?? undefined,
    userGymId: row.user_gym_id ?? undefined,
    userGymName: row.user_gym_name ?? undefined,
    gymId: row.gym_id ?? undefined,
    gymName: row.gym_name ?? undefined,
    gymCity: row.gym_city ?? undefined,
    caption: row.caption ?? '',
    tags: row.tags ?? [],
    viewCount: row.view_count,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    bookmarkCount: row.bookmark_count,
    likedByMe: row.liked_by_me ?? undefined,
    bookmarkedByMe: row.bookmarked_by_me ?? undefined,
    coverImage: mapCover(row),
    images,
    rarity: mapRarity(row),
    discoveryRank: row.discovery_rank,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const POST_FROM = `
  FROM machine_showcase_posts p
  JOIN users u ON u.id = p.user_id
  JOIN roles r ON r.id = u.role_id
  JOIN machines m ON m.id = p.machine_id
  LEFT JOIN brands b ON b.id = m.brand_id
  LEFT JOIN user_gyms ug ON ug.id = p.user_gym_id
  LEFT JOIN gyms g ON g.id = p.gym_id
  LEFT JOIN machine_rarity mr ON mr.machine_id = p.machine_id
  LEFT JOIN LATERAL (
    SELECT id, mime_type, width, height
    FROM machine_showcase_images
    WHERE post_id = p.id
    ORDER BY sort_order ASC
    LIMIT 1
  ) img ON TRUE
  LEFT JOIN machine_discoveries md
    ON md.machine_id = p.machine_id AND md.user_id = p.user_id
`;

const POST_SELECT = `
  p.id, p.user_id, p.machine_id, p.user_gym_id, p.gym_id, p.caption, p.tags,
  p.view_count, p.like_count, p.comment_count, p.bookmark_count,
  p.created_at::text, p.updated_at::text,
  u.display_name, r.code AS role_code,
  m.code AS machine_code, m.name AS machine_name, m.muscle_group,
  b.code AS brand_code, b.name AS brand_name,
  ug.name AS user_gym_name,
  g.name AS gym_name, g.city AS gym_city,
  COALESCE(mr.grade, 'COMMON') AS rarity_grade,
  COALESCE(mr.score, 0) AS rarity_score,
  COALESCE(mr.gym_holding_count, 0) AS rarity_gyms,
  COALESCE(mr.post_count, 0) AS rarity_posts,
  COALESCE(mr.discovery_count, 0) AS rarity_discoveries,
  img.id::text AS cover_id, img.mime_type AS cover_mime, img.width AS cover_width, img.height AS cover_height,
  md.discovery_rank
`;

function regionBucket(city: string | null | undefined): string {
  const c = (city ?? '').trim();
  if (!c) return '기타';
  const rules: Array<[RegExp, string]> = [
    [/서울|Seoul/i, '서울'],
    [/경기|Gyeonggi/i, '경기'],
    [/인천|Incheon/i, '인천'],
    [/부산|Busan/i, '부산'],
    [/대구|Daegu/i, '대구'],
    [/광주|Gwangju/i, '광주'],
    [/대전|Daejeon/i, '대전'],
    [/울산|Ulsan/i, '울산'],
    [/세종|Sejong/i, '세종'],
    [/강원|Gangwon/i, '강원'],
    [/충북|Chungbuk|North Chungcheong/i, '충북'],
    [/충남|Chungnam|South Chungcheong/i, '충남'],
    [/전북|Jeonbuk/i, '전북'],
    [/전남|Jeonnam/i, '전남'],
    [/경북|Gyeongbuk/i, '경북'],
    [/경남|Gyeongnam/i, '경남'],
    [/제주|Jeju/i, '제주'],
  ];
  for (const [re, label] of rules) {
    if (re.test(c)) return label;
  }
  return c;
}

export const machineShowcaseRepository = {
  async list(query: MachineShowcaseListQuery, viewerId?: string, locale = 'ko') {
    const pool = getPool();
    if (!pool) {
      return { items: [] as MachineShowcasePost[], meta: buildPaginationMeta(query.page, query.limit, 0) };
    }

    const page = query.page;
    const limit = query.limit;
    const conditions = [VISIBLE];
    const params: unknown[] = [];
    let idx = 1;

    const tab = query.tab;
    const sort = query.sort ?? (tab === 'popular' ? 'popular' : 'latest');

    if (query.mine && viewerId) {
      conditions.push(`p.user_id = $${idx++}`);
      params.push(viewerId);
    }
    if (query.bookmarkedByMe && viewerId) {
      conditions.push(
        `EXISTS (SELECT 1 FROM machine_showcase_bookmarks bmk WHERE bmk.post_id = p.id AND bmk.user_id = $${idx++})`
      );
      params.push(viewerId);
    }
    if (query.machineCode) {
      conditions.push(`m.code = $${idx++}`);
      params.push(query.machineCode);
    }
    if (query.gymId) {
      conditions.push(`p.gym_id = $${idx++}`);
      params.push(query.gymId);
    }
    if (query.userGymId) {
      conditions.push(`p.user_gym_id = $${idx++}`);
      params.push(query.userGymId);
    }
    if (query.grade) {
      conditions.push(`COALESCE(mr.grade, 'COMMON') = $${idx++}`);
      params.push(query.grade);
    }
    if (query.tag) {
      conditions.push(`$${idx++} = ANY(p.tags)`);
      params.push(query.tag);
    }
    if (query.q) {
      conditions.push(
        `(p.caption ILIKE $${idx} OR m.code ILIKE $${idx} OR m.name::text ILIKE $${idx} OR COALESCE(b.name::text,'') ILIKE $${idx} OR u.display_name ILIKE $${idx} OR COALESCE(g.name,'') ILIKE $${idx} OR COALESCE(ug.name,'') ILIKE $${idx} OR COALESCE(array_to_string(p.tags, ' '), '') ILIKE $${idx})`
      );
      params.push(`%${query.q}%`);
      idx += 1;
    }
    if (tab === 'myGym') {
      if (!viewerId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      conditions.push(
        `p.user_gym_id IN (SELECT id FROM user_gyms WHERE user_id = $${idx++})`
      );
      params.push(viewerId);
    }

    let distanceSelect = '';
    let orderSql =
      sort === 'popular' ? 'p.like_count DESC, p.created_at DESC' : 'p.created_at DESC';

    if (tab === 'nearby') {
      if (query.lat == null || query.lng == null) {
        return { items: [], meta: buildPaginationMeta(page, limit, 0), locationRequired: true as const };
      }
      conditions.push(`g.latitude IS NOT NULL AND g.longitude IS NOT NULL`);
      const radius = query.radiusKm ?? 15;
      params.push(query.lat, query.lng, radius);
      const latP = idx;
      const lngP = idx + 1;
      const radP = idx + 2;
      idx += 3;
      distanceSelect = `,
        (6371 * acos(LEAST(1::float8, GREATEST(-1::float8,
          cos(radians($${latP}::float8)) * cos(radians(g.latitude))
          * cos(radians(g.longitude) - radians($${lngP}::float8))
          + sin(radians($${latP}::float8)) * sin(radians(g.latitude))
        )))) AS distance_km`;
      conditions.push(`(
        6371 * acos(LEAST(1::float8, GREATEST(-1::float8,
          cos(radians($${latP}::float8)) * cos(radians(g.latitude))
          * cos(radians(g.longitude) - radians($${lngP}::float8))
          + sin(radians($${latP}::float8)) * sin(radians(g.latitude))
        )))
      ) <= $${radP}`);
      orderSql = 'distance_km ASC, p.created_at DESC';
    }

    const viewerSelect = viewerId
      ? `, EXISTS (SELECT 1 FROM machine_showcase_likes l WHERE l.post_id = p.id AND l.user_id = $${idx}) AS liked_by_me
         , EXISTS (SELECT 1 FROM machine_showcase_bookmarks bmk WHERE bmk.post_id = p.id AND bmk.user_id = $${idx}) AS bookmarked_by_me`
      : ', FALSE AS liked_by_me, FALSE AS bookmarked_by_me';

    const where = `WHERE ${conditions.join(' AND ')}`;
    const listParams = viewerId
      ? [...params, viewerId, limit, (page - 1) * limit]
      : [...params, limit, (page - 1) * limit];
    const viewerParamOffset = viewerId ? 1 : 0;
    const limitIdx = params.length + viewerParamOffset + 1;
    const offsetIdx = limitIdx + 1;

    const [countResult, result] = await Promise.all([
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count ${POST_FROM} ${where}`,
        params
      ),
      pool.query<PostRow>(
        `SELECT ${POST_SELECT}${viewerSelect}${distanceSelect}
         ${POST_FROM}
         ${where}
         ORDER BY ${orderSql}
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        listParams
      ),
    ]);

    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);
    return {
      items: result.rows.map((row) => mapPost(row, locale)),
      meta: buildPaginationMeta(page, limit, total),
    };
  },

  async getById(
    postId: string,
    viewerId?: string,
    options?: { incrementView?: boolean; locale?: string }
  ): Promise<MachineShowcasePostDetail> {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    if (options?.incrementView) {
      await pool.query(
        `UPDATE machine_showcase_posts SET view_count = view_count + 1 WHERE id = $1 AND ${VISIBLE.replace(/p\./g, '')}`,
        [postId]
      );
    }

    const viewerSelect = viewerId
      ? `, EXISTS (SELECT 1 FROM machine_showcase_likes l WHERE l.post_id = p.id AND l.user_id = $2) AS liked_by_me
         , EXISTS (SELECT 1 FROM machine_showcase_bookmarks bmk WHERE bmk.post_id = p.id AND bmk.user_id = $2) AS bookmarked_by_me`
      : ', FALSE AS liked_by_me, FALSE AS bookmarked_by_me';

    const postResult = await pool.query<PostRow>(
      `SELECT ${POST_SELECT}${viewerSelect}
       ${POST_FROM}
       WHERE p.id = $1 AND ${VISIBLE}`,
      viewerId ? [postId, viewerId] : [postId]
    );
    const row = postResult.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Post not found');

    const [imagesResult, commentsResult] = await Promise.all([
      pool.query<{
        id: string;
        post_id: string;
        sort_order: number;
        mime_type: string;
        width: number | null;
        height: number | null;
      }>(
        `SELECT id::text, post_id::text, sort_order, mime_type, width, height
         FROM machine_showcase_images WHERE post_id = $1 ORDER BY sort_order ASC`,
        [postId]
      ),
      pool.query<{
        id: string;
        post_id: string;
        user_id: string;
        parent_id: string | null;
        content: string;
        display_name: string | null;
        role_code: string | null;
        created_at: string;
        updated_at: string;
      }>(
        `SELECT c.id::text, c.post_id::text, c.user_id::text, c.parent_id::text, c.content,
                u.display_name, r.code AS role_code, c.created_at::text, c.updated_at::text
         FROM machine_showcase_comments c
         JOIN users u ON u.id = c.user_id
         JOIN roles r ON r.id = u.role_id
         WHERE c.post_id = $1 AND c.deleted_at IS NULL AND c.is_hidden = FALSE
         ORDER BY c.created_at ASC`,
        [postId]
      ),
    ]);

    const images: MachineShowcaseImageMeta[] = imagesResult.rows.map((img) => ({
      id: img.id,
      postId: img.post_id,
      sortOrder: img.sort_order,
      mimeType: img.mime_type,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
      thumbUrl: showcaseImageUrl(img.id, 'thumb'),
      mainUrl: showcaseImageUrl(img.id, 'main'),
    }));

    const comments: MachineShowcaseComment[] = commentsResult.rows.map((c) => ({
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      parentId: c.parent_id ?? undefined,
      content: c.content,
      authorName: c.display_name ?? undefined,
      authorRoleCode: isRoleCode(c.role_code) ? c.role_code : undefined,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return {
      post: mapPost(row, options?.locale ?? 'ko', images),
      comments,
      discovery: row.discovery_rank
        ? { rank: row.discovery_rank, discoveredAt: row.created_at }
        : null,
    };
  },

  async createPost(
    userId: string,
    input: CreateMachineShowcasePostInput,
    images: ProcessedImage[],
    resolved: { machineId: string }
  ): Promise<string> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    if (input.userGymId) {
      const owned = await pool.query(
        `SELECT id FROM user_gyms WHERE id = $1 AND user_id = $2`,
        [input.userGymId, userId]
      );
      if (!owned.rows[0]) throw new AppError(403, 'FORBIDDEN', 'Not your gym');
    }

    const postId = randomUUID();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO machine_showcase_posts (
           id, user_id, machine_id, user_gym_id, gym_id, caption, tags, status
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,'published')`,
        [
          postId,
          userId,
          resolved.machineId,
          input.userGymId ?? null,
          input.gymId ?? null,
          input.caption ?? '',
          input.tags ?? [],
        ]
      );
      for (let i = 0; i < images.length; i += 1) {
        const img = images[i];
        await client.query(
          `INSERT INTO machine_showcase_images
             (post_id, sort_order, mime_type, width, height, file_size_bytes, image_data, thumbnail_data)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [postId, i, img.mimeType, img.width, img.height, img.fileSizeBytes, img.buffer, img.thumb]
        );
      }
      if (input.userGymId) {
        await client.query(
          `INSERT INTO user_gym_machines (user_gym_id, machine_id, source, claimed_by, source_post_id)
           VALUES ($1,$2,'post',$3,$4)
           ON CONFLICT (user_gym_id, machine_id) DO NOTHING`,
          [input.userGymId, resolved.machineId, userId, postId]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return postId;
  },

  async updatePost(
    postId: string,
    userId: string,
    role: RoleCode,
    input: UpdateMachineShowcasePostInput
  ) {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const existing = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM machine_showcase_posts WHERE id = $1 AND deleted_at IS NULL`,
      [postId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    if (existing.rows[0].user_id !== userId && !hasMinRole(role, Role.ADMIN)) {
      throw new AppError(403, 'FORBIDDEN', 'Not your post');
    }
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (input.caption !== undefined) {
      sets.push(`caption = $${idx++}`);
      params.push(input.caption);
    }
    if (input.tags !== undefined) {
      sets.push(`tags = $${idx++}`);
      params.push(input.tags);
    }
    if (!sets.length) return this.getById(postId, userId);
    params.push(postId);
    await pool.query(
      `UPDATE machine_showcase_posts SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
      params
    );
    return this.getById(postId, userId);
  },

  async deletePost(postId: string, userId: string, role: RoleCode): Promise<string> {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const existing = await pool.query<{ user_id: string; machine_id: string }>(
      `SELECT user_id, machine_id FROM machine_showcase_posts WHERE id = $1 AND deleted_at IS NULL`,
      [postId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    if (existing.rows[0].user_id !== userId && !hasMinRole(role, Role.ADMIN)) {
      throw new AppError(403, 'FORBIDDEN', 'Not your post');
    }
    await pool.query(
      `UPDATE machine_showcase_posts
       SET deleted_at = NOW(), is_hidden = TRUE, status = 'deleted', updated_at = NOW()
       WHERE id = $1`,
      [postId]
    );
    return existing.rows[0].machine_id;
  },

  async getImageMeta(imageId: string, variant: 'main' | 'thumb') {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{
      mime_type: string;
      file_size_bytes: number | null;
      updated_at: Date;
      is_hidden: boolean;
      has_blob: boolean;
    }>(
      `SELECT i.mime_type, i.file_size_bytes, i.updated_at, p.is_hidden,
              (${variant === 'thumb' ? 'i.thumbnail_data' : 'i.image_data'} IS NOT NULL) AS has_blob
       FROM machine_showcase_images i
       JOIN machine_showcase_posts p ON p.id = i.post_id
       WHERE i.id = $1 AND p.deleted_at IS NULL`,
      [imageId]
    );
    const row = result.rows[0];
    if (!row || row.is_hidden || !row.has_blob) return null;
    const stamp = row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at);
    return {
      mimeType: row.mime_type,
      etagToken: `${imageId}-${variant}-${row.file_size_bytes ?? 0}-${stamp}`,
    };
  },

  async getImageBinary(imageId: string, variant: 'main' | 'thumb') {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Image not found');
    const result = await pool.query<{
      mime_type: string;
      image_data: Buffer;
      thumbnail_data: Buffer;
      is_hidden: boolean;
    }>(
      `SELECT i.mime_type, i.image_data, i.thumbnail_data, p.is_hidden
       FROM machine_showcase_images i
       JOIN machine_showcase_posts p ON p.id = i.post_id
       WHERE i.id = $1 AND p.deleted_at IS NULL`,
      [imageId]
    );
    const row = result.rows[0];
    if (!row || row.is_hidden) throw new AppError(404, 'NOT_FOUND', 'Image not found');
    return {
      mimeType: row.mime_type,
      data: variant === 'thumb' ? row.thumbnail_data : row.image_data,
    };
  },

  async setLike(postId: string, userId: string, liked: boolean) {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const post = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM machine_showcase_posts WHERE id = $1 AND ${VISIBLE.replace(/p\./g, '')}`,
      [postId]
    );
    if (!post.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Post not found');

    if (liked) {
      const ins = await pool.query(
        `INSERT INTO machine_showcase_likes (user_id, post_id)
         VALUES ($1,$2) ON CONFLICT (user_id, post_id) DO NOTHING`,
        [userId, postId]
      );
      if ((ins.rowCount ?? 0) > 0) {
        await pool.query(
          `UPDATE machine_showcase_posts SET like_count = like_count + 1 WHERE id = $1`,
          [postId]
        );
      }
    } else {
      const del = await pool.query(
        `DELETE FROM machine_showcase_likes WHERE user_id = $1 AND post_id = $2`,
        [userId, postId]
      );
      if ((del.rowCount ?? 0) > 0) {
        await pool.query(
          `UPDATE machine_showcase_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = $1`,
          [postId]
        );
      }
    }
    const count = await pool.query<{ like_count: number; liked: boolean }>(
      `SELECT like_count,
              EXISTS (SELECT 1 FROM machine_showcase_likes WHERE post_id = $1 AND user_id = $2) AS liked
       FROM machine_showcase_posts WHERE id = $1`,
      [postId, userId]
    );
    return {
      liked: Boolean(count.rows[0]?.liked),
      likeCount: count.rows[0]?.like_count ?? 0,
      authorId: post.rows[0].user_id,
    };
  },

  async setBookmark(postId: string, userId: string, bookmarked: boolean) {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const post = await pool.query(
      `SELECT 1 FROM machine_showcase_posts WHERE id = $1 AND ${VISIBLE.replace(/p\./g, '')}`,
      [postId]
    );
    if (!post.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    if (bookmarked) {
      const ins = await pool.query(
        `INSERT INTO machine_showcase_bookmarks (user_id, post_id)
         VALUES ($1,$2) ON CONFLICT (user_id, post_id) DO NOTHING`,
        [userId, postId]
      );
      if ((ins.rowCount ?? 0) > 0) {
        await pool.query(
          `UPDATE machine_showcase_posts SET bookmark_count = bookmark_count + 1 WHERE id = $1`,
          [postId]
        );
      }
    } else {
      const del = await pool.query(
        `DELETE FROM machine_showcase_bookmarks WHERE user_id = $1 AND post_id = $2`,
        [userId, postId]
      );
      if ((del.rowCount ?? 0) > 0) {
        await pool.query(
          `UPDATE machine_showcase_posts SET bookmark_count = GREATEST(0, bookmark_count - 1) WHERE id = $1`,
          [postId]
        );
      }
    }
    const count = await pool.query<{ bookmark_count: number; bookmarked: boolean }>(
      `SELECT bookmark_count,
              EXISTS (SELECT 1 FROM machine_showcase_bookmarks WHERE post_id = $1 AND user_id = $2) AS bookmarked
       FROM machine_showcase_posts WHERE id = $1`,
      [postId, userId]
    );
    return {
      bookmarked: Boolean(count.rows[0]?.bookmarked),
      bookmarkCount: count.rows[0]?.bookmark_count ?? 0,
    };
  },

  async createComment(postId: string, userId: string, input: CreateMachineShowcaseCommentInput) {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const post = await pool.query(
      `SELECT 1 FROM machine_showcase_posts WHERE id = $1 AND ${VISIBLE.replace(/p\./g, '')}`,
      [postId]
    );
    if (!post.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const result = await pool.query<{
      id: string;
      post_id: string;
      user_id: string;
      parent_id: string | null;
      content: string;
      created_at: string;
      updated_at: string;
      display_name: string | null;
    }>(
      `INSERT INTO machine_showcase_comments (post_id, user_id, parent_id, content)
       VALUES ($1,$2,$3,$4)
       RETURNING id::text, post_id::text, user_id::text, parent_id::text, content,
                 created_at::text, updated_at::text`,
      [postId, userId, input.parentId ?? null, input.content]
    );
    await pool.query(
      `UPDATE machine_showcase_posts SET comment_count = comment_count + 1 WHERE id = $1`,
      [postId]
    );
    const name = await pool.query<{ display_name: string | null; role_code: string | null }>(
      `SELECT u.display_name, r.code AS role_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [userId]
    );
    const row = result.rows[0];
    const authorRoleCode = name.rows[0]?.role_code;
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      parentId: row.parent_id ?? undefined,
      content: row.content,
      authorName: name.rows[0]?.display_name ?? undefined,
      authorRoleCode: isRoleCode(authorRoleCode) ? authorRoleCode : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } satisfies MachineShowcaseComment;
  },

  async updateComment(commentId: string, userId: string, input: UpdateMachineShowcaseCommentInput) {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    const result = await pool.query<MachineShowcaseComment & { user_id: string }>(
      `UPDATE machine_showcase_comments
       SET content = $3, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id::text, post_id::text AS "postId", user_id::text AS "userId",
                 parent_id::text AS "parentId", content, created_at::text AS "createdAt",
                 updated_at::text AS "updatedAt"`,
      [commentId, userId, input.content]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    return result.rows[0];
  },

  async deleteComment(commentId: string, userId: string, role: RoleCode): Promise<void> {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    const existing = await pool.query<{ user_id: string; post_id: string; deleted_at: string | null }>(
      `SELECT user_id, post_id, deleted_at::text FROM machine_showcase_comments WHERE id = $1`,
      [commentId]
    );
    if (!existing.rows[0] || existing.rows[0].deleted_at) {
      throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    }
    if (existing.rows[0].user_id !== userId && !hasMinRole(role, Role.ADMIN)) {
      throw new AppError(403, 'FORBIDDEN', 'Not your comment');
    }
    await pool.query(
      `UPDATE machine_showcase_comments SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [commentId]
    );
    await pool.query(
      `UPDATE machine_showcase_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = $1`,
      [existing.rows[0].post_id]
    );
  },

  async createReport(reporterId: string, input: CreateMachineShowcaseReportInput) {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const result = await pool.query<MachineShowcaseReport>(
      `INSERT INTO machine_showcase_reports (reporter_id, post_id, comment_id, reason, description)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id::text, reporter_id::text AS "reporterId", post_id::text AS "postId",
                 comment_id::text AS "commentId", reason, description, status, created_at::text AS "createdAt"`,
      [reporterId, input.postId ?? null, input.commentId ?? null, input.reason, input.description ?? null]
    );
    return result.rows[0];
  },

  async listReports(): Promise<MachineShowcaseReport[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<MachineShowcaseReport>(
      `SELECT r.id::text, r.reporter_id::text AS "reporterId", r.post_id::text AS "postId",
              r.comment_id::text AS "commentId", r.reason, r.description, r.status,
              u.display_name AS "reporterName", r.created_at::text AS "createdAt"
       FROM machine_showcase_reports r
       JOIN users u ON u.id = r.reporter_id
       ORDER BY r.created_at DESC
       LIMIT 200`
    );
    return result.rows;
  },

  async resolveReport(reportId: string, adminId: string, status: 'resolved' | 'dismissed') {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Report not found');
    const result = await pool.query(
      `UPDATE machine_showcase_reports
       SET status = $2, resolved_by = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING id::text`,
      [reportId, status, adminId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Report not found');
    return result.rows[0];
  },

  async hidePost(postId: string): Promise<string> {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const result = await pool.query<{ machine_id: string }>(
      `UPDATE machine_showcase_posts
       SET is_hidden = TRUE, status = 'hidden', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING machine_id`,
      [postId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    return result.rows[0].machine_id;
  },

  async adminPatchPost(postId: string, input: AdminMachineShowcasePostPatch, machineId?: string) {
    const pool = getPool();
    if (!pool) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (input.isHidden !== undefined) {
      sets.push(`is_hidden = $${idx++}`);
      params.push(input.isHidden);
      sets.push(`status = $${idx++}`);
      params.push(input.isHidden ? 'hidden' : 'published');
    }
    if (machineId) {
      sets.push(`machine_id = $${idx++}`);
      params.push(machineId);
    }
    if (input.gymId !== undefined) {
      sets.push(`gym_id = $${idx++}`);
      params.push(input.gymId);
    }
    if (input.userGymId !== undefined) {
      sets.push(`user_gym_id = $${idx++}`);
      params.push(input.userGymId);
    }
    if (input.coverImageId) {
      await pool.query(
        `UPDATE machine_showcase_images SET sort_order = sort_order + 1 WHERE post_id = $1`,
        [postId]
      );
      await pool.query(
        `UPDATE machine_showcase_images SET sort_order = 0 WHERE id = $1 AND post_id = $2`,
        [input.coverImageId, postId]
      );
    }
    if (sets.length) {
      params.push(postId);
      await pool.query(
        `UPDATE machine_showcase_posts SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
        params
      );
    }
    const row = await pool.query<{ machine_id: string }>(
      `SELECT machine_id FROM machine_showcase_posts WHERE id = $1`,
      [postId]
    );
    if (!row.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    return row.rows[0].machine_id;
  },

  async claimGymMachine(userId: string, input: ClaimGymMachineInput, machineId: string) {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    const owned = await pool.query(
      `SELECT id FROM user_gyms WHERE id = $1 AND user_id = $2`,
      [input.userGymId, userId]
    );
    if (!owned.rows[0]) throw new AppError(403, 'FORBIDDEN', 'Not your gym');
    const result = await pool.query(
      `INSERT INTO user_gym_machines (user_gym_id, machine_id, source, claimed_by, source_post_id)
       VALUES ($1,$2,'claim',$3,$4)
       ON CONFLICT (user_gym_id, machine_id) DO NOTHING
       RETURNING id`,
      [input.userGymId, machineId, userId, input.sourcePostId ?? null]
    );
    return { inserted: Boolean(result.rows[0]), machineId };
  },

  async upsertDiscovery(userId: string, machineId: string, postId: string | null, source: 'post' | 'claim') {
    const pool = getPool();
    if (!pool) return { isNew: false };
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM machine_discoveries WHERE user_id = $1 AND machine_id = $2`,
      [userId, machineId]
    );
    if (existing.rows[0]) {
      if (postId) {
        await pool.query(
          `UPDATE machine_discoveries
           SET first_post_id = COALESCE(first_post_id, $3),
               source = CASE WHEN source = 'claim' AND $4 = 'post' THEN 'post' ELSE source END
           WHERE user_id = $1 AND machine_id = $2`,
          [userId, machineId, postId, source]
        );
      }
      return { isNew: false };
    }
    await pool.query(
      `INSERT INTO machine_discoveries (user_id, machine_id, first_post_id, source)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, machine_id) DO NOTHING`,
      [userId, machineId, postId, source]
    );
    return { isNew: true };
  },

  async recomputeDiscoveryRanks(machineId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `WITH ranked AS (
         SELECT DISTINCT ON (p.user_id)
           p.user_id, p.id AS post_id, p.created_at
         FROM machine_showcase_posts p
         WHERE p.machine_id = $1
           AND p.deleted_at IS NULL AND p.is_hidden = FALSE AND p.status = 'published'
           AND EXISTS (SELECT 1 FROM machine_showcase_images i WHERE i.post_id = p.id)
         ORDER BY p.user_id, p.created_at ASC, p.id ASC
       ),
       ordered AS (
         SELECT user_id, post_id, created_at,
                ROW_NUMBER() OVER (ORDER BY created_at ASC, post_id ASC)::int AS rank
         FROM ranked
       )
       UPDATE machine_discoveries d
       SET discovery_rank = o.rank,
           first_post_id = o.post_id,
           source = 'post',
           discovered_at = LEAST(d.discovered_at, o.created_at)
       FROM ordered o
       WHERE d.machine_id = $1 AND d.user_id = o.user_id`,
      [machineId]
    );
    await pool.query(
      `UPDATE machine_discoveries d
       SET discovery_rank = NULL
       WHERE d.machine_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM machine_showcase_posts p
           WHERE p.machine_id = $1 AND p.user_id = d.user_id
             AND p.deleted_at IS NULL AND p.is_hidden = FALSE AND p.status = 'published'
             AND EXISTS (SELECT 1 FROM machine_showcase_images i WHERE i.post_id = p.id)
         )`,
      [machineId]
    );
  },

  async getDiscoveryRank(userId: string, machineId: string): Promise<number | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{ discovery_rank: number | null }>(
      `SELECT discovery_rank FROM machine_discoveries WHERE user_id = $1 AND machine_id = $2`,
      [userId, machineId]
    );
    return result.rows[0]?.discovery_rank ?? null;
  },

  async getDex(userId: string, locale = 'ko'): Promise<MachineDexSummary> {
    const pool = getPool();
    const emptyCounts = Object.fromEntries(MACHINE_RARITY_GRADES.map((g) => [g, 0])) as Record<
      MachineRarityGrade,
      number
    >;
    if (!pool) {
      return { discovered: 0, catalogTotal: 0, byGrade: emptyCounts, items: [] };
    }
    const [catalog, rows] = await Promise.all([
      pool.query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM machines WHERE is_active = TRUE`),
      pool.query<{
        machine_id: string;
        machine_code: string;
        machine_name: Record<string, string> | null;
        brand_code: string | null;
        brand_name: Record<string, string> | null;
        grade: MachineRarityGrade | null;
        score: number | null;
        discovery_rank: number | null;
        discovered_at: string;
        gym_holding_count: number | null;
        cover_id: string | null;
      }>(
        `SELECT d.machine_id::text, m.code AS machine_code, m.name AS machine_name,
                b.code AS brand_code, b.name AS brand_name,
                COALESCE(mr.grade, 'COMMON') AS grade,
                COALESCE(mr.score, 0) AS score,
                d.discovery_rank, d.discovered_at::text,
                COALESCE(mr.gym_holding_count, 0) AS gym_holding_count,
                (
                  SELECT i.id::text FROM machine_showcase_posts p
                  JOIN machine_showcase_images i ON i.post_id = p.id
                  WHERE p.user_id = d.user_id AND p.machine_id = d.machine_id
                    AND p.deleted_at IS NULL AND p.is_hidden = FALSE
                  ORDER BY i.sort_order ASC LIMIT 1
                ) AS cover_id
         FROM machine_discoveries d
         JOIN machines m ON m.id = d.machine_id
         LEFT JOIN brands b ON b.id = m.brand_id
         LEFT JOIN machine_rarity mr ON mr.machine_id = d.machine_id
         WHERE d.user_id = $1
         ORDER BY d.discovered_at DESC`,
        [userId]
      ),
    ]);

    const byGrade = { ...emptyCounts };
    const items: MachineDexEntry[] = rows.rows.map((row) => {
      const grade = row.grade ?? 'COMMON';
      byGrade[grade] += 1;
      return {
        machineId: row.machine_id,
        machineCode: row.machine_code,
        machineName: pickLocalized(row.machine_name, locale) ?? row.machine_code,
        brandCode: row.brand_code ?? undefined,
        brandName: row.brand_name ? pickLocalized(row.brand_name, locale) : undefined,
        grade,
        score: row.score ?? 0,
        discoveryRank: row.discovery_rank,
        discoveredAt: row.discovered_at,
        gymHoldingCount: row.gym_holding_count ?? 0,
        coverThumbUrl: row.cover_id ? showcaseImageUrl(row.cover_id, 'thumb') : undefined,
      };
    });

    return {
      discovered: items.length,
      catalogTotal: parseInt(catalog.rows[0]?.c ?? '0', 10) || 0,
      byGrade,
      items,
    };
  },

  async getMachineGyms(machineId: string, machineCode: string): Promise<MachineGymsResponse> {
    const pool = getPool();
    const rarity = await this.getRarityPublic(machineId, machineCode);
    if (!pool) {
      return { machineCode, rarity, totalGyms: 0, byRegion: [], items: [] };
    }
    const result = await pool.query<{
      gym_id: string;
      gym_name: string;
      city: string | null;
      country_code: string | null;
      latitude: string | null;
      longitude: string | null;
      verified: boolean;
    }>(
      `SELECT DISTINCT ON (g.id)
              g.id::text AS gym_id, g.name AS gym_name, g.city,
              c.code AS country_code, g.latitude::text, g.longitude::text,
              COALESCE(gm.is_verified, FALSE) AS verified
       FROM gyms g
       LEFT JOIN countries c ON c.id = g.country_id
       LEFT JOIN gym_machines gm
         ON gm.gym_id = g.id AND gm.machine_id = $1 AND gm.deleted_at IS NULL
       WHERE g.is_active = TRUE
         AND (
           gm.id IS NOT NULL
           OR EXISTS (
             SELECT 1 FROM machine_showcase_posts p
             WHERE p.gym_id = g.id AND p.machine_id = $1
               AND p.deleted_at IS NULL AND p.is_hidden = FALSE AND p.status = 'published'
           )
         )
       ORDER BY g.id, gm.is_verified DESC NULLS LAST`,
      [machineId]
    );
    const items = result.rows.map((row) => ({
      gymId: row.gym_id,
      gymName: row.gym_name,
      city: row.city ?? undefined,
      countryCode: row.country_code ?? undefined,
      latitude: row.latitude ? parseFloat(row.latitude) : undefined,
      longitude: row.longitude ? parseFloat(row.longitude) : undefined,
      verified: Boolean(row.verified),
    }));
    const regionMap = new Map<string, number>();
    for (const item of items) {
      const key = regionBucket(item.city);
      regionMap.set(key, (regionMap.get(key) ?? 0) + 1);
    }
    const byRegion = [...regionMap.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
    return { machineCode, rarity, totalGyms: items.length, byRegion, items };
  },

  async getRarityPublic(machineId: string, machineCode: string): Promise<MachineRarityPublic> {
    const pool = getPool();
    if (!pool) {
      return {
        machineId,
        machineCode,
        grade: 'COMMON',
        score: 0,
        gymHoldingCount: 0,
        postCount: 0,
        discoveryCount: 0,
      };
    }
    const result = await pool.query<{
      grade: MachineRarityGrade;
      score: number;
      gym_holding_count: number;
      post_count: number;
      discovery_count: number;
    }>(
      `SELECT grade, score, gym_holding_count, post_count, discovery_count
       FROM machine_rarity WHERE machine_id = $1`,
      [machineId]
    );
    const row = result.rows[0];
    if (!row) {
      return {
        machineId,
        machineCode,
        grade: 'COMMON',
        score: 0,
        gymHoldingCount: 0,
        postCount: 0,
        discoveryCount: 0,
      };
    }
    return {
      machineId,
      machineCode,
      grade: row.grade,
      score: row.score,
      gymHoldingCount: row.gym_holding_count,
      postCount: row.post_count,
      discoveryCount: row.discovery_count,
    };
  },

  async getMyGymHoldings(userId: string, userGymId: string, locale = 'ko'): Promise<UserGymHoldingsSummary> {
    const pool = getPool();
    if (!pool) {
      return { userGymId, userGymName: '', total: 0, byMuscle: [], recent: [] };
    }
    const gym = await pool.query<{ name: string }>(
      `SELECT name FROM user_gyms WHERE id = $1 AND user_id = $2`,
      [userGymId, userId]
    );
    if (!gym.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
    const [counts, recent] = await Promise.all([
      pool.query<{ muscle_group: string; c: string }>(
        `SELECT m.muscle_group, COUNT(*)::text AS c
         FROM user_gym_machines ugm
         JOIN machines m ON m.id = ugm.machine_id
         WHERE ugm.user_gym_id = $1
         GROUP BY m.muscle_group
         ORDER BY COUNT(*) DESC`,
        [userGymId]
      ),
      pool.query<{
        machine_code: string;
        machine_name: Record<string, string> | null;
        brand_name: Record<string, string> | null;
        created_at: string;
      }>(
        `SELECT m.code AS machine_code, m.name AS machine_name, b.name AS brand_name, ugm.created_at::text
         FROM user_gym_machines ugm
         JOIN machines m ON m.id = ugm.machine_id
         LEFT JOIN brands b ON b.id = m.brand_id
         WHERE ugm.user_gym_id = $1
         ORDER BY ugm.created_at DESC
         LIMIT 8`,
        [userGymId]
      ),
    ]);
    const byMuscle = counts.rows.map((r) => ({
      muscleGroup: r.muscle_group,
      count: parseInt(r.c, 10) || 0,
    }));
    return {
      userGymId,
      userGymName: gym.rows[0].name,
      total: byMuscle.reduce((s, x) => s + x.count, 0),
      byMuscle,
      recent: recent.rows.map((r) => ({
        machineCode: r.machine_code,
        machineName: pickLocalized(r.machine_name, locale) ?? r.machine_code,
        brandName: r.brand_name ? pickLocalized(r.brand_name, locale) : undefined,
        createdAt: r.created_at,
      })),
    };
  },

  async listAdminRarity(query: AdminMachineRarityListQuery, locale = 'ko') {
    const pool = getPool();
    if (!pool) return { items: [] as MachineRarityAdmin[], meta: buildPaginationMeta(1, query.limit, 0) };
    const params: unknown[] = [];
    let idx = 1;
    const conditions: string[] = [];
    if (query.q) {
      conditions.push(`(m.code ILIKE $${idx} OR m.name::text ILIKE $${idx})`);
      params.push(`%${query.q}%`);
      idx += 1;
    }
    if (query.grade) {
      conditions.push(`COALESCE(mr.grade, 'COMMON') = $${idx++}`);
      params.push(query.grade);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const count = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM machines m
       LEFT JOIN machine_rarity mr ON mr.machine_id = m.id
       ${where}`,
      params
    );
    const total = parseInt(count.rows[0]?.c ?? '0', 10) || 0;
    params.push(query.limit, (query.page - 1) * query.limit);
    const result = await pool.query<{
      machine_id: string;
      machine_code: string;
      machine_name: Record<string, string> | null;
      grade: MachineRarityGrade | null;
      auto_grade: MachineRarityGrade | null;
      score: number | null;
      gym_holding_count: number | null;
      user_gym_holding_count: number | null;
      post_count: number | null;
      discovery_count: number | null;
      admin_weight: number | null;
      unique_flag: boolean | null;
      grade_override: MachineRarityGrade | null;
      calculated_at: string | null;
      first_name: string | null;
      first_at: string | null;
    }>(
      `SELECT m.id::text AS machine_id, m.code AS machine_code, m.name AS machine_name,
              mr.grade, mr.auto_grade, COALESCE(mr.score, 0) AS score,
              COALESCE(mr.gym_holding_count, 0) AS gym_holding_count,
              COALESCE(mr.user_gym_holding_count, 0) AS user_gym_holding_count,
              COALESCE(mr.post_count, 0) AS post_count,
              COALESCE(mr.discovery_count, 0) AS discovery_count,
              COALESCE(mr.admin_weight, 0) AS admin_weight,
              COALESCE(mr.unique_flag, FALSE) AS unique_flag,
              mr.grade_override, mr.calculated_at::text,
              u.display_name AS first_name, d.discovered_at::text AS first_at
       FROM machines m
       LEFT JOIN machine_rarity mr ON mr.machine_id = m.id
       LEFT JOIN machine_discoveries d
         ON d.machine_id = m.id AND d.discovery_rank = 1
       LEFT JOIN users u ON u.id = d.user_id
       ${where}
       ORDER BY COALESCE(mr.score, 0) DESC, m.code ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );
    const items: MachineRarityAdmin[] = result.rows.map((row) => ({
      machineId: row.machine_id,
      machineCode: row.machine_code,
      grade: row.grade ?? 'COMMON',
      autoGrade: row.auto_grade ?? 'COMMON',
      score: row.score ?? 0,
      gymHoldingCount: row.gym_holding_count ?? 0,
      userGymHoldingCount: row.user_gym_holding_count ?? 0,
      postCount: row.post_count ?? 0,
      discoveryCount: row.discovery_count ?? 0,
      adminWeight: row.admin_weight ?? 0,
      uniqueFlag: Boolean(row.unique_flag),
      gradeOverride: row.grade_override,
      firstDiscovererName: row.first_name,
      firstDiscoveredAt: row.first_at,
      calculatedAt: row.calculated_at ?? new Date().toISOString(),
    }));
    void locale;
    return { items, meta: buildPaginationMeta(query.page, query.limit, total) };
  },

  async patchRarity(machineId: string, input: AdminMachineRarityPatch): Promise<void> {
    const pool = getPool();
    if (!pool) throw new AppError(503, 'DB_UNAVAILABLE', 'Database not configured');
    await pool.query(
      `INSERT INTO machine_rarity (machine_id, admin_weight, unique_flag, grade_override)
       VALUES ($1, COALESCE($2, 0), COALESCE($3, FALSE), $4)
       ON CONFLICT (machine_id) DO UPDATE SET
         admin_weight = COALESCE($2, machine_rarity.admin_weight),
         unique_flag = COALESCE($3, machine_rarity.unique_flag),
         grade_override = CASE WHEN $5 THEN $4 ELSE machine_rarity.grade_override END,
         updated_at = NOW()`,
      [
        machineId,
        input.adminWeight ?? null,
        input.uniqueFlag ?? null,
        input.gradeOverride ?? null,
        input.gradeOverride !== undefined,
      ]
    );
  },
};
