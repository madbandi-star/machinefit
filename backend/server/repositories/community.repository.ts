import {
  hasMinRole,
  Role,
  type BoardType,
  type Post,
  type Comment,
  type MachineRequest,
  type MachineRequestImage,
  type RoleCode,
} from '@machinefit/shared';
import type {
  CreatePostInput,
  CreateCommentInput,
  CreateMachineRequestInput,
  UpdateMachineRequestInput,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import {
  mockPosts,
  mockComments,
  mockLikes,
  mockMachineRequests,
  mockMachineRequestImages,
  mockMachineRequestVotes,
  machineRequestVoteKey,
  likeKey,
  filterPosts,
} from '../data/community.mock.js';
import { AppError } from '../middlewares/error.middleware.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import { machineRequestImageUrl } from '../utils/public-api-base.js';

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

  async listMachineRequests(page = 1, limit = 20, viewerId?: string) {
    const pool = getPool();
    if (!pool) {
      const start = (page - 1) * limit;
      const items = mockMachineRequests.slice(start, start + limit).map((req) => ({
        ...req,
        userId: '',
        adminNote: undefined,
        commercialUseConsent: undefined,
        voteCount: req.voteCount ?? 0,
        votedByMe: viewerId
          ? mockMachineRequestVotes.has(machineRequestVoteKey(viewerId, req.id))
          : false,
        isMine: Boolean(viewerId) && req.userId === viewerId,
      }));
      return {
        items,
        meta: buildPaginationMeta(page, limit, mockMachineRequests.length),
      };
    }

    const count = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM machine_requests'
    );
    const total = parseInt(count.rows[0]?.count ?? '0', 10);
    const viewerSelects = viewerId
      ? `, EXISTS (
           SELECT 1 FROM machine_request_votes v
           WHERE v.request_id = mr.id AND v.user_id = $3
         ) AS voted_by_me,
         (mr.user_id = $3) AS is_mine`
      : ', FALSE AS voted_by_me, FALSE AS is_mine';
    const params = viewerId
      ? [limit, (page - 1) * limit, viewerId]
      : [limit, (page - 1) * limit];
    const result = await pool.query(
      `SELECT mr.*, u.display_name AS author_name,
              COALESCE(mr.vote_count, 0) AS vote_count,
              (
                SELECT i.id
                FROM machine_request_images i
                WHERE i.request_id = mr.id
                ORDER BY i.sort_order ASC, i.created_at ASC
                LIMIT 1
              ) AS primary_image_id
              ${viewerSelects}
       FROM machine_requests mr
       JOIN users u ON u.id = mr.user_id
       ORDER BY mr.created_at DESC LIMIT $1 OFFSET $2`,
      params
    );
    const items: MachineRequest[] = result.rows.map((r) => {
      const primaryImageUrl = r.primary_image_id
        ? machineRequestImageUrl(r.primary_image_id, 'thumb')
        : undefined;
      return {
        id: r.id,
        // Public board must not expose internal user ids or admin notes.
        userId: '',
        brandName: r.brand_name,
        machineName: r.machine_name,
        description: r.description,
        status: r.status,
        adminNote: undefined,
        linkedMachineId: r.linked_machine_id,
        authorName: r.author_name,
        gymChoiceMode: r.gym_choice_mode ?? 'unknown',
        gymName: r.gym_name ?? null,
        primaryImageUrl,
        voteCount: Number(r.vote_count ?? 0),
        votedByMe: r.voted_by_me === true,
        isMine: r.is_mine === true,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async toggleMachineRequestVote(requestId: string, userId: string) {
    const pool = getPool();
    if (!pool) {
      const req = mockMachineRequests.find((r) => r.id === requestId);
      if (!req) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
      if (req.userId === userId) {
        throw new AppError(400, 'OWN_REQUEST', 'Cannot vote on your own request');
      }
      const key = machineRequestVoteKey(userId, requestId);
      if (mockMachineRequestVotes.has(key)) {
        mockMachineRequestVotes.delete(key);
        req.voteCount = Math.max(0, (req.voteCount ?? 0) - 1);
        return { voted: false, voteCount: req.voteCount ?? 0 };
      }
      mockMachineRequestVotes.add(key);
      req.voteCount = (req.voteCount ?? 0) + 1;
      return { voted: true, voteCount: req.voteCount ?? 0 };
    }

    const existing = await pool.query<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM machine_requests WHERE id = $1`,
      [requestId]
    );
    const row = existing.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
    if (row.user_id === userId) {
      throw new AppError(400, 'OWN_REQUEST', 'Cannot vote on your own request');
    }

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
    return { voted: !voted.rowCount, voteCount: Number(count.rows[0]?.vote_count ?? 0) };
  },

  async createMachineRequest(
    userId: string,
    authorName: string,
    input: CreateMachineRequestInput,
    images: ProcessedMachineRequestImage[]
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
        commercialUseConsent: true,
        gymChoiceMode: input.gymChoiceMode,
        gymName,
        images: mappedImages,
        primaryImageUrl: mappedImages[0]?.thumbUrl,
        voteCount: 0,
        votedByMe: false,
        isMine: true,
        createdAt: now,
        updatedAt: now,
      };
      mockMachineRequests.unshift(req);
      return { ...req, userId: '', commercialUseConsent: undefined };
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
        // Keep public create response consistent with list/detail (no internal user id).
        userId: '',
        brandName: r.brand_name,
        machineName: r.machine_name,
        description: r.description,
        status: r.status,
        authorName,
        commercialUseConsent: true,
        gymChoiceMode: r.gym_choice_mode,
        gymName: r.gym_name,
        images: mappedImages,
        primaryImageUrl: mappedImages[0]?.thumbUrl,
        voteCount: Number(r.vote_count ?? 0),
        votedByMe: false,
        isMine: true,
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

  async getMachineRequest(requestId: string, viewerId?: string): Promise<MachineRequest> {
    const pool = getPool();
    if (!pool) {
      const req = mockMachineRequests.find((r) => r.id === requestId);
      if (!req) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');
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
      return {
        ...req,
        userId: '',
        adminNote: undefined,
        commercialUseConsent: undefined,
        images,
        primaryImageUrl: images[0]?.thumbUrl ?? req.primaryImageUrl,
        voteCount: req.voteCount ?? 0,
        votedByMe: viewerId
          ? mockMachineRequestVotes.has(machineRequestVoteKey(viewerId, requestId))
          : false,
        isMine: Boolean(viewerId) && req.userId === viewerId,
      };
    }

    const viewerSelects = viewerId
      ? `, EXISTS (
           SELECT 1 FROM machine_request_votes v
           WHERE v.request_id = mr.id AND v.user_id = $2
         ) AS voted_by_me,
         (mr.user_id = $2) AS is_mine`
      : ', FALSE AS voted_by_me, FALSE AS is_mine';
    const result = await pool.query(
      `SELECT mr.*, u.display_name AS author_name,
              COALESCE(mr.vote_count, 0) AS vote_count
              ${viewerSelects}
       FROM machine_requests mr
       JOIN users u ON u.id = mr.user_id
       WHERE mr.id = $1`,
      viewerId ? [requestId, viewerId] : [requestId]
    );
    const r = result.rows[0];
    if (!r) throw new AppError(404, 'NOT_FOUND', 'Machine request not found');

    const imageResult = await pool.query<{ id: string; sort_order: number }>(
      `SELECT id, sort_order
       FROM machine_request_images
       WHERE request_id = $1
       ORDER BY sort_order ASC, created_at ASC`,
      [requestId]
    );
    const images = mapRequestImages(imageResult.rows);
    return {
      id: r.id,
      userId: '',
      brandName: r.brand_name,
      machineName: r.machine_name,
      description: r.description,
      status: r.status,
      adminNote: undefined,
      linkedMachineId: r.linked_machine_id ?? undefined,
      authorName: r.author_name,
      gymChoiceMode: r.gym_choice_mode ?? 'unknown',
      gymName: r.gym_name ?? null,
      images,
      primaryImageUrl: images[0]?.thumbUrl,
      voteCount: Number(r.vote_count ?? 0),
      votedByMe: r.voted_by_me === true,
      isMine: r.is_mine === true,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
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
      if (req.status === 'added' && !hasMinRole(role, Role.ADMIN)) {
        throw new AppError(400, 'NOT_EDITABLE', 'Registered requests cannot be edited');
      }
      if (input.brandName) req.brandName = input.brandName;
      if (input.machineName) req.machineName = input.machineName;
      if (input.description) req.description = input.description;
      if (input.gymChoiceMode) req.gymChoiceMode = input.gymChoiceMode;
      if (input.gymName !== undefined) req.gymName = input.gymName;
      req.updatedAt = new Date().toISOString();
      return this.getMachineRequest(requestId, userId);
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
    return this.getMachineRequest(requestId, userId);
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
      for (const [id, img] of [...mockMachineRequestImages.entries()]) {
        if (img.requestId === requestId) mockMachineRequestImages.delete(id);
      }
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
    await pool.query(`DELETE FROM machine_requests WHERE id = $1`, [requestId]);
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
    }>(
      `SELECT mime_type, image_data, thumbnail_data
       FROM machine_request_images
       WHERE id = $1`,
      [imageId]
    );
    const row = result.rows[0];
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Image not found');
    return {
      mimeType: row.mime_type,
      data: variant === 'thumb' ? row.thumbnail_data : row.image_data,
    };
  },
};
