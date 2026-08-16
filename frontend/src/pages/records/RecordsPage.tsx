import { HistoryListPanel } from '@/components/records/HistoryListPanel/HistoryListPanel';
import '@/styles/records.css';
import '@/styles/banners.css';

/** Records page shows recent history only (favorites tab removed from UI). */
export function RecordsPage() {
  return (
    <div className="records-page records-page--history">
      <div className="records-page__panel">
        <HistoryListPanel />
      </div>
    </div>
  );
}
