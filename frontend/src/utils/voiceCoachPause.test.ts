import assert from 'node:assert/strict';

// Minimal browser globals for vite-node.
const g = globalThis as typeof globalThis & {
  window?: typeof globalThis;
  document?: { visibilityState: DocumentVisibilityState };
};
g.window = globalThis;
g.document = { visibilityState: 'visible' };

const {
  VoiceCoachPauseController,
  setActiveVoiceCoachPause,
  sleepWithVoiceCoachPause,
} = await import('./voiceCoachPause.js');

const started = performance.now();
await sleepWithVoiceCoachPause(120);
const elapsed = performance.now() - started;
assert.ok(elapsed >= 100, `expected ~120ms sleep, got ${elapsed}`);
assert.ok(elapsed < 400, `visible sleep drifted too far: ${elapsed}`);

const pause = new VoiceCoachPauseController();
setActiveVoiceCoachPause(pause);
pause.pause();
let resumed = false;
const sleepPromise = sleepWithVoiceCoachPause(80).then(() => {
  resumed = true;
});
await new Promise((r) => setTimeout(r, 60));
assert.equal(resumed, false, 'sleep should wait while paused');
pause.resume();
await sleepPromise;
assert.equal(resumed, true);
setActiveVoiceCoachPause(null);

console.log('voiceCoachPause.test.ts: ok');
