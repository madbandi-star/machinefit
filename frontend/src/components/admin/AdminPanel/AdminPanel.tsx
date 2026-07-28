import type { ReactNode } from 'react';

type AdminPanelProps = {
  title?: string;
  desc?: string;
  count?: number;
  countLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminPanel({
  title,
  desc,
  count,
  countLabel,
  actions,
  children,
  className,
}: AdminPanelProps) {
  const showHead = title || desc || count != null || actions;

  return (
    <section className={`admin-panel admin-data-panel${className ? ` ${className}` : ''}`}>
      {showHead ? (
        <header className="admin-data-panel__head">
          <div className="admin-data-panel__titles">
            {title ? <h2 className="admin-panel__title">{title}</h2> : null}
            {desc ? <p className="admin-panel__desc">{desc}</p> : null}
          </div>
          <div className="admin-data-panel__meta">
            {count != null ? (
              <span className="admin-count-badge">{countLabel ?? count}</span>
            ) : null}
            {actions}
          </div>
        </header>
      ) : null}
      {children}
    </section>
  );
}
