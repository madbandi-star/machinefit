import { useTranslation } from 'react-i18next';
import '@/styles/components.css';

interface AlertDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
}

export function AlertDialog({
  open,
  title,
  message,
  confirmLabel,
  onClose,
}: AlertDialogProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="dialog-overlay" role="presentation" onClick={onClose}>
      <div
        className="dialog card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="alert-dialog-title" className="dialog__title">
          {title}
        </h3>
        <p id="alert-dialog-message" className="dialog__message">
          {message}
        </p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
            {confirmLabel ?? t('actions.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
