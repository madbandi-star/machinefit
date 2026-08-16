import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { bannerApi } from '@/api/banner.api';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';
import '@/styles/banners.css';

type StatusFilter = 'all' | 'active' | 'inactive';

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
  const [status, setStatus] = useState<StatusFilter>('all');
  const [slotKey, setSlotKey] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const slotsQuery = useQuery({
    queryKey: ['admin', 'banner-slots'],
    queryFn: async () => (await bannerApi.listSlots()).data.data,
  });

  const listQuery = useQuery({
    queryKey: ['admin', 'banners', 'glance'],
    queryFn: async () => {
      const res = await bannerApi.listAdmin({ pageSize: 100 });
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

  const stats = useMemo(() => {
    const active = items.filter((i) => i.status === 'active').length;
    return { total: items.length, active, inactive: items.length - active };
  }, [items]);

  const slotCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      for (const s of item.slots) {
        map.set(s.slotKey, (map.get(s.slotKey) ?? 0) + 1);
      }
    }
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((item) => {
      if (status === 'active' && item.status !== 'active') return false;
      if (status === 'inactive' && item.status !== 'inactive') return false;
      if (slotKey && !item.slots.some((s) => s.slotKey === slotKey)) return false;
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        (item.advertiserName || '').toLowerCase().includes(needle)
      );
    });
  }, [items, q, status, slotKey]);

  return (
    <AdminPageShell
      title={t('admin:banners.title')}
      subtitle={t('admin:banners.subtitle')}
      actions={
        <>
          <Link to={ROUTES.ADMIN_BANNER_STATS} className="btn btn--secondary btn--sm">
            {t('admin:banners.navStats')}
          </Link>
          <Link to={ROUTES.ADMIN_BANNER_SLOTS} className="btn btn--secondary btn--sm">
            {t('admin:banners.navSlots')}
          </Link>
          <Link to={ROUTES.ADMIN_BANNER_NEW} className="btn btn--primary btn--sm">
            {t('admin:banners.create')}
          </Link>
        </>
      }
    >
      <div className="ag">
        {listQuery.isLoading ? <Skeleton count={1} height={72} /> : null}
        {!listQuery.isLoading ? (
          <section className="ag-kpis ag-kpis--4" aria-label={t('admin:banners.statsOverview')}>
            <button
              type="button"
              className={`ag-kpi${status === 'all' ? ' is-active' : ''}`}
              onClick={() => setStatus('all')}
            >
              <span className="ag-kpi__value">{stats.total}</span>
              <span className="ag-kpi__label">{t('admin:banners.kpiTotal')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${status === 'active' ? ' is-active' : ''}`}
              onClick={() => setStatus('active')}
            >
              <span className="ag-kpi__value">{stats.active}</span>
              <span className="ag-kpi__label">{t('admin:banners.statusActive')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${status === 'inactive' ? ' is-active' : ''}${
                stats.inactive > 0 ? ' is-muted' : ''
              }`}
              onClick={() => setStatus('inactive')}
            >
              <span className="ag-kpi__value">{stats.inactive}</span>
              <span className="ag-kpi__label">{t('admin:banners.statusInactive')}</span>
            </button>
          </section>
        ) : null}

        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              type="search"
              className="ag-search"
              placeholder={t('admin:banners.searchPlaceholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t('admin:banners.searchPlaceholder')}
            />
            <div className="ag-chips" role="group" aria-label={t('admin:banners.colStatus')}>
              <button
                type="button"
                className={`ag-chip${status === 'all' ? ' is-active' : ''}`}
                onClick={() => setStatus('all')}
              >
                {t('admin:banners.filterAllStatus')}
                <span className="ag-chip__count">{stats.total}</span>
              </button>
              <button
                type="button"
                className={`ag-chip${status === 'active' ? ' is-active' : ''}`}
                onClick={() => setStatus('active')}
              >
                {t('admin:banners.statusActive')}
                <span className="ag-chip__count">{stats.active}</span>
              </button>
              <button
                type="button"
                className={`ag-chip${status === 'inactive' ? ' is-active' : ''}`}
                onClick={() => setStatus('inactive')}
              >
                {t('admin:banners.statusInactive')}
                <span className="ag-chip__count">{stats.inactive}</span>
              </button>
            </div>
            <div className="ag-chips" role="group" aria-label={t('admin:banners.colSlots')}>
              <button
                type="button"
                className={`ag-chip${slotKey === '' ? ' is-active' : ''}`}
                onClick={() => setSlotKey('')}
              >
                {t('admin:banners.filterAllSlots')}
                <span className="ag-chip__count">{stats.total}</span>
              </button>
              {(slotsQuery.data ?? []).map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  className={`ag-chip${slotKey === slot.slotKey ? ' is-active' : ''}`}
                  onClick={() => setSlotKey(slot.slotKey)}
                >
                  {slot.slotName}
                  <span className="ag-chip__count">{slotCounts.get(slot.slotKey) ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          {listQuery.isLoading ? <Skeleton count={5} height={52} /> : null}
          {listQuery.isError ? <QueryErrorMessage /> : null}

          {!listQuery.isLoading && !listQuery.isError ? (
            <div className="ag-queue">
              {filtered.length === 0 ? (
                <p className="ag-empty">{t('admin:banners.empty')}</p>
              ) : (
                filtered.map((item) => {
                  const open = expandedId === item.id;
                  return (
                    <article
                      key={item.id}
                      className={[
                        'ag-card',
                        item.status !== 'active' ? 'is-off' : '',
                        open ? 'is-selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <button
                        type="button"
                        className="ag-card__main"
                        onClick={() =>
                          setExpandedId((prev) => (prev === item.id ? null : item.id))
                        }
                      >
                        <span className="ag-card__identity ag-card__identity--thumb">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="admin-banner-thumb admin-banner-thumb--sm"
                            />
                          ) : (
                            <span className="admin-banner-thumb admin-banner-thumb--sm admin-banner-thumb--empty" />
                          )}
                          <span className="ag-card__identity-text">
                            <span className="ag-card__title">{item.name}</span>
                            <span className="ag-card__meta">
                              {item.advertiserName || '—'}
                              {' · '}
                              {item.bannerType}
                            </span>
                          </span>
                        </span>
                        <span
                          className={`ag-pill ${
                            item.status === 'active' ? 'ag-pill--on' : 'ag-pill--off'
                          }`}
                        >
                          {item.status === 'active'
                            ? t('admin:banners.statusActive')
                            : t('admin:banners.statusInactive')}
                        </span>
                        <span className="ag-metrics">
                          <span>
                            {item.impressionCount} / {item.clickCount}
                          </span>
                          <span>{item.ctr.toFixed(2)}%</span>
                        </span>
                        <span className="ag-card__chevron" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </button>
                      {open ? (
                        <div className="ag-card__detail">
                          <p className="ag-card__excerpt">
                            {t('admin:banners.colPeriod')}: {fmtDate(item.startAt, locale)} ~{' '}
                            {fmtDate(item.endAt, locale)}
                            {' · '}
                            {t('admin:banners.colPriority')}: {item.priority}
                            {' · '}
                            {t('admin:banners.colSlots')}:{' '}
                            {item.slots.length
                              ? item.slots.map((s) => s.slotName).join(', ')
                              : '—'}
                          </p>
                          <p className="ag-card__excerpt">
                            {t('admin:banners.colImpressions')}: {item.impressionCount}
                            {' · '}
                            {t('admin:banners.colClicks')}: {item.clickCount}
                            {' · '}
                            {t('admin:banners.colCtr')}: {item.ctr.toFixed(2)}%
                          </p>
                          <div className="ag-card__actions">
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
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          ) : null}
        </section>
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
    </AdminPageShell>
  );
}
