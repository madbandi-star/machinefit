import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InspectionItemResult, InspectionTemplateItem } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { inspectionApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { OwnerGymPicker, useOwnerActiveGym } from './useOwnerActiveGym';
import '@/styles/inspection.css';

type ItemState = {
  templateItemId: string;
  itemKey: string;
  name: string;
  result: InspectionItemResult | null;
  note: string;
};

function templateLabel(item: InspectionTemplateItem): string {
  return item.itemName.ko || item.itemName.en || item.itemKey;
}

export function EquipmentInspectionCreatePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const { gyms, gymId, setGymId } = useOwnerActiveGym();
  const initialMachineId = params.get('gymMachineId') ?? '';

  const [gymMachineId, setGymMachineId] = useState(initialMachineId);
  const [items, setItems] = useState<ItemState[]>([]);
  const [note, setNote] = useState('');
  const [startedAt] = useState(() => Date.now());

  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: QUERY_KEYS.inspectionGymMachines(gymId),
    queryFn: async () => {
      const res = await inspectionApi.listGymMachines({ gymId });
      return res.data.data;
    },
    enabled: !!gymId,
  });

  const selected = useMemo(
    () => machines?.find((m) => m.id === gymMachineId) ?? null,
    [machines, gymMachineId]
  );

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: QUERY_KEYS.inspectionTemplates(),
    queryFn: async () => {
      const res = await inspectionApi.listTemplates();
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!templates?.length) return;
    setItems((prev) => {
      if (prev.length) return prev;
      return templates.map((t) => ({
        templateItemId: t.id,
        itemKey: t.itemKey,
        name: templateLabel(t),
        result: null,
        note: '',
      }));
    });
  }, [templates]);

  useEffect(() => {
    if (initialMachineId) setGymMachineId(initialMachineId);
  }, [initialMachineId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!gymMachineId) throw new Error('machine');
      const incomplete = items.filter((i) => !i.result);
      if (incomplete.length) throw new Error('incomplete');
      return inspectionApi.createInspection({
        gymMachineId,
        durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        note: note || undefined,
        items: items.map((i) => ({
          templateItemId: i.templateItemId,
          itemKey: i.itemKey,
          result: i.result!,
          note: i.result === 'FAIL' ? i.note || undefined : undefined,
        })),
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inspection'] });
      const result = res.data.data.inspectionResult;
      showToast(
        result === 'FAIL' ? '점검 FAIL — 고장접수가 생성되었습니다' : '점검이 저장되었습니다',
        result === 'FAIL' ? 'error' : 'success'
      );
      navigate(ROUTES.OWNER_EQUIPMENT_INSPECTIONS);
    },
    onError: (err: Error) => {
      if (err.message === 'incomplete') {
        showToast('모든 점검 항목을 선택해 주세요', 'error');
        return;
      }
      showToast('점검 저장에 실패했습니다', 'error');
    },
  });

  const setResult = (id: string, result: InspectionItemResult) => {
    setItems((prev) => prev.map((i) => (i.templateItemId === id ? { ...i, result } : i)));
  };

  const setItemNote = (id: string, value: string) => {
    setItems((prev) => prev.map((i) => (i.templateItemId === id ? { ...i, note: value } : i)));
  };

  const inspectedToday =
    selected?.lastInspectionAt &&
    new Date(selected.lastInspectionAt).toDateString() === new Date().toDateString();

  return (
    <PageShell title="점검 시작" subtitle="체크리스트 · Health Score 자동 계산">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />

      {machinesLoading ? (
        <Skeleton count={2} />
      ) : (
        <div className="form-row" style={{ marginBottom: '1rem' }}>
          <label htmlFor="insp-machine">보유기구</label>
          <select
            id="insp-machine"
            value={gymMachineId}
            onChange={(e) => setGymMachineId(e.target.value)}
          >
            <option value="">선택</option>
            {(machines ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {(m.nickname || m.machineName || m.machineCode) +
                  (m.location ? ` · ${m.location}` : '')}
              </option>
            ))}
          </select>
        </div>
      )}

      {selected ? (
        <div className="inspection-stat" style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <div>
            <strong>{selected.brandName ?? '—'}</strong> · {selected.machineName}
          </div>
          <div className="inspection-machine-row__meta" style={{ marginTop: '0.35rem' }}>
            <span>{selected.location || '위치 미지정'}</span>
            <span className={`health-band health-band--${selected.healthBand}`}>
              Health {selected.healthScore}
            </span>
            <span>
              최근{' '}
              {selected.lastInspectionAt
                ? new Date(selected.lastInspectionAt).toLocaleDateString()
                : '없음'}
            </span>
            <span>
              다음{' '}
              {selected.nextInspectionAt
                ? new Date(selected.nextInspectionAt).toLocaleDateString()
                : '—'}
            </span>
          </div>
          {inspectedToday ? (
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              오늘 이미 점검 기록이 있습니다. 재점검을 진행할 수 있습니다.
            </p>
          ) : null}
        </div>
      ) : null}

      {templatesLoading ? (
        <Skeleton count={5} />
      ) : (
        items.map((item) => (
          <div key={item.templateItemId} className="inspection-check-item">
            <div className="inspection-check-item__name">{item.name}</div>
            <div className="inspection-check-item__results">
              {(['PASS', 'FAIL', 'NA'] as InspectionItemResult[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`btn btn--secondary${item.result === r ? ' is-selected' : ''}`}
                  onClick={() => setResult(item.templateItemId, r)}
                >
                  {r}
                </button>
              ))}
            </div>
            {item.result === 'FAIL' ? (
              <div className="inspection-check-item__fail-extra">
                <label htmlFor={`note-${item.templateItemId}`}>메모 / 이상 내용</label>
                <textarea
                  id={`note-${item.templateItemId}`}
                  rows={2}
                  value={item.note}
                  onChange={(e) => setItemNote(item.templateItemId, e.target.value)}
                  placeholder="사진·영상은 추후 업로드 연동"
                />
              </div>
            ) : null}
          </div>
        ))
      )}

      <div className="form-row">
        <label htmlFor="insp-note">전체 메모</label>
        <textarea id="insp-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        disabled={saveMutation.isPending || !gymMachineId}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending ? '저장 중…' : '점검 저장'}
      </button>
    </PageShell>
  );
}
