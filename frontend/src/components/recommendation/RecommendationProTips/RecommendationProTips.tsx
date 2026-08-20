import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { stripProTipSeparatorsFromLines } from '@machinefit/shared';
import { Icon } from '@/components/icons/Icon';
import '@/styles/recommendation.css';

interface RecommendationProTipsProps {
  proTips: string[];
  /** Stable id for unread tracking (machine code preferred). */
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
    /* ignore quota / private mode */
  }
}

export function RecommendationProTips({ proTips, machineCode }: RecommendationProTipsProps) {
  const { t } = useTranslation('machines');
  const labelId = useId();

  const content = useMemo(
    () => stripProTipSeparatorsFromLines(proTips).join('\n\n').trim(),
    [proTips]
  );
  const storageKey = seenStorageKey(machineCode, content);
  const [seen, setSeen] = useState(() => (content ? readSeen(storageKey) : true));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSeen(content ? readSeen(storageKey) : true);
    setOpen(false);
  }, [storageKey, content]);

  const markSeen = useCallback(() => {
    writeSeen(storageKey);
    setSeen(true);
  }, [storageKey]);

  if (!content) return null;

  const unread = !seen;

  return (
    <details
      className={`recommendation-collapsible recommendation-pro-tips${
        unread ? ' recommendation-pro-tips--unread' : ''
      }`}
      open={open}
      onToggle={(e) => {
        const nextOpen = (e.currentTarget as HTMLDetailsElement).open;
        setOpen(nextOpen);
        if (nextOpen) markSeen();
      }}
    >
      <summary className="recommendation-collapsible__summary" aria-labelledby={labelId}>
        <span
          id={labelId}
          className="recommendation-collapsible__label recommendation-pro-tips__label"
        >
          {t('recommendation.proTipsTitle')}
          {unread ? (
            <>
              <span className="recommendation-pro-tips__dot" aria-hidden />
              <span className="visually-hidden">{t('recommendation.proTipsUnread')}</span>
            </>
          ) : null}
        </span>
        <Icon name="chevronDown" size={18} className="recommendation-collapsible__chevron" />
      </summary>
      <div className="recommendation-pro-tips__body">{content}</div>
    </details>
  );
}
