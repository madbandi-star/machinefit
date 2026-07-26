import type { ReactNode } from 'react';
import '@/styles/components.css';

interface PageShellProps {
  title?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export function PageShell({ title, subtitle, action, children }: PageShellProps) {
  const showHeader = title || subtitle || action;

  return (
    <section>
      {showHeader && (
        <div
          className={`page-shell__header${subtitle ? '' : ' page-shell__header--no-subtitle'}`}
        >
          <div>
            {title != null && title !== false && title !== '' ? (
              typeof title === 'string' ? (
                <h1 className="page-title">{title}</h1>
              ) : (
                title
              )
            ) : null}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
