import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { machineShowcaseApi } from '@/api/machine-showcase.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { RarityBadge } from '@/components/machine-showcase/RarityBadge';
import '@/styles/admin.css';
import '@/styles/machine-showcase.css';

type Tab = 'reports' | 'rarity';

export function AdminMachineShowcasePage() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('community');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [tab, setTab] = useState<Tab>('reports');
  const [q, setQ] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');

  const reportsQuery = useQuery({
    queryKey: [...QUERY_KEYS.adminMachineShowcase, 'reports'],
    queryFn: async () => (await machineShowcaseApi.adminListReports()).data.data,
    enabled: tab === 'reports',
  });

  const rarityQuery = useQuery({
    queryKey: [...QUERY_KEYS.adminMachineShowcase, 'rarity', q],
    queryFn: async () => (await machineShowcaseApi.adminListRarity({ q, page: 1 })).data.data,
    enabled: tab === 'rarity',
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'resolved' | 'dismissed' }) =>
      machineShowcaseApi.adminResolveReport(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMachineShowcase });
      showToast(t('error') === 'error' ? 'OK' : tc('showcase.reportSuccess'), 'success');
    },
  });

  const hideMutation = useMutation({
    mutationFn: (postId: string) => machineShowcaseApi.adminHidePost(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMachineShowcase });
    },
  });

  const uniqueMutation = useMutation({
    mutationFn: () =>
      machineShowcaseApi.adminPatchRarity(uniqueCode.trim(), { uniqueFlag: true, gradeOverride: 'UNIQUE' }),
    onSuccess: () => {
      showToast(t('machineShowcase.uniqueSet'), 'success');
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMachineShowcase });
      setUniqueCode('');
    },
  });

  return (
    <AdminPageShell title={t('machineShowcase.nav')} subtitle={t('menu.machineShowcaseDesc')}>
      <div className="admin-tabs">
        <button type="button" className={tab === 'reports' ? 'is-active' : ''} onClick={() => setTab('reports')}>
          {t('machineShowcase.reports')}
        </button>
        <button type="button" className={tab === 'rarity' ? 'is-active' : ''} onClick={() => setTab('rarity')}>
          {t('machineShowcase.rarity')}
        </button>
      </div>

      {tab === 'reports' ? (
        <AdminPanel title={t('machineShowcase.reports')}>
          {reportsQuery.isLoading ? <Skeleton count={3} height={56} /> : null}
          {(reportsQuery.data ?? []).length === 0 ? (
            <p className="admin-empty">{t('machineShowcase.noReports')}</p>
          ) : (
            <ul>
              {(reportsQuery.data ?? []).map((r) => (
                <li key={r.id}>
                  <strong>{r.reason}</strong> {r.description} · {r.reporterName}
                  {r.postId ? (
                    <button type="button" className="btn btn--secondary" onClick={() => hideMutation.mutate(r.postId!)}>
                      {t('machineShowcase.hidePost')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => resolveMutation.mutate({ id: r.id, status: 'resolved' })}
                  >
                    {t('photoBoard.resolve')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      ) : (
        <AdminPanel title={t('machineShowcase.rarity')}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('machineShowcase.searchMachine')} />
          <div>
            <input
              value={uniqueCode}
              onChange={(e) => setUniqueCode(e.target.value)}
              placeholder={t('machineShowcase.uniqueCode')}
            />
            <button
              type="button"
              className="btn btn--primary"
              disabled={!uniqueCode.trim() || uniqueMutation.isPending}
              onClick={() => uniqueMutation.mutate()}
            >
              {t('machineShowcase.markUnique')}
            </button>
          </div>
          {rarityQuery.isLoading ? <Skeleton count={4} height={48} /> : null}
          <ul>
            {(rarityQuery.data?.items ?? []).map((row) => (
              <li key={row.machineId}>
                <RarityBadge grade={row.grade} compact /> {row.machineCode} · {row.score}/100 ·{' '}
                {row.gymHoldingCount} gyms · {row.postCount} posts
                {row.firstDiscovererName ? ` · 🥇 ${row.firstDiscovererName}` : ''}
              </li>
            ))}
          </ul>
        </AdminPanel>
      )}
    </AdminPageShell>
  );
}
