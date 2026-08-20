import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { stripProTipSeparatorsFromLines } from '@machinefit/shared';
import '@/styles/recommendation.css';

type GuideSegmentId = 'warnings' | 'tips' | 'proTips';

interface RecommendationGuideSegmentsProps {
  warnings?: string[] | null;
  tips?: string[] | null;
  proTips?: string[] | null;
  machineCode?: string;
}

const SEEN_PREFIX = 'machinefit.proTipsSeen:';

function seenStorageKey(machineCode?: string, content?: string): string {
  if (machineCode?.trim()) return `${SEEN_PREFIX}${machineCode.trim().toUpperCase()}`;
  const hash = (content ?? '').slice(0, 80);
  return `${SEEN_PREFIX}content:${hash}`;
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

export function RecommendationGuideSegments({
  warnings,
  tips,
  proTips,
  machineCode,
}: RecommendationGuideSegmentsProps) {
  const { t } = useTranslation('machines');

  const warningItems = useMemo(
    () => (warnings ?? []).map((w) => w.trim()).filter(Boolean),
    [warnings]
  );
  const tipItems = useMemo(() => (tips ?? []).map((w) => w.trim()).filter(Boolean), [tips]);
  const proContent = useMemo(
    () => stripProTipSeparatorsFromLines(proTips).join('\n\n').trim(),
    [proTips]
  );

  const storageKey = seenStorageKey(machineCode, proContent);
  const [proSeen, setProSeen] = useState(() => (proContent ? readSeen(storageKey) : true));
  const [active, setActive] = useState<GuideSegmentId | null>(null);

  useEffect(() => {
    setProSeen(proContent ? readSeen(storageKey) : true);
    setActive(null);
  }, [storageKey, proContent]);

  const segments = useMemo(() => {
    const list: { id: GuideSegmentId; label: string; unread?: boolean }[] = [];
    if (warningItems.length) {
      list.push({ id: 'warnings', label: t('recommendation.warningsTitle') });
    }
    if (tipItems.length) {
      list.push({ id: 'tips', label: t('recommendation.tipsTitle') });
    }
    if (proContent) {
      list.push({
        id: 'proTips',
        label: t('recommendation.proTipsChip'),
        unread: !proSeen,
      });
    }
    return list;
  }, [warningItems.length, tipItems.length, proContent, proSeen, t]);

  const markProSeen = useCallback(() => {
    if (!proContent) return;
    writeSeen(storageKey);
    setProSeen(true);
  }, [proContent, storageKey]);

  const handleSelect = (id: GuideSegmentId) => {
    setActive((prev) => (prev === id ? null : id));
    if (id === 'proTips') markProSeen();
  };

  if (!segments.length) return null;

  return (
    <section className="recommendation-guide-segments" aria-label={t('recommendation.guideSegmentsLabel')}>
      <div className="recommendation-guide-segments__chips" role="tablist">
        {segments.map((seg) => {
          const selected = active === seg.id;
          return (
            <button
              key={seg.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`recommendation-guide-segments__chip recommendation-guide-segments__chip--${seg.id}${
                selected ? ' is-active' : ''
              }${seg.unread ? ' recommendation-guide-segments__chip--unread' : ''}`}
              onClick={() => handleSelect(seg.id)}
            >
              <span className="recommendation-guide-segments__chip-label">{seg.label}</span>
              {seg.unread ? (
                <>
                  <span className="recommendation-guide-segments__dot" aria-hidden />
                  <span className="visually-hidden">{t('recommendation.proTipsUnread')}</span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>

      {active === 'warnings' ? (
        <ul className="recommendation-guide-segments__panel recommendation-warnings__list">
          {warningItems.map((warning, i) => (
            <li key={i}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {active === 'tips' ? (
        <ul className="recommendation-guide-segments__panel recommendation-tips__list">
          {tipItems.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      ) : null}

      {active === 'proTips' ? (
        <div className="recommendation-guide-segments__panel recommendation-pro-tips__body recommendation-guide-segments__pro-body">
          {proContent}
        </div>
      ) : null}
    </section>
  );
}
