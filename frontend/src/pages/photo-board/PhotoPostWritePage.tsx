import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react';
import { Role, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { photoBoardApi } from '@/api/photo-board.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { resolvePhotoBoardMediaUrl } from '@/utils/photoBoardMediaUrl';
import '@/styles/components.css';
import '@/styles/photo-board.css';

interface LocalImage {
  id: string;
  file?: File;
  previewUrl: string;
  existingId?: string;
}

const MAX_TAGS = 10;

function normalizeTag(raw: string): string | null {
  const cleaned = raw
    .replace(/^#+/, '')
    .trim()
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .slice(0, 40);
  return cleaned || null;
}

export function PhotoPostWritePage() {
  const { t } = useTranslation('community');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [params] = useSearchParams();
  const editId = params.get('edit') || '';
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const detailQuery = useQuery({
    queryKey: QUERY_KEYS.photoBoardPost(editId),
    queryFn: async () => (await photoBoardApi.get(editId)).data.data,
    enabled: Boolean(editId) && isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, navigate, showToast, t]);

  useEffect(() => {
    const post = detailQuery.data?.post;
    if (!post) return;
    if (user && post.userId !== user.id && !hasMinRole(user.roleCode, Role.ADMIN)) {
      showToast(t('errorGeneric'), 'error');
      navigate(ROUTES.PHOTO_BOARD);
      return;
    }
    setTitle(post.title);
    setContent(post.content);
    setTags(post.tags ?? []);
    setTagDraft('');
    setImages(
      (post.images ?? []).map((img) => ({
        id: img.id,
        existingId: img.id,
        previewUrl: resolvePhotoBoardMediaUrl(img.thumbUrl),
      }))
    );
  }, [detailQuery.data, navigate, showToast, t, user]);

  useEffect(() => {
    return () => {
      for (const img of images) {
        if (img.file) URL.revokeObjectURL(img.previewUrl);
      }
    };
  }, [images]);

  const resolveTags = () => {
    const extra = normalizeTag(tagDraft);
    if (
      !extra ||
      tags.length >= MAX_TAGS ||
      tags.some((tag) => tag.toLowerCase() === extra.toLowerCase())
    ) {
      return tags;
    }
    return [...tags, extra];
  };

  const createMutation = useMutation({
    mutationFn: () =>
      photoBoardApi.create({
        title: title.trim(),
        content: content.trim(),
        tags: resolveTags(),
        files: images.map((img) => img.file).filter(Boolean) as File[],
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['photo-board'] });
      showToast(t('createSuccess'), 'success');
      navigate(ROUTES.PHOTO_BOARD_DETAIL.replace(':postId', res.data.data.id));
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const post = await photoBoardApi.update(editId, {
        title: title.trim(),
        content: content.trim(),
        tags: resolveTags(),
        imageOrder: images.map((img) => img.existingId).filter(Boolean) as string[],
      });
      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-board'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.photoBoardPost(editId) });
      showToast(t('createSuccess'), 'success');
      navigate(ROUTES.PHOTO_BOARD_DETAIL.replace(':postId', editId));
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const busy = createMutation.isPending || updateMutation.isPending;
  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (editId) return images.length > 0;
    return images.some((img) => img.file);
  }, [editId, images, title]);

  const onPickFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next = [...images];
    for (const file of Array.from(fileList)) {
      if (next.length >= 10) break;
      if (!file.type.startsWith('image/')) continue;
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setImages(next);
  };

  const moveImage = (from: number, dir: -1 | 1) => {
    const to = from + dir;
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setImages(next);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.file) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const photoReady = images.length > 0;
  const titleReady = Boolean(title.trim());
  const contentReady = Boolean(content.trim());
  const tagsReady = tags.length > 0 || Boolean(normalizeTag(tagDraft));

  const addTag = (raw: string) => {
    const next = normalizeTag(raw);
    if (!next) return;
    setTags((prev) => {
      if (prev.length >= MAX_TAGS || prev.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
        return prev;
      }
      return [...prev, next];
    });
    setTagDraft('');
  };

  const commitTagDraft = () => {
    if (tagDraft.trim()) addTag(tagDraft);
  };
  const checklist = [
    { id: 'photo', label: t('photoStepPhotos'), done: photoReady },
    { id: 'title', label: t('photoStepTitle'), done: titleReady },
    { id: 'content', label: t('photoStepContent'), done: contentReady },
    { id: 'tags', label: t('photoStepTags'), done: tagsReady },
  ];
  const checklistDone = checklist.filter((item) => item.done).length;

  if (editId && detailQuery.isLoading) {
    return (
      <PageShell title={t('photoEdit')}>
        <Skeleton count={3} height={88} />
      </PageShell>
    );
  }

  return (
    <div className="photo-write-page">
      <PageShell title={editId ? t('photoEdit') : t('photoWrite')} subtitle={t('photoWriteHint')}>
        <div className="photo-write-checklist" aria-label={t('photoChecklistLabel')}>
          <div className="photo-write-checklist__head">
            <p className="photo-write-checklist__title">{t('photoChecklistLabel')}</p>
            <span className="photo-write-checklist__progress">
              {checklistDone}/{checklist.length}
            </span>
          </div>
          <ul className="photo-write-checklist__list">
            {checklist.map((item) => (
              <li
                key={item.id}
                className={[
                  'photo-write-checklist__item',
                  item.done ? 'is-done' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="photo-write-checklist__mark" aria-hidden>
                  {item.done ? '✓' : '·'}
                </span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <form
          className="photo-write"
          onSubmit={(e) => {
            e.preventDefault();
            commitTagDraft();
            if (!canSubmit || busy) return;
            if (editId) updateMutation.mutate();
            else createMutation.mutate();
          }}
        >
          <section
            className={[
              'photo-write__section',
              photoReady ? 'is-ready' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-labelledby="photo-step-photos"
          >
            <header className="photo-write__section-head">
              <span className="photo-write__step">1</span>
              <div>
                <h3 id="photo-step-photos" className="photo-write__section-title">
                  {t('photoStepPhotos')}
                </h3>
                <p className="photo-write__section-hint">
                  {editId ? t('photoStepPhotosEditHint') : t('photoStepPhotosHint')}
                </p>
              </div>
              <span className="photo-write__section-status">
                {t('photoImageCount', { count: images.length, max: 10 })}
              </span>
            </header>

            {!editId ? (
              <div className="photo-write__media">
                <input
                  ref={fileInputRef}
                  id={fileInputId}
                  className="photo-write__file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    onPickFiles(e.target.files);
                    e.currentTarget.value = '';
                  }}
                />
                <button
                  type="button"
                  className={`photo-write__dropzone${dragOver ? ' is-dragover' : ''}${
                    images.length ? ' has-images' : ''
                  }`}
                  disabled={images.length >= 10 || busy}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (images.length >= 10) return;
                    setDragOver(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (images.length >= 10) return;
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (images.length >= 10) return;
                    onPickFiles(e.dataTransfer.files);
                  }}
                >
                  <span className="photo-write__dropzone-icon" aria-hidden>
                    <ImagePlus size={28} strokeWidth={1.75} />
                  </span>
                  <span className="photo-write__dropzone-title">{t('photoSelectImages')}</span>
                  <span className="photo-write__dropzone-hint">{t('photoDropHint')}</span>
                </button>
              </div>
            ) : null}

            {images.length ? (
              <ul className="photo-write__previews" aria-label={t('photoSelectImages')}>
                {images.map((img, index) => (
                  <li key={img.id} className="photo-write__preview">
                    <img src={img.previewUrl} alt="" />
                    <span className="photo-write__preview-index" aria-hidden>
                      {index + 1}
                    </span>
                    <div className="photo-write__preview-actions">
                      <button
                        type="button"
                        className="photo-write__preview-btn"
                        onClick={() => moveImage(index, -1)}
                        disabled={index === 0}
                        aria-label={t('photoPrev')}
                      >
                        <ChevronLeft size={16} strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        className="photo-write__preview-btn"
                        onClick={() => moveImage(index, 1)}
                        disabled={index === images.length - 1}
                        aria-label={t('photoNext')}
                      >
                        <ChevronRight size={16} strokeWidth={2.4} />
                      </button>
                      {!editId ? (
                        <button
                          type="button"
                          className="photo-write__preview-btn photo-write__preview-btn--danger"
                          onClick={() => removeImage(img.id)}
                          aria-label={t('cancel')}
                        >
                          <X size={15} strokeWidth={2.5} />
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="photo-write__empty-photos">{t('photoNoImagesYet')}</p>
            )}
          </section>

          <section
            className={[
              'photo-write__section',
              titleReady ? 'is-ready' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-labelledby="photo-step-title"
          >
            <header className="photo-write__section-head">
              <span className="photo-write__step">2</span>
              <div>
                <h3 id="photo-step-title" className="photo-write__section-title">
                  {t('photoStepTitle')}
                </h3>
                <p className="photo-write__section-hint">{t('photoStepTitleHint')}</p>
              </div>
              <span className="photo-write__section-status">
                {title.length}/200
              </span>
            </header>
            <input
              id="photo-title"
              className="input photo-write__title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              maxLength={200}
              required
              placeholder={t('postTitlePlaceholder')}
            />
          </section>

          <section
            className={[
              'photo-write__section',
              contentReady ? 'is-ready' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-labelledby="photo-step-content"
          >
            <header className="photo-write__section-head">
              <span className="photo-write__step">3</span>
              <div>
                <h3 id="photo-step-content" className="photo-write__section-title">
                  {t('photoStepContent')}
                </h3>
                <p className="photo-write__section-hint">{t('photoStepContentHint')}</p>
              </div>
              <span className="photo-write__section-status">
                {content.length}/5000
              </span>
            </header>
            <textarea
              id="photo-content"
              className="input photo-write__textarea"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 5000))}
              rows={5}
              maxLength={5000}
              placeholder={t('postContentPlaceholder')}
            />
          </section>

          <section
            className={[
              'photo-write__section',
              tagsReady ? 'is-ready' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-labelledby="photo-step-tags"
          >
            <header className="photo-write__section-head">
              <span className="photo-write__step">4</span>
              <div>
                <h3 id="photo-step-tags" className="photo-write__section-title">
                  {t('photoStepTags')}
                </h3>
                <p className="photo-write__section-hint">{t('photoStepTagsHint')}</p>
              </div>
              <span className="photo-write__section-status">
                {t('showcase.tagsCount', { count: tags.length, max: MAX_TAGS })}
              </span>
            </header>
            <div className={`photo-write__tagbox${tags.length >= MAX_TAGS ? ' is-full' : ''}`}>
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="photo-write__tag"
                  aria-label={t('showcase.tagRemoveAria', { tag })}
                  onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                >
                  #{tag}
                  <X size={14} strokeWidth={2.4} aria-hidden />
                </button>
              ))}
              {tags.length < MAX_TAGS ? (
                <input
                  id="photo-tags"
                  className="photo-write__tag-input"
                  value={tagDraft}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.includes(',') || value.includes('#')) {
                      const parts = value.split(/[,#]+/);
                      const tail = parts.pop() ?? '';
                      setTags((prev) => {
                        const next = [...prev];
                        for (const part of parts) {
                          const tag = normalizeTag(part);
                          if (
                            !tag ||
                            next.length >= MAX_TAGS ||
                            next.some((item) => item.toLowerCase() === tag.toLowerCase())
                          ) {
                            continue;
                          }
                          next.push(tag);
                        }
                        return next;
                      });
                      setTagDraft(tail);
                      return;
                    }
                    setTagDraft(value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      commitTagDraft();
                    } else if (e.key === 'Backspace' && !tagDraft && tags.length) {
                      setTags((prev) => prev.slice(0, -1));
                    }
                  }}
                  onBlur={commitTagDraft}
                  placeholder={
                    tags.length ? t('showcase.tagsMorePlaceholder') : t('photoTagsPlaceholder')
                  }
                  aria-label={t('showcase.tagsAddAria')}
                  autoComplete="off"
                  enterKeyHint="done"
                />
              ) : null}
            </div>
          </section>

          <div className="photo-write__actions">
            <button
              type="submit"
              className="btn btn--primary photo-write__submit"
              disabled={!canSubmit || busy}
            >
              {busy ? '…' : editId ? t('photoSave') : t('submit')}
            </button>
            <Link to={ROUTES.PHOTO_BOARD} className="btn btn--secondary">
              {t('cancel')}
            </Link>
          </div>
        </form>
      </PageShell>
    </div>
  );
}
