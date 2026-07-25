/**
 * Hold cue must use selected voice pack clips (not OS TTS gender).
 *   npx vite-node src/utils/voiceCoach.holdPack.smoke.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { __resetVoiceCoachClipsForTests } from './voiceCoachClips';
import { runVoiceHoldSegment } from './voiceHold';
import { speechManager } from './speechManager';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.resolve(__dirname, '../../public/voice-coach');
const playedUrls: string[] = [];
const spoken: string[] = [];

class MockAudioBuffer {
  duration = 0.12;
}
class MockBufferSource {
  buffer: MockAudioBuffer | null = null;
  onended: (() => void) | null = null;
  connect(): void {}
  disconnect(): void {}
  start(): void {
    setTimeout(() => this.onended?.(), 15);
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
    }, 10);
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
    }, 8);
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

await runVoiceHoldSegment({
  durationSec: 2,
  locale: 'ko',
  voicePack: 'male',
});

const maleHold = playedUrls.filter((u) => u.includes('/voice-coach/male/hold.mp3'));
const femaleHold = playedUrls.filter((u) => u.includes('/voice-coach/female/hold.mp3'));
assert.ok(maleHold.length >= 1, `expected male hold clip, urls=${playedUrls.join('|')}`);
assert.equal(femaleHold.length, 0, `female hold leaked: ${femaleHold.join('|')}`);
assert.ok(
  !spoken.some((s) => s.includes('버텨')),
  `hold cue must not fall back to TTS when clip exists; spoken=${spoken.join('|')}`
);

console.log('voiceCoach.holdPack.smoke.test.ts: ok');
console.log(`  male hold fetches=${maleHold.length}, spoken=${spoken.join('|') || '(none)'}`);
