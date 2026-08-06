import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ROUTES } from '@/constants/routes';
import { OwnerGymPicker, useOwnerActiveGym } from './useOwnerActiveGym';
import '@/styles/inspection.css';

const HUB_LINKS = [
  {
    to: ROUTES.OWNER_EQUIPMENT_INVENTORY,
    titleKey: 'hub.inventory',
    descKey: 'hub.inventoryDesc',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_INSPECTIONS,
    titleKey: 'hub.inspections',
    descKey: 'hub.inspectionsDesc',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_PM,
    titleKey: 'hub.pm',
    descKey: 'hub.pmDesc',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_FAULTS,
    titleKey: 'hub.faults',
    descKey: 'hub.faultsDesc',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_REPAIRS,
    titleKey: 'hub.repairs',
    descKey: 'hub.repairsDesc',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_PARTS,
    titleKey: 'hub.parts',
    descKey: 'hub.partsDesc',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_STATS,
    titleKey: 'hub.stats',
    descKey: 'hub.statsDesc',
  },
  {
    to: ROUTES.OWNER_EQUIPMENT_SETTINGS,
    titleKey: 'hub.settings',
    descKey: 'hub.settingsDesc',
  },
] as const;

export function EquipmentHubPage() {
  const { t } = useTranslation('equipment');
  const { gyms, gymId, setGymId } = useOwnerActiveGym();

  return (
    <PageShell title={t('hub.title')} subtitle={t('hub.subtitle')}>
      <OwnerGymPicker gyms={gyms} gymId={gymId} onChange={setGymId} />
      <div className="inspection-hub__grid">
        {HUB_LINKS.map((item) => (
          <Link key={item.to} to={item.to} className="inspection-hub__card">
            <strong>{t(item.titleKey)}</strong>
            <span>{t(item.descKey)}</span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
