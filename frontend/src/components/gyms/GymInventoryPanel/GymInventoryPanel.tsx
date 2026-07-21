import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, Plus, Trash2 } from 'lucide-react';
import type { GymMachine } from '@machinefit/shared';
import { brandApi, gymApi, machineApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/gym.css';

interface GymInventoryPanelProps {
  gymId: string;
}

export function GymInventoryPanel({ gymId }: GymInventoryPanelProps) {
  const { t, i18n } = useTranslation(['gyms', 'common', 'machines']);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const [brandCode, setBrandCode] = useState('');
  const [q, setQ] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [machineCode, setMachineCode] = useState('');
  const [pendingDelete, setPendingDelete] = useState<GymMachine | null>(null);

  const inventoryQuery = useQuery({
    queryKey: QUERY_KEYS.gymInventory(gymId, { brandCode: brandCode || undefined, q: q || undefined }),
    queryFn: async () => {
      const res = await gymApi.listInventory(gymId, {
        brandCode: brandCode || undefined,
        q: q || undefined,
      });
      return res.data.data;
    },
  });

  const brandsQuery = useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: async () => {
      const res = await brandApi.list();
      return res.data.data;
    },
  });

  const machinesQuery = useQuery({
    queryKey: [...QUERY_KEYS.machines, 'picker', brandCode] as const,
    queryFn: async () => {
      const machineRes = await machineApi.list({
        ...(brandCode ? { brandCode } : {}),
        limit: 200,
      });
      return machineRes.data.data.items;
    },
    enabled: addOpen,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gym(gymId) });
    await queryClient.invalidateQueries({ queryKey: ['gyms', gymId, 'inventory'] });
  };

  const addMutation = useMutation({
    mutationFn: () => gymApi.addInventory(gymId, { machineCode, quantity: 1 }),
    onSuccess: async () => {
      showToast(t('gyms:inventory.addSuccess'), 'success');
      setMachineCode('');
      setAddOpen(false);
      await invalidate();
    },
    onError: (error: unknown) => {
      const code =
        typeof error === 'object' &&
        error &&
        'response' in error &&
        (error as { response?: { data?: { error?: { code?: string } } } }).response?.data?.error
          ?.code;
      if (code === 'DUPLICATE_MACHINE') {
        showToast(t('gyms:inventory.duplicate'), 'error');
        return;
      }
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => gymApi.removeInventory(gymId, itemId),
    onSuccess: async () => {
      showToast(t('gyms:inventory.removeSuccess'), 'success');
      setPendingDelete(null);
      await invalidate();
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const items = inventoryQuery.data?.items ?? [];
  const capabilities = inventoryQuery.data?.capabilities;
  const brands = useMemo(
    () => (brandsQuery.data ?? []).filter((b) => !['FREE_WEIGHT', 'BODYWEIGHT'].includes(b.code)),
    [brandsQuery.data]
  );

  return (
    <section className="gym-detail__section gym-inventory">
      <div className="gym-inventory__header">
        <h3>{t('gyms:inventory.title')}</h3>
        {capabilities?.canAdd ? (
          <button
            type="button"
            className="btn btn--primary gym-inventory__add-btn"
            onClick={() => setAddOpen((v) => !v)}
          >
            <Plus size={16} aria-hidden />
            {t('gyms:inventory.addMachine')}
          </button>
        ) : isAuthenticated ? null : (
          <Link to={ROUTES.LOGIN} className="btn btn--secondary">
            {t('gyms:inventory.loginToAdd')}
          </Link>
        )}
      </div>

      <div className="gym-inventory__filters">
        <label className="gym-inventory__filter">
          <span>{t('gyms:inventory.brandFilter')}</span>
          <select value={brandCode} onChange={(e) => setBrandCode(e.target.value)}>
            <option value="">{t('gyms:inventory.allBrands')}</option>
            {brands.map((brand) => (
              <option key={brand.code} value={brand.code}>
                {getLocalizedName(brand.name, i18n.language, brand.code)}
              </option>
            ))}
          </select>
        </label>
        <label className="gym-inventory__filter gym-inventory__filter--grow">
          <span>{t('gyms:inventory.search')}</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('gyms:inventory.searchPlaceholder')}
          />
        </label>
      </div>

      {addOpen ? (
        <form
          className="gym-inventory__add-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!machineCode) return;
            addMutation.mutate();
          }}
        >
          <label className="gym-inventory__filter gym-inventory__filter--grow">
            <span>{t('gyms:inventory.selectMachine')}</span>
            <select
              value={machineCode}
              onChange={(e) => setMachineCode(e.target.value)}
              required
            >
              <option value="">{t('gyms:inventory.selectMachinePlaceholder')}</option>
              {(machinesQuery.data ?? []).map((machine) => (
                <option key={machine.code} value={machine.code}>
                  {getLocalizedName(machine.brandName, i18n.language, '')
                    ? `${getLocalizedName(machine.brandName, i18n.language, '')} · `
                    : ''}
                  {getLocalizedName(machine.name, i18n.language, machine.code)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!machineCode || addMutation.isPending}
          >
            {t('gyms:inventory.register')}
          </button>
        </form>
      ) : null}

      {inventoryQuery.isLoading ? (
        <Skeleton count={3} height={64} />
      ) : items.length === 0 ? (
        <p className="gym-inventory__empty">{t('gyms:inventory.empty')}</p>
      ) : (
        <ul className="gym-inventory__list">
          {items.map((item) => (
            <li
              key={item.id}
              className={`gym-inventory__item${
                item.isVerified ? ' gym-inventory__item--verified' : ''
              }`}
            >
              <div className="gym-inventory__item-main">
                <p className="gym-inventory__brand">
                  {item.brandName ?? item.brandCode ?? t('gyms:inventory.unknownBrand')}
                </p>
                <div className="gym-inventory__name-row">
                  <strong>{item.machineName}</strong>
                  {item.isVerified ? (
                    <span className="gym-inventory__badge gym-inventory__badge--verified">
                      <BadgeCheck size={14} aria-hidden />
                      {t('gyms:inventory.official')}
                    </span>
                  ) : (
                    <span className="gym-inventory__badge">
                      {t('gyms:inventory.memberRegistered')}
                    </span>
                  )}
                </div>
                <p className="gym-inventory__meta">
                  {item.isVerified
                    ? t('gyms:inventory.registeredByOwner')
                    : t('gyms:inventory.registeredByMember')}
                  {item.quantity > 1 ? ` · ${item.quantity}${t('gyms:units')}` : ''}
                </p>
              </div>
              <div className="gym-inventory__item-actions">
                {item.machineCode ? (
                  <Link
                    to={ROUTES.MACHINE_DETAIL.replace(':machineCode', item.machineCode)}
                    className="btn btn--secondary"
                  >
                    {t('gyms:viewMachine')}
                  </Link>
                ) : null}
                {item.canDelete ? (
                  <button
                    type="button"
                    className="btn btn--ghost gym-inventory__delete"
                    aria-label={t('gyms:inventory.remove')}
                    onClick={() => setPendingDelete(item)}
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('gyms:inventory.removeTitle')}
        message={t('gyms:inventory.removeMessage', {
          name: pendingDelete?.machineName ?? '',
        })}
        confirmLabel={t('gyms:inventory.remove')}
        confirmVariant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeMutation.mutate(pendingDelete.id);
        }}
      />
    </section>
  );
}
