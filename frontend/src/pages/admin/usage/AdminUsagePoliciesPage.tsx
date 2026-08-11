import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { UsagePolicy, UsagePolicyUpdateInput } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminUsageApi } from '@/api/usage.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-usage.css';

function LimitInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="admin-usage__field">
      <span>{label}</span>
      <input
        className="input"
        type="number"
        min={0}
        placeholder="∞"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === '' ? null : Math.max(0, Number(raw) || 0));
        }}
      />
    </label>
  );
}

export function AdminUsagePoliciesPage() {
  const { t } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UsagePolicyUpdateInput | null>(null);

  const policiesQuery = useQuery({
    queryKey: ['admin-usage-policies'],
    queryFn: async () => (await adminUsageApi.listPolicies()).data.data,
  });

  const selected = policiesQuery.data?.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      featureName: selected.featureName,
      description: selected.description,
      freeAllowed: selected.freeAllowed,
      freeDailyLimit: selected.freeDailyLimit,
      freeMonthlyLimit: selected.freeMonthlyLimit,
      premiumAllowed: selected.premiumAllowed,
      premiumDailyLimit: selected.premiumDailyLimit,
      premiumMonthlyLimit: selected.premiumMonthlyLimit,
      limitsEnforced: selected.limitsEnforced,
      isActive: selected.isActive,
    });
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: string; body: UsagePolicyUpdateInput }) =>
      (await adminUsageApi.updatePolicy(payload.id, payload.body)).data.data,
    onSuccess: () => {
      showToast(t('saved'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-usage-policies'] });
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const selectPolicy = (p: UsagePolicy) => setSelectedId(p.id);

  if (policiesQuery.isLoading) {
    return (
      <AdminPageShell title={t('usage.policiesTitle')} subtitle={t('usage.policiesSubtitle')}>
        <Skeleton count={5} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={t('usage.policiesTitle')} subtitle={t('usage.policiesSubtitle')}>
      <p className="admin-usage__banner">{t('usage.policyBanner')}</p>
      <div className="admin-usage admin-usage--split">
        <AdminPanel title={t('usage.policyList')}>
          <ul className="admin-usage__policy-list">
            {(policiesQuery.data ?? []).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`admin-usage__user-item${
                    selectedId === p.id ? ' is-selected' : ''
                  }`}
                  onClick={() => selectPolicy(p)}
                >
                  <strong>{p.featureName}</strong>
                  <span className="admin-muted">{p.featureCode}</span>
                  <span>
                    {p.limitsEnforced ? t('usage.enforcedOn') : t('usage.enforcedOff')} ·{' '}
                    {p.freeDailyLimit == null ? t('usage.unlimited') : p.freeDailyLimit}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </AdminPanel>

        <AdminPanel title={t('usage.policyEdit')}>
          {!selected || !draft ? (
            <p className="admin-muted">{t('usage.pickPolicy')}</p>
          ) : (
            <form
              className="admin-usage__policy-form"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate({ id: selected.id, body: draft });
              }}
            >
              <p className="admin-muted">{selected.featureCode}</p>
              <label className="admin-usage__field">
                <span>{t('usage.fieldName')}</span>
                <input
                  className="input"
                  value={draft.featureName ?? ''}
                  onChange={(e) => setDraft({ ...draft, featureName: e.target.value })}
                />
              </label>
              <label className="admin-usage__field">
                <span>{t('usage.fieldDesc')}</span>
                <textarea
                  className="input"
                  rows={2}
                  value={draft.description ?? ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </label>
              <div className="admin-usage__toggles">
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(draft.freeAllowed)}
                    onChange={(e) => setDraft({ ...draft, freeAllowed: e.target.checked })}
                  />
                  {t('usage.freeAllowed')}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(draft.premiumAllowed)}
                    onChange={(e) => setDraft({ ...draft, premiumAllowed: e.target.checked })}
                  />
                  {t('usage.premiumAllowed')}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(draft.limitsEnforced)}
                    onChange={(e) => setDraft({ ...draft, limitsEnforced: e.target.checked })}
                  />
                  {t('usage.limitsEnforced')}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(draft.isActive)}
                    onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  />
                  {t('usage.isActive')}
                </label>
              </div>
              <div className="admin-usage__limits">
                <LimitInput
                  label={t('usage.freeDaily')}
                  value={draft.freeDailyLimit ?? null}
                  onChange={(v) => setDraft({ ...draft, freeDailyLimit: v })}
                />
                <LimitInput
                  label={t('usage.freeMonthly')}
                  value={draft.freeMonthlyLimit ?? null}
                  onChange={(v) => setDraft({ ...draft, freeMonthlyLimit: v })}
                />
                <LimitInput
                  label={t('usage.premiumDaily')}
                  value={draft.premiumDailyLimit ?? null}
                  onChange={(v) => setDraft({ ...draft, premiumDailyLimit: v })}
                />
                <LimitInput
                  label={t('usage.premiumMonthly')}
                  value={draft.premiumMonthlyLimit ?? null}
                  onChange={(v) => setDraft({ ...draft, premiumMonthlyLimit: v })}
                />
              </div>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={saveMutation.isPending}
              >
                {t('usage.save')}
              </button>
            </form>
          )}
        </AdminPanel>
      </div>
    </AdminPageShell>
  );
}
