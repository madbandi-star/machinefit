import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TabBar } from '@/components/navigation/TabBar/TabBar';
import { HistoryListPanel } from '@/components/records/HistoryListPanel/HistoryListPanel';
import { FavoritesListPanel } from '@/components/records/FavoritesListPanel/FavoritesListPanel';
import '@/styles/records.css';

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
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tabId);
        if (tabId !== 'history') {
          next.delete('date');
        }
        return next;
      },
      { replace: true }
    );
  };

  return (
    <div className="records-page">
      <header className="records-page__header">
        <h1 className="records-page__title">{t('common:nav.records')}</h1>
      </header>

      <TabBar
        ariaLabel={t('machines:records.tabsLabel')}
        tabs={[
          { id: 'history', label: t('common:nav.history') },
          { id: 'favorites', label: t('common:nav.favorites') },
        ]}
        activeId={activeTab}
        onChange={handleTabChange}
      />

      <div role="tabpanel" className="records-page__panel">
        {activeTab === 'history' ? <HistoryListPanel /> : <FavoritesListPanel />}
      </div>
    </div>
  );
}
