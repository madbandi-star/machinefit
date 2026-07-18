import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CollapsibleCard } from '@/components/progressive-overload/CollapsibleCard/CollapsibleCard';
import { ChartExpandDialog } from '@/components/progressive-overload/ChartExpandDialog/ChartExpandDialog';
import { LineChart, type LineChartPoint } from '@/components/progressive-overload/LineChart/LineChart';

interface GrowthChartBlockProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  headerExtra?: ReactNode;
  points: LineChartPoint[];
  unit: string;
  showTrend?: boolean;
  accentColor?: string;
  ariaLabel: string;
  defaultOpen?: boolean;
  className?: string;
  chartSize?: 'default' | 'compact' | 'mini' | 'micro' | 'large';
}

export function GrowthChartBlock({
  title,
  description,
  badge,
  headerExtra,
  points,
  unit,
  showTrend,
  accentColor,
  ariaLabel,
  defaultOpen = true,
  className,
  chartSize = 'mini',
}: GrowthChartBlockProps) {
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(false);

  const summary = (
    <div className="growth-chart-block__summary-row">
      {description ? <span>{description}</span> : null}
      {badge}
    </div>
  );

  return (
    <>
      <CollapsibleCard
        title={title}
        summary={summary}
        defaultOpen={defaultOpen}
        className={`growth-chart-block${className ? ` ${className}` : ''}`}
        bodyClassName="growth-chart-block__body"
      >
        {headerExtra}
        {points.length > 0 ? (
          <button
            type="button"
            className="growth-chart-block__chart-trigger"
            onClick={() => setExpanded(true)}
            aria-label={t('growthAnalysis.chartExpand.open', { title })}
          >
            <LineChart
              points={points}
              unit={unit}
              showTrend={showTrend}
              accentColor={accentColor}
              ariaLabel={ariaLabel}
              size={chartSize}
            />
            <span className="growth-chart-block__expand-hint">
              {t('growthAnalysis.chartExpand.hint')}
            </span>
          </button>
        ) : (
          <p className="growth-analysis-chart-empty">{t('growthAnalysis.noDataInPeriod')}</p>
        )}
      </CollapsibleCard>

      <ChartExpandDialog
        open={expanded}
        title={title}
        description={description}
        points={points}
        unit={unit}
        showTrend={showTrend}
        accentColor={accentColor}
        ariaLabel={ariaLabel}
        onClose={() => setExpanded(false)}
      />
    </>
  );
}
