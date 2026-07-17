import { useState } from 'react';
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
};

const SETTING_FIELDS: SettingField[] = [
  { key: 'recommendedWeightKg', labelKey: 'settings.weight', isWeight: true },
  { key: 'seatPosition', labelKey: 'settings.seat' },
  { key: 'backPadPosition', labelKey: 'settings.backPad' },
  { key: 'footPosition', labelKey: 'settings.foot' },
  { key: 'handlePosition', labelKey: 'settings.handle' },
  { key: 'romSetting', labelKey: 'settings.rom' },
];

interface SettingDisplayItem {
  key: keyof RecommendationSettings;
  label: string;
  value: string | number;
  unit?: string;
  isWeight?: boolean;
}

interface RecommendationSettingsPanelProps {
  settings: RecommendationSettings;
  weightBasis?: WeightRecommendationBasis;
  variant?: 'hero' | 'compact';
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

export function RecommendationSettingsPanel({
  settings,
  weightBasis,
  variant = 'hero',
}: RecommendationSettingsPanelProps) {
  const { t } = useTranslation('machines');
  const { formatWeight } = useUserUnits();
  const [basisOpen, setBasisOpen] = useState(false);
  const compact = variant === 'compact';

  const items: SettingDisplayItem[] = [];

  for (const field of SETTING_FIELDS) {
    const raw = settings[field.key];
    if (raw == null) continue;

    if (field.isWeight && typeof raw === 'number') {
      const formatted = formatWeight(roundRecommendWeightKg(raw));
      const parts = formatted.split(' ');
      items.push({
        key: field.key,
        label: t(field.labelKey),
        value: parts[0] ?? formatted,
        unit: parts.slice(1).join(' ') || undefined,
        isWeight: true,
      });
      continue;
    }

    items.push({
      key: field.key,
      label: t(field.labelKey),
      value: raw,
    });
  }

  const renderLabelExtra = (item: SettingDisplayItem) => {
    if (!item.isWeight || !weightBasis) return undefined;
    return <WeightBasisTrigger onClick={() => setBasisOpen(true)} />;
  };

  if (items.length === 0) {
    return (
      <p className="recommendation-settings-panel__empty">
        {t('recommendation.emptySettings')}
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

  if (!compact && items.length > 0) {
    const [hero, ...rest] = items;

    return (
      <>
        <div
          className="recommendation-settings-panel recommendation-settings-panel--dashboard"
          role="list"
          aria-label={t('recommendation.title')}
        >
          <div role="listitem">
            <SettingValueCard
              label={hero.label}
              value={hero.value}
              unit={hero.unit}
              highlight
              labelExtra={renderLabelExtra(hero)}
            />
          </div>
          {rest.length > 0 && (
            <div className="recommendation-settings-panel__grid" role="presentation">
              {rest.map((item) => (
                <div key={item.key} role="listitem">
                  <SettingValueCard
                    label={item.label}
                    value={item.value}
                    unit={item.unit}
                    compact
                    labelExtra={renderLabelExtra(item)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        {basisDialog}
      </>
    );
  }

  return (
    <>
      <div
        className={`recommendation-settings-panel${compact ? ' recommendation-settings-panel--compact' : ''}`}
        role="list"
        aria-label={t('recommendation.title')}
      >
        {items.map((item) => (
          <div key={item.key} role="listitem">
            <SettingValueCard
              label={item.label}
              value={item.value}
              unit={item.unit}
              compact={compact}
              labelExtra={renderLabelExtra(item)}
            />
          </div>
        ))}
      </div>
      {basisDialog}
    </>
  );
}
