import { useTranslation } from 'react-i18next';
import { GrowthPeriodRangeCalendar } from '@/components/progressive-overload/GrowthPeriodRangeCalendar/GrowthPeriodRangeCalendar';
import { formatHistoryDateHeader } from '@/utils/historyDate';
import type { GrowthPeriod } from '@/utils/workoutAnalytics';
import '@/styles/records.css';
import '@/styles/growth-analysis.css';

const PERIOD_PRESETS: GrowthPeriod[] = ['30d', '3m', 'all', 'custom'];

interface GrowthPeriodFilterProps {
  preset: GrowthPeriod;
  customFrom: string;
  customTo: string;
  datesWithData: Set<string>;
  locale: string;
  onPresetChange: (preset: GrowthPeriod) => void;
  onCustomRangeChange: (from: string, to: string) => void;
}

export function GrowthPeriodFilter({
  preset,
  customFrom,
  customTo,
  datesWithData,
  locale,
  onPresetChange,
  onCustomRangeChange,
}: GrowthPeriodFilterProps) {
  const { t } = useTranslation('common');
  const isCustom = preset === 'custom';
  const rangeLabel =
    customFrom && customTo
      ? t('growthAnalysis.periodRange.selected', {
          from: formatHistoryDateHeader(customFrom, locale),
          to: formatHistoryDateHeader(customTo, locale),
        })
      : customFrom
        ? t('growthAnalysis.periodRange.selectTo')
        : null;

  return (
    <div className="growth-period-filter">
      <span className="form-row__label">{t('growthAnalysis.periodSelect')}</span>
      <div
        className="growth-analysis-period growth-analysis-period--with-custom"
        role="group"
        aria-label={t('growthAnalysis.periodSelect')}
      >
        {PERIOD_PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            className={`growth-analysis-period__btn${preset === value ? ' growth-analysis-period__btn--active' : ''}`}
            onClick={() => onPresetChange(value)}
          >
            {t(`growthAnalysis.period.${value}`)}
          </button>
        ))}
      </div>

      {isCustom ? (
        <div className="growth-period-filter__custom">
          {rangeLabel ? (
            <p className="growth-period-filter__range-label">{rangeLabel}</p>
          ) : null}
          <GrowthPeriodRangeCalendar
            datesWithData={datesWithData}
            from={customFrom}
            to={customTo}
            onRangeChange={onCustomRangeChange}
            locale={locale}
          />
        </div>
      ) : null}
    </div>
  );
}
