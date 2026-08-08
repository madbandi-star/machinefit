import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Download, FileArchive, History, ShieldCheck, Upload } from 'lucide-react';
import type { BackupRestoreMode } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { backupApi } from '@/api/backup.api';
import { useSettingsStore } from '@/store/settings.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/data-management.css';

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="backup-progress data-mgmt__progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="backup-progress__track">
        <div className="backup-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="backup-progress__label">{pct}%</span>
    </div>
  );
}

function statusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === 'SUCCESS') return 'data-mgmt__badge data-mgmt__badge--ok';
  if (s === 'RUNNING' || s === 'PENDING') return 'data-mgmt__badge data-mgmt__badge--run';
  if (s === 'FAILED' || s === 'ERROR') return 'data-mgmt__badge data-mgmt__badge--fail';
  return 'data-mgmt__badge data-mgmt__badge--neutral';
}

export function DataManagementPage() {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const clientSettings = useSettingsStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState<'zip' | 'json'>('zip');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState<BackupRestoreMode>('merge');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dropActive, setDropActive] = useState(false);

  const historyQuery = useQuery({
    queryKey: ['backup-history'],
    queryFn: async () => (await backupApi.history()).data.data.items,
  });

  const runExport = async () => {
    setBusy('export');
    setProgress(5);
    try {
      const {
        locale,
        unitHeight,
        unitWeight,
        restDurationSeconds,
        restTimerAfterAllSetsComplete,
        voiceCoachEnabled,
        voiceCoachVolume,
        voiceCoachTargetReps,
        voiceCoachOneMore,
        voiceCoachOneMoreCount,
        voiceCoachAutoAfterRest,
        voiceRestTipsEnabled,
        voiceCoachRepGapMs,
        voiceCoachPrepCount,
        voiceCoachPack,
        voiceCountMode,
        voiceCoachFlowMode,
        voiceHoldDurationSec,
        workoutFullscreenDisplay,
        weightDifficulty,
      } = clientSettings;

      await backupApi.exportUser({
        format,
        clientSettings: {
          locale,
          unitHeight,
          unitWeight,
          restDurationSeconds,
          restTimerAfterAllSetsComplete,
          voiceCoachEnabled,
          voiceCoachVolume,
          voiceCoachTargetReps,
          voiceCoachOneMore,
          voiceCoachOneMoreCount,
          voiceCoachAutoAfterRest,
          voiceRestTipsEnabled,
          voiceCoachRepGapMs,
          voiceCoachPrepCount,
          voiceCoachPack,
          voiceCountMode,
          voiceCoachFlowMode,
          voiceHoldDurationSec,
          workoutFullscreenDisplay,
          weightDifficulty,
        },
        onProgress: setProgress,
      });
      showToast(t('dataManagement.backupDone'), 'success');
      void queryClient.invalidateQueries({ queryKey: ['backup-history'] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('dataManagement.backupFailed'), 'error');
    } finally {
      setBusy(null);
      setProgress(0);
    }
  };

  const onPickFile = (file: File | null) => {
    if (!file) return;
    setPendingFile(file);
    setRestoreMode('merge');
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setPendingFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const runImport = async () => {
    if (!pendingFile) return;
    setConfirmOpen(false);
    setBusy('import');
    setProgress(5);
    try {
      const result = await backupApi.importUser({
        file: pendingFile,
        mode: restoreMode,
        onProgress: setProgress,
      });
      if (result.clientSettings && typeof result.clientSettings === 'object') {
        const patch = result.clientSettings as Record<string, unknown>;
        useSettingsStore.setState((state) => ({
          ...state,
          ...Object.fromEntries(
            Object.entries(patch).filter(([, v]) => v !== undefined && v !== null)
          ),
        }));
      }
      showToast(t('dataManagement.restoreDone'), 'success');
      void queryClient.invalidateQueries({ queryKey: ['backup-history'] });
      void queryClient.invalidateQueries({ queryKey: ['workout-logs'] });
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch {
      showToast(t('dataManagement.restoreFailed'), 'error');
    } finally {
      setBusy(null);
      setProgress(0);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const actionLabel = (action: string) => {
    const a = action.toUpperCase();
    if (a === 'BACKUP') return t('dataManagement.actionBackup');
    if (a === 'RESTORE' || a === 'IMPORT') return t('dataManagement.actionRestore');
    return action;
  };

  const statusLabel = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS') return t('dataManagement.statusSuccess');
    if (s === 'RUNNING' || s === 'PENDING') return t('dataManagement.statusRunning');
    if (s === 'FAILED' || s === 'ERROR') return t('dataManagement.statusFailed');
    return status;
  };

  return (
    <PageShell title={t('dataManagement.title')} subtitle={t('dataManagement.subtitle')}>
      <div className="data-mgmt">
        <aside className="data-mgmt__notice" aria-label={t('dataManagement.safetyTitle')}>
          <ShieldCheck className="data-mgmt__notice-icon" size={22} aria-hidden />
          <div className="data-mgmt__notice-body">
            <p className="data-mgmt__notice-title">{t('dataManagement.safetyTitle')}</p>
            <p className="data-mgmt__notice-text">{t('dataManagement.safetyBody')}</p>
          </div>
        </aside>

        <section className="data-mgmt__card" aria-labelledby="data-mgmt-backup-title">
          <div className="data-mgmt__card-head">
            <div className="data-mgmt__card-icon" aria-hidden>
              <Download size={22} strokeWidth={2.1} />
            </div>
            <div className="data-mgmt__card-titles">
              <h2 id="data-mgmt-backup-title" className="data-mgmt__card-title">
                {t('dataManagement.backupTitle')}
              </h2>
              <p className="data-mgmt__card-desc">{t('dataManagement.backupHelp')}</p>
            </div>
          </div>

          <div className="data-mgmt__format">
            <span className="data-mgmt__field-label" id="data-mgmt-format-label">
              {t('dataManagement.format')}
            </span>
            <div
              className="segmented-control segmented-control--compact"
              role="group"
              aria-labelledby="data-mgmt-format-label"
            >
              <button
                type="button"
                className={`segmented-control__btn${format === 'zip' ? ' segmented-control__btn--active' : ''}`}
                disabled={busy !== null}
                aria-pressed={format === 'zip'}
                onClick={() => setFormat('zip')}
              >
                {t('dataManagement.formatZip')}
              </button>
              <button
                type="button"
                className={`segmented-control__btn${format === 'json' ? ' segmented-control__btn--active' : ''}`}
                disabled={busy !== null}
                aria-pressed={format === 'json'}
                onClick={() => setFormat('json')}
              >
                {t('dataManagement.formatJson')}
              </button>
            </div>
          </div>

          <div className="data-mgmt__actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy !== null}
              onClick={() => void runExport()}
            >
              {busy === 'export' ? t('dataManagement.backingUp') : t('dataManagement.backupAction')}
            </button>
          </div>
          {busy === 'export' ? <ProgressBar value={progress} /> : null}
        </section>

        <section className="data-mgmt__card" aria-labelledby="data-mgmt-restore-title">
          <div className="data-mgmt__card-head">
            <div className="data-mgmt__card-icon data-mgmt__card-icon--restore" aria-hidden>
              <Upload size={22} strokeWidth={2.1} />
            </div>
            <div className="data-mgmt__card-titles">
              <h2 id="data-mgmt-restore-title" className="data-mgmt__card-title">
                {t('dataManagement.restoreTitle')}
              </h2>
              <p className="data-mgmt__card-desc">{t('dataManagement.restoreHelp')}</p>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            className="data-mgmt__sr-only"
            accept=".zip,.json,application/zip,application/json"
            disabled={busy !== null}
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            className={`data-mgmt__dropzone${dropActive ? ' data-mgmt__dropzone--active' : ''}`}
            disabled={busy !== null}
            onClick={() => fileRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (busy === null) setDropActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDropActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDropActive(false);
              if (busy !== null) return;
              const file = e.dataTransfer.files?.[0] ?? null;
              onPickFile(file);
            }}
          >
            <Upload className="data-mgmt__dropzone-icon" size={28} strokeWidth={1.9} aria-hidden />
            <p className="data-mgmt__dropzone-title">{t('dataManagement.pickFile')}</p>
            <p className="data-mgmt__dropzone-hint">{t('dataManagement.dropHint')}</p>
          </button>

          {busy === 'import' ? <ProgressBar value={progress} /> : null}
        </section>

        <section className="data-mgmt__card" aria-labelledby="data-mgmt-history-title">
          <h2 id="data-mgmt-history-title" className="data-mgmt__section-title">
            <History size={20} aria-hidden />
            {t('dataManagement.historyTitle')}
          </h2>

          {historyQuery.isLoading ? (
            <p className="muted">{t('common.loading', { defaultValue: 'Loading…' })}</p>
          ) : !historyQuery.data?.length ? (
            <div className="data-mgmt__empty">
              <p>{t('dataManagement.historyEmpty')}</p>
              <p className="data-mgmt__empty-hint">{t('dataManagement.historyEmptyHint')}</p>
            </div>
          ) : (
            <ul className="data-mgmt__history">
              {historyQuery.data.map((item) => (
                <li key={item.id} className="data-mgmt__history-item">
                  <div className="data-mgmt__history-main">
                    <div className="data-mgmt__history-top">
                      <span className="data-mgmt__history-action">{actionLabel(item.action)}</span>
                      <span className={statusBadgeClass(item.status)}>{statusLabel(item.status)}</span>
                    </div>
                    <span className="data-mgmt__history-meta">
                      {new Date(item.createdAt).toLocaleString()}
                      {item.fileName ? ` · ${item.fileName}` : ''}
                      {item.progress < 100 && item.status === 'RUNNING' ? ` · ${item.progress}%` : ''}
                    </span>
                  </div>
                  {item.status === 'SUCCESS' && item.action === 'BACKUP' ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => void backupApi.downloadUser(item.id)}
                    >
                      {t('dataManagement.download')}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {confirmOpen && pendingFile ? (
        <div className="modal-backdrop" role="presentation" onClick={closeConfirm}>
          <div
            className="data-mgmt__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="restore-confirm-title" className="data-mgmt__modal-title">
              {t('dataManagement.confirmTitle')}
            </h3>
            <p className="data-mgmt__modal-lead">{t('dataManagement.confirmQuestion')}</p>
            <div className="data-mgmt__modal-file">
              <FileArchive size={16} aria-hidden />
              <span>
                {t('dataManagement.selectedFile')}: <strong>{pendingFile.name}</strong>
              </span>
            </div>

            <fieldset className="data-mgmt__mode-list">
              <legend className="data-mgmt__sr-only">{t('dataManagement.confirmQuestion')}</legend>
              <label className="data-mgmt__mode-option">
                <input
                  type="radio"
                  name="restore-mode"
                  checked={restoreMode === 'merge'}
                  onChange={() => setRestoreMode('merge')}
                />
                <span className="data-mgmt__mode-copy">
                  <span className="data-mgmt__mode-title-row">
                    <span className="data-mgmt__mode-title">{t('dataManagement.modeMergeTitle')}</span>
                    <span className="data-mgmt__rec-badge">{t('dataManagement.recommended')}</span>
                  </span>
                  <span className="data-mgmt__mode-desc">{t('dataManagement.modeMergeDesc')}</span>
                </span>
              </label>
              <label className="data-mgmt__mode-option data-mgmt__mode-option--danger">
                <input
                  type="radio"
                  name="restore-mode"
                  checked={restoreMode === 'replace'}
                  onChange={() => setRestoreMode('replace')}
                />
                <span className="data-mgmt__mode-copy">
                  <span className="data-mgmt__mode-title">{t('dataManagement.modeReplaceTitle')}</span>
                  <span className="data-mgmt__mode-desc">{t('dataManagement.modeReplaceDesc')}</span>
                </span>
              </label>
            </fieldset>

            <div className="data-mgmt__modal-actions">
              <button type="button" className="btn btn--ghost" onClick={closeConfirm}>
                {t('actions.cancel')}
              </button>
              <button type="button" className="btn btn--primary" onClick={() => void runImport()}>
                {t('dataManagement.restoreAction')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
