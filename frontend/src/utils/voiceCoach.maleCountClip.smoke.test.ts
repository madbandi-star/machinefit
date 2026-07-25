/**
 * Male pack number counts must play male clips (not OS female TTS).
 *   npx vite-node src/utils/voiceCoach.maleCountClip.smoke.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { __resetVoiceCoachClipsForTests } from './voiceCoachClips';
import { runVoiceCoachFlow } from './voiceCoach';
import { speechManager } from './speechManager';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.resolve(__dirname, '../../public/voice-coach');
const playedUrls: string[] = [];
const spoken: string[] = [];

// Pretend iOS so a regression that re-enables TTS-bypass would fail this test.
Object.defineProperty(globalThis.navigator, 'userAgent', {
  value:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
  configurable: true,
});

class MockAudioBuffer {
  duration = 0.1;
}
class MockBufferSource {
  buffer: MockAudioBuffer | null = null;
  onended: (() => void) | null = null;
  connect(): void {}
  disconnect(): void {}
  start(): void {
    setTimeout(() => this.onended?.(), 12);
  }
  stop(): void {
    this.onended = null;
  }
}
class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  async resume(): Promise<void> {
    this.state = 'running';
  }
  async close(): Promise<void> {
    this.state = 'closed';
  }
  createBufferSource(): MockBufferSource {
    return new MockBufferSource();
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440 },
      connect() {},
      start() {},
      stop() {},
    };
  }
  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime() {},
        exponentialRampToValueAtTime() {},
      },
      connect() {},
    };
  }
  async decodeAudioData(): Promise<MockAudioBuffer> {
    return new MockAudioBuffer();
  }
}
class MockHTMLAudioElement {
  src = '';
  volume = 1;
  preload = '';
  currentTime = 0;
  paused = true;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  async play(): Promise<void> {
    this.paused = false;
    setTimeout(() => {
      this.paused = true;
      this.onended?.();
    }, 8);
  }
  pause(): void {
    this.paused = true;
  }
  load(): void {}
  removeAttribute(): void {}
  setAttribute(): void {}
}

const g = globalThis as typeof globalThis & {
  window: typeof globalThis;
  document: {
    visibilityState: string;
    querySelectorAll: () => NodeListOf<Element>;
    addEventListener: () => void;
    removeEventListener: () => void;
  };
  AudioContext: typeof MockAudioContext;
  Audio: new () => MockHTMLAudioElement;
  speechSynthesis: {
    speaking: boolean;
    pending: boolean;
    paused: boolean;
    cancel: () => void;
    resume: () => void;
    speak: (u: { text?: string; onend?: (() => void) | null }) => void;
    getVoices: () => SpeechSynthesisVoice[];
    addEventListener: () => void;
    removeEventListener: () => void;
  };
  SpeechSynthesisUtterance: new (text: string) => {
    text: string;
    onend: (() => void) | null;
    onerror: (() => void) | null;
  };
  MediaMetadata: new () => object;
  performance: { now: () => number };
  fetch: typeof fetch;
};

g.window = g;
(g as { addEventListener: () => void }).addEventListener = () => {};
(g as { removeEventListener: () => void }).removeEventListener = () => {};
(g as { dispatchEvent: () => boolean }).dispatchEvent = () => true;
g.document = {
  visibilityState: 'visible',
  querySelectorAll: () => [] as unknown as NodeListOf<Element>,
  addEventListener() {},
  removeEventListener() {},
};
g.AudioContext = MockAudioContext;
g.Audio = MockHTMLAudioElement as unknown as new () => MockHTMLAudioElement;
g.MediaMetadata = class {
  constructor() {}
} as unknown as new () => object;
g.performance = { now: () => Date.now() };
g.SpeechSynthesisUtterance = class {
  text: string;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
} as unknown as new (text: string) => {
  text: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
let current: { text?: string; onend?: (() => void) | null } | null = null;
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
    current = u;
    this.speaking = true;
    if (u.text?.trim()) spoken.push(u.text);
    setTimeout(() => {
      if (current !== u) return;
      this.speaking = false;
      current = null;
      u.onend?.();
    }, 6);
  },
  getVoices: () => [] as unknown as SpeechSynthesisVoice[],
  addEventListener() {},
  removeEventListener() {},
};
Object.defineProperty(g.navigator, 'wakeLock', { value: undefined, configurable: true });
Object.defineProperty(g.navigator, 'mediaSession', {
  value: { playbackState: 'none', metadata: null },
  configurable: true,
});
g.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  playedUrls.push(url);
  const file = url.split('/').pop()!;
  const parts = url.split('/');
  const packIdx = parts.findIndex((p) => p === 'voice-coach');
  const pack = packIdx >= 0 ? parts[packIdx + 1] : 'female';
  const buf = readFileSync(path.join(publicRoot, pack, file));
  return new Response(buf, { status: 200 });
}) as typeof fetch;

__resetVoiceCoachClipsForTests();
speechManager.cancel();
playedUrls.length = 0;
spoken.length = 0;

await runVoiceCoachFlow({
  targetReps: 2,
  oneMoreEnabled: false,
  prepCount: 5,
  flowMode: 'count',
  countMode: 'normal',
  voicePack: 'male',
  repGapMs: 800,
  locale: 'ko',
});

const maleCd = playedUrls.filter((u) => /\/voice-coach\/male\/cd-\d+\.mp3/.test(u));
const femaleCd = playedUrls.filter((u) => /\/voice-coach\/female\/cd-\d+\.mp3/.test(u));
const maleRep = playedUrls.filter((u) => /\/voice-coach\/male\/rep-\d+\.mp3/.test(u));
const femaleRep = playedUrls.filter((u) => /\/voice-coach\/female\/rep-\d+\.mp3/.test(u));

assert.ok(maleCd.length >= 5, `expected male cd clips, got ${maleCd.length}`);
assert.ok(maleRep.length >= 2, `expected male rep clips, got ${maleRep.length}`);
assert.equal(femaleCd.length, 0, `female countdown leaked: ${femaleCd.join('|')}`);
assert.equal(femaleRep.length, 0, `female rep leaked: ${femaleRep.join('|')}`);
assert.ok(
  !spoken.some((s) => ['오', '사', '삼', '이', '일', '5', '4', '3', '2', '1'].includes(s)),
  `count must not fall back to TTS when male clips exist; spoken=${spoken.join('|')}`
);

console.log('voiceCoach.maleCountClip.smoke.test.ts: ok');
console.log(`  male cd=${maleCd.length} rep=${maleRep.length} tts=${spoken.join('|') || 'none'}`);
