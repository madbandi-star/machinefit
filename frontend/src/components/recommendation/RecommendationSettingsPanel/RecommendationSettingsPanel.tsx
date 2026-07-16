import { useTranslation } from 'react-i18next';
import type { RecommendationSettings } from '@machinefit/shared';
import { SettingValueCard } from '@/components/recommendation/SettingValueCard/SettingValueCard';
import { useUserUnits } from '@/hooks/useUserUnits';
import '@/styles/recommendation.css';

type SettingField = {
  key: keyof RecommendationSettings;
  labelKey: string;
  isWeight?: boolean;
};

const SETTING_FIELDS: SettingField[] = [
  { key: 'seatPosition', labelKey: 'settings.seat' },
  { key: 'backPadPosition', labelKey: 'settings.backPad' },
  { key: 'footPosition', labelKey: 'settings.foot' },
  { key: 'handlePosition', labelKey: 'settings.handle' },
  { key: 'romSetting', labelKey: 'settings.rom' },
  { key: 'recommendedWeightKg', labelKey: 'settings.weight', isWeight: true },
];

interface SettingDisplayItem {
  key: keyof RecommendationSettings;
  label: string;
  value: string | number;
  unit?: string;
}

interface RecommendationSettingsPanelProps {
  settings: RecommendationSettings;
  variant?: 'hero' | 'compact';
}

export function RecommendationSettingsPanel({
  settings,
  variant = 'hero',
}: RecommendationSettingsPanelProps) {
  const { t } = useTranslation('machines');
  const { formatWeight } = useUserUnits();
  const compact = variant === 'compact';

  const items: SettingDisplayItem[] = [];

  for (const field of SETTING_FIELDS) {
    const raw = settings[field.key];
    if (raw == null) continue;

    if (field.isWeight && typeof raw === 'number') {
      const formatted = formatWeight(raw);
      const parts = formatted.split(' ');
      items.push({
        key: field.key,
        label: t(field.labelKey),
        value: parts[0] ?? formatted,
        unit: parts.slice(1).join(' ') || undefined,
      });
      continue;
    }

    items.push({
      key: field.key,
      label: t(field.labelKey),
      value: raw,
    });
  }

  if (items.length === 0) {
    return (
      <p className="recommendation-settings-panel__empty">
        {t('recommendation.emptySettings')}
      </p>
    );
  }

  if (!compact && items.length > 0) {
    const [hero, ...rest] = items;

    return (
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
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
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
          />
        </div>
      ))}
    </div>
  );
}
