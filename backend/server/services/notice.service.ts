import type {
  CreateNoticeInput,
  NoticeDetail,
  NoticeLanguage,
  NoticeListItem,
  NoticeListQuery,
  NoticePublishBody,
  NoticeStatus,
  UpdateNoticeInput,
} from '@machinefit/shared';
import {
  NOTICE_ALLOWED_MIME_TYPES,
  NOTICE_MAX_ATTACHMENTS,
  NOTICE_MAX_ATTACHMENT_BYTES,
  Role,
  hasMinRole,
} from '@machinefit/shared';
import { noticeRepository } from '../repositories/notice.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { TtlCache } from '../utils/ttl-cache.js';
import { sanitizeNoticeHtml } from '../utils/html-sanitize.js';
import { noticeEvents } from './notice-events.js';
import { storageService } from './storage.service.js';

const listCache = new TtlCache<{ items: NoticeListItem[]; total: number } | NoticeListItem | null>(
  30_000
);
const detailCache = new TtlCache<NoticeDetail | null>(60_000);

function invalidateNoticeCaches(): void {
  listCache.deleteByPrefix('notice-list');
  detailCache.deleteByPrefix('notice-detail');
  listCache.deleteByPrefix('notice-banner');
  listCache.deleteByPrefix('notice-popup');
  listCache.deleteByPrefix('notice-stats');
}

function sanitizeTranslations(translations: CreateNoticeInput['translations']) {
  return translations.map((tr) => ({
    language: tr.language,
    title: tr.title.trim(),
    content: sanitizeNoticeHtml(tr.content),
  }));
}

function assertAdmin(roleCode: string): void {
  if (!hasMinRole(roleCode as never, Role.ADMIN)) {
    throw new AppError(403, 'FORBIDDEN', 'Admin role required');
  }
}

export const noticeService = {
  invalidateCaches: invalidateNoticeCaches,

  async listPublic(query: NoticeListQuery, language: NoticeLanguage) {
    const key = `notice-list:public:${language}:${JSON.stringify(query)}`;
    return listCache.getOrSet(key, async () =>
      noticeRepository.list(query, { language, admin: false })
    ) as Promise<{ items: NoticeListItem[]; total: number }>;
  },

  async listAdmin(query: NoticeListQuery, language: NoticeLanguage, roleCode: string) {
    assertAdmin(roleCode);
    return noticeRepository.list(
      { ...query, includeDrafts: query.includeDrafts ?? true },
      { language, admin: true }
    );
  },

  async getPublic(id: string, language: NoticeLanguage, viewerKey: string) {
    const key = `notice-detail:public:${language}:${id}`;
    const detail = await detailCache.getOrSet(key, () =>
      noticeRepository.getById(id, { language, admin: false })
    );
    if (!detail) throw new AppError(404, 'NOT_FOUND', 'Notice not found');
    const counted = await noticeRepository.recordView(id, viewerKey);
    if (counted) {
      detailCache.delete(key);
      listCache.deleteByPrefix('notice-list');
      return { ...detail, viewCount: detail.viewCount + 1 };
    }
    return detail;
  },

  async getAdmin(id: string, language: NoticeLanguage, roleCode: string) {
    assertAdmin(roleCode);
    const detail = await noticeRepository.getById(id, {
      language,
      admin: true,
      includeAllTranslations: true,
    });
    if (!detail) throw new AppError(404, 'NOT_FOUND', 'Notice not found');
    return detail;
  },

  async create(userId: string, roleCode: string, input: CreateNoticeInput) {
    assertAdmin(roleCode);
    const translations = sanitizeTranslations(input.translations);
    const id = await noticeRepository.create(userId, input, translations);
    invalidateNoticeCaches();
    if (input.status === 'PUBLISHED') {
      this.emitPublished(id);
    }
    return this.getAdmin(id, translations[0]?.language ?? 'ko', roleCode);
  },

  async update(id: string, roleCode: string, input: UpdateNoticeInput) {
    assertAdmin(roleCode);
    const translations = input.translations
      ? sanitizeTranslations(input.translations)
      : undefined;
    const ok = await noticeRepository.update(id, input, translations);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Notice not found');
    invalidateNoticeCaches();
    if (input.status === 'PUBLISHED') {
      this.emitPublished(id);
    }
    return this.getAdmin(id, 'ko', roleCode);
  },

  async remove(id: string, roleCode: string) {
    assertAdmin(roleCode);
    const ok = await noticeRepository.softDelete(id);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Notice not found');
    invalidateNoticeCaches();
  },

  async publish(id: string, roleCode: string, body: NoticePublishBody) {
    assertAdmin(roleCode);
    const status = (body.status ?? 'PUBLISHED') as NoticeStatus;
    const ok = await noticeRepository.setStatus(id, status, body.publishAt);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Notice not found');
    invalidateNoticeCaches();
    if (status === 'PUBLISHED') this.emitPublished(id);
    return this.getAdmin(id, 'ko', roleCode);
  },

  async setPinned(id: string, roleCode: string, value: boolean) {
    assertAdmin(roleCode);
    const ok = await noticeRepository.setFlag(id, 'is_pinned', value);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Notice not found');
    invalidateNoticeCaches();
    return this.getAdmin(id, 'ko', roleCode);
  },

  async setImportant(id: string, roleCode: string, value: boolean) {
    assertAdmin(roleCode);
    const ok = await noticeRepository.setFlag(id, 'is_important', value);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Notice not found');
    invalidateNoticeCaches();
    return this.getAdmin(id, 'ko', roleCode);
  },

  async setBanner(id: string, roleCode: string, value: boolean) {
    assertAdmin(roleCode);
    const ok = await noticeRepository.setFlag(id, 'is_banner', value);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Notice not found');
    invalidateNoticeCaches();
    return this.getAdmin(id, 'ko', roleCode);
  },

  async setPopup(id: string, roleCode: string, value: boolean) {
    assertAdmin(roleCode);
    const ok = await noticeRepository.setFlag(id, 'is_popup', value);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Notice not found');
    invalidateNoticeCaches();
    return this.getAdmin(id, 'ko', roleCode);
  },

  async uploadAttachment(
    noticeId: string,
    roleCode: string,
    file: Express.Multer.File,
    isInlineImage: boolean
  ) {
    assertAdmin(roleCode);
    const existing = await noticeRepository.getById(noticeId, {
      language: 'ko',
      admin: true,
    });
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Notice not found');

    if (file.size > NOTICE_MAX_ATTACHMENT_BYTES) {
      throw new AppError(400, 'FILE_TOO_LARGE', 'File exceeds 20MB limit');
    }
    if (!NOTICE_ALLOWED_MIME_TYPES.includes(file.mimetype as never)) {
      throw new AppError(400, 'INVALID_FILE_TYPE', 'Allowed: images, PDF, ZIP');
    }
    if (isInlineImage && !file.mimetype.startsWith('image/')) {
      throw new AppError(400, 'INVALID_FILE_TYPE', 'Inline body images must be image/*');
    }

    const count = await noticeRepository.countAttachments(noticeId);
    if (count >= NOTICE_MAX_ATTACHMENTS) {
      throw new AppError(400, 'TOO_MANY_FILES', `Max ${NOTICE_MAX_ATTACHMENTS} attachments`);
    }

    const stored = await storageService.uploadNoticeAttachment({
      noticeId,
      fileName: file.originalname || 'file',
      mimeType: file.mimetype,
      buffer: file.buffer,
    });

    const attachment = await noticeRepository.addAttachment(noticeId, {
      fileName: file.originalname || 'file',
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      storagePath: stored.storagePath,
      publicUrl: stored.publicUrl,
      sortOrder: count,
      isInlineImage,
    });
    invalidateNoticeCaches();
    return attachment;
  },

  async deleteAttachment(noticeId: string, attachmentId: string, roleCode: string) {
    assertAdmin(roleCode);
    const storagePath = await noticeRepository.deleteAttachment(noticeId, attachmentId);
    if (!storagePath) throw new AppError(404, 'NOT_FOUND', 'Attachment not found');
    await storageService.deleteNoticeAttachment(storagePath);
    invalidateNoticeCaches();
  },

  async getBanner(language: NoticeLanguage) {
    return listCache.getOrSet(`notice-banner:${language}`, () =>
      noticeRepository.getHomeBanner(language)
    ) as Promise<NoticeListItem | null>;
  },

  async getPopup(language: NoticeLanguage) {
    return listCache.getOrSet(`notice-popup:${language}`, () =>
      noticeRepository.getActivePopup(language)
    ) as Promise<NoticeListItem | null>;
  },

  async adminStats(language: NoticeLanguage, roleCode: string) {
    assertAdmin(roleCode);
    return noticeRepository.adminStats(language);
  },

  async publishDueReserved(): Promise<number> {
    const ids = await noticeRepository.listDueReserved(100);
    let count = 0;
    for (const id of ids) {
      const ok = await noticeRepository.setStatus(id, 'PUBLISHED');
      if (ok) {
        count += 1;
        this.emitPublished(id);
      }
    }
    if (count) invalidateNoticeCaches();
    return count;
  },

  emitPublished(noticeId: string): void {
    void noticeRepository
      .getById(noticeId, { language: 'ko', admin: true, includeAllTranslations: true })
      .then((detail) => {
        if (!detail || detail.status !== 'PUBLISHED') return;
        const titles: Partial<Record<'ko' | 'en' | 'ja' | 'zh', string>> = {};
        for (const tr of detail.translations ?? []) {
          titles[tr.language] = tr.title;
        }
        if (!titles.ko) titles.ko = detail.title;
        noticeEvents.emitPublished({
          noticeId: detail.id,
          category: detail.category,
          isImportant: detail.isImportant,
          isBanner: detail.isBanner,
          isPopup: detail.isPopup,
          publishAt: detail.publishAt ?? null,
          titles,
        });
      })
      .catch(() => undefined);
  },
};
