import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { HELLPOWER_LEVELS, type HellpowerLevelDef } from '@machinefit/shared';
import './HellpowerLadderSheet.css';

type Props = {
  open: boolean;
  onClose: () => void;
  currentLevel: number | null;
};

function formatRange(row: HellpowerLevelDef, locale: string): string {
  const min = row.minScore.toLocaleString(locale);
  if (row.maxScore == null) return `${min}+`;
  return `${min} – ${row.maxScore.toLocaleString(locale)}`;
}

export function HellpowerLadderSheet({ open, onClose, currentLevel }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('ko') ? 'ko-KR' : i18n.language || 'en';
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || currentLevel == null || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-level="${currentLevel}"]`);
    if (el instanceof HTMLElement) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }
  }, [open, currentLevel]);

  if (!open) return null;

  return createPortal(
    <div className="hp-ladder-overlay" role="presentation" onClick={onClose}>
      <div
        className="hp-ladder-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hp-ladder-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hp-ladder-sheet__grab" aria-hidden />
        <header className="hp-ladder-sheet__head">
          <h2 id="hp-ladder-title" className="hp-ladder-sheet__title">
            {t('points.hellpower.ladderTitle')}
          </h2>
          <button type="button" className="hp-ladder-sheet__close" onClick={onClose}>
            {t('actions.close')}
          </button>
        </header>
        <ul className="hp-ladder-sheet__list" ref={listRef}>
          {HELLPOWER_LEVELS.map((row) => {
            const isCurrent = currentLevel === row.level;
            return (
              <li
                key={row.level}
                data-level={row.level}
                className={`hp-ladder-row${isCurrent ? ' hp-ladder-row--current' : ''}`}
                aria-current={isCurrent ? 'true' : undefined}
              >
                <span
                  className="hp-ladder-row__emoji"
                  aria-label={t('points.hellpower.levelLabel', {
                    level: row.level,
                    title: row.title,
                  })}
                >
                  {row.emoji}
                </span>
                <div className="hp-ladder-row__main">
                  <p className="hp-ladder-row__level">
                    Lv.{row.level}
                    {isCurrent ? (
                      <span className="hp-ladder-row__you">{t('points.hellpower.currentBadge')}</span>
                    ) : null}
                  </p>
                  <p className="hp-ladder-row__title">{row.title}</p>
                </div>
                <p className="hp-ladder-row__range">{formatRange(row, locale)}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body
  );
}
