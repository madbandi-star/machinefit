import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PmCycleType } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { inspectionApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { OwnerGymPicker, useOwnerActiveGym } from './useOwnerActiveGym';
import '@/styles/inspection.css';

const CYCLES: PmCycleType[] = [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTER',
  'HALF_YEAR',
  'YEARLY',
  'USAGE_COUNT',
  'USAGE_VOLUME',
];

export function EquipmentPmPage() {
  const { gyms, gymId, setGymId } = useOwnerActiveGym();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [gymMachineId, setGymMachineId] = useState('');
  const [cycleType, setCycleType] = useState<PmCycleType>('MONTHLY');
  const [usageLimitCount, setUsageLimitCount] = useState('1000');
  const [usageLimitVolume, setUsageLimitVolume] = useState('100');

  const { data: machines } = useQuery({
    queryKey: QUERY_KEYS.inspectionGymMachines(gymId),
    queryFn: async () => (await inspectionApi.listGymMachines({ gymId })).data.data,
    enabled: !!gymId,
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ['inspection', 'pm', gymId],
    queryFn: async () => (await inspectionApi.listPm(gymId)).data.data,
    enabled: !!gymId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inspection', 'pm', gymId] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      inspectionApi.createPm({
        gymMachineId,
        cycleType,
        usageLimitCount:
          cycleType === 'USAGE_COUNT' ? Number(usageLimitCount) || undefined : undefined,
        usageLimitVolume:
          cycleType === 'USAGE_VOLUME' ? Number(usageLimitVolume) || undefined : undefined,
      }),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setGymMachineId('');
      showToast('PM 스케줄이 등록되었습니다', 'success');
    },
    onError: () => showToast('등록 실패', 'error'),
  });

  const refreshMutation = useMutation({
    mutationFn: () => inspectionApi.refreshPmDue(gymId),
    onSuccess: (res) => {
      invalidate();
      showToast(`도래 PM ${res.data.data.length}건 갱신`, 'success');
    },
    onError: () => showToast('갱신 실패', 'error'),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => inspectionApi.updatePm(id, { markCompleted: true }),
    onSuccess: () => {
      invalidate();
      showToast('PM 완료 처리되었습니다', 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inspectionApi.deletePm(id),
    onSuccess: () => {
      invalidate();
      showToast('삭제되었습니다', 'success');
    },
  });

  return (
    <PageShell title="예방정비(PM)" subtitle="주기 · 사용횟수 · 볼륨 기준">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      <div className="inspection-machine-row__actions" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn btn--primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '닫기' : '스케줄 추가'}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={!gymId || refreshMutation.isPending}
          onClick={() => refreshMutation.mutate()}
        >
          도래 갱신 · Push
        </button>
      </div>

      {showForm ? (
        <form
          className="card"
          style={{ marginBottom: '1rem' }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!gymMachineId) return;
            createMutation.mutate();
          }}
        >
          <div className="form-row">
            <label htmlFor="pm-machine">기구</label>
            <select
              id="pm-machine"
              value={gymMachineId}
              onChange={(e) => setGymMachineId(e.target.value)}
              required
            >
              <option value="">선택</option>
              {(machines ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nickname || m.machineName || m.machineCode}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="pm-cycle">주기</label>
            <select
              id="pm-cycle"
              value={cycleType}
              onChange={(e) => setCycleType(e.target.value as PmCycleType)}
            >
              {CYCLES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {cycleType === 'USAGE_COUNT' ? (
            <div className="form-row">
              <label htmlFor="pm-count">사용횟수 한도</label>
              <input
                id="pm-count"
                value={usageLimitCount}
                onChange={(e) => setUsageLimitCount(e.target.value)}
              />
            </div>
          ) : null}
          {cycleType === 'USAGE_VOLUME' ? (
            <div className="form-row">
              <label htmlFor="pm-vol">볼륨 한도 (kg)</label>
              <input
                id="pm-vol"
                value={usageLimitVolume}
                onChange={(e) => setUsageLimitVolume(e.target.value)}
              />
            </div>
          ) : null}
          <button type="submit" className="btn btn--primary" disabled={createMutation.isPending}>
            등록
          </button>
        </form>
      ) : null}

      {!gymId ? (
        <p className="inspection-coming-soon">헬스장을 선택하세요.</p>
      ) : isLoading ? (
        <Skeleton count={3} />
      ) : !rows?.length ? (
        <p className="inspection-coming-soon">등록된 PM 스케줄이 없습니다.</p>
      ) : (
        rows.map((row) => (
          <div key={row.id} className="inspection-machine-row">
            <strong>
              {row.nickname || row.machineName || row.machineCode} · {row.cycleType} · {row.status}
            </strong>
            <div className="inspection-machine-row__meta">
              {row.nextDueAt ? <span>다음 {new Date(row.nextDueAt).toLocaleString()}</span> : null}
              {row.usageLimitCount ? <span>{row.usageLimitCount}회</span> : null}
              {row.usageLimitVolume ? <span>{row.usageLimitVolume}kg</span> : null}
            </div>
            <div className="inspection-machine-row__actions">
              {row.status !== 'DONE' ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => completeMutation.mutate(row.id)}
                >
                  완료
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => deleteMutation.mutate(row.id)}
              >
                삭제
              </button>
            </div>
          </div>
        ))
      )}
    </PageShell>
  );
}
