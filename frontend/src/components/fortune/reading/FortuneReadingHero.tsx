import { useTranslation } from 'react-i18next';
import { FortuneStarsRow } from '@/components/fortune/FortuneStarsRow';
import {
  keywordEmoji,
  keywordTone,
  parseFortuneDateParts,
} from '@/components/fortune/fortuneVisuals';

interface FortuneReadingHeroProps {
  date: string;
  keywordCode: string;
  coreThemeLabel: string;
  scoreStars: number;
  oneLiner: string;
  mode?: 'full' | 'simple';
}

export function FortuneReadingHero({
  date,
  keywordCode,
  coreThemeLabel,
  scoreStars,
  oneLiner,
  mode,
}: FortuneReadingHeroProps) {
  const { t } = useTranslation('fortune');
  const parts = parseFortuneDateParts(date);
  const emoji = keywordEmoji(keywordCode);
  const tone = keywordTone(keywordCode);

  return (
    <header className={`fr-hero fr-hero--${tone}`}>
      <div className="fr-hero__glow" aria-hidden />
      <p className="fr-hero__brand">🔮 {t('title')}</p>
      {parts ? (
        <p className="fr-hero__date">
          {t('dateLong', { year: parts.year, month: parts.month, day: parts.day })}
        </p>
      ) : (
        <p className="fr-hero__date">{date}</p>
      )}
      {mode ? (
        <p className="fr-hero__mode">
          {mode === 'simple' ? t('modeSimple') : t('modeFull')}
        </p>
      ) : null}

      <div className="fr-hero__core">
        <span className="fr-hero__emoji" aria-hidden>
          {emoji}
        </span>
        <p className="fr-hero__core-label">{t('coreThemeLabel')}</p>
        <h1 className="fr-hero__core-value">「{coreThemeLabel}」</h1>
      </div>

      <FortuneStarsRow scoreStars={scoreStars} label={t('starsLabel')} />
      <p className="fr-hero__line">{oneLiner}</p>
    </header>
  );
}
