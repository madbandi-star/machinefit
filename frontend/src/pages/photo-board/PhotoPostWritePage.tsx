import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { photoBoardApi } from '@/api/photo-board.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/photo-board.css';

interface LocalImage {
  id: string;
  file?: File;
  previewUrl: string;
  existingId?: string;
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[,\s#]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
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

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);

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
    if (user && post.userId !== user.id && user.roleCode !== 'admin') {
      showToast(t('errorGeneric'), 'error');
      navigate(ROUTES.PHOTO_BOARD);
      return;
    }
    setTitle(post.title);
    setContent(post.content);
    setTagsRaw(post.tags.join(' '));
    setImages(
      (post.images ?? []).map((img) => ({
        id: img.id,
        existingId: img.id,
        previewUrl: img.thumbUrl,
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

  const createMutation = useMutation({
    mutationFn: () =>
      photoBoardApi.create({
        title: title.trim(),
        content: content.trim(),
        tags: parseTags(tagsRaw),
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
        tags: parseTags(tagsRaw),
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

  if (editId && detailQuery.isLoading) {
    return (
      <PageShell title={t('photoEdit')}>
        <Skeleton count={3} height={88} />
      </PageShell>
    );
  }

  return (
    <PageShell title={editId ? t('photoEdit') : t('photoWrite')} subtitle={t('photoWriteHint')}>
      <form
        className="card"
        style={{ padding: '1rem', display: 'grid', gap: '0.85rem' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit || busy) return;
          if (editId) updateMutation.mutate();
          else createMutation.mutate();
        }}
      >
        {!editId ? (
          <div className="form-row">
            <label htmlFor="photo-files">{t('photoSelectImages')}</label>
            <input
              id="photo-files"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => onPickFiles(e.target.files)}
            />
          </div>
        ) : null}

        {images.length ? (
          <div className="photo-write__previews">
            {images.map((img, index) => (
              <div key={img.id} className="photo-write__preview">
                <img src={img.previewUrl} alt="" />
                <div className="photo-write__preview-actions">
                  <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                  >
                    →
                  </button>
                  {!editId ? (
                    <button type="button" onClick={() => removeImage(img.id)}>
                      ✕
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="form-row">
          <label htmlFor="photo-title">{t('postTitle')}</label>
          <input
            id="photo-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="photo-content">{t('postContent')}</label>
          <textarea
            id="photo-content"
            className="input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            maxLength={5000}
          />
        </div>
        <div className="form-row">
          <label htmlFor="photo-tags">{t('photoTags')}</label>
          <input
            id="photo-tags"
            className="input"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder={t('photoTagsPlaceholder')}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn btn--primary" disabled={!canSubmit || busy}>
            {busy ? '…' : editId ? t('photoSave') : t('submit')}
          </button>
          <Link to={ROUTES.PHOTO_BOARD} className="btn btn--secondary">
            {t('cancel')}
          </Link>
        </div>
      </form>
    </PageShell>
  );
}
