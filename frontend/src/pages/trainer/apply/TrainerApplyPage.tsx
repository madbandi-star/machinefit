import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon } from '@/components/icons/Icon';
import { trainerApi } from '@/api';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '../../gym-owner/apply/OwnerApplyPage.css';
import './TrainerApplyPage.css';

export function TrainerApplyPage() {
  const { t } = useTranslation(['online-pt', 'common']);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);

  const [applicantName, setApplicantName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [specialties, setSpecialties] = useState('');
  const [career, setCareer] = useState('');
  const [certs, setCerts] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const alreadyTrainer = hasMinRole(user?.roleCode, Role.TRAINER);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (alreadyTrainer || submitting) return;
    setSubmitting(true);
    try {
      const res = await trainerApi.apply({
        applicantName: applicantName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        specialties: specialties.trim() || undefined,
        career: career.trim() || undefined,
        certifications: certs.trim() || undefined,
        message: message.trim() || undefined,
      });
      const data = res.data.data;
      showToast(
        data.pending
          ? t('online-pt:trainerApply.submittedPending')
          : t('online-pt:trainerApply.submittedApproved'),
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
        showToast(t('online-pt:trainerApply.alreadyPending'), 'info');
      } else if (code === 'ALREADY_TRAINER') {
        showToast(t('online-pt:trainerApply.alreadyBody'), 'info');
      } else {
        showToast(t('common:errors.submitFailed'), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="owner-apply trainer-apply">
      <PageShell
        title={t('online-pt:trainerApply.title')}
        subtitle={t('online-pt:trainerApply.subtitle')}
        action={
          <Link to={ROUTES.MY_PAGE} className="btn btn--secondary">
            {t('common:actions.back')}
          </Link>
        }
      >
        {alreadyTrainer ? (
          <section className="owner-apply__done" aria-live="polite">
            <div className="owner-apply__done-icon" aria-hidden>
              <Icon name="circleCheck" size={28} />
            </div>
            <h2 className="owner-apply__done-title">{t('online-pt:trainerApply.alreadyTitle')}</h2>
            <p className="owner-apply__done-body">{t('online-pt:trainerApply.alreadyBody')}</p>
            <Link to={ROUTES.ONLINE_PT_MANAGE} className="btn btn--primary btn--block">
              {t('online-pt:trainerApply.goManage')}
            </Link>
          </section>
        ) : (
          <div className="owner-apply__stack">
            <header className="owner-apply__hero trainer-apply__hero">
              <p className="owner-apply__brand">{t('online-pt:trainerApply.brand')}</p>
              <h2 className="owner-apply__hero-title">{t('online-pt:trainerApply.heroTitle')}</h2>
              <p className="owner-apply__hero-lead">{t('online-pt:trainerApply.heroLead')}</p>
            </header>

            <ul className="owner-apply__benefits" aria-label={t('online-pt:trainerApply.benefitsTitle')}>
              <li>
                <Icon name="user" size={18} aria-hidden />
                <span>{t('online-pt:trainerApply.benefitClients')}</span>
              </li>
              <li>
                <Icon name="dumbbell" size={18} aria-hidden />
                <span>{t('online-pt:trainerApply.benefitOnlinePt')}</span>
              </li>
              <li>
                <Icon name="trendingUp" size={18} aria-hidden />
                <span>{t('online-pt:trainerApply.benefitEarn')}</span>
              </li>
            </ul>

            <ol className="owner-apply__steps" aria-label={t('online-pt:trainerApply.processTitle')}>
              <li>
                <span className="owner-apply__step-num">1</span>
                <div>
                  <strong>{t('online-pt:trainerApply.step1Title')}</strong>
                  <p>{t('online-pt:trainerApply.step1Desc')}</p>
                </div>
              </li>
              <li>
                <span className="owner-apply__step-num">2</span>
                <div>
                  <strong>{t('online-pt:trainerApply.step2Title')}</strong>
                  <p>{t('online-pt:trainerApply.step2Desc')}</p>
                </div>
              </li>
              <li>
                <span className="owner-apply__step-num">3</span>
                <div>
                  <strong>{t('online-pt:trainerApply.step3Title')}</strong>
                  <p>{t('online-pt:trainerApply.step3Desc')}</p>
                </div>
              </li>
            </ol>

            <form className="owner-apply__form" onSubmit={(e) => void onSubmit(e)} noValidate>
              <section className="form-section">
                <h3 className="form-section__title">{t('online-pt:trainerApply.sectionProfile')}</h3>
                <p className="form-section__desc">{t('online-pt:trainerApply.sectionProfileDesc')}</p>
                <div className="form-stack">
                  <label className="form-field">
                    <span className="form-field__label">
                      {t('online-pt:trainerApply.name')}
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
                      placeholder={t('online-pt:trainerApply.namePlaceholder')}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">
                      {t('online-pt:trainerApply.phone')}
                      <span className="owner-apply__req" aria-hidden>
                        *
                      </span>
                    </span>
                    <input
                      className="input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      maxLength={30}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder={t('online-pt:trainerApply.phonePlaceholder')}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">
                      {t('online-pt:trainerApply.email')}
                      <span className="owner-apply__req" aria-hidden>
                        *
                      </span>
                    </span>
                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={200}
                      autoComplete="email"
                      placeholder={t('online-pt:trainerApply.emailPlaceholder')}
                    />
                  </label>
                </div>
              </section>

              <section className="form-section">
                <h3 className="form-section__title">{t('online-pt:trainerApply.sectionExperience')}</h3>
                <p className="form-section__desc">{t('online-pt:trainerApply.sectionExperienceDesc')}</p>
                <div className="form-stack">
                  <label className="form-field">
                    <span className="form-field__label">{t('online-pt:trainerApply.specialties')}</span>
                    <input
                      className="input"
                      value={specialties}
                      onChange={(e) => setSpecialties(e.target.value)}
                      maxLength={200}
                      placeholder={t('online-pt:trainerApply.specialtiesPlaceholder')}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">{t('online-pt:trainerApply.career')}</span>
                    <textarea
                      className="input"
                      value={career}
                      onChange={(e) => setCareer(e.target.value)}
                      maxLength={1000}
                      rows={3}
                      placeholder={t('online-pt:trainerApply.careerPlaceholder')}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">{t('online-pt:trainerApply.certs')}</span>
                    <input
                      className="input"
                      value={certs}
                      onChange={(e) => setCerts(e.target.value)}
                      maxLength={300}
                      placeholder={t('online-pt:trainerApply.certsPlaceholder')}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">{t('online-pt:trainerApply.message')}</span>
                    <textarea
                      className="input"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={1000}
                      rows={3}
                      placeholder={t('online-pt:trainerApply.messagePlaceholder')}
                    />
                  </label>
                </div>
              </section>

              <p className="owner-apply__note">{t('online-pt:trainerApply.note')}</p>
              <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
                {submitting
                  ? t('online-pt:trainerApply.submitting')
                  : t('online-pt:trainerApply.submit')}
              </button>
            </form>
          </div>
        )}
      </PageShell>
    </div>
  );
}
