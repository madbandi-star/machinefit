import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Role, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { inspectionApi } from '@/api';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/inspection.css';

export function EquipmentQrLandingPage() {
  const { gymMachineId = '' } = useParams();
  const user = useAuthStore((s) => s.user);
  const isOwner = hasMinRole(user?.roleCode, Role.OWNER);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['inspection', 'qr', gymMachineId],
    queryFn: async () => (await inspectionApi.getGymMachinePublic(gymMachineId)).data.data,
    enabled: !!gymMachineId && !!user,
  });

  if (!user) {
    return (
      <PageShell title="기구 QR">
        <p className="inspection-coming-soon">로그인 후 점검·신고를 이용할 수 있습니다.</p>
        <Link className="btn btn--primary btn--block" to={ROUTES.LOGIN}>
          로그인
        </Link>
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell title="기구 QR">
        <Skeleton count={3} />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell title="기구 QR">
        <p className="inspection-coming-soon">보유기구를 찾을 수 없습니다.</p>
        <Link className="btn btn--secondary btn--block" to={ROUTES.SCAN}>
          다시 스캔
        </Link>
      </PageShell>
    );
  }

  const inspectedToday =
    data.lastInspectionAt &&
    new Date(data.lastInspectionAt).toDateString() === new Date().toDateString();

  return (
    <PageShell title={data.nickname || data.machineName || data.machineCode || '기구'}>
      <div className="inspection-stat" style={{ textAlign: 'left', marginBottom: '1rem' }}>
        <div>
          <strong>{data.brandName ?? '—'}</strong> · {data.machineName}
        </div>
        <div className="inspection-machine-row__meta" style={{ marginTop: '0.35rem' }}>
          <span>{data.location || '위치 미지정'}</span>
          <span className={`health-band health-band--${data.healthBand}`}>
            Health {data.healthScore}
          </span>
          <span>{data.opsStatus}</span>
        </div>
        <div className="inspection-machine-row__meta" style={{ marginTop: '0.35rem' }}>
          <span>
            최근{' '}
            {data.lastInspectionAt
              ? new Date(data.lastInspectionAt).toLocaleDateString()
              : '없음'}
          </span>
          <span>
            다음{' '}
            {data.nextInspectionAt
              ? new Date(data.nextInspectionAt).toLocaleDateString()
              : '—'}
          </span>
        </div>
        {inspectedToday ? (
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            오늘 이미 점검되었습니다.
          </p>
        ) : (
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            오늘 점검이 아직 없습니다.
          </p>
        )}
      </div>

      {isOwner ? (
        <Link
          className="btn btn--primary btn--block"
          style={{ marginBottom: '0.75rem' }}
          to={`${ROUTES.OWNER_EQUIPMENT_INSPECTION_NEW}?gymMachineId=${data.id}`}
        >
          점검 시작
        </Link>
      ) : null}

      <Link
        className="btn btn--secondary btn--block"
        to={`${ROUTES.MEMBER_MACHINE_REPORT}?gymMachineId=${data.id}`}
      >
        기구 이상 신고
      </Link>

      <Link
        className="btn btn--block"
        style={{ marginTop: '0.75rem' }}
        to={ROUTES.MACHINE_DETAIL.replace(':machineCode', data.machineCode || '')}
      >
        운동 기록으로 이동
      </Link>
    </PageShell>
  );
}
