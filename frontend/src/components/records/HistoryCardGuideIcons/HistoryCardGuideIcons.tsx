import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Lightbulb, Star } from 'lucide-react';
import { machineApi, recommendationApi } from '@/api';
import '@/styles/recommendation.css';

type GuideSegmentId = 'warnings' | 'tips' | 'proTips';

interface HistoryCardGuideIconsProps {
  machineCode: string;
  recommendationId?: string;
  enabled?: boolean;
}

const SEEN_PREFIX = 'machinefit.proTipsSeen:';

function seenStorageKey(machineCode: string): string {
  return `${SEEN_PREFIX}${machineCode.trim().toUpperCase()}`;
}

function readSeen(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeSeen(key: string): void {
  try {
    localStorage.setItem(key, '1');
  } catch {
    /* ignore */
  }
}

function pickLocaleLines(
  value: Record<string, string[]> | null | undefined,
  locale: string
): string[] {
  if (!value) return [];
  const preferred = value[locale] ?? value.en ?? value.ko;
  if (Array.isArray(preferred)) return preferred.map((s) => s.trim()).filter(Boolean);
  for (const entry of Object.values(value)) {
    if (Array.isArray(entry) && entry.length) {
      return entry.map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function HistoryCardGuideIcons({
  machineCode,
  recommendationId,
  enabled = true,
}: HistoryCardGuideIconsProps) {
  const { t, i18n } = useTranslation('machines');
  const locale = i18n.language?.split('-')[0] || 'ko';
  const storageKey = seenStorageKey(machineCode);

  const guideQuery = useQuery({
    queryKey: ['history-card-guide', recommendationId ?? machineCode, locale],
    queryFn: async () => {
      if (recommendationId) {
        const res = await recommendationApi.getById(recommendationId);
        const data = res.data.data;
        return {
          warnings: (data.warnings ?? []).map((s) => s.trim()).filter(Boolean),
          tips: (data.tips ?? []).map((s) => s.trim()).filter(Boolean),
          proTips: (data.proTips ?? []).map((s) => s.trim()).filter(Boolean),
        };
      }
      const res = await machineApi.getByCode(machineCode);
      const machine = res.data.data;
      return {
        warnings: pickLocaleLines(machine.warnings, locale),
        tips: pickLocaleLines(machine.tips, locale),
        proTips: pickLocaleLines(machine.proTips, locale),
      };
    },
    enabled: enabled && Boolean(machineCode),
    staleTime: 5 * 60_000,
  });

  const warnings = guideQuery.data?.warnings ?? [];
  const tips = guideQuery.data?.tips ?? [];
  const proTips = guideQuery.data?.proTips ?? [];
  const proContent = proTips.join('\n\n').trim();

  const [proSeen, setProSeen] = useState(() => (proContent ? readSeen(storageKey) : true));
  const [active, setActive] = useState<GuideSegmentId | null>(null);

  useEffect(() => {
    setProSeen(proContent ? readSeen(storageKey) : true);
    setActive(null);
  }, [storageKey, proContent]);

  const markProSeen = useCallback(() => {
    if (!proContent) return;
    writeSeen(storageKey);
    setProSeen(true);
  }, [proContent, storageKey]);

  const segments = useMemo(() => {
    const list: {
      id: GuideSegmentId;
      label: string;
      Icon: typeof AlertTriangle;
      unread?: boolean;
    }[] = [];
    if (warnings.length) {
      list.push({
        id: 'warnings',
        label: t('recommendation.warningsTitle'),
        Icon: AlertTriangle,
      });
    }
    if (tips.length) {
      list.push({
        id: 'tips',
        label: t('recommendation.tipsTitle'),
        Icon: Lightbulb,
      });
    }
    if (proContent) {
      list.push({
        id: 'proTips',
        label: t('recommendation.proTipsChip'),
        Icon: Star,
        unread: !proSeen,
      });
    }
    return list;
  }, [warnings.length, tips.length, proContent, proSeen, t]);

  if (!enabled || guideQuery.isError || !segments.length) return null;

  const handleSelect = (id: GuideSegmentId, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setActive((prev) => (prev === id ? null : id));
    if (id === 'proTips') markProSeen();
  };

  return (
    <div className="history-card-guide">
      <div
        className="history-card-guide__icons"
        role="toolbar"
        aria-label={t('recommendation.guideSegmentsLabel')}
      >
        {segments.map((seg) => {
          const selected = active === seg.id;
          const Icon = seg.Icon;
          return (
            <button
              key={seg.id}
              type="button"
              className={`history-card-guide__icon history-card-guide__icon--${seg.id}${
                selected ? ' is-active' : ''
              }${seg.unread ? ' history-card-guide__icon--unread' : ''}`}
              aria-pressed={selected}
              aria-label={seg.label}
              title={seg.label}
              onClick={(e) => handleSelect(seg.id, e)}
            >
              <Icon size={15} strokeWidth={2.25} aria-hidden />
              {seg.unread ? <span className="history-card-guide__dot" aria-hidden /> : null}
            </button>
          );
        })}
      </div>

      {active === 'warnings' ? (
        <ul className="history-card-guide__panel recommendation-warnings__list">
          {warnings.map((warning, i) => (
            <li key={i}>{warning}</li>
          ))}
        </ul>
      ) : null}
      {active === 'tips' ? (
        <ul className="history-card-guide__panel recommendation-tips__list">
          {tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      ) : null}
      {active === 'proTips' ? (
        <div className="history-card-guide__panel history-card-guide__pro-body">{proContent}</div>
      ) : null}
    </div>
  );
}
