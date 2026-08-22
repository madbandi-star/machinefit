import {
  hasMinRole,
  isRoleCode,
  Role,
  type BoardType,
  type Post,
  type Comment,
  type MachineRequest,
  type MachineRequestComment,
  type MachineRequestImage,
  type MachineRequestListQuery,
  type RoleCode,
} from '@machinefit/shared';
import type {
  CreatePostInput,
  CreateCommentInput,
  UpdateCommentInput,
  CreateMachineRequestInput,
  UpdateMachineRequestInput,
  MachineRequestSimilarGroup,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import {
  mockPosts,
  mockComments,
  mockLikes,
  mockMachineRequests,
  mockMachineRequestImages,
  mockMachineRequestLikes,
  mockMachineRequestComments,
  likeKey,
  machineRequestLikeKey,
  filterPosts,
} from '../data/community.mock.js';
import { AppError } from '../middlewares/error.middleware.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import { machineRequestImageUrl } from '../utils/public-api-base.js';

function machineRequestSortSql(sort: MachineRequestListQuery['sort']): string {
  switch (sort) {
    case 'popular':
      return 'mr.like_count DESC, mr.created_at DESC';
    case 'votes':
      return 'COALESCE(mr.vote_count, 0) DESC, mr.created_at DESC';
    case 'views':
      return 'mr.view_count DESC, mr.created_at DESC';
    case 'comments':
      return 'mr.comment_count DESC, mr.created_at DESC';
    case 'latest':
    default:
      return 'mr.created_at DESC';
  }
}

function mapPublicMachineRequest(
  r: Record<string, unknown>,
  extras?: {
    images?: MachineRequestImage[];
    likedByMe?: boolean;
    votedByMe?: boolean;
    isMine?: boolean;
    imageCount?: number;
  }
): MachineRequest {
  const primaryImageId = (r.primary_image_id as string | null | undefined) ?? null;
  const primaryImageUrl = primaryImageId
    ? machineRequestImageUrl(primaryImageId, 'thumb')
    : extras?.images?.[0]?.thumbUrl;
  const ownerId = (r.user_id as string | undefined) ?? '';
  return {
    id: r.id as string,
    // Public board: hide others' user ids; expose own id only via isMine.
    userId: extras?.isMine ? ownerId : '',
    brandName: r.brand_name as string,
    machineName: r.machine_name as string,
    description: r.description as string,
    status: r.status as string,
    adminNote: (r.admin_note as string | null | undefined) ?? null,
    rejectReason: (r.reject_reason as string | null | undefined) ?? null,
    linkedMachineId: (r.linked_machine_id as string | null | undefined) ?? undefined,
    linkedMachineCode: (r.linked_machine_code as string | null | undefined) ?? null,
    authorName: (r.author_name as string | null | undefined) ?? undefined,
    authorRoleCode: isRoleCode(r.author_role_code) ? r.author_role_code : undefined,
    authorHellpowerScore: Number(r.author_hellpower_score ?? 0),
    gymChoiceMode: ((r.gym_choice_mode as string | null | undefined) ??
      'unknown') as MachineRequest['gymChoiceMode'],
    gymName: (r.gym_name as string | null | undefined) ?? null,
    images: extras?.images,
    primaryImageUrl,
    likeCount: Number(r.like_count ?? 0),
    commentCount: Number(r.comment_count ?? 0),
    viewCount: Number(r.view_count ?? 0),
    voteCount: Number(r.vote_count ?? 0),
    likedByMe: extras?.likedByMe ?? Boolean(r.liked_by_me),
    votedByMe: extras?.votedByMe ?? Boolean(r.voted_by_me),
    isMine: extras?.isMine ?? Boolean(r.is_mine),
    isHidden: Boolean(r.is_hidden),
    priority: ((r.priority as string | null | undefined) ?? 'normal') as MachineRequest['priority'],
    imageCount: extras?.imageCount ?? Number(r.image_count ?? extras?.images?.length ?? 0),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export type ProcessedMachineRequestImage = {
  buffer: Buffer;
  thumb: Buffer;
  mimeType: string;
  width: number;
  height: number;
  fileSizeBytes: number;
};

function mapRequestImages(
  rows: Array<{ id: string; sort_order: number }>
): MachineRequestImage[] {
  return rows.map((img) => ({
    id: img.id,
    sortOrder: img.sort_order,
    thumbUrl: machineRequestImageUrl(img.id, 'thumb'),
    imageUrl: machineRequestImageUrl(img.id, 'full'),
  }));
}

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
      role_code: string | null;
      hellpower_score: number;
      like_count: string;
      comment_count: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT p.id, p.user_id, p.board_type, p.title, p.content, p.language_code,
              p.is_pinned, p.is_hidden, p.view_count, p.created_at, p.updated_at,
              u.display_name, r.code AS role_code,
              COALESCE(up.balance, 0)::int AS hellpower_score,
              COALESCE(lc.cnt, 0)::text AS like_count,
              COALESCE(cc.cnt, 0)::text AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_points up ON up.user_id = u.id
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
      authorRoleCode: isRoleCode(r.role_code) ? r.role_code : undefined,
      authorHellpowerScore: Number(r.hellpower_score ?? 0),
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
      `SELECT p.*, u.display_name, r.code AS role_code,
        COALESCE(up.balance, 0)::int AS hellpower_score,
        (SELECT COUNT(*)::text FROM likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*)::text FROM comments c WHERE c.post_id = p.id AND c.is_hidden = FALSE) AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_points up ON up.user_id = u.id
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
      authorRoleCode: isRoleCode(r.role_code) ? r.role_code : undefined,
      authorHellpowerScore: Number(r.hellpower_score ?? 0),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async createPost(
    userId: string,
    authorName: string,
    input: CreatePostInput,
    authorRoleCode?: RoleCode,
    authorHellpowerScore?: number
  ): Promise<Post> {
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
        authorRoleCode,
        authorHellpowerScore,
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
      authorRoleCode,
      authorHellpowerScore,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async deletePost(postId: string, userId: string, roleCode: RoleCode): Promise<void> {
    const pool = getPool();
    const isAdmin = hasMinRole(roleCode, Role.ADMIN);

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
      `SELECT c.*, u.display_name AS author_name, r.code AS author_role_code,
              COALESCE(up.balance, 0)::int AS author_hellpower_score
       FROM comments c
       JOIN users u ON u.id = c.user_id
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_points up ON up.user_id = u.id
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
      authorRoleCode: isRoleCode(r.author_role_code) ? r.author_role_code : undefined,
      authorHellpowerScore: Number(r.author_hellpower_score ?? 0),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async createComment(
    postId: string,
    userId: string,
    authorName: string,
    input: CreateCommentInput,
    authorRoleCode?: RoleCode,
    authorHellpowerScore?: number
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
        authorRoleCode,
        authorHellpowerScore,
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
      authorRoleCode,
      authorHellpowerScore,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async updateComment(
    commentId: string,
    userId: string,
    input: UpdateCommentInput
  ): Promise<Comment> {
    const pool = getPool();
    const now = new Date().toISOString();
    if (!pool) {
      const comment = mockComments.find((c) => c.id === commentId && !c.isHidden);
      if (!comment) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
      if (comment.userId !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'Only the author can edit this comment');
      }
      comment.content = input.content;
      comment.updatedAt = now;
      return comment;
    }

    const existing = await pool.query<{ user_id: string; is_hidden: boolean }>(
      `SELECT user_id, is_hidden FROM comments WHERE id = $1`,
      [commentId]
    );
    const row = existing.rows[0];
    if (!row || row.is_hidden) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    if (row.user_id !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Only the author can edit this comment');
    }

    const result = await pool.query(
      `UPDATE comments SET content = $1 WHERE id = $2
       RETURNING *,
         (SELECT display_name FROM users WHERE id = comments.user_id) AS author_name,
         (
           SELECT r.code FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE u.id = comments.user_id
         ) AS author_role_code,
         (
           SELECT COALESCE(up.balance, 0)::int FROM user_points up
           WHERE up.user_id = comments.user_id
         ) AS author_hellpower_score`,
      [input.content, commentId]
    );
    const r = result.rows[0];
    return {
      id: r.id,
      postId: r.post_id,
      userId: r.user_id,
      parentId: r.parent_id ?? undefined,
      content: r.content,
      isHidden: r.is_hidden,
      authorName: r.author_name,
      authorRoleCode: isRoleCode(r.author_role_code) ? r.author_role_code : undefined,
      authorHellpowerScore: Number(r.author_hellpower_score ?? 0),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },
  async deleteComment(commentId: string, userId: string, role: RoleCode): Promise<void> {
    const pool = getPool();
    if (!pool) {
      const comment = mockComments.find((c) => c.id === commentId && !c.isHidden);
      if (!comment) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
      if (comment.userId !== userId && !hasMinRole(role, Role.ADMIN)) {
        throw new AppError(403, 'FORBIDDEN', 'Only the author or admin can delete this comment');
      }
      for (const c of mockComments) {
        if (c.id === commentId || c.parentId === commentId) c.isHidden = true;
      }
      const post = mockPosts.find((p) => p.id === comment.postId);
      if (post) {
        post.commentCount = mockComments.filter(
          (c) => c.postId === comment.postId && !c.isHidden
        ).length;
      }
      return;
    }

    const existing = await pool.query<{ user_id: string; post_id: string; is_hidden: boolean }>(
      `SELECT user_id, post_id, is_hidden FROM comments WHERE id = $1`,
      [commentId]
    );
    const row = existing.rows[0];
    if (!row || row.is_hidden) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    if (row.user_id !== userId && !hasMinRole(role, Role.ADMIN)) {
      throw new AppError(403, 'FORBIDDEN', 'Only the author or admin can delete this comment');
    }

    await pool.query(
      `UPDATE comments
       SET is_hidden = TRUE
       WHERE is_hidden = FALSE AND (id = $1 OR parent_id = $1)`,
      [commentId]
    );
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

  async listMachineRequests(query: MachineRequestListQuery, viewerId?: string) {
    const page = query.page;
    const limit = query.limit;
    const pool = getPool();
    if (!pool) {
      let filtered = [...mockMachineRequests];
      if (query.mine && viewerId) {
        filtered = filtered.filter((r) => r.userId === viewerId);
      }
      if (query.likedByMe && viewerId) {
        filtered = filtered.filter((r) =>
          mockMachineRequestLikes.has(machineRequestLikeKey(viewerId, r.id))
        );
      }
      if (query.q) {
        const q = query.q.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.brandName.toLowerCase().includes(q) ||
            r.machineName.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            (r.authorName ?? '').toLowerCase().includes(q) ||
            (r.gymName ?? '').toLowerCase().includes(q)
        );
      }
      filtered.sort((a, b) => {
        if (query.sort === 'popular') return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        if (query.sort === 'views') return (b.viewCount ?? 0) - (a.viewCount ?? 0);
        if (query.sort === 'comments') return (b.commentCount ?? 0) - (a.commentCount ?? 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit).map((req) => ({
        ...req,
        userId: '',
        adminNote: undefined,
        commercialUseConsent: undefined,
        likedByMe: viewerId
          ? mockMachineRequestLikes.has(machineRequestLikeKey(viewerId, req.id))
          : false,
        imageCount:
          req.imageCount ??
          [...mockMachineRequestImages.values()].filter((img) => img.requestId === req.id).length,
        primaryImageUrl:
          req.primaryImageUrl ??
          (() => {
            const entry = [...mockMachineRequestImages.entries()].find(
              ([, img]) => img.requestId === req.id
            );
            return entry ? machineRequestImageUrl(entry[0], 'thumb') : undefined;
          })(),
      }));
      return {
        items,
        meta: buildPaginationMeta(page, limit, filtered.length),
      };
    }

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (query.mine) {
      if (!viewerId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      conditions.push(`mr.user_id = $${idx++}`);
      params.push(viewerId);
    } else if (!query.includeClosed) {
      // Public feed: hide rejected + admin-hidden posts.
      conditions.push(`COALESCE(mr.is_hidden, FALSE) = FALSE`);
      conditions.push(`mr.status NOT IN ('rejected')`);
    } else {
      conditions.push(`COALESCE(mr.is_hidden, FALSE) = FALSE`);
    }
    if (query.likedByMe) {
      if (!viewerId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      conditions.push(
        `EXISTS (
           SELECT 1 FROM machine_request_likes l
           WHERE l.request_id = mr.id AND l.user_id = $${idx}
         )`
      );
      params.push(viewerId);
      idx += 1;
    }
    if (query.q) {
      conditions.push(
        `(mr.brand_name ILIKE $${idx} OR mr.machine_name ILIKE $${idx} OR mr.description ILIKE $${idx}
          OR COALESCE(u.display_name, '') ILIKE $${idx} OR COALESCE(mr.gym_name, '') ILIKE $${idx})`
      );
      params.push(`%${query.q}%`);
      idx += 1;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM machine_requests mr
       JOIN users u ON u.id = mr.user_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const viewerSelects = viewerId
      ? `, EXISTS (
           SELECT 1 FROM machine_request_likes l
           WHERE l.request_id = mr.id AND l.user_id = $${idx}
         ) AS liked_by_me,
         EXISTS (
           SELECT 1 FROM machine_request_votes v
           WHERE v.request_id = mr.id AND v.user_id = $${idx}
         ) AS voted_by_me,
         (mr.user_id = $${idx}) AS is_mine`
      : ', FALSE AS liked_by_me, FALSE AS voted_by_me, FALSE AS is_mine';
    const listParams = viewerId
      ? [...params, viewerId, limit, (page - 1) * limit]
      : [...params, limit, (page - 1) * limit];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const result = await pool.query(
      `SELECT mr.*, u.display_name AS author_name, r.code AS author_role_code,
              COALESCE(up.balance, 0)::int AS author_hellpower_score,
              m.code AS linked_machine_code,
              (
                SELECT i.id
                FROM machine_request_images i
                WHERE i.request_id = mr.id
                ORDER BY i.sort_order ASC, i.created_at ASC
                LIMIT 1
              ) AS primary_image_id,
              (
                SELECT COUNT(*)::int
                FROM machine_request_images i
                WHERE i.request_id = mr.id
              ) AS image_count
              ${viewerSelects}
       FROM machine_requests mr
       JOIN users u ON u.id = mr.user_id
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_points up ON up.user_id = u.id
       LEFT JOIN machines m ON m.id = mr.linked_machine_id
       ${where}
       ORDER BY ${machineRequestSortSql(query.sort)}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams
    );
    const items = result.rows.map((r) =>
      mapPublicMachineRequest(r, {
        likedByMe: Boolean(r.liked_by_me),
        votedByMe: Boolean(r.voted_by_me),
        isMine: Boolean(r.is_mine),
        imageCount: Number(r.image_count ?? 0),
      })
    );
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getMachineRequest(requestId: string, viewerId?: string, options?: { incrementView?: boolean }) {
    const pool = getPool();
    if (!pool) {
      const req = mockMachineRequests.find((r) => r.id === requestId);
      if (!req) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
      if (options?.incrementView) req.viewCount = (req.viewCount ?? 0) + 1;
      const images: MachineRequestImage[] = [];
      for (const [id, img] of mockMachineRequestImages.entries()) {
        if (img.requestId !== requestId) continue;
        images.push({
          id,
          sortOrder: images.length,
          thumbUrl: machineRequestImageUrl(id, 'thumb'),
          imageUrl: machineRequestImageUrl(id, 'full'),
        });
      }
      const comments = mockMachineRequestComments.filter(
        (c) => c.requestId === requestId && !c.isHidden
      );
      return {
        request: {
          ...req,
          userId: '',
          adminNote: undefined,
          commercialUseConsent: undefined,
          images,
          primaryImageUrl: images[0]?.thumbUrl,
          likedByMe: viewerId
            ? mockMachineRequestLikes.has(machineRequestLikeKey(viewerId, requestId))
            : false,
          imageCount: images.length,
        },
        comments,
      };
    }

    if (options?.incrementView) {
      await pool.query(`UPDATE machine_requests SET view_count = view_count + 1 WHERE id = $1`, [
        requestId,
      ]);
    }

    const requestResult = await pool.query(
      `SELECT mr.*, u.display_name AS author_name, r.code AS author_role_code,
              COALESCE(up.balance, 0)::int AS author_hellpower_score,
              m.code AS linked_machine_code,
              ${
                viewerId
                  ? `EXISTS (
                       SELECT 1 FROM machine_request_likes l
                       WHERE l.request_id = mr.id AND l.user_id = $2
                     ) AS liked_by_me,
                     EXISTS (
                       SELECT 1 FROM machine_request_votes v
                       WHERE v.request_id = mr.id AND v.user_id = $2
                     ) AS voted_by_me,
                     (mr.user_id = $2) AS is_mine`
                  : 'FALSE AS liked_by_me, FALSE AS voted_by_me, FALSE AS is_mine'
              }
       FROM machine_requests mr
       JOIN users u ON u.id = mr.user_id
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_points up ON up.user_id = u.id
       LEFT JOIN machines m ON m.id = mr.linked_machine_id
       WHERE mr.id = $1
         AND (
           COALESCE(mr.is_hidden, FALSE) = FALSE
           OR ($2::uuid IS NOT NULL AND mr.user_id = $2)
         )`,
      viewerId ? [requestId, viewerId] : [requestId, null]
    );
    const row = requestResult.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');

    const [imageResult, commentResult] = await Promise.all([
      pool.query<{ id: string; sort_order: number }>(
        `SELECT id, sort_order
         FROM machine_request_images
         WHERE request_id = $1
         ORDER BY sort_order ASC, created_at ASC`,
        [requestId]
      ),
      pool.query<{
        id: string;
        request_id: string;
        user_id: string;
        parent_id: string | null;
        content: string;
        is_hidden: boolean;
        display_name: string | null;
        role_code: string | null;
        hellpower_score: number;
        created_at: string;
        updated_at: string;
      }>(
        `SELECT c.id, c.request_id, c.user_id, c.parent_id, c.content, c.is_hidden,
                c.created_at, c.updated_at, u.display_name, r.code AS role_code,
                COALESCE(up.balance, 0)::int AS hellpower_score
         FROM machine_request_comments c
         JOIN users u ON u.id = c.user_id
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN user_points up ON up.user_id = u.id
         WHERE c.request_id = $1 AND c.is_hidden = FALSE
         ORDER BY c.created_at ASC`,
        [requestId]
      ),
    ]);

    const images = mapRequestImages(imageResult.rows);
    const comments: MachineRequestComment[] = commentResult.rows.map((c) => ({
      id: c.id,
      requestId: c.request_id,
      userId: c.user_id,
      parentId: c.parent_id ?? undefined,
      content: c.content,
      isHidden: c.is_hidden,
      authorName: c.display_name ?? undefined,
      authorRoleCode: isRoleCode(c.role_code) ? c.role_code : undefined,
      authorHellpowerScore: Number(c.hellpower_score ?? 0),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return {
      request: mapPublicMachineRequest(row, {
        images,
        likedByMe: Boolean(row.liked_by_me),
        votedByMe: Boolean(row.voted_by_me),
        isMine: Boolean(row.is_mine),
        imageCount: images.length,
      }),
      comments,
    };
  },

  async toggleMachineRequestLike(requestId: string, userId: string) {
    const pool = getPool();
    if (!pool) {
      const req = mockMachineRequests.find((r) => r.id === requestId);
      if (!req) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
      const key = machineRequestLikeKey(userId, requestId);
      if (mockMachineRequestLikes.has(key)) {
        mockMachineRequestLikes.delete(key);
        req.likeCount = Math.max(0, (req.likeCount ?? 0) - 1);
        return { liked: false, likeCount: req.likeCount, authorId: req.userId };
      }
      mockMachineRequestLikes.add(key);
      req.likeCount = (req.likeCount ?? 0) + 1;
      return { liked: true, likeCount: req.likeCount, authorId: req.userId };
    }

    const existing = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM machine_requests WHERE id = $1`,
      [requestId]
    );
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');

    const liked = await pool.query(
      `SELECT 1 FROM machine_request_likes WHERE user_id = $1 AND request_id = $2`,
      [userId, requestId]
    );
    if (liked.rowCount) {
      await pool.query(`DELETE FROM machine_request_likes WHERE user_id = $1 AND request_id = $2`, [
        userId,
        requestId,
      ]);
      await pool.query(
        `UPDATE machine_requests SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1`,
        [requestId]
      );
    } else {
      await pool.query(`INSERT INTO machine_request_likes (user_id, request_id) VALUES ($1, $2)`, [
        userId,
        requestId,
      ]);
      await pool.query(`UPDATE machine_requests SET like_count = like_count + 1 WHERE id = $1`, [
        requestId,
      ]);
    }
    const count = await pool.query<{ like_count: number }>(
      `SELECT like_count FROM machine_requests WHERE id = $1`,
      [requestId]
    );
    return {
      liked: !liked.rowCount,
      likeCount: count.rows[0]?.like_count ?? 0,
      authorId: existing.rows[0].user_id,
    };
  },

  async createMachineRequestComment(
    requestId: string,
    userId: string,
    authorName: string,
    input: CreateCommentInput,
    authorRoleCode?: RoleCode,
    authorHellpowerScore?: number
  ) {
    const pool = getPool();
    if (!pool) {
      const req = mockMachineRequests.find((r) => r.id === requestId);
      if (!req) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
      const now = new Date().toISOString();
      const comment: MachineRequestComment = {
        id: crypto.randomUUID(),
        requestId,
        userId,
        parentId: input.parentId,
        content: input.content,
        isHidden: false,
        authorName,
        authorRoleCode,
        authorHellpowerScore,
        createdAt: now,
        updatedAt: now,
      };
      mockMachineRequestComments.push(comment);
      req.commentCount = (req.commentCount ?? 0) + 1;
      return { comment, authorId: req.userId };
    }

    const req = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM machine_requests WHERE id = $1`,
      [requestId]
    );
    if (!req.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');

    if (input.parentId) {
      const parent = await pool.query(
        `SELECT 1 FROM machine_request_comments
         WHERE id = $1 AND request_id = $2 AND is_hidden = FALSE`,
        [input.parentId, requestId]
      );
      if (!parent.rowCount) throw new AppError(400, 'INVALID_PARENT', 'Parent comment not found');
    }

    const result = await pool.query<{
      id: string;
      request_id: string;
      user_id: string;
      parent_id: string | null;
      content: string;
      is_hidden: boolean;
      created_at: string;
      updated_at: string;
      display_name: string | null;
      role_code: string | null;
      hellpower_score: number;
    }>(
      `WITH inserted AS (
         INSERT INTO machine_request_comments (request_id, user_id, parent_id, content)
         VALUES ($1, $2, $3, $4)
         RETURNING *
       )
       SELECT i.*, u.display_name, r.code AS role_code,
              COALESCE(up.balance, 0)::int AS hellpower_score
       FROM inserted i
       JOIN users u ON u.id = i.user_id
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_points up ON up.user_id = u.id`,
      [requestId, userId, input.parentId ?? null, input.content]
    );
    await pool.query(
      `UPDATE machine_requests SET comment_count = comment_count + 1 WHERE id = $1`,
      [requestId]
    );
    const c = result.rows[0];
    return {
      comment: {
        id: c.id,
        requestId: c.request_id,
        userId: c.user_id,
        parentId: c.parent_id ?? undefined,
        content: c.content,
        isHidden: c.is_hidden,
        authorName: c.display_name ?? authorName,
        authorRoleCode: isRoleCode(c.role_code) ? c.role_code : authorRoleCode,
        authorHellpowerScore: Number(c.hellpower_score ?? authorHellpowerScore ?? 0),
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      } satisfies MachineRequestComment,
      authorId: req.rows[0].user_id,
    };
  },

  async deleteMachineRequestComment(commentId: string, userId: string, role: RoleCode) {
    const pool = getPool();
    if (!pool) {
      const index = mockMachineRequestComments.findIndex((c) => c.id === commentId);
      if (index < 0) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
      const comment = mockMachineRequestComments[index];
      if (comment.userId !== userId && !hasMinRole(role, Role.ADMIN)) {
        throw new AppError(403, 'FORBIDDEN', 'Only the author can delete this comment');
      }
      mockMachineRequestComments.splice(index, 1);
      const req = mockMachineRequests.find((r) => r.id === comment.requestId);
      if (req) req.commentCount = Math.max(0, (req.commentCount ?? 0) - 1);
      return;
    }

    const existing = await pool.query<{
      user_id: string;
      request_id: string;
      is_hidden: boolean;
    }>(`SELECT user_id, request_id, is_hidden FROM machine_request_comments WHERE id = $1`, [
      commentId,
    ]);
    const row = existing.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    if (row.user_id !== userId && !hasMinRole(role, Role.ADMIN)) {
      throw new AppError(403, 'FORBIDDEN', 'Only the author can delete this comment');
    }
    if (hasMinRole(role, Role.ADMIN)) {
      await pool.query(`UPDATE machine_request_comments SET is_hidden = TRUE WHERE id = $1`, [
        commentId,
      ]);
    } else {
      await pool.query(`DELETE FROM machine_request_comments WHERE id = $1`, [commentId]);
    }
    if (!row.is_hidden) {
      await pool.query(
        `UPDATE machine_requests SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1`,
        [row.request_id]
      );
    }
  },

  async createMachineRequest(
    userId: string,
    authorName: string,
    input: CreateMachineRequestInput,
    images: ProcessedMachineRequestImage[],
    authorRoleCode?: RoleCode,
    authorHellpowerScore?: number
  ): Promise<MachineRequest> {
    const pool = getPool();
    const now = new Date().toISOString();
    if (!pool) {
      const requestId = crypto.randomUUID();
      const mappedImages: MachineRequestImage[] = images.map((img, index) => {
        const id = crypto.randomUUID();
        mockMachineRequestImages.set(id, {
          requestId,
          mimeType: img.mimeType,
          imageData: img.buffer,
          thumbnailData: img.thumb,
        });
        return {
          id,
          sortOrder: index,
          thumbUrl: machineRequestImageUrl(id, 'thumb'),
          imageUrl: machineRequestImageUrl(id, 'full'),
        };
      });
      const gymName =
        input.gymChoiceMode === 'unknown' ? null : (input.gymName?.trim().slice(0, 50) || null);
      const req: MachineRequest = {
        id: requestId,
        userId,
        brandName: input.brandName,
        machineName: input.machineName,
        description: input.description,
        status: 'pending',
        authorName,
        authorRoleCode,
        authorHellpowerScore,
        commercialUseConsent: true,
        gymChoiceMode: input.gymChoiceMode,
        gymName,
        images: mappedImages,
        primaryImageUrl: mappedImages[0]?.thumbUrl,
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
        voteCount: 0,
        likedByMe: false,
        votedByMe: false,
        isMine: true,
        imageCount: mappedImages.length,
        createdAt: now,
        updatedAt: now,
      };
      mockMachineRequests.unshift(req);
      return req;
    }

    const gymName =
      input.gymChoiceMode === 'unknown' ? null : (input.gymName?.trim().slice(0, 50) || null);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO machine_requests
           (user_id, brand_name, machine_name, description, commercial_use_consent, gym_choice_mode, gym_name)
         VALUES ($1,$2,$3,$4,TRUE,$5,$6) RETURNING *`,
        [
          userId,
          input.brandName,
          input.machineName,
          input.description,
          input.gymChoiceMode,
          gymName,
        ]
      );
      const r = result.rows[0];
      const mappedImages: MachineRequestImage[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const inserted = await client.query<{ id: string; sort_order: number }>(
          `INSERT INTO machine_request_images
             (request_id, sort_order, mime_type, width, height, file_size_bytes, image_data, thumbnail_data)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           RETURNING id, sort_order`,
          [
            r.id,
            i,
            img.mimeType,
            img.width,
            img.height,
            img.fileSizeBytes,
            img.buffer,
            img.thumb,
          ]
        );
        mappedImages.push(...mapRequestImages(inserted.rows));
      }
      await client.query('COMMIT');
      return {
        id: r.id,
        userId: r.user_id,
        brandName: r.brand_name,
        machineName: r.machine_name,
        description: r.description,
        status: r.status,
        authorName,
        authorRoleCode,
        authorHellpowerScore,
        commercialUseConsent: true,
        gymChoiceMode: r.gym_choice_mode,
        gymName: r.gym_name,
        images: mappedImages,
        primaryImageUrl: mappedImages[0]?.thumbUrl,
        likeCount: Number(r.like_count ?? 0),
        commentCount: Number(r.comment_count ?? 0),
        viewCount: Number(r.view_count ?? 0),
        likedByMe: false,
        imageCount: mappedImages.length,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async toggleMachineRequestVote(requestId: string, userId: string) {
    const pool = getPool();
    if (!pool) {
      const req = mockMachineRequests.find((r) => r.id === requestId);
      if (!req) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
      const key = `vote:${userId}:${requestId}`;
      const likedKey = machineRequestLikeKey(userId, requestId);
      // reuse likes set for mock votes with prefix in memory via like set of vote keys
      if (mockMachineRequestLikes.has(key)) {
        mockMachineRequestLikes.delete(key);
        req.voteCount = Math.max(0, (req.voteCount ?? 0) - 1);
        return { voted: false, voteCount: req.voteCount ?? 0 };
      }
      mockMachineRequestLikes.add(key);
      void likedKey;
      req.voteCount = (req.voteCount ?? 0) + 1;
      return { voted: true, voteCount: req.voteCount ?? 0 };
    }

    const existing = await pool.query(`SELECT id FROM machine_requests WHERE id = $1`, [requestId]);
    if (!existing.rows[0]) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');

    const voted = await pool.query(
      `SELECT 1 FROM machine_request_votes WHERE user_id = $1 AND request_id = $2`,
      [userId, requestId]
    );
    if (voted.rowCount) {
      await pool.query(`DELETE FROM machine_request_votes WHERE user_id = $1 AND request_id = $2`, [
        userId,
        requestId,
      ]);
      await pool.query(
        `UPDATE machine_requests SET vote_count = GREATEST(COALESCE(vote_count, 0) - 1, 0) WHERE id = $1`,
        [requestId]
      );
    } else {
      await pool.query(`INSERT INTO machine_request_votes (user_id, request_id) VALUES ($1, $2)`, [
        userId,
        requestId,
      ]);
      await pool.query(
        `UPDATE machine_requests SET vote_count = COALESCE(vote_count, 0) + 1 WHERE id = $1`,
        [requestId]
      );
    }
    const count = await pool.query<{ vote_count: number }>(
      `SELECT COALESCE(vote_count, 0) AS vote_count FROM machine_requests WHERE id = $1`,
      [requestId]
    );
    return { voted: !voted.rowCount, voteCount: count.rows[0]?.vote_count ?? 0 };
  },

  async updateMachineRequest(
    requestId: string,
    userId: string,
    role: RoleCode,
    input: UpdateMachineRequestInput
  ): Promise<MachineRequest> {
    const pool = getPool();
    if (!pool) {
      const req = mockMachineRequests.find((r) => r.id === requestId);
      if (!req) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
      if (req.userId !== userId && !hasMinRole(role, Role.ADMIN)) {
        throw new AppError(403, 'FORBIDDEN', 'Only the author can edit this request');
      }
      if (input.brandName) req.brandName = input.brandName;
      if (input.machineName) req.machineName = input.machineName;
      if (input.description) req.description = input.description;
      if (input.gymChoiceMode) req.gymChoiceMode = input.gymChoiceMode;
      if (input.gymName !== undefined) req.gymName = input.gymName;
      req.updatedAt = new Date().toISOString();
      return { ...req, isMine: true };
    }

    const existing = await pool.query<{ user_id: string; status: string }>(
      `SELECT user_id, status FROM machine_requests WHERE id = $1`,
      [requestId]
    );
    const row = existing.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
    if (row.user_id !== userId && !hasMinRole(role, Role.ADMIN)) {
      throw new AppError(403, 'FORBIDDEN', 'Only the author can edit this request');
    }
    if (row.status === 'added' && !hasMinRole(role, Role.ADMIN)) {
      throw new AppError(400, 'NOT_EDITABLE', 'Registered requests cannot be edited');
    }

    const gymName =
      input.gymChoiceMode === 'unknown'
        ? null
        : input.gymName !== undefined
          ? input.gymName?.trim().slice(0, 50) || null
          : undefined;

    await pool.query(
      `UPDATE machine_requests SET
         brand_name = COALESCE($2, brand_name),
         machine_name = COALESCE($3, machine_name),
         description = COALESCE($4, description),
         gym_choice_mode = COALESCE($5, gym_choice_mode),
         gym_name = CASE WHEN $6::boolean THEN $7 ELSE gym_name END,
         updated_at = NOW()
       WHERE id = $1`,
      [
        requestId,
        input.brandName ?? null,
        input.machineName ?? null,
        input.description ?? null,
        input.gymChoiceMode ?? null,
        gymName !== undefined,
        gymName ?? null,
      ]
    );
    const detail = await this.getMachineRequest(requestId, userId);
    return detail.request;
  },

  async deleteMachineRequest(requestId: string, userId: string, role: RoleCode): Promise<void> {
    const pool = getPool();
    if (!pool) {
      const index = mockMachineRequests.findIndex((r) => r.id === requestId);
      if (index < 0) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
      const req = mockMachineRequests[index];
      if (req.userId !== userId && !hasMinRole(role, Role.ADMIN)) {
        throw new AppError(403, 'FORBIDDEN', 'Only the author can delete this request');
      }
      mockMachineRequests.splice(index, 1);
      return;
    }

    const existing = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM machine_requests WHERE id = $1`,
      [requestId]
    );
    const row = existing.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
    if (row.user_id !== userId && !hasMinRole(role, Role.ADMIN)) {
      throw new AppError(403, 'FORBIDDEN', 'Only the author can delete this request');
    }
    // Soft-hide for moderation consistency; authors get hard delete of their row.
    if (hasMinRole(role, Role.ADMIN) && row.user_id !== userId) {
      await pool.query(`UPDATE machine_requests SET is_hidden = TRUE, updated_at = NOW() WHERE id = $1`, [
        requestId,
      ]);
      return;
    }
    await pool.query(`DELETE FROM machine_requests WHERE id = $1`, [requestId]);
  },

  async listSimilarMachineRequestGroups(
    brandName: string,
    machineName: string,
    limit = 5
  ): Promise<MachineRequestSimilarGroup[]> {
    const pool = getPool();
    if (!pool) {
      const map = new Map<string, MachineRequestSimilarGroup>();
      for (const req of mockMachineRequests) {
        const key = `${req.brandName}|${req.machineName}`;
        const cur = map.get(key);
        if (!cur) {
          map.set(key, {
            brandName: req.brandName,
            machineName: req.machineName,
            requestCount: 1,
            voteCount: req.voteCount ?? 0,
            sampleRequestId: req.id,
            primaryImageUrl: req.primaryImageUrl,
          });
        } else {
          cur.requestCount += 1;
          cur.voteCount += req.voteCount ?? 0;
        }
      }
      return [...map.values()]
        .filter(
          (g) =>
            g.brandName.toLowerCase().includes(brandName.trim().toLowerCase().slice(0, 3)) ||
            g.machineName.toLowerCase().includes(machineName.trim().toLowerCase().slice(0, 3))
        )
        .slice(0, limit);
    }

    const result = await pool.query<{
      brand_name: string;
      machine_name: string;
      request_count: string;
      vote_count: string;
      sample_id: string;
      primary_image_id: string | null;
    }>(
      `SELECT
         (array_agg(mr.brand_name ORDER BY mr.created_at DESC))[1] AS brand_name,
         (array_agg(mr.machine_name ORDER BY mr.created_at DESC))[1] AS machine_name,
         COUNT(*)::text AS request_count,
         COALESCE(SUM(mr.vote_count), 0)::text AS vote_count,
         (array_agg(mr.id ORDER BY mr.created_at DESC))[1] AS sample_id,
         (
           SELECT i.id FROM machine_request_images i
           WHERE i.request_id = (array_agg(mr.id ORDER BY mr.created_at DESC))[1]
           ORDER BY i.sort_order ASC LIMIT 1
         ) AS primary_image_id
       FROM machine_requests mr
       WHERE COALESCE(mr.is_hidden, FALSE) = FALSE
         AND mr.status NOT IN ('rejected')
         AND (
           lower(trim(mr.brand_name)) = lower(trim($1))
           OR lower(trim(mr.machine_name)) = lower(trim($2))
           OR lower(trim(mr.machine_name)) LIKE '%' || lower(trim($2)) || '%'
         )
       GROUP BY lower(trim(mr.brand_name)), lower(trim(mr.machine_name))
       ORDER BY COUNT(*) DESC, COALESCE(SUM(mr.vote_count), 0) DESC
       LIMIT $3`,
      [brandName, machineName, limit]
    );
    return result.rows.map((r) => ({
      brandName: r.brand_name,
      machineName: r.machine_name,
      requestCount: Number(r.request_count),
      voteCount: Number(r.vote_count),
      sampleRequestId: r.sample_id,
      primaryImageUrl: r.primary_image_id
        ? machineRequestImageUrl(r.primary_image_id, 'thumb')
        : undefined,
    }));
  },

  async getMachineRequestImageMeta(imageId: string, variant: 'full' | 'thumb') {
    const pool = getPool();
    if (!pool) {
      const img = mockMachineRequestImages.get(imageId);
      if (!img) return null;
      return {
        mimeType: img.mimeType,
        etagToken: `${imageId}-${variant}-${img.imageData.length}`,
      };
    }
    const result = await pool.query<{
      mime_type: string;
      file_size_bytes: number | null;
      created_at: Date | string;
      has_blob: boolean;
      is_hidden: boolean;
    }>(
      `SELECT i.mime_type, i.file_size_bytes, i.created_at,
              (${variant === 'thumb' ? 'i.thumbnail_data' : 'i.image_data'} IS NOT NULL) AS has_blob,
              COALESCE(mr.is_hidden, FALSE) AS is_hidden
       FROM machine_request_images i
       JOIN machine_requests mr ON mr.id = i.request_id
       WHERE i.id = $1`,
      [imageId]
    );
    const row = result.rows[0];
    if (!row?.has_blob || row.is_hidden) return null;
    const stamp =
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at);
    return {
      mimeType: row.mime_type,
      etagToken: `${imageId}-${variant}-${row.file_size_bytes ?? 0}-${stamp}`,
    };
  },
  async getMachineRequestImageBinary(imageId: string, variant: 'full' | 'thumb') {
    const pool = getPool();
    if (!pool) {
      const img = mockMachineRequestImages.get(imageId);
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
      `SELECT i.mime_type, i.image_data, i.thumbnail_data,
              COALESCE(mr.is_hidden, FALSE) AS is_hidden
       FROM machine_request_images i
       JOIN machine_requests mr ON mr.id = i.request_id
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
};
