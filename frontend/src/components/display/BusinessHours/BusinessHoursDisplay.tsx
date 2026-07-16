import type { BusinessHours } from '@machinefit/shared';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

interface BusinessHoursDisplayProps {
  hours?: BusinessHours;
}

export function BusinessHoursDisplay({ hours }: BusinessHoursDisplayProps) {
  if (!hours) return <p style={{ color: 'var(--color-text-muted)' }}>Hours not available</p>;

  return (
    <dl className="hours-grid">
      {DAY_KEYS.map((day) => {
        const schedule = hours[day];
        if (!schedule) return null;
        return (
          <div key={day} style={{ display: 'contents' }}>
            <dt>{day}</dt>
            <dd>
              {schedule.closed
                ? 'Closed'
                : `${schedule.open} – ${schedule.close}`}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
