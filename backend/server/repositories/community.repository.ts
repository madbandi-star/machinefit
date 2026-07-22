import type { BoardType, Post, Comment, MachineRequest, RoleCode } from '@machinefit/shared';
import type { CreatePostInput, CreateCommentInput, CreateMachineRequestInput } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import {
  mockPosts,
  mockComments,
  mockLikes,
  mockMachineRequests,
  likeKey,
  filterPosts,
} from '../data/community.mock.js';
import { AppError } from '../middlewares/error.middleware.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';

export const communityRepository = {
  async listPosts(boardType?: BoardType, page = 1, limit = 20) {
    const pool = getPool();
    if (!pool) {
      const filtered = filterPosts(boardType);
      const start = (page - 1) * limit;
      return {
        items: filtered.slice(start, start + limit),
        meta: buildPaginationMeta(page, limit, filtered.length),
      };
    }

    const conditions = ['p.is_hidden = FALSE'];
    const params: unknown[] = [];
    let idx = 1;
    if (boardType) {
      conditions.push(`p.board_type = $${idx++}`);
      params.push(boardType);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const countPromise = pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM posts p ${where}`,
      params
    );

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    const resultPromise = pool.query<{
      id: string;
      user_id: string;
      board_type: string;
      title: string;
      content: string;
      language_code: string | null;
      is_pinned: boolean;
      is_hidden: boolean;
      view_count: number;
      display_name: string;
      like_count: string;
      comment_count: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT p.id, p.user_id, p.board_type, p.title, p.content, p.language_code,
              p.is_pinned, p.is_hidden, p.view_count, p.created_at, p.updated_at,
              u.display_name,
              COALESCE(lc.cnt, 0)::text AS like_count,
              COALESCE(cc.cnt, 0)::text AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN (
         SELECT post_id, COUNT(*)::bigint AS cnt FROM likes GROUP BY post_id
       ) lc ON lc.post_id = p.id
       LEFT JOIN (
         SELECT post_id, COUNT(*)::bigint AS cnt
         FROM comments
         WHERE is_hidden = FALSE
         GROUP BY post_id
       ) cc ON cc.post_id = p.id
       ${where}
       ORDER BY p.is_pinned DESC, p.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, limit, (page - 1) * limit]
    );

    const [count, result] = await Promise.all([countPromise, resultPromise]);
    const total = parseInt(count.rows[0]?.count ?? '0', 10);

    const items: Post[] = result.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      boardType: r.board_type as BoardType,
      title: r.title,
      content: r.content,
      languageCode: r.language_code ?? undefined,
      isPinned: r.is_pinned,
      isHidden: r.is_hidden,
      viewCount: r.view_count,
      likeCount: parseInt(r.like_count, 10),
      commentCount: parseInt(r.comment_count, 10),
      authorName: r.display_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getPost(postId: string): Promise<Post | null> {
    const pool = getPool();
    if (!pool) {
      const post = mockPosts.find((p) => p.id === postId && !p.isHidden);
      if (post) {
        post.viewCount++;
        post.likeCount = [...mockLikes].filter((k) => k.endsWith(`:${postId}`)).length;
        post.commentCount = mockComments.filter((c) => c.postId === postId && !c.isHidden).length;
      }
      return post ?? null;
    }

    const result = await pool.query(
      `SELECT p.*, u.display_name,
        (SELECT COUNT(*)::text FROM likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*)::text FROM comments c WHERE c.post_id = p.id AND c.is_hidden = FALSE) AS comment_count
       FROM posts p JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND p.is_hidden = FALSE`,
      [postId]
    );
    if (!result.rows[0]) return null;
    const r = result.rows[0];
    await pool.query('UPDATE posts SET view_count = view_count + 1 WHERE id = $1', [postId]);
    return {
      id: r.id,
      userId: r.user_id,
      boardType: r.board_type,
      title: r.title,
      content: r.content,
      languageCode: r.language_code,
      isPinned: r.is_pinned,
      isHidden: r.is_hidden,
      viewCount: r.view_count + 1,
      likeCount: parseInt(r.like_count, 10),
      commentCount: parseInt(r.comment_count, 10),
      authorName: r.display_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async createPost(userId: string, authorName: string, input: CreatePostInput): Promise<Post> {
    const pool = getPool();
    const now = new Date().toISOString();
    if (!pool) {
      const post: Post = {
        id: crypto.randomUUID(),
        userId,
        boardType: input.boardType,
        title: input.title,
        content: input.content,
        languageCode: input.languageCode,
        isPinned: false,
        isHidden: false,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        authorName,
        createdAt: now,
        updatedAt: now,
      };
      mockPosts.unshift(post);
      return post;
    }

    const result = await pool.query(
      `INSERT INTO posts (user_id, board_type, title, content, language_code)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, input.boardType, input.title, input.content, input.languageCode ?? null]
    );
    const r = result.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      boardType: r.board_type,
      title: r.title,
      content: r.content,
      languageCode: r.language_code,
      isPinned: false,
      isHidden: false,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      authorName,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async deletePost(postId: string, userId: string, roleCode: RoleCode): Promise<void> {
    const pool = getPool();
    const isAdmin = roleCode === 'admin';

    if (!pool) {
      const post = mockPosts.find((p) => p.id === postId);
      if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
      if (isAdmin) {
        if (post.boardType !== 'free') {
          throw new AppError(403, 'FORBIDDEN', 'Admins can only delete free board posts');
        }
      } else if (post.userId !== userId) {
        throw new AppError(404, 'NOT_FOUND', 'Post not found');
      }
      const idx = mockPosts.findIndex((p) => p.id === postId);
      mockPosts.splice(idx, 1);
      return;
    }

    if (isAdmin) {
      const result = await pool.query(
        "DELETE FROM posts WHERE id = $1 AND board_type = 'free' RETURNING id",
        [postId]
      );
      if (!result.rows[0]) {
        throw new AppError(404, 'NOT_FOUND', 'Post not found');
      }
      return;
    }

    const result = await pool.query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id',
      [postId, userId]
    );
    if (!result.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Post not found');
  },

  async listComments(postId: string): Promise<Comment[]> {
    const pool = getPool();
    if (!pool) {
      return mockComments.filter((c) => c.postId === postId && !c.isHidden);
    }
    const result = await pool.query(
      `SELECT c.*, u.display_name AS author_name FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1 AND c.is_hidden = FALSE ORDER BY c.created_at ASC`,
      [postId]
    );
    return result.rows.map((r) => ({
      id: r.id,
      postId: r.post_id,
      userId: r.user_id,
      parentId: r.parent_id,
      content: r.content,
      isHidden: r.is_hidden,
      authorName: r.author_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async createComment(
    postId: string,
    userId: string,
    authorName: string,
    input: CreateCommentInput
  ): Promise<Comment> {
    const pool = getPool();
    const now = new Date().toISOString();
    if (!pool) {
      const comment: Comment = {
        id: crypto.randomUUID(),
        postId,
        userId,
        parentId: input.parentId,
        content: input.content,
        isHidden: false,
        authorName,
        createdAt: now,
        updatedAt: now,
      };
      mockComments.push(comment);
      const post = mockPosts.find((p) => p.id === postId);
      if (post) post.commentCount = (post.commentCount ?? 0) + 1;
      return comment;
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, parent_id, content)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [postId, userId, input.parentId ?? null, input.content]
    );
    const r = result.rows[0];
    return {
      id: r.id,
      postId: r.post_id,
      userId: r.user_id,
      parentId: r.parent_id,
      content: r.content,
      isHidden: r.is_hidden,
      authorName,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const pool = getPool();
    if (!pool) {
      const key = likeKey(userId, postId);
      if (mockLikes.has(key)) {
        mockLikes.delete(key);
      } else {
        mockLikes.add(key);
      }
      const likeCount = [...mockLikes].filter((k) => k.endsWith(`:${postId}`)).length;
      const post = mockPosts.find((p) => p.id === postId);
      if (post) post.likeCount = likeCount;
      return { liked: mockLikes.has(key), likeCount };
    }

    const existing = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );
    if (existing.rows[0]) {
      await pool.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    } else {
      await pool.query('INSERT INTO likes (user_id, post_id) VALUES ($1,$2)', [userId, postId]);
    }
    const count = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM likes WHERE post_id = $1',
      [postId]
    );
    return {
      liked: !existing.rows[0],
      likeCount: parseInt(count.rows[0]?.count ?? '0', 10),
    };
  },

  async listMachineRequests(page = 1, limit = 20) {
    const pool = getPool();
    if (!pool) {
      const start = (page - 1) * limit;
      return {
        items: mockMachineRequests.slice(start, start + limit),
        meta: buildPaginationMeta(page, limit, mockMachineRequests.length),
      };
    }

    const count = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM machine_requests'
    );
    const total = parseInt(count.rows[0]?.count ?? '0', 10);
    const result = await pool.query(
      `SELECT mr.*, u.display_name AS author_name FROM machine_requests mr
       JOIN users u ON u.id = mr.user_id
       ORDER BY mr.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit]
    );
    const items: MachineRequest[] = result.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      brandName: r.brand_name,
      machineName: r.machine_name,
      description: r.description,
      status: r.status,
      adminNote: r.admin_note,
      linkedMachineId: r.linked_machine_id,
      authorName: r.author_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async createMachineRequest(
    userId: string,
    authorName: string,
    input: CreateMachineRequestInput
  ): Promise<MachineRequest> {
    const pool = getPool();
    const now = new Date().toISOString();
    if (!pool) {
      const req: MachineRequest = {
        id: crypto.randomUUID(),
        userId,
        brandName: input.brandName,
        machineName: input.machineName,
        description: input.description,
        status: 'pending',
        authorName,
        createdAt: now,
        updatedAt: now,
      };
      mockMachineRequests.unshift(req);
      return req;
    }

    const result = await pool.query(
      `INSERT INTO machine_requests (user_id, brand_name, machine_name, description)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [userId, input.brandName ?? null, input.machineName, input.description ?? null]
    );
    const r = result.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      brandName: r.brand_name,
      machineName: r.machine_name,
      description: r.description,
      status: r.status,
      authorName,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },
};
