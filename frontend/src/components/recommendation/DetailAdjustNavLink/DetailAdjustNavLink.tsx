import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import '@/styles/components.css';
import '@/styles/records.css';

interface DetailAdjustNavLinkProps {
  to: string;
  children: ReactNode;
  /** Accessible name for the settings tile hit area. */
  ariaLabel?: string;
}

/**
 * Wraps recommendation setting tiles (weight → ROM).
 * Clicking a tile opens a help dialog, then navigates to the detail-adjust
 * (recommendation result) page on confirm.
 */
export function DetailAdjustNavLink({ to, children, ariaLabel }: DetailAdjustNavLinkProps) {
  const { t } = useTranslation('machines');
  const navigate = useNavigate();
  const [hintOpen, setHintOpen] = useState(false);
  const dialogRef = useModalAccessibility({
    open: hintOpen,
    onClose: () => setHintOpen(false),
  });

  const openHint = (event: MouseEvent | KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setHintOpen(true);
  };

  const goToDetailAdjust = () => {
    setHintOpen(false);
    navigate(to);
  };

  return (
    <>
      <div
        className="history-record-card__settings-link"
        role="link"
        tabIndex={0}
        aria-label={ariaLabel ?? t('recommendation.detailAdjustHintTitle')}
        onClick={openHint}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            openHint(event);
          }
        }}
      >
        {children}
        <p className="recommendation-settings-panel__nav-hint" role="note">
          {t('recommendation.detailAdjustNavHint')}
        </p>
      </div>

      {hintOpen ? (
        <div
          className="dialog-overlay"
          role="presentation"
          onClick={() => setHintOpen(false)}
        >
          <div
            ref={dialogRef}
            className="dialog card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="detail-adjust-hint-title"
            aria-describedby="detail-adjust-hint-message"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="detail-adjust-hint-title" className="dialog__title">
              {t('recommendation.detailAdjustHintTitle')}
            </h3>
            <p id="detail-adjust-hint-message" className="dialog__message">
              {t('recommendation.detailAdjustHintMessage')}
            </p>
            <div className="dialog__actions">
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={goToDetailAdjust}
              >
                {t('recommendation.detailAdjustHintConfirm')}
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--block"
                onClick={() => setHintOpen(false)}
              >
                {t('recommendation.detailAdjustHintDismiss')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
