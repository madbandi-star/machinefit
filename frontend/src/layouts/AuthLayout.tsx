import { Outlet, useLocation } from 'react-router-dom';
import { LegalFooter } from '@/components/layout/LegalFooter/LegalFooter';
import { ROUTES } from '@/constants/routes';
import '@/styles/layout.css';
import '@/styles/auth.css';
import '@/styles/legal.css';

export function AuthLayout() {
  const location = useLocation();
  const isLanding = location.pathname === ROUTES.LOGIN;
  const isTerms = location.pathname === ROUTES.AUTH_TERMS;

  return (
    <div
      className={`layout${isLanding ? ' layout--auth-landing' : ''}${
        isTerms ? ' layout--terms-agree' : ''
      }`}
    >
      <main className="layout__main layout__main--auth">
        <div
          className={`layout__content layout__content--auth${
            isLanding ? ' layout__content--auth-landing' : ''
          }${isTerms ? ' layout__content--terms-agree' : ''}`}
        >
          <Outlet />
        </div>
        <LegalFooter compact />
      </main>
    </div>
  );
}
