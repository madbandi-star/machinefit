import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon } from '@/components/icons/Icon';
import { ownerApi } from '@/api';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import './OwnerApplyPage.css';

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

  const alreadyOwner = hasMinRole(user?.roleCode, Role.OWNER);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (alreadyOwner || submitting) return;
    setSubmitting(true);
    try {
      const res = await ownerApi.apply({
        businessName: businessName.trim(),
        applicantName: applicantName.trim(),
        businessPhone: businessPhone.trim(),
        businessEmail: businessEmail.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
        description: description.trim() || undefined,
        paymentStatus: 'waived',
      });
      const data = res.data.data;
      showToast(
        data.pending
          ? t('gyms:ownerApply.submittedPending')
          : t('gyms:ownerApply.submittedApproved'),
        'success'
      );
      navigate(ROUTES.MY_PAGE);
    } catch (error: unknown) {
      const code =
        typeof error === 'object' &&
        error &&
        'response' in error &&
        (error as { response?: { data?: { error?: { code?: string } } } }).response?.data?.error
          ?.code;
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
    <div className="owner-apply">
      <PageShell
        title={t('gyms:ownerApply.title')}
        subtitle={t('gyms:ownerApply.subtitle')}
      >
        {alreadyOwner ? (
          <section className="owner-apply__done" aria-live="polite">
            <div className="owner-apply__done-icon" aria-hidden>
              <Icon name="circleCheck" size={28} />
            </div>
            <h2 className="owner-apply__done-title">{t('gyms:ownerApply.alreadyOwnerTitle')}</h2>
            <p className="owner-apply__done-body">{t('gyms:ownerApply.alreadyOwner')}</p>
            <Link to={ROUTES.OWNER} className="btn btn--primary btn--block">
              {t('gyms:ownerApply.goDashboard')}
            </Link>
          </section>
        ) : (
          <div className="owner-apply__stack">
            <header className="owner-apply__hero">
              <p className="owner-apply__brand">MachineFit Owner</p>
              <h2 className="owner-apply__hero-title">{t('gyms:ownerApply.heroTitle')}</h2>
              <p className="owner-apply__hero-lead">{t('gyms:ownerApply.heroLead')}</p>
            </header>

            <ul className="owner-apply__benefits" aria-label={t('gyms:ownerApply.benefitsTitle')}>
              <li>
                <Icon name="dumbbell" size={18} aria-hidden />
                <span>{t('gyms:ownerApply.benefitInventory')}</span>
              </li>
              <li>
                <Icon name="sliders" size={18} aria-hidden />
                <span>{t('gyms:ownerApply.benefitOfficial')}</span>
              </li>
              <li>
                <Icon name="trendingUp" size={18} aria-hidden />
                <span>{t('gyms:ownerApply.benefitInsight')}</span>
              </li>
            </ul>

            <ol className="owner-apply__steps" aria-label={t('gyms:ownerApply.processTitle')}>
              <li>
                <span className="owner-apply__step-num">1</span>
                <div>
                  <strong>{t('gyms:ownerApply.step1Title')}</strong>
                  <p>{t('gyms:ownerApply.step1Desc')}</p>
                </div>
              </li>
              <li>
                <span className="owner-apply__step-num">2</span>
                <div>
                  <strong>{t('gyms:ownerApply.step2Title')}</strong>
                  <p>{t('gyms:ownerApply.step2Desc')}</p>
                </div>
              </li>
              <li>
                <span className="owner-apply__step-num">3</span>
                <div>
                  <strong>{t('gyms:ownerApply.step3Title')}</strong>
                  <p>{t('gyms:ownerApply.step3Desc')}</p>
                </div>
              </li>
            </ol>

            <form className="owner-apply__form" onSubmit={(e) => void onSubmit(e)} noValidate>
              <section className="form-section">
                <h3 className="form-section__title">{t('gyms:ownerApply.sectionBusiness')}</h3>
                <p className="form-section__desc">{t('gyms:ownerApply.sectionBusinessDesc')}</p>
                <div className="form-stack">
                  <label className="form-field">
                    <span className="form-field__label">
                      {t('gyms:ownerApply.businessName')}
                      <span className="owner-apply__req" aria-hidden>
                        *
                      </span>
                    </span>
                    <input
                      className="input"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={200}
                      autoComplete="organization"
                      placeholder={t('gyms:ownerApply.businessNamePlaceholder')}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">
                      {t('gyms:ownerApply.applicantName')}
                      <span className="owner-apply__req" aria-hidden>
                        *
                      </span>
                    </span>
                    <input
                      className="input"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      required
                      maxLength={100}
                      autoComplete="name"
                      placeholder={t('gyms:ownerApply.applicantNamePlaceholder')}
                    />
                  </label>
                </div>
              </section>

              <section className="form-section">
                <h3 className="form-section__title">{t('gyms:ownerApply.sectionContact')}</h3>
                <p className="form-section__desc">{t('gyms:ownerApply.sectionContactDesc')}</p>
                <div className="form-stack">
                  <label className="form-field">
                    <span className="form-field__label">
                      {t('gyms:ownerApply.phone')}
                      <span className="owner-apply__req" aria-hidden>
                        *
                      </span>
                    </span>
                    <input
                      className="input"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      required
                      maxLength={30}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder={t('gyms:ownerApply.phonePlaceholder')}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">
                      {t('gyms:ownerApply.email')}
                      <span className="owner-apply__req" aria-hidden>
                        *
                      </span>
                    </span>
                    <input
                      className="input"
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder={t('gyms:ownerApply.emailPlaceholder')}
                    />
                  </label>
                </div>
              </section>

              <section className="form-section">
                <h3 className="form-section__title">{t('gyms:ownerApply.sectionEvidence')}</h3>
                <p className="form-section__desc">{t('gyms:ownerApply.sectionEvidenceDesc')}</p>
                <div className="form-stack">
                  <label className="form-field">
                    <span className="form-field__label">{t('gyms:ownerApply.evidenceUrl')}</span>
                    <input
                      className="input"
                      type="url"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      maxLength={500}
                      inputMode="url"
                      placeholder="https://"
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">{t('gyms:ownerApply.memo')}</span>
                    <textarea
                      className="input owner-apply__textarea"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={2000}
                      placeholder={t('gyms:ownerApply.memoPlaceholder')}
                    />
                  </label>
                </div>
              </section>

              <aside className="owner-apply__trust" aria-label={t('gyms:ownerApply.trustTitle')}>
                <p className="owner-apply__trust-title">{t('gyms:ownerApply.trustTitle')}</p>
                <ul>
                  <li>{t('gyms:ownerApply.trustReview')}</li>
                  <li>{t('gyms:ownerApply.trustPrivacy')}</li>
                  <li>{t('gyms:ownerApply.paymentNotice')}</li>
                </ul>
              </aside>

              <div className="owner-apply__actions sticky-action-bar">
                <button
                  type="submit"
                  className="btn btn--primary btn--block"
                  disabled={
                    submitting ||
                    businessName.trim().length < 2 ||
                    !applicantName.trim() ||
                    businessPhone.trim().length < 3 ||
                    !businessEmail.trim()
                  }
                >
                  {submitting ? t('gyms:ownerApply.submitting') : t('gyms:ownerApply.submit')}
                </button>
              </div>
            </form>
          </div>
        )}
      </PageShell>
    </div>
  );
}
