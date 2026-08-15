import { useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { HistoryDateCalendar } from '@/components/records/HistoryDateCalendar/HistoryDateCalendar';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import type { MuscleGroupCount } from '@/utils/historyDate';
import './HistoryDateCalendarDialog.css';

export interface HistoryDateCalendarDialogProps {
  open: boolean;
  datesWithData: Set<string>;
  dateCounts?: Map<string, number>;
  dateMuscleCounts?: Map<string, MuscleGroupCount[]>;
  selectedDate: string;
  locale: string;
  allowEmptySelect?: boolean;
  onSelect: (dateKey: string) => void;
  onClose: () => void;
  onVisibleMonthChange?: (year: number, monthIndex: number) => void;
}

export function HistoryDateCalendarDialog({
  open,
  datesWithData,
  dateCounts,
  dateMuscleCounts,
  selectedDate,
  locale,
  allowEmptySelect = true,
  onSelect,
  onClose,
  onVisibleMonthChange,
}: HistoryDateCalendarDialogProps) {
  const { t } = useTranslation(['machines', 'common']);
  const titleId = useId();
  const dialogRef = useModalAccessibility({ open, onClose });

  if (!open) return null;

  return createPortal(
    <div
      className="history-calendar-dialog-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="history-calendar-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="history-calendar-dialog__header">
          <div className="history-calendar-dialog__heading">
            <h2 id={titleId} className="history-calendar-dialog__title">
              {t('machines:history.filterByDate')}
            </h2>
            <p className="history-calendar-dialog__hint">{t('machines:history.calendarHint')}</p>
          </div>
          <button
            type="button"
            className="history-calendar-dialog__close"
            onClick={onClose}
            aria-label={t('common:actions.close')}
          >
            <Icon name="close" size={22} />
          </button>
        </header>

        <div className="history-calendar-dialog__body">
          <HistoryDateCalendar
            datesWithData={datesWithData}
            dateCounts={dateCounts}
            dateMuscleCounts={dateMuscleCounts}
            selectedDate={selectedDate}
            onSelect={onSelect}
            locale={locale}
            allowEmptySelect={allowEmptySelect}
            onVisibleMonthChange={onVisibleMonthChange}
            onAfterSelect={onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
