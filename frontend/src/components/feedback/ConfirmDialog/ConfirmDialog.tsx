import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dismissForToday } from '@/utils/dismissToday';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import '@/styles/components.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  dismissTodayKey?: string;
  dismissTodayLabel?: string;
  /** When true (default for danger), backdrop click does not dismiss. */
  preventBackdropClose?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'primary',
  dismissTodayKey,
  dismissTodayLabel,
  preventBackdropClose,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [dismissToday, setDismissToday] = useState(false);
  const blockBackdrop =
    preventBackdropClose ?? confirmVariant === 'danger';
  const dialogRef = useModalAccessibility({ open, onClose });
  const isDanger = confirmVariant === 'danger';

  if (!open) return null;

  const handleConfirm = () => {
    if (dismissToday && dismissTodayKey) {
      dismissForToday(dismissTodayKey);
    }
    onConfirm();
    setDismissToday(false);
  };

  const handleClose = () => {
    setDismissToday(false);
    onClose();
  };

  const resolvedConfirm = confirmLabel ?? t('common:actions.confirm');
  const resolvedCancel = cancelLabel ?? t('common:actions.cancel');

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onClick={blockBackdrop ? undefined : handleClose}
    >
      <div
        ref={dialogRef}
        className={`dialog card${isDanger ? ' dialog--danger' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        {isDanger ? (
          <div className="dialog__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </div>
        ) : null}
        <h3 id="confirm-dialog-title" className="dialog__title">
          {title}
        </h3>
        <p id="confirm-dialog-message" className="dialog__message">
          {message}
        </p>
        {dismissTodayKey ? (
          <label className="checkbox-label dialog__dismiss">
            <input
              type="checkbox"
              checked={dismissToday}
              onChange={(e) => setDismissToday(e.target.checked)}
            />
            <span>{dismissTodayLabel ?? t('common:dismissToday')}</span>
          </label>
        ) : null}
        <div className="dialog__actions">
          {isDanger ? (
            <>
              <button type="button" className="btn btn--secondary btn--block" onClick={handleClose}>
                {resolvedCancel}
              </button>
              <button type="button" className="btn btn--danger btn--block" onClick={handleConfirm}>
                {resolvedConfirm}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn--block btn--primary" onClick={handleConfirm}>
                {resolvedConfirm}
              </button>
              <button type="button" className="btn btn--secondary btn--block" onClick={handleClose}>
                {resolvedCancel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
