import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import '@/styles/online-pt.css';

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

  if (policyQuery.isLoading || profileQuery.isLoading) {
    return (
      <PageShell title={t('manageTitle')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  const policy = policyQuery.data;

  return (
    <PageShell title={t('manageTitle')} subtitle={t('manageSubtitle')}>
      {profileQuery.data ? (
        <p className="opt-meta">{t('approval', { status: profileQuery.data.approvalStatus })}</p>
      ) : null}
      {policy ? (
        <p className="opt-meta">
          {policy.minTicketPrice.toLocaleString()} ~ {policy.maxTicketPrice.toLocaleString()}원 ·
          수수료 {policy.platformFeePercent}% · 기한 {policy.answerDeadlineHours}h
        </p>
      ) : null}

      <form
        className="opt-form"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <div>
          <label htmlFor="tp">{t('ticketPrice')}</label>
          <input
            id="tp"
            type="number"
            value={ticketPrice}
            onChange={(e) => setTicketPrice(Number(e.target.value) || 0)}
            required
          />
        </div>
        <label>
          <input
            type="checkbox"
            checked={accepting}
            onChange={(e) => setAccepting(e.target.checked)}
          />{' '}
          {t('acceptingToggle')}
        </label>
        <div>
          <label htmlFor="maxd">{t('maxPerDay')}</label>
          <input
            id="maxd"
            type="number"
            value={maxPerDay}
            onChange={(e) => setMaxPerDay(Number(e.target.value) || 0)}
          />
        </div>
        <div>
          <label htmlFor="th">{t('targetHours')}</label>
          <input
            id="th"
            type="number"
            value={targetHours}
            onChange={(e) => setTargetHours(Number(e.target.value) || 1)}
          />
        </div>
        <div>
          <label htmlFor="sp">{t('specialtiesHint')}</label>
          <input id="sp" value={specialties} onChange={(e) => setSpecialties(e.target.value)} />
        </div>
        <div>
          <label htmlFor="intro">{t('intro')}</label>
          <textarea id="intro" rows={4} value={intro} onChange={(e) => setIntro(e.target.value)} />
        </div>
        <div>
          <label htmlFor="career">{t('career')}</label>
          <textarea
            id="career"
            rows={3}
            value={career}
            onChange={(e) => setCareer(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="certs">{t('certs')}</label>
          <input id="certs" value={certs} onChange={(e) => setCerts(e.target.value)} />
        </div>
        <div>
          <label htmlFor="region">{t('region')}</label>
          <input id="region" value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <div>
          <label htmlFor="gym">{t('gym')}</label>
          <input id="gym" value={gymName} onChange={(e) => setGymName(e.target.value)} />
        </div>
        <button type="submit" className="btn btn--primary" disabled={saveMutation.isPending}>
          {t('saveProfile')}
        </button>
      </form>

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link to={ROUTES.ONLINE_PT_QUESTIONS}>{t('trainerInbox')}</Link>
        <Link to={ROUTES.ONLINE_PT_WALLET}>{t('walletTitle')}</Link>
      </div>
    </PageShell>
  );
}
