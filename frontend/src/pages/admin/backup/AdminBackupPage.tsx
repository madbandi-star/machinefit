import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BackupRetentionDays } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { backupApi } from '@/api/backup.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="backup-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="backup-progress__track">
        <div className="backup-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="backup-progress__label">{pct}%</span>
    </div>
  );
}

export function AdminBackupPage() {
  const { t } = useTranslation('admin');
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
    <PageShell title={t('backup.title')} subtitle={t('backup.subtitle')}>
      <section className="stack-gap">
        <div className="panel-block">
          <h2 className="section-title">{t('backup.systemBackup')}</h2>
          <p className="muted">{t('backup.systemBackupHelp')}</p>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy !== null}
            onClick={() => void runBackup()}
          >
            {t('backup.runBackup')}
          </button>
          {busy === 'backup' ? <ProgressBar value={progress} /> : null}
        </div>

        <div className="panel-block">
          <h2 className="section-title">{t('backup.systemRestore')}</h2>
          <p className="muted">{t('backup.systemRestoreHelp')}</p>
          <input
            ref={fileRef}
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
          {busy === 'restore' ? <ProgressBar value={progress} /> : null}
        </div>

        <div className="panel-block">
          <h2 className="section-title">{t('backup.autoTitle')}</h2>
          {settings ? (
            <div className="stack-gap">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={settings.autoBackupEnabled}
                  onChange={(e) =>
                    saveSettings.mutate({ autoBackupEnabled: e.target.checked })
                  }
                />
                <span>{t('backup.autoEnabled')}</span>
              </label>
              <label className="field">
                <span>{t('backup.hourUtc')}</span>
                <input
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
              <label className="field">
                <span>{t('backup.retention')}</span>
                <select
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
              <p className="muted">
                {t('backup.lastAuto', {
                  value: settings.lastAutoBackupAt
                    ? new Date(settings.lastAutoBackupAt).toLocaleString()
                    : '—',
                })}
              </p>
            </div>
          ) : (
            <p className="muted">…</p>
          )}
        </div>

        <div className="panel-block">
          <h2 className="section-title">{t('backup.history')}</h2>
          {!historyQuery.data?.length ? (
            <p className="muted">{t('backup.historyEmpty')}</p>
          ) : (
            <ul className="plain-list">
              {historyQuery.data.map((item) => (
                <li key={item.id} className="plain-list__item">
                  <strong>
                    {item.action} · {item.status}
                  </strong>
                  <span className="muted">
                    {new Date(item.createdAt).toLocaleString()}
                    {item.fileName ? ` · ${item.fileName}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {warnOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setWarnOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t('backup.warnTitle')}</h3>
            <p className="warn-text">{t('backup.warnBody')}</p>
            <label className="field">
              <span>{t('backup.typeYes')}</span>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="YES"
                autoComplete="off"
              />
            </label>
            <div className="inline-actions" style={{ marginTop: '1rem', gap: '0.5rem' }}>
              <button type="button" className="btn btn--ghost" onClick={() => setWarnOpen(false)}>
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button type="button" className="btn btn--danger" onClick={() => void runRestore()}>
                {t('backup.runRestore')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
