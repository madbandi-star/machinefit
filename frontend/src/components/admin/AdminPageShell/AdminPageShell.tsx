import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AdminPageShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Optional back link shown above the title (e.g. admin home). */
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
};

export function AdminPageShell({
  title,
  subtitle,
  actions,
  backTo,
  backLabel,
  children,
}: AdminPageShellProps) {
  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__heading">
          {backTo && backLabel ? (
            <Link to={backTo} className="admin-page__back">
              <span aria-hidden="true">←</span>
              {backLabel}
            </Link>
          ) : null}
          <h1 className="admin-page__title">{title}</h1>
          {subtitle ? <p className="admin-page__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="admin-page__actions">{actions}</div> : null}
      </header>
      <div className="admin-page__body admin-page__body--stack">{children}</div>
    </div>
  );
}
