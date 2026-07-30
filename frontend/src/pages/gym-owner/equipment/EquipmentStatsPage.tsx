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
    queryKey: QUERY_KEYS.inspectionDashboard(gymId),
    queryFn: async () => {
      const res = await inspectionApi.dashboard(gymId);
      return res.data.data;
    },
    enabled: !!gymId,
  });

  return (
    <PageShell title="통계" subtitle="기구 운영 현황 요약">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      {!gymId ? (
        <p className="inspection-coming-soon">헬스장을 선택하세요.</p>
      ) : isLoading ? (
        <Skeleton count={4} />
      ) : (
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
            <div className="inspection-stat__value">{data?.outOfService ?? 0}</div>
            <div className="inspection-stat__label">사용중지</div>
          </div>
          <div className="inspection-stat">
            <div className="inspection-stat__value">{data?.avgHealthScore ?? 0}</div>
            <div className="inspection-stat__label">평균 Health</div>
          </div>
          <div className="inspection-stat">
            <div className="inspection-stat__value">{data?.inspectionsThisMonth ?? 0}</div>
            <div className="inspection-stat__label">이번달 점검</div>
          </div>
          <div className="inspection-stat">
            <div className="inspection-stat__value">{data?.openFaults ?? 0}</div>
            <div className="inspection-stat__label">열린 고장</div>
          </div>
          <div className="inspection-stat">
            <div className="inspection-stat__value">{data?.overdueInspections ?? 0}</div>
            <div className="inspection-stat__label">점검 미실시</div>
          </div>
        </div>
      )}
      <p className="inspection-coming-soon">
        브랜드별 고장률 · TOP10 · 월별 점검률 · 부품 교체 이력은 집계 API 확장으로 이어서 제공합니다.
      </p>
    </PageShell>
  );
}
