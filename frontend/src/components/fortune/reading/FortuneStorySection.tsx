import { useTranslation } from 'react-i18next';
import type { FortuneNarrative, FortuneSection as FortuneSectionData } from '@machinefit/shared';
import { FortuneSection } from '@/components/fortune/reading/FortuneSection';

const KEYWORD_BODY: Record<string, string> = {
  PR_DAY: 'content.keyword.pr',
  DROP_SET_DAY: 'content.keyword.dropSet',
  SUPER_SET_DAY: 'content.keyword.superSet',
  VOLUME_DAY: 'content.keyword.volume',
  RECOVERY_DAY: 'content.keyword.recovery',
  DUMBBELL_DAY: 'content.keyword.dumbbell',
  FREE_WEIGHT_DAY: 'content.keyword.freeWeight',
  CARDIO_DAY: 'content.keyword.cardio',
  CONTROL_DAY: 'content.keyword.control',
  LEG_DAY: 'content.keyword.leg',
  CHEST_DAY: 'content.keyword.chest',
  BACK_DAY: 'content.keyword.back',
};

interface FortuneStorySectionProps {
  fortune: FortuneSectionData;
  narrative?: FortuneNarrative | null;
  delayMs?: number;
}

export function FortuneStorySection({
  fortune,
  narrative,
  delayMs = 80,
}: FortuneStorySectionProps) {
  const { t } = useTranslation('fortune');
  const keywordKey = KEYWORD_BODY[fortune.keyword] ?? 'content.keyword.default';

  const paragraphs: string[] = [];
  if (narrative) {
    paragraphs.push(t(narrative.storyLeadKey));
    paragraphs.push(t(narrative.storyBodyKey));
  } else {
    paragraphs.push(fortune.title);
    if (fortune.headline && fortune.headline !== fortune.title) {
      paragraphs.push(fortune.headline);
    }
  }
  paragraphs.push(t(keywordKey));
  paragraphs.push(
    t('storyClose', {
      keyword: fortune.keywordTitle,
      theme: narrative ? t(narrative.coreThemeLabelKey) : fortune.keywordTitle,
    })
  );

  return (
    <FortuneSection title={`🔮 ${t('sectionTodayStory')}`} delayMs={delayMs}>
      <article className="fr-story">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </article>
    </FortuneSection>
  );
}
