import { useTranslation } from 'react-i18next';
import type { Gender } from '@machinefit/shared';
import '@/styles/home.css';

const GENDERS: Gender[] = ['male', 'female', 'other'];

interface GenderPickerProps {
  value: Gender | undefined;
  onChange: (value: Gender) => void;
}

export function GenderPicker({ value, onChange }: GenderPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="gender-picker">
      <span className="gender-picker__label">{t('auth.gender')}</span>
      <div className="gender-picker__options" role="group" aria-label={t('auth.gender')}>
        {GENDERS.map((gender) => (
          <button
            key={gender}
            type="button"
            className={`gender-picker__option${value === gender ? ' gender-picker__option--active' : ''}`}
            aria-pressed={value === gender}
            onClick={() => onChange(gender)}
          >
            {t(`auth.genders.${gender}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
