import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

export function AdminMachinesPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.adminMachines, 'brands'],
    queryFn: async () => {
      const res = await adminApi.listBrands();
      return res.data.data;
    },
  });

  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: [...QUERY_KEYS.adminMachines, 'machines'],
    queryFn: async () => {
      const res = await adminApi.listMachines();
      return res.data.data;
    },
  });

  const brandMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateBrand(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMachines });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const machineMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateMachine(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMachines });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  if (brandsLoading || machinesLoading) {
    return (
      <AdminPageShell title={t('machines')}>
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={t('machines')}>
      <section className="admin-section">
        <h3 className="admin-section__title">Brands</h3>
        <div className="admin-table">
          {brands?.map((brand) => (
            <div key={brand.id} className="card admin-table__row">
              <div className="admin-table__brand">
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt="" className="admin-table__brand-logo" loading="lazy" />
                ) : null}
                <div>
                  <strong>{brand.code}</strong>
                  <p className="admin-table__meta">{brand.name.en}</p>
                </div>
              </div>
              <button
                className="btn btn--secondary"
                onClick={() => brandMutation.mutate({ id: brand.id, isActive: !brand.isActive })}
              >
                {brand.isActive ? t('disable') : t('enable')}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h3 className="admin-section__title">Machines</h3>
        <div className="admin-table">
          {machines?.map((machine) => (
            <div key={machine.id} className="card admin-table__row">
              <div className="admin-table__brand">
                {machine.primaryImageUrl ? (
                  <img
                    src={machine.primaryImageUrl}
                    alt=""
                    className="admin-table__brand-logo"
                    loading="lazy"
                  />
                ) : null}
                <div>
                  <strong>{machine.code}</strong>
                  <p className="admin-table__meta">
                    {machine.name.en} · {machine.muscleGroup}
                  </p>
                </div>
              </div>
              <button
                className="btn btn--secondary"
                onClick={() =>
                  machineMutation.mutate({ id: machine.id, isActive: !machine.isActive })
                }
              >
                {machine.isActive ? t('disable') : t('enable')}
              </button>
            </div>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
