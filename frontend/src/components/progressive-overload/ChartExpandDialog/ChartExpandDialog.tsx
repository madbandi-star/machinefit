import { useTranslation } from 'react-i18next';
import { LineChart, type LineChartPoint } from '@/components/progressive-overload/LineChart/LineChart';
import '@/styles/components.css';

interface ChartExpandDialogProps {
  open: boolean;
  title: string;
  description?: string;
  points: LineChartPoint[];
  unit: string;
  showTrend?: boolean;
  accentColor?: string;
  ariaLabel: string;
  onClose: () => void;
}

export function ChartExpandDialog({
  open,
  title,
  description,
  points,
  unit,
  showTrend,
  accentColor,
  ariaLabel,
  onClose,
}: ChartExpandDialogProps) {
  const { t } = useTranslation('common');

  if (!open) return null;

  return (
    <div className="dialog-overlay" role="presentation" onClick={onClose}>
      <div
        className="dialog card chart-expand-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-expand-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="chart-expand-dialog__header">
          <div>
            <h3 id="chart-expand-dialog-title">{title}</h3>
            {description ? <p className="chart-expand-dialog__desc">{description}</p> : null}
          </div>
          <button type="button" className="chart-expand-dialog__close" onClick={onClose}>
            {t('actions.close')}
          </button>
        </div>
        {points.length > 0 ? (
          <LineChart
            points={points}
            unit={unit}
            showTrend={showTrend}
            accentColor={accentColor}
            ariaLabel={ariaLabel}
            size="large"
            showValueList
          />
        ) : (
          <p className="growth-analysis-chart-empty">{t('growthAnalysis.noDataInPeriod')}</p>
        )}
      </div>
    </div>
  );
}
