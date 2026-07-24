import type {
  ApiResponse,
  BlockPhotoUserInput,
  CreatePhotoCommentInput,
  CreatePhotoReportInput,
  PaginatedResponse,
  PhotoBoardSort,
  PhotoPost,
  PhotoPostComment,
  PhotoPostDetail,
  PhotoPostReport,
  PhotoUserBlock,
  ResolvePhotoReportInput,
  UpdatePhotoPostInput,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export interface PhotoBoardListParams {
  page?: number;
  limit?: number;
  sort?: PhotoBoardSort;
  q?: string;
  tag?: string;
  authorId?: string;
  likedByMe?: boolean;
  mine?: boolean;
}

export const photoBoardApi = {
  list: (params?: PhotoBoardListParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<PhotoPost>>>('/photo-board/posts', { params }),

  get: (postId: string) =>
    apiClient.get<ApiResponse<PhotoPostDetail>>(`/photo-board/posts/${postId}`),

  create: (input: { title: string; content: string; tags: string[]; files: File[] }) => {
    const form = new FormData();
    form.append('title', input.title);
    form.append('content', input.content);
    form.append('tags', JSON.stringify(input.tags));
    for (const file of input.files) {
      form.append('images', file);
    }
    return apiClient.post<ApiResponse<PhotoPost>>('/photo-board/posts', form, {
      headers: { 'Content-Type': undefined },
      timeout: 120_000,
    });
  },

  update: (postId: string, input: UpdatePhotoPostInput) =>
    apiClient.patch<ApiResponse<PhotoPost>>(`/photo-board/posts/${postId}`, input),

  remove: (postId: string) => apiClient.delete(`/photo-board/posts/${postId}`),

  toggleLike: (postId: string) =>
    apiClient.post<ApiResponse<{ liked: boolean; likeCount: number }>>(
      `/photo-board/posts/${postId}/like`
    ),

  createComment: (postId: string, input: CreatePhotoCommentInput) =>
    apiClient.post<ApiResponse<PhotoPostComment>>(
      `/photo-board/posts/${postId}/comments`,
      input
    ),

  deleteComment: (commentId: string) =>
    apiClient.delete(`/photo-board/comments/${commentId}`),

  report: (input: CreatePhotoReportInput) =>
    apiClient.post<ApiResponse<PhotoPostReport>>('/photo-board/reports', input),

  adminListReports: () =>
    apiClient.get<ApiResponse<PhotoPostReport[]>>('/photo-board/admin/reports'),

  adminResolveReport: (reportId: string, input: ResolvePhotoReportInput) =>
    apiClient.patch<ApiResponse<PhotoPostReport>>(
      `/photo-board/admin/reports/${reportId}`,
      input
    ),

  adminHidePost: (postId: string) =>
    apiClient.delete(`/photo-board/admin/posts/${postId}`),

  adminListBlocks: () =>
    apiClient.get<ApiResponse<PhotoUserBlock[]>>('/photo-board/admin/blocks'),

  adminBlockUser: (input: BlockPhotoUserInput) =>
    apiClient.post<ApiResponse<PhotoUserBlock>>('/photo-board/admin/blocks', input),
};
