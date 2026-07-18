import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { RecommendationSettings, WeightRecommendationBasis } from '@machinefit/shared';
import { roundRecommendWeightKg } from '@machinefit/shared';
import { SettingValueCard } from '@/components/recommendation/SettingValueCard/SettingValueCard';
import { WeightBasisDialog } from '@/components/recommendation/WeightBasisDialog/WeightBasisDialog';
import { useUserUnits } from '@/hooks/useUserUnits';
import '@/styles/recommendation.css';

type SettingField = {
  key: keyof RecommendationSettings;
  labelKey: string;
  isWeight?: boolean;
  inputType: 'number' | 'text';
};

const SETTING_FIELDS: SettingField[] = [
  { key: 'recommendedWeightKg', labelKey: 'settings.weight', isWeight: true, inputType: 'number' },
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
  variant?: 'hero' | 'compact' | 'result';
  showAdjustment?: boolean;
  customSettings?: Partial<RecommendationSettings>;
  onCustomChange?: (
    key: keyof RecommendationSettings,
    raw: string,
    type: 'number' | 'text'
  ) => void;
  onSavePreferences?: () => void;
  isPreferencesPending?: boolean;
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

function renderSettingCard(
  item: SettingDisplayItem,
  options: {
    highlight?: boolean;
    compact?: boolean;
    labelExtra?: ReactNode;
    showAdjustment?: boolean;
    customSettings?: Partial<RecommendationSettings>;
    onCustomChange?: RecommendationSettingsPanelProps['onCustomChange'];
    recommendedLabel: string;
    adjustedLabel: string;
  }
) {
  const adjusted = options.customSettings?.[item.key] ?? item.rawValue;
  const adjustedValue = adjusted != null ? String(adjusted) : '';

  return (
    <SettingValueCard
      label={item.label}
      value={item.value}
      unit={item.unit}
      highlight={options.highlight}
      compact={options.compact}
      labelExtra={options.labelExtra}
      showAdjustment={options.showAdjustment}
      recommendedLabel={options.recommendedLabel}
      adjustedLabel={options.adjustedLabel}
      adjustedValue={adjustedValue}
      adjustedPlaceholder={String(item.rawValue)}
      adjustedInputType={item.inputType}
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
  customSettings,
  onCustomChange,
  onSavePreferences,
  isPreferencesPending = false,
}: RecommendationSettingsPanelProps) {
  const { t } = useTranslation(['machines', 'common']);
  const { formatWeight } = useUserUnits();
  const [basisOpen, setBasisOpen] = useState(false);
  const compact = variant === 'compact' || variant === 'result';

  const items: SettingDisplayItem[] = [];

  for (const field of SETTING_FIELDS) {
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
    customSettings,
    onCustomChange,
    recommendedLabel: t('machines:feedback.recommendedShort'),
    adjustedLabel: t('machines:feedback.adjustedShort'),
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
          {isPreferencesPending ? t('common:actions.submit') : t('machines:feedback.savePreferences')}
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
        }`}
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
