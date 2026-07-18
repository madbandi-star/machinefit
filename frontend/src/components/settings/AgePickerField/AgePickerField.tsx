import { useTranslation } from 'react-i18next';
import { ScrollPicker } from '@/components/form/ScrollPicker/ScrollPicker';
import '@/styles/components.css';

interface AgePickerFieldProps {
  value: number | undefined;
  onChange: (value: number) => void;
  invalid?: boolean;
  initializeOnMount?: boolean;
}

export function AgePickerField({
  value,
  onChange,
  invalid = false,
  initializeOnMount = false,
}: AgePickerFieldProps) {
  const { t } = useTranslation();

  return (
    <div className={`body-metrics-picker${invalid ? ' body-metrics-picker--invalid' : ''}`}>
      <span className="body-metrics-picker__label">{t('auth.ageLabel')}</span>
      <ScrollPicker
        value={value}
        onChange={onChange}
        min={13}
        max={100}
        step={1}
        defaultValue={30}
        initializeOnMount={initializeOnMount}
        ariaLabel={t('auth.ageLabel')}
      />
    </div>
  );
}
