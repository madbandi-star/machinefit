import assert from 'node:assert/strict';
import {
  countdownClipKey,
  DEFAULT_VOICE_COACH_PACK,
  MAX_VOICE_COACH_CLIP_COUNTDOWN,
  MAX_VOICE_COACH_CLIP_REP,
  normalizeVoiceCoachPack,
  repClipKey,
  voiceCoachClipUrl,
} from './voiceCoachClips.js';

assert.equal(DEFAULT_VOICE_COACH_PACK, 'female');
assert.equal(normalizeVoiceCoachPack('male'), 'male');
assert.equal(normalizeVoiceCoachPack('nope'), 'female');
assert.equal(MAX_VOICE_COACH_CLIP_COUNTDOWN, 10);
assert.equal(MAX_VOICE_COACH_CLIP_REP, 30);

assert.equal(countdownClipKey(5), 'cd-5');
assert.equal(countdownClipKey(1), 'cd-1');
assert.equal(countdownClipKey(6), 'cd-6');
assert.equal(countdownClipKey(10), 'cd-10');
assert.equal(countdownClipKey(11), null);

assert.equal(repClipKey(1), 'rep-1');
assert.equal(repClipKey(30), 'rep-30');
assert.equal(repClipKey(31), null);

assert.equal(
  voiceCoachClipUrl('start', 'female'),
  '/voice-coach/female/start.mp3'
);

console.log('voiceCoachClips.test.ts: ok');
