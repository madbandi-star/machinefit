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

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onClick={blockBackdrop ? undefined : handleClose}
    >
      <div
        ref={dialogRef}
        className="dialog card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="dialog__title">
          {title}
        </h3>
        <p className="dialog__message">{message}</p>
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
          <button
            type="button"
            className={`btn btn--block ${confirmVariant === 'danger' ? 'btn--danger' : 'btn--primary'}`}
            onClick={handleConfirm}
          >
            {confirmLabel ?? t('common:actions.confirm')}
          </button>
          <button type="button" className="btn btn--secondary btn--block" onClick={handleClose}>
            {cancelLabel ?? t('common:actions.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
