import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FaultSeverity } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { inspectionApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { OwnerGymPicker, useOwnerActiveGym } from './useOwnerActiveGym';
import '@/styles/inspection.css';

export function EquipmentFaultsPage() {
  const { gyms, gymId, setGymId } = useOwnerActiveGym();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [gymMachineId, setGymMachineId] = useState('');
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState<FaultSeverity>('NORMAL');

  const { data: machines } = useQuery({
    queryKey: QUERY_KEYS.inspectionGymMachines(gymId),
    queryFn: async () => {
      const res = await inspectionApi.listGymMachines({ gymId });
      return res.data.data;
    },
    enabled: !!gymId,
  });

  const { data: faults, isLoading } = useQuery({
    queryKey: QUERY_KEYS.inspectionFaults(gymId),
    queryFn: async () => {
      const res = await inspectionApi.listFaults(gymId);
      return res.data.data;
    },
    enabled: !!gymId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      inspectionApi.createFault({ gymMachineId, symptom, severity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inspectionFaults(gymId) });
      queryClient.invalidateQueries({ queryKey: ['inspection'] });
      setShowForm(false);
      setSymptom('');
      setGymMachineId('');
      showToast('고장접수가 등록되었습니다', 'success');
    },
    onError: () => showToast('등록에 실패했습니다', 'error'),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      inspectionApi.updateFault(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inspectionFaults(gymId) });
      showToast('상태가 변경되었습니다', 'success');
    },
    onError: () => showToast('변경에 실패했습니다', 'error'),
  });

  return (
    <PageShell title="고장접수(CM)" subtitle="점검 FAIL · 직접 등록 · 회원 신고 누적">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      <button
        type="button"
        className="btn btn--primary btn--block"
        style={{ marginBottom: '1rem' }}
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? '닫기' : '직접 등록'}
      </button>

      {showForm ? (
        <form
          className="card"
          style={{ marginBottom: '1rem' }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!gymMachineId || !symptom.trim()) return;
            createMutation.mutate();
          }}
        >
          <div className="form-row">
            <label htmlFor="fault-machine">기구</label>
            <select
              id="fault-machine"
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
            <label htmlFor="fault-severity">심각도</label>
            <select
              id="fault-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as FaultSeverity)}
            >
              {(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as FaultSeverity[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="fault-symptom">증상</label>
            <textarea
              id="fault-symptom"
              rows={3}
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={createMutation.isPending}>
            등록
          </button>
        </form>
      ) : null}

      {!gymId ? (
        <p className="inspection-coming-soon">헬스장을 선택하세요.</p>
      ) : isLoading ? (
        <Skeleton count={3} />
      ) : !faults?.length ? (
        <p className="inspection-coming-soon">열린 고장접수가 없습니다.</p>
      ) : (
        faults.map((f) => (
          <div key={f.id} className="inspection-machine-row">
            <strong>
              {f.machineName || f.machineCode} · {f.severity} · {f.status}
            </strong>
            <div className="inspection-machine-row__meta">
              <span>{f.symptom}</span>
              <span>{new Date(f.createdAt).toLocaleString()}</span>
            </div>
            {f.status !== 'DONE' ? (
              <div className="inspection-machine-row__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => patchMutation.mutate({ id: f.id, status: 'CHECKING' })}
                >
                  확인중
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => patchMutation.mutate({ id: f.id, status: 'REPAIRING' })}
                >
                  수리중
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => patchMutation.mutate({ id: f.id, status: 'DONE' })}
                >
                  완료
                </button>
              </div>
            ) : null}
          </div>
        ))
      )}
    </PageShell>
  );
}
