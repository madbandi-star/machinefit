import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { ExperienceLevel, Gender } from '@machinefit/shared';
import {
  cmToFeetInches,
  fromStandardHeight,
  kgToLb,
  toStandardHeight,
  toStandardWeight,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { recommendationApi } from '@/api';
import { useSettingsStore } from '@/store/settings.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';

export function RecommendationFormPage() {
  const { machineCode } = useParams<{ machineCode: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['machines', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const unitHeight = useSettingsStore((s) => s.unitHeight);
  const unitWeight = useSettingsStore((s) => s.unitWeight);

  const [gender, setGender] = useState<Gender>('male');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');

  const [heightCm, setHeightCm] = useState(175);
  const [heightFeet, setHeightFeet] = useState(5);
  const [heightInches, setHeightInches] = useState(9);
  const [weightKg, setWeightKg] = useState<number | undefined>(75);
  const [weightLb, setWeightLb] = useState<number | undefined>(kgToLb(75));

  useEffect(() => {
    const converted = fromStandardHeight(heightCm, unitHeight);
    if (typeof converted === 'object') {
      setHeightFeet(converted.feet);
      setHeightInches(converted.inches);
    }
  }, [unitHeight, heightCm]);

  useEffect(() => {
    if (weightKg != null) {
      setWeightLb(kgToLb(weightKg));
    }
  }, [unitWeight, weightKg]);

  const mutation = useMutation({
    mutationFn: () => {
      const resolvedHeightCm =
        unitHeight === 'cm'
          ? heightCm
          : toStandardHeight(heightFeet, 'ft_in', heightInches);
      const resolvedWeightKg =
        weightKg != null && unitWeight === 'lb' && weightLb != null
          ? toStandardWeight(weightLb, 'lb')
          : weightKg;

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
    const resolvedHeightCm =
      unitHeight === 'cm'
        ? heightCm
        : toStandardHeight(heightFeet, 'ft_in', heightInches);

    if (resolvedHeightCm < 100 || resolvedHeightCm > 250) {
      showToast(t('heightRange', { defaultValue: 'Height must be between 100 and 250 cm' }), 'error');
      return;
    }
    mutation.mutate();
  };

  const handleHeightCmChange = (value: number) => {
    setHeightCm(value);
    const { feet, inches } = cmToFeetInches(value);
    setHeightFeet(feet);
    setHeightInches(inches);
  };

  const handleFeetInchesChange = (feet: number, inches: number) => {
    setHeightFeet(feet);
    setHeightInches(inches);
    setHeightCm(toStandardHeight(feet, 'ft_in', inches));
  };

  return (
    <PageShell title={t('recommend')} subtitle={machineCode}>
      <form
        onSubmit={handleSubmit}
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

        {unitHeight === 'cm' ? (
          <label>
            {t('heightLabel', { defaultValue: 'Height' })} (CM)
            <input
              className="input"
              type="number"
              min={100}
              max={250}
              value={heightCm}
              onChange={(e) => handleHeightCmChange(Number(e.target.value))}
              required
            />
          </label>
        ) : (
          <div className="form-row-group">
            <span className="form-row-group__label">
              {t('heightLabel', { defaultValue: 'Height' })} (FT)
            </span>
            <div className="form-row-group__inputs">
              <label>
                ft
                <input
                  className="input"
                  type="number"
                  min={3}
                  max={8}
                  value={heightFeet}
                  onChange={(e) =>
                    handleFeetInchesChange(Number(e.target.value), heightInches)
                  }
                  required
                />
              </label>
              <label>
                in
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={11}
                  value={heightInches}
                  onChange={(e) =>
                    handleFeetInchesChange(heightFeet, Number(e.target.value))
                  }
                  required
                />
              </label>
            </div>
          </div>
        )}

        <label>
          {t('weightLabel', { defaultValue: 'Weight' })}{' '}
          ({unitWeight === 'kg' ? 'KG' : 'LB'}, optional)
          <input
            className="input"
            type="number"
            value={unitWeight === 'kg' ? (weightKg ?? '') : (weightLb ?? '')}
            onChange={(e) => {
              if (!e.target.value) {
                setWeightKg(undefined);
                setWeightLb(undefined);
                return;
              }
              const value = Number(e.target.value);
              if (unitWeight === 'kg') {
                setWeightKg(value);
                setWeightLb(kgToLb(value));
              } else {
                setWeightLb(value);
                setWeightKg(toStandardWeight(value, 'lb'));
              }
            }}
          />
        </label>

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
