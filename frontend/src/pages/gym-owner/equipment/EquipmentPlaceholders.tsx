import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { OwnerGymPicker, useOwnerActiveGym } from './useOwnerActiveGym';
import '@/styles/inspection.css';

export function EquipmentPmPage() {
  const { gyms, gymId, setGymId } = useOwnerActiveGym();
  return (
    <PageShell title="예방정비(PM)" subtitle="주기 · 사용횟수 · 볼륨 기준">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      <p className="inspection-coming-soon">
        PM 스케줄(DAILY~YEARLY / 사용횟수·볼륨)과 자동 생성·Push는 `machine_pm_schedules` 테이블과
        연동해 다음 단계에서 활성화합니다. 현재 점검 저장 시 다음 점검일이 자동 계산됩니다.
      </p>
    </PageShell>
  );
}

export function EquipmentRepairsPage() {
  const { gyms, gymId, setGymId } = useOwnerActiveGym();
  return (
    <PageShell title="수리관리" subtitle="고장 티켓 기반 수리 이력">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      <p className="inspection-coming-soon">
        수리비(인건비·부품비)·업체·완료일을 `machine_repairs`에 기록하는 UI를 이어서 제공합니다.
        고장접수는 CM 메뉴에서 상태를 변경할 수 있습니다.
      </p>
    </PageShell>
  );
}

export function EquipmentPartsPage() {
  const { gyms, gymId, setGymId } = useOwnerActiveGym();
  return (
    <PageShell title="부품관리" subtitle="교체주기 · 재고">
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      <p className="inspection-coming-soon">
        `machine_parts` 기반 부품 재고·교체 예정일 관리 UI를 이어서 제공합니다.
      </p>
    </PageShell>
  );
}

export function EquipmentSettingsPage() {
  return (
    <PageShell title="점검설정" subtitle="템플릿 · 기본 주기">
      <p className="inspection-coming-soon">
        브랜드별 점검 템플릿(`inspection_templates`)과 기본 점검 주기 설정 UI를 이어서 제공합니다.
        글로벌 기본 항목(Frame, Cable, Pulley 등 11개)은 DB에 시드되어 있습니다.
      </p>
    </PageShell>
  );
}
