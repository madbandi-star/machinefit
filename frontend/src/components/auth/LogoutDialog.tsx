import { useTranslation } from 'react-i18next';
import '@/styles/components.css';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (clearSavedCredentials: boolean) => void;
}

export function LogoutDialog({ open, onClose, onConfirm }: LogoutDialogProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="dialog-overlay" role="presentation" onClick={onClose}>
      <div
        className="dialog card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="logout-dialog-title" style={{ marginBottom: '0.5rem' }}>
          {t('auth.logoutConfirmTitle')}
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          {t('auth.logoutConfirmMessage')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={() => onConfirm(false)}
          >
            {t('auth.logoutKeepCredentials')}
          </button>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => onConfirm(true)}
          >
            {t('auth.logoutClearCredentials')}
          </button>
          <button type="button" className="btn btn--secondary btn--block" onClick={onClose}>
            {t('actions.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
