import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollPicker } from '@/components/form/ScrollPicker/ScrollPicker';
import '@/styles/components.css';
import '@/styles/birth-profile.css';

export interface BirthProfileFieldsProps {
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  onBirthDateChange: (value: string) => void;
  onBirthTimeChange: (value: string) => void;
  onBirthTimeUnknownChange: (value: boolean) => void;
}

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

function parseTimeParts(hhmm: string): { hour: number; minute: number } | null {
  const m = hhmm.trim().match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function formatDateIso(year: number, month: number, day: number): string {
  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);
  return `${year}-${pad2(month)}-${pad2(safeDay)}`;
}

function formatTimeIso(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function BirthProfileFields({
  birthDate,
  birthTime,
  birthTimeUnknown,
  onBirthDateChange,
  onBirthTimeChange,
  onBirthTimeUnknownChange,
}: BirthProfileFieldsProps) {
  const { t, i18n } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const maxYear = today.getFullYear();
  const minYear = maxYear - 100;
  const defaultYear = maxYear - 30;

  const dateParts = parseDateParts(birthDate);
  const timeParts = parseTimeParts(birthTime);

  const year = dateParts?.year ?? defaultYear;
  const month = dateParts?.month ?? 1;
  const day = dateParts?.day ?? 1;
  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);

  const hour = timeParts?.hour ?? 12;
  const minute = timeParts ? Math.round(timeParts.minute / 5) * 5 : 0;
  const safeMinute = Math.min(55, Math.max(0, minute));

  const commitDate = (nextYear: number, nextMonth: number, nextDay: number) => {
    onBirthDateChange(formatDateIso(nextYear, nextMonth, nextDay));
  };

  const commitTime = (nextHour: number, nextMinute: number) => {
    onBirthTimeChange(formatTimeIso(nextHour, nextMinute));
  };

  const summaryDate = useMemo(() => {
    if (!dateParts) return t('settings.birthDateUnset');
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

  const summaryTime = useMemo(() => {
    if (birthTimeUnknown) return t('settings.birthTimeUnknown');
    if (!timeParts) return t('settings.birthTimeUnset');
    try {
      return new Intl.DateTimeFormat(i18n.language || 'ko', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(`1970-01-01T${formatTimeIso(hour, safeMinute)}:00`));
    } catch {
      return formatTimeIso(hour, safeMinute);
    }
  }, [birthTimeUnknown, timeParts, hour, safeMinute, i18n.language, t]);

  const yearUnit = t('settings.birthYearUnit');
  const monthUnit = t('settings.birthMonthUnit');
  const dayUnit = t('settings.birthDayUnit');
  const hourUnit = t('settings.birthHourUnit');
  const minuteUnit = t('settings.birthMinuteUnit');

  return (
    <div className="birth-profile-fields">
      <div className="birth-profile-fields__summary" aria-live="polite">
        <span className="birth-profile-fields__summary-label">{t('settings.birthSummary')}</span>
        <strong className="birth-profile-fields__summary-value">
          {summaryDate}
          <span className="birth-profile-fields__summary-sep">·</span>
          {summaryTime}
        </strong>
      </div>

      <div className="birth-profile-fields__block">
        <p className="birth-profile-fields__block-title">{t('settings.birthDate')}</p>
        <div
          className="body-metrics-inline birth-profile-fields__pickers"
          role="group"
          aria-label={t('settings.birthDate')}
        >
          <div className="body-metrics-inline__grid body-metrics-inline__grid--3 birth-profile-fields__date-grid">
            <div className="body-metrics-inline__cell birth-profile-fields__cell--year">
              <span className="body-metrics-inline__label">
                {t('settings.birthYear')}
                {yearUnit ? (
                  <span className="body-metrics-inline__unit">{yearUnit}</span>
                ) : null}
              </span>
              <ScrollPicker
                value={dateParts?.year}
                onChange={(next) => commitDate(next, month, safeDay)}
                min={minYear}
                max={maxYear}
                step={1}
                defaultValue={defaultYear}
                initializeOnMount={!dateParts}
                ariaLabel={t('settings.birthYear')}
                formatValue={(value) => String(value)}
              />
            </div>
            <div className="body-metrics-inline__cell">
              <span className="body-metrics-inline__label">
                {t('settings.birthMonth')}
                {monthUnit ? (
                  <span className="body-metrics-inline__unit">{monthUnit}</span>
                ) : null}
              </span>
              <ScrollPicker
                value={dateParts?.month}
                onChange={(next) => commitDate(year, next, safeDay)}
                min={1}
                max={12}
                step={1}
                defaultValue={1}
                initializeOnMount={!dateParts}
                ariaLabel={t('settings.birthMonth')}
                formatValue={(value) => String(value)}
              />
            </div>
            <div className="body-metrics-inline__cell">
              <span className="body-metrics-inline__label">
                {t('settings.birthDay')}
                {dayUnit ? (
                  <span className="body-metrics-inline__unit">{dayUnit}</span>
                ) : null}
              </span>
              <ScrollPicker
                value={dateParts ? safeDay : undefined}
                onChange={(next) => commitDate(year, month, next)}
                min={1}
                max={maxDay}
                step={1}
                defaultValue={1}
                initializeOnMount={!dateParts}
                ariaLabel={t('settings.birthDay')}
                formatValue={(value) => String(value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="birth-profile-fields__block">
        <div className="birth-profile-fields__time-header">
          <p className="birth-profile-fields__block-title">{t('settings.birthTime')}</p>
          <div
            className="birth-profile-fields__mode"
            role="group"
            aria-label={t('settings.birthTimeMode')}
          >
            <button
              type="button"
              className={`birth-profile-fields__mode-btn${
                !birthTimeUnknown ? ' birth-profile-fields__mode-btn--active' : ''
              }`}
              aria-pressed={!birthTimeUnknown}
              onClick={() => {
                onBirthTimeUnknownChange(false);
                if (!timeParts) commitTime(12, 0);
              }}
            >
              {t('settings.birthTimeKnown')}
            </button>
            <button
              type="button"
              className={`birth-profile-fields__mode-btn${
                birthTimeUnknown ? ' birth-profile-fields__mode-btn--active' : ''
              }`}
              aria-pressed={birthTimeUnknown}
              onClick={() => {
                onBirthTimeUnknownChange(true);
                onBirthTimeChange('');
              }}
            >
              {t('settings.birthTimeUnknown')}
            </button>
          </div>
        </div>

        {birthTimeUnknown ? (
          <p className="birth-profile-fields__unknown-hint">{t('settings.birthTimeUnknownHint')}</p>
        ) : (
          <div
            className="body-metrics-inline birth-profile-fields__pickers"
            role="group"
            aria-label={t('settings.birthTime')}
          >
            <div className="body-metrics-inline__grid body-metrics-inline__grid--2">
              <div className="body-metrics-inline__cell">
                <span className="body-metrics-inline__label">
                  {t('settings.birthHour')}
                  {hourUnit ? (
                    <span className="body-metrics-inline__unit">{hourUnit}</span>
                  ) : null}
                </span>
                <ScrollPicker
                  value={timeParts?.hour}
                  onChange={(next) => commitTime(next, safeMinute)}
                  min={0}
                  max={23}
                  step={1}
                  defaultValue={12}
                  initializeOnMount={!timeParts}
                  ariaLabel={t('settings.birthHour')}
                  formatValue={(value) => pad2(value)}
                />
              </div>
              <div className="body-metrics-inline__cell">
                <span className="body-metrics-inline__label">
                  {t('settings.birthMinute')}
                  {minuteUnit ? (
                    <span className="body-metrics-inline__unit">{minuteUnit}</span>
                  ) : null}
                </span>
                <ScrollPicker
                  value={timeParts ? safeMinute : undefined}
                  onChange={(next) => commitTime(hour, next)}
                  min={0}
                  max={55}
                  step={5}
                  defaultValue={0}
                  initializeOnMount={!timeParts}
                  ariaLabel={t('settings.birthMinute')}
                  formatValue={(value) => pad2(value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="form-section__desc birth-profile-fields__hint">{t('settings.birthProfileHint')}</p>
    </div>
  );
}
