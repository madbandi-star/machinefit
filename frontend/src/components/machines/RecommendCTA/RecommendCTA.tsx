import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRecommendMachine } from '@/hooks/useRecommendMachine';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/machines.css';

interface RecommendCTAProps {
  machineCode: string;
}

export function RecommendCTA({ machineCode }: RecommendCTAProps) {
  const { t } = useTranslation('machines');
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { requestRecommendation, isPending } = useRecommendMachine(machineCode);

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }
    requestRecommendation();
  };

  return (
    <div className="recommend-cta">
      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending
          ? t('recommendLoading')
          : isAuthenticated
            ? t('recommend')
            : t('recommendLogin')}
      </button>
    </div>
  );
}
