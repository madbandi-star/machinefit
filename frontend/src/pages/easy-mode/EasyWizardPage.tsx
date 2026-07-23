import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  isFreeWeightMachineCode,
  type RecommendationResult,
  type RecommendationSettings,
  type TargetMuscleGroup,
} from '@machinefit/shared';
import {
  favoriteApi,
  historyApi,
  machinePreferenceApi,
  recommendationApi,
  recommendationFeedbackApi,
  workoutLogApi,
  type FitRating,
} from '@/api';
import { EasyMachinePicker } from '@/components/easy-mode/EasyMachinePicker';
import { EasyWizardShell } from '@/components/easy-mode/EasyWizardShell';
import { NumericStepper } from '@/components/form/NumericStepper/NumericStepper';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useAuthStore } from '@/store/auth.store';
import { useEasyModeStore } from '@/store/easyMode.store';
import { useSettingsStore } from '@/store/settings.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import { QUERY_KEYS } from '@/constants/query-keys';
import { getTodayDateKey } from '@/utils/historyDate';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { resolveMachineImageUrl, machinePlaceholderUrl } from '@/utils/catalogAssets';
import '@/styles/easy-mode.css';

type WizardStep = 1 | 2 | 3 | 'rate' | 'done';

interface SelectedMachine {
  code: string;
  name: string;
  brandName?: string;
}

function repsLabel(settings?: RecommendationSettings | null): string {
  if (!settings) return '—';
  const min = settings.recommendedRepsMin;
  const max = settings.recommendedRepsMax;
  if (min != null && max != null && min !== max) return `${min}–${max}`;
  if (min != null) return String(min);
  if (max != null) return String(max);
  return '—';
}

export function EasyWizardPage() {
  const { t } = useTranslation(['common', 'machines']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mode = useEasyModeStore((s) => s.mode);
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);
  const weightDifficulty = useSettingsStore((s) => s.weightDifficulty);
  const { activeGymId, activeGym } = useActiveGym();
  const { activeMemberId, isRealGym } = useActiveMember();

  const [step, setStep] = useState<WizardStep>(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerInitialCode, setPickerInitialCode] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedMachine | null>(null);
  const [targetMuscle, setTargetMuscle] = useState<TargetMuscleGroup | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [fitRating, setFitRating] = useState<FitRating | null>(null);
  const [adjWeight, setAdjWeight] = useState<number | undefined>();
  const [adjReps, setAdjReps] = useState<number | undefined>();
  const [setCount, setSetCount] = useState(3);
  const [weights, setWeights] = useState<number[]>([0, 0, 0]);
  const [completed, setCompleted] = useState<boolean[]>([false, false, false]);
  const [savedMachineName, setSavedMachineName] = useState('');

  const preferenceScope =
    isRealGym && activeGymId && activeMemberId
      ? { gymId: activeGymId, memberId: activeMemberId }
      : undefined;

  const historyQuery = useQuery({
    queryKey: ['easy-history', activeGymId, activeMemberId],
    queryFn: async () => {
      const res = await historyApi.list(activeGymId!, {
        memberId: activeMemberId ?? undefined,
        limit: 8,
      });
      return res.data.data;
    },
    enabled: Boolean(activeGymId) && mode === 'easy',
    staleTime: 30_000,
  });

  const favoritesQuery = useQuery({
    queryKey: ['easy-favorites', activeGymId, activeMemberId],
    queryFn: async () => {
      const res = await favoriteApi.list(activeGymId!, activeMemberId ?? undefined);
      return res.data.data;
    },
    enabled: Boolean(activeGymId) && mode === 'easy',
    staleTime: 30_000,
  });

  const needsMuscle = selected ? isFreeWeightMachineCode(selected.code) : false;
  const canGoRecommend =
    Boolean(selected) && (!needsMuscle || Boolean(targetMuscle)) && Boolean(activeGymId);

  useEffect(() => {
    if (mode !== 'easy') navigate(ROUTES.MY_PAGE, { replace: true });
  }, [mode, navigate]);

  const createRecommend = useMutation({
    mutationFn: async () => {
      if (!selected || !user) throw new Error('missing');
      if (
        user.gender == null ||
        user.heightCm == null ||
        user.weightKg == null ||
        user.experienceLevel == null
      ) {
        throw new Error('profile');
      }
      const res = await recommendationApi.create({
        machineCode: selected.code,
        gender: user.gender,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        experienceLevel: user.experienceLevel,
        unitHeight: user.unitHeight,
        unitWeight: user.unitWeight,
        age: user.age,
        workoutGoal: user.workoutGoal,
        weightDifficulty,
        gymId: activeGymId ?? undefined,
        memberId: activeMemberId ?? undefined,
        ...(targetMuscle ? { targetMuscleGroup: targetMuscle } : {}),
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setRecommendation(data);
      const settings = data.settings;
      setAdjWeight(settings.recommendedWeightKg);
      setAdjReps(settings.recommendedRepsMin ?? settings.recommendedRepsMax);
      const seed = settings.recommendedWeightKg ?? 0;
      setSetCount(3);
      setWeights([seed, seed, seed]);
      setCompleted([false, false, false]);
      setFitRating(null);
      setStep(2);
    },
    onError: (error) => {
      const msg = getApiErrorMessage(error, t('easyMode.recommendFailed'));
      showToast(
        error instanceof Error && error.message === 'profile'
          ? t('easyMode.needProfile')
          : msg === 'networkError'
            ? t('easyMode.recommendFailed')
            : msg || t('easyMode.recommendFailed'),
        'error'
      );
    },
  });

  const saveFeedbackAndPrefs = useMutation({
    mutationFn: async () => {
      if (!recommendation || !selected || !fitRating) return;
      await recommendationFeedbackApi.submit({
        recommendationId: recommendation.id,
        fitRating,
        ...preferenceScope,
      });
      if (fitRating === 'bad') {
        await machinePreferenceApi.upsert({
          machineCode: selected.code,
          activeSource: 'adjusted',
          customSettings: {
            recommendedWeightKg: adjWeight,
            recommendedRepsMin: adjReps,
            recommendedRepsMax: adjReps,
          },
          ...preferenceScope,
        });
      }
    },
    onSuccess: () => {
      setStep('done');
      showToast(t('easyMode.fitSaved'), 'success');
    },
    onError: (error) => {
      showToast(getApiErrorMessage(error, t('easyMode.fitSaveFailed')), 'error');
    },
  });

  const saveLog = useMutation({
    mutationFn: async () => {
      if (!selected || !activeGymId || !activeMemberId) throw new Error('scope');
      const body = {
        gymId: activeGymId,
        memberId: activeMemberId,
        machineCode: selected.code,
        recommendationId: recommendation?.id,
        logDate: getTodayDateKey(),
        setCount,
        setWeightsKg: weights.slice(0, setCount),
        setCompleted: completed.slice(0, setCount),
        ...(targetMuscle ? { targetMuscleGroup: targetMuscle } : {}),
      };
      const res = await workoutLogApi.upsert(body);
      return res.data.data;
    },
    onSuccess: async () => {
      setSavedMachineName(selected?.name ?? '');
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
      const settings = recommendation?.settings;
      setAdjWeight(settings?.recommendedWeightKg);
      setAdjReps(settings?.recommendedRepsMin ?? settings?.recommendedRepsMax);
      setFitRating(null);
      setStep('rate');
      showToast(t('easyMode.saveSuccess'), 'success');
    },
    onError: (error) => {
      showToast(getApiErrorMessage(error, t('easyMode.saveFailed')), 'error');
    },
  });

  const openPicker = (code?: string | null) => {
    setPickerInitialCode(code ?? null);
    setPickerOpen(true);
  };

  const resizeSets = (next: number) => {
    const n = Math.max(1, Math.min(20, next));
    const seed = weights[0] ?? adjWeight ?? 0;
    setSetCount(n);
    setWeights((prev) => {
      const copy = [...prev];
      while (copy.length < n) copy.push(seed);
      return copy.slice(0, n);
    });
    setCompleted((prev) => {
      const copy = [...prev];
      while (copy.length < n) copy.push(false);
      return copy.slice(0, n);
    });
  };

  const recentMachines = useMemo(() => {
    const items = historyQuery.data ?? [];
    const seen = new Set<string>();
    const out: SelectedMachine[] = [];
    for (const item of items) {
      if (seen.has(item.machineCode)) continue;
      seen.add(item.machineCode);
      out.push({
        code: item.machineCode,
        name: item.machineName,
        brandName: item.brandName,
      });
      if (out.length >= 6) break;
    }
    return out;
  }, [historyQuery.data]);

  const resetToMachineStep = () => {
    setStep(1);
    setSelected(null);
    setTargetMuscle(null);
    setRecommendation(null);
    setFitRating(null);
  };

  if (mode !== 'easy') return null;

  const picker = (
    <EasyMachinePicker
      open={pickerOpen}
      initialCode={pickerInitialCode}
      onClose={() => {
        setPickerOpen(false);
        setPickerInitialCode(null);
      }}
      onConfirm={(pick) => {
        setSelected({
          code: pick.code,
          name: pick.name,
          brandName: pick.brandName,
        });
        setTargetMuscle(pick.targetMuscle);
        setPickerOpen(false);
        setPickerInitialCode(null);
      }}
    />
  );

  if (step === 'done') {
    return (
      <div className="easy-done">
        <div className="easy-done__check" aria-hidden>
          ✓
        </div>
        <h1 className="easy-heading">{t('easyMode.doneTitle')}</h1>
        <p className="easy-sub">
          {t('easyMode.doneSummary', { name: savedMachineName || '—' })}
        </p>
        <button
          type="button"
          className="easy-btn easy-btn--primary"
          onClick={resetToMachineStep}
        >
          {t('easyMode.doneAnother')}
        </button>
        <button
          type="button"
          className="easy-btn easy-btn--secondary"
          style={{ marginTop: '0.5rem' }}
          onClick={() => navigate(ROUTES.EASY)}
        >
          {t('easyMode.doneHome')}
        </button>
        <p className="easy-sub" style={{ marginTop: '1rem' }}>
          {t('easyMode.doneFoot')}
        </p>
      </div>
    );
  }

  if (step === 'rate') {
    return (
      <div className="easy-shell">
        <div className="easy-shell__top">
          <span className="easy-shell__icon-btn" style={{ visibility: 'hidden' }} aria-hidden>
            ←
          </span>
          <h1 className="easy-shell__title">{t('easyMode.rateTitle')}</h1>
          <button
            type="button"
            className="easy-shell__icon-btn"
            onClick={() => setStep('done')}
            aria-label={t('easyMode.close')}
          >
            ✕
          </button>
        </div>
        <div className="easy-shell__body">
          <h2 className="easy-heading">{savedMachineName || selected?.name}</h2>
          <p className="easy-sub">{t('easyMode.fitPromptAfter')}</p>
          <div className="easy-fit">
            <button
              type="button"
              className={`easy-fit__btn${fitRating === 'good' ? ' easy-fit__btn--on' : ''}`}
              onClick={() => setFitRating('good')}
            >
              {t('easyMode.fitGood')}
            </button>
            <button
              type="button"
              className={`easy-fit__btn${fitRating === 'bad' ? ' easy-fit__btn--on' : ''}`}
              onClick={() => setFitRating('bad')}
            >
              {t('easyMode.fitBad')}
            </button>
          </div>
          {fitRating === 'bad' ? (
            <div className="easy-card">
              <p className="easy-list__label">{t('easyMode.adjustWeight')}</p>
              <NumericStepper
                value={adjWeight}
                onChange={setAdjWeight}
                min={0}
                max={999}
                step={5}
                unit="kg"
                ariaLabel={t('easyMode.adjustWeight')}
              />
              <p className="easy-list__label">{t('easyMode.adjustReps')}</p>
              <NumericStepper
                value={adjReps}
                onChange={setAdjReps}
                min={1}
                max={50}
                step={1}
                unit={t('easyMode.repsUnit')}
                ariaLabel={t('easyMode.adjustReps')}
              />
            </div>
          ) : null}
        </div>
        <div className="easy-shell__footer">
          <button
            type="button"
            className="easy-btn easy-btn--primary"
            disabled={!fitRating || saveFeedbackAndPrefs.isPending}
            onClick={() => saveFeedbackAndPrefs.mutate()}
          >
            {saveFeedbackAndPrefs.isPending ? t('easyMode.working') : t('easyMode.fitSubmit')}
          </button>
          <button type="button" className="easy-btn easy-btn--ghost" onClick={() => setStep('done')}>
            {t('easyMode.fitSkip')}
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <>
        {picker}
        <EasyWizardShell
          step={1}
          onBack={() => navigate(ROUTES.EASY)}
          onClose={() => navigate(ROUTES.EASY)}
          primaryLabel={t('easyMode.nextRecommend')}
          primaryDisabled={!canGoRecommend}
          primaryPending={createRecommend.isPending}
          primaryHint={
            !activeGymId
              ? t('easyMode.needGym')
              : !selected
                ? t('easyMode.needMachine')
                : needsMuscle && !targetMuscle
                  ? t('easyMode.needMuscle')
                  : undefined
          }
          onPrimary={() => createRecommend.mutate()}
        >
          <h2 className="easy-heading">{t('easyMode.s1Title')}</h2>
          <p className="easy-sub">{t('easyMode.s1Sub')}</p>
          <p className="easy-home__gym">{activeGym?.name || t('easyMode.gymUnset')}</p>

          {!activeGymId ? (
            <Link to={ROUTES.HOME} className="easy-btn easy-btn--secondary">
              {t('easyMode.pickGym')}
            </Link>
          ) : (
            <>
              <div className="easy-tile-grid">
                <Link to={ROUTES.SCAN} className="easy-tile">
                  {t('easyMode.entryQr')}
                </Link>
                <button type="button" className="easy-tile" onClick={() => openPicker()}>
                  {t('easyMode.entrySearch')}
                </button>
              </div>

              {selected ? (
                <button
                  type="button"
                  className="easy-selected-card"
                  onClick={() => openPicker(selected.code)}
                >
                  <img
                    className="easy-selected-card__thumb"
                    src={
                      resolveMachineImageUrl(selected.code) || machinePlaceholderUrl()
                    }
                    alt=""
                    width={64}
                    height={64}
                  />
                  <div className="easy-selected-card__body">
                    <p className="easy-selected-card__label">{t('easyMode.selected')}</p>
                    <p className="easy-selected-card__name">{selected.name}</p>
                    {selected.brandName ? (
                      <p className="easy-selected-card__meta">{selected.brandName}</p>
                    ) : null}
                    {needsMuscle && targetMuscle ? (
                      <p className="easy-selected-card__meta">
                        {t(`machines:muscleGroups.${targetMuscle}`, {
                          defaultValue: targetMuscle,
                        })}
                      </p>
                    ) : null}
                  </div>
                  <span className="easy-selected-card__chevron" aria-hidden>
                    ›
                  </span>
                </button>
              ) : null}

              {recentMachines.length > 0 ? (
                <div className="easy-list">
                  <p className="easy-list__label">{t('easyMode.recent')}</p>
                  <div className="easy-thumb-row">
                    {recentMachines.map((m) => (
                      <button
                        key={m.code}
                        type="button"
                        className={`easy-thumb-chip${
                          selected?.code === m.code ? ' easy-thumb-chip--on' : ''
                        }`}
                        onClick={() => openPicker(m.code)}
                      >
                        <img
                          src={resolveMachineImageUrl(m.code) || machinePlaceholderUrl()}
                          alt=""
                          width={48}
                          height={48}
                        />
                        <span>{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {(favoritesQuery.data?.length ?? 0) > 0 ? (
                <div className="easy-list">
                  <p className="easy-list__label">{t('easyMode.favorites')}</p>
                  <div className="easy-thumb-row">
                    {(favoritesQuery.data ?? []).slice(0, 6).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`easy-thumb-chip${
                          selected?.code === m.machineCode ? ' easy-thumb-chip--on' : ''
                        }`}
                        onClick={() => openPicker(m.machineCode)}
                      >
                        <img
                          src={
                            resolveMachineImageUrl(m.machineCode) || machinePlaceholderUrl()
                          }
                          alt=""
                          width={48}
                          height={48}
                        />
                        <span>{m.machineName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </EasyWizardShell>
      </>
    );
  }

  if (step === 2 && recommendation) {
    const ai = recommendation.aiRecommendedSettings ?? recommendation.settings;
    const settings = recommendation.settings;
    return (
      <EasyWizardShell
        step={2}
        onBack={() => setStep(1)}
        onClose={() => navigate(ROUTES.EASY)}
        primaryLabel={t('easyMode.nextLog')}
        onPrimary={() => {
          const seed = settings.recommendedWeightKg ?? 0;
          setWeights((prev) => prev.map(() => seed));
          setStep(3);
        }}
      >
        <h2 className="easy-heading">{recommendation.machineName || selected?.name}</h2>
        <p className="easy-sub">{t('easyMode.s2Title')}</p>

        <div className="easy-metrics">
          <div className="easy-metric">
            <p className="easy-metric__label">{t('easyMode.weight')}</p>
            <p className="easy-metric__value">
              {settings.recommendedWeightKg != null ? `${settings.recommendedWeightKg}` : '—'}
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}> kg</span>
            </p>
          </div>
          <div className="easy-metric">
            <p className="easy-metric__label">{t('easyMode.reps')}</p>
            <p className="easy-metric__value">{repsLabel(settings)}</p>
          </div>
        </div>

        {[
          settings.seatPosition != null && {
            label: t('easyMode.seat'),
            value: String(settings.seatPosition),
          },
          settings.backPadPosition != null && {
            label: t('easyMode.backPad'),
            value: String(settings.backPadPosition),
          },
          settings.footPosition != null && {
            label: t('easyMode.foot'),
            value: String(settings.footPosition),
          },
        ]
          .filter(Boolean)
          .slice(0, 3)
          .map((row) =>
            row ? (
              <div key={row.label} className="easy-setting-row">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ) : null
          )}

        <details className="easy-details">
          <summary>{t('easyMode.moreDetails')}</summary>
          {(recommendation.tips ?? []).slice(0, 3).map((tip) => (
            <p key={tip} className="easy-sub">
              {tip}
            </p>
          ))}
          {(recommendation.warnings ?? []).slice(0, 2).map((w) => (
            <p key={w} className="easy-hint">
              {w}
            </p>
          ))}
          <p className="easy-sub">
            {t('easyMode.aiWeight')}: {ai.recommendedWeightKg ?? '—'} kg · {repsLabel(ai)}{' '}
            {t('easyMode.repsUnit')}
          </p>
        </details>

        <p className="easy-sub easy-sub--soft">{t('easyMode.fitLaterHint')}</p>
      </EasyWizardShell>
    );
  }

  // step 3
  return (
    <EasyWizardShell
      step={3}
      onBack={() => setStep(2)}
      onClose={() => navigate(ROUTES.EASY)}
      primaryLabel={t('easyMode.saveLog')}
      primaryPending={saveLog.isPending}
      primaryDisabled={!activeGymId || !activeMemberId}
      primaryHint={!activeMemberId ? t('easyMode.needMember') : undefined}
      onPrimary={() => saveLog.mutate()}
    >
      <h2 className="easy-heading">{selected?.name}</h2>
      <p className="easy-sub">{t('easyMode.s3Title')}</p>
      {recommendation ? (
        <p className="easy-sub">
          {t('easyMode.repsReadonly', { reps: repsLabel(recommendation.settings) })}
        </p>
      ) : null}

      <div className="easy-setting-row">
        <span>{t('easyMode.setCount')}</span>
        <NumericStepper
          value={setCount}
          onChange={(v) => resizeSets(v ?? 1)}
          min={1}
          max={20}
          step={1}
          ariaLabel={t('easyMode.setCount')}
        />
      </div>

      {weights.slice(0, setCount).map((w, index) => (
        <div key={index} className="easy-set-row">
          <span className="easy-set-row__label">
            {t('easyMode.setN', { n: index + 1 })}
          </span>
          <NumericStepper
            value={w}
            onChange={(next) => {
              setWeights((prev) => {
                const copy = [...prev];
                copy[index] = next ?? 0;
                return copy;
              });
            }}
            min={0}
            max={999}
            step={5}
            unit="kg"
            ariaLabel={t('easyMode.setN', { n: index + 1 })}
          />
          <label className="easy-check">
            <input
              type="checkbox"
              checked={completed[index] ?? false}
              onChange={(e) => {
                const checked = e.target.checked;
                setCompleted((prev) => {
                  const copy = [...prev];
                  copy[index] = checked;
                  return copy;
                });
              }}
            />
            {t('easyMode.doneSet')}
          </label>
        </div>
      ))}
    </EasyWizardShell>
  );
}
