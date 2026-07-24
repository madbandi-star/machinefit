import { randomUUID } from 'node:crypto';
import type {
  CreatePhotoCommentInput,
  CreatePhotoPostInput,
  CreatePhotoReportInput,
  PhotoBoardListQuery,
  PhotoBoardSort,
  PhotoPost,
  PhotoPostComment,
  PhotoPostImageMeta,
  PhotoPostReport,
  PhotoUserBlock,
  ReportStatus,
  RoleCode,
  UpdatePhotoPostInput,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import {
  mockPhotoBlocks,
  mockPhotoComments,
  mockPhotoImages,
  mockPhotoLikes,
  mockPhotoPosts,
  mockPhotoReports,
  photoLikeKey,
} from '../data/photo-board.mock.js';
import { AppError } from '../middlewares/error.middleware.js';
import { photoBoardImageUrl } from '../utils/public-api-base.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';

type ImageRow = {
  id: string;
  post_id: string;
  sort_order: number;
  mime_type: string;
  width: number | null;
  height: number | null;
};

type PostRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_hidden: boolean;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  liked_by_me?: boolean | null;
};

function mapImage(row: ImageRow): PhotoPostImageMeta {
  return {
    id: row.id,
    postId: row.post_id,
    sortOrder: row.sort_order,
    mimeType: row.mime_type,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    thumbUrl: photoBoardImageUrl(row.id, 'thumb'),
    mainUrl: photoBoardImageUrl(row.id, 'main'),
  };
}

function mapPost(row: PostRow, tags: string[], cover?: PhotoPostImageMeta, images?: PhotoPostImageMeta[]): PhotoPost {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    viewCount: row.view_count,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    isHidden: row.is_hidden,
    authorName: row.display_name ?? undefined,
    tags,
    coverImage: cover,
    images,
    likedByMe: row.liked_by_me ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortSql(sort: PhotoBoardSort): string {
  switch (sort) {
    case 'popular':
      return 'p.like_count DESC, p.created_at DESC';
    case 'views':
      return 'p.view_count DESC, p.created_at DESC';
    case 'comments':
      return 'p.comment_count DESC, p.created_at DESC';
    default:
      return 'p.created_at DESC';
  }
}

function normalizeTag(name: string): string {
  return name.trim().toLowerCase();
}

async function assertNotBlocked(userId: string) {
  const pool = getPool();
  if (!pool) {
    if (mockPhotoBlocks.some((b) => b.userId === userId)) {
      throw new AppError(403, 'PHOTO_USER_BLOCKED', 'You are blocked from the photo board');
    }
    return;
  }
  const result = await pool.query(`SELECT 1 FROM photo_user_blocks WHERE user_id = $1 LIMIT 1`, [userId]);
  if (result.rowCount) {
    throw new AppError(403, 'PHOTO_USER_BLOCKED', 'You are blocked from the photo board');
  }
}

async function loadTagsForPosts(postIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!postIds.length) return map;
  const pool = getPool();
  if (!pool) {
    for (const post of mockPhotoPosts) {
      if (postIds.includes(post.id)) map.set(post.id, [...post.tags]);
    }
    return map;
  }
  const result = await pool.query<{ post_id: string; name: string }>(
    `SELECT pt.post_id, t.name
     FROM photo_post_tags pt
     JOIN photo_tags t ON t.id = pt.tag_id
     WHERE pt.post_id = ANY($1::uuid[])
     ORDER BY t.name ASC`,
    [postIds]
  );
  for (const row of result.rows) {
    const list = map.get(row.post_id) ?? [];
    list.push(row.name);
    map.set(row.post_id, list);
  }
  return map;
}

async function loadCoverImages(postIds: string[]): Promise<Map<string, PhotoPostImageMeta>> {
  const map = new Map<string, PhotoPostImageMeta>();
  if (!postIds.length) return map;
  const pool = getPool();
  if (!pool) {
    for (const post of mockPhotoPosts) {
      if (postIds.includes(post.id) && post.coverImage) map.set(post.id, post.coverImage);
    }
    return map;
  }
  const result = await pool.query<ImageRow>(
    `SELECT DISTINCT ON (post_id) id, post_id, sort_order, mime_type, width, height
     FROM photo_post_images
     WHERE post_id = ANY($1::uuid[])
     ORDER BY post_id, sort_order ASC, created_at ASC`,
    [postIds]
  );
  for (const row of result.rows) {
    map.set(row.post_id, mapImage(row));
  }
  return map;
}

async function syncTags(postId: string, tags: string[]) {
  const pool = getPool()!;
  await pool.query(`DELETE FROM photo_post_tags WHERE post_id = $1`, [postId]);
  for (const raw of tags) {
    const name = raw.trim();
    if (!name) continue;
    const normalized = normalizeTag(name);
    const upsert = await pool.query<{ id: string }>(
      `INSERT INTO photo_tags (name, name_normalized)
       VALUES ($1, $2)
       ON CONFLICT (name_normalized) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name, normalized]
    );
    await pool.query(
      `INSERT INTO photo_post_tags (post_id, tag_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [postId, upsert.rows[0].id]
    );
  }
}

export const photoBoardRepository = {
  async list(query: PhotoBoardListQuery, viewerId?: string) {
    const page = query.page;
    const limit = query.limit;
    const pool = getPool();

    if (!pool) {
      let items = mockPhotoPosts.filter((p) => !p.isHidden);
      if (query.mine && viewerId) items = items.filter((p) => p.userId === viewerId);
      if (query.likedByMe && viewerId) {
        items = items.filter((p) => mockPhotoLikes.has(photoLikeKey(viewerId, p.id)));
      }
      if (query.authorId) items = items.filter((p) => p.userId === query.authorId);
      if (query.tag) {
        const tag = normalizeTag(query.tag);
        items = items.filter((p) => p.tags.some((t) => normalizeTag(t) === tag));
      }
      if (query.q) {
        const q = query.q.toLowerCase();
        items = items.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.content.toLowerCase().includes(q) ||
            (p.authorName ?? '').toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      items = [...items].sort((a, b) => {
        if (query.sort === 'popular') return b.likeCount - a.likeCount;
        if (query.sort === 'views') return b.viewCount - a.viewCount;
        if (query.sort === 'comments') return b.commentCount - a.commentCount;
        return b.createdAt.localeCompare(a.createdAt);
      });
      const start = (page - 1) * limit;
      const slice = items.slice(start, start + limit).map((p) => ({
        ...p,
        likedByMe: viewerId ? mockPhotoLikes.has(photoLikeKey(viewerId, p.id)) : false,
        images: undefined,
      }));
      return { items: slice, meta: buildPaginationMeta(page, limit, items.length) };
    }

    const conditions = ['p.is_hidden = FALSE'];
    const params: unknown[] = [];
    let idx = 1;

    if (query.mine && viewerId) {
      conditions.push(`p.user_id = $${idx++}`);
      params.push(viewerId);
    }
    if (query.authorId) {
      conditions.push(`p.user_id = $${idx++}`);
      params.push(query.authorId);
    }
    if (query.likedByMe && viewerId) {
      conditions.push(
        `EXISTS (SELECT 1 FROM photo_post_likes l WHERE l.post_id = p.id AND l.user_id = $${idx++})`
      );
      params.push(viewerId);
    }
    if (query.tag) {
      conditions.push(
        `EXISTS (
          SELECT 1 FROM photo_post_tags pt
          JOIN photo_tags t ON t.id = pt.tag_id
          WHERE pt.post_id = p.id AND t.name_normalized = $${idx++}
        )`
      );
      params.push(normalizeTag(query.tag));
    }
    if (query.q) {
      conditions.push(
        `(
          p.title ILIKE $${idx} OR p.content ILIKE $${idx}
          OR u.display_name ILIKE $${idx}
          OR EXISTS (
            SELECT 1 FROM photo_post_tags pt
            JOIN photo_tags t ON t.id = pt.tag_id
            WHERE pt.post_id = p.id AND t.name ILIKE $${idx}
          )
        )`
      );
      params.push(`%${query.q}%`);
      idx += 1;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM photo_posts p
       JOIN users u ON u.id = p.user_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const likedSelect = viewerId
      ? `, EXISTS (
           SELECT 1 FROM photo_post_likes l
           WHERE l.post_id = p.id AND l.user_id = $${idx}
         ) AS liked_by_me`
      : ', FALSE AS liked_by_me';
    const listParams = viewerId ? [...params, viewerId, limit, (page - 1) * limit] : [...params, limit, (page - 1) * limit];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const result = await pool.query<PostRow>(
      `SELECT p.id, p.user_id, p.title, p.content, p.view_count, p.like_count, p.comment_count,
              p.is_hidden, p.created_at, p.updated_at, u.display_name
              ${likedSelect}
       FROM photo_posts p
       JOIN users u ON u.id = p.user_id
       ${where}
       ORDER BY ${sortSql(query.sort)}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams
    );

    const ids = result.rows.map((r) => r.id);
    const [tagsMap, covers] = await Promise.all([loadTagsForPosts(ids), loadCoverImages(ids)]);
    const items = result.rows.map((row) =>
      mapPost(row, tagsMap.get(row.id) ?? [], covers.get(row.id))
    );
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getById(postId: string, viewerId?: string, options?: { incrementView?: boolean }) {
    const pool = getPool();
    if (!pool) {
      const post = mockPhotoPosts.find((p) => p.id === postId && !p.isHidden);
      if (!post) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');
      if (options?.incrementView) post.viewCount += 1;
      const comments = mockPhotoComments.filter((c) => c.postId === postId && !c.isHidden);
      return {
        post: {
          ...post,
          likedByMe: viewerId ? mockPhotoLikes.has(photoLikeKey(viewerId, postId)) : false,
        },
        comments,
      };
    }

    if (options?.incrementView) {
      await pool.query(`UPDATE photo_posts SET view_count = view_count + 1 WHERE id = $1`, [postId]);
    }

    const postResult = await pool.query<PostRow>(
      `SELECT p.id, p.user_id, p.title, p.content, p.view_count, p.like_count, p.comment_count,
              p.is_hidden, p.created_at, p.updated_at, u.display_name,
              ${
                viewerId
                  ? `EXISTS (
                       SELECT 1 FROM photo_post_likes l
                       WHERE l.post_id = p.id AND l.user_id = $2
                     ) AS liked_by_me`
                  : 'FALSE AS liked_by_me'
              }
       FROM photo_posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND p.is_hidden = FALSE`,
      viewerId ? [postId, viewerId] : [postId]
    );
    const row = postResult.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');

    const [tagsMap, imageResult, commentResult] = await Promise.all([
      loadTagsForPosts([postId]),
      pool.query<ImageRow>(
        `SELECT id, post_id, sort_order, mime_type, width, height
         FROM photo_post_images
         WHERE post_id = $1
         ORDER BY sort_order ASC, created_at ASC`,
        [postId]
      ),
      pool.query<{
        id: string;
        post_id: string;
        user_id: string;
        parent_id: string | null;
        content: string;
        is_hidden: boolean;
        display_name: string | null;
        created_at: string;
        updated_at: string;
      }>(
        `SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.is_hidden,
                c.created_at, c.updated_at, u.display_name
         FROM photo_post_comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.post_id = $1 AND c.is_hidden = FALSE
         ORDER BY c.created_at ASC`,
        [postId]
      ),
    ]);

    const images = imageResult.rows.map(mapImage);
    const comments: PhotoPostComment[] = commentResult.rows.map((c) => ({
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      parentId: c.parent_id ?? undefined,
      content: c.content,
      isHidden: c.is_hidden,
      authorName: c.display_name ?? undefined,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return {
      post: mapPost(row, tagsMap.get(postId) ?? [], images[0], images),
      comments,
    };
  },

  async createPost(
    userId: string,
    input: CreatePhotoPostInput,
    images: Array<{
      buffer: Buffer;
      thumb: Buffer;
      mimeType: string;
      width: number;
      height: number;
      fileSizeBytes: number;
    }>
  ) {
    await assertNotBlocked(userId);
    if (!images.length) throw new AppError(400, 'IMAGES_REQUIRED', 'At least one image is required');
    if (images.length > 10) throw new AppError(400, 'TOO_MANY_FILES', 'Max 10 images');

    const pool = getPool();
    if (!pool) {
      const id = randomUUID();
      const now = new Date().toISOString();
      const imageMetas: PhotoPostImageMeta[] = images.map((img, index) => {
        const imageId = randomUUID();
        mockPhotoImages.set(imageId, {
          mimeType: img.mimeType,
          imageData: img.buffer,
          thumbnailData: img.thumb,
          width: img.width,
          height: img.height,
        });
        return {
          id: imageId,
          postId: id,
          sortOrder: index,
          mimeType: img.mimeType,
          width: img.width,
          height: img.height,
          thumbUrl: photoBoardImageUrl(imageId, 'thumb'),
          mainUrl: photoBoardImageUrl(imageId, 'main'),
        };
      });
      const post: PhotoPost = {
        id,
        userId,
        title: input.title,
        content: input.content ?? '',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        isHidden: false,
        authorName: 'You',
        tags: input.tags ?? [],
        coverImage: imageMetas[0],
        images: imageMetas,
        likedByMe: false,
        createdAt: now,
        updatedAt: now,
      };
      mockPhotoPosts.unshift(post);
      return post;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const postResult = await client.query<{ id: string }>(
        `INSERT INTO photo_posts (user_id, title, content)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [userId, input.title, input.content ?? '']
      );
      const postId = postResult.rows[0].id;

      for (let i = 0; i < images.length; i += 1) {
        const img = images[i];
        await client.query(
          `INSERT INTO photo_post_images
             (post_id, sort_order, mime_type, width, height, file_size_bytes, image_data, thumbnail_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            postId,
            i,
            img.mimeType,
            img.width,
            img.height,
            img.fileSizeBytes,
            img.buffer,
            img.thumb,
          ]
        );
      }

      await client.query('COMMIT');
      await syncTags(postId, input.tags ?? []);
      const detail = await this.getById(postId, userId);
      return detail.post;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updatePost(postId: string, userId: string, role: RoleCode, input: UpdatePhotoPostInput) {
    await assertNotBlocked(userId);
    const pool = getPool();
    if (!pool) {
      const post = mockPhotoPosts.find((p) => p.id === postId);
      if (!post) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');
      if (post.userId !== userId && role !== 'admin') {
        throw new AppError(403, 'FORBIDDEN', 'Only the author can edit this post');
      }
      if (input.title !== undefined) post.title = input.title;
      if (input.content !== undefined) post.content = input.content;
      if (input.tags !== undefined) post.tags = input.tags;
      if (input.imageOrder?.length && post.images) {
        const byId = new Map(post.images.map((img) => [img.id, img]));
        post.images = input.imageOrder
          .map((id, index) => {
            const img = byId.get(id);
            if (!img) return null;
            return { ...img, sortOrder: index };
          })
          .filter(Boolean) as PhotoPostImageMeta[];
        post.coverImage = post.images[0];
      }
      post.updatedAt = new Date().toISOString();
      return post;
    }

    const existing = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM photo_posts WHERE id = $1`,
      [postId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');
    if (existing.rows[0].user_id !== userId && role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Only the author can edit this post');
    }

    if (input.title !== undefined || input.content !== undefined) {
      await pool.query(
        `UPDATE photo_posts
         SET title = COALESCE($2, title),
             content = COALESCE($3, content)
         WHERE id = $1`,
        [postId, input.title ?? null, input.content ?? null]
      );
    }
    if (input.tags) await syncTags(postId, input.tags);
    if (input.imageOrder?.length) {
      for (let i = 0; i < input.imageOrder.length; i += 1) {
        await pool.query(
          `UPDATE photo_post_images SET sort_order = $3
           WHERE id = $1 AND post_id = $2`,
          [input.imageOrder[i], postId, i]
        );
      }
    }
    const detail = await this.getById(postId, userId);
    return detail.post;
  },

  async deletePost(postId: string, userId: string, role: RoleCode) {
    const pool = getPool();
    if (!pool) {
      const index = mockPhotoPosts.findIndex((p) => p.id === postId);
      if (index < 0) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');
      const post = mockPhotoPosts[index];
      if (post.userId !== userId && role !== 'admin') {
        throw new AppError(403, 'FORBIDDEN', 'Only the author can delete this post');
      }
      mockPhotoPosts.splice(index, 1);
      return;
    }

    const existing = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM photo_posts WHERE id = $1`,
      [postId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');
    if (existing.rows[0].user_id !== userId && role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Only the author can delete this post');
    }
    await pool.query(`DELETE FROM photo_posts WHERE id = $1`, [postId]);
  },

  async getImageBinary(imageId: string, variant: 'main' | 'thumb') {
    const pool = getPool();
    if (!pool) {
      const img = mockPhotoImages.get(imageId);
      if (!img) throw new AppError(404, 'NOT_FOUND', 'Image not found');
      return {
        mimeType: img.mimeType,
        data: variant === 'thumb' ? img.thumbnailData : img.imageData,
      };
    }
    const result = await pool.query<{
      mime_type: string;
      image_data: Buffer;
      thumbnail_data: Buffer;
      is_hidden: boolean;
    }>(
      `SELECT i.mime_type, i.image_data, i.thumbnail_data, p.is_hidden
       FROM photo_post_images i
       JOIN photo_posts p ON p.id = i.post_id
       WHERE i.id = $1`,
      [imageId]
    );
    const row = result.rows[0];
    if (!row || row.is_hidden) throw new AppError(404, 'NOT_FOUND', 'Image not found');
    return {
      mimeType: row.mime_type,
      data: variant === 'thumb' ? row.thumbnail_data : row.image_data,
    };
  },

  async toggleLike(postId: string, userId: string) {
    await assertNotBlocked(userId);
    const pool = getPool();
    if (!pool) {
      const post = mockPhotoPosts.find((p) => p.id === postId && !p.isHidden);
      if (!post) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');
      const key = photoLikeKey(userId, postId);
      if (mockPhotoLikes.has(key)) {
        mockPhotoLikes.delete(key);
        post.likeCount = Math.max(0, post.likeCount - 1);
        return { liked: false, likeCount: post.likeCount, authorId: post.userId };
      }
      mockPhotoLikes.add(key);
      post.likeCount += 1;
      return { liked: true, likeCount: post.likeCount, authorId: post.userId };
    }

    const existing = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM photo_posts WHERE id = $1 AND is_hidden = FALSE`,
      [postId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');

    const liked = await pool.query(
      `SELECT 1 FROM photo_post_likes WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );
    if (liked.rowCount) {
      await pool.query(`DELETE FROM photo_post_likes WHERE user_id = $1 AND post_id = $2`, [
        userId,
        postId,
      ]);
      await pool.query(
        `UPDATE photo_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1`,
        [postId]
      );
    } else {
      await pool.query(`INSERT INTO photo_post_likes (user_id, post_id) VALUES ($1, $2)`, [
        userId,
        postId,
      ]);
      await pool.query(`UPDATE photo_posts SET like_count = like_count + 1 WHERE id = $1`, [postId]);
    }
    const count = await pool.query<{ like_count: number }>(
      `SELECT like_count FROM photo_posts WHERE id = $1`,
      [postId]
    );
    return {
      liked: !liked.rowCount,
      likeCount: count.rows[0]?.like_count ?? 0,
      authorId: existing.rows[0].user_id,
    };
  },

  async createComment(postId: string, userId: string, input: CreatePhotoCommentInput) {
    await assertNotBlocked(userId);
    const pool = getPool();
    if (!pool) {
      const post = mockPhotoPosts.find((p) => p.id === postId && !p.isHidden);
      if (!post) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');
      const now = new Date().toISOString();
      const comment: PhotoPostComment = {
        id: randomUUID(),
        postId,
        userId,
        parentId: input.parentId,
        content: input.content,
        isHidden: false,
        authorName: 'You',
        createdAt: now,
        updatedAt: now,
      };
      mockPhotoComments.push(comment);
      post.commentCount += 1;
      return { comment, authorId: post.userId };
    }

    const post = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM photo_posts WHERE id = $1 AND is_hidden = FALSE`,
      [postId]
    );
    if (!post.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');

    if (input.parentId) {
      const parent = await pool.query(
        `SELECT 1 FROM photo_post_comments WHERE id = $1 AND post_id = $2 AND is_hidden = FALSE`,
        [input.parentId, postId]
      );
      if (!parent.rowCount) throw new AppError(400, 'INVALID_PARENT', 'Parent comment not found');
    }

    const result = await pool.query<{
      id: string;
      post_id: string;
      user_id: string;
      parent_id: string | null;
      content: string;
      is_hidden: boolean;
      created_at: string;
      updated_at: string;
      display_name: string | null;
    }>(
      `WITH inserted AS (
         INSERT INTO photo_post_comments (post_id, user_id, parent_id, content)
         VALUES ($1, $2, $3, $4)
         RETURNING *
       )
       SELECT i.*, u.display_name
       FROM inserted i
       JOIN users u ON u.id = i.user_id`,
      [postId, userId, input.parentId ?? null, input.content]
    );
    await pool.query(`UPDATE photo_posts SET comment_count = comment_count + 1 WHERE id = $1`, [
      postId,
    ]);
    const row = result.rows[0];
    return {
      comment: {
        id: row.id,
        postId: row.post_id,
        userId: row.user_id,
        parentId: row.parent_id ?? undefined,
        content: row.content,
        isHidden: row.is_hidden,
        authorName: row.display_name ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      } satisfies PhotoPostComment,
      authorId: post.rows[0].user_id,
    };
  },

  async deleteComment(commentId: string, userId: string, role: RoleCode) {
    const pool = getPool();
    if (!pool) {
      const index = mockPhotoComments.findIndex((c) => c.id === commentId);
      if (index < 0) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
      const comment = mockPhotoComments[index];
      if (comment.userId !== userId && role !== 'admin') {
        throw new AppError(403, 'FORBIDDEN', 'Only the author can delete this comment');
      }
      mockPhotoComments.splice(index, 1);
      const post = mockPhotoPosts.find((p) => p.id === comment.postId);
      if (post) post.commentCount = Math.max(0, post.commentCount - 1);
      return;
    }

    const existing = await pool.query<{ user_id: string; post_id: string; is_hidden: boolean }>(
      `SELECT user_id, post_id, is_hidden FROM photo_post_comments WHERE id = $1`,
      [commentId]
    );
    const row = existing.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    if (row.user_id !== userId && role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Only the author can delete this comment');
    }
    if (role === 'admin') {
      await pool.query(`UPDATE photo_post_comments SET is_hidden = TRUE WHERE id = $1`, [commentId]);
    } else {
      await pool.query(`DELETE FROM photo_post_comments WHERE id = $1`, [commentId]);
    }
    if (!row.is_hidden) {
      await pool.query(
        `UPDATE photo_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1`,
        [row.post_id]
      );
    }
  },

  async createReport(reporterId: string, input: CreatePhotoReportInput) {
    const pool = getPool();
    if (!pool) {
      const report: PhotoPostReport = {
        id: randomUUID(),
        reporterId,
        postId: input.postId,
        commentId: input.commentId,
        reason: input.reason,
        description: input.description,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockPhotoReports.unshift(report);
      return report;
    }
    const result = await pool.query<{
      id: string;
      reporter_id: string;
      post_id: string | null;
      comment_id: string | null;
      reason: string;
      description: string | null;
      status: string;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO photo_post_reports (reporter_id, post_id, comment_id, reason, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        reporterId,
        input.postId ?? null,
        input.commentId ?? null,
        input.reason,
        input.description ?? null,
      ]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      reporterId: row.reporter_id,
      postId: row.post_id ?? undefined,
      commentId: row.comment_id ?? undefined,
      reason: row.reason,
      description: row.description ?? undefined,
      status: row.status as ReportStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async listReports() {
    const pool = getPool();
    if (!pool) return mockPhotoReports;
    const result = await pool.query<{
      id: string;
      reporter_id: string;
      post_id: string | null;
      comment_id: string | null;
      reason: string;
      description: string | null;
      status: string;
      resolved_by: string | null;
      created_at: string;
      updated_at: string;
      post_title: string | null;
      reporter_name: string | null;
    }>(
      `SELECT r.*, p.title AS post_title, u.display_name AS reporter_name
       FROM photo_post_reports r
       LEFT JOIN photo_posts p ON p.id = r.post_id
       LEFT JOIN users u ON u.id = r.reporter_id
       ORDER BY r.created_at DESC
       LIMIT 200`
    );
    return result.rows.map(
      (row): PhotoPostReport => ({
        id: row.id,
        reporterId: row.reporter_id,
        postId: row.post_id ?? undefined,
        commentId: row.comment_id ?? undefined,
        reason: row.reason,
        description: row.description ?? undefined,
        status: row.status as ReportStatus,
        resolvedBy: row.resolved_by ?? undefined,
        postTitle: row.post_title ?? undefined,
        reporterName: row.reporter_name ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    );
  },

  async resolveReport(reportId: string, adminId: string, status: 'resolved' | 'dismissed') {
    const pool = getPool();
    if (!pool) {
      const report = mockPhotoReports.find((r) => r.id === reportId);
      if (!report) throw new AppError(404, 'NOT_FOUND', 'Report not found');
      report.status = status;
      report.resolvedBy = adminId;
      report.updatedAt = new Date().toISOString();
      return report;
    }
    const result = await pool.query<{
      id: string;
      reporter_id: string;
      post_id: string | null;
      comment_id: string | null;
      reason: string;
      description: string | null;
      status: string;
      resolved_by: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `UPDATE photo_post_reports
       SET status = $2, resolved_by = $3
       WHERE id = $1
       RETURNING *`,
      [reportId, status, adminId]
    );
    const row = result.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Report not found');
    return {
      id: row.id,
      reporterId: row.reporter_id,
      postId: row.post_id ?? undefined,
      commentId: row.comment_id ?? undefined,
      reason: row.reason,
      description: row.description ?? undefined,
      status: row.status as ReportStatus,
      resolvedBy: row.resolved_by ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async hidePost(postId: string) {
    const pool = getPool();
    if (!pool) {
      const post = mockPhotoPosts.find((p) => p.id === postId);
      if (!post) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');
      post.isHidden = true;
      return;
    }
    const result = await pool.query(`UPDATE photo_posts SET is_hidden = TRUE WHERE id = $1`, [postId]);
    if (!result.rowCount) throw new AppError(404, 'NOT_FOUND', 'Photo post not found');
  },

  async blockUser(adminId: string, userId: string, reason?: string) {
    const pool = getPool();
    if (!pool) {
      const existing = mockPhotoBlocks.find((b) => b.userId === userId);
      if (existing) return existing;
      const block: PhotoUserBlock = {
        id: randomUUID(),
        userId,
        reason,
        blockedBy: adminId,
        createdAt: new Date().toISOString(),
      };
      mockPhotoBlocks.push(block);
      return block;
    }
    const result = await pool.query<{
      id: string;
      user_id: string;
      reason: string | null;
      blocked_by: string;
      created_at: string;
    }>(
      `INSERT INTO photo_user_blocks (user_id, reason, blocked_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET reason = EXCLUDED.reason, blocked_by = EXCLUDED.blocked_by
       RETURNING id, user_id, reason, blocked_by, created_at`,
      [userId, reason ?? null, adminId]
    );
    const row = result.rows[0];
    const nameResult = await pool.query<{ display_name: string | null }>(
      `SELECT display_name FROM users WHERE id = $1`,
      [userId]
    );
    return {
      id: row.id,
      userId: row.user_id,
      reason: row.reason ?? undefined,
      blockedBy: row.blocked_by,
      userName: nameResult.rows[0]?.display_name ?? undefined,
      createdAt: row.created_at,
    };
  },

  async listBlocks() {
    const pool = getPool();
    if (!pool) return mockPhotoBlocks;
    const result = await pool.query<{
      id: string;
      user_id: string;
      reason: string | null;
      blocked_by: string;
      created_at: string;
      display_name: string | null;
    }>(
      `SELECT b.*, u.display_name
       FROM photo_user_blocks b
       JOIN users u ON u.id = b.user_id
       ORDER BY b.created_at DESC`
    );
    return result.rows.map(
      (row): PhotoUserBlock => ({
        id: row.id,
        userId: row.user_id,
        reason: row.reason ?? undefined,
        blockedBy: row.blocked_by,
        userName: row.display_name ?? undefined,
        createdAt: row.created_at,
      })
    );
  },
};
