import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { inspectionApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { OwnerGymPicker, useOwnerActiveGym } from './useOwnerActiveGym';
import '@/styles/inspection.css';

export function EquipmentStatsPage() {
  const { gyms, gymId, setGymId } = useOwnerActiveGym();
  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.inspectionDashboard(gymId), 'extended'],
    queryFn: async () => (await inspectionApi.statistics(gymId)).data.data,
    enabled: !!gymId,
  });

  return (
    <PageShell title="통계" subtitle="기구 운영 현황 · TOP10 · 월별 점검률">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      {!gymId ? (
        <p className="inspection-coming-soon">헬스장을 선택하세요.</p>
      ) : isLoading ? (
        <Skeleton count={6} />
      ) : (
        <>
          <div className="inspection-stats-grid">
            <div className="inspection-stat">
              <div className="inspection-stat__value">{data?.totalMachines ?? 0}</div>
              <div className="inspection-stat__label">총 기구</div>
            </div>
            <div className="inspection-stat">
              <div className="inspection-stat__value">{data?.active ?? 0}</div>
              <div className="inspection-stat__label">정상</div>
            </div>
            <div className="inspection-stat">
              <div className="inspection-stat__value">{data?.needInspection ?? 0}</div>
              <div className="inspection-stat__label">점검예정</div>
            </div>
            <div className="inspection-stat">
              <div className="inspection-stat__value">{data?.underRepair ?? 0}</div>
              <div className="inspection-stat__label">수리중</div>
            </div>
            <div className="inspection-stat">
              <div className="inspection-stat__value">{data?.avgHealthScore ?? 0}</div>
              <div className="inspection-stat__label">평균 Health</div>
            </div>
            <div className="inspection-stat">
              <div className="inspection-stat__value">{data?.openFaults ?? 0}</div>
              <div className="inspection-stat__label">열린 고장</div>
            </div>
            <div className="inspection-stat">
              <div className="inspection-stat__value">{data?.pmCompletionRate ?? 0}%</div>
              <div className="inspection-stat__label">PM 완료율</div>
            </div>
            <div className="inspection-stat">
              <div className="inspection-stat__value">
                ₩{(data?.avgRepairCost ?? 0).toLocaleString()}
              </div>
              <div className="inspection-stat__label">평균 수리비</div>
            </div>
          </div>

          <h3 style={{ marginTop: '1.25rem', fontSize: '1rem' }}>브랜드별 고장률</h3>
          {(data?.brandFaultRates ?? []).length === 0 ? (
            <p className="inspection-coming-soon">데이터 없음</p>
          ) : (
            (data?.brandFaultRates ?? []).map((b) => (
              <div key={b.brandName} className="inspection-machine-row">
                <strong>{b.brandName}</strong>
                <div className="inspection-machine-row__meta">
                  <span>고장 {b.faultCount}</span>
                  <span>기구 {b.machineCount}</span>
                  <span>{b.faultRate}%</span>
                </div>
              </div>
            ))
          )}

          <h3 style={{ marginTop: '1.25rem', fontSize: '1rem' }}>가장 많이 고장난 기구 TOP10</h3>
          {(data?.topFaultedMachines ?? []).map((m, i) => (
            <div key={m.gymMachineId} className="inspection-machine-row">
              <strong>
                {i + 1}. {m.machineName}
              </strong>
              <div className="inspection-machine-row__meta">
                <span>{m.machineCode}</span>
                <span>{m.faultCount}회</span>
              </div>
            </div>
          ))}

          <h3 style={{ marginTop: '1.25rem', fontSize: '1rem' }}>가장 많이 사용된 기구 TOP10</h3>
          {(data?.topUsedMachines ?? []).map((m, i) => (
            <div key={m.gymMachineId} className="inspection-machine-row">
              <strong>
                {i + 1}. {m.machineName}
              </strong>
              <div className="inspection-machine-row__meta">
                <span>{m.usageCount}세션</span>
                <span>{m.totalVolume.toLocaleString()} kg</span>
              </div>
            </div>
          ))}

          <h3 style={{ marginTop: '1.25rem', fontSize: '1rem' }}>월별 점검률</h3>
          {(data?.monthlyInspectionRates ?? []).map((m) => (
            <div key={m.month} className="inspection-machine-row">
              <strong>{m.month}</strong>
              <div className="inspection-machine-row__meta">
                <span>
                  {m.inspectedMachines}/{m.totalMachines}
                </span>
                <span>{m.rate}%</span>
              </div>
            </div>
          ))}

          <h3 style={{ marginTop: '1.25rem', fontSize: '1rem' }}>부품 교체 이력</h3>
          {(data?.partsReplacementHistory ?? []).length === 0 ? (
            <p className="inspection-coming-soon">교체 이력 없음</p>
          ) : (
            (data?.partsReplacementHistory ?? []).map((p) => (
              <div key={p.id} className="inspection-machine-row">
                <strong>
                  {p.partName} · {p.machineName}
                </strong>
                <div className="inspection-machine-row__meta">
                  {p.lastReplacedAt ? (
                    <span>{new Date(p.lastReplacedAt).toLocaleDateString()}</span>
                  ) : null}
                  {p.nextReplaceDate ? <span>다음 {p.nextReplaceDate}</span> : null}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </PageShell>
  );
}
