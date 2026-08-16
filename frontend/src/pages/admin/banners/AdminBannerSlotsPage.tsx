import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BannerSlot, BannerSlotStatus } from '@machinefit/shared';
import { bannerApi } from '@/api/banner.api';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';
import '@/styles/banners.css';

type StatusFilter = 'all' | 'active' | 'inactive' | 'assigned';

export function AdminBannerSlotsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [slotKey, setSlotKey] = useState('');
  const [slotName, setSlotName] = useState('');
  const [description, setDescription] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BannerSlot | null>(null);

  const slotsQuery = useQuery({
    queryKey: ['admin', 'banner-slots'],
    queryFn: async () => (await bannerApi.listSlots()).data.data,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      bannerApi.createSlot({
        slotKey: slotKey.trim().toUpperCase(),
        slotName: slotName.trim(),
        description: description.trim(),
        status: 'active',
      }),
    onSuccess: async () => {
      setSlotKey('');
      setSlotName('');
      setDescription('');
      setEditorOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banner-slots'] });
      showToast(t('admin:banners.slotCreated'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BannerSlotStatus }) =>
      bannerApi.updateSlot(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banner-slots'] });
      showToast(t('admin:banners.slotUpdated'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannerApi.removeSlot(id),
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banner-slots'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      showToast(t('admin:banners.slotDeleted'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const slots = slotsQuery.data ?? [];

  const stats = useMemo(() => {
    const active = slots.filter((s) => s.status === 'active').length;
    const withBanners = slots.filter((s) => s.assignedBannerCount > 0).length;
    return {
      total: slots.length,
      active,
      inactive: slots.length - active,
      withBanners,
    };
  }, [slots]);

  const filtered = useMemo(() => {
    return slots.filter((s) => {
      if (statusFilter === 'active' && s.status !== 'active') return false;
      if (statusFilter === 'inactive' && s.status !== 'inactive') return false;
      if (statusFilter === 'assigned' && s.assignedBannerCount <= 0) return false;
      return true;
    });
  }, [slots, statusFilter]);

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!slotKey.trim() || !slotName.trim()) {
      showToast(t('admin:banners.slotRequired'), 'error');
      return;
    }
    createMutation.mutate();
  };

  const openCreate = () => {
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
  };

  return (
    <AdminPageShell
      title={t('admin:banners.slotsTitle')}
      subtitle={t('admin:banners.slotsSubtitle')}
      actions={
        <>
          <Link to={ROUTES.ADMIN_BANNERS} className="btn btn--secondary btn--sm">
            {t('admin:banners.backToList')}
          </Link>
          <button type="button" className="btn btn--primary btn--sm" onClick={openCreate}>
            {t('admin:banners.addSlot')}
          </button>
        </>
      }
    >
      <div className="ag">
        {slotsQuery.isLoading ? <Skeleton count={1} height={72} /> : null}
        {!slotsQuery.isLoading ? (
          <section className="ag-kpis ag-kpis--4" aria-label={t('admin:banners.slotsTitle')}>
            <button
              type="button"
              className={`ag-kpi${statusFilter === 'all' ? ' is-active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              <span className="ag-kpi__value">{stats.total}</span>
              <span className="ag-kpi__label">{t('admin:banners.kpiTotal')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${statusFilter === 'active' ? ' is-active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              <span className="ag-kpi__value">{stats.active}</span>
              <span className="ag-kpi__label">{t('admin:banners.statusActive')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${statusFilter === 'inactive' ? ' is-active' : ''}${
                stats.inactive > 0 ? ' is-muted' : ''
              }`}
              onClick={() => setStatusFilter('inactive')}
            >
              <span className="ag-kpi__value">{stats.inactive}</span>
              <span className="ag-kpi__label">{t('admin:banners.statusInactive')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${statusFilter === 'assigned' ? ' is-active' : ''}`}
              onClick={() => setStatusFilter('assigned')}
            >
              <span className="ag-kpi__value">{stats.withBanners}</span>
              <span className="ag-kpi__label">{t('admin:banners.kpiWithBanners')}</span>
            </button>
          </section>
        ) : null}

        <div className={`ag-layout${editorOpen ? ' is-editing' : ''}`}>
          <div className="ag-main">
            <section className="ag-panel">
              {slotsQuery.isLoading ? <Skeleton count={4} height={52} /> : null}
              {slotsQuery.isError ? <QueryErrorMessage /> : null}
              {!slotsQuery.isLoading && !slotsQuery.isError ? (
                <div className="ag-queue">
                  {filtered.length === 0 ? (
                    <p className="ag-empty">{t('admin:banners.emptySlots')}</p>
                  ) : (
                    filtered.map((slot) => {
                      const open = expandedId === slot.id;
                      return (
                        <article
                          key={slot.id}
                          className={[
                            'ag-card',
                            slot.status !== 'active' ? 'is-off' : '',
                            open ? 'is-selected' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <button
                            type="button"
                            className="ag-card__main"
                            onClick={() =>
                              setExpandedId((prev) => (prev === slot.id ? null : slot.id))
                            }
                          >
                            <span className="ag-card__identity">
                              <span className="ag-card__title">
                                <code>{slot.slotKey}</code>
                                {' · '}
                                {slot.slotName}
                              </span>
                              <span className="ag-card__meta">
                                {slot.description || '—'}
                                {' · '}
                                {t('admin:banners.assignedCount')}: {slot.assignedBannerCount}
                              </span>
                            </span>
                            <span
                              className={`ag-pill ${
                                slot.status === 'active' ? 'ag-pill--on' : 'ag-pill--off'
                              }`}
                            >
                              {slot.status === 'active'
                                ? t('admin:banners.statusActive')
                                : t('admin:banners.statusInactive')}
                            </span>
                            <span className="ag-metrics">
                              <span>{slot.assignedBannerCount}</span>
                            </span>
                            <span className="ag-card__chevron" aria-hidden>
                              {open ? '▾' : '▸'}
                            </span>
                          </button>
                          {open ? (
                            <div className="ag-card__detail">
                              <div className="ag-card__actions">
                                <button
                                  type="button"
                                  className="btn btn--secondary btn--sm"
                                  disabled={updateMutation.isPending}
                                  onClick={() =>
                                    updateMutation.mutate({
                                      id: slot.id,
                                      status: slot.status === 'active' ? 'inactive' : 'active',
                                    })
                                  }
                                >
                                  {slot.status === 'active'
                                    ? t('admin:banners.deactivate')
                                    : t('admin:banners.activate')}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => setDeleteTarget(slot)}
                                >
                                  {t('common:actions.delete')}
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

          {editorOpen ? (
            <aside className="ag-editor" aria-label={t('admin:banners.addSlot')}>
              <div className="ag-editor__head">
                <div>
                  <h2 className="ag-editor__title">{t('admin:banners.addSlot')}</h2>
                  <p className="ag-editor__hint">{t('admin:banners.slotsSubtitle')}</p>
                </div>
                <button type="button" className="btn btn--ghost btn--sm" onClick={closeEditor}>
                  {t('common:actions.close')}
                </button>
              </div>
              <form className="ag-editor__form" onSubmit={onCreate}>
                <label className="ag-field">
                  <span>{t('admin:banners.fieldSlotKey')}</span>
                  <input
                    className="input"
                    value={slotKey}
                    onChange={(e) => setSlotKey(e.target.value.toUpperCase())}
                    placeholder="EXAMPLE_BOTTOM"
                  />
                </label>
                <label className="ag-field">
                  <span>{t('admin:banners.fieldSlotName')}</span>
                  <input
                    className="input"
                    value={slotName}
                    onChange={(e) => setSlotName(e.target.value)}
                  />
                </label>
                <label className="ag-field">
                  <span>{t('admin:banners.fieldDescription')}</span>
                  <input
                    className="input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </label>
                <div className="ag-editor__actions">
                  <button
                    type="submit"
                    className="btn btn--primary btn--sm"
                    disabled={createMutation.isPending}
                  >
                    {t('admin:banners.addSlot')}
                  </button>
                </div>
              </form>
            </aside>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('admin:banners.slotDeleteTitle')}
        message={
          deleteTarget
            ? t('admin:banners.slotDeleteMessage', {
                name: deleteTarget.slotName,
                key: deleteTarget.slotKey,
                count: deleteTarget.assignedBannerCount,
              })
            : ''
        }
        confirmLabel={t('common:actions.delete')}
        confirmVariant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </AdminPageShell>
  );
}
