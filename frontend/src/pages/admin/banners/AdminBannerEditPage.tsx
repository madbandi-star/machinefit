import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BannerStatus, BannerType, CreateBannerInput } from '@machinefit/shared';
import { bannerApi } from '@/api/banner.api';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/banners.css';

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminBannerEditPage() {
  const { bannerId } = useParams<{ bannerId: string }>();
  const isNew = !bannerId || bannerId === 'new';
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [advertiserName, setAdvertiserName] = useState('');
  const [description, setDescription] = useState('');
  const [bannerType, setBannerType] = useState<BannerType>('image');
  const [targetUrl, setTargetUrl] = useState('');
  const [openNewWindow, setOpenNewWindow] = useState(true);
  const [status, setStatus] = useState<BannerStatus>('inactive');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [priority, setPriority] = useState(100);
  const [slotPriorities, setSlotPriorities] = useState<Record<string, number>>({});
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'pc' | 'mobile'>('pc');

  const slotsQuery = useQuery({
    queryKey: ['admin', 'banner-slots'],
    queryFn: async () => (await bannerApi.listSlots()).data.data,
  });

  const bannerQuery = useQuery({
    queryKey: ['admin', 'banners', bannerId],
    queryFn: async () => (await bannerApi.getAdmin(bannerId!)).data.data,
    enabled: !isNew && Boolean(bannerId),
  });

  useEffect(() => {
    const banner = bannerQuery.data;
    if (!banner) return;
    setName(banner.name);
    setAdvertiserName(banner.advertiserName);
    setDescription(banner.description);
    setBannerType(banner.bannerType);
    setTargetUrl(banner.targetUrl);
    setOpenNewWindow(banner.openNewWindow);
    setStatus(banner.status);
    setStartAt(toLocalInput(banner.startAt));
    setEndAt(toLocalInput(banner.endAt));
    setPriority(banner.priority);
    setDesktopPreview(banner.imageUrl ?? null);
    setMobilePreview(banner.mobileImageUrl ?? null);
    setSelectedSlots(new Set(banner.slots.map((s) => s.slotKey)));
    setSlotPriorities(
      Object.fromEntries(banner.slots.map((s) => [s.slotKey, s.priority]))
    );
  }, [bannerQuery.data]);

  const buildBody = (): CreateBannerInput => ({
    name: name.trim(),
    advertiserName: advertiserName.trim(),
    description: description.trim(),
    bannerType,
    targetUrl: targetUrl.trim(),
    openNewWindow,
    status,
    startAt: startAt || null,
    endAt: endAt || null,
    priority,
    slotAssignments: [...selectedSlots].map((slotKey) => ({
      slotKey,
      priority: slotPriorities[slotKey] ?? priority,
    })),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = buildBody();
      if (isNew) return (await bannerApi.create(body)).data.data;
      return (await bannerApi.update(bannerId!, body)).data.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      showToast(t('admin:banners.saved'), 'success');
      if (isNew) {
        navigate(ROUTES.ADMIN_BANNER_EDIT.replace(':bannerId', data.id), { replace: true });
      }
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, kind }: { file: File; kind: 'desktop' | 'mobile' }) => {
      if (isNew) throw new Error('Save banner first');
      return (await bannerApi.uploadImage(bannerId!, file, kind)).data.data;
    },
    onSuccess: async (data, vars) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      if (vars.kind === 'mobile') setMobilePreview(data.mobileImageUrl ?? null);
      else {
        setDesktopPreview(data.imageUrl ?? null);
        setBannerType(data.bannerType);
      }
      showToast(t('admin:banners.imageUploaded'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const slots = slotsQuery.data ?? [];
  const previewSrc =
    previewMode === 'mobile' ? mobilePreview || desktopPreview : desktopPreview;

  const selectedSlotNames = useMemo(
    () =>
      slots
        .filter((s) => selectedSlots.has(s.slotKey))
        .map((s) => s.slotName)
        .join(', '),
    [slots, selectedSlots]
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(t('admin:banners.nameRequired'), 'error');
      return;
    }
    saveMutation.mutate();
  };

  if (!isNew && bannerQuery.isLoading) {
    return (
      <div className="admin-page">
        <Skeleton count={4} height={88} />
      </div>
    );
  }

  if (!isNew && bannerQuery.isError) {
    return (
      <div className="admin-page">
        <QueryErrorMessage />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__heading">
          <h1 className="admin-page__title">
            {isNew ? t('admin:banners.create') : t('admin:banners.edit')}
          </h1>
          <p className="admin-page__subtitle">{t('admin:banners.editSubtitle')}</p>
        </div>
        <div className="admin-page__actions">
          <Link to={ROUTES.ADMIN_BANNERS} className="btn btn--secondary">
            {t('admin:banners.backToList')}
          </Link>
        </div>
      </header>

      <div className="admin-page__body">
        <form className="admin-panel" onSubmit={onSubmit}>
          <h2 className="admin-panel__title">{t('admin:banners.basicInfo')}</h2>
          <div className="form-field">
            <label htmlFor="banner-name">{t('admin:banners.fieldName')}</label>
            <input
              id="banner-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="banner-advertiser">{t('admin:banners.fieldAdvertiser')}</label>
            <input
              id="banner-advertiser"
              className="input"
              value={advertiserName}
              onChange={(e) => setAdvertiserName(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="banner-desc">{t('admin:banners.fieldDescription')}</label>
            <textarea
              id="banner-desc"
              className="input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="banner-type">{t('admin:banners.fieldType')}</label>
            <select
              id="banner-type"
              className="input"
              value={bannerType}
              onChange={(e) => setBannerType(e.target.value as BannerType)}
            >
              <option value="image">{t('admin:banners.typeImage')}</option>
              <option value="gif">{t('admin:banners.typeGif')}</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="banner-url">{t('admin:banners.fieldTargetUrl')}</label>
            <input
              id="banner-url"
              className="input"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="form-field">
            <label>
              <input
                type="checkbox"
                checked={openNewWindow}
                onChange={(e) => setOpenNewWindow(e.target.checked)}
              />{' '}
              {t('admin:banners.fieldOpenNewWindow')}
            </label>
          </div>
          <div className="form-field">
            <label htmlFor="banner-status">{t('admin:banners.fieldStatus')}</label>
            <select
              id="banner-status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as BannerStatus)}
            >
              <option value="active">{t('admin:banners.statusActive')}</option>
              <option value="inactive">{t('admin:banners.statusInactive')}</option>
            </select>
          </div>

          <h2 className="admin-panel__title">{t('admin:banners.exposure')}</h2>
          <div className="form-field">
            <span>{t('admin:banners.fieldSlots')}</span>
            <div className="admin-banner-form__slots">
              {slots.map((slot) => {
                const checked = selectedSlots.has(slot.slotKey);
                return (
                  <div key={slot.id} className="admin-banner-form__slot-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedSlots((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(slot.slotKey);
                            else next.delete(slot.slotKey);
                            return next;
                          });
                        }}
                      />
                      {slot.slotName}
                      <code style={{ marginLeft: 4, fontSize: '0.75rem' }}>{slot.slotKey}</code>
                    </label>
                    {checked ? (
                      <input
                        type="number"
                        className="input"
                        style={{ width: 96 }}
                        min={0}
                        max={10000}
                        value={slotPriorities[slot.slotKey] ?? priority}
                        onChange={(e) =>
                          setSlotPriorities((prev) => ({
                            ...prev,
                            [slot.slotKey]: Number(e.target.value) || 0,
                          }))
                        }
                        aria-label={t('admin:banners.fieldPriority')}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="banner-start">{t('admin:banners.fieldStartAt')}</label>
            <input
              id="banner-start"
              type="datetime-local"
              className="input"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="banner-end">{t('admin:banners.fieldEndAt')}</label>
            <input
              id="banner-end"
              type="datetime-local"
              className="input"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="banner-priority">{t('admin:banners.fieldPriority')}</label>
            <input
              id="banner-priority"
              type="number"
              className="input"
              min={0}
              max={10000}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) || 0)}
            />
          </div>

          <h2 className="admin-panel__title">{t('admin:banners.images')}</h2>
          {isNew ? (
            <p className="admin-page__subtitle">{t('admin:banners.saveBeforeUpload')}</p>
          ) : (
            <>
              <div className="form-field">
                <label htmlFor="banner-desktop">{t('admin:banners.fieldDesktopImage')}</label>
                <input
                  id="banner-desktop"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadMutation.mutate({ file, kind: 'desktop' });
                  }}
                />
              </div>
              <div className="form-field">
                <label htmlFor="banner-mobile">{t('admin:banners.fieldMobileImage')}</label>
                <input
                  id="banner-mobile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadMutation.mutate({ file, kind: 'mobile' });
                  }}
                />
              </div>
            </>
          )}

          <h2 className="admin-panel__title">{t('admin:banners.preview')}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              className={`btn btn--sm ${previewMode === 'pc' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setPreviewMode('pc')}
            >
              {t('admin:banners.previewPc')}
            </button>
            <button
              type="button"
              className={`btn btn--sm ${previewMode === 'mobile' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setPreviewMode('mobile')}
            >
              {t('admin:banners.previewMobile')}
            </button>
          </div>
          <div className="admin-banner-preview">
            <div
              className={[
                'admin-banner-preview__frame',
                previewMode === 'mobile' && 'admin-banner-preview__frame--mobile',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <p className="admin-banner-preview__label">
                {previewMode === 'pc'
                  ? t('admin:banners.previewPc')
                  : t('admin:banners.previewMobile')}
                {selectedSlotNames ? ` · ${selectedSlotNames}` : ''}
              </p>
              {previewSrc ? (
                <img src={previewSrc} alt="" className="admin-banner-preview__img" />
              ) : (
                <p className="admin-page__subtitle">{t('admin:banners.noPreview')}</p>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? t('admin:processing') : t('common:actions.save')}
            </button>
            <Link to={ROUTES.ADMIN_BANNERS} className="btn btn--secondary">
              {t('common:actions.cancel')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
