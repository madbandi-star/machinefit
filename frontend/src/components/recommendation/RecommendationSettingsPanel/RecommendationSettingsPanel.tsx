import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { RecommendationSettings, WeightRecommendationBasis } from '@machinefit/shared';
import { recommendRepsForGoal, roundRecommendWeightKg } from '@machinefit/shared';
import { SettingValueCard } from '@/components/recommendation/SettingValueCard/SettingValueCard';
import { WeightBasisDialog } from '@/components/recommendation/WeightBasisDialog/WeightBasisDialog';
import { ROM_SETTING_PRESETS } from '@/constants/rom-setting-presets';
import { HISTORY_SETTING_ICON } from '@/constants/history-setting-icons';
import {
  HISTORY_LUCIDE_SETTING_ICON,
} from '@/constants/history-lucide-icons';
import { useUserUnits } from '@/hooks/useUserUnits';
import { useAuthStore } from '@/store/auth.store';
import type { IconName } from '@/components/icons/Icon';
import '@/styles/recommendation.css';

type SettingField = {
  key: keyof RecommendationSettings;
  labelKey: string;
  isWeight?: boolean;
  isReps?: boolean;
  inputType: 'number' | 'text';
};

const SETTING_FIELDS: SettingField[] = [
  { key: 'recommendedWeightKg', labelKey: 'settings.weight', isWeight: true, inputType: 'number' },
  { key: 'recommendedRepsMin', labelKey: 'settings.reps', isReps: true, inputType: 'number' },
  { key: 'seatPosition', labelKey: 'settings.seat', inputType: 'number' },
  { key: 'backPadPosition', labelKey: 'settings.backPad', inputType: 'number' },
  { key: 'footPosition', labelKey: 'settings.foot', inputType: 'number' },
  { key: 'handlePosition', labelKey: 'settings.handle', inputType: 'number' },
  { key: 'romSetting', labelKey: 'settings.rom', inputType: 'text' },
];

interface SettingDisplayItem {
  key: keyof RecommendationSettings;
  label: string;
  value: string | number;
  rawValue: string | number;
  unit?: string;
  isWeight?: boolean;
  inputType: 'number' | 'text';
}

interface RecommendationSettingsPanelProps {
  settings: RecommendationSettings;
  weightBasis?: WeightRecommendationBasis;
  variant?: 'hero' | 'compact' | 'result' | 'history';
  showAdjustment?: boolean;
  adjustmentReadOnly?: boolean;
  customSettings?: Partial<RecommendationSettings>;
  onCustomChange?: (
    key: keyof RecommendationSettings,
    raw: string,
    type: 'number' | 'text'
  ) => void;
  onSavePreferences?: () => void;
  isPreferencesPending?: boolean;
  /** Show detail-adjust hint on the ROM tile (history cards). */
  showDetailAdjustNavHint?: boolean;
}

function WeightBasisTrigger({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation('machines');

  return (
    <button
      type="button"
      className="weight-basis-trigger"
      onClick={onClick}
      aria-haspopup="dialog"
    >
      {t('weightBasis.label')}
    </button>
  );
}

const COMPARE_LABEL_KEYS: Partial<
  Record<keyof RecommendationSettings, { recommended: string; adjusted: string }>
> = {
  recommendedWeightKg: {
    recommended: 'feedback.compareRecommendedWeight',
    adjusted: 'feedback.compareAdjustedWeight',
  },
  seatPosition: {
    recommended: 'feedback.compareRecommendedSeat',
    adjusted: 'feedback.compareAdjustedSeat',
  },
  backPadPosition: {
    recommended: 'feedback.compareRecommendedBackPad',
    adjusted: 'feedback.compareAdjustedBackPad',
  },
  handlePosition: {
    recommended: 'feedback.compareRecommendedHandle',
    adjusted: 'feedback.compareAdjustedHandle',
  },
  romSetting: {
    recommended: 'feedback.compareRecommendedRom',
    adjusted: 'feedback.compareAdjustedRom',
  },
};

function formatAdjustedDisplayValue(
  item: SettingDisplayItem,
  customSettings: Partial<RecommendationSettings> | undefined,
  formatWeight: (kg: number) => string
): string {
  const raw = customSettings?.[item.key];
  if (raw == null) return String(item.rawValue);

  if (item.isWeight && typeof raw === 'number') {
    const formatted = formatWeight(roundRecommendWeightKg(raw));
    return formatted.split(' ')[0] ?? formatted;
  }

  return String(raw);
}

function resolveAdjustedValue(
  item: SettingDisplayItem,
  options: {
    showAdjustment?: boolean;
    adjustmentReadOnly?: boolean;
    customSettings?: Partial<RecommendationSettings>;
    formatWeight: (kg: number) => string;
  }
): string {
  if (options.customSettings && item.key in options.customSettings) {
    const raw = options.customSettings[item.key];
    if (raw == null || raw === '') return '';

    if (options.showAdjustment && options.adjustmentReadOnly && item.isWeight && typeof raw === 'number') {
      return formatAdjustedDisplayValue(item, options.customSettings, options.formatWeight);
    }

    return String(raw);
  }

  return String(item.rawValue);
}

function getCompareLabels(
  item: SettingDisplayItem,
  options: {
    showAdjustment?: boolean;
    adjustmentReadOnly?: boolean;
    historyVariant?: boolean;
    t: (key: string) => string;
    recommendedLabel: string;
    adjustedLabel: string;
  }
) {
  if (options.showAdjustment && options.historyVariant) {
    return {
      recommendedLabel: options.t('machines:history.compareRecommended'),
      adjustedLabel: options.adjustmentReadOnly
        ? options.t('machines:history.compareCurrent')
        : options.t('machines:feedback.adjustedShort'),
    };
  }

  const compareKeys = COMPARE_LABEL_KEYS[item.key];
  if (options.showAdjustment && options.adjustmentReadOnly && compareKeys) {
    return {
      recommendedLabel: options.t(`machines:${compareKeys.recommended}`),
      adjustedLabel: options.t(`machines:${compareKeys.adjusted}`),
    };
  }

  return {
    recommendedLabel: options.recommendedLabel,
    adjustedLabel: options.adjustedLabel,
  };
}

function renderSettingCard(
  item: SettingDisplayItem,
  options: {
    highlight?: boolean;
    compact?: boolean;
    labelExtra?: ReactNode;
    showAdjustment?: boolean;
    adjustmentReadOnly?: boolean;
    customSettings?: Partial<RecommendationSettings>;
    onCustomChange?: RecommendationSettingsPanelProps['onCustomChange'];
    recommendedLabel: string;
    adjustedLabel: string;
    formatWeight: (kg: number) => string;
    t: (key: string) => string;
    labelIcon?: IconName;
    labelIconNode?: ReactNode;
    historyVariant?: boolean;
  }
) {
  const adjustedValue = resolveAdjustedValue(item, options);

  const { recommendedLabel, adjustedLabel } = getCompareLabels(item, options);

  return (
    <SettingValueCard
      label={item.label}
      value={item.value}
      unit={item.unit}
      highlight={options.highlight}
      compact={options.compact}
      labelExtra={options.labelExtra}
      labelIcon={options.labelIcon}
      labelIconNode={options.labelIconNode}
      showAdjustment={options.showAdjustment}
      adjustmentReadOnly={options.adjustmentReadOnly}
      recommendedLabel={recommendedLabel}
      adjustedLabel={adjustedLabel}
      adjustedValue={adjustedValue}
      adjustedPlaceholder={String(item.rawValue)}
      adjustedInputType={item.inputType}
      quickPickOptions={
        options.showAdjustment && !options.adjustmentReadOnly && item.key === 'romSetting'
          ? ROM_SETTING_PRESETS.map((preset) => ({
              label: preset.label,
              value: preset.value,
            }))
          : undefined
      }
      quickPicksAriaLabel={
        item.key === 'romSetting' ? options.t('machines:feedback.romPresetsLabel') : undefined
      }
      onAdjustedChange={(raw) =>
        options.onCustomChange?.(item.key, raw, item.inputType)
      }
    />
  );
}

export function RecommendationSettingsPanel({
  settings,
  weightBasis,
  variant = 'hero',
  showAdjustment = false,
  adjustmentReadOnly = false,
  customSettings,
  onCustomChange,
  onSavePreferences,
  isPreferencesPending = false,
  showDetailAdjustNavHint = false,
}: RecommendationSettingsPanelProps) {
  const { t } = useTranslation(['machines', 'common']);
  const { formatWeight } = useUserUnits();
  const workoutGoal = useAuthStore((s) => s.user?.workoutGoal);
  const experienceLevel = useAuthStore((s) => s.user?.experienceLevel);
  const [basisOpen, setBasisOpen] = useState(false);
  const compact = variant === 'compact' || variant === 'result';

  const items: SettingDisplayItem[] = [];

  for (const field of SETTING_FIELDS) {
    if (showAdjustment && !COMPARE_LABEL_KEYS[field.key] && !field.isReps) continue;

    if (field.isReps) {
      const range =
        settings.recommendedRepsMin != null
          ? {
              min: settings.recommendedRepsMin,
              max: settings.recommendedRepsMax ?? settings.recommendedRepsMin,
            }
          : recommendRepsForGoal(workoutGoal, experienceLevel ?? 'intermediate');
      const value =
        range.max !== range.min ? `${range.min}–${range.max}` : String(range.min);
      items.push({
        key: field.key,
        label: t(`machines:${field.labelKey}`),
        value,
        rawValue: range.min,
        unit: t('machines:settings.repsUnit'),
        inputType: field.inputType,
      });
      continue;
    }

    const raw = settings[field.key];
    if (raw == null) continue;

    if (field.isWeight && typeof raw === 'number') {
      const formatted = formatWeight(roundRecommendWeightKg(raw));
      const parts = formatted.split(' ');
      items.push({
        key: field.key,
        label: t(`machines:${field.labelKey}`),
        value: parts[0] ?? formatted,
        rawValue: roundRecommendWeightKg(raw),
        unit: parts.slice(1).join(' ') || undefined,
        isWeight: true,
        inputType: field.inputType,
      });
      continue;
    }

    items.push({
      key: field.key,
      label: t(`machines:${field.labelKey}`),
      value: raw,
      rawValue: raw,
      inputType: field.inputType,
    });
  }

  const renderLabelExtra = (item: SettingDisplayItem) => {
    if (!item.isWeight || !weightBasis) return undefined;
    return <WeightBasisTrigger onClick={() => setBasisOpen(true)} />;
  };

  const cardOptions = {
    showAdjustment,
    adjustmentReadOnly,
    customSettings,
    onCustomChange,
    recommendedLabel: t('machines:feedback.recommendedShort'),
    adjustedLabel: t('machines:feedback.adjustedShort'),
    formatWeight,
    t,
  };

  const saveFooter =
    showAdjustment && onSavePreferences ? (
      <div className="recommendation-settings-panel__save-row">
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={onSavePreferences}
          disabled={isPreferencesPending}
        >
          {isPreferencesPending ? t('machines:feedback.preferencesSaving') : t('machines:feedback.savePreferences')}
        </button>
      </div>
    ) : null;

  if (items.length === 0) {
    return (
      <p className="recommendation-settings-panel__empty">
        {t('machines:recommendation.emptySettings')}
      </p>
    );
  }

  const basisDialog =
    weightBasis != null ? (
      <WeightBasisDialog
        open={basisOpen}
        basis={weightBasis}
        onClose={() => setBasisOpen(false)}
      />
    ) : null;

  if (variant === 'history' && items.length > 0) {
    return (
      <>
        <div
          className={`recommendation-settings-panel recommendation-settings-panel--history${
            showAdjustment ? ' recommendation-settings-panel--compare' : ''
          }${showAdjustment && !adjustmentReadOnly ? ' recommendation-settings-panel--adjusting' : ''}`}
          role="list"
          aria-label={t('machines:recommendation.title')}
        >
          <div
            className="recommendation-settings-panel__grid recommendation-settings-panel__grid--history"
            role="presentation"
          >
            {items.map((item) => {
              const LucideIcon = HISTORY_LUCIDE_SETTING_ICON[item.key];
              return (
                <div key={item.key} role="listitem" className="history-mini-setting-wrap">
                  {renderSettingCard(item, {
                    compact: true,
                    highlight: item.isWeight,
                    labelExtra: renderLabelExtra(item),
                    labelIcon: HISTORY_SETTING_ICON[item.key],
                    labelIconNode: LucideIcon ? (
                      <LucideIcon size={13} strokeWidth={2.25} className="history-mini-setting__lucide" />
                    ) : undefined,
                    historyVariant: true,
                    ...cardOptions,
                  })}
                </div>
              );
            })}
          </div>
          {showDetailAdjustNavHint && items.some((item) => item.key === 'romSetting') ? (
            <p className="history-mini-setting__nav-hint" aria-hidden="true">
              {t('machines:recommendation.romDetailAdjustHint')}
            </p>
          ) : null}
          {saveFooter}
        </div>
        {basisDialog}
      </>
    );
  }

  if (variant === 'result' && items.length > 0) {
    return (
      <>
        <div
          className={`recommendation-settings-panel recommendation-settings-panel--result${
            showAdjustment ? ' recommendation-settings-panel--adjusting' : ''
          }`}
          role="list"
          aria-label={t('machines:recommendation.title')}
        >
          <div
            className="recommendation-settings-panel__grid recommendation-settings-panel__grid--dense"
            role="presentation"
          >
            {items.map((item) => (
              <div key={item.key} role="listitem">
                {renderSettingCard(item, {
                  compact: true,
                  highlight: item.isWeight,
                  labelExtra: renderLabelExtra(item),
                  ...cardOptions,
                })}
              </div>
            ))}
          </div>
          {saveFooter}
        </div>
        {basisDialog}
      </>
    );
  }

  if (!compact && items.length > 0) {
    const [hero, ...rest] = items;

    return (
      <>
        <div
          className={`recommendation-settings-panel recommendation-settings-panel--dashboard${
            showAdjustment ? ' recommendation-settings-panel--adjusting' : ''
          }`}
          role="list"
          aria-label={t('machines:recommendation.title')}
        >
          <div role="listitem">
            {renderSettingCard(hero, {
              highlight: true,
              labelExtra: renderLabelExtra(hero),
              ...cardOptions,
            })}
          </div>
          {rest.length > 0 && (
            <div className="recommendation-settings-panel__grid" role="presentation">
              {rest.map((item) => (
                <div key={item.key} role="listitem">
                  {renderSettingCard(item, {
                    compact: true,
                    labelExtra: renderLabelExtra(item),
                    ...cardOptions,
                  })}
                </div>
              ))}
            </div>
          )}
          {saveFooter}
        </div>
        {basisDialog}
      </>
    );
  }

  return (
    <>
      <div
        className={`recommendation-settings-panel${compact ? ' recommendation-settings-panel--compact' : ''}${
          showAdjustment ? ' recommendation-settings-panel--adjusting' : ''
        }${showAdjustment && adjustmentReadOnly ? ' recommendation-settings-panel--compare' : ''}`}
        role="list"
        aria-label={t('machines:recommendation.title')}
      >
        {items.map((item) => (
          <div key={item.key} role="listitem">
            {renderSettingCard(item, {
              compact,
              labelExtra: renderLabelExtra(item),
              ...cardOptions,
            })}
          </div>
        ))}
        {saveFooter}
      </div>
      {basisDialog}
    </>
  );
}
