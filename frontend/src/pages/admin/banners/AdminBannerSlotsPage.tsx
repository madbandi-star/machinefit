import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BannerSlot, BannerSlotStatus } from '@machinefit/shared';
import { bannerApi } from '@/api/banner.api';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/banners.css';

export function AdminBannerSlotsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [slotKey, setSlotKey] = useState('');
  const [slotName, setSlotName] = useState('');
  const [description, setDescription] = useState('');
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

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!slotKey.trim() || !slotName.trim()) {
      showToast(t('admin:banners.slotRequired'), 'error');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__heading">
          <h1 className="admin-page__title">{t('admin:banners.slotsTitle')}</h1>
          <p className="admin-page__subtitle">{t('admin:banners.slotsSubtitle')}</p>
        </div>
        <div className="admin-page__actions">
          <Link to={ROUTES.ADMIN_BANNERS} className="btn btn--secondary">
            {t('admin:banners.backToList')}
          </Link>
        </div>
      </header>

      <div className="admin-page__body">
        <form className="admin-panel" onSubmit={onCreate} style={{ marginBottom: '1.25rem' }}>
          <h2 className="admin-panel__title">{t('admin:banners.addSlot')}</h2>
          <div className="form-field">
            <label htmlFor="slot-key">{t('admin:banners.fieldSlotKey')}</label>
            <input
              id="slot-key"
              className="input"
              value={slotKey}
              onChange={(e) => setSlotKey(e.target.value.toUpperCase())}
              placeholder="EXAMPLE_BOTTOM"
            />
          </div>
          <div className="form-field">
            <label htmlFor="slot-name">{t('admin:banners.fieldSlotName')}</label>
            <input
              id="slot-name"
              className="input"
              value={slotName}
              onChange={(e) => setSlotName(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="slot-desc">{t('admin:banners.fieldDescription')}</label>
            <input
              id="slot-desc"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={createMutation.isPending}>
            {t('admin:banners.addSlot')}
          </button>
        </form>

        {slotsQuery.isLoading ? <Skeleton count={3} height={64} /> : null}
        {slotsQuery.isError ? <QueryErrorMessage /> : null}

        {!slotsQuery.isLoading && !slotsQuery.isError ? (
          <div className="admin-panel" style={{ overflowX: 'auto' }}>
            <table className="admin-banners-table">
              <thead>
                <tr>
                  <th>{t('admin:banners.fieldSlotKey')}</th>
                  <th>{t('admin:banners.fieldSlotName')}</th>
                  <th>{t('admin:banners.fieldDescription')}</th>
                  <th>{t('admin:banners.colStatus')}</th>
                  <th>{t('admin:banners.assignedCount')}</th>
                  <th>{t('admin:banners.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {(slotsQuery.data ?? []).map((slot) => (
                  <tr key={slot.id}>
                    <td>
                      <code>{slot.slotKey}</code>
                    </td>
                    <td>{slot.slotName}</td>
                    <td>{slot.description || '—'}</td>
                    <td>
                      {slot.status === 'active'
                        ? t('admin:banners.statusActive')
                        : t('admin:banners.statusInactive')}
                    </td>
                    <td>{slot.assignedBannerCount}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
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
    </div>
  );
}
