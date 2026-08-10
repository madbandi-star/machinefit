import assert from 'node:assert/strict';
import {
  buildCardVoicePrefsKey,
  normalizeWorkoutCardVoicePrefs,
  resolveVoicePrefsForTemplate,
} from './workoutCardVoicePrefs';

assert.equal(
  buildCardVoicePrefsKey('LEG_PRESS', '2026-08-10', 'quads'),
  'LEG_PRESS:2026-08-10:quads'
);

const normalized = normalizeWorkoutCardVoicePrefs({
  targetReps: 12,
  repGapMs: 2000,
  voicePack: 'male',
  countMode: 'normal',
  flowMode: 'count_hold',
  prepCount: 5,
  voiceEnabled: true,
  oneMoreEnabled: false,
  autoAfterRest: true,
  restTipsEnabled: false,
});
assert.equal(normalized.targetReps, 12);
assert.equal(normalized.voicePack, 'male');
assert.equal(normalized.oneMoreEnabled, false);

const fromLive = resolveVoicePrefsForTemplate({
  machineCode: 'LEG_PRESS',
  logDate: '2026-08-10',
  targetMuscleGroup: 'quads',
  cardVoicePrefs: { targetReps: 8 },
  liveByKey: {
    'LEG_PRESS:2026-08-10:quads': { targetReps: 15, voicePack: 'female' },
  },
});
assert.equal(fromLive.targetReps, 15);
assert.equal(fromLive.voicePack, 'female');

const fromCard = resolveVoicePrefsForTemplate({
  machineCode: 'LEG_PRESS',
  logDate: '2026-08-10',
  targetMuscleGroup: 'quads',
  cardVoicePrefs: { targetReps: 8, voicePack: 'male' },
  liveByKey: {},
});
assert.equal(fromCard.targetReps, 8);
assert.equal(fromCard.voicePack, 'male');

console.log('workoutCardVoicePrefs.test.ts: ok');
