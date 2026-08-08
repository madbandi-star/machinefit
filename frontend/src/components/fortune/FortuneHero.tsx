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
  coreThemeLabel?: string;
}

export function FortuneHero({
  date,
  mode,
  keywordCode,
  keywordTitle,
  title,
  headline,
  scoreStars,
  coreThemeLabel,
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
      <p className="fortune-hero__brand">{t('title')}</p>
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
        <h1 className="fortune-hero__keyword-text">{keywordTitle}</h1>
      </div>

      {coreThemeLabel ? (
        <p className="fortune-hero__core-theme">
          <span className="fortune-hero__core-theme-label">{t('coreThemeLabel')}</span>
          <span className="fortune-hero__core-theme-value">{coreThemeLabel}</span>
        </p>
      ) : null}

      <p className="fortune-hero__title">{title}</p>
      {sub ? <p className="fortune-hero__headline">{sub}</p> : null}

      <FortuneStarsRow scoreStars={scoreStars} label={t('starsLabel')} />
    </header>
  );
}
