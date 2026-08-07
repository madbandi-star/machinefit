import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BackupRetentionDays } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { backupApi } from '@/api/backup.api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-backup.css';

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="admin-backup__progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="admin-backup__progress-track">
        <div className="admin-backup__progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="admin-backup__progress-label">{pct}%</span>
    </div>
  );
}

function statusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === 'SUCCESS' || s === 'COMPLETED' || s === 'OK') return 'admin-badge--ok';
  if (s === 'FAILED' || s === 'ERROR') return 'admin-badge--danger';
  return 'admin-badge--pending';
}

export function AdminBackupPage() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  const [progress, setProgress] = useState(0);
  const [confirmText, setConfirmText] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [warnOpen, setWarnOpen] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ['admin-backup-settings'],
    queryFn: async () => (await backupApi.getSettings()).data.data,
  });

  const historyQuery = useQuery({
    queryKey: ['admin-backup-history'],
    queryFn: async () => (await backupApi.systemHistory()).data.data.items,
  });

  const saveSettings = useMutation({
    mutationFn: backupApi.updateSettings,
    onSuccess: () => {
      showToast(t('backup.settingsSaved'), 'success');
      void queryClient.invalidateQueries({ queryKey: ['admin-backup-settings'] });
    },
    onError: () => showToast(t('backup.settingsFailed'), 'error'),
  });

  const runBackup = async () => {
    setBusy('backup');
    setProgress(5);
    try {
      await backupApi.systemBackup({ format: 'zip', onProgress: setProgress });
      showToast(t('backup.backupDone'), 'success');
      void queryClient.invalidateQueries({ queryKey: ['admin-backup-history'] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('backup.backupFailed'), 'error');
    } finally {
      setBusy(null);
      setProgress(0);
    }
  };

  const closeWarn = () => {
    setWarnOpen(false);
    setConfirmText('');
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const runRestore = async () => {
    if (!pendingFile) return;
    if (confirmText.trim().toUpperCase() !== 'YES') {
      showToast(t('backup.confirmYesRequired'), 'error');
      return;
    }
    setWarnOpen(false);
    setBusy('restore');
    setProgress(5);
    try {
      await backupApi.systemRestore({
        file: pendingFile,
        confirmText,
        onProgress: setProgress,
      });
      showToast(t('backup.restoreDone'), 'success');
      void queryClient.invalidateQueries({ queryKey: ['admin-backup-history'] });
    } catch {
      showToast(t('backup.restoreFailed'), 'error');
    } finally {
      setBusy(null);
      setProgress(0);
      setPendingFile(null);
      setConfirmText('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const settings = settingsQuery.data;

  return (
    <AdminPageShell
      title={t('backup.title')}
      subtitle={t('backup.subtitle')}
      backTo={ROUTES.ADMIN}
      backLabel={t('backToAdmin')}
    >
      <section className="admin-panel admin-backup__panel">
        <div className="admin-backup__panel-head">
          <h2 className="admin-panel__title">{t('backup.systemBackup')}</h2>
          <p className="admin-panel__desc">{t('backup.systemBackupHelp')}</p>
        </div>
        <div className="admin-backup__actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy !== null}
            onClick={() => void runBackup()}
          >
            {t('backup.runBackup')}
          </button>
        </div>
        {busy === 'backup' ? <ProgressBar value={progress} /> : null}
      </section>

      <section className="admin-panel admin-backup__panel">
        <div className="admin-backup__panel-head">
          <h2 className="admin-panel__title">{t('backup.systemRestore')}</h2>
          <p className="admin-panel__desc">{t('backup.systemRestoreHelp')}</p>
        </div>
        <div className="admin-backup__file">
          <input
            ref={fileRef}
            id="admin-backup-restore-file"
            className="admin-backup__file-input"
            type="file"
            accept=".zip,.json,application/zip,application/json"
            disabled={busy !== null}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setPendingFile(file);
              setConfirmText('');
              if (file) setWarnOpen(true);
            }}
          />
          <label htmlFor="admin-backup-restore-file" className="btn btn--secondary">
            {pendingFile ? pendingFile.name : t('backup.chooseFile')}
          </label>
          {pendingFile ? (
            <span className="admin-backup__file-meta">
              {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          ) : null}
        </div>
        {busy === 'restore' ? <ProgressBar value={progress} /> : null}
      </section>

      <section className="admin-panel admin-backup__panel">
        <div className="admin-backup__panel-head">
          <h2 className="admin-panel__title">{t('backup.autoTitle')}</h2>
        </div>
        {settings ? (
          <div className="admin-backup__settings">
            <label className="admin-backup__check">
              <input
                type="checkbox"
                checked={settings.autoBackupEnabled}
                onChange={(e) => saveSettings.mutate({ autoBackupEnabled: e.target.checked })}
              />
              <span>{t('backup.autoEnabled')}</span>
            </label>
            <div className="admin-form-grid admin-backup__settings-grid">
              <label className="admin-form-card">
                <span className="admin-form-card__label">{t('backup.hourUtc')}</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={23}
                  defaultValue={settings.autoBackupHourUtc}
                  onBlur={(e) => {
                    const hour = Number(e.target.value);
                    if (Number.isFinite(hour) && hour !== settings.autoBackupHourUtc) {
                      saveSettings.mutate({ autoBackupHourUtc: hour });
                    }
                  }}
                />
              </label>
              <label className="admin-form-card">
                <span className="admin-form-card__label">{t('backup.retention')}</span>
                <select
                  className="input"
                  value={settings.retentionDays}
                  onChange={(e) =>
                    saveSettings.mutate({
                      retentionDays: Number(e.target.value) as BackupRetentionDays,
                    })
                  }
                >
                  <option value={7}>7</option>
                  <option value={30}>30</option>
                  <option value={90}>90</option>
                </select>
              </label>
            </div>
            <p className="admin-backup__meta">
              {t('backup.lastAuto', {
                value: settings.lastAutoBackupAt
                  ? new Date(settings.lastAutoBackupAt).toLocaleString()
                  : '—',
              })}
            </p>
          </div>
        ) : (
          <p className="admin-empty">{settingsQuery.isError ? t('backup.settingsFailed') : '…'}</p>
        )}
      </section>

      <section className="admin-panel admin-backup__panel">
        <div className="admin-backup__panel-head">
          <h2 className="admin-panel__title">{t('backup.history')}</h2>
        </div>
        {!historyQuery.data?.length ? (
          <p className="admin-empty">{t('backup.historyEmpty')}</p>
        ) : (
          <ul className="admin-backup__history">
            {historyQuery.data.map((item) => (
              <li key={item.id} className="admin-backup__history-item">
                <div className="admin-backup__history-main">
                  <span className="admin-backup__history-action">{item.action}</span>
                  <span className={`admin-badge ${statusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="admin-backup__history-meta">
                  <time dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                  {item.fileName ? <span className="admin-backup__history-file">{item.fileName}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {warnOpen ? (
        <div
          className="dialog-overlay"
          role="presentation"
          onClick={closeWarn}
        >
          <div
            className="dialog card admin-backup__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-backup-warn-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="admin-backup-warn-title" className="admin-backup__dialog-title">
              {t('backup.warnTitle')}
            </h3>
            <p className="admin-backup__dialog-warn">{t('backup.warnBody')}</p>
            {pendingFile ? (
              <p className="admin-backup__dialog-file">{pendingFile.name}</p>
            ) : null}
            <label className="admin-form-card admin-backup__dialog-field">
              <span className="admin-form-card__label">{t('backup.typeYes')}</span>
              <input
                className="input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="YES"
                autoComplete="off"
                autoFocus
              />
            </label>
            <div className="admin-backup__dialog-actions">
              <button type="button" className="btn btn--ghost" onClick={closeWarn}>
                {tc('actions.cancel')}
              </button>
              <button
                type="button"
                className="btn btn--danger"
                disabled={busy !== null}
                onClick={() => void runRestore()}
              >
                {t('backup.runRestore')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
