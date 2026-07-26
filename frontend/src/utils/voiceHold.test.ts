import assert from 'node:assert/strict';
import {
  clampVoiceHoldDurationSec,
  clampVoiceHoldFlowMode,
  DEFAULT_VOICE_HOLD_FLOW_MODE,
  formatHoldCountdownWord,
  holdCountdownClipKey,
  holdCuePhrase,
  isVoiceHoldDurationPreset,
  pickHoldFinish,
  pickHoldFinishPhrase,
  VOICE_HOLD_CLIP_KEYS,
  VOICE_HOLD_DURATION,
  VOICE_HOLD_DURATION_PRESETS,
  VOICE_HOLD_FLOW_MODES,
} from './voiceHold.js';

assert.equal(DEFAULT_VOICE_HOLD_FLOW_MODE, 'count');
assert.deepEqual([...VOICE_HOLD_FLOW_MODES], ['count', 'count_hold', 'hold']);
assert.ok(VOICE_HOLD_DURATION_PRESETS.includes(10));
assert.equal(clampVoiceHoldFlowMode('hold'), 'hold');
assert.equal(clampVoiceHoldFlowMode('nope'), 'count');
assert.equal(clampVoiceHoldDurationSec(10), 10);
assert.equal(clampVoiceHoldDurationSec(0), VOICE_HOLD_DURATION.minSec);
assert.equal(clampVoiceHoldDurationSec(999), VOICE_HOLD_DURATION.maxSec);
assert.ok(isVoiceHoldDurationPreset(5));
assert.ok(!isVoiceHoldDurationPreset(7));
assert.equal(holdCuePhrase('ko', 'female'), '버텨!!!');
assert.equal(holdCuePhrase('en', 'female'), '버텨!!!');
assert.equal(holdCuePhrase('ko', 'male'), 'Hold!');
assert.equal(formatHoldCountdownWord(19, 'ko', 'female'), '십구');
assert.equal(formatHoldCountdownWord(12, 'ko', 'female'), '십이');
assert.equal(formatHoldCountdownWord(11, 'ko', 'female'), '십일');
assert.equal(formatHoldCountdownWord(15, 'ko', 'female'), '십오');
assert.equal(formatHoldCountdownWord(9, 'ko', 'female'), '구');
assert.equal(formatHoldCountdownWord(1, 'ko', 'female'), '일');
assert.equal(formatHoldCountdownWord(5, 'en', 'female'), '오');
assert.equal(formatHoldCountdownWord(5, 'ko', 'male'), '오');
assert.equal(formatHoldCountdownWord(2, 'ko', 'male'), '이');
// Hold seconds → male Korean TTS (no clips), any pack.
assert.equal(holdCountdownClipKey(5, 'female'), null);
assert.equal(holdCountdownClipKey(10, 'female'), null);
assert.equal(holdCountdownClipKey(15, 'female'), null);
assert.equal(holdCountdownClipKey(5, 'male'), null);
assert.equal(holdCountdownClipKey(15, 'male'), null);
assert.equal(holdCountdownClipKey(99, 'female'), null);
assert.equal(VOICE_HOLD_CLIP_KEYS.cue, 'hold');

const finishes = new Set<string>();
const finishKeys = new Set<string>();
for (let i = 0; i < 20; i += 1) {
  finishes.add(pickHoldFinishPhrase('ko', () => i / 20, 'female'));
  const item = pickHoldFinish('ko', () => i / 20, 'female');
  if (item.clipKey) finishKeys.add(item.clipKey);
}
assert.ok(finishes.has('운동 종료'));
assert.ok(finishes.has('완료!') || finishes.has('수고하셨습니다!'));
assert.ok(finishKeys.has('finish-done'));

const maleFinish = pickHoldFinish('ko', () => 0, 'male');
assert.equal(maleFinish.phrase, 'Workout Complete');
assert.equal(maleFinish.clipKey, 'finish-done');

console.log('voiceHold.test.ts: ok');
