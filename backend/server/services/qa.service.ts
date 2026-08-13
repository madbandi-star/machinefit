import type {
  CreateQaArticleInput,
  QaAdminStats,
  QaArticleDetail,
  QaCategoryMeta,
  QaFeedbackValue,
  QaListQuery,
  QaListResponse,
  UpdateQaArticleInput,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { qaRepository } from '../repositories/qa.repository.js';

export const qaService = {
  async listPublic(query: QaListQuery): Promise<QaListResponse> {
    const [{ items, total }, popular] = await Promise.all([
      qaRepository.list(query, { includeUnpublished: false }),
      qaRepository.listPopular(query.popularLimit ?? 5),
    ]);
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      popular,
    };
  },

  async listAdmin(query: QaListQuery): Promise<QaListResponse> {
    const [{ items, total }, popular] = await Promise.all([
      qaRepository.list(
        { ...query, includeUnpublished: true, sort: query.sort ?? 'priority' },
        { includeUnpublished: true }
      ),
      qaRepository.listPopular(query.popularLimit ?? 5),
    ]);
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      popular,
    };
  },

  async categories(): Promise<QaCategoryMeta[]> {
    return qaRepository.categoryCounts(true);
  },

  async getPublic(id: string, userId?: string): Promise<QaArticleDetail> {
    const article = await qaRepository.getById(id, {
      includeUnpublished: false,
      userId,
    });
    if (!article) throw new AppError(404, 'NOT_FOUND', 'Q&A not found');
    await qaRepository.incrementView(id);
    return {
      ...article,
      viewCount: article.viewCount + 1,
    };
  },

  async getAdmin(id: string): Promise<QaArticleDetail> {
    const article = await qaRepository.getById(id, { includeUnpublished: true });
    if (!article) throw new AppError(404, 'NOT_FOUND', 'Q&A not found');
    return article;
  },

  async create(input: CreateQaArticleInput, userId?: string): Promise<QaArticleDetail> {
    return qaRepository.create(input, userId);
  },

  async update(
    id: string,
    input: UpdateQaArticleInput,
    userId?: string
  ): Promise<QaArticleDetail> {
    const updated = await qaRepository.update(id, input, userId);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Q&A not found');
    return updated;
  },

  async setPublished(id: string, isPublished: boolean, userId?: string): Promise<void> {
    const ok = await qaRepository.setPublished(id, isPublished, userId);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Q&A not found');
  },

  async remove(id: string): Promise<void> {
    const ok = await qaRepository.remove(id);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Q&A not found');
  },

  async reorder(items: { id: string; displayOrder: number }[]): Promise<void> {
    await qaRepository.reorder(items);
  },

  async feedback(
    id: string,
    userId: string,
    value: QaFeedbackValue
  ): Promise<QaArticleDetail> {
    const article = await qaRepository.getById(id, { includeUnpublished: false });
    if (!article) throw new AppError(404, 'NOT_FOUND', 'Q&A not found');
    const updated = await qaRepository.upsertFeedback(id, userId, value === 'helpful');
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Q&A not found');
    return updated;
  },

  async stats(): Promise<QaAdminStats> {
    return qaRepository.adminStats();
  },
};
