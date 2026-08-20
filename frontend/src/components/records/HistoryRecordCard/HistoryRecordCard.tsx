import { Link } from 'react-router-dom';
import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  memo,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpDown,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Clock3,
  Heart,
  Settings,
  Target,
  X,
} from 'lucide-react';
import { WorkoutCardOrderControl } from '@/components/records/WorkoutCardOrderControl/WorkoutCardOrderControl';
import type { WorkoutCardOrderMove } from '@/utils/workoutCardOrder';
import { hapticTap } from '@/utils/haptic';
import '@/components/records/WorkoutCardOrderControl/WorkoutCardOrderControl.css';
import type {
  RecommendationSettings,
  SettingsActiveSource,
  TargetMuscleGroup,
} from '@machinefit/shared';
import {
  isFreeWeightMachineCode,
  resolveWorkoutLogSeedWeightKg,
  resolveWorkoutLogSeedReps,
} from '@machinefit/shared';
import { workoutCardApi, type FitRating } from '@/api';
import { SafeImage } from '@/components/media/SafeImage';
import { FitFeedbackPanel } from '@/components/recommendation/FitFeedbackPanel/FitFeedbackPanel';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import {
  WorkoutLogPanel,
  type WorkoutLogPanelControl,
} from '@/components/recommendation/WorkoutLogPanel/WorkoutLogPanel';
import { useMachineFitFeedback } from '@/hooks/useMachineFitFeedback';
import { useRecommendMachine } from '@/hooks/useRecommendMachine';
import { QUERY_KEYS } from '@/constants/query-keys';
import { machinePlaceholderUrl, resolveRecordMachineImageUrl } from '@/utils/catalogAssets';
import { formatHistoryDateHeader, formatHistoryTime, normalizeDateKey } from '@/utils/historyDate';
import type { HistoryRecordCard as HistoryRecordCardData } from '@/utils/historyRecordsDisplay';
import { useWorkoutLogSaved } from '@/hooks/useWorkoutLogSaved';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { useDoubleTapAction } from '@/hooks/useDoubleTapAction';
import { getWorkoutLogQueryTargetMuscle } from '@/utils/workoutLogCache';
import { getHistoryMuscleGroup } from '@/utils/freeWeightDisplay';
import { HistoryCardPlanActionsSheet } from '@/components/records/HistoryCardPlanActionsSheet/HistoryCardPlanActionsSheet';
import { HistoryCardGuideSegments } from '@/components/records/HistoryCardGuideSegments/HistoryCardGuideSegments';
import '@/styles/history-premium.css';
import '@/styles/recommendation.css';

interface HistoryRecordCardProps {
  card: HistoryRecordCardData;
  resultUrl: string;
  displayName: string;
  muscleGroup?: string;
  /** Batch-loaded fit rating (keeps 셋팅값 조정 필요 pressed before per-card fetch). */
  initialFitRating?: FitRating | null;
  initialCustomSettings?: Partial<RecommendationSettings>;
  initialActiveSource?: SettingsActiveSource;
  /** From favorites list — skips per-card check GET when boolean. */
  initialFavorited?: boolean | null;
  initialFavoriteId?: string;
  /** From workout-logs list — skips per-card log GET when boolean. */
  initialWorkoutLogSaved?: boolean | null;
  isAuthenticated: boolean;
  lockTargetMuscle: boolean;
  isFocused?: boolean;
  /** Soft highlight when this card belongs to today's date group. */
  isTodayDay?: boolean;
  onDelete: () => void;
  deleteDisabled?: boolean;
  /** 0-based index within the same calendar day group. */
  orderIndex?: number;
  orderTotal?: number;
  orderDisabled?: boolean;
  onOrderMove?: (move: WorkoutCardOrderMove) => void;
  isReordering?: boolean;
  /** Same-day calendar key for pointer drag-and-drop reorder. */
  reorderDateKey?: string;
  onReorderDragStart?: (index: number) => void;
  isDragSource?: boolean;
  isDragOver?: boolean;
  onCopyPlan?: () => void;
  onMovePlan?: () => void;
  planActionsDisabled?: boolean;
}

function getBookmarkAriaLabel(
  control: WorkoutLogPanelControl | null,
  isLogSaved: boolean,
  t: (key: string) => string
): string {
  if (!control) return t('machines:history.bookmarkSave');
  if (!isLogSaved) return t('machines:history.bookmarkSave');
  if (control.isDirty) return t('machines:history.bookmarkUpdate');
  return t('machines:history.bookmarkRemove');
}

export const HistoryRecordCard = memo(function HistoryRecordCard({
  card,
  resultUrl,
  displayName,
  muscleGroup,
  initialFitRating = null,
  initialCustomSettings,
  initialActiveSource,
  initialFavorited = null,
  initialFavoriteId,
  initialWorkoutLogSaved = null,
  isAuthenticated,
  lockTargetMuscle,
  isFocused = false,
  isTodayDay = false,
  onDelete,
  deleteDisabled = false,
  orderIndex,
  orderTotal,
  orderDisabled = false,
  onOrderMove,
  isReordering = false,
  reorderDateKey,
  onReorderDragStart,
  isDragSource = false,
  isDragOver = false,
  onCopyPlan,
  onMovePlan,
  planActionsDisabled = false,
}: HistoryRecordCardProps) {
  const orderTriggerRef = useRef<HTMLButtonElement>(null);
  const orderPanelRef = useRef<HTMLDivElement>(null);
  const [orderMenuOpen, setOrderMenuOpen] = useState(false);
  const [orderPanelStyle, setOrderPanelStyle] = useState<CSSProperties>({});
  const planRecEnsureRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const { createRecommendationAsync } = useRecommendMachine(card.machineCode);
  const canReorder =
    typeof orderIndex === 'number' &&
    typeof orderTotal === 'number' &&
    orderTotal > 1 &&
    Boolean(onOrderMove);
  const canDragReorder =
    canReorder &&
    !orderDisabled &&
    Boolean(onReorderDragStart) &&
    Boolean(reorderDateKey);
  const longPressTimerRef = useRef<number | null>(null);
  const pressOriginRef = useRef<{ x: number; y: number } | null>(null);
  const suppressOrderClickUntilRef = useRef(0);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pressOriginRef.current = null;
  }, []);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

  const handleOrderPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!canDragReorder || typeof orderIndex !== 'number') return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      clearLongPress();
      pressOriginRef.current = { x: event.clientX, y: event.clientY };
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTimerRef.current = null;
        pressOriginRef.current = null;
        suppressOrderClickUntilRef.current = Date.now() + 700;
        setOrderMenuOpen(false);
        hapticTap();
        onReorderDragStart?.(orderIndex);
      }, 420);
    },
    [canDragReorder, clearLongPress, onReorderDragStart, orderIndex]
  );

  const handleOrderPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!pressOriginRef.current || longPressTimerRef.current == null) return;
      const dx = event.clientX - pressOriginRef.current.x;
      const dy = event.clientY - pressOriginRef.current.y;
      if (dx * dx + dy * dy > 100) clearLongPress();
    },
    [clearLongPress]
  );

  const handleOrderPointerEnd = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  const handleOrderClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (Date.now() < suppressOrderClickUntilRef.current || isDragSource) return;
      setOrderMenuOpen((open) => !open);
    },
    [isDragSource]
  );

  const updateOrderPanelPosition = useCallback(() => {
    const trigger = orderTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const margin = 12;
    const gap = 6;
    const panelWidth = Math.min(232, window.innerWidth - margin * 2);
    let left = rect.right - panelWidth;
    left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));
    let top = rect.bottom + gap;
    const panelHeight = orderPanelRef.current?.offsetHeight ?? 196;
    if (top + panelHeight > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - gap - panelHeight);
    }
    setOrderPanelStyle({
      position: 'fixed',
      top,
      left,
      width: panelWidth,
      zIndex: 260,
    });
  }, []);

  useLayoutEffect(() => {
    if (!orderMenuOpen) return;
    updateOrderPanelPosition();
    const frame = window.requestAnimationFrame(updateOrderPanelPosition);
    window.addEventListener('resize', updateOrderPanelPosition);
    window.addEventListener('scroll', updateOrderPanelPosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateOrderPanelPosition);
      window.removeEventListener('scroll', updateOrderPanelPosition, true);
    };
  }, [orderMenuOpen, updateOrderPanelPosition]);

  useEffect(() => {
    if (!orderMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (orderTriggerRef.current?.contains(target)) return;
      if (orderPanelRef.current?.contains(target)) return;
      setOrderMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOrderMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [orderMenuOpen]);

  const { t, i18n } = useTranslation(['machines', 'common']);
  const [expanded, setExpanded] = useState(isFocused);
  const [planActionsOpen, setPlanActionsOpen] = useState(false);
  const [logControl, setLogControl] = useState<WorkoutLogPanelControl | null>(null);
  const [workoutLogSavedOverride, setWorkoutLogSavedOverride] = useState<boolean | null>(null);
  const logDate = normalizeDateKey(card.logDate);
  const cardTargetMuscle = getWorkoutLogQueryTargetMuscle(
    card.machineCode,
    card.targetMuscleGroup as TargetMuscleGroup | undefined
  );
  const cachedWorkoutLogSaved = useWorkoutLogSaved({
    machineCode: card.machineCode,
    logDate,
    targetMuscleGroup: cardTargetMuscle,
    isAuthenticated,
    initialSaved: initialWorkoutLogSaved,
  });
  const isWorkoutLogSaved = workoutLogSavedOverride ?? cachedWorkoutLogSaved;

  const canUseFitFeedback = isAuthenticated && Boolean(card.recommendationId);
  const fitFeedback = useMachineFitFeedback({
    recommendationId: card.recommendationId ?? '',
    machineCode: card.machineCode,
    recommendedSettings: card.settings,
    initialActiveSource: initialActiveSource,
    enabled: canUseFitFeedback && expanded,
  });
  const savedRating = fitFeedback.savedRating ?? initialFitRating;
  const showAdjustment = fitFeedback.showAdjustment;
  /** Prefer editing after tapping 셋팅값 조정 필요; after 선호값 저장 show read-only compare. */
  const [isEditingAdjustments, setIsEditingAdjustments] = useState(false);
  const [prefsSavedLocally, setPrefsSavedLocally] = useState(false);
  const hasSavedPreferences =
    prefsSavedLocally ||
    fitFeedback.hasSavedPreferences ||
    Boolean(initialCustomSettings && Object.keys(initialCustomSettings).length > 0);
  const adjustmentReadOnly = showAdjustment && hasSavedPreferences && !isEditingAdjustments;
  const customSettings =
    Object.keys(fitFeedback.customSettings).length > 0
      ? fitFeedback.customSettings
      : (initialCustomSettings ?? {});

  useEffect(() => {
    setWorkoutLogSavedOverride(null);
    setIsEditingAdjustments(false);
    setPrefsSavedLocally(false);
  }, [card.cardId]);

  useEffect(() => {
    if (savedRating !== 'bad') {
      setIsEditingAdjustments(false);
    }
  }, [savedRating]);

  useEffect(() => {
    if (isFocused) setExpanded(true);
  }, [isFocused]);

  // Legacy plan cards created without a recommendation — attach one so fit/settings
  // and the result-page destination match today's record cards.
  useEffect(() => {
    if (!isAuthenticated || !card.isPlanOnly || !card.workoutCardId) return;
    if (card.recommendationId) return;
    if (planRecEnsureRef.current === card.workoutCardId) return;
    planRecEnsureRef.current = card.workoutCardId;
    const workoutCardId = card.workoutCardId;
    void (async () => {
      try {
        const { result } = await createRecommendationAsync({
          targetMuscleGroup: card.targetMuscleGroup as TargetMuscleGroup | undefined,
          planDate: logDate,
          skipNavigate: true,
          skipHistory: true,
          skipDuplicateCheck: true,
        });
        await workoutCardApi.update(workoutCardId, { recommendationId: result.id });
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutCards });
      } catch {
        // Leave planRecEnsureRef set so we don't retry-spam on persistent errors.
      }
    })();
  }, [
    isAuthenticated,
    card.isPlanOnly,
    card.workoutCardId,
    card.recommendationId,
    card.targetMuscleGroup,
    logDate,
    createRecommendationAsync,
    queryClient,
  ]);
  const { isFavorited, toggleFavorite, isPending: isFavoritePending, canFavorite } = useFavoriteToggle({
    machineCode: card.machineCode,
    recommendationId: card.recommendationId,
    isAuthenticated,
    initialFavorited,
    initialFavoriteId,
  });

  const bookmarkActive = isWorkoutLogSaved;
  const bookmarkDirty = Boolean(logControl?.isDirty);
  const bookmarkPending = Boolean(logControl?.isActionPending);
  const machineImageUrl = resolveRecordMachineImageUrl(card.machineCode, {
    primaryImageUrl: card.primaryImageUrl,
    targetMuscleGroup: card.targetMuscleGroup,
    preferMuscleCover: isFreeWeightMachineCode(card.machineCode),
  });
  const resolvedMuscleGroup =
    muscleGroup ??
    getHistoryMuscleGroup(card.machineCode, card.muscleGroup, card.targetMuscleGroup);
  const muscleLabel = resolvedMuscleGroup
    ? t(`muscleGroups.${resolvedMuscleGroup}`, { defaultValue: resolvedMuscleGroup })
    : null;

  const showPlanMenu = Boolean(onCopyPlan) || Boolean(onMovePlan);
  const hasRecommendationSettings =
    card.settings.recommendedWeightKg != null ||
    card.settings.seatPosition != null ||
    card.settings.recommendedRepsMin != null ||
    card.settings.recommendedRepsMax != null;

  const canSavePreferences = showAdjustment && !adjustmentReadOnly;
  const badButtonSaveMode = savedRating === 'bad' && canSavePreferences;

  const handleWorkoutSave = useCallback(() => {
    if (!logControl || logControl.isActionPending || logControl.isLoading) return;
    if (!isWorkoutLogSaved) {
      setWorkoutLogSavedOverride(true);
    }
    logControl.save();
  }, [isWorkoutLogSaved, logControl]);

  const handleCompanionSave = useCallback(async () => {
    if (!canSavePreferences) return;
    await fitFeedback.savePreferencesAsync(() => {
      setPrefsSavedLocally(true);
      setIsEditingAdjustments(false);
    });
  }, [canSavePreferences, fitFeedback.savePreferencesAsync]);

  const bookmarkDisabled =
    !isAuthenticated || bookmarkPending || !logControl || logControl.isLoading || logControl.isActionPending;

  const handleBookmarkClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    if (!logControl || logControl.isActionPending || logControl.isLoading) return;

    if (!isWorkoutLogSaved) {
      handleWorkoutSave();
      return;
    }

    if (logControl.isDirty) {
      handleWorkoutSave();
      return;
    }

    setWorkoutLogSavedOverride(false);
    logControl.remove();
  };

  const handleFavoriteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    toggleFavorite();
  };

  const handleCollapseClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    event.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const collapseDetails = useCallback(() => {
    setExpanded(false);
  }, []);

  const doubleTapCollapse = useDoubleTapAction(collapseDetails, { enabled: expanded });

  const settingsPanel = (
    <RecommendationSettingsPanel
      settings={card.settings}
      variant="history"
      showAdjustment={showAdjustment}
      adjustmentReadOnly={adjustmentReadOnly}
      customSettings={showAdjustment ? customSettings : undefined}
      onCustomChange={
        showAdjustment && !adjustmentReadOnly ? fitFeedback.handleCustomChange : undefined
      }
      tileHref={showAdjustment ? undefined : resultUrl}
      tileAriaLabel={t('machines:detail.viewLastResult')}
    />
  );

  return (
    <article
      id={`history-item-${card.cardId}`}
      className={`history-record-card history-record-card--premium${
        isWorkoutLogSaved ? ' history-record-card--logged' : ' history-record-card--unlogged'
      }${isFocused ? ' history-record-card--focused' : ''}${
        isTodayDay ? ' history-record-card--today' : ''
      }${expanded ? '' : ' history-record-card--collapsed'}${
        isReordering ? ' history-record-card--reordering' : ''
      }${isDragSource ? ' history-record-card--dragging' : ''}${
        isDragOver ? ' history-record-card--drag-over' : ''
      }`}
      data-history-reorder-date={canDragReorder ? reorderDateKey : undefined}
      data-history-reorder-index={canDragReorder ? orderIndex : undefined}
      aria-grabbed={isDragSource || undefined}
      onPointerUp={doubleTapCollapse.onPointerUp}
      onDoubleClick={doubleTapCollapse.onDoubleClick}
    >
      <header className="history-record-card__header">
        <div className="history-record-card__hero">
          <div className="history-record-card__hero-top">
            <Link
              to={resultUrl}
              className="history-record-card__thumb-link"
              aria-label={t('machines:history.openDetailAria', { name: displayName })}
            >
              <div className="history-record-card__thumb">
                <SafeImage
                  src={machineImageUrl || machinePlaceholderUrl()}
                  fallbackSrc={machinePlaceholderUrl()}
                  alt=""
                  loading="lazy"
                  width={100}
                  height={100}
                />
                <span className="history-record-card__thumb-cue" aria-hidden>
                  <ChevronRight size={12} strokeWidth={2.6} />
                </span>
              </div>
            </Link>

            <div className="history-record-card__hero-aside">
              <div className="history-record-card__header-actions">
                {canReorder ? (
                  <>
                    <button
                      type="button"
                      ref={orderTriggerRef}
                      className={`history-record-card__order-trigger${
                        orderMenuOpen ? ' is-open' : ''
                      }${canDragReorder ? ' history-record-card__order-trigger--draggable' : ''}`}
                      aria-label={
                        canDragReorder
                          ? t('machines:history.orderMenuAndDragAria')
                          : t('machines:history.orderMenuAria')
                      }
                      title={
                        canDragReorder
                          ? t('machines:history.orderMenuAndDragAria')
                          : t('machines:history.orderMenuAria')
                      }
                      aria-haspopup="menu"
                      aria-expanded={orderMenuOpen}
                      disabled={orderDisabled}
                      onPointerDown={handleOrderPointerDown}
                      onPointerMove={handleOrderPointerMove}
                      onPointerUp={handleOrderPointerEnd}
                      onPointerCancel={handleOrderPointerEnd}
                      onClick={handleOrderClick}
                    >
                      <ArrowUpDown size={16} strokeWidth={2.25} aria-hidden />
                    </button>
                    {orderMenuOpen
                      ? createPortal(
                          <div
                            ref={orderPanelRef}
                            className="history-record-card__order-panel"
                            style={orderPanelStyle}
                            role="menu"
                            aria-label={t('machines:history.orderControlsLabel')}
                          >
                            <WorkoutCardOrderControl
                              variant="menu"
                              index={orderIndex!}
                              total={orderTotal!}
                              disabled={orderDisabled}
                              onMove={(move) => {
                                setOrderMenuOpen(false);
                                onOrderMove?.(move);
                              }}
                            />
                          </div>,
                          document.body
                        )
                      : null}
                  </>
                ) : null}
                {showPlanMenu ? (
                  <button
                    type="button"
                    className="history-record-card__order-trigger"
                    aria-label={t('machines:history.planCardMenuAria')}
                    aria-haspopup="dialog"
                    aria-expanded={planActionsOpen}
                    disabled={planActionsDisabled}
                    onClick={() => setPlanActionsOpen(true)}
                  >
                    <Settings size={16} strokeWidth={2.25} aria-hidden />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="history-record-card__collapse"
                  aria-expanded={expanded}
                  aria-label={expanded ? t('common:collapse') : t('common:expand')}
                  onClick={handleCollapseClick}
                >
                  <ChevronDown
                    size={16}
                    strokeWidth={2.25}
                    className={`history-record-card__collapse-icon${
                      expanded ? ' history-record-card__collapse-icon--open' : ''
                    }`}
                  />
                </button>
                <button
                  type="button"
                  className={`history-record-card__bookmark recommendation-result-page__favorite${
                    isFavorited ? ' history-record-card__bookmark--active recommendation-result-page__favorite--active' : ''
                  }`}
                  aria-label={
                    isFavorited
                      ? t('machines:recommendation.removeFavorite')
                      : t('machines:recommendation.saveFavorite')
                  }
                  aria-pressed={isFavorited}
                  onClick={handleFavoriteClick}
                  disabled={isFavoritePending || !canFavorite}
                >
                  <Heart
                    key={isFavorited ? 'favorited' : 'unfavorited'}
                    size={18}
                    strokeWidth={2.2}
                    fill={isFavorited ? 'currentColor' : 'none'}
                  />
                </button>
                <button
                  type="button"
                  className={`history-record-card__bookmark${
                    bookmarkActive ? ' history-record-card__bookmark--active' : ''
                  }${bookmarkDirty ? ' history-record-card__bookmark--dirty' : ''}`}
                  aria-label={getBookmarkAriaLabel(logControl, isWorkoutLogSaved, t)}
                  onClick={handleBookmarkClick}
                  disabled={bookmarkDisabled}
                >
                  <Bookmark
                    key={bookmarkActive ? 'saved' : 'unsaved'}
                    size={18}
                    strokeWidth={2.2}
                    fill={bookmarkActive ? 'currentColor' : 'none'}
                  />
                </button>
                <button
                  type="button"
                  className="history-record-card__remove"
                  aria-label={t('machines:history.remove')}
                  onClick={onDelete}
                  disabled={deleteDisabled}
                >
                  <X size={16} strokeWidth={2.25} />
                </button>
              </div>

              <div className="history-record-card__hero-copy">
                <Link
                  to={resultUrl}
                  className="history-record-card__title-link"
                  aria-label={t('machines:history.openDetailAria', { name: displayName })}
                >
                  <h2 className="history-record-card__machine-name">
                    <span className="history-record-card__machine-name-text">{displayName}</span>
                    <ChevronRight
                      className="history-record-card__title-cue"
                      size={16}
                      strokeWidth={2.4}
                      aria-hidden
                    />
                  </h2>
                </Link>

                <Link to={resultUrl} className="history-record-card__meta-link">
                  <div className="history-record-card__meta">
                    {muscleLabel ? (
                      <>
                        <span className="history-record-card__meta-item history-record-card__muscle">
                          <Target size={11} strokeWidth={2.25} aria-hidden />
                          {muscleLabel}
                        </span>
                        <span className="history-record-card__meta-divider" aria-hidden>
                          ·
                        </span>
                      </>
                    ) : null}
                    <span className="history-record-card__meta-item history-record-card__time">
                      <Clock3 size={11} strokeWidth={2.25} aria-hidden />
                      {formatHistoryTime(card.viewedAt, i18n.language)}
                    </span>
                    <span className="history-record-card__meta-divider" aria-hidden>
                      ·
                    </span>
                    <span
                      className={`history-record-card__status${
                        isWorkoutLogSaved ? ' history-record-card__status--saved' : ''
                      }`}
                    >
                      {isWorkoutLogSaved
                        ? t('machines:history.workoutSavedBadge')
                        : t('machines:history.workoutUnsavedBadge')}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {expanded ? (
        <>
          {canUseFitFeedback ? (
            <FitFeedbackPanel
              savedRating={savedRating}
              showIntroText={false}
              badButtonSaveMode={badButtonSaveMode}
              onBadSave={handleWorkoutSave}
              preferencesDirty={fitFeedback.settingsDirty}
              onRating={(rating) => {
                if (rating === 'bad') setIsEditingAdjustments(true);
                else setIsEditingAdjustments(false);
                fitFeedback.handleRating(rating);
              }}
              isPending={
                fitFeedback.isFeedbackPending ||
                fitFeedback.isPreferencesPending ||
                Boolean(logControl?.isActionPending)
              }
            />
          ) : null}
          {hasRecommendationSettings ? (
            <div className="history-record-card__section">{settingsPanel}</div>
          ) : null}
        </>
      ) : null}

      {/* Keep mounted while collapsed so header 기록 (bookmark) stays enabled. */}
      <WorkoutLogPanel
        key={card.cardId}
        machineCode={card.machineCode}
        machineName={card.machineName}
        recommendationId={card.recommendationId}
        suggestedWeightKg={resolveWorkoutLogSeedWeightKg({
          fitRating: savedRating,
          // Live on-screen 조정중량 (not only last saved prefs row).
          adjustedWeight:
            fitFeedback.displayAdjustedSettings?.recommendedWeightKg ??
            customSettings.recommendedWeightKg,
          // On-screen 추천중량 (AI recommendation shown when “잘 맞음”).
          recommendedWeight: card.settings.recommendedWeightKg,
        })}
        volumeReps={resolveWorkoutLogSeedReps({
          fitRating: savedRating,
          adjustedReps:
            fitFeedback.displayAdjustedSettings?.recommendedRepsMin ??
            fitFeedback.displayAdjustedSettings?.recommendedRepsMax ??
            customSettings.recommendedRepsMin ??
            customSettings.recommendedRepsMax,
          // 잘맞음 → 추천횟수 (card.settings is AI/base recommendation).
          recommendedReps:
            card.settings.recommendedRepsMin ?? card.settings.recommendedRepsMax,
        })}
        isAuthenticated={isAuthenticated}
        variant="history"
        logDate={logDate}
        idPrefix={`history-workout-${card.cardId}`}
        targetMuscleGroup={cardTargetMuscle}
        lockTargetMuscle={lockTargetMuscle}
        showVoiceCoach={expanded}
        onControlReady={setLogControl}
        onSavedChange={setWorkoutLogSavedOverride}
        onVolumeRepsChange={
          showAdjustment && !adjustmentReadOnly
            ? (reps) =>
                fitFeedback.handleCustomChange(
                  'recommendedRepsMin',
                  String(reps),
                  'number'
                )
            : undefined
        }
        onCompanionSave={canUseFitFeedback ? handleCompanionSave : undefined}
        companionSavePending={fitFeedback.isPreferencesPending}
        planSeed={
          card.planSetCount != null && card.planSetWeightsKg?.length
            ? {
                setCount: card.planSetCount,
                setWeightsKg: card.planSetWeightsKg,
                ...(card.planDiary ? { diary: card.planDiary } : {}),
              }
            : undefined
        }
        workoutCardId={card.workoutCardId}
        voicePrefsSeed={card.planVoicePrefs}
      />

      <HistoryCardGuideSegments
        machineCode={card.machineCode}
        recommendationId={card.recommendationId}
        enabled={isAuthenticated}
      />

      {expanded ? (
        <button
          type="button"
          className="history-record-card__body-toggle"
          aria-expanded={true}
          onClick={() => setExpanded(false)}
        >
          <span className="history-record-card__body-toggle-label">
            {t('common:collapseCardDetails')}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={2.25}
            className="history-record-card__collapse-icon history-record-card__collapse-icon--open"
            aria-hidden
          />
        </button>
      ) : (
        <button
          type="button"
          className="history-record-card__body-toggle"
          aria-expanded={false}
          onClick={() => setExpanded(true)}
        >
          <span className="history-record-card__body-toggle-label">
            {t('common:expandCardDetails')}
          </span>
          <ChevronDown size={16} strokeWidth={2.25} aria-hidden />
        </button>
      )}

      <HistoryCardPlanActionsSheet
        open={planActionsOpen}
        machineName={displayName}
        currentDateLabel={formatHistoryDateHeader(logDate, i18n.language)}
        canMove={Boolean(onMovePlan)}
        canCopy={Boolean(onCopyPlan)}
        disabled={planActionsDisabled}
        onClose={() => setPlanActionsOpen(false)}
        onMove={() => onMovePlan?.()}
        onCopy={() => onCopyPlan?.()}
      />
    </article>
  );
});
