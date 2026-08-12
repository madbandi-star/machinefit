import assert from 'node:assert/strict';
import {
  CORE_THEMES,
  buildTraditionalChart,
  deriveFromTheme,
  enforceFortuneConsistency,
  isThemePackConsistent,
  type CoreTheme,
} from './index.js';

const base = {
  birthDate: '1990-05-01',
  birthTime: '08:30',
  dateKey: '2026-08-08',
};

{
  const a = buildTraditionalChart(base);
  const b = buildTraditionalChart(base);
  assert.equal(a.coreTheme, b.coreTheme);
  assert.deepEqual(
    a.narrative.layers.map((l) => l.moodKey),
    b.narrative.layers.map((l) => l.moodKey)
  );
  assert.equal(a.traditionalDetail.dayStem, b.traditionalDetail.dayStem);
}

{
  const a = buildTraditionalChart(base);
  const b = buildTraditionalChart({ ...base, dateKey: '2026-12-01' });
  assert.notDeepEqual(a.todayPillars.day, b.todayPillars.day);
}

{
  const chart = buildTraditionalChart({
    birthDate: '1990-05-01',
    birthTimeUnknown: true,
    dateKey: '2026-08-08',
  });
  assert.equal(chart.pillars.hour, null);
  assert.ok(chart.coreTheme);
  assert.equal(chart.cycles.shijin, null);
  assert.equal(
    chart.narrative.layers.some((l) => l.key === 'shijin'),
    false
  );
}

{
  const { bands, allow } = deriveFromTheme('RECOVERY_RESET');
  const fixed = enforceFortuneConsistency({
    coreTheme: 'RECOVERY_RESET',
    keywordCode: 'PR_DAY',
    strategyCode: 'PR_CHALLENGE',
    conditionCode: 'AGGRESSIVE',
    avoidCode: 'NO_WARMUP_HEAVY',
    styleCode: 'BARBELL',
    bodyPartCode: 'CHEST',
    preCode: 'DYNAMIC_WARMUP',
    postCode: 'LIGHT_CARDIO',
    headlineCode: 'PR_PUSH',
    oneLinerCode: 'ONE_MORE_SET',
    scoreStars: 5,
    scores: {
      healthmanIndex: 90,
      prLuck: 95,
      recoveryLuck: 20,
      volumeLuck: 90,
      focusLuck: 90,
      changeLuck: 90,
    },
  });
  assert.notEqual(fixed.keywordCode, 'PR_DAY');
  assert.notEqual(fixed.strategyCode, 'PR_CHALLENGE');
  assert.ok(allow.keywords.includes(fixed.keywordCode));
  assert.ok(allow.strategies.includes(fixed.strategyCode));
  assert.ok(allow.conditions.includes(fixed.conditionCode));
  assert.ok(allow.avoids.includes(fixed.avoidCode));
  assert.ok(allow.styles.includes(fixed.styleCode));
  assert.ok(allow.bodyParts.includes(fixed.bodyPartCode));
  assert.ok(allow.pre.includes(fixed.preCode));
  assert.ok(allow.post.includes(fixed.postCode));
  assert.ok(allow.headlines.includes(fixed.headlineCode));
  assert.ok(allow.oneLiners.includes(fixed.oneLinerCode));
  assert.ok(fixed.scoreStars <= bands.stars[1]);
  assert.ok(fixed.scores.prLuck <= bands.prLuck[1]);
  assert.ok(fixed.scores.recoveryLuck >= bands.recoveryLuck[0]);
  assert.ok(
    isThemePackConsistent('RECOVERY_RESET', {
      keywordCode: fixed.keywordCode,
      strategyCode: fixed.strategyCode,
      conditionCode: fixed.conditionCode,
      avoidCode: fixed.avoidCode,
      styleCode: fixed.styleCode,
      bodyPartCode: fixed.bodyPartCode,
      preCode: fixed.preCode,
      postCode: fixed.postCode,
      headlineCode: fixed.headlineCode,
      oneLinerCode: fixed.oneLinerCode,
    })
  );
}

{
  // Execute theme must not keep recovery narrative codes.
  const fixed = enforceFortuneConsistency({
    coreTheme: 'EXECUTE_PUSH',
    keywordCode: 'RECOVERY_DAY',
    strategyCode: 'WEIGHT_HOLD',
    conditionCode: 'REST',
    avoidCode: 'HEAVY_EGO',
    styleCode: 'MACHINE',
    bodyPartCode: 'CORE',
    preCode: 'MOBILITY',
    postCode: 'RECOVERY_FOCUS',
    headlineCode: 'RECOVERY_LISTEN',
    oneLinerCode: 'LISTEN_BODY',
    scoreStars: 2,
    scores: {
      healthmanIndex: 40,
      prLuck: 20,
      recoveryLuck: 90,
      volumeLuck: 30,
      focusLuck: 40,
      changeLuck: 30,
    },
  });
  assert.notEqual(fixed.keywordCode, 'RECOVERY_DAY');
  assert.notEqual(fixed.conditionCode, 'REST');
  assert.ok(fixed.scoreStars >= 4);
  assert.ok(
    isThemePackConsistent('EXECUTE_PUSH', {
      keywordCode: fixed.keywordCode,
      strategyCode: fixed.strategyCode,
      conditionCode: fixed.conditionCode,
      avoidCode: fixed.avoidCode,
      styleCode: fixed.styleCode,
      bodyPartCode: fixed.bodyPartCode,
      preCode: fixed.preCode,
      postCode: fixed.postCode,
      headlineCode: fixed.headlineCode,
      oneLinerCode: fixed.oneLinerCode,
    })
  );
}

{
  // Body-part keyword forces matching body recommendation.
  const fixed = enforceFortuneConsistency({
    coreTheme: 'ACCUMULATE_STEADY',
    keywordCode: 'LEG_DAY',
    strategyCode: 'VOLUME_UP',
    conditionCode: 'NORMAL',
    avoidCode: 'NO_WARMUP_HEAVY',
    styleCode: 'BARBELL',
    bodyPartCode: 'CHEST',
    preCode: 'PREP_SETS',
    postCode: 'STRETCH',
    headlineCode: 'VOLUME_BUILD',
    oneLinerCode: 'ONE_MORE_SET',
    scoreStars: 3,
    scores: {
      healthmanIndex: 70,
      prLuck: 50,
      recoveryLuck: 50,
      volumeLuck: 70,
      focusLuck: 60,
      changeLuck: 40,
    },
  });
  assert.equal(fixed.bodyPartCode, 'LEGS');
}

{
  for (const theme of CORE_THEMES) {
    const { allow, bands } = deriveFromTheme(theme as CoreTheme);
    assert.ok(allow.keywords.length > 0, `${theme} keywords`);
    assert.ok(allow.strategies.length > 0, `${theme} strategies`);
    assert.ok(allow.conditions.length > 0, `${theme} conditions`);
    assert.ok(allow.avoids.length > 0, `${theme} avoids`);
    assert.ok(allow.styles.length > 0, `${theme} styles`);
    assert.ok(allow.bodyParts.length > 0, `${theme} bodyParts`);
    assert.ok(allow.pre.length > 0, `${theme} pre`);
    assert.ok(allow.post.length > 0, `${theme} post`);
    assert.ok(allow.headlines.length > 0, `${theme} headlines`);
    assert.ok(allow.oneLiners.length > 0, `${theme} oneLiners`);
    assert.ok(bands.stars[0] <= bands.stars[1]);
    // Recovery themes should not allow PR narrative.
    if (theme === 'RECOVERY_RESET') {
      assert.ok(!allow.keywords.includes('PR_DAY'));
      assert.ok(!allow.strategies.includes('PR_CHALLENGE'));
      assert.ok(!allow.headlines.includes('PR_PUSH'));
    }
    // Push themes should not allow REST condition.
    if (theme === 'EXECUTE_PUSH' || theme === 'FOCUS_BREAKTHROUGH') {
      assert.ok(!allow.keywords.includes('RECOVERY_DAY'));
      assert.ok(!allow.conditions.includes('REST'));
    }
  }
}

{
  const chart = buildTraditionalChart(base);
  assert.ok(chart.narrative.coreThemeLabelKey.startsWith('coreTheme.'));
  assert.equal(chart.narrative.layers[0].titleKey, 'layer.base');
  assert.equal(chart.engineVersion, 'v3');
  assert.equal(chart.narrative.layers.find((l) => l.key === 'daeun')?.titleKey, 'layer.daeun');
  assert.equal(chart.narrative.layers.find((l) => l.key === 'today')?.titleKey, 'layer.today');
}

{
  // Same date → same theme (determinism across users only differs by birth seed upstream).
  const dates = ['2026-01-15', '2026-03-20', '2026-07-01', '2026-11-11'];
  for (const dateKey of dates) {
    const a = buildTraditionalChart({ ...base, dateKey });
    const b = buildTraditionalChart({ ...base, dateKey });
    assert.equal(a.coreTheme, b.coreTheme);
  }
}

console.log('traditional fortune tests OK');
