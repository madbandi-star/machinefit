import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { bannerApi } from '@/api/banner.api';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/banners.css';

function fmtDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale || 'ko', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function AdminBannersPage() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [slotKey, setSlotKey] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const slotsQuery = useQuery({
    queryKey: ['admin', 'banner-slots'],
    queryFn: async () => (await bannerApi.listSlots()).data.data,
  });

  const listQuery = useQuery({
    queryKey: ['admin', 'banners', q, status, slotKey],
    queryFn: async () => {
      const res = await bannerApi.listAdmin({
        pageSize: 100,
        q: q || undefined,
        status: status || undefined,
        slotKey: slotKey || undefined,
      });
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannerApi.remove(id),
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      showToast(t('admin:banners.deleted'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const items = listQuery.data?.items ?? [];
  const locale = i18n.language;

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('admin:banners.filterAllStatus') },
      { value: 'active', label: t('admin:banners.statusActive') },
      { value: 'inactive', label: t('admin:banners.statusInactive') },
    ],
    [t]
  );

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__heading">
          <h1 className="admin-page__title">{t('admin:banners.title')}</h1>
          <p className="admin-page__subtitle">{t('admin:banners.subtitle')}</p>
        </div>
        <div className="admin-page__actions">
          <Link to={ROUTES.ADMIN_BANNER_STATS} className="btn btn--secondary">
            {t('admin:banners.navStats')}
          </Link>
          <Link to={ROUTES.ADMIN_BANNER_SLOTS} className="btn btn--secondary">
            {t('admin:banners.navSlots')}
          </Link>
          <Link to={ROUTES.ADMIN_BANNER_NEW} className="btn btn--primary">
            {t('admin:banners.create')}
          </Link>
        </div>
      </header>

      <div className="admin-page__body">
        <div className="admin-banners-filters">
          <input
            type="search"
            className="input"
            placeholder={t('admin:banners.searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label={t('admin:banners.colStatus')}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={slotKey}
            onChange={(e) => setSlotKey(e.target.value)}
            aria-label={t('admin:banners.colSlots')}
          >
            <option value="">{t('admin:banners.filterAllSlots')}</option>
            {(slotsQuery.data ?? []).map((slot) => (
              <option key={slot.id} value={slot.slotKey}>
                {slot.slotName}
              </option>
            ))}
          </select>
        </div>

        {listQuery.isLoading ? <Skeleton height={240} /> : null}
        {listQuery.isError ? <QueryErrorMessage /> : null}

        {!listQuery.isLoading && !listQuery.isError ? (
          <div className="admin-panel" style={{ overflowX: 'auto' }}>
            <table className="admin-banners-table">
              <thead>
                <tr>
                  <th>{t('admin:banners.colPreview')}</th>
                  <th>{t('admin:banners.colName')}</th>
                  <th>{t('admin:banners.colAdvertiser')}</th>
                  <th>{t('admin:banners.colType')}</th>
                  <th>{t('admin:banners.colSlots')}</th>
                  <th>{t('admin:banners.colPeriod')}</th>
                  <th>{t('admin:banners.colPriority')}</th>
                  <th>{t('admin:banners.colStatus')}</th>
                  <th>{t('admin:banners.colImpressions')}</th>
                  <th>{t('admin:banners.colClicks')}</th>
                  <th>{t('admin:banners.colCtr')}</th>
                  <th>{t('admin:banners.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={12}>{t('admin:banners.empty')}</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="admin-banner-thumb"
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{item.name}</td>
                      <td>{item.advertiserName || '—'}</td>
                      <td>{item.bannerType}</td>
                      <td>
                        {item.slots.length
                          ? item.slots.map((s) => s.slotName).join(', ')
                          : '—'}
                      </td>
                      <td>
                        {fmtDate(item.startAt, locale)} ~ {fmtDate(item.endAt, locale)}
                      </td>
                      <td>{item.priority}</td>
                      <td>
                        {item.status === 'active'
                          ? t('admin:banners.statusActive')
                          : t('admin:banners.statusInactive')}
                      </td>
                      <td>{item.impressionCount}</td>
                      <td>{item.clickCount}</td>
                      <td>{item.ctr.toFixed(2)}%</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <Link
                            to={ROUTES.ADMIN_BANNER_EDIT.replace(':bannerId', item.id)}
                            className="btn btn--secondary btn--sm"
                          >
                            {t('admin:banners.edit')}
                          </Link>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => setPendingDelete(item.id)}
                          >
                            {t('admin:banners.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('admin:banners.deleteConfirmTitle')}
        message={t('admin:banners.deleteConfirmMessage')}
        confirmLabel={t('admin:banners.delete')}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete);
        }}
      />
    </div>
  );
}
