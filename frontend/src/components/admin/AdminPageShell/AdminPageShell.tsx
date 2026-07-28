import type { ReactNode } from 'react';

type AdminPageShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageShell({ title, subtitle, actions, children }: AdminPageShellProps) {
  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__heading">
          <h1 className="admin-page__title">{title}</h1>
          {subtitle ? <p className="admin-page__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="admin-page__actions">{actions}</div> : null}
      </header>
      <div className="admin-page__body">{children}</div>
    </div>
  );
}
