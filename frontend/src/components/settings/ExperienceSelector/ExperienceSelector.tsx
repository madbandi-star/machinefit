import { useTranslation } from 'react-i18next';
import type { ExperienceLevel } from '@machinefit/shared';
import '@/styles/components.css';

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
  'professional',
];

interface ExperienceSelectorProps {
  value: ExperienceLevel | undefined;
  onChange: (value: ExperienceLevel | undefined) => void;
  allowEmpty?: boolean;
  invalid?: boolean;
}

export function ExperienceSelector({
  value,
  onChange,
  allowEmpty = false,
  invalid = false,
}: ExperienceSelectorProps) {
  const { t } = useTranslation();

  return (
    <label>
      {t('auth.experienceLevel')}
      <select
        className={`input${invalid ? ' input--invalid' : ''}`}
        value={value ?? ''}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next ? (next as ExperienceLevel) : undefined);
        }}
      >
        {allowEmpty && (
          <option value="">{t('auth.experienceLevelPlaceholder')}</option>
        )}
        {EXPERIENCE_LEVELS.map((level) => (
          <option key={level} value={level}>
            {t(`auth.experienceLevels.${level}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
