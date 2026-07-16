import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { ExperienceLevel, Gender } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BodyMetricsFields } from '@/components/settings/BodyMetricsFields/BodyMetricsFields';
import { recommendationApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';

export function RecommendationFormPage() {
  const { machineCode } = useParams<{ machineCode: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['machines', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const unitHeight = useSettingsStore((s) => s.unitHeight);
  const unitWeight = useSettingsStore((s) => s.unitWeight);

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    user?.experienceLevel ?? 'intermediate'
  );
  const [heightCm, setHeightCm] = useState(user?.heightCm ?? 175);
  const [weightKg, setWeightKg] = useState<number | undefined>(user?.weightKg);
  const profileInitialized = useRef(false);

  useEffect(() => {
    if (profileInitialized.current || !user) return;
    profileInitialized.current = true;
    if (user.heightCm != null) setHeightCm(user.heightCm);
    setWeightKg(user.weightKg);
    if (user.experienceLevel) setExperienceLevel(user.experienceLevel);
  }, [user]);

  const gender: Gender = user?.gender ?? 'male';

  const mutation = useMutation({
    mutationFn: () => {
      const resolvedHeightCm = heightCm;
      const resolvedWeightKg = weightKg;

      return recommendationApi.create({
        machineCode: machineCode!,
        gender,
        heightCm: resolvedHeightCm,
        weightKg: resolvedWeightKg,
        experienceLevel,
        unitHeight,
        unitWeight,
      });
    },
    onSuccess: (res) => {
      const id = res.data.data.id;
      navigate(`${ROUTES.RECOMMEND_RESULT.replace(':machineCode', machineCode!)}?id=${id}`, {
        state: { result: res.data.data },
      });
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (heightCm < 100 || heightCm > 250) {
      showToast(t('heightRange', { defaultValue: 'Height must be between 100 and 250 cm' }), 'error');
      return;
    }
    mutation.mutate();
  };

  return (
    <PageShell title={t('recommend')} subtitle={machineCode}>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <BodyMetricsFields
          unitHeight={unitHeight}
          unitWeight={unitWeight}
          heightCm={heightCm}
          weightKg={weightKg}
          onHeightCmChange={setHeightCm}
          onWeightKgChange={setWeightKg}
        />

        <label>
          Experience
          <select
            className="input"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="professional">Professional</option>
          </select>
        </label>
        <button type="submit" className="btn btn--primary btn--block" disabled={mutation.isPending}>
          {mutation.isPending ? '...' : t('recommend')}
        </button>
      </form>
    </PageShell>
  );
}
