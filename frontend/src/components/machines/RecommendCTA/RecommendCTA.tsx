import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TargetMuscleGroup } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import { useRecommendMachine } from '@/hooks/useRecommendMachine';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/machines.css';

interface RecommendCTAProps {
  machineCode: string;
  fixed?: boolean;
  initialMuscle?: TargetMuscleGroup | null;
}

export function RecommendCTA({ machineCode, fixed = false, initialMuscle = null }: RecommendCTAProps) {
  const { t } = useTranslation('machines');
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { requestRecommendation, isPending } = useRecommendMachine(machineCode);
  const needsMusclePicker = machineCode.startsWith('FW_');
  const [selectedMuscle, setSelectedMuscle] = useState<TargetMuscleGroup | null>(initialMuscle);

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
                onClick={() => setSelectedMuscle(group)}
              >
                <MuscleGroupIcon group={group} size={22} className="filter-chip__icon" />
                <span>{t(`muscleGroups.${group}`)}</span>
              </button>
            ))}
          </div>
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
