import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { ExperienceLevel, Gender } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { recommendationApi } from '@/api';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';

export function RecommendationFormPage() {
  const { machineCode } = useParams<{ machineCode: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('machines');

  const [gender, setGender] = useState<Gender>('male');
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState<number | undefined>(75);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');

  const mutation = useMutation({
    mutationFn: () =>
      recommendationApi.create({
        machineCode: machineCode!,
        gender,
        heightCm,
        weightKg,
        experienceLevel,
      }),
    onSuccess: (res) => {
      navigate(ROUTES.RECOMMEND_RESULT.replace(':machineCode', machineCode!), {
        state: { result: res.data.data },
      });
    },
  });

  return (
    <PageShell title={t('recommend')} subtitle={machineCode}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <label>
          Gender
          <select className="input" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Height (cm)
          <input className="input" type="number" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} />
        </label>
        <label>
          Weight (kg, optional)
          <input className="input" type="number" value={weightKg ?? ''} onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : undefined)} />
        </label>
        <label>
          Experience
          <select className="input" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}>
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
