import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { SearchableSelect } from '@/components/form/SearchableSelect/SearchableSelect';
import { ownerApi, machineApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/community.css';

export function OwnerDashboardPage() {
  const { t } = useTranslation('community');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [showGymForm, setShowGymForm] = useState(false);
  const [expandedGym, setExpandedGym] = useState<string | null>(null);
  const [gymName, setGymName] = useState('');
  const [slug, setSlug] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [quantity, setQuantity] = useState(1);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: QUERY_KEYS.ownerDashboard,
    queryFn: async () => {
      const res = await ownerApi.dashboard();
      return res.data.data;
    },
  });

  const { data: gyms, isLoading: gymsLoading } = useQuery({
    queryKey: QUERY_KEYS.ownerGyms,
    queryFn: async () => {
      const res = await ownerApi.listGyms();
      return res.data.data;
    },
  });

  const { data: machines } = useQuery({
    queryKey: QUERY_KEYS.machines,
    queryFn: async () => {
      const res = await machineApi.list({ limit: 50 });
      return res.data.data.items;
    },
  });

  const machineSelectOptions = useMemo(
    () =>
      (machines ?? []).map((machine) => ({
        value: machine.code,
        label: `${machine.code} — ${machine.name.en ?? machine.code}`,
      })),
    [machines]
  );

  const { data: gymMachines, isLoading: machinesLoading } = useQuery({
    queryKey: [...QUERY_KEYS.ownerGyms, expandedGym, 'machines'],
    queryFn: async () => {
      const res = await ownerApi.getGymMachines(expandedGym!);
      return res.data.data;
    },
    enabled: !!expandedGym,
  });

  const createGymMutation = useMutation({
    mutationFn: () =>
      ownerApi.createGym({
        name: gymName,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        address,
        city: city || undefined,
        countryCode: 'KR',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ownerGyms });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ownerDashboard });
      setShowGymForm(false);
      setGymName('');
      setSlug('');
      setAddress('');
      setCity('');
      showToast(t('createSuccess'), 'success');
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const addMachineMutation = useMutation({
    mutationFn: () =>
      ownerApi.addGymMachine(expandedGym!, {
        machineCode: selectedMachine,
        quantity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.ownerGyms, expandedGym, 'machines'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ownerDashboard });
      setSelectedMachine('');
      setQuantity(1);
      showToast(t('createSuccess'), 'success');
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const removeMachineMutation = useMutation({
    mutationFn: (itemId: string) => ownerApi.removeGymMachine(expandedGym!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.ownerGyms, expandedGym, 'machines'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ownerDashboard });
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const handleCreateGym = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName.trim() || !slug.trim() || !address.trim()) return;
    createGymMutation.mutate();
  };

  const handleAddMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    addMachineMutation.mutate();
  };

  if (statsLoading || gymsLoading) {
    return (
      <PageShell title={t('ownerDashboard')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t('ownerDashboard')} subtitle={t('ownerSubtitle')}>
      <div className="owner-stats">
        <div className="card owner-stat">
          <div className="owner-stat__value">{stats?.gymCount ?? 0}</div>
          <div className="owner-stat__label">{t('gymCount')}</div>
        </div>
        <div className="card owner-stat">
          <div className="owner-stat__value">{stats?.machineCount ?? 0}</div>
          <div className="owner-stat__label">{t('machineCount')}</div>
        </div>
        <div className="card owner-stat">
          <div className="owner-stat__value">{stats?.verifiedCount ?? 0}</div>
          <div className="owner-stat__label">{t('verifiedCount')}</div>
        </div>
      </div>

      <button className="btn btn--primary btn--block" onClick={() => setShowGymForm(!showGymForm)}>
        {t('registerGym')}
      </button>

      {showGymForm && (
        <form className="card" style={{ marginTop: '1rem' }} onSubmit={handleCreateGym}>
          <div className="form-row">
            <label htmlFor="gym-name">{t('gymName')}</label>
            <input id="gym-name" value={gymName} onChange={(e) => setGymName(e.target.value)} required />
          </div>
          <div className="form-row">
            <label htmlFor="gym-slug">{t('slug')}</label>
            <input
              id="gym-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="gym-address">{t('address')}</label>
            <input id="gym-address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>
          <div className="form-row">
            <label htmlFor="gym-city">{t('city')}</label>
            <input id="gym-city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <button type="submit" className="btn btn--primary" disabled={createGymMutation.isPending}>
            {t('submit')}
          </button>
        </form>
      )}

      <div className="owner-gym-section">
        {gyms?.map((gym) => (
          <div key={gym.id} className="card" style={{ marginBottom: '0.75rem' }}>
            <button
              className="btn btn--block"
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0 }}
              onClick={() => setExpandedGym(expandedGym === gym.id ? null : gym.id)}
            >
              <strong>{gym.name}</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                {gym.city} · {gym.machineCount ?? 0} machines
              </span>
            </button>

            {expandedGym === gym.id && (
              <div style={{ marginTop: '1rem' }}>
                {machinesLoading ? (
                  <Skeleton count={2} />
                ) : (
                  <>
                    {gymMachines?.map((m) => (
                      <div key={m.id} className="inventory-item">
                        <div>
                          <strong>{m.machineCode}</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                            {m.machineName} · {t('quantity')}: {m.quantity}
                          </span>
                        </div>
                        <button
                          className="btn btn--secondary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => removeMachineMutation.mutate(m.id)}
                        >
                          {t('remove')}
                        </button>
                      </div>
                    ))}

                    <form onSubmit={handleAddMachine} style={{ marginTop: '1rem' }}>
                      <div className="form-row">
                        <label htmlFor={`machine-${gym.id}`}>{t('selectMachine')}</label>
                        <SearchableSelect
                          id={`machine-${gym.id}`}
                          value={selectedMachine}
                          options={machineSelectOptions}
                          onChange={setSelectedMachine}
                          placeholder={t('selectMachine')}
                        />
                      </div>
                      <div className="form-row">
                        <label htmlFor={`qty-${gym.id}`}>{t('quantity')}</label>
                        <input
                          id={`qty-${gym.id}`}
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                        />
                      </div>
                      <button type="submit" className="btn btn--primary" disabled={addMachineMutation.isPending}>
                        {t('addMachine')}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
