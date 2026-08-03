import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { useEasyModeStore } from '@/store/easyMode.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/easy-mode.css';

/** Tiny header control — opens Easy mode without the My Page 앱 모드 dialog. */
export function EasyMiniHeaderButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setMode = useEasyModeStore((s) => s.setMode);

  if (!isAuthenticated) return null;

  return (
    <button
      type="button"
      className="easy-mini-header-btn"
      onClick={() => {
        setMode('easy');
        navigate(ROUTES.EASY);
      }}
      aria-label={t('easyMode.openEasyCta')}
      title={t('easyMode.openEasyCta')}
    >
      {t('easyMode.headerMini')}
    </button>
  );
}
