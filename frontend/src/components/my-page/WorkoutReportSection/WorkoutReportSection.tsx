import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { workoutReportApi, type WorkoutReportPeriod } from '@/api';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { SegmentedControl } from '@/components/form/SegmentedControl/SegmentedControl';
import {
  htmlReportToPlainText,
  sendEmailViaFormSubmit,
} from '@/utils/sendEmailViaFormSubmit';
import '@/styles/components.css';

const PERIODS: WorkoutReportPeriod[] = ['day', 'week', 'month', 'year'];

export function WorkoutReportSection() {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const userEmail = useAuthStore((s) => s.user?.email);
  const [period, setPeriod] = useState<WorkoutReportPeriod>('week');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await workoutReportApi.send({ period });
      return res.data.data;
    },
    onSuccess: async (data) => {
      if (data.emailSent) {
        setPreviewHtml(null);
        showToast(t('workoutReport.sent'), 'success');
        return;
      }

      const subject = data.reportSubject ?? `[MachineFit] ${period} workout report`;
      const message =
        data.reportText ??
        (data.reportHtml ? htmlReportToPlainText(data.reportHtml) : '');

      if (userEmail && message) {
        const browserResult = await sendEmailViaFormSubmit({
          to: userEmail,
          subject,
          message,
        });

        if (browserResult.success) {
          setPreviewHtml(null);
          showToast(t('workoutReport.sent'), 'success');
          return;
        }

        if (browserResult.needsActivation) {
          setPreviewHtml(data.reportHtml ?? null);
          showToast(t('workoutReport.activationRequired'), 'error');
          return;
        }
      }

      setPreviewHtml(data.reportHtml ?? null);
      showToast(t('workoutReport.fallbackReady'), 'info');
    },
    onError: () => showToast(t('workoutReport.failed'), 'error'),
  });

  const handleMailtoFallback = () => {
    if (!previewHtml || !userEmail) return;
    const plain = htmlReportToPlainText(previewHtml);
    const subject = encodeURIComponent(`[MachineFit] ${period} workout report`);
    const body = encodeURIComponent(plain.slice(0, 1800));
    window.location.href = `mailto:${userEmail}?subject=${subject}&body=${body}`;
  };

  const handleCopyReport = async () => {
    if (!previewHtml) return;
    const plain = htmlReportToPlainText(previewHtml);
    try {
      await navigator.clipboard.writeText(plain);
      showToast(t('workoutReport.copied'), 'success');
    } catch {
      showToast(t('errors.submitFailed'), 'error');
    }
  };

  return (
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
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !userEmail}
      >
        {mutation.isPending ? t('workoutReport.sending') : t('workoutReport.send')}
      </button>

      {!userEmail ? (
        <p className="form-section__desc">{t('workoutReport.emailRequired')}</p>
      ) : null}

      {previewHtml ? (
        <div className="workout-report-section__fallback">
          <p className="form-section__desc">{t('workoutReport.fallbackHint')}</p>
          <div className="workout-report-section__preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          <button type="button" className="btn btn--secondary btn--block" onClick={handleMailtoFallback}>
            {t('workoutReport.openMailApp')}
          </button>
          <button type="button" className="btn btn--secondary btn--block" onClick={handleCopyReport}>
            {t('workoutReport.copyReport')}
          </button>
        </div>
      ) : null}
    </section>
  );
}
