import type {
  PublishTemplateShareInput,
  RoleCode,
  TemplateShareAdminListQuery,
  TemplateShareAdminStats,
  TemplateShareComment,
  TemplateShareCommentBody,
  TemplateShareDetail,
  TemplateShareDownloadResult,
  TemplateShareListQuery,
  TemplateShareListResponse,
  TemplateShareReport,
  TemplateShareReportBody,
  TemplateShareReportStatus,
  TemplateShareStatus,
  UpdateTemplateShareInput,
} from '@machinefit/shared';
import { Role, hasMinRole } from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { templateShareRepository } from '../repositories/template-share.repository.js';
import { workoutCardRepository } from '../repositories/workout-card.repository.js';
import { assertSafeUgc } from '../utils/content-safety.util.js';
import { trackUsageSafe } from './usage.service.js';

function assertShareableTemplate(template: {
  userId: string;
  isOriginal: boolean;
  originalTemplateId: string | null;
  sourceTemplateId: string | null;
  sourceSharePostId: string | null;
}, userId: string): void {
  if (
    template.userId !== userId ||
    !template.isOriginal ||
    template.originalTemplateId != null ||
    template.sourceTemplateId != null ||
    template.sourceSharePostId != null
  ) {
    throw new AppError(
      403,
      'SHARE_NOT_ALLOWED',
      'Only original user-authored templates can be shared'
    );
  }
}

export const templateShareService = {
  list(query: TemplateShareListQuery, viewerId?: string): Promise<TemplateShareListResponse> {
    return templateShareRepository.list(query, viewerId);
  },

  async getById(
    id: string,
    viewerId?: string,
    options?: { trackView?: boolean; viewerKey?: string }
  ): Promise<TemplateShareDetail> {
    const detail = await templateShareRepository.getById(id, viewerId);
    if (!detail) {
      throw new AppError(404, 'NOT_FOUND', 'Share post not found');
    }
    if (options?.trackView && options.viewerKey) {
      const counted = await templateShareRepository.recordView(id, options.viewerKey);
      if (counted) {
        detail.viewCount += 1;
      }
    }
    return detail;
  },

  async publish(
    userId: string,
    input: PublishTemplateShareInput
  ): Promise<TemplateShareDetail> {
    assertSafeUgc(input.title, input.description, ...(input.tags ?? []));

    const template = await workoutCardRepository.getTemplateForShareCheck(
      userId,
      input.templateId
    );
    if (!template) {
      throw new AppError(404, 'NOT_FOUND', 'Template not found');
    }
    assertShareableTemplate(template, userId);

    if (!template.payload.length) {
      throw new AppError(400, 'EMPTY_TEMPLATE', 'Template has no items to share');
    }

    return templateShareRepository.publish(userId, input, {
      payload: template.payload,
      sourceTemplateId: template.id,
    }).then((result) => {
      trackUsageSafe(userId, 'template_create');
      return result;
    });
  },

  async update(
    id: string,
    userId: string,
    input: UpdateTemplateShareInput
  ): Promise<TemplateShareDetail> {
    assertSafeUgc(input.title, input.description, ...(input.tags ?? []));
    const updated = await templateShareRepository.update(id, userId, input);
    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Share post not found');
    }
    return updated;
  },

  async download(postId: string, userId: string): Promise<TemplateShareDownloadResult> {
    const result = await templateShareRepository.download(postId, userId);
    trackUsageSafe(userId, 'template_download');
    trackUsageSafe(userId, 'template_save');
    return result;
  },

  toggleLike(postId: string, userId: string) {
    return templateShareRepository.toggleLike(postId, userId);
  },

  toggleFavorite(postId: string, userId: string) {
    return templateShareRepository.toggleFavorite(postId, userId);
  },

  listComments(postId: string, viewerId?: string) {
    return templateShareRepository.listComments(postId, viewerId);
  },

  async createComment(
    postId: string,
    userId: string,
    input: TemplateShareCommentBody
  ): Promise<TemplateShareComment> {
    assertSafeUgc(input.content);
    return templateShareRepository.createComment(postId, userId, input.content);
  },

  async updateComment(
    postId: string,
    commentId: string,
    userId: string,
    input: TemplateShareCommentBody
  ): Promise<TemplateShareComment> {
    assertSafeUgc(input.content);
    const updated = await templateShareRepository.updateComment(
      postId,
      commentId,
      userId,
      input.content
    );
    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    }
    return updated;
  },

  async deleteComment(
    postId: string,
    commentId: string,
    userId: string,
    roleCode: RoleCode
  ): Promise<void> {
    const isAdmin = hasMinRole(roleCode, Role.ADMIN);
    const deleted = await templateShareRepository.softDeleteComment(
      postId,
      commentId,
      userId,
      isAdmin
    );
    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', 'Comment not found');
    }
  },

  async report(
    postId: string,
    userId: string,
    input: TemplateShareReportBody
  ): Promise<TemplateShareReport> {
    assertSafeUgc(input.description);
    const post = await templateShareRepository.getRawPost(postId);
    if (!post) {
      throw new AppError(404, 'NOT_FOUND', 'Share post not found');
    }
    return templateShareRepository.createReport({
      postId,
      commentId: input.commentId,
      reporterUserId: userId,
      reason: input.reason,
      description: input.description ?? '',
    });
  },

  /**
   * Called from workout-card flows when a downloaded share template is used.
   * Delegates to repository to avoid circular service imports.
   */
  async recordTemplateUsage(input: {
    postId: string;
    userId: string;
    userTemplateId: string;
    workoutLogId?: string | null;
    usedOnDate: string;
  }): Promise<boolean> {
    return templateShareRepository.recordUsage(input);
  },

  adminStats(): Promise<TemplateShareAdminStats> {
    return templateShareRepository.adminStats();
  },

  adminList(query: TemplateShareAdminListQuery) {
    return templateShareRepository.adminList(query);
  },

  async adminUpdateStatus(
    id: string,
    status: TemplateShareStatus
  ): Promise<TemplateShareDetail> {
    const updated = await templateShareRepository.adminUpdateStatus(id, status);
    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Share post not found');
    }
    return updated;
  },

  listReports(status?: TemplateShareReportStatus) {
    return templateShareRepository.listReports(status);
  },

  async resolveReport(
    reportId: string,
    status: TemplateShareReportStatus,
    adminUserId: string
  ): Promise<TemplateShareReport> {
    const updated = await templateShareRepository.resolveReport(
      reportId,
      status,
      adminUserId
    );
    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Report not found');
    }
    return updated;
  },
};
