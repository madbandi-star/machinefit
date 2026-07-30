import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { inspectionApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { OwnerGymPicker, useOwnerActiveGym } from './useOwnerActiveGym';
import '@/styles/inspection.css';

export function EquipmentPartsPage() {
  const { gyms, gymId, setGymId } = useOwnerActiveGym();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [gymMachineId, setGymMachineId] = useState('');
  const [partName, setPartName] = useState('');
  const [cycleDays, setCycleDays] = useState('180');
  const [stock, setStock] = useState('0');

  const { data: machines } = useQuery({
    queryKey: QUERY_KEYS.inspectionGymMachines(gymId),
    queryFn: async () => (await inspectionApi.listGymMachines({ gymId })).data.data,
    enabled: !!gymId,
  });

  const { data: parts, isLoading } = useQuery({
    queryKey: ['inspection', 'parts', gymId],
    queryFn: async () => (await inspectionApi.listParts(gymId)).data.data,
    enabled: !!gymId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inspection', 'parts', gymId] });

  const createMutation = useMutation({
    mutationFn: () =>
      inspectionApi.createPart({
        gymMachineId,
        partName,
        replacementCycleDays: Number(cycleDays) || undefined,
        stockQuantity: Number(stock) || 0,
      }),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setPartName('');
      setGymMachineId('');
      showToast('부품이 등록되었습니다', 'success');
    },
    onError: () => showToast('등록 실패', 'error'),
  });

  const replaceMutation = useMutation({
    mutationFn: (id: string) => {
      const part = parts?.find((p) => p.id === id);
      const days = part?.replacementCycleDays ?? 180;
      const next = new Date();
      next.setDate(next.getDate() + days);
      return inspectionApi.updatePart(id, {
        lastReplacedAt: new Date().toISOString(),
        nextReplaceDate: next.toISOString().slice(0, 10),
        stockQuantity: Math.max(0, (part?.stockQuantity ?? 1) - 1),
      });
    },
    onSuccess: () => {
      invalidate();
      showToast('교체 완료로 기록되었습니다', 'success');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inspectionApi.deletePart(id),
    onSuccess: () => {
      invalidate();
      showToast('삭제되었습니다', 'success');
    },
  });

  return (
    <PageShell title="부품관리" subtitle="교체주기 · 재고">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      <button
        type="button"
        className="btn btn--primary btn--block"
        style={{ marginBottom: '1rem' }}
        onClick={() => setShowForm((v) => !v)}
      >
        {showForm ? '닫기' : '부품 추가'}
      </button>

      {showForm ? (
        <form
          className="card"
          style={{ marginBottom: '1rem' }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!gymMachineId || !partName.trim()) return;
            createMutation.mutate();
          }}
        >
          <div className="form-row">
            <label htmlFor="part-machine">기구</label>
            <select
              id="part-machine"
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
            <label htmlFor="part-name">부품명</label>
            <input
              id="part-name"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="part-days">교체주기(일)</label>
            <input
              id="part-days"
              type="number"
              min={1}
              value={cycleDays}
              onChange={(e) => setCycleDays(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="part-stock">재고</label>
            <input
              id="part-stock"
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
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
      ) : !parts?.length ? (
        <p className="inspection-coming-soon">등록된 부품이 없습니다.</p>
      ) : (
        parts.map((p) => (
          <div key={p.id} className="inspection-machine-row">
            <strong>
              {p.partName} · {p.machineName || p.machineCode}
            </strong>
            <div className="inspection-machine-row__meta">
              <span>재고 {p.stockQuantity}</span>
              {p.nextReplaceDate ? <span>다음 교체 {p.nextReplaceDate}</span> : null}
              {p.lastReplacedAt ? (
                <span>최근 {new Date(p.lastReplacedAt).toLocaleDateString()}</span>
              ) : null}
            </div>
            <div className="inspection-machine-row__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => replaceMutation.mutate(p.id)}
              >
                교체 기록
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => deleteMutation.mutate(p.id)}
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
