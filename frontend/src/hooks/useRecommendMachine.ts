import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { ExperienceLevel, Gender, RecommendationInput } from '@machinefit/shared';
import { recommendationApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';

function buildProfileInput(machineCode: string): RecommendationInput | null {
  const user = useAuthStore.getState().user;
  const { unitHeight, unitWeight } = useSettingsStore.getState();

  const heightCm = user?.heightCm;
  if (heightCm == null || heightCm < 100 || heightCm > 250) {
    return null;
  }

  const gender: Gender = user?.gender ?? 'male';
  const experienceLevel: ExperienceLevel = user?.experienceLevel ?? 'intermediate';

  return {
    machineCode,
    gender,
    heightCm,
    weightKg: user?.weightKg,
    experienceLevel,
    unitHeight,
    unitWeight,
  };
}

export function useRecommendMachine(machineCode: string | undefined) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const showToast = useUIStore((s) => s.showToast);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!machineCode) throw new Error('missing_machine');
      const input = buildProfileInput(machineCode);
      if (!input) throw new Error('missing_profile');
      const res = await recommendationApi.create(input);
      return res.data.data;
    },
    onSuccess: (result) => {
      navigate(
        `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', result.machineCode)}?id=${result.id}`,
        { state: { result }, replace: true }
      );
    },
    onError: (error: unknown) => {
      if (error instanceof Error && error.message === 'missing_profile') {
        showToast(t('auth.profileRequiredForRecommend'), 'error');
        navigate(ROUTES.SETTINGS);
        return;
      }
      showToast(t('errors.submitFailed'), 'error');
    },
  });

  return {
    requestRecommendation: mutation.mutate,
    isPending: mutation.isPending,
  };
}
