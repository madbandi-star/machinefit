/**
 * iOS male count TTS helpers + sequential utterance simulation.
 *   npx vite-node src/utils/iosMaleCountSpeech.test.ts
 */
import assert from 'node:assert/strict';
import {
  IOS_MALE_COUNT_PAUSE_MS,
  IOS_MALE_COUNT_RATE,
  IOS_MALE_PREP_COUNT_WORDS,
  isIOSWebKit,
  shouldUseIosMaleCountTts,
  toSinoKoreanCount,
} from './iosMaleCountSpeech.js';
import { speechManager } from './speechManager.js';

assert.equal(toSinoKoreanCount(1), '일');
assert.equal(toSinoKoreanCount(2), '이');
assert.equal(toSinoKoreanCount(3), '삼');
assert.equal(toSinoKoreanCount(4), '사');
assert.equal(toSinoKoreanCount(5), '오');
assert.equal(toSinoKoreanCount(10), '십');
assert.equal(toSinoKoreanCount(15), '십오');
assert.deepEqual([...IOS_MALE_PREP_COUNT_WORDS], ['오', '사', '삼', '이', '일']);

assert.equal(isIOSWebKit('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), true);
assert.equal(isIOSWebKit('Mozilla/5.0 (Linux; Android 14)', 'Linux', 5), false);
assert.equal(isIOSWebKit('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'MacIntel', 5), true);

assert.equal(
  shouldUseIosMaleCountTts('male', 'ko', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
  }),
  true
);
assert.equal(
  shouldUseIosMaleCountTts('female', 'ko', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
  }),
  false
);
assert.equal(
  shouldUseIosMaleCountTts('male', 'ko', {
    userAgent: 'Mozilla/5.0 (Linux; Android 14)',
  }),
  false
);

assert.ok(IOS_MALE_COUNT_RATE < 1 && IOS_MALE_COUNT_RATE >= 0.8);
assert.ok(IOS_MALE_COUNT_PAUSE_MS >= 50 && IOS_MALE_COUNT_PAUSE_MS <= 150);

// --- Mock speechSynthesis for 100× prep sequence ---------------------------
const spoken: string[] = [];
const rates: number[] = [];
let current: {
  text: string;
  rate: number;
  onend: (() => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
} | null = null;

const g = globalThis as typeof globalThis & {
  window: typeof globalThis;
  speechSynthesis: {
    speaking: boolean;
    pending: boolean;
    paused: boolean;
    cancel: () => void;
    resume: () => void;
    speak: (u: typeof current) => void;
    getVoices: () => SpeechSynthesisVoice[];
    addEventListener: () => void;
    removeEventListener: () => void;
  };
  SpeechSynthesisUtterance: new (text: string) => NonNullable<typeof current>;
  performance: { now: () => number };
};

g.window = g;
g.performance = { now: () => Date.now() };
g.SpeechSynthesisUtterance = class {
  text: string;
  rate = 1;
  pitch = 1;
  volume = 1;
  lang = 'ko-KR';
  voice = null;
  onend: (() => void) | null = null;
  onerror: ((ev: { error: string }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
} as unknown as new (text: string) => NonNullable<typeof current>;

g.speechSynthesis = {
  speaking: false,
  pending: false,
  paused: false,
  cancel() {
    current = null;
    this.speaking = false;
  },
  resume() {},
  speak(u) {
    current = u as typeof current;
    this.speaking = true;
    if (u?.text?.trim()) {
      spoken.push(u.text);
      rates.push(u.rate);
    }
    setTimeout(() => {
      if (current !== u) return;
      this.speaking = false;
      current = null;
      u?.onend?.();
    }, 4);
  },
  getVoices: () =>
    [
      {
        name: 'Jinho',
        lang: 'ko-KR',
        localService: true,
        default: false,
        voiceURI: 'jinho',
      },
      {
        name: 'Yuna',
        lang: 'ko-KR',
        localService: true,
        default: true,
        voiceURI: 'yuna',
      },
    ] as unknown as SpeechSynthesisVoice[],
  addEventListener() {},
  removeEventListener() {},
};

spoken.length = 0;
rates.length = 0;
// Word/order integrity: 100× prep sequence as individual utterances (no Arabic digits).
const sequence = Array.from({ length: 100 }, () => [...IOS_MALE_PREP_COUNT_WORDS]).flat();
const t0 = Date.now();
await speechManager.speakSequentialCounts(sequence, {
  rate: IOS_MALE_COUNT_RATE,
  preferMaleVoice: true,
  gapMs: 0,
});
const elapsed = Date.now() - t0;

assert.equal(spoken.length, 500, `expected 500 utterances, got ${spoken.length}`);
for (let i = 0; i < spoken.length; i += 5) {
  assert.deepEqual(spoken.slice(i, i + 5), [...IOS_MALE_PREP_COUNT_WORDS]);
}
assert.ok(rates.every((r) => Math.abs(r - IOS_MALE_COUNT_RATE) < 0.001));
assert.ok(
  !spoken.some((s) => /^[0-9]+$/.test(s)),
  'must not speak Arabic digits'
);

// Pause pacing smoke: one prep cycle with configured inter-utterance gap.
spoken.length = 0;
const tPause = Date.now();
await speechManager.speakSequentialCounts([...IOS_MALE_PREP_COUNT_WORDS], {
  rate: IOS_MALE_COUNT_RATE,
  preferMaleVoice: true,
  gapMs: IOS_MALE_COUNT_PAUSE_MS,
});
const pauseElapsed = Date.now() - tPause;
assert.deepEqual(spoken, [...IOS_MALE_PREP_COUNT_WORDS]);
assert.ok(
  pauseElapsed >= IOS_MALE_COUNT_PAUSE_MS * 3,
  `expected inter-utterance pauses, elapsed=${pauseElapsed}ms`
);

console.log('iosMaleCountSpeech.test.ts: ok');
console.log(`  100× 오사삼이일 utterances=${spoken.length === 5 ? 500 : spoken.length} (order ok) elapsed≈${elapsed}ms`);
console.log(`  pause smoke elapsed≈${pauseElapsed}ms (gap=${IOS_MALE_COUNT_PAUSE_MS}ms)`);
