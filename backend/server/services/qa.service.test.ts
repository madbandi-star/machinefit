import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../repositories/qa.repository.js', () => ({
  qaRepository: {
    list: vi.fn(),
    listPopular: vi.fn(),
    getById: vi.fn(),
    incrementView: vi.fn(),
    upsertFeedback: vi.fn(),
    categoryCounts: vi.fn(),
    adminStats: vi.fn(),
  },
}));

import { qaRepository } from '../repositories/qa.repository.js';
import { qaService } from './qa.service.js';

const sample = {
  id: '11111111-1111-1111-1111-111111111111',
  category: 'getting_started' as const,
  priority: 0 as const,
  title: '머신핏은 어떤 서비스인가요?',
  excerpt: 'excerpt',
  answer: 'answer body',
  keywords: ['머신핏'],
  viewCount: 1,
  helpfulCount: 0,
  notHelpfulCount: 0,
  displayOrder: 1,
  isPublished: true,
  needsImplReview: false,
  slug: 'qa-001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('qaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists published Q&A with popular block', async () => {
    vi.mocked(qaRepository.list).mockResolvedValue({ items: [sample], total: 1 });
    vi.mocked(qaRepository.listPopular).mockResolvedValue([{ ...sample, isPopular: true }]);

    const data = await qaService.listPublic({
      page: 1,
      pageSize: 20,
      popularLimit: 5,
    });

    expect(data.total).toBe(1);
    expect(data.popular).toHaveLength(1);
    expect(qaRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 }),
      { includeUnpublished: false }
    );
  });

  it('increments view on public detail', async () => {
    vi.mocked(qaRepository.getById).mockResolvedValue(sample);
    vi.mocked(qaRepository.incrementView).mockResolvedValue();

    const data = await qaService.getPublic(sample.id);
    expect(data.viewCount).toBe(2);
    expect(qaRepository.incrementView).toHaveBeenCalledWith(sample.id);
  });
});
