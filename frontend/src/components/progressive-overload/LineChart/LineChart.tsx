import { useMemo } from 'react';
import { linearRegression } from '@/utils/workoutAnalytics';

export interface LineChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  points: LineChartPoint[];
  unit: string;
  showTrend?: boolean;
  accentColor?: string;
  ariaLabel: string;
  /** @deprecated Use size="compact" instead */
  compact?: boolean;
  size?: 'default' | 'compact' | 'mini' | 'large';
  showValueList?: boolean;
}

const CHART_LAYOUT = {
  default: {
    width: 320,
    height: 160,
    padding: { top: 16, right: 12, bottom: 28, left: 36 },
    dotRadius: 4,
  },
  compact: {
    width: 320,
    height: 108,
    padding: { top: 10, right: 8, bottom: 22, left: 30 },
    dotRadius: 3,
  },
  mini: {
    width: 280,
    height: 56,
    padding: { top: 6, right: 6, bottom: 14, left: 24 },
    dotRadius: 2.5,
  },
  large: {
    width: 340,
    height: 220,
    padding: { top: 20, right: 16, bottom: 34, left: 42 },
    dotRadius: 5,
  },
} as const;

function buildPath(values: { x: number; y: number }[]): string {
  if (values.length === 0) return '';
  return values
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

export function LineChart({
  points,
  unit,
  showTrend = false,
  accentColor = 'var(--color-primary)',
  ariaLabel,
  compact = false,
  size,
  showValueList,
}: LineChartProps) {
  const resolvedSize = size ?? (compact ? 'compact' : 'default');
  const layout = CHART_LAYOUT[resolvedSize];
  const shouldShowValueList =
    showValueList ?? (resolvedSize === 'default' || resolvedSize === 'large');

  const chart = useMemo(() => {
    if (points.length === 0) return null;

    const { width: chartWidth, height: chartHeight, padding } = layout;
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    const values = points.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    const plotPoints = points.map((point, index) => {
      const x =
        points.length === 1
          ? padding.left + innerWidth / 2
          : padding.left + (index / (points.length - 1)) * innerWidth;
      const normalized = (point.value - minValue) / valueRange;
      const y = padding.top + innerHeight - normalized * innerHeight;
      return { x, y, label: point.label, value: point.value };
    });

    const regressionInput = points.map((point, index) => ({ x: index, y: point.value }));
    const trend = linearRegression(regressionInput);
    const trendStartY =
      padding.top +
      innerHeight -
      ((trend.intercept - minValue) / valueRange) * innerHeight;
    const trendEndY =
      padding.top +
      innerHeight -
      ((trend.intercept + trend.slope * (points.length - 1) - minValue) / valueRange) * innerHeight;

    return {
      chartWidth,
      chartHeight,
      padding,
      plotPoints,
      linePath: buildPath(plotPoints),
      trendPath:
        points.length >= 2
          ? `M ${plotPoints[0].x.toFixed(2)} ${trendStartY.toFixed(2)} L ${plotPoints[plotPoints.length - 1].x.toFixed(2)} ${trendEndY.toFixed(2)}`
          : '',
      minValue,
      maxValue,
    };
  }, [layout, points]);

  if (!chart) return null;

  return (
    <div
      className={`po-line-chart po-line-chart--${resolvedSize}`}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox={`0 0 ${chart.chartWidth} ${chart.chartHeight}`}
        className="po-line-chart__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1={chart.padding.left}
          y1={chart.chartHeight - chart.padding.bottom}
          x2={chart.chartWidth - chart.padding.right}
          y2={chart.chartHeight - chart.padding.bottom}
          className="po-line-chart__axis"
        />
        <text
          x={chart.padding.left - 6}
          y={chart.padding.top + 4}
          className="po-line-chart__axis-label"
          textAnchor="end"
        >
          {Math.round(chart.maxValue)}
        </text>
        <text
          x={chart.padding.left - 6}
          y={chart.chartHeight - chart.padding.bottom}
          className="po-line-chart__axis-label"
          textAnchor="end"
        >
          {Math.round(chart.minValue)}
        </text>

        {showTrend && chart.trendPath ? (
          <path d={chart.trendPath} className="po-line-chart__trend" stroke={accentColor} />
        ) : null}

        <path d={chart.linePath} className="po-line-chart__line" stroke={accentColor} />

        {chart.plotPoints.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r={layout.dotRadius}
              className="po-line-chart__dot"
              fill={accentColor}
            />
            <text
              x={point.x}
              y={chart.chartHeight - 6}
              className="po-line-chart__x-label"
              textAnchor="middle"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      {shouldShowValueList ? (
        <ul className="po-line-chart__values">
          {points.map((point) => (
            <li key={point.label} className="po-line-chart__value-item">
              <span className="po-line-chart__value-date">{point.label}</span>
              <span className="po-line-chart__value-amount">
                {point.value.toLocaleString()}
                {unit}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
