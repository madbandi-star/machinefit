import { useTranslation } from 'react-i18next';
import type { ExperienceLevel } from '@machinefit/shared';
import { SegmentedControl } from '@/components/form/SegmentedControl/SegmentedControl';
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
    <div className={invalid ? 'form-row form-row--invalid' : 'form-row'}>
      <span className="form-row__label">{t('auth.experienceLevel')}</span>
      {allowEmpty && !value ? (
        <p className="form-section__desc">{t('auth.experienceLevelPlaceholder')}</p>
      ) : null}
      <SegmentedControl
        value={value}
        options={EXPERIENCE_LEVELS.map((level) => ({
          value: level,
          label: t(`auth.experienceLevels.${level}`),
        }))}
        onChange={onChange}
        ariaLabel={t('auth.experienceLevel')}
      />
    </div>
  );
}
