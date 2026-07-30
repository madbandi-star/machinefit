import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { inspectionApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/inspection.css';

export function EquipmentSettingsPage() {
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [itemKey, setItemKey] = useState('');
  const [itemNameKo, setItemNameKo] = useState('');
  const [itemNameEn, setItemNameEn] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: QUERY_KEYS.inspectionTemplates(),
    queryFn: async () => (await inspectionApi.listTemplates()).data.data,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      inspectionApi.createTemplate({
        itemKey: itemKey.trim().toLowerCase().replace(/\s+/g, '_'),
        itemName: {
          ko: itemNameKo.trim() || itemKey,
          en: itemNameEn.trim() || itemKey,
        },
        displayOrder: ((templates?.length ?? 0) + 1) * 10,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inspectionTemplates() });
      setItemKey('');
      setItemNameKo('');
      setItemNameEn('');
      showToast('점검 항목이 추가되었습니다', 'success');
    },
    onError: () => showToast('추가 실패', 'error'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      inspectionApi.updateTemplate(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inspectionTemplates() });
    },
  });

  return (
    <PageShell title="점검설정" subtitle="템플릿 · 기본 주기">
      <form
        className="card"
        style={{ marginBottom: '1rem' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!itemKey.trim()) return;
          createMutation.mutate();
        }}
      >
        <div className="form-row">
          <label htmlFor="tpl-key">항목 키</label>
          <input
            id="tpl-key"
            value={itemKey}
            onChange={(e) => setItemKey(e.target.value)}
            placeholder="예: belt"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="tpl-ko">한글명</label>
          <input id="tpl-ko" value={itemNameKo} onChange={(e) => setItemNameKo(e.target.value)} />
        </div>
        <div className="form-row">
          <label htmlFor="tpl-en">영문명</label>
          <input id="tpl-en" value={itemNameEn} onChange={(e) => setItemNameEn(e.target.value)} />
        </div>
        <button type="submit" className="btn btn--primary" disabled={createMutation.isPending}>
          항목 추가
        </button>
      </form>

      {isLoading ? (
        <Skeleton count={4} />
      ) : (
        (templates ?? []).map((t) => (
          <div key={t.id} className="inspection-machine-row">
            <strong>
              {t.itemName.ko || t.itemName.en || t.itemKey}
              {!t.active ? ' (비활성)' : ''}
            </strong>
            <div className="inspection-machine-row__meta">
              <span>{t.itemKey}</span>
              <span>order {t.displayOrder}</span>
              <span>{t.required ? '필수' : '선택'}</span>
            </div>
            <div className="inspection-machine-row__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => toggleMutation.mutate({ id: t.id, active: !t.active })}
              >
                {t.active ? '비활성화' : '활성화'}
              </button>
            </div>
          </div>
        ))
      )}
    </PageShell>
  );
}
