import type { ReactNode } from 'react';

interface HistorySectionHeaderProps {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function HistorySectionHeader({ title, icon, action }: HistorySectionHeaderProps) {
  const showTitle = Boolean(title || icon);
  if (!showTitle && !action) return null;

  return (
    <div className="history-section-header">
      {showTitle ? (
        <div className="history-section-header__title-wrap">
          {icon ? <span className="history-section-header__icon">{icon}</span> : null}
          {title ? <h3 className="history-section-header__title">{title}</h3> : null}
        </div>
      ) : null}
      {action ? <div className="history-section-header__action">{action}</div> : null}
    </div>
  );
}
