import type {
  FortuneNarrative,
  FortuneRecommendation,
  FortuneScores,
  FortuneSection,
} from '@machinefit/shared';

export interface ProseLine {
  key: string;
  values?: Record<string, string | number>;
}

export interface ProseBlock {
  eyebrowKey: string;
  emoji: string;
  leadKey?: string;
  leadValues?: Record<string, string | number>;
  lines: ProseLine[];
  checklistKeys?: string[];
}

const KEYWORD_EXPLAIN: Record<string, string> = {
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

const STRATEGY_EXPLAIN: Record<string, string> = {
  PYRAMID: 'content.strategy.pyramid',
  DROP_SET: 'content.strategy.dropSet',
  SUPER_SET: 'content.strategy.superSet',
  PR_CHALLENGE: 'content.strategy.prChallenge',
  VOLUME_UP: 'content.strategy.volumeUp',
  WEIGHT_HOLD: 'content.strategy.weightHold',
  SLOW_CONTROL: 'content.strategy.slowControl',
  HIGH_WEIGHT_LOW_REP: 'content.strategy.highWeight',
};

export function buildFortuneExplain(
  fortune: FortuneSection,
  narrative?: FortuneNarrative | null
): ProseBlock {
  const keywordKey = KEYWORD_EXPLAIN[fortune.keyword] ?? 'content.keyword.default';
  if (narrative) {
    return {
      eyebrowKey: 'content.fortuneExplainTitle',
      emoji: '🔮',
      leadKey: narrative.storyLeadKey,
      lines: [{ key: narrative.storyBodyKey }, { key: keywordKey }],
    };
  }
  return {
    eyebrowKey: 'content.fortuneExplainTitle',
    emoji: '🔮',
    leadKey: 'content.fortuneExplainLead',
    leadValues: { keyword: fortune.keywordTitle },
    lines: [{ key: keywordKey }],
  };
}

export function buildWhyToday(args: {
  recommendation: FortuneRecommendation;
}): ProseBlock {
  const { recommendation } = args;
  const styleLabel = recommendation.styleLabel;
  const bodyLabel = recommendation.bodyPartLabel;

  // Fortune-framed copy only — never expose data scarcity or log-based reasoning.
  return {
    eyebrowKey: 'content.whyTitle',
    emoji: '💡',
    leadKey: 'content.whyLead',
    leadValues: { style: styleLabel, body: bodyLabel },
    lines: [
      { key: 'content.whyStyleFortune', values: { style: styleLabel } },
      { key: 'content.whyBodyFortune', values: { body: bodyLabel } },
    ],
  };
}

export function buildStrategyExplain(recommendation: FortuneRecommendation): ProseBlock {
  const key = STRATEGY_EXPLAIN[recommendation.strategy] ?? 'content.strategy.default';
  return {
    eyebrowKey: 'content.strategyTitle',
    emoji: '📈',
    leadKey: 'content.strategyLead',
    leadValues: { strategy: recommendation.strategyLabel },
    lines: [{ key, values: { strategy: recommendation.strategyLabel } }],
  };
}

export function buildPrExplain(scores: FortuneScores): ProseBlock {
  const score = scores.prLuck;
  const key =
    score >= 70 ? 'content.prHigh' : score >= 40 ? 'content.prMid' : 'content.prLow';
  return {
    eyebrowKey: 'content.prTitle',
    emoji: '🏆',
    leadKey: 'content.prLead',
    leadValues: { score },
    lines: [{ key }],
  };
}

export function buildRecoveryExplain(scores: FortuneScores): ProseBlock {
  const score = scores.recoveryLuck;
  const key =
    score >= 70 ? 'content.recoveryHigh' : score >= 40 ? 'content.recoveryMid' : 'content.recoveryLow';
  return {
    eyebrowKey: 'content.recoveryTitle',
    emoji: '🧘',
    leadKey: 'content.recoveryLead',
    leadValues: { score },
    lines: [{ key }],
  };
}

export function buildTryThis(recommendation: FortuneRecommendation): ProseBlock {
  return {
    eyebrowKey: 'content.tryTitle',
    emoji: '🔥',
    lines: [
      { key: 'content.try1' },
      { key: 'content.try2' },
      { key: 'content.try3', values: { style: recommendation.styleLabel } },
      { key: 'content.try4' },
      { key: 'content.try5' },
    ],
  };
}

export function buildMission(args: {
  fortune: FortuneSection;
  recommendation: FortuneRecommendation;
}): ProseBlock {
  const { fortune, recommendation } = args;
  let missionKey = 'content.mission.default';
  if (fortune.keyword === 'PR_DAY' || recommendation.strategy === 'PR_CHALLENGE') {
    missionKey = 'content.mission.prep';
  } else if (fortune.keyword === 'RECOVERY_DAY' || recommendation.condition === 'REST') {
    missionKey = 'content.mission.recovery';
  } else if (recommendation.style === 'DUMBBELL') {
    missionKey = 'content.mission.dumbbell';
  } else if (recommendation.strategy === 'SLOW_CONTROL' || fortune.keyword === 'CONTROL_DAY') {
    missionKey = 'content.mission.control';
  } else if (recommendation.strategy === 'DROP_SET' || fortune.keyword === 'DROP_SET_DAY') {
    missionKey = 'content.mission.dropSet';
  } else if (recommendation.strategy === 'SUPER_SET' || fortune.keyword === 'SUPER_SET_DAY') {
    missionKey = 'content.mission.superSet';
  }

  return {
    eyebrowKey: 'content.missionTitle',
    emoji: '🎯',
    lines: [
      {
        key: missionKey,
        values: {
          style: recommendation.styleLabel,
          body: recommendation.bodyPartLabel,
          strategy: recommendation.strategyLabel,
        },
      },
    ],
  };
}

export function buildReport(args: {
  fortune: FortuneSection;
  scores: FortuneScores;
  recommendation: FortuneRecommendation;
}): ProseBlock {
  const { fortune, scores, recommendation } = args;
  const stars = Math.min(5, Math.max(0, Math.round(fortune.scoreStars)));

  return {
    eyebrowKey: 'content.reportTitle',
    emoji: '📋',
    lines: [
      {
        key: 'content.report.stars',
        values: { stars: `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}` },
      },
      {
        key: 'content.report.fortune',
        values: { title: fortune.title, keyword: fortune.keywordTitle },
      },
      {
        key: 'content.report.bridge',
        values: { style: recommendation.styleLabel },
      },
      {
        key: 'content.report.recommend',
        values: {
          body: recommendation.bodyPartLabel,
          style: recommendation.styleLabel,
          strategy: recommendation.strategyLabel,
          condition: recommendation.conditionLabel,
        },
      },
      {
        key: 'content.report.strategy',
        values: { strategy: recommendation.strategyLabel },
      },
      {
        key: 'content.report.scores',
        values: {
          healthman: scores.healthmanIndex,
          pr: scores.prLuck,
          recovery: scores.recoveryLuck,
        },
      },
      { key: 'content.report.close' },
    ],
  };
}
