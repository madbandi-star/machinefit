import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ROUTES } from '@/constants/routes';
import { OwnerGymPicker, useOwnerActiveGym } from './useOwnerActiveGym';
import '@/styles/inspection.css';

const HUB_LINKS = [
  {
    to: ROUTES.OWNER_EQUIPMENT_INVENTORY,
    title: '보유기구',
    desc: '헬스장 자산·상태·Health Score',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_INSPECTIONS,
    title: '점검일지',
    desc: '체크리스트 점검 · QR 30초 UX',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_PM,
    title: '예방정비(PM)',
    desc: '주기·사용량 기반 스케줄',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_FAULTS,
    title: '고장접수(CM)',
    desc: '티켓 · 심각도 · 진행상태',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_REPAIRS,
    title: '수리관리',
    desc: '수리비 · 이력',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_PARTS,
    title: '부품관리',
    desc: '교체주기 · 재고',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_STATS,
    title: '통계',
    desc: '점검률 · 고장 TOP · Health',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_SETTINGS,
    title: '점검설정',
    desc: '템플릿 · 주기 기본값',
  },
] as const;

export function EquipmentHubPage() {
  const { gyms, gymId, setGymId } = useOwnerActiveGym();

  return (
    <PageShell title="기구관리" subtitle="Preventive Maintenance · 보유기구 운영">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      <div className="inspection-hub__grid">
        {HUB_LINKS.map((item) => (
          <Link key={item.to} to={item.to} className="inspection-hub__card">
            <strong>{item.title}</strong>
            <span>{item.desc}</span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
