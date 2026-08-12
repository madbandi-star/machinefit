import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollPicker } from '@/components/form/ScrollPicker/ScrollPicker';
import '@/styles/components.css';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseDateParts(iso: string): { year: number; month: number; day: number } | null {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || month < 1 || month > 12 || day < 1) return null;
  return { year, month, day };
}

function formatDateIso(year: number, month: number, day: number): string {
  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);
  return `${year}-${pad2(month)}-${pad2(safeDay)}`;
}

interface SignupBirthDateFieldProps {
  value: string;
  maxYmd: string;
  onChange: (value: string) => void;
}

/**
 * Year / month / day scroll pickers for OAuth signup / rejoin age check.
 * Avoids native `type="date"` overflow on narrow auth layouts.
 */
export function SignupBirthDateField({ value, maxYmd, onChange }: SignupBirthDateFieldProps) {
  const { t, i18n } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const maxYear = today.getFullYear();
  const minYear = maxYear - 100;
  const defaultYear = maxYear - 25;

  const dateParts = parseDateParts(value);
  const year = dateParts?.year ?? defaultYear;
  const month = dateParts?.month ?? 1;
  const day = dateParts?.day ?? 1;
  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);

  const commit = (nextYear: number, nextMonth: number, nextDay: number) => {
    const next = formatDateIso(nextYear, nextMonth, nextDay);
    if (next > maxYmd) {
      onChange(maxYmd);
      return;
    }
    onChange(next);
  };

  const summary = useMemo(() => {
    if (!dateParts) return t('auth.signupBirthDateUnset');
    try {
      return new Intl.DateTimeFormat(i18n.language || 'ko', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(`${formatDateIso(year, month, safeDay)}T12:00:00`));
    } catch {
      return formatDateIso(year, month, safeDay);
    }
  }, [dateParts, year, month, safeDay, i18n.language, t]);

  return (
    <div className="terms-agree__dob-field">
      <p className="terms-agree__dob-summary" aria-live="polite">
        <span className="terms-agree__dob-summary-label">{t('auth.signupBirthDateSelected')}</span>
        <strong className="terms-agree__dob-summary-value">{summary}</strong>
      </p>

      <div
        className="body-metrics-inline terms-agree__dob-pickers"
        role="group"
        aria-label={t('auth.signupBirthDate')}
      >
        <div className="body-metrics-inline__grid body-metrics-inline__grid--3">
          <div className="body-metrics-inline__cell">
            <span className="body-metrics-inline__label">{t('settings.birthYear')}</span>
            <ScrollPicker
              size="compact"
              min={minYear}
              max={maxYear}
              value={year}
              defaultValue={defaultYear}
              onChange={(nextYear) => commit(nextYear, month, safeDay)}
              ariaLabel={t('settings.birthYear')}
            />
          </div>
          <div className="body-metrics-inline__cell">
            <span className="body-metrics-inline__label">{t('settings.birthMonth')}</span>
            <ScrollPicker
              size="compact"
              min={1}
              max={12}
              value={month}
              defaultValue={1}
              onChange={(nextMonth) => commit(year, nextMonth, safeDay)}
              ariaLabel={t('settings.birthMonth')}
            />
          </div>
          <div className="body-metrics-inline__cell">
            <span className="body-metrics-inline__label">{t('settings.birthDay')}</span>
            <ScrollPicker
              size="compact"
              min={1}
              max={maxDay}
              value={safeDay}
              defaultValue={1}
              onChange={(nextDay) => commit(year, month, nextDay)}
              ariaLabel={t('settings.birthDay')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
