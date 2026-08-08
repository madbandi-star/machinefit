import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import {
  formatHistoryDateHeader,
  getTodayDateKey,
  normalizeDateKey,
} from '@/utils/historyDate';
import './PlanDatePickerDialog.css';

function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export interface PlanDatePickerDialogProps {
  open: boolean;
  title: string;
  message?: string;
  initialDate: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: (dateKey: string) => void;
}

export function PlanDatePickerDialog({
  open,
  title,
  message,
  initialDate,
  confirmLabel,
  cancelLabel,
  onClose,
  onConfirm,
}: PlanDatePickerDialogProps) {
  const { t, i18n } = useTranslation(['common', 'machines']);
  const titleId = useId();
  const messageId = useId();
  const inputId = useId();
  const dialogRef = useModalAccessibility({ open, onClose });
  const today = getTodayDateKey();
  const tomorrow = shiftDateKey(today, 1);
  const [value, setValue] = useState(() => normalizeDateKey(initialDate) || today);

  useEffect(() => {
    if (!open) return;
    setValue(normalizeDateKey(initialDate) || today);
  }, [open, initialDate, today]);

  const friendlyLabel = useMemo(
    () => formatHistoryDateHeader(value, i18n.language),
    [value, i18n.language]
  );

  const isValid = /^\d{4}-\d{2}-\d{2}$/.test(value);

  if (!open) return null;

  return (
    <div className="dialog-overlay" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="dialog card plan-date-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="dialog__title">
          {title}
        </h3>
        {message ? (
          <p id={messageId} className="dialog__message">
            {message}
          </p>
        ) : null}

        <p className="plan-date-picker__preview" aria-live="polite">
          {friendlyLabel}
        </p>

        <div className="plan-date-picker__chips" role="group" aria-label={t('machines:history.planDateQuickPicks')}>
          <button
            type="button"
            className={`plan-date-picker__chip${value === today ? ' is-active' : ''}`}
            onClick={() => setValue(today)}
          >
            {t('machines:history.planDateToday')}
          </button>
          <button
            type="button"
            className={`plan-date-picker__chip${value === tomorrow ? ' is-active' : ''}`}
            onClick={() => setValue(tomorrow)}
          >
            {t('machines:history.planDateTomorrow')}
          </button>
        </div>

        <label className="plan-date-picker__field" htmlFor={inputId}>
          <span className="plan-date-picker__label">{t('machines:history.planDateInputLabel')}</span>
          <input
            id={inputId}
            className="plan-date-picker__input"
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>

        <div className="dialog__actions">
          <button
            type="button"
            className="btn btn--block btn--primary"
            disabled={!isValid}
            onClick={() => {
              if (!isValid) return;
              onConfirm(value);
            }}
          >
            {confirmLabel ?? t('common:actions.confirm')}
          </button>
          <button type="button" className="btn btn--secondary btn--block" onClick={onClose}>
            {cancelLabel ?? t('common:actions.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
