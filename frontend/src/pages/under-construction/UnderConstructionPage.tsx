import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { Seo } from '@/seo/Seo';
import '@/styles/auth.css';

/**
 * Soft-launch gate: authenticated users not on the allowlist land here.
 */
export function UnderConstructionPage() {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const title = t('underConstruction.title', {
    defaultValue: '서비스 준비 중',
  });
  const body = t('underConstruction.body', {
    defaultValue:
      '머신핏은 현재 초대된 계정만 이용할 수 있습니다. 허용된 아이디로 다시 로그인해 주세요.',
  });

  return (
    <PageShell title={title}>
      <Seo title={title} description={body} path="/under-construction" robots="noindex,nofollow" />
      <div className="under-construction">
        <p className="under-construction__eyebrow" aria-hidden>
          UNDER CONSTRUCTION
        </p>
        <h1 className="under-construction__title">{title}</h1>
        <p className="under-construction__body">{body}</p>
        {user?.displayName ? (
          <p className="under-construction__account">
            {t('underConstruction.currentAccount', {
              defaultValue: '현재 로그인',
            })}
            {': '}
            <strong>{user.displayName}</strong>
          </p>
        ) : null}
        <div className="under-construction__actions">
          {isAuthenticated ? (
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => {
                clearAuth();
                window.location.assign(`${import.meta.env.BASE_URL.replace(/\/$/, '')}${ROUTES.LOGIN}`);
              }}
            >
              {t('underConstruction.switchAccount', {
                defaultValue: '다른 아이디로 로그인',
              })}
            </button>
          ) : (
            <Link to={ROUTES.LOGIN} className="btn btn--primary btn--block">
              {t('nav.login', { defaultValue: '로그인' })}
            </Link>
          )}
        </div>
      </div>
    </PageShell>
  );
}
