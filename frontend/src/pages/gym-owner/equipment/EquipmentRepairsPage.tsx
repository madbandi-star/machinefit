import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { inspectionApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { OwnerGymPicker, useOwnerActiveGym } from './useOwnerActiveGym';
import '@/styles/inspection.css';

export function EquipmentRepairsPage() {
  const { gyms, gymId, setGymId } = useOwnerActiveGym();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [faultId, setFaultId] = useState('');
  const [repairCompany, setRepairCompany] = useState('');
  const [engineer, setEngineer] = useState('');
  const [laborCost, setLaborCost] = useState('0');
  const [partsCost, setPartsCost] = useState('0');
  const [repairNote, setRepairNote] = useState('');

  const { data: faults } = useQuery({
    queryKey: QUERY_KEYS.inspectionFaults(gymId),
    queryFn: async () => (await inspectionApi.listFaults(gymId)).data.data,
    enabled: !!gymId,
  });

  const { data: repairs, isLoading } = useQuery({
    queryKey: ['inspection', 'repairs', gymId],
    queryFn: async () => (await inspectionApi.listRepairs(gymId)).data.data,
    enabled: !!gymId,
  });

  const openFaults = (faults ?? []).filter((f) => f.status !== 'DONE');

  const createMutation = useMutation({
    mutationFn: () =>
      inspectionApi.createRepair({
        faultId,
        repairCompany: repairCompany || undefined,
        engineer: engineer || undefined,
        laborCost: Number(laborCost) || 0,
        partsCost: Number(partsCost) || 0,
        repairNote: repairNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', 'repairs', gymId] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inspectionFaults(gymId) });
      setShowForm(false);
      setFaultId('');
      showToast('수리 이력이 등록되었습니다', 'success');
    },
    onError: () => showToast('등록 실패', 'error'),
  });

  return (
    <PageShell title="수리관리" subtitle="고장 티켓 기반 수리 이력">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      <button
        type="button"
        className="btn btn--primary btn--block"
        style={{ marginBottom: '1rem' }}
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? '닫기' : '수리 등록'}
      </button>

      {showForm ? (
        <form
          className="card"
          style={{ marginBottom: '1rem' }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!faultId) return;
            createMutation.mutate();
          }}
        >
          <div className="form-row">
            <label htmlFor="repair-fault">고장접수</label>
            <select
              id="repair-fault"
              value={faultId}
              onChange={(e) => setFaultId(e.target.value)}
              required
            >
              <option value="">선택</option>
              {openFaults.map((f) => (
                <option key={f.id} value={f.id}>
                  {(f.machineName || f.machineCode || '') + ' — ' + f.symptom.slice(0, 40)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="repair-company">업체</label>
            <input
              id="repair-company"
              value={repairCompany}
              onChange={(e) => setRepairCompany(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="repair-engineer">엔지니어</label>
            <input
              id="repair-engineer"
              value={engineer}
              onChange={(e) => setEngineer(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="repair-labor">인건비</label>
            <input
              id="repair-labor"
              type="number"
              min={0}
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="repair-parts">부품비</label>
            <input
              id="repair-parts"
              type="number"
              min={0}
              value={partsCost}
              onChange={(e) => setPartsCost(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="repair-note">메모</label>
            <textarea
              id="repair-note"
              rows={2}
              value={repairNote}
              onChange={(e) => setRepairNote(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={createMutation.isPending}>
            저장 (고장 DONE 처리)
          </button>
        </form>
      ) : null}

      {!gymId ? (
        <p className="inspection-coming-soon">헬스장을 선택하세요.</p>
      ) : isLoading ? (
        <Skeleton count={3} />
      ) : !repairs?.length ? (
        <p className="inspection-coming-soon">수리 이력이 없습니다.</p>
      ) : (
        repairs.map((r) => (
          <div key={r.id} className="inspection-machine-row">
            <strong>
              {r.machineName || '기구'} · ₩{r.totalCost.toLocaleString()}
            </strong>
            <div className="inspection-machine-row__meta">
              {r.repairCompany ? <span>{r.repairCompany}</span> : null}
              {r.engineer ? <span>{r.engineer}</span> : null}
              <span>인건 ₩{r.laborCost.toLocaleString()}</span>
              <span>부품 ₩{r.partsCost.toLocaleString()}</span>
              {r.completedAt ? <span>{new Date(r.completedAt).toLocaleDateString()}</span> : null}
            </div>
            {r.symptom ? <p style={{ fontSize: '0.85rem' }}>{r.symptom}</p> : null}
          </div>
        ))
      )}
    </PageShell>
  );
}
