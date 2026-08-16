import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDatePart(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimePart(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function splitLocal(value: string): { date: string; time: string } {
  if (!value) return { date: '', time: '' };
  const [date, time = ''] = value.split('T');
  return { date, time: time.slice(0, 5) };
}

function joinLocal(date: string, time: string): string {
  if (!date) return '';
  return `${date}T${time || '00:00'}`;
}

function endOfDayLocal(date: string): string {
  return joinLocal(date, '23:59');
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toDatePart(d);
}

function formatSummary(isoLocal: string, locale: string): string {
  if (!isoLocal) return '';
  const d = new Date(isoLocal.length === 16 ? `${isoLocal}:00` : isoLocal);
  if (Number.isNaN(d.getTime())) return isoLocal;
  try {
    return new Intl.DateTimeFormat(locale || 'ko', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoLocal.replace('T', ' ');
  }
}

interface BannerScheduleFieldsProps {
  startAt: string;
  endAt: string;
  onStartAtChange: (value: string) => void;
  onEndAtChange: (value: string) => void;
}

export function BannerScheduleFields({
  startAt,
  endAt,
  onStartAtChange,
  onEndAtChange,
}: BannerScheduleFieldsProps) {
  const { t, i18n } = useTranslation(['admin']);
  const locale = i18n.language;
  const limited = Boolean(startAt || endAt);
  const start = splitLocal(startAt);
  const end = splitLocal(endAt);

  const summary = useMemo(() => {
    if (!startAt && !endAt) return t('admin:banners.scheduleAlways');
    const from = startAt ? formatSummary(startAt, locale) : t('admin:banners.scheduleOpenStart');
    const to = endAt ? formatSummary(endAt, locale) : t('admin:banners.scheduleOpenEnd');
    return `${from} → ${to}`;
  }, [startAt, endAt, locale, t]);

  const setLimited = (next: boolean) => {
    if (!next) {
      onStartAtChange('');
      onEndAtChange('');
      return;
    }
    if (!startAt && !endAt) {
      const now = new Date();
      onStartAtChange(joinLocal(toDatePart(now), toTimePart(now)));
      onEndAtChange(endOfDayLocal(addDays(toDatePart(now), 7)));
    }
  };

  const setStartParts = (date: string, time: string) => {
    onStartAtChange(joinLocal(date, time));
  };

  const setEndParts = (date: string, time: string) => {
    onEndAtChange(joinLocal(date, time));
  };

  const applyPreset = (preset: 'now' | 'd7' | 'd30' | 'clear') => {
    if (preset === 'clear') {
      onStartAtChange('');
      onEndAtChange('');
      return;
    }
    const now = new Date();
    const today = toDatePart(now);
    if (preset === 'now') {
      onStartAtChange(joinLocal(today, toTimePart(now)));
      return;
    }
    const days = preset === 'd7' ? 7 : 30;
    if (!startAt) {
      onStartAtChange(joinLocal(today, toTimePart(now)));
    }
    onEndAtChange(endOfDayLocal(addDays(today, days)));
  };

  return (
    <div className="admin-banner-schedule">
      <div className="admin-banner-schedule__head">
        <span className="admin-banner-schedule__title">{t('admin:banners.scheduleTitle')}</span>
        <p className="ag-editor__hint">{t('admin:banners.scheduleHint')}</p>
      </div>

      <div className="ag-chips" role="group" aria-label={t('admin:banners.scheduleTitle')}>
        <button
          type="button"
          className={`ag-chip${!limited ? ' is-active' : ''}`}
          onClick={() => setLimited(false)}
        >
          {t('admin:banners.scheduleAlways')}
        </button>
        <button
          type="button"
          className={`ag-chip${limited ? ' is-active' : ''}`}
          onClick={() => setLimited(true)}
        >
          {t('admin:banners.scheduleLimited')}
        </button>
      </div>

      {limited ? (
        <>
          <div className="admin-banner-schedule__grid">
            <div className="admin-banner-schedule__card">
              <div className="admin-banner-schedule__card-head">
                <span>{t('admin:banners.fieldStartAt')}</span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => onStartAtChange('')}
                >
                  {t('admin:banners.scheduleClearOne')}
                </button>
              </div>
              <div className="admin-banner-schedule__parts">
                <label className="admin-banner-schedule__part">
                  <span>{t('admin:banners.scheduleDate')}</span>
                  <input
                    className="input"
                    type="date"
                    value={start.date}
                    onChange={(e) => setStartParts(e.target.value, start.time || '00:00')}
                  />
                </label>
                <label className="admin-banner-schedule__part">
                  <span>{t('admin:banners.scheduleTime')}</span>
                  <input
                    className="input"
                    type="time"
                    value={start.time || '00:00'}
                    disabled={!start.date}
                    onChange={(e) => setStartParts(start.date, e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="admin-banner-schedule__card">
              <div className="admin-banner-schedule__card-head">
                <span>{t('admin:banners.fieldEndAt')}</span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => onEndAtChange('')}
                >
                  {t('admin:banners.scheduleClearOne')}
                </button>
              </div>
              <div className="admin-banner-schedule__parts">
                <label className="admin-banner-schedule__part">
                  <span>{t('admin:banners.scheduleDate')}</span>
                  <input
                    className="input"
                    type="date"
                    value={end.date}
                    min={start.date || undefined}
                    onChange={(e) => setEndParts(e.target.value, end.time || '23:59')}
                  />
                </label>
                <label className="admin-banner-schedule__part">
                  <span>{t('admin:banners.scheduleTime')}</span>
                  <input
                    className="input"
                    type="time"
                    value={end.time || '23:59'}
                    disabled={!end.date}
                    onChange={(e) => setEndParts(end.date, e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="ag-chips" role="group" aria-label={t('admin:banners.schedulePresets')}>
            <button type="button" className="ag-chip" onClick={() => applyPreset('now')}>
              {t('admin:banners.schedulePresetNow')}
            </button>
            <button type="button" className="ag-chip" onClick={() => applyPreset('d7')}>
              {t('admin:banners.schedulePreset7d')}
            </button>
            <button type="button" className="ag-chip" onClick={() => applyPreset('d30')}>
              {t('admin:banners.schedulePreset30d')}
            </button>
            <button type="button" className="ag-chip" onClick={() => applyPreset('clear')}>
              {t('admin:banners.scheduleClearAll')}
            </button>
          </div>
        </>
      ) : null}

      <p className="admin-banner-schedule__summary" role="status">
        {summary}
      </p>
    </div>
  );
}
