import { useState } from 'react';
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
import { FortuneEnergySection } from '@/components/fortune/reading/FortuneEnergySection';
import { FortuneReadingHero } from '@/components/fortune/reading/FortuneReadingHero';
import { FortuneStorySection } from '@/components/fortune/reading/FortuneStorySection';
import { parseFortuneDateParts } from '@/components/fortune/fortuneVisuals';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { shareFortuneCard } from '@/utils/shareFortuneCard';

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
  const { t } = useTranslation(['fortune', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const displayName = useAuthStore((s) => s.user?.displayName);
  const [sharing, setSharing] = useState(false);
  const coreThemeLabel = narrative
    ? t(narrative.coreThemeLabelKey)
    : fortune.keywordTitle;
  const parts = parseFortuneDateParts(date);
  const dateLabel = parts
    ? t('fortune:dateLong', { year: parts.year, month: parts.month, day: parts.day })
    : date;

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await shareFortuneCard({
        fortune,
        scores,
        themeLabel: coreThemeLabel,
        dateLabel,
        labels: {
          title: t('fortune:title'),
          healthman: t('fortune:healthmanIndexLabel'),
          prLuck: t('fortune:prLuckLabel'),
          recoveryLuck: t('fortune:recoveryLuckLabel'),
          tagline: t('fortune:shareTagline'),
          shareHashtags: t('fortune:shareHashtags'),
        },
        displayName,
        showToast,
        shareSavedMessage: t('fortune:shareSaved'),
        errorMessage: t('common:errors.submitFailed'),
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fr-page">
      <FortuneReadingHero
        date={date}
        keywordCode={fortune.keyword}
        coreThemeLabel={coreThemeLabel}
        scoreStars={fortune.scoreStars}
        mode={mode}
      />

      <div className="fr-share-row">
        <button
          type="button"
          className="btn btn--primary fr-share-btn"
          onClick={() => void handleShare()}
          disabled={sharing}
        >
          {t('fortune:share')}
        </button>
      </div>

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

      <FortuneApplySection
        narrative={narrative}
        recommendation={recommendation}
        dataAnalysis={dataAnalysis}
        delayMs={90}
      />

      <p className="fr-disclaimer">
        <span aria-hidden>ⓘ</span> {fortune.disclaimer || t('fortune:disclaimer')}
      </p>
    </div>
  );
}
