import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { TabBar } from '@/components/navigation/TabBar/TabBar';
import { HistoryListPanel } from '@/components/records/HistoryListPanel/HistoryListPanel';
import { FavoritesListPanel } from '@/components/records/FavoritesListPanel/FavoritesListPanel';

const TABS = ['history', 'favorites'] as const;
type RecordsTab = (typeof TABS)[number];

function isRecordsTab(value: string | null): value is RecordsTab {
  return value === 'history' || value === 'favorites';
}

export function RecordsPage() {
  const { t } = useTranslation(['common', 'machines']);
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<RecordsTab>(
    isRecordsTab(paramTab) ? paramTab : 'history'
  );

  useEffect(() => {
    if (isRecordsTab(paramTab)) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const handleTabChange = (tabId: string) => {
    if (!isRecordsTab(tabId)) return;
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  return (
    <PageShell title={t('common:nav.records')} subtitle={t('machines:records.subtitle')}>
      <TabBar
        ariaLabel={t('machines:records.tabsLabel')}
        tabs={[
          { id: 'history', label: t('common:nav.history') },
          { id: 'favorites', label: t('common:nav.favorites') },
        ]}
        activeId={activeTab}
        onChange={handleTabChange}
      />
      <div role="tabpanel" style={{ marginTop: '1rem' }}>
        {activeTab === 'history' ? <HistoryListPanel /> : <FavoritesListPanel />}
      </div>
    </PageShell>
  );
}
