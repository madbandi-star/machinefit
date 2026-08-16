import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole, type TargetMuscleGroup } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { ScrollCarousel } from '@/components/navigation/ScrollCarousel/ScrollCarousel';
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
  /** When true (FW detail), muscle chip selection syncs to `?muscle=` so the hero cover updates. */
  syncMuscleToUrl?: boolean;
  /** Forwarded through recommend → result for workout plan creation. */
  planDate?: string | null;
  /** Hide the primary recommend CTA (e.g. future-date plan add flow). */
  showRecommendButton?: boolean;
  /** Hide sell/buy owner actions under the CTA. */
  showTradeActions?: boolean;
}

export function RecommendCTA({
  machineCode,
  fixed = false,
  initialMuscle = null,
  syncMuscleToUrl = false,
  planDate = null,
  showRecommendButton = true,
  showTradeActions = true,
}: RecommendCTAProps) {
  const { t } = useTranslation('machines');
  const { t: tt } = useTranslation('trade');
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
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

  const selectMuscle = (group: TargetMuscleGroup) => {
    const next = selectedMuscle === group ? null : group;
    setSelectedMuscle(next);
    if (!syncMuscleToUrl) return;
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next) params.set('muscle', next);
        else params.delete('muscle');
        return params;
      },
      { replace: true }
    );
  };

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
      needsMusclePicker && selectedMuscle
        ? { targetMuscleGroup: selectedMuscle, planDate: planDate ?? undefined }
        : { planDate: planDate ?? undefined }
    );
  };

  return (
    <div className={`recommend-cta${fixed ? ' recommend-cta--fixed' : ''}`}>
      {needsMusclePicker ? (
        <div className="recommend-cta__muscle-picker" role="group" aria-label={t('targetMuscleLabel')}>
          <p className="recommend-cta__muscle-label">{t('targetMuscleLabel')}</p>
          <ScrollCarousel
            className="filter-chips-scroller chip-carousel"
            scrollerClassName="filter-chips recommend-cta__muscle-chips"
          >
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                className={`filter-chip${selectedMuscle === group ? ' filter-chip--active' : ''}`}
                onClick={() => selectMuscle(group)}
                aria-pressed={selectedMuscle === group}
              >
                <MuscleGroupIcon group={group} size={22} className="filter-chip__icon" />
                <span>{t(`muscleGroups.${group}`)}</span>
              </button>
            ))}
          </ScrollCarousel>
        </div>
      ) : null}
      {showTradeActions && canTrade ? (
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
      {showRecommendButton ? (
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
      ) : null}
    </div>
  );
}
