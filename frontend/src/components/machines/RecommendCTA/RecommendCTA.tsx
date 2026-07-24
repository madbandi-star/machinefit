import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole, type TargetMuscleGroup } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import { useRecommendMachine } from '@/hooks/useRecommendMachine';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/machines.css';
import '@/styles/trade.css';

interface RecommendCTAProps {
  machineCode: string;
  fixed?: boolean;
  initialMuscle?: TargetMuscleGroup | null;
}

export function RecommendCTA({ machineCode, fixed = false, initialMuscle = null }: RecommendCTAProps) {
  const { t } = useTranslation('machines');
  const { t: tt } = useTranslation('trade');
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { requestRecommendation, isPending } = useRecommendMachine(machineCode);
  const needsMusclePicker = machineCode.startsWith('FW_');
  const [selectedMuscle, setSelectedMuscle] = useState<TargetMuscleGroup | null>(initialMuscle);
  const canTrade = isAuthenticated && hasMinRole(user?.roleCode, Role.OWNER);

  useEffect(() => {
    setSelectedMuscle(initialMuscle);
  }, [initialMuscle, machineCode]);

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }

    if (needsMusclePicker && !selectedMuscle) {
      showToast(t('targetMuscleRequired'), 'error');
      return;
    }

    requestRecommendation(
      needsMusclePicker && selectedMuscle ? { targetMuscleGroup: selectedMuscle } : undefined
    );
  };

  return (
    <div className={`recommend-cta${fixed ? ' recommend-cta--fixed' : ''}`}>
      {needsMusclePicker ? (
        <div className="recommend-cta__muscle-picker" role="group" aria-label={t('targetMuscleLabel')}>
          <p className="recommend-cta__muscle-label">{t('targetMuscleLabel')}</p>
          <div className="filter-chips recommend-cta__muscle-chips">
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                className={`filter-chip${selectedMuscle === group ? ' filter-chip--active' : ''}`}
                onClick={() =>
                  setSelectedMuscle((prev) => (prev === group ? null : group))
                }
              >
                <MuscleGroupIcon group={group} size={22} className="filter-chip__icon" />
                <span>{t(`muscleGroups.${group}`)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {canTrade ? (
        <div className="trade-cta-row" role="group" aria-label={tt('ownerSection')}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() =>
              navigate(`${ROUTES.TRADE_SELL_WRITE}?machineCode=${encodeURIComponent(machineCode)}`)
            }
          >
            {tt('sell')}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() =>
              navigate(`${ROUTES.TRADE_BUY_WRITE}?machineCode=${encodeURIComponent(machineCode)}`)
            }
          >
            {tt('buy')}
          </button>
        </div>
      ) : null}
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
