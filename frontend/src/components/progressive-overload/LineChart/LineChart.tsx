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
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 160;
const PADDING = { top: 16, right: 12, bottom: 28, left: 36 };

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
}: LineChartProps) {
  const chart = useMemo(() => {
    if (points.length === 0) return null;

    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const values = points.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    const plotPoints = points.map((point, index) => {
      const x =
        points.length === 1
          ? PADDING.left + innerWidth / 2
          : PADDING.left + (index / (points.length - 1)) * innerWidth;
      const normalized = (point.value - minValue) / valueRange;
      const y = PADDING.top + innerHeight - normalized * innerHeight;
      return { x, y, label: point.label, value: point.value };
    });

    const regressionInput = points.map((point, index) => ({ x: index, y: point.value }));
    const trend = linearRegression(regressionInput);
    const trendStartY =
      PADDING.top +
      innerHeight -
      ((trend.intercept - minValue) / valueRange) * innerHeight;
    const trendEndY =
      PADDING.top +
      innerHeight -
      ((trend.intercept + trend.slope * (points.length - 1) - minValue) / valueRange) * innerHeight;

    return {
      plotPoints,
      linePath: buildPath(plotPoints),
      trendPath:
        points.length >= 2
          ? `M ${plotPoints[0].x.toFixed(2)} ${trendStartY.toFixed(2)} L ${plotPoints[plotPoints.length - 1].x.toFixed(2)} ${trendEndY.toFixed(2)}`
          : '',
      minValue,
      maxValue,
    };
  }, [points]);

  if (!chart) return null;

  return (
    <div className="po-line-chart" role="img" aria-label={ariaLabel}>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="po-line-chart__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1={PADDING.left}
          y1={CHART_HEIGHT - PADDING.bottom}
          x2={CHART_WIDTH - PADDING.right}
          y2={CHART_HEIGHT - PADDING.bottom}
          className="po-line-chart__axis"
        />
        <text
          x={PADDING.left - 6}
          y={PADDING.top + 4}
          className="po-line-chart__axis-label"
          textAnchor="end"
        >
          {Math.round(chart.maxValue)}
        </text>
        <text
          x={PADDING.left - 6}
          y={CHART_HEIGHT - PADDING.bottom}
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
              r={4}
              className="po-line-chart__dot"
              fill={accentColor}
            />
            <text
              x={point.x}
              y={CHART_HEIGHT - 8}
              className="po-line-chart__x-label"
              textAnchor="middle"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>

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
    </div>
  );
}
