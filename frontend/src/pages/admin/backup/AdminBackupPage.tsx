import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import type { BackupRetentionDays } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { backupApi } from '@/api/backup.api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';
import '@/styles/admin-backup.css';

function getRestoreErrorMessage(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: { message?: string } } | undefined;
    return payload?.error?.message;
  }
  if (error instanceof Error) return error.message;
  return undefined;
}

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

function statusPillClass(status: string): string {
  const s = status.toUpperCase();
  if (s === 'SUCCESS' || s === 'COMPLETED' || s === 'OK') return 'ag-pill--on';
  if (s === 'FAILED' || s === 'ERROR') return 'ag-pill--danger';
  return 'ag-pill--warn';
}

function formatBytes(n: number | null | undefined): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    } catch (error) {
      const message = getRestoreErrorMessage(error);
      showToast(message || t('backup.restoreFailed'), 'error');
    } finally {
      setBusy(null);
      setProgress(0);
      setPendingFile(null);
      setConfirmText('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const settings = settingsQuery.data;
  const history = historyQuery.data ?? [];

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return history;
    return history.filter((item) => {
      const hay = [
        item.action,
        item.status,
        item.fileName,
        item.errorMessage,
        item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [history, historySearch]);

  const lastStatus = useMemo((): string => {
    const first = history[0];
    return first?.status ?? '—';
  }, [history]);

  const lastStatusClass = useMemo(() => {
    if (!history[0]) return ' is-muted';
    const s = lastStatus.toUpperCase();
    if (s === 'SUCCESS' || s === 'COMPLETED' || s === 'OK') return '';
    if (s === 'FAILED' || s === 'ERROR') return ' is-danger';
    return ' is-warn';
  }, [history, lastStatus]);

  return (
    <AdminPageShell
      title={t('backup.title')}
      subtitle={t('backup.subtitle')}
      backTo={ROUTES.ADMIN}
      backLabel={t('backToAdmin')}
    >
      <div className="ag">
        <section className="ag-kpis ag-kpis--4" aria-label={t('backup.title')}>
          <div className={`ag-kpi${lastStatusClass}`}>
            <span className="ag-kpi__value">{lastStatus}</span>
            <span className="ag-kpi__label">{t('backup.kpiLastStatus')}</span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{settings?.retentionDays ?? '—'}</span>
            <span className="ag-kpi__label">{t('backup.kpiRetention')}</span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{history.length}</span>
            <span className="ag-kpi__label">{t('backup.kpiHistory')}</span>
          </div>
          <div className={`ag-kpi${busy ? ' is-warn' : ' is-muted'}`}>
            <span className="ag-kpi__value">
              {busy === 'backup'
                ? t('backup.runBackup')
                : busy === 'restore'
                  ? t('backup.runRestore')
                  : t('backup.kpiIdle')}
            </span>
            <span className="ag-kpi__label">{t('backup.kpiBusy')}</span>
          </div>
        </section>

        <section className="ag-panel">
          <div className="ag-toolbar">
            <div className="ag-card__actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy !== null}
                onClick={() => void runBackup()}
              >
                {t('backup.runBackup')}
              </button>
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
                <span className="ag-card__meta">
                  {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              ) : null}
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setSettingsOpen((v) => !v)}
              >
                {settingsOpen ? t('backup.hideSettings') : t('backup.showSettings')}
              </button>
            </div>
          </div>
          {busy ? <ProgressBar value={progress} /> : null}
          <p className="ag-chart-hint">{t('backup.systemBackupHelp')}</p>
        </section>

        {settingsOpen ? (
          <section className="ag-panel" aria-label={t('backup.autoTitle')}>
            <h2 className="admin-panel__title">{t('backup.autoTitle')}</h2>
            {settings ? (
              <div className="ag-editor__form">
                <label className="ag-check">
                  <input
                    type="checkbox"
                    checked={settings.autoBackupEnabled}
                    onChange={(e) => saveSettings.mutate({ autoBackupEnabled: e.target.checked })}
                  />
                  <span>{t('backup.autoEnabled')}</span>
                </label>
                <div className="ag-field-row">
                  <label className="ag-field">
                    {t('backup.hourUtc')}
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
                  <label className="ag-field">
                    {t('backup.retention')}
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
                <p className="ag-chart-hint">
                  {t('backup.lastAuto', {
                    value: settings.lastAutoBackupAt
                      ? new Date(settings.lastAutoBackupAt).toLocaleString()
                      : '—',
                  })}
                </p>
              </div>
            ) : (
              <p className="ag-empty">
                {settingsQuery.isError ? t('backup.settingsFailed') : '…'}
              </p>
            )}
          </section>
        ) : null}

        <section className="ag-panel" aria-label={t('backup.history')}>
          <h2 className="admin-panel__title">{t('backup.history')}</h2>
          {history.length ? (
            <div className="ag-toolbar">
              <input
                type="search"
                className="ag-search"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={t('backup.searchPlaceholder')}
                aria-label={t('backup.searchPlaceholder')}
              />
            </div>
          ) : null}
          {!history.length ? (
            <p className="ag-empty">{t('backup.historyEmpty')}</p>
          ) : filteredHistory.length === 0 ? (
            <p className="ag-empty">{t('backup.historyEmpty')}</p>
          ) : (
            <div className="ag-queue">
              {filteredHistory.map((item) => {
                const open = expandedId === item.id;
                const sizeLabel = formatBytes(item.fileSizeBytes);
                const fail =
                  String(item.status).toUpperCase() === 'FAILED' ||
                  String(item.status).toUpperCase() === 'ERROR';
                return (
                  <article
                    key={item.id}
                    className={[
                      'ag-card',
                      fail ? 'is-fail' : '',
                      open ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <button
                      type="button"
                      className="ag-card__main"
                      onClick={() =>
                        setExpandedId((prev) => (prev === item.id ? null : item.id))
                      }
                    >
                      <span className="ag-card__identity">
                        <span className="ag-card__title">{item.action}</span>
                        <span className="ag-card__meta">
                          {new Date(item.createdAt).toLocaleString()}
                          {sizeLabel ? ` · ${sizeLabel}` : ''}
                        </span>
                      </span>
                      <span className={`ag-pill ${statusPillClass(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="ag-card__chevron" aria-hidden>
                        {open ? '▾' : '▸'}
                      </span>
                    </button>
                    {open ? (
                      <div className="ag-card__detail">
                        {item.fileName ? (
                          <p className="ag-card__excerpt">{item.fileName}</p>
                        ) : null}
                        {item.errorMessage ? (
                          <p className="ag-card__excerpt">{item.errorMessage}</p>
                        ) : null}
                        {item.completedAt ? (
                          <p className="ag-card__excerpt">
                            {new Date(item.completedAt).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {warnOpen ? (
        <div className="dialog-overlay" role="presentation" onClick={closeWarn}>
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
              <button type="button" className="btn btn--secondary" onClick={closeWarn}>
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
