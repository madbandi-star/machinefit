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
import {
  assertNoDuplicateToday,
  DuplicateRecommendationError,
} from '@/utils/recommendationDuplicate';
import type { EasyMachinePickResult } from '@/components/easy-mode/EasyMachinePicker';
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

  const showDuplicatePickToast = (machineCode: string) => {
    showToast(
      t(
        isFreeWeightMachineCode(machineCode)
          ? 'machines:recommendation.duplicate'
          : 'machines:recommendation.duplicateMachine'
      ),
      'info'
    );
  };

  const confirmMachinePick = async (pick: EasyMachinePickResult): Promise<boolean> => {
    if (activeGymId && activeMemberId) {
      try {
        await assertNoDuplicateToday({
          gymId: activeGymId,
          memberId: activeMemberId,
          machineCode: pick.code,
          targetMuscleGroup: pick.targetMuscle ?? undefined,
        });
      } catch (error) {
        if (error instanceof DuplicateRecommendationError) {
          showDuplicatePickToast(pick.code);
          return false;
        }
      }
    }
    setSelected({
      code: pick.code,
      name: pick.name,
      brandName: pick.brandName,
    });
    setTargetMuscle(pick.targetMuscle);
    return true;
  };

  const createRecommend = useMutation({
    mutationFn: async (pickOverride?: EasyMachinePickResult) => {
      const machineCode = pickOverride?.code ?? selected?.code;
      const muscleGroup =
        pickOverride !== undefined ? pickOverride.targetMuscle : targetMuscle;
      if (!machineCode || !user) throw new Error('missing');
      if (
        user.gender == null ||
        user.heightCm == null ||
        user.weightKg == null ||
        user.experienceLevel == null
      ) {
        throw new Error('profile');
      }
      if (activeGymId && activeMemberId) {
        await assertNoDuplicateToday({
          gymId: activeGymId,
          memberId: activeMemberId,
          machineCode,
          targetMuscleGroup: muscleGroup ?? undefined,
        });
      }
      const res = await recommendationApi.create({
        machineCode,
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
        ...(muscleGroup ? { targetMuscleGroup: muscleGroup } : {}),
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
      void queryClient.invalidateQueries({ queryKey: ['easy-history'] });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
    },
    onError: (error) => {
      if (error instanceof DuplicateRecommendationError) {
        showDuplicatePickToast(error.historyItem.machineCode);
        setSelected(null);
        setTargetMuscle(null);
        return;
      }
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
    mutationFn: async (ratingOverride?: FitRating) => {
      const rating = ratingOverride ?? fitRating;
      if (!recommendation || !selected || !rating) return;
      await recommendationFeedbackApi.submit({
        recommendationId: recommendation.id,
        fitRating: rating,
        ...preferenceScope,
      });
      if (rating === 'bad') {
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

  const finishForToday = () => {
    navigate(`${ROUTES.RECORDS}?tab=history&date=${getTodayDateKey()}`);
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
      onConfirm={async (pick) => {
        const accepted = await confirmMachinePick(pick);
        if (!accepted) return;
        setPickerOpen(false);
        setPickerInitialCode(null);
        if (step === 1) {
          createRecommend.mutate(pick);
        }
      }}
    />
  );

  if (step === 'done') {
    const machineLabel = savedMachineName || selected?.name || '—';

    return (
      <div className="easy-done">
        <div className="easy-done__inner">
          <div className="easy-done__hero">
            <div className="easy-done__celebrate" aria-hidden>
              <span className="easy-done__celebrate-ring" />
              <span className="easy-done__celebrate-mark">✓</span>
            </div>
            <h1 className="easy-done__title">{t('easyMode.doneTitle')}</h1>
            <p className="easy-done__machine">{machineLabel}</p>
            <p className="easy-done__note">{t('easyMode.doneSavedNote')}</p>
          </div>

          <div className="easy-done__actions">
            <button
              type="button"
              className="easy-done__choice easy-done__choice--continue"
              onClick={resetToMachineStep}
            >
              <span className="easy-done__choice-icon" aria-hidden>
                +
              </span>
              <span className="easy-done__choice-text">
                <strong>{t('easyMode.doneAnother')}</strong>
                <span>{t('easyMode.doneAnotherDesc')}</span>
              </span>
            </button>
            <button
              type="button"
              className="easy-done__choice easy-done__choice--finish"
              onClick={finishForToday}
            >
              <span className="easy-done__choice-icon" aria-hidden>
                →
              </span>
              <span className="easy-done__choice-text">
                <strong>{t('easyMode.doneHome')}</strong>
                <span>{t('easyMode.doneHomeDesc')}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'rate') {
    const machineLabel = savedMachineName || selected?.name || '—';
    const ratingPending = saveFeedbackAndPrefs.isPending;

    return (
      <div className="easy-shell easy-shell--rate">
        <header className="easy-shell__chrome">
          <div className="easy-shell__top">
            <span className="easy-shell__icon-btn easy-shell__icon-btn--spacer" aria-hidden>
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
        </header>

        <div className="easy-shell__body easy-rate">
          <div className="easy-rate-hero">
            <div className="easy-rate-hero__badge" aria-hidden>
              ✓
            </div>
            <h2 className="easy-rate-hero__title">{machineLabel}</h2>
            <p className="easy-rate-hero__prompt">{t('easyMode.fitPromptAfter')}</p>
          </div>

          <div className="easy-rate-choices" role="group" aria-label={t('easyMode.fitPromptAfter')}>
            <button
              type="button"
              className={`easy-rate-choice easy-rate-choice--good${
                fitRating === 'good' ? ' easy-rate-choice--selected' : ''
              }`}
              disabled={ratingPending}
              onClick={() => {
                setFitRating('good');
                saveFeedbackAndPrefs.mutate('good');
              }}
            >
              <span className="easy-rate-choice__icon easy-rate-choice__icon--good" aria-hidden>
                {ratingPending && fitRating === 'good' ? '…' : '👍'}
              </span>
              <span className="easy-rate-choice__text">
                <strong className="easy-rate-choice__label">{t('easyMode.fitGood')}</strong>
                <span className="easy-rate-choice__desc">{t('easyMode.fitGoodDesc')}</span>
              </span>
            </button>

            <button
              type="button"
              className={`easy-rate-choice easy-rate-choice--bad${
                fitRating === 'bad' ? ' easy-rate-choice--selected' : ''
              }`}
              disabled={ratingPending}
              onClick={() => setFitRating('bad')}
            >
              <span className="easy-rate-choice__icon easy-rate-choice__icon--bad" aria-hidden>
                ↗
              </span>
              <span className="easy-rate-choice__text">
                <strong className="easy-rate-choice__label">{t('easyMode.fitBad')}</strong>
                <span className="easy-rate-choice__desc">{t('easyMode.fitBadDesc')}</span>
              </span>
            </button>
          </div>

          {fitRating === 'bad' ? (
            <div className="easy-rate-adjust">
              <p className="easy-rate-adjust__lead">{t('easyMode.fitAdjustLead')}</p>
              <div className="easy-rate-adjust__fields">
                <div className="easy-rate-adjust__field">
                  <p className="easy-rate-adjust__label">{t('easyMode.adjustWeight')}</p>
                  <NumericStepper
                    value={adjWeight}
                    onChange={setAdjWeight}
                    min={0}
                    max={999}
                    step={5}
                    unit="kg"
                    size="default"
                    ariaLabel={t('easyMode.adjustWeight')}
                  />
                </div>
                <div className="easy-rate-adjust__field">
                  <p className="easy-rate-adjust__label">{t('easyMode.adjustReps')}</p>
                  <NumericStepper
                    value={adjReps}
                    onChange={setAdjReps}
                    min={1}
                    max={50}
                    step={1}
                    unit={t('easyMode.repsUnit')}
                    size="default"
                    ariaLabel={t('easyMode.adjustReps')}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="easy-shell__footer easy-rate__footer">
          {fitRating === 'bad' ? (
            <button
              type="button"
              className="easy-btn easy-btn--primary"
              disabled={ratingPending}
              onClick={() => saveFeedbackAndPrefs.mutate('bad')}
            >
              {ratingPending ? t('easyMode.working') : t('easyMode.fitSubmit')}
            </button>
          ) : null}
          <button
            type="button"
            className="easy-btn easy-btn--ghost"
            disabled={ratingPending}
            onClick={() => setStep('done')}
          >
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
          onPrimary={() => createRecommend.mutate(undefined)}
        >
          <div className="easy-s1">
            <div className="easy-s1-intro">
              <p
                className={`easy-s1-intro__gym${
                  activeGym?.name?.trim() ? '' : ' easy-s1-intro__gym--unset'
                }`}
              >
                <span className="easy-s1-intro__gym-dot" aria-hidden />
                {activeGym?.name?.trim() || t('easyMode.gymUnset')}
              </p>
              <h2 className="easy-s1-intro__title">{t('easyMode.s1Title')}</h2>
              <p className="easy-s1-intro__sub">{t('easyMode.s1Sub')}</p>
            </div>

            {!activeGymId ? (
              <Link to={ROUTES.HOME} className="easy-btn easy-btn--secondary easy-s1-find">
                {t('easyMode.pickGym')}
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className="easy-btn easy-btn--secondary easy-s1-find"
                  onClick={() => openPicker()}
                >
                  {t('easyMode.entrySearch')}
                </button>

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
          </div>
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
        <div className="easy-section-head">
          <h2 className="easy-heading">{recommendation.machineName || selected?.name}</h2>
          <p className="easy-sub">{t('easyMode.s2Title')}</p>
        </div>

        <div className="easy-metrics">
          <div className="easy-metric">
            <p className="easy-metric__label">{t('easyMode.weight')}</p>
            <p className="easy-metric__value">
              {settings.recommendedWeightKg != null ? `${settings.recommendedWeightKg}` : '—'}
              <span className="easy-metric__unit">kg</span>
            </p>
          </div>
          <div className="easy-metric">
            <p className="easy-metric__label">{t('easyMode.reps')}</p>
            <p className="easy-metric__value">{repsLabel(settings)}</p>
          </div>
        </div>

        <div className="easy-settings-list">
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
                  <span className="easy-setting-row__label">{row.label}</span>
                  <strong className="easy-setting-row__value">{row.value}</strong>
                </div>
              ) : null
            )}
        </div>

        <details className="easy-details" open>
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
      </EasyWizardShell>
    );
  }

  // step 3
  const completedSetCount = completed.slice(0, setCount).filter(Boolean).length;
  const recommendedWeight = recommendation?.settings.recommendedWeightKg;
  const recommendedReps = recommendation ? repsLabel(recommendation.settings) : null;

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
      <div className="easy-s3">
        <div className="easy-s3-intro">
          <h2 className="easy-s3-intro__title">{selected?.name}</h2>
          <p className="easy-s3-intro__sub">{t('easyMode.s3Title')}</p>
          {recommendation ? (
            <div className="easy-s3-intro__chips" aria-label={t('easyMode.s3Recommended')}>
              {recommendedWeight != null ? (
                <span className="easy-s3-chip">
                  {recommendedWeight}
                  <span className="easy-s3-chip__unit">kg</span>
                </span>
              ) : null}
              {recommendedReps ? (
                <span className="easy-s3-chip">
                  {recommendedReps}
                  <span className="easy-s3-chip__unit">{t('easyMode.repsUnit')}</span>
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="easy-s3-toolbar">
          <div className="easy-s3-toolbar__row">
            <span className="easy-s3-toolbar__label">{t('easyMode.setCount')}</span>
            <NumericStepper
              value={setCount}
              onChange={(v) => resizeSets(v ?? 1)}
              min={1}
              max={20}
              step={1}
              size="compact"
              ariaLabel={t('easyMode.setCount')}
              allowManualInput={false}
            />
          </div>
          <div className="easy-s3-progress">
            <div
              className="easy-s3-progress__bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={setCount}
              aria-valuenow={completedSetCount}
              aria-label={t('easyMode.s3Progress', { done: completedSetCount, total: setCount })}
            >
              <span
                className="easy-s3-progress__fill"
                style={{ width: `${setCount > 0 ? (completedSetCount / setCount) * 100 : 0}%` }}
              />
            </div>
            <p className="easy-s3-progress__label">
              {t('easyMode.s3Progress', { done: completedSetCount, total: setCount })}
            </p>
          </div>
        </div>

        <div className="easy-s3-sets">
          {weights.slice(0, setCount).map((w, index) => {
            const isDone = completed[index] ?? false;
            return (
              <div
                key={index}
                className={`easy-s3-set${isDone ? ' easy-s3-set--done' : ''}`}
              >
                <div className="easy-s3-set__badge" aria-hidden>
                  {isDone ? '✓' : index + 1}
                </div>
                <div className="easy-s3-set__main">
                  <p className="easy-s3-set__label">{t('easyMode.setN', { n: index + 1 })}</p>
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
                    size="default"
                    ariaLabel={t('easyMode.setN', { n: index + 1 })}
                  />
                </div>
                <button
                  type="button"
                  className={`easy-s3-set__done${isDone ? ' easy-s3-set__done--on' : ''}`}
                  aria-pressed={isDone}
                  onClick={() => {
                    setCompleted((prev) => {
                      const copy = [...prev];
                      copy[index] = !isDone;
                      return copy;
                    });
                  }}
                >
                  {t('easyMode.doneSet')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </EasyWizardShell>
  );
}
