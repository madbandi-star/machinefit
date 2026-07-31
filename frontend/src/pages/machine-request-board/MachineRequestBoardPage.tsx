import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BoardIndexPanel } from '@/components/community/BoardIndexPanel';
import { BoardIndexSkeleton } from '@/components/community/BoardIndexSkeleton';
import { BoardRequestRow } from '@/components/community/BoardRequestRow';
import { machineRequestApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/community.css';

const MAX_REQUEST_IMAGES = 5;

interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
}

export function MachineRequestBoardPage() {
  const { t } = useTranslation('community');
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showToast = useUIStore((s) => s.showToast);

  const [showForm, setShowForm] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [machineName, setMachineName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [commercialUseConsent, setCommercialUseConsent] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.machineRequests,
    queryFn: async () => {
      const res = await machineRequestApi.list({ limit: 30 });
      return res.data.data;
    },
  });

  useEffect(() => {
    return () => {
      for (const img of images) URL.revokeObjectURL(img.previewUrl);
    };
  }, [images]);

  const resetForm = () => {
    for (const img of images) URL.revokeObjectURL(img.previewUrl);
    setBrandName('');
    setMachineName('');
    setDescription('');
    setImages([]);
    setCommercialUseConsent(false);
    setShowForm(false);
  };

  const canSubmit = useMemo(
    () =>
      Boolean(
        brandName.trim() &&
          machineName.trim() &&
          description.trim() &&
          images.length > 0 &&
          commercialUseConsent
      ),
    [brandName, machineName, description, images.length, commercialUseConsent]
  );

  const createMutation = useMutation({
    mutationFn: () =>
      machineRequestApi.create({
        brandName: brandName.trim(),
        machineName: machineName.trim(),
        description: description.trim(),
        commercialUseConsent: true,
        files: images.map((img) => img.file),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequests });
      resetForm();
      showToast(t('createSuccess'), 'success');
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const handleNew = () => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    setShowForm(true);
  };

  const onPickFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setImages((prev) => {
      const next = [...prev];
      for (const file of Array.from(fileList)) {
        if (next.length >= MAX_REQUEST_IMAGES) break;
        if (!file.type.startsWith('image/')) continue;
        next.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      return next;
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || createMutation.isPending) {
      if (!commercialUseConsent) showToast(t('requestConsentRequired'), 'error');
      else if (!images.length) showToast(t('requestPhotoRequired'), 'error');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="community-board-page">
      <PageShell
        title={t('machineRequests')}
        subtitle={t('machineRequestsSubtitle')}
        action={
          <div className="page-shell__header-action">
            <button type="button" className="btn btn--primary" onClick={handleNew}>
              {t('newRequest')}
            </button>
          </div>
        }
      >
        {showForm && (
          <form className="card community-board-page__form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="req-brand">{t('brandName')}</label>
              <input
                id="req-brand"
                className="input"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div className="form-row">
              <label htmlFor="req-machine">{t('machineName')}</label>
              <input
                id="req-machine"
                className="input"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                required
                maxLength={200}
              />
            </div>
            <div className="form-row">
              <label htmlFor="req-desc">{t('description')}</label>
              <textarea
                id="req-desc"
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={2000}
                rows={4}
              />
            </div>

            <div className="form-row">
              <label htmlFor="req-photos">{t('requestPhoto')}</label>
              <input
                id="req-photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  onPickFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <p className="community-board-page__hint">{t('requestPhotoHint')}</p>
              {images.length > 0 && (
                <div className="community-board-page__previews" aria-label={t('requestPhoto')}>
                  {images.map((img) => (
                    <div key={img.id} className="community-board-page__preview">
                      <img src={img.previewUrl} alt="" />
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => removeImage(img.id)}
                      >
                        {t('requestPhotoRemove')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="community-board-page__consent">
              <p className="community-board-page__consent-text">{t('requestCommercialConsentText')}</p>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={commercialUseConsent}
                  onChange={(e) => setCommercialUseConsent(e.target.checked)}
                  required
                />
                <span>{t('requestCommercialConsentLabel')}</span>
              </label>
            </div>

            <div className="community-board-page__form-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!canSubmit || createMutation.isPending}
              >
                {t('submit')}
              </button>
              <button type="button" className="btn btn--secondary" onClick={resetForm}>
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <BoardIndexSkeleton rows={8} />
        ) : data?.items.length ? (
          <BoardIndexPanel countLabel={t('requestCount', { count: data.items.length })}>
            {data.items.map((req) => (
              <BoardRequestRow key={req.id} request={req} />
            ))}
          </BoardIndexPanel>
        ) : (
          <p className="community-board-page__empty">{t('noRequests')}</p>
        )}

        <Link to={ROUTES.MY_PAGE} className="btn btn--secondary btn--block community-board-page__back">
          ← {tCommon('nav.myPage')}
        </Link>
      </PageShell>
    </div>
  );
}
