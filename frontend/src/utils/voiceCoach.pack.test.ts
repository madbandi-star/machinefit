/**
 * Voice pack selection — run with:
 *   npx vite-node src/utils/voiceCoach.pack.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  __resetVoiceCoachClipsForTests,
  playVoiceCoachClip,
  voiceCoachClipUrl,
} from './voiceCoachClips';
import { normalizeVoiceCoachPack, runVoiceCoachFlow } from './voiceCoach';
import { speechManager } from './speechManager';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.resolve(__dirname, '../../public/voice-coach');

const playedUrls: string[] = [];

class MockAudioBuffer {
  duration = 0.1;
}

class MockBufferSource {
  buffer: MockAudioBuffer | null = null;
  onended: (() => void) | null = null;
  connect(): void {}
  disconnect(): void {}
  start(): void {
    setTimeout(() => this.onended?.(), 20);
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

function installMocks(): void {
  playedUrls.length = 0;
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
      speak: (u: { onend?: (() => void) | null; text?: string }) => void;
      getVoices: () => SpeechSynthesisVoice[];
      addEventListener: () => void;
      removeEventListener: () => void;
    };
    SpeechSynthesisUtterance: new (text: string) => {
      text: string;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      volume: number;
      rate: number;
      pitch: number;
      lang: string;
      voice: null;
    };
    MediaMetadata: new (init?: object) => object;
    performance: { now: () => number };
    fetch: typeof fetch;
    CustomEvent: typeof CustomEvent;
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
    constructor(_init?: object) {}
  } as unknown as new (init?: object) => object;
  g.performance = { now: () => Date.now() };
  if (typeof g.CustomEvent !== 'function') {
    g.CustomEvent = class CustomEvent {
      type: string;
      detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type;
        this.detail = init?.detail;
      }
    } as unknown as typeof CustomEvent;
  }
  g.SpeechSynthesisUtterance = class {
    text: string;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    volume = 1;
    rate = 1;
    pitch = 1;
    lang = 'ko-KR';
    voice = null;
    constructor(text: string) {
      this.text = text;
    }
  } as unknown as new (text: string) => {
    text: string;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    volume: number;
    rate: number;
    pitch: number;
    lang: string;
    voice: null;
  };
  g.speechSynthesis = {
    speaking: false,
    pending: false,
    paused: false,
    cancel() {
      this.speaking = false;
    },
    resume() {},
    speak(u) {
      this.speaking = true;
      setTimeout(() => {
        this.speaking = false;
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
    const file = url.split('/').pop();
    if (!file?.endsWith('.mp3')) return new Response(null, { status: 404 });
    const parts = url.split('/');
    const packIdx = parts.findIndex((p) => p === 'voice-coach');
    const pack = packIdx >= 0 ? parts[packIdx + 1] : 'female';
    const abs = path.join(publicRoot, pack, file);
    const buf = readFileSync(abs);
    return new Response(buf, { status: 200 });
  }) as typeof fetch;
}

assert.equal(normalizeVoiceCoachPack('male'), 'male');
assert.equal(normalizeVoiceCoachPack('female'), 'female');
assert.ok(voiceCoachClipUrl('start', 'male').includes('/voice-coach/male/start.mp3'));
assert.ok(voiceCoachClipUrl('start', 'female').includes('/voice-coach/female/start.mp3'));

installMocks();
__resetVoiceCoachClipsForTests();
speechManager.cancel();

{
  const ac = new AbortController();
  const ok = await playVoiceCoachClip('cd-5', ac.signal, 'male');
  assert.equal(ok, true);
  assert.ok(
    playedUrls.some((u) => u.includes('/voice-coach/male/cd-5.mp3')),
    `expected male cd-5 fetch, got ${playedUrls.join('|')}`
  );
}

installMocks();
__resetVoiceCoachClipsForTests();
speechManager.cancel();
playedUrls.length = 0;

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

const maleHits = playedUrls.filter((u) => u.includes('/voice-coach/male/'));
const femaleHits = playedUrls.filter((u) => u.includes('/voice-coach/female/'));
assert.ok(maleHits.length >= 5, `expected male clip fetches, got ${maleHits.length}`);
assert.equal(femaleHits.length, 0, `female leaked: ${femaleHits.join('|')}`);
assert.ok(maleHits.some((u) => u.includes('cd-5.mp3')));
assert.ok(maleHits.some((u) => u.includes('start.mp3')));
assert.ok(maleHits.some((u) => u.includes('rep-1.mp3')));

console.log('voiceCoach.pack.test.ts: ok');
console.log(`  male fetches: ${maleHits.length}, female leaks: ${femaleHits.length}`);
