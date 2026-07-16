import type { ReactNode } from 'react';
import '@/styles/components.css';

interface PageShellProps {
  title?: string;
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
            {title && <h1 className="page-title">{title}</h1>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
