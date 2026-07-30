import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { inspectionApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { OwnerGymPicker, useOwnerActiveGym } from './useOwnerActiveGym';
import '@/styles/inspection.css';

export function EquipmentInventoryPage() {
  const { gyms, gymId, setGymId, isLoading: gymsLoading } = useOwnerActiveGym();
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.inspectionGymMachines(gymId, undefined, q),
    queryFn: async () => {
      const res = await inspectionApi.listGymMachines({ gymId, q: q || undefined });
      return res.data.data;
    },
    enabled: !!gymId,
  });

  if (gymsLoading) {
    return (
      <PageShell title="보유기구">
        <Skeleton count={4} />
      </PageShell>
    );
  }

  return (
    <PageShell title="보유기구" subtitle="헬스장에 등록된 기구 자산">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      <div className="form-row" style={{ marginBottom: '1rem' }}>
        <label htmlFor="inv-q">검색</label>
        <input
          id="inv-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="닉네임 · 코드 · 위치"
        />
      </div>

      {!gymId ? (
        <p className="inspection-coming-soon">먼저 헬스장을 등록해 주세요.</p>
      ) : isLoading ? (
        <Skeleton count={4} />
      ) : !data?.length ? (
        <p className="inspection-coming-soon">
          등록된 보유기구가 없습니다. Owner 대시보드에서 기구를 추가하세요.
        </p>
      ) : (
        data.map((m) => (
          <div key={m.id} className="inspection-machine-row">
            <strong>
              {m.nickname || m.machineName || m.machineCode}
              {m.brandName ? ` · ${m.brandName}` : ''}
            </strong>
            <div className="inspection-machine-row__meta">
              <span>{m.machineCode}</span>
              {m.location ? <span>{m.location}</span> : null}
              <span>{m.opsStatus}</span>
              <span className={`health-band health-band--${m.healthBand}`}>
                Health {m.healthScore}
              </span>
            </div>
            <div className="inspection-machine-row__actions">
              <Link
                className="btn btn--primary"
                to={`${ROUTES.OWNER_EQUIPMENT_INSPECTION_NEW}?gymMachineId=${m.id}`}
              >
                점검 시작
              </Link>
            </div>
          </div>
        ))
      )}
    </PageShell>
  );
}
