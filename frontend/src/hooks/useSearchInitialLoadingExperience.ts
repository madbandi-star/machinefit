import { useEffect, useRef, useState } from 'react';
import {
  SEARCH_INITIAL_LOAD_SLOW_MS,
  getSearchInitialLoadEstimateMs,
  recordSearchInitialLoadMs,
} from '@/utils/searchInitialLoadEstimate';

export type SearchLoadStageId =
  | 'muscle'
  | 'brands'
  | 'machines'
  | 'finalize'
  | 'done';

export interface SearchInitialLoadingStages {
  muscleReady: boolean;
  brandsReady: boolean;
  /** Machines query finished successfully for the current key (not error/retry). */
  machinesReady: boolean;
  /** True while the initial search bundle is still showing the machine list skeleton. */
  initialBundlePending: boolean;
}

export interface SearchInitialLoadingExperienceState {
  /** Whether to render the Progress + Tips panel. */
  visible: boolean;
  /** 0–100 derived from real stage completion (never time-faked). */
  progress: number;
  stageId: SearchLoadStageId;
  stageLabel: string;
  /** Brief hold at 100% before the panel unmounts. */
  completing: boolean;
}

const STAGE_LABELS: Record<SearchLoadStageId, string> = {
  muscle: '근육군 정보를 확인하는 중...',
  brands: '브랜드 정보를 불러오는 중...',
  machines: '추천 머신을 찾는 중...',
  finalize: '검색 결과를 준비하는 중...',
  done: '검색 결과를 준비했습니다',
};

/**
 * Stage-based progress for first search-page entry only.
 * Weights reflect fetch importance (muscle images → brands → machines → settle).
 */
function computeProgress(stages: SearchInitialLoadingStages): {
  progress: number;
  stageId: SearchLoadStageId;
} {
  const muscleDone = stages.muscleReady;
  const brandsDone = stages.brandsReady;
  const machinesDone = stages.machinesReady;

  if (muscleDone && brandsDone && machinesDone) {
    return { progress: 100, stageId: 'done' };
  }

  let progress = 0;
  if (muscleDone) progress += 20;
  else return { progress: Math.max(progress, 8), stageId: 'muscle' };

  if (brandsDone) progress += 20;
  else return { progress: Math.max(progress, 28), stageId: 'brands' };

  if (machinesDone) progress += 45;
  else return { progress: Math.max(progress, 55), stageId: 'machines' };

  return { progress: 92, stageId: 'finalize' };
}

type ShowPolicy = 'immediate' | 'never' | 'deferred';

function resolveShowPolicy(): ShowPolicy {
  const estimate = getSearchInitialLoadEstimateMs();
  if (estimate == null) return 'deferred';
  if (estimate >= SEARCH_INITIAL_LOAD_SLOW_MS) return 'immediate';
  return 'never';
}

/**
 * Decides when to show Loading Experience for the *first* search-page data bundle.
 * Later filter/search refetches never re-enable this experience.
 */
export function useSearchInitialLoadingExperience(
  stages: SearchInitialLoadingStages
): SearchInitialLoadingExperienceState {
  const startedAtRef = useRef<number | null>(null);
  const recordedRef = useRef(false);
  const policyRef = useRef<ShowPolicy>(resolveShowPolicy());
  const wasVisibleRef = useRef(false);

  const [initialPassDone, setInitialPassDone] = useState(false);
  const [deferredEligible, setDeferredEligible] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [holdVisible, setHoldVisible] = useState(false);

  const stillInitial = !initialPassDone && stages.initialBundlePending;

  // Start timer on first pending initial bundle.
  useEffect(() => {
    if (initialPassDone) return;
    if (!stages.initialBundlePending) return;
    if (startedAtRef.current == null) {
      startedAtRef.current = performance.now();
    }
  }, [stages.initialBundlePending, initialPassDone]);

  // Eligibility by policy (history median / cold fallback).
  useEffect(() => {
    if (initialPassDone) return;
    if (!stages.initialBundlePending) {
      setDeferredEligible(false);
      return;
    }

    const policy = policyRef.current;
    if (policy === 'immediate') {
      setDeferredEligible(true);
      return;
    }
    if (policy === 'never') {
      setDeferredEligible(false);
      return;
    }

    // Cold start: reveal only if still waiting after the slow threshold.
    const timer = window.setTimeout(() => {
      if (!initialPassDone) setDeferredEligible(true);
    }, SEARCH_INITIAL_LOAD_SLOW_MS);
    return () => window.clearTimeout(timer);
  }, [stages.initialBundlePending, initialPassDone]);

  // Complete initial pass and optionally hold at 100% if the panel was shown.
  useEffect(() => {
    if (initialPassDone) return;
    if (stages.initialBundlePending) return;

    if (startedAtRef.current != null && !recordedRef.current) {
      recordedRef.current = true;
      recordSearchInitialLoadMs(performance.now() - startedAtRef.current);
    }

    if (wasVisibleRef.current || holdVisible) {
      setCompleting(true);
      setHoldVisible(true);
      const t = window.setTimeout(() => {
        setCompleting(false);
        setHoldVisible(false);
        setDeferredEligible(false);
        setInitialPassDone(true);
      }, 220);
      return () => window.clearTimeout(t);
    }

    setInitialPassDone(true);
  }, [stages.initialBundlePending, initialPassDone, holdVisible]);

  const { progress: rawProgress, stageId } = computeProgress(stages);
  const progress = completing || stageId === 'done' ? 100 : rawProgress;
  const labelStage = completing || stageId === 'done' ? 'done' : stageId;

  const visible =
    !initialPassDone &&
    (stillInitial || holdVisible) &&
    (deferredEligible || holdVisible);

  useEffect(() => {
    if (visible) wasVisibleRef.current = true;
  }, [visible]);

  return {
    visible,
    progress,
    stageId: labelStage,
    stageLabel: STAGE_LABELS[labelStage],
    completing,
  };
}
