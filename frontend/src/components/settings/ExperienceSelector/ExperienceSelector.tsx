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
  value: ExperienceLevel;
  onChange: (value: ExperienceLevel) => void;
}

export function ExperienceSelector({ value, onChange }: ExperienceSelectorProps) {
  const { t } = useTranslation();

  return (
    <label>
      {t('auth.experienceLevel')}
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value as ExperienceLevel)}
        required
      >
        {EXPERIENCE_LEVELS.map((level) => (
          <option key={level} value={level}>
            {t(`auth.experienceLevels.${level}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
