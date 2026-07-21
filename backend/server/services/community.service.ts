import type { BoardType, RoleCode } from '@machinefit/shared';
import type { CreatePostInput, CreateCommentInput, CreateMachineRequestInput } from '@machinefit/shared';
import { communityRepository } from '../repositories/community.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const communityService = {
  listPosts(boardType?: BoardType, page = 1, limit = 20) {
    return communityRepository.listPosts(boardType, page, limit);
  },

  async getPost(postId: string) {
    const post = await communityRepository.getPost(postId);
    if (!post) throw new AppError(404, 'NOT_FOUND', 'Post not found');
    const comments = await communityRepository.listComments(postId);
    return { post, comments };
  },

  async createPost(userId: string, input: CreatePostInput) {
    const user = await userRepository.findById(userId);
    return communityRepository.createPost(userId, user?.displayName ?? 'User', input);
  },

  async deletePost(postId: string, userId: string, roleCode: RoleCode) {
    await communityRepository.deletePost(postId, userId, roleCode);
  },

  async createComment(postId: string, userId: string, input: CreateCommentInput) {
    const user = await userRepository.findById(userId);
    return communityRepository.createComment(postId, userId, user?.displayName ?? 'User', input);
  },

  toggleLike(postId: string, userId: string) {
    return communityRepository.toggleLike(postId, userId);
  },

  listMachineRequests(page = 1, limit = 20) {
    return communityRepository.listMachineRequests(page, limit);
  },

  async createMachineRequest(userId: string, input: CreateMachineRequestInput) {
    const user = await userRepository.findById(userId);
    return communityRepository.createMachineRequest(userId, user?.displayName ?? 'User', input);
  },
};

/** @deprecated Use services/owner.service.ts */
export { ownerService } from "./owner.service.js";
