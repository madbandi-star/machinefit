import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PointPolicy, PointPolicyUpdateInput } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminPointsApi } from '@/api/points.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-usage.css';

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminPointsPoliciesPage() {
  const { t } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PointPolicyUpdateInput | null>(null);

  const policiesQuery = useQuery({
    queryKey: ['admin-points-policies'],
    queryFn: async () => (await adminPointsApi.listPolicies()).data.data,
  });

  const selected = policiesQuery.data?.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      actionName: selected.actionName,
      points: selected.points,
      dailyLimit: selected.dailyLimit,
      userLimit: selected.userLimit,
      cooldownSeconds: selected.cooldownSeconds,
      enabled: selected.enabled,
      startAt: selected.startAt,
      endAt: selected.endAt,
      description: selected.description,
    });
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: string; body: PointPolicyUpdateInput }) =>
      (await adminPointsApi.updatePolicy(payload.id, payload.body)).data.data,
    onSuccess: () => {
      showToast(t('saved'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-points-policies'] });
    },
    onError: () => showToast(t('error'), 'error'),
  });

  if (policiesQuery.isLoading) {
    return (
      <AdminPageShell title={t('points.policiesTitle')} subtitle={t('points.policiesSubtitle')}>
        <Skeleton count={5} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={t('points.policiesTitle')} subtitle={t('points.policiesSubtitle')}>
      <div className="admin-usage admin-usage--split">
        <AdminPanel title={t('points.policyList')}>
          <ul className="admin-usage__policy-list">
            {(policiesQuery.data ?? []).map((p: PointPolicy) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={
                    p.id === selectedId
                      ? 'admin-usage__policy-btn admin-usage__policy-btn--active'
                      : 'admin-usage__policy-btn'
                  }
                  onClick={() => setSelectedId(p.id)}
                >
                  <strong>{p.actionName}</strong>
                  <span>
                    {p.points}P · {p.enabled ? t('points.enabled') : t('points.disabled')}
                  </span>
                  <code>{p.actionCode}</code>
                </button>
              </li>
            ))}
          </ul>
        </AdminPanel>

        <AdminPanel title={t('points.policyEdit')}>
          {!selected || !draft ? (
            <p className="admin-usage__banner">{t('points.selectPolicy')}</p>
          ) : (
            <div className="form-stack">
              <label className="admin-usage__field">
                <span>{t('points.actionName')}</span>
                <input
                  className="input"
                  value={draft.actionName ?? ''}
                  onChange={(e) => setDraft({ ...draft, actionName: e.target.value })}
                />
              </label>
              <label className="admin-usage__field">
                <span>{t('points.points')}</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={draft.points ?? 0}
                  onChange={(e) =>
                    setDraft({ ...draft, points: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </label>
              <label className="admin-usage__field">
                <span>{t('points.dailyLimit')}</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  placeholder="∞"
                  value={draft.dailyLimit ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      dailyLimit: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </label>
              <label className="admin-usage__field">
                <span>{t('points.userLimit')}</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  placeholder="∞"
                  value={draft.userLimit ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      userLimit: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </label>
              <label className="admin-usage__field">
                <span>{t('points.cooldown')}</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={draft.cooldownSeconds ?? 0}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      cooldownSeconds: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </label>
              <label className="admin-usage__field">
                <span>{t('points.startAt')}</span>
                <input
                  className="input"
                  type="datetime-local"
                  value={toLocalInput(draft.startAt)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      startAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
              </label>
              <label className="admin-usage__field">
                <span>{t('points.endAt')}</span>
                <input
                  className="input"
                  type="datetime-local"
                  value={toLocalInput(draft.endAt)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      endAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
              </label>
              <label className="admin-usage__field">
                <span>{t('points.description')}</span>
                <textarea
                  className="input"
                  rows={3}
                  value={draft.description ?? ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </label>
              <label className="consent-row">
                <input
                  type="checkbox"
                  checked={Boolean(draft.enabled)}
                  onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                />
                <span>{t('points.enabled')}</span>
              </label>
              <button
                type="button"
                className="btn btn--primary"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate({ id: selected.id, body: draft })}
              >
                {t('save')}
              </button>
            </div>
          )}
        </AdminPanel>
      </div>
    </AdminPageShell>
  );
}
