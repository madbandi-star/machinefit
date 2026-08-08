import type {
  FortuneDataAnalysis,
  FortuneRecommendation,
  FortuneScores,
  FortuneSection,
} from '@machinefit/shared';
import type { EquipmentSlice } from '@/components/fortune/fortuneVisuals';
import { topEquipment } from '@/components/fortune/fortuneVisuals';

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

const STYLE_TO_EQ: Record<string, string> = {
  DUMBBELL: 'dumbbell',
  BARBELL: 'barbell',
  MACHINE: 'machine',
  CABLE: 'cable',
  BODYWEIGHT: 'bodyweight',
};

function bodyMatchesLow(bodyPart: string, lowMuscleGroup: string | null): boolean {
  if (!lowMuscleGroup) return false;
  const low = lowMuscleGroup.toLowerCase();
  const map: Record<string, string[]> = {
    CHEST: ['chest'],
    BACK: ['back'],
    LEGS: ['legs', 'quads', 'hamstrings', 'glutes'],
    SHOULDERS: ['shoulders'],
    ARMS: ['biceps', 'triceps', 'arms'],
    BICEPS: ['biceps'],
    TRICEPS: ['triceps'],
    CORE: ['core', 'abs'],
  };
  return (map[bodyPart] ?? []).includes(low);
}

export function buildFortuneExplain(fortune: FortuneSection): ProseBlock {
  const key = KEYWORD_EXPLAIN[fortune.keyword] ?? 'content.keyword.default';
  return {
    eyebrowKey: 'content.fortuneExplainTitle',
    emoji: '🔮',
    leadKey: 'content.fortuneExplainLead',
    leadValues: { keyword: fortune.keywordTitle },
    lines: [
      { key },
      { key: 'content.fortuneExplainFooter' },
    ],
  };
}

export function buildDataNarrative(args: {
  empty: boolean;
  sparse: boolean;
  analysis?: FortuneDataAnalysis | null;
  slices: EquipmentSlice[];
}): ProseBlock {
  const { empty, sparse, analysis, slices } = args;
  if (empty) {
    return {
      eyebrowKey: 'content.dataTitle',
      emoji: '📊',
      lines: [
        { key: 'content.dataEmptyLead' },
        { key: 'content.dataEmptyBody' },
      ],
    };
  }

  const top = topEquipment(slices);
  const lines: ProseLine[] = [];
  if (top) {
    lines.push({
      key: 'content.dataTopEquipment',
      values: { equipment: top.labelKey, percent: top.value },
    });
  }
  if (analysis) {
    lines.push({
      key: 'content.dataFrequency',
      values: {
        count7d: analysis.workoutCount7d,
        count30d: analysis.workoutCount30d,
      },
    });
  }
  if (sparse) {
    lines.push({ key: 'content.dataSparseNote' });
  } else {
    lines.push({ key: 'content.dataPatternNote' });
  }

  return {
    eyebrowKey: 'content.dataTitle',
    emoji: '📊',
    leadKey: 'content.dataLead',
    lines,
    // bullets are API strings — rendered separately as plain text
  };
}

/** API personalized bullets (already localized by backend/catalog). */
export function dataBulletLines(bullets: string[]): string[] {
  return bullets.slice(0, 4);
}

export function buildWhyToday(args: {
  empty: boolean;
  sparse: boolean;
  recommendation: FortuneRecommendation;
  analysis?: FortuneDataAnalysis | null;
  slices: EquipmentSlice[];
}): ProseBlock {
  const { empty, sparse, recommendation, analysis, slices } = args;
  const styleLabel = recommendation.styleLabel;
  const bodyLabel = recommendation.bodyPartLabel;

  if (empty || sparse) {
    return {
      eyebrowKey: 'content.whyTitle',
      emoji: '💡',
      leadKey: 'content.whyLead',
      leadValues: { style: styleLabel, body: bodyLabel },
      lines: [
        { key: 'content.whyLimited' },
        {
          key: 'content.whyFortuneOnly',
          values: { style: styleLabel, body: bodyLabel },
        },
      ],
    };
  }

  const top = topEquipment(slices);
  const styleEq = STYLE_TO_EQ[recommendation.style];
  const lines: ProseLine[] = [];

  if (top && styleEq && top.key !== styleEq) {
    lines.push({
      key: 'content.whyStyleContrast',
      values: {
        equipment: top.labelKey,
        percent: top.value,
        style: styleLabel,
      },
    });
  } else if (top) {
    lines.push({
      key: 'content.whyStyleAligned',
      values: {
        equipment: top.labelKey,
        percent: top.value,
        style: styleLabel,
      },
    });
  }

  if (analysis && bodyMatchesLow(recommendation.bodyPart, analysis.lowMuscleGroup)) {
    lines.push({
      key: 'content.whyBodyFromData',
      values: {
        body: bodyLabel,
        muscle: analysis.lowMuscleGroup ?? bodyLabel,
      },
    });
  } else {
    lines.push({
      key: 'content.whyBodyFortune',
      values: { body: bodyLabel },
    });
  }

  return {
    eyebrowKey: 'content.whyTitle',
    emoji: '💡',
    leadKey: 'content.whyLead',
    leadValues: { style: styleLabel, body: bodyLabel },
    lines,
  };
}

export function buildStrategyExplain(recommendation: FortuneRecommendation): ProseBlock {
  const key = STRATEGY_EXPLAIN[recommendation.strategy] ?? 'content.strategy.default';
  return {
    eyebrowKey: 'content.strategyTitle',
    emoji: '📈',
    leadKey: 'content.strategyLead',
    leadValues: { strategy: recommendation.strategyLabel },
    lines: [
      { key, values: { strategy: recommendation.strategyLabel } },
      { key: 'content.strategyFooter' },
    ],
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
    lines: [{ key }, { key: 'content.prDisclaimer' }],
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
      {
        key: 'content.try3',
        values: { style: recommendation.styleLabel },
      },
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
  empty: boolean;
  slices: EquipmentSlice[];
  analysis?: FortuneDataAnalysis | null;
}): ProseBlock {
  const { fortune, scores, recommendation, empty, slices, analysis } = args;
  const top = topEquipment(slices);
  const stars = Math.min(5, Math.max(0, Math.round(fortune.scoreStars)));
  const lines: ProseLine[] = [
    {
      key: 'content.report.stars',
      values: { stars: `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}` },
    },
    {
      key: 'content.report.fortune',
      values: { title: fortune.title, keyword: fortune.keywordTitle },
    },
  ];

  if (!empty && top && analysis) {
    lines.push({
      key: 'content.report.data',
      values: {
        equipment: top.labelKey,
        percent: top.value,
        count7d: analysis.workoutCount7d,
        count30d: analysis.workoutCount30d,
      },
    });
    lines.push({
      key: 'content.report.bridge',
      values: { style: recommendation.styleLabel },
    });
  } else {
    lines.push({ key: 'content.report.dataLimited' });
  }

  lines.push({
    key: 'content.report.recommend',
    values: {
      body: recommendation.bodyPartLabel,
      style: recommendation.styleLabel,
      strategy: recommendation.strategyLabel,
      condition: recommendation.conditionLabel,
    },
  });
  lines.push({
    key: 'content.report.strategy',
    values: { strategy: recommendation.strategyLabel },
  });
  lines.push({
    key: 'content.report.scores',
    values: {
      healthman: scores.healthmanIndex,
      pr: scores.prLuck,
      recovery: scores.recoveryLuck,
    },
  });
  lines.push({ key: 'content.report.close' });

  return {
    eyebrowKey: 'content.reportTitle',
    emoji: '📋',
    lines,
  };
}
