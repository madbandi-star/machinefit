import { useTranslation } from 'react-i18next';
import {
  WEIGHT_DIFFICULTY_DEFAULT,
  WEIGHT_DIFFICULTY_MAX,
  WEIGHT_DIFFICULTY_MIN,
  WEIGHT_DIFFICULTY_STEP,
} from '@machinefit/shared';
import { useSettingsStore } from '@/store/settings.store';

function formatMultiplier(value: number): string {
  if (value === 1) return '100%';
  const pct = Math.round(value * 100);
  return `${pct}%`;
}

export function WeightDifficultySlider() {
  const { t } = useTranslation('common');
  const weightDifficulty = useSettingsStore((s) => s.weightDifficulty);
  const setWeightDifficulty = useSettingsStore((s) => s.setWeightDifficulty);

  const isDefault = weightDifficulty === WEIGHT_DIFFICULTY_DEFAULT;

  return (
    <div className="weight-difficulty-slider">
      <div className="weight-difficulty-slider__header">
        <span className="weight-difficulty-slider__value" aria-live="polite">
          {formatMultiplier(weightDifficulty)}
        </span>
        {!isDefault && (
          <button
            type="button"
            className="weight-difficulty-slider__reset"
            onClick={() => setWeightDifficulty(WEIGHT_DIFFICULTY_DEFAULT)}
          >
            {t('settings.weightDifficultyReset')}
          </button>
        )}
      </div>

      <div className="weight-difficulty-slider__track-wrap">
        <input
          type="range"
          className="weight-difficulty-slider__input"
          min={WEIGHT_DIFFICULTY_MIN}
          max={WEIGHT_DIFFICULTY_MAX}
          step={WEIGHT_DIFFICULTY_STEP}
          value={weightDifficulty}
          onChange={(e) => setWeightDifficulty(parseFloat(e.target.value))}
          aria-label={t('settings.weightDifficulty')}
          aria-valuemin={WEIGHT_DIFFICULTY_MIN}
          aria-valuemax={WEIGHT_DIFFICULTY_MAX}
          aria-valuenow={weightDifficulty}
          aria-valuetext={formatMultiplier(weightDifficulty)}
        />
        <div
          className="weight-difficulty-slider__fill"
          style={{
            width: `${((weightDifficulty - WEIGHT_DIFFICULTY_MIN) / (WEIGHT_DIFFICULTY_MAX - WEIGHT_DIFFICULTY_MIN)) * 100}%`,
          }}
          aria-hidden
        />
        <div
          className="weight-difficulty-slider__marker weight-difficulty-slider__marker--default"
          style={{
            left: `${((WEIGHT_DIFFICULTY_DEFAULT - WEIGHT_DIFFICULTY_MIN) / (WEIGHT_DIFFICULTY_MAX - WEIGHT_DIFFICULTY_MIN)) * 100}%`,
          }}
          aria-hidden
        />
      </div>

      <div className="weight-difficulty-slider__labels" aria-hidden>
        <span>{t('settings.weightDifficultyLight')}</span>
        <span className="weight-difficulty-slider__label-center">
          {t('settings.weightDifficultyDefault')}
        </span>
        <span>{t('settings.weightDifficultyHeavy')}</span>
      </div>

      <p className="weight-difficulty-slider__hint">
        {isDefault
          ? t('settings.weightDifficultyHintDefault')
          : t('settings.weightDifficultyHintScaled', { percent: formatMultiplier(weightDifficulty) })}
      </p>
    </div>
  );
}
