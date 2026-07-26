/**
 * Regression: canceling silent unlock undoes mobile TTS → Hold silent.
 * Run: npx vite-node src/utils/speechManager.hold.test.ts
 */
import assert from 'node:assert/strict';

type UtteranceLike = {
  text: string;
  volume: number;
  rate: number;
  pitch: number;
  lang: string;
  voice: null;
  onend: (() => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
};

const spoken: string[] = [];
let cancelCalls = 0;
let speakCalls = 0;
let current: UtteranceLike | null = null;

const g = globalThis as typeof globalThis & {
  window: typeof globalThis;
  speechSynthesis: {
    speaking: boolean;
    pending: boolean;
    paused: boolean;
    cancel: () => void;
    resume: () => void;
    speak: (u: UtteranceLike) => void;
    getVoices: () => SpeechSynthesisVoice[];
    addEventListener: () => void;
    removeEventListener: () => void;
  };
  SpeechSynthesisUtterance: new (text: string) => UtteranceLike;
  Audio: new () => {
    preload: string;
    volume: number;
    src: string;
    onended: (() => void) | null;
    onerror: (() => void) | null;
    play: () => Promise<void>;
    pause: () => void;
  };
};

g.window = g;
// Force TTS fallback path (no real clip decode in this unit test).
g.Audio = class {
  preload = 'auto';
  volume = 1;
  src = '';
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play() {
    return Promise.reject(new Error('no audio in hold unit test'));
  }
  pause() {}
} as unknown as new () => {
  preload: string;
  volume: number;
  src: string;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  play: () => Promise<void>;
  pause: () => void;
};
g.SpeechSynthesisUtterance = class {
  text: string;
  volume = 1;
  rate = 1;
  pitch = 1;
  lang = 'ko-KR';
  voice = null;
  onend: (() => void) | null = null;
  onerror: ((ev: { error: string }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
} as unknown as new (text: string) => UtteranceLike;

g.speechSynthesis = {
  speaking: false,
  pending: false,
  paused: false,
  cancel() {
    cancelCalls += 1;
    const u = current;
    current = null;
    this.speaking = false;
    this.pending = false;
    u?.onerror?.({ error: 'canceled' });
  },
  resume() {
    this.paused = false;
  },
  speak(u) {
    speakCalls += 1;
    current = u;
    this.speaking = true;
    if (u.text && u.text !== '\u200B' && u.volume > 0) {
      spoken.push(u.text);
    }
    // Unlock (volume 0) ends quickly; audible lines a bit longer.
    const delay = u.volume > 0 ? 40 : 20;
    setTimeout(() => {
      if (current !== u) return;
      this.speaking = false;
      current = null;
      u.onend?.();
    }, delay);
  },
  getVoices: () =>
    [
      {
        name: 'Google 한국어',
        lang: 'ko-KR',
        localService: true,
        default: true,
        voiceURI: 'ko',
      },
    ] as unknown as SpeechSynthesisVoice[],
  addEventListener() {},
  removeEventListener() {},
};

const { speechManager } = await import('./speechManager');
const { runVoiceHoldSegment } = await import('./voiceHold');

await speechManager.init();
speechManager.unlock();
assert.ok(g.speechSynthesis.speaking, 'unlock should leave silent utter speaking');
const cancelAfterUnlock = cancelCalls;

// While silent unlock is still draining, first audible speak must NOT cancel.
await speechManager.speak('버텨!!!');
assert.equal(
  cancelCalls,
  cancelAfterUnlock,
  'speak() must not cancel silent unlock utterance'
);
assert.ok(spoken.includes('버텨!!!'), 'expected hold cue spoken');

// Overlapping audible speak should cancel the prior audible line.
spoken.length = 0;
cancelCalls = 0;
const first = speechManager.speak('열');
await new Promise((r) => setTimeout(r, 5));
await speechManager.speak('아홉');
await first.catch(() => undefined);
assert.ok(cancelCalls >= 1, 'replacing an audible line should cancel');
assert.ok(spoken.includes('아홉'), `expected second audible line, got ${spoken.join('|')}`);

spoken.length = 0;
cancelCalls = 0;
g.speechSynthesis.speaking = false;
g.speechSynthesis.pending = false;
speechManager.unlock();
const unlockCancels = cancelCalls;

await runVoiceHoldSegment({ durationSec: 2, locale: 'ko', voicePack: 'female' });
assert.ok(spoken[0]?.includes('버텨'), `hold segment cue missing: ${spoken.join('|')}`);
assert.ok(spoken.includes('이') && spoken.includes('일'), `hold countdown missing: ${spoken.join('|')}`);
assert.ok(
  spoken.some((s) => /운동 종료|완료|수고/.test(s)),
  `hold finish missing: ${spoken.join('|')}`
);
assert.equal(
  cancelCalls,
  unlockCancels,
  `hold segment must not cancel unlock (cancelCalls=${cancelCalls})`
);

console.log('speechManager.hold.test.ts: ok');
console.log(`spoken=${spoken.join('|')} cancelCalls=${cancelCalls} speakCalls=${speakCalls}`);
