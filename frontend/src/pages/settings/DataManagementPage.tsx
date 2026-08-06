import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BackupRestoreMode } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { backupApi } from '@/api/backup.api';
import { useSettingsStore } from '@/store/settings.store';
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

  return (
    <PageShell title={t('dataManagement.title')} subtitle={t('dataManagement.subtitle')}>
      <section className="stack-gap">
        <div className="panel-block">
          <h2 className="section-title">{t('dataManagement.backupTitle')}</h2>
          <p className="muted">{t('dataManagement.backupHelp')}</p>
          <div className="inline-actions" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
            <label className="field">
              <span>{t('dataManagement.format')}</span>
              <select
                value={format}
                disabled={busy !== null}
                onChange={(e) => setFormat(e.target.value as 'zip' | 'json')}
              >
                <option value="zip">ZIP</option>
                <option value="json">JSON</option>
              </select>
            </label>
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy !== null}
              onClick={() => void runExport()}
            >
              {t('dataManagement.backupAction')}
            </button>
          </div>
          {busy === 'export' ? <ProgressBar value={progress} /> : null}
        </div>

        <div className="panel-block">
          <h2 className="section-title">{t('dataManagement.restoreTitle')}</h2>
          <p className="muted">{t('dataManagement.restoreHelp')}</p>
          <input
            ref={fileRef}
            type="file"
            accept=".zip,.json,application/zip,application/json"
            disabled={busy !== null}
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          {busy === 'import' ? <ProgressBar value={progress} /> : null}
        </div>

        <div className="panel-block">
          <h2 className="section-title">{t('dataManagement.historyTitle')}</h2>
          {historyQuery.isLoading ? (
            <p className="muted">{t('common.loading', { defaultValue: 'Loading…' })}</p>
          ) : !historyQuery.data?.length ? (
            <p className="muted">{t('dataManagement.historyEmpty')}</p>
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
                    {item.progress < 100 && item.status === 'RUNNING' ? ` · ${item.progress}%` : ''}
                  </span>
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
        </div>
      </section>

      {confirmOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="restore-confirm-title">{t('dataManagement.confirmTitle')}</h3>
            <p>{t('dataManagement.confirmQuestion')}</p>
            <fieldset className="stack-gap">
              <label className="radio-row">
                <input
                  type="radio"
                  name="restore-mode"
                  checked={restoreMode === 'merge'}
                  onChange={() => setRestoreMode('merge')}
                />
                <span>{t('dataManagement.modeMerge')}</span>
              </label>
              <label className="radio-row">
                <input
                  type="radio"
                  name="restore-mode"
                  checked={restoreMode === 'replace'}
                  onChange={() => setRestoreMode('replace')}
                />
                <span>{t('dataManagement.modeReplace')}</span>
              </label>
            </fieldset>
            <div className="inline-actions" style={{ marginTop: '1rem', gap: '0.5rem' }}>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmOpen(false)}>
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
