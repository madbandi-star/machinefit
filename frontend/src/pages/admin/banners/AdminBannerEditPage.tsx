import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BannerStatus, BannerType, CreateBannerInput } from '@machinefit/shared';
import { BANNER_MAX_IMAGE_BYTES, BANNER_RECOMMENDED_SIZES } from '@machinefit/shared';
import { bannerApi } from '@/api/banner.api';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getBannerPublishBlockers } from '@/utils/bannerPublish';
import { BannerScheduleFields } from './BannerScheduleFields';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';
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
  const [status, setStatus] = useState<BannerStatus>('active');
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
    setSlotPriorities(Object.fromEntries(banner.slots.map((s) => [s.slotKey, s.priority])));
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

  const publishBlockers = useMemo(
    () =>
      getBannerPublishBlockers({
        status,
        imageUrl: desktopPreview,
        mobileImageUrl: mobilePreview,
        slots: [...selectedSlots],
        startAt: startAt || null,
        endAt: endAt || null,
      }),
    [status, desktopPreview, mobilePreview, selectedSlots, startAt, endAt]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = buildBody();
      if (isNew) return (await bannerApi.create(body)).data.data;
      return (await bannerApi.update(bannerId!, body)).data.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      const blockers = getBannerPublishBlockers({
        status: data.status,
        imageUrl: data.imageUrl,
        mobileImageUrl: data.mobileImageUrl,
        slots: data.slots,
        startAt: data.startAt,
        endAt: data.endAt,
      });
      if (blockers.length > 0) {
        showToast(t('admin:banners.savedButNotLive'), 'info');
      } else {
        showToast(t('admin:banners.saved'), 'success');
      }
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
      if (vars.kind === 'mobile') {
        setMobilePreview(data.mobileImageUrl ?? null);
        if (data.imageUrl) setDesktopPreview(data.imageUrl);
      } else {
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
      <AdminPageShell
        title={t('admin:banners.edit')}
        subtitle={t('admin:banners.editSubtitle')}
      >
        <Skeleton count={4} height={72} />
      </AdminPageShell>
    );
  }

  if (!isNew && bannerQuery.isError) {
    return (
      <AdminPageShell
        title={t('admin:banners.edit')}
        subtitle={t('admin:banners.editSubtitle')}
      >
        <QueryErrorMessage />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title={isNew ? t('admin:banners.create') : t('admin:banners.edit')}
      subtitle={t('admin:banners.editSubtitle')}
      actions={
        <Link to={ROUTES.ADMIN_BANNERS} className="btn btn--secondary">
          {t('admin:banners.backToList')}
        </Link>
      }
    >
      <div className="ag">
        <div className="ag-layout is-editing">
          <section className="ag-panel ag-main">
            <form className="ag-editor__form" onSubmit={onSubmit}>
              <h2 className="ag-editor__title">{t('admin:banners.basicInfo')}</h2>

              <label className="ag-field ag-field--full">
                <span>{t('admin:banners.fieldName')}</span>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <div className="ag-field-row">
                <label className="ag-field">
                  <span>{t('admin:banners.fieldAdvertiser')}</span>
                  <input
                    className="input"
                    value={advertiserName}
                    onChange={(e) => setAdvertiserName(e.target.value)}
                  />
                </label>
                <label className="ag-field">
                  <span>{t('admin:banners.fieldType')}</span>
                  <select
                    className="input"
                    value={bannerType}
                    onChange={(e) => setBannerType(e.target.value as BannerType)}
                  >
                    <option value="image">{t('admin:banners.typeImage')}</option>
                    <option value="gif">{t('admin:banners.typeGif')}</option>
                  </select>
                </label>
              </div>

              <label className="ag-field ag-field--full">
                <span>{t('admin:banners.fieldDescription')}</span>
                <textarea
                  className="input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <label className="ag-field ag-field--full">
                <span>{t('admin:banners.fieldTargetUrl')}</span>
                <input
                  className="input"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <div className="ag-field-row">
                <label className="ag-field">
                  <span>{t('admin:banners.fieldStatus')}</span>
                  <select
                    className="input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BannerStatus)}
                  >
                    <option value="active">{t('admin:banners.statusActive')}</option>
                    <option value="inactive">{t('admin:banners.statusInactive')}</option>
                  </select>
                </label>
                <label className="ag-field">
                  <span>{t('admin:banners.fieldPriority')}</span>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={10000}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) || 0)}
                  />
                </label>
              </div>

              <label className="ag-check">
                <input
                  type="checkbox"
                  checked={openNewWindow}
                  onChange={(e) => setOpenNewWindow(e.target.checked)}
                />
                <span>{t('admin:banners.fieldOpenNewWindow')}</span>
              </label>

              <h2 className="ag-editor__title">{t('admin:banners.exposure')}</h2>
              <div className="ag-field ag-field--full">
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
                          <code className="admin-banner-form__slot-key">{slot.slotKey}</code>
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

              <BannerScheduleFields
                startAt={startAt}
                endAt={endAt}
                onStartAtChange={setStartAt}
                onEndAtChange={setEndAt}
              />

              <h2 className="ag-editor__title">{t('admin:banners.images')}</h2>
              <div className="admin-banner-size-guide" role="note">
                <p className="admin-banner-size-guide__title">
                  {t('admin:banners.sizeGuideTitle')}
                </p>
                <p className="ag-editor__hint">{t('admin:banners.sizeGuideDesc')}</p>
                <ul className="admin-banner-size-guide__list">
                  <li>
                    <span className="admin-banner-size-guide__label">
                      {t('admin:banners.previewPc')}
                    </span>
                    <strong>
                      {BANNER_RECOMMENDED_SIZES.desktop.width}×
                      {BANNER_RECOMMENDED_SIZES.desktop.height}px
                    </strong>
                    <span className="admin-banner-size-guide__ratio">
                      {t('admin:banners.sizeRatio', {
                        ratio: (
                          BANNER_RECOMMENDED_SIZES.desktop.width /
                          BANNER_RECOMMENDED_SIZES.desktop.height
                        ).toFixed(1),
                      })}
                    </span>
                    <span
                      className="admin-banner-size-guide__bar admin-banner-size-guide__bar--pc"
                      aria-hidden
                    />
                  </li>
                  <li>
                    <span className="admin-banner-size-guide__label">
                      {t('admin:banners.previewMobile')}
                    </span>
                    <strong>
                      {BANNER_RECOMMENDED_SIZES.mobile.width}×
                      {BANNER_RECOMMENDED_SIZES.mobile.height}px
                    </strong>
                    <span className="admin-banner-size-guide__ratio">
                      {t('admin:banners.sizeRatio', {
                        ratio: (
                          BANNER_RECOMMENDED_SIZES.mobile.width /
                          BANNER_RECOMMENDED_SIZES.mobile.height
                        ).toFixed(1),
                      })}
                    </span>
                    <span
                      className="admin-banner-size-guide__bar admin-banner-size-guide__bar--mobile"
                      aria-hidden
                    />
                  </li>
                </ul>
                <p className="ag-editor__hint">
                  {t('admin:banners.sizeGuideFormats', {
                    mb: Math.round(BANNER_MAX_IMAGE_BYTES / (1024 * 1024)),
                  })}
                </p>
              </div>
              {publishBlockers.length > 0 ? (
                <div className="ag-banner" role="status">
                  <p>{t('admin:banners.notLiveTitle')}</p>
                  <ul className="admin-banner-blockers">
                    {publishBlockers.map((code) => (
                      <li key={code}>{t(`admin:banners.blocker.${code}`)}</li>
                    ))}
                  </ul>
                  <p className="ag-editor__hint">{t('admin:banners.liveWhereHint')}</p>
                </div>
              ) : (
                <p className="ag-banner ag-banner--ok" role="status">
                  {t('admin:banners.liveReady')}
                </p>
              )}
              {isNew ? (
                <p className="ag-banner">{t('admin:banners.saveBeforeUpload')}</p>
              ) : (
                <div className="ag-field-row">
                  <label className="ag-field">
                    <span>
                      {t('admin:banners.fieldDesktopImage')}
                      <span className="admin-banner-size-inline">
                        {BANNER_RECOMMENDED_SIZES.desktop.width}×
                        {BANNER_RECOMMENDED_SIZES.desktop.height}
                      </span>
                    </span>
                    <input
                      className="input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMutation.mutate({ file, kind: 'desktop' });
                      }}
                    />
                  </label>
                  <label className="ag-field">
                    <span>
                      {t('admin:banners.fieldMobileImage')}
                      <span className="admin-banner-size-inline">
                        {BANNER_RECOMMENDED_SIZES.mobile.width}×
                        {BANNER_RECOMMENDED_SIZES.mobile.height}
                      </span>
                    </span>
                    <input
                      className="input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMutation.mutate({ file, kind: 'mobile' });
                      }}
                    />
                  </label>
                </div>
              )}

              <div className="ag-editor__actions">
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
          </section>

          <aside className="ag-editor" aria-label={t('admin:banners.preview')}>
            <div className="ag-editor__head">
              <div>
                <h2 className="ag-editor__title">{t('admin:banners.preview')}</h2>
                <p className="ag-editor__hint">
                  {selectedSlotNames || t('admin:banners.noSlotsSelected')}
                </p>
              </div>
              <span
                className={`ag-pill ${status === 'active' ? 'ag-pill--on' : 'ag-pill--off'}`}
              >
                {status === 'active'
                  ? t('admin:banners.statusActive')
                  : t('admin:banners.statusInactive')}
              </span>
            </div>

            <div className="ag-chips" role="group" aria-label={t('admin:banners.preview')}>
              <button
                type="button"
                className={`ag-chip${previewMode === 'pc' ? ' is-active' : ''}`}
                onClick={() => setPreviewMode('pc')}
              >
                {t('admin:banners.previewPc')}
              </button>
              <button
                type="button"
                className={`ag-chip${previewMode === 'mobile' ? ' is-active' : ''}`}
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
                </p>
                {previewSrc ? (
                  <img src={previewSrc} alt="" className="admin-banner-preview__img" />
                ) : (
                  <p className="ag-empty">{t('admin:banners.noPreview')}</p>
                )}
              </div>
            </div>

            <dl className="ag-metric-grid">
              <div className="ag-metric">
                <span className="ag-metric__value">{priority}</span>
                <span className="ag-metric__label">{t('admin:banners.fieldPriority')}</span>
              </div>
              <div className="ag-metric">
                <span className="ag-metric__value">{selectedSlots.size}</span>
                <span className="ag-metric__label">{t('admin:banners.assignedCount')}</span>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </AdminPageShell>
  );
}
