import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ownerApi } from '@/api';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/gym.css';

export function OwnerApplyPage() {
  const { t } = useTranslation(['gyms', 'common']);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);

  const [businessName, setBusinessName] = useState('');
  const [applicantName, setApplicantName] = useState(user?.displayName ?? '');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState(user?.email ?? '');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const alreadyOwner = user?.roleCode === 'owner' || user?.roleCode === 'admin';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (alreadyOwner) return;
    setSubmitting(true);
    try {
      const res = await ownerApi.apply({
        businessName,
        applicantName,
        businessPhone,
        businessEmail,
        evidenceUrl: evidenceUrl || undefined,
        description: description || undefined,
        paymentStatus: 'waived',
      });
      const data = res.data.data;
      showToast(
        data.pending ? t('gyms:ownerApply.submittedPending') : t('gyms:ownerApply.submittedApproved'),
        'success'
      );
      navigate(ROUTES.MY_PAGE);
    } catch (error: unknown) {
      const code =
        typeof error === 'object' &&
        error &&
        'response' in error &&
        (error as { response?: { data?: { error?: { code?: string; message?: string } } } })
          .response?.data?.error?.code;
      if (code === 'APPLICATION_PENDING') {
        showToast(t('gyms:ownerApply.alreadyPending'), 'info');
      } else if (code === 'PAYMENT_REQUIRED') {
        showToast(t('gyms:ownerApply.paymentRequired'), 'error');
      } else if (code === 'ALREADY_OWNER') {
        showToast(t('gyms:ownerApply.alreadyOwner'), 'info');
      } else {
        showToast(t('common:errors.submitFailed'), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title={t('gyms:ownerApply.title')} subtitle={t('gyms:ownerApply.subtitle')}>
      {alreadyOwner ? (
        <div className="card owner-apply__done">
          <p>{t('gyms:ownerApply.alreadyOwner')}</p>
          <Link to={ROUTES.OWNER} className="btn btn--primary">
            {t('gyms:ownerApply.goDashboard')}
          </Link>
        </div>
      ) : (
        <form className="owner-apply__form card" onSubmit={onSubmit}>
          <p className="owner-apply__notice">{t('gyms:ownerApply.paymentNotice')}</p>

          <label className="form-field">
            <span>{t('gyms:ownerApply.businessName')} *</span>
            <input
              className="input"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              minLength={2}
            />
          </label>

          <label className="form-field">
            <span>{t('gyms:ownerApply.applicantName')} *</span>
            <input
              className="input"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span>{t('gyms:ownerApply.phone')} *</span>
            <input
              className="input"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span>{t('gyms:ownerApply.email')} *</span>
            <input
              className="input"
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span>{t('gyms:ownerApply.evidenceUrl')}</span>
            <input
              className="input"
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://"
            />
          </label>

          <label className="form-field">
            <span>{t('gyms:ownerApply.memo')}</span>
            <textarea
              className="input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? t('gyms:ownerApply.submitting') : t('gyms:ownerApply.submit')}
          </button>
        </form>
      )}
    </PageShell>
  );
}
