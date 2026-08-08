import { useTranslation } from 'react-i18next';
import {
  formatFortuneDate,
  keywordEmoji,
  keywordTone,
} from '@/components/fortune/fortuneVisuals';
import { FortuneStarsRow } from '@/components/fortune/FortuneStarsRow';

interface FortuneHeroProps {
  date: string;
  mode?: 'full' | 'simple';
  keywordCode: string;
  keywordTitle: string;
  title: string;
  headline?: string;
  scoreStars: number;
}

export function FortuneHero({
  date,
  mode,
  keywordCode,
  keywordTitle,
  title,
  headline,
  scoreStars,
}: FortuneHeroProps) {
  const { t } = useTranslation('fortune');
  const emoji = keywordEmoji(keywordCode);
  const tone = keywordTone(keywordCode);
  const sub =
    headline && headline !== title ? headline : null;

  return (
    <header
      className={`fortune-hero fortune-hero--${tone}`}
      data-keyword={keywordCode}
    >
      <div className="fortune-hero__glow" aria-hidden />
      <p className="fortune-hero__eyebrow">
        <span aria-hidden>🔥</span> {t('title')}
      </p>
      <p className="fortune-hero__date">{formatFortuneDate(date)}</p>
      {mode ? (
        <p className="fortune-hero__mode">
          {mode === 'simple' ? t('modeSimple') : t('modeFull')}
        </p>
      ) : null}

      <div className="fortune-hero__keyword">
        <span className="fortune-hero__keyword-emoji" aria-hidden>
          {emoji}
        </span>
        <span className="fortune-hero__keyword-text">{keywordTitle}</span>
      </div>

      <h1 className="fortune-hero__title">{title}</h1>
      {sub ? <p className="fortune-hero__headline">{sub}</p> : null}

      <FortuneStarsRow scoreStars={scoreStars} label={t('starsLabel')} />
    </header>
  );
}
