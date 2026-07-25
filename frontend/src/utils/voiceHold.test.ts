import assert from 'node:assert/strict';
import {
  clampVoiceHoldDurationSec,
  clampVoiceHoldFlowMode,
  DEFAULT_VOICE_HOLD_FLOW_MODE,
  formatHoldCountdownWord,
  holdCuePhrase,
  isVoiceHoldDurationPreset,
  pickHoldFinishPhrase,
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
assert.equal(holdCuePhrase('ko'), '버텨!!!');
assert.equal(holdCuePhrase('en'), 'Hold!!!');
assert.equal(formatHoldCountdownWord(15), '15');

const finishes = new Set<string>();
for (let i = 0; i < 20; i += 1) {
  finishes.add(pickHoldFinishPhrase('ko', () => i / 20));
}
assert.ok(finishes.has('완료!'));
assert.ok(finishes.has('좋습니다!') || finishes.has('수고하셨습니다!'));

console.log('voiceHold.test.ts: ok');
