import assert from 'node:assert/strict';
import {
  countdownClipKey,
  DEFAULT_VOICE_COACH_PACK,
  MAX_VOICE_COACH_CLIP_COUNTDOWN,
  MAX_VOICE_COACH_CLIP_REP,
  normalizeVoiceCoachPack,
  repClipKey,
  VOICE_COACH_CLIP_ASSET_VERSION,
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

const femaleStart = voiceCoachClipUrl('start', 'female');
assert.ok(
  femaleStart.endsWith(`/voice-coach/female/start.mp3?v=${VOICE_COACH_CLIP_ASSET_VERSION}`),
  femaleStart
);
const maleCd5 = voiceCoachClipUrl('cd-5', 'male');
assert.ok(
  maleCd5.endsWith(`/voice-coach/male/cd-5.mp3?v=${VOICE_COACH_CLIP_ASSET_VERSION}`),
  maleCd5
);
assert.ok(voiceCoachClipUrl('start', 'male').includes('/voice-coach/male/'));

console.log('voiceCoachClips.test.ts: ok');
