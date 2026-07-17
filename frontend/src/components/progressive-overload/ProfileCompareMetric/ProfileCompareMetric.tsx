import { useTranslation } from 'react-i18next';

export interface ProfileCompareMetricProps {
  icon: string;
  title: string;
  hint: string;
  userValue: number | null;
  avgValue: number;
  unit: string;
  meLabel: string;
  avgLabel: string;
}

function formatDisplayValue(value: number | null, unit: string): string {
  if (value == null) return '—';
  if (unit === '%') return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  return `${value}${unit}`;
}

function getDelta(userValue: number | null, avgValue: number, unit: string) {
  if (userValue == null) return null;

  const diff = userValue - avgValue;
  if (Math.abs(diff) < (unit === '%' ? 0.5 : 0.25)) {
    return { kind: 'equal' as const, diff: 0, text: '' };
  }

  if (unit === '%') {
    return {
      kind: diff > 0 ? ('above' as const) : ('below' as const),
      diff,
      text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%p`,
    };
  }

  return {
    kind: diff > 0 ? ('above' as const) : ('below' as const),
    diff,
    text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}${unit}`,
  };
}

export function ProfileCompareMetric({
  icon,
  title,
  hint,
  userValue,
  avgValue,
  unit,
  meLabel,
  avgLabel,
}: ProfileCompareMetricProps) {
  const { t } = useTranslation('common');
  const delta = getDelta(userValue, avgValue, unit);
  const max = Math.max(userValue ?? 0, avgValue, unit === '%' ? 10 : 1);
  const userPct = userValue == null ? 0 : (Math.abs(userValue) / max) * 100;
  const avgPct = (Math.abs(avgValue) / max) * 100;

  const deltaClass =
    delta?.kind === 'above'
      ? 'profile-compare-metric__delta--up'
      : delta?.kind === 'below'
        ? 'profile-compare-metric__delta--down'
        : 'profile-compare-metric__delta--even';

  const deltaMessage =
    delta?.kind === 'above'
      ? t('growthAnalysis.insights.profileAverage.deltaAbove', { value: delta.text })
      : delta?.kind === 'below'
        ? t('growthAnalysis.insights.profileAverage.deltaBelow', { value: delta.text })
        : delta?.kind === 'equal'
          ? t('growthAnalysis.insights.profileAverage.deltaEven')
          : null;

  return (
    <article className="profile-compare-metric">
      <header className="profile-compare-metric__header">
        <span className="profile-compare-metric__icon" aria-hidden>
          {icon}
        </span>
        <div>
          <h3 className="profile-compare-metric__title">{title}</h3>
          <p className="profile-compare-metric__hint">{hint}</p>
        </div>
      </header>

      <div className="profile-compare-metric__values">
        <div className="profile-compare-metric__value profile-compare-metric__value--user">
          <span className="profile-compare-metric__value-label">{meLabel}</span>
          <strong>{formatDisplayValue(userValue, unit)}</strong>
        </div>
        <span className="profile-compare-metric__vs" aria-hidden>
          VS
        </span>
        <div className="profile-compare-metric__value profile-compare-metric__value--avg">
          <span className="profile-compare-metric__value-label">{avgLabel}</span>
          <strong>{formatDisplayValue(avgValue, unit)}</strong>
        </div>
      </div>

      <div className="profile-compare-metric__bars" aria-hidden>
        <div className="profile-compare-metric__bar-row">
          <span>{meLabel}</span>
          <div className="profile-compare-metric__track">
            <div
              className="profile-compare-metric__fill profile-compare-metric__fill--user"
              style={{ width: `${Math.min(userPct, 100)}%` }}
            />
          </div>
        </div>
        <div className="profile-compare-metric__bar-row">
          <span>{avgLabel}</span>
          <div className="profile-compare-metric__track">
            <div
              className="profile-compare-metric__fill profile-compare-metric__fill--avg"
              style={{ width: `${Math.min(avgPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {deltaMessage ? (
        <p className={`profile-compare-metric__delta ${deltaClass}`}>{deltaMessage}</p>
      ) : null}
    </article>
  );
}
