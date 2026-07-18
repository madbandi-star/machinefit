import type { ReactNode } from 'react';

interface HistorySectionHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function HistorySectionHeader({ title, icon, action }: HistorySectionHeaderProps) {
  return (
    <div className="history-section-header">
      <div className="history-section-header__title-wrap">
        {icon ? <span className="history-section-header__icon">{icon}</span> : null}
        <h3 className="history-section-header__title">{title}</h3>
      </div>
      {action ? <div className="history-section-header__action">{action}</div> : null}
    </div>
  );
}
