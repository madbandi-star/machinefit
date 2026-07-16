import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icons/Icon';
import '@/styles/components.css';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  hint?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, title, hint, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`empty-state${compact ? ' empty-state--compact' : ''}`}>
      {icon && (
        <div className="empty-state__icon" aria-hidden>
          <Icon name={icon} size={compact ? 28 : 36} />
        </div>
      )}
      <p className="empty-state__title">{title}</p>
      {hint && <p className="empty-state__hint">{hint}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
