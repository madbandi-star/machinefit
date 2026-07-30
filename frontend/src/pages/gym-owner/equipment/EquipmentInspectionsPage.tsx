import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { inspectionApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { OwnerGymPicker, useOwnerActiveGym } from './useOwnerActiveGym';
import '@/styles/inspection.css';

export function EquipmentInspectionsPage() {
  const { gyms, gymId, setGymId } = useOwnerActiveGym();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.inspectionList(gymId),
    queryFn: async () => {
      const res = await inspectionApi.listInspections({ gymId, limit: 50 });
      return res.data.data;
    },
    enabled: !!gymId,
  });

  return (
    <PageShell title="점검일지" subtitle="최근 점검 기록">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      <Link
        className="btn btn--primary btn--block"
        to={ROUTES.OWNER_EQUIPMENT_INSPECTION_NEW}
        style={{ marginBottom: '1rem' }}
      >
        새 점검
      </Link>

      {!gymId ? (
        <p className="inspection-coming-soon">헬스장을 선택하세요.</p>
      ) : isLoading ? (
        <Skeleton count={4} />
      ) : !data?.items.length ? (
        <p className="inspection-coming-soon">아직 점검 기록이 없습니다.</p>
      ) : (
        data.items.map((row) => (
          <div key={row.id} className="inspection-machine-row">
            <strong>
              {row.nickname || row.machineName || row.machineCode} · {row.inspectionResult}
            </strong>
            <div className="inspection-machine-row__meta">
              <span>{new Date(row.inspectionDate).toLocaleString()}</span>
              <span className={`health-band health-band--${row.healthScore >= 95 ? 'GREEN' : row.healthScore >= 80 ? 'YELLOW' : row.healthScore >= 60 ? 'ORANGE' : 'RED'}`}>
                Health {row.healthScore}
              </span>
              {row.inspectorName ? <span>{row.inspectorName}</span> : null}
              {row.nextInspectionDate ? (
                <span>다음 {new Date(row.nextInspectionDate).toLocaleDateString()}</span>
              ) : null}
            </div>
          </div>
        ))
      )}
    </PageShell>
  );
}
