import type { ReactNode } from 'react';
import { GuideProse } from '@/components/content/GuideProse/GuideProse';
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
            {subtitle ? (
              <div className="page-subtitle">
                <GuideProse text={subtitle} variant="subtitle" />
              </div>
            ) : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
