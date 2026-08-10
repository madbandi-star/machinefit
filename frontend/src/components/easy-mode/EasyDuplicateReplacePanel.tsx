import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EasyDuplicateReplacePanelProps {
  pending?: boolean;
  onReplace: () => void;
  onPickAnother?: () => void;
  onGoRecords?: () => void;
  /** Compact footer layout inside the machine picker. */
  compact?: boolean;
}

export function EasyDuplicateReplacePanel({
  pending = false,
  onReplace,
  onPickAnother,
  onGoRecords,
  compact = false,
}: EasyDuplicateReplacePanelProps) {
  const { t } = useTranslation();

  return (
    <div className={`easy-dup${compact ? ' easy-dup--compact' : ''}`}>
      <div className="easy-dup__callout" role="status">
        <p className="easy-dup__eyebrow">{t('easyMode.duplicateEyebrow')}</p>
        <p className="easy-dup__title">{t('easyMode.duplicateTitle')}</p>
        <p className="easy-dup__body">{t('easyMode.duplicateBody')}</p>
      </div>

      <button
        type="button"
        className="easy-btn easy-btn--primary easy-dup__cta"
        onClick={onReplace}
        disabled={pending}
      >
        <Trash2 className="easy-dup__cta-icon" aria-hidden strokeWidth={2.5} />
        <span className="easy-dup__cta-text">
          <strong>
            {pending ? t('easyMode.duplicateWorking') : t('easyMode.duplicateReplace')}
          </strong>
          <span>{t('easyMode.duplicateReplaceHint')}</span>
        </span>
      </button>

      {onPickAnother || onGoRecords ? (
        <div className="easy-dup__secondary">
          {onPickAnother ? (
            <button
              type="button"
              className="easy-btn easy-btn--secondary"
              onClick={onPickAnother}
              disabled={pending}
            >
              {t('easyMode.pickerReselect')}
            </button>
          ) : null}
          {onGoRecords ? (
            <button
              type="button"
              className="easy-btn easy-btn--ghost"
              onClick={onGoRecords}
              disabled={pending}
            >
              {t('easyMode.pickerGoRecords')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
