import { useTranslation } from 'react-i18next';
import type { WeightRecommendationBasis } from '@machinefit/shared';
import { useUserUnits } from '@/hooks/useUserUnits';
import '@/styles/components.css';
import '@/styles/recommendation.css';

interface WeightBasisDialogProps {
  open: boolean;
  basis: WeightRecommendationBasis;
  onClose: () => void;
}

function translateParam(
  tCommon: (key: string) => string,
  key: string,
  value: string | number
): string | number {
  if (key === 'gender' && typeof value === 'string') {
    return tCommon(`auth.genders.${value}`);
  }
  if (key === 'experienceLevel' && typeof value === 'string') {
    return tCommon(`auth.experienceLevels.${value}`);
  }
  return value;
}

export function WeightBasisDialog({ open, basis, onClose }: WeightBasisDialogProps) {
  const { t } = useTranslation('machines');
  const { t: tCommon } = useTranslation('common');
  const { formatWeight } = useUserUnits();

  if (!open) return null;

  return (
    <div className="dialog-overlay" role="presentation" onClick={onClose}>
      <div
        className="dialog card weight-basis-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="weight-basis-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="weight-basis-dialog-title" className="weight-basis-dialog__title">
          {t('weightBasis.dialogTitle')}
        </h3>
        {basis.finalWeightKg != null && (
          <p className="weight-basis-dialog__summary">
            {t('weightBasis.finalWeight', {
              weight: formatWeight(basis.finalWeightKg),
            })}
          </p>
        )}
        <ul className="weight-basis-dialog__list">
          {basis.entries.map((entry) => {
            const params = entry.params
              ? Object.fromEntries(
                  Object.entries(entry.params).map(([key, value]) => [
                    key,
                    translateParam(tCommon, key, value),
                  ])
                )
              : undefined;

            return (
              <li
                key={entry.id}
                className={`weight-basis-dialog__item${entry.usedInFinal ? ' weight-basis-dialog__item--primary' : ''}`}
              >
                <div className="weight-basis-dialog__item-header">
                  <span className="weight-basis-dialog__item-title">{t(entry.titleKey)}</span>
                  {entry.valueKg != null && (
                    <span className="weight-basis-dialog__item-value">
                      {formatWeight(entry.valueKg)}
                    </span>
                  )}
                </div>
                <p className="weight-basis-dialog__item-desc">{t(entry.descriptionKey, params)}</p>
                {entry.usedInFinal && (
                  <span className="weight-basis-dialog__item-badge">{t('weightBasis.usedInFinal')}</span>
                )}
              </li>
            );
          })}
        </ul>
        <button type="button" className="btn btn--secondary btn--block" onClick={onClose}>
          {tCommon('actions.cancel')}
        </button>
      </div>
    </div>
  );
}
