import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
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
      <PageShell title={t('machines')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t('machines')}>
      <h3 style={{ marginBottom: '0.75rem' }}>Brands</h3>
      <div className="admin-table" style={{ marginBottom: '1.5rem' }}>
        {brands?.map((brand) => (
          <div key={brand.id} className="card admin-table__row">
            <div>
              <strong>{brand.code}</strong>
              <p className="admin-table__meta">{brand.name.en}</p>
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

      <h3 style={{ marginBottom: '0.75rem' }}>Machines</h3>
      <div className="admin-table">
        {machines?.map((machine) => (
          <div key={machine.id} className="card admin-table__row">
            <div>
              <strong>{machine.code}</strong>
              <p className="admin-table__meta">{machine.name.en} · {machine.muscleGroup}</p>
            </div>
            <button
              className="btn btn--secondary"
              onClick={() => machineMutation.mutate({ id: machine.id, isActive: !machine.isActive })}
            >
              {machine.isActive ? t('disable') : t('enable')}
            </button>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
