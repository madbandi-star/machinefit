import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { getTodayDateKey, normalizeDateKey, shiftDateKey } from '@/utils/historyDate';
import './PlanDatePickerDialog.css';

function parseDateKey(dateKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Human-readable label for the picker (never appends empty "()"). */
function formatPickerDateLabel(dateKey: string, locale: string): string {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;

  const resolvedLocale = locale?.trim() || 'ko';
  const datePart = date.toLocaleDateString(resolvedLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const weekday = date
    .toLocaleDateString(resolvedLocale, { weekday: 'short' })
    .replace(/[().]/g, '')
    .trim();

  return weekday ? `${datePart} (${weekday})` : datePart;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useModalAccessibility({ open, onClose });
  const today = getTodayDateKey();
  const [value, setValue] = useState(() => normalizeDateKey(initialDate) || today);

  useEffect(() => {
    if (!open) return;
    setValue(normalizeDateKey(initialDate) || today);
  }, [open, initialDate, today]);

  const quickPicks = useMemo(
    () =>
      [0, 1, 2, 3, 4, 5, 6, 7].map((offset) => {
        const dateKey = offset === 0 ? today : shiftDateKey(today, offset);
        let label: string;
        if (offset === 0) label = t('machines:history.planDateToday');
        else if (offset === 1) label = t('machines:history.planDateTomorrow');
        else if (offset === 7) label = t('machines:history.planDateInOneWeek');
        else label = t('machines:history.planDateDPlus', { n: offset });
        return { offset, dateKey, label };
      }),
    [t, today]
  );

  const friendlyLabel = useMemo(
    () => formatPickerDateLabel(value, i18n.language),
    [value, i18n.language]
  );

  const isValid = Boolean(parseDateKey(value));

  const openNativePicker = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === 'function') {
        el.showPicker();
        return;
      }
    } catch {
      // fall through — older browsers / blocked by UA
    }
    el.focus();
    el.click();
  };

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

        <button
          type="button"
          className="plan-date-picker__preview-btn"
          onClick={openNativePicker}
          aria-controls={inputId}
        >
          <span className="plan-date-picker__preview" aria-live="polite">
            {friendlyLabel}
          </span>
          <span className="plan-date-picker__preview-hint">
            {t('machines:history.planDateInputLabel')}
          </span>
        </button>

        <div className="plan-date-picker__chips" role="group" aria-label={t('machines:history.planDateQuickPicks')}>
          {quickPicks.map((pick) => (
            <button
              key={pick.offset}
              type="button"
              className={`plan-date-picker__chip${value === pick.dateKey ? ' is-active' : ''}`}
              onClick={() => setValue(pick.dateKey)}
            >
              {pick.label}
            </button>
          ))}
        </div>

        <input
          ref={inputRef}
          id={inputId}
          className="plan-date-picker__native"
          type="date"
          lang={i18n.language}
          value={isValid ? value : ''}
          onChange={(e) => {
            if (e.target.value) setValue(e.target.value);
          }}
          tabIndex={-1}
          aria-hidden="true"
        />

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
