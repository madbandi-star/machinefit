import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import '@/components/records/HistoryDayActionsSheet/HistoryDayActionsSheet.css';
import './HistoryCardPlanActionsSheet.css';

export interface HistoryCardPlanActionsSheetProps {
  open: boolean;
  machineName: string;
  currentDateLabel: string;
  canMove: boolean;
  canCopy: boolean;
  disabled?: boolean;
  onClose: () => void;
  onMove: () => void;
  onCopy: () => void;
}

export function HistoryCardPlanActionsSheet({
  open,
  machineName,
  currentDateLabel,
  canMove,
  canCopy,
  disabled = false,
  onClose,
  onMove,
  onCopy,
}: HistoryCardPlanActionsSheetProps) {
  const { t } = useTranslation(['machines', 'common']);
  const titleId = useId();
  const sheetRef = useModalAccessibility({ open, onClose });

  if (!open) return null;

  return (
    <div
      className="bottom-sheet-overlay day-actions-sheet-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        className="bottom-sheet card day-actions-sheet card-plan-actions-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="day-actions-sheet__handle" aria-hidden="true" />

        <div className="bottom-sheet__header day-actions-sheet__header">
          <div className="day-actions-sheet__heading">
            <p id={titleId} className="day-actions-sheet__title">
              {t('machines:history.planCardActionsTitle')}
            </p>
            <p className="day-actions-sheet__date card-plan-actions-sheet__machine">
              {machineName}
            </p>
            <p className="card-plan-actions-sheet__current">
              {t('machines:history.planCardActionsCurrentDate', { date: currentDateLabel })}
            </p>
          </div>
          <button
            type="button"
            className="bottom-sheet__close"
            onClick={onClose}
            aria-label={t('common:actions.close')}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="day-actions-sheet__body">
          {canMove ? (
            <button
              type="button"
              className="day-actions-sheet__row"
              disabled={disabled}
              onClick={() => {
                onClose();
                onMove();
              }}
            >
              <span className="day-actions-sheet__icon" aria-hidden="true">
                <Icon name="calendar" size={20} />
              </span>
              <span className="day-actions-sheet__copy">
                <span className="day-actions-sheet__row-title">
                  {t('machines:history.planMoveDate')}
                </span>
                <span className="day-actions-sheet__row-desc">
                  {t('machines:history.planCardActionsMoveHint')}
                </span>
              </span>
              <Icon name="chevronRight" size={18} className="day-actions-sheet__chevron" />
            </button>
          ) : null}

          {canCopy ? (
            <button
              type="button"
              className="day-actions-sheet__row"
              disabled={disabled}
              onClick={() => {
                onClose();
                onCopy();
              }}
            >
              <span className="day-actions-sheet__icon" aria-hidden="true">
                <Icon name="share" size={20} />
              </span>
              <span className="day-actions-sheet__copy">
                <span className="day-actions-sheet__row-title">
                  {t('machines:history.planCopyDate')}
                </span>
                <span className="day-actions-sheet__row-desc">
                  {t('machines:history.planCardActionsCopyHint')}
                </span>
              </span>
              <Icon name="chevronRight" size={18} className="day-actions-sheet__chevron" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
