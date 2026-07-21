import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { workoutReportApi, type WorkoutReportPeriod, type WorkoutReportResult } from '@/api';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { SegmentedControl } from '@/components/form/SegmentedControl/SegmentedControl';
import { htmlReportToPlainText } from '@/utils/sendEmailViaFormSubmit';
import '@/styles/components.css';

const PERIODS: WorkoutReportPeriod[] = ['day', 'week', 'month', 'year'];

interface ReportCache {
  period: WorkoutReportPeriod;
  html: string;
  text: string;
  subject: string;
}

function buildReportCache(period: WorkoutReportPeriod, data: WorkoutReportResult): ReportCache | null {
  const html = data.reportHtml ?? '';
  const text =
    data.reportText ?? (html ? htmlReportToPlainText(html) : '');
  if (!text && !html) return null;

  return {
    period,
    html,
    text,
    subject: data.reportSubject ?? `[MachineFit] ${period} workout report`,
  };
}

function WorkoutReportDialog({
  open,
  html,
  onClose,
}: {
  open: boolean;
  html: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="dialog-overlay" role="presentation" onClick={onClose}>
      <div
        className="dialog card workout-report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-report-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="workout-report-dialog-title" className="workout-report-dialog__title">
          {t('workoutReport.viewReport')}
        </h3>
        <div
          className="workout-report-section__preview workout-report-dialog__preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <button type="button" className="btn btn--secondary btn--block" onClick={onClose}>
          {t('actions.close')}
        </button>
      </div>
    </div>
  );
}

export function WorkoutReportSection() {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const userEmail = useAuthStore((s) => s.user?.email);
  const { activeGymId } = useActiveGym();
  const [period, setPeriod] = useState<WorkoutReportPeriod>('week');
  const [reportCache, setReportCache] = useState<ReportCache | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'mail' | 'view' | 'copy' | null>(null);

  useEffect(() => {
    setReportCache(null);
    setReportDialogOpen(false);
  }, [period, activeGymId]);

  const fetchReport = async (previewOnly: boolean): Promise<ReportCache | null> => {
    if (!previewOnly && reportCache?.period === period) {
      return reportCache;
    }

    const res = await workoutReportApi.send({
      period,
      previewOnly,
      ...(activeGymId ? { gymId: activeGymId } : {}),
    });
    const cache = buildReportCache(period, res.data.data);
    if (cache) {
      setReportCache(cache);
    }
    return cache;
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await workoutReportApi.send({
        period,
        ...(activeGymId ? { gymId: activeGymId } : {}),
      });
      return res.data.data;
    },
    onSuccess: async (data) => {
      const cache = buildReportCache(period, data);
      if (cache) {
        setReportCache(cache);
      }

      if (data.emailSent) {
        showToast(t('workoutReport.sent'), 'success');
        return;
      }

      showToast(t('workoutReport.failed'), 'error');
    },
    onError: () => showToast(t('workoutReport.failed'), 'error'),
  });

  const handleMailApp = async () => {
    if (!userEmail) return;

    setLoadingAction('mail');
    try {
      const cache = reportCache?.period === period ? reportCache : await fetchReport(true);
      if (!cache) {
        showToast(t('workoutReport.failed'), 'error');
        return;
      }

      const subject = encodeURIComponent(cache.subject);
      const body = encodeURIComponent(cache.text.slice(0, 1800));
      window.location.href = `mailto:${userEmail}?subject=${subject}&body=${body}`;
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewReport = async () => {
    setLoadingAction('view');
    try {
      const cache = reportCache?.period === period ? reportCache : await fetchReport(true);
      if (!cache?.html) {
        showToast(t('workoutReport.failed'), 'error');
        return;
      }
      setReportDialogOpen(true);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopyReport = async () => {
    setLoadingAction('copy');
    try {
      const cache = reportCache?.period === period ? reportCache : await fetchReport(true);
      if (!cache?.text) {
        showToast(t('workoutReport.failed'), 'error');
        return;
      }

      await navigator.clipboard.writeText(cache.text);
      showToast(t('workoutReport.copied'), 'success');
    } catch {
      showToast(t('errors.submitFailed'), 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const actionBusy = loadingAction !== null;

  return (
    <>
      <section className="form-section workout-report-section">
        <h3 className="form-section__title">{t('workoutReport.title')}</h3>
        <p className="form-section__desc">{t('workoutReport.desc')}</p>

        <div className="workout-report-section__field">
          <span className="form-row__label">{t('workoutReport.periodLabel')}</span>
          <SegmentedControl
            value={period}
            options={PERIODS.map((value) => ({
              value,
              label: t(`workoutReport.periods.${value}`),
            }))}
            onChange={setPeriod}
            ariaLabel={t('workoutReport.periodLabel')}
          />
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => sendMutation.mutate()}
          disabled={sendMutation.isPending || !userEmail}
        >
          {sendMutation.isPending ? t('workoutReport.sending') : t('workoutReport.send')}
        </button>

        {!userEmail ? (
          <p className="form-section__desc">{t('workoutReport.emailRequired')}</p>
        ) : null}

        <div className="workout-report-section__actions" role="group" aria-label={t('workoutReport.actionsLabel')}>
          <button
            type="button"
            className="btn btn--secondary workout-report-section__action-btn"
            onClick={() => void handleMailApp()}
            disabled={!userEmail || actionBusy || sendMutation.isPending}
          >
            {loadingAction === 'mail' ? '…' : t('workoutReport.openMailApp')}
          </button>
          <button
            type="button"
            className="btn btn--secondary workout-report-section__action-btn"
            onClick={() => void handleViewReport()}
            disabled={actionBusy || sendMutation.isPending}
          >
            {loadingAction === 'view' ? '…' : t('workoutReport.viewReport')}
          </button>
          <button
            type="button"
            className="btn btn--secondary workout-report-section__action-btn"
            onClick={() => void handleCopyReport()}
            disabled={actionBusy || sendMutation.isPending}
          >
            {loadingAction === 'copy' ? '…' : t('workoutReport.copyReport')}
          </button>
        </div>
      </section>

      <WorkoutReportDialog
        open={reportDialogOpen}
        html={reportCache?.period === period ? reportCache.html : ''}
        onClose={() => setReportDialogOpen(false)}
      />
    </>
  );
}
