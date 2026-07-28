import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon } from '@/components/icons/Icon';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import '@/styles/online-pt.css';

function approvalChipClass(status: string): string {
  if (status === 'approved') return 'opt-chip opt-chip--ok';
  if (status === 'pending') return 'opt-chip opt-chip--warn';
  if (status === 'rejected' || status === 'suspended') return 'opt-chip opt-chip--danger';
  return 'opt-chip opt-chip--muted';
}

export function OnlinePtManagePage() {
  const { t } = useTranslation('online-pt');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const policyQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtPolicy,
    queryFn: async () => (await onlinePtApi.getPolicy()).data.data,
  });

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtMyTrainer,
    queryFn: async () => (await onlinePtApi.getMyTrainerProfile()).data.data,
  });

  const [ticketPrice, setTicketPrice] = useState(10000);
  const [accepting, setAccepting] = useState(false);
  const [maxPerDay, setMaxPerDay] = useState(10);
  const [targetHours, setTargetHours] = useState(24);
  const [specialties, setSpecialties] = useState('');
  const [intro, setIntro] = useState('');
  const [career, setCareer] = useState('');
  const [certs, setCerts] = useState('');
  const [region, setRegion] = useState('');
  const [gymName, setGymName] = useState('');

  useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    setTicketPrice(p.ticketPrice);
    setAccepting(p.acceptingQuestions);
    setMaxPerDay(p.maxQuestionsPerDay);
    setTargetHours(p.avgAnswerTargetHours);
    setSpecialties(p.specialties.join(', '));
    setIntro(p.intro);
    setCareer(p.career);
    setCerts(p.certifications.join(', '));
    setRegion(p.regionLabel);
    setGymName(p.gymName);
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      onlinePtApi.upsertMyTrainerProfile({
        ticketPrice,
        acceptingQuestions: accepting,
        maxQuestionsPerDay: maxPerDay,
        avgAnswerTargetHours: targetHours,
        specialties: specialties
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        intro,
        career,
        certifications: certs
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        regionLabel: region,
        gymName,
        isOnline: accepting,
      }),
    onSuccess: () => {
      showToast(t('profileSaved'), 'success');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtMyTrainer });
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('error')), 'error'),
  });

  const loading = policyQuery.isLoading || profileQuery.isLoading;
  const policy = policyQuery.data;
  const profile = profileQuery.data;

  return (
    <div className="opt-page">
      <PageShell>
        <header className="opt-hero">
          <p className="opt-hero-kicker">Online PT</p>
          <h1>{t('manageTitle')}</h1>
          <p className="opt-hero-lead">{t('manageSubtitle')}</p>
          {profile ? (
            <div className="opt-hero-badges">
              <span className={approvalChipClass(profile.approvalStatus)}>
                {t(`approvalStatus.${profile.approvalStatus}`)}
              </span>
              <span className={`opt-chip${accepting ? ' opt-chip--ok' : ' opt-chip--muted'}`}>
                {accepting ? t('accepting') : t('offline')}
              </span>
            </div>
          ) : null}
          <div className="opt-quick-actions">
            <Link to={ROUTES.ONLINE_PT_QUESTIONS} className="opt-quick-btn">
              <Icon name="history" size={16} aria-hidden />
              {t('trainerInbox')}
            </Link>
            <Link to={ROUTES.ONLINE_PT_WALLET} className="opt-quick-btn opt-quick-btn--primary">
              <Icon name="calendar" size={16} aria-hidden />
              {t('walletTitle')}
            </Link>
          </div>
        </header>

        {loading ? (
          <Skeleton count={4} />
        ) : (
          <>
            {policy ? (
              <section className="opt-policy-strip" aria-label={t('admin.policy')}>
                <span>{t('policyPriceRange', { min: policy.minTicketPrice.toLocaleString(), max: policy.maxTicketPrice.toLocaleString() })}</span>
                <span className="opt-meta-sep" aria-hidden>·</span>
                <span>{t('policyFee', { percent: policy.platformFeePercent })}</span>
                <span className="opt-meta-sep" aria-hidden>·</span>
                <span>{t('policyDeadline', { hours: policy.answerDeadlineHours })}</span>
              </section>
            ) : null}

            <form
              className="opt-manage-form"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <section className="opt-panel">
                <div className="opt-panel-head">
                  <div>
                    <h2>{t('manageSectionOps')}</h2>
                    <p className="opt-panel-desc">{t('manageSectionOpsLead')}</p>
                  </div>
                </div>

                <label className="opt-toggle-row" htmlFor="opt-accepting">
                  <span className="opt-toggle-row__text">
                    <strong>{t('acceptingToggle')}</strong>
                    <span className="opt-toggle-row__hint">{t('acceptingToggleHint')}</span>
                  </span>
                  <input
                    id="opt-accepting"
                    type="checkbox"
                    className="opt-toggle-row__input"
                    checked={accepting}
                    onChange={(e) => setAccepting(e.target.checked)}
                  />
                </label>

                <div className="opt-field-grid">
                  <label className="opt-field" htmlFor="tp">
                    <span className="opt-field__label">{t('ticketPrice')}</span>
                    <input
                      id="tp"
                      type="number"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(Number(e.target.value) || 0)}
                      required
                    />
                  </label>
                  <label className="opt-field" htmlFor="maxd">
                    <span className="opt-field__label">{t('maxPerDay')}</span>
                    <input
                      id="maxd"
                      type="number"
                      value={maxPerDay}
                      onChange={(e) => setMaxPerDay(Number(e.target.value) || 0)}
                    />
                  </label>
                  <label className="opt-field" htmlFor="th">
                    <span className="opt-field__label">{t('targetHours')}</span>
                    <input
                      id="th"
                      type="number"
                      value={targetHours}
                      onChange={(e) => setTargetHours(Number(e.target.value) || 1)}
                    />
                  </label>
                </div>
              </section>

              <section className="opt-panel">
                <div className="opt-panel-head">
                  <div>
                    <h2>{t('manageSectionProfile')}</h2>
                    <p className="opt-panel-desc">{t('manageSectionProfileLead')}</p>
                  </div>
                </div>

                <div className="opt-form-fields">
                  <label className="opt-field" htmlFor="sp">
                    <span className="opt-field__label">{t('specialtiesHint')}</span>
                    <input id="sp" value={specialties} onChange={(e) => setSpecialties(e.target.value)} />
                  </label>
                  <label className="opt-field" htmlFor="intro">
                    <span className="opt-field__label">{t('intro')}</span>
                    <textarea id="intro" rows={3} value={intro} onChange={(e) => setIntro(e.target.value)} />
                  </label>
                  <label className="opt-field" htmlFor="career">
                    <span className="opt-field__label">{t('career')}</span>
                    <textarea id="career" rows={2} value={career} onChange={(e) => setCareer(e.target.value)} />
                  </label>
                  <div className="opt-field-grid opt-field-grid--pair">
                    <label className="opt-field" htmlFor="certs">
                      <span className="opt-field__label">{t('certs')}</span>
                      <input id="certs" value={certs} onChange={(e) => setCerts(e.target.value)} />
                    </label>
                    <label className="opt-field" htmlFor="region">
                      <span className="opt-field__label">{t('region')}</span>
                      <input id="region" value={region} onChange={(e) => setRegion(e.target.value)} />
                    </label>
                  </div>
                  <label className="opt-field" htmlFor="gym">
                    <span className="opt-field__label">{t('gym')}</span>
                    <input id="gym" value={gymName} onChange={(e) => setGymName(e.target.value)} />
                  </label>
                </div>
              </section>

              <div className="opt-sticky-save">
                <button type="submit" className="opt-btn opt-btn-primary opt-btn-block" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? t('savingProfile') : t('saveProfile')}
                </button>
              </div>
            </form>
          </>
        )}
      </PageShell>
    </div>
  );
}
