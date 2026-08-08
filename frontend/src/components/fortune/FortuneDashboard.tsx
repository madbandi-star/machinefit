import { useTranslation } from 'react-i18next';
import type {
  FortuneDataAnalysis,
  FortuneMode,
  FortuneNarrative,
  FortuneRecommendation,
  FortuneScores,
  FortuneSection as FortuneSectionData,
  FortuneTraditionalDetail,
} from '@machinefit/shared';
import { FortuneApplySection } from '@/components/fortune/reading/FortuneApplySection';
import { FortuneBaseSection } from '@/components/fortune/reading/FortuneBaseSection';
import { FortuneDataSection } from '@/components/fortune/reading/FortuneDataSection';
import { FortuneEnergySection } from '@/components/fortune/reading/FortuneEnergySection';
import { FortuneGuideSection } from '@/components/fortune/reading/FortuneGuideSection';
import { FortuneLuckSection } from '@/components/fortune/reading/FortuneLuckSection';
import { FortuneReadingHero } from '@/components/fortune/reading/FortuneReadingHero';
import { FortuneStorySection } from '@/components/fortune/reading/FortuneStorySection';

export interface FortuneDashboardProps {
  date: string;
  mode?: FortuneMode;
  fortune: FortuneSectionData;
  scores: FortuneScores;
  recommendation: FortuneRecommendation;
  dataAnalysis?: FortuneDataAnalysis | null;
  narrative?: FortuneNarrative | null;
  traditionalDetail?: FortuneTraditionalDetail | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthTimeUnknown?: boolean;
}

export function FortuneDashboard({
  date,
  mode,
  fortune,
  scores,
  recommendation,
  dataAnalysis,
  narrative,
  traditionalDetail,
  birthDate,
  birthTime,
  birthTimeUnknown,
}: FortuneDashboardProps) {
  const { t } = useTranslation('fortune');
  const coreThemeLabel = narrative
    ? t(narrative.coreThemeLabelKey)
    : fortune.keywordTitle;

  return (
    <div className="fr-page">
      <FortuneReadingHero
        date={date}
        keywordCode={fortune.keyword}
        coreThemeLabel={coreThemeLabel}
        scoreStars={fortune.scoreStars}
        oneLiner={fortune.title || fortune.oneLiner}
        mode={mode}
      />

      <div className="fr-page__grid">
        {narrative ? <FortuneEnergySection narrative={narrative} delayMs={40} /> : null}

        <FortuneBaseSection
          narrative={narrative}
          traditionalDetail={traditionalDetail}
          birthDate={birthDate}
          birthTime={birthTime}
          birthTimeUnknown={birthTimeUnknown}
          delayMs={55}
        />
      </div>

      <FortuneStorySection fortune={fortune} narrative={narrative} delayMs={70} />

      <FortuneLuckSection
        scores={scores}
        scoreStars={fortune.scoreStars}
        delayMs={90}
      />

      <FortuneGuideSection
        recommendation={recommendation}
        narrative={narrative}
        delayMs={110}
      />

      <FortuneDataSection dataAnalysis={dataAnalysis} delayMs={130} />

      <FortuneApplySection
        narrative={narrative}
        recommendation={recommendation}
        dataAnalysis={dataAnalysis}
        delayMs={145}
      />

      <p className="fr-disclaimer">
        <span aria-hidden>ⓘ</span> {fortune.disclaimer || t('disclaimer')}
      </p>
    </div>
  );
}
