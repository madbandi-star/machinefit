/**
 * Voice-coach scenario matrix — run with:
 *   npx vite-node src/utils/voiceCoach.matrix.test.ts
 *
 * Covers flow modes, prep counts, rest-tip race, stop/restart, clip interrupt.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  __resetVoiceCoachClipsForTests,
  playVoiceCoachClip,
  stopVoiceCoachClips,
  unlockVoiceCoachClips,
} from './voiceCoachClips';
import {
  runVoiceCoachFlow,
  speakRestTipsAndWarnings,
  stopVoiceCoach,
  unlockVoiceCoachAudio,
} from './voiceCoach';
import { speechManager } from './speechManager';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clipRoot = path.resolve(__dirname, '../../public/voice-coach/female');

type ResultRow = {
  id: string;
  ok: boolean;
  detail: string;
};

const results: ResultRow[] = [];

function record(id: string, ok: boolean, detail: string): void {
  results.push({ id, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${id} — ${detail}`);
}

// --- Minimal browser mocks -------------------------------------------------

type SpeakHandler = (text: string) => void;

const spoken: string[] = [];
const playedClips: string[] = [];
let speechCanceledCount = 0;
let currentUtterance: {
  text: string;
  onend: (() => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  volume: number;
  rate: number;
  pitch: number;
  lang: string;
  voice: null;
} | null = null;

class MockAudioBuffer {
  duration: number;
  constructor(duration = 0.12) {
    this.duration = duration;
  }
}

/** When > 0, BufferSource delays onended by this many ms (for interrupt tests). */
let mockSourceEndDelayMs = 0;

class MockBufferSource {
  buffer: MockAudioBuffer | null = null;
  onended: (() => void) | null = null;
  connect(): void {}
  disconnect(): void {}
  start(): void {
    const dur = (this.buffer?.duration ?? 0.12) * 1000;
    const delay = mockSourceEndDelayMs > 0 ? mockSourceEndDelayMs : Math.min(30, dur);
    setTimeout(() => this.onended?.(), delay);
  }
  stop(): void {
    // Production clears onended before stop — do not fire callback.
    this.onended = null;
  }
}

class MockAudioContext {
  state: string = 'running';
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
  async decodeAudioData(data: ArrayBuffer): Promise<MockAudioBuffer> {
    // ~96kbps → rough duration from byte length
    const sec = Math.max(0.08, data.byteLength / 12_000);
    return new MockAudioBuffer(sec);
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
    if (this.src.includes('voice-coach') && this.src.includes('.mp3')) {
      const key = this.src.split('/').pop()?.replace('.mp3', '') ?? '?';
      playedClips.push(`html:${key}`);
    }
    setTimeout(() => {
      this.paused = true;
      this.onended?.();
    }, 15);
  }
  pause(): void {
    this.paused = true;
  }
  load(): void {}
  removeAttribute(): void {}
  setAttribute(): void {}
}

function installMocks(): void {
  spoken.length = 0;
  playedClips.length = 0;
  speechCanceledCount = 0;
  currentUtterance = null;

  const g = globalThis as typeof globalThis & {
    window: typeof globalThis;
    document: {
      visibilityState: string;
      querySelectorAll: (sel: string) => NodeListOf<Element>;
      addEventListener: () => void;
      removeEventListener: () => void;
    };
    AudioContext: typeof MockAudioContext;
    webkitAudioContext?: typeof MockAudioContext;
    Audio: new () => MockHTMLAudioElement;
    speechSynthesis: {
      speaking: boolean;
      pending: boolean;
      paused: boolean;
      cancel: () => void;
      resume: () => void;
      speak: (u: typeof currentUtterance) => void;
      getVoices: () => SpeechSynthesisVoice[];
      addEventListener: () => void;
      removeEventListener: () => void;
    };
    SpeechSynthesisUtterance: new (text: string) => NonNullable<typeof currentUtterance>;
    MediaMetadata: new (init?: object) => object;
    DOMException: typeof DOMException;
    performance: { now: () => number };
    fetch: typeof fetch;
    CustomEvent: typeof CustomEvent;
  };

  g.window = g;
  (g as { addEventListener: () => void }).addEventListener = () => {};
  (g as { removeEventListener: () => void }).removeEventListener = () => {};
  (g as { dispatchEvent: () => boolean }).dispatchEvent = () => true;
  (g as { setTimeout: typeof setTimeout }).setTimeout = setTimeout;
  (g as { clearTimeout: typeof clearTimeout }).clearTimeout = clearTimeout;
  (g as { setInterval: typeof setInterval }).setInterval = setInterval;
  (g as { clearInterval: typeof clearInterval }).clearInterval = clearInterval;
  g.document = {
    visibilityState: 'visible',
    querySelectorAll: () => [] as unknown as NodeListOf<Element>,
    addEventListener() {},
    removeEventListener() {},
  };
  g.AudioContext = MockAudioContext;
  g.webkitAudioContext = MockAudioContext;
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
    onerror: ((ev: { error: string }) => void) | null = null;
    volume = 1;
    rate = 1;
    pitch = 1;
    lang = 'ko-KR';
    voice = null;
    constructor(text: string) {
      this.text = text;
    }
  } as unknown as new (text: string) => NonNullable<typeof currentUtterance>;

  g.speechSynthesis = {
    speaking: false,
    pending: false,
    paused: false,
    cancel() {
      speechCanceledCount += 1;
      const u = currentUtterance;
      currentUtterance = null;
      this.speaking = false;
      if (u?.onerror) u.onerror({ error: 'canceled' });
    },
    resume() {
      this.paused = false;
    },
    speak(u) {
      currentUtterance = u as typeof currentUtterance;
      this.speaking = true;
      const text = (u as { text: string }).text;
      if (text && text !== '\u200B' && text.trim()) {
        spoken.push(text);
      }
      setTimeout(() => {
        if (currentUtterance !== u) return;
        this.speaking = false;
        currentUtterance = null;
        (u as { onend: (() => void) | null }).onend?.();
      }, 12);
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

  g.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const file = url.split('/').pop();
    if (!file?.endsWith('.mp3')) {
      return new Response(null, { status: 404 });
    }
    const abs = path.join(clipRoot, file);
    try {
      const buf = readFileSync(abs);
      playedClips.push(`fetch:${file.replace('.mp3', '')}`);
      return new Response(buf, { status: 200 });
    } catch {
      return new Response(null, { status: 404 });
    }
  }) as typeof fetch;

  // Wake Lock / mediaSession stubs
  Object.defineProperty(g.navigator, 'wakeLock', {
    value: undefined,
    configurable: true,
  });
  Object.defineProperty(g.navigator, 'mediaSession', {
    value: { playbackState: 'none', metadata: null },
    configurable: true,
  });
}

function resetCoachState(): void {
  __resetVoiceCoachClipsForTests();
  speechManager.cancel();
  spoken.length = 0;
  playedClips.length = 0;
  speechCanceledCount = 0;
}

async function collectPhases(
  run: (onPhase: (p: string, d?: { countdown?: number; rep?: number }) => void) => Promise<void>
): Promise<string[]> {
  const phases: string[] = [];
  await run((p, d) => {
    if (p === 'countdown' && d?.countdown != null) phases.push(`countdown:${d.countdown}`);
    else if (p === 'counting' && d?.rep != null) phases.push(`counting:${d.rep}`);
    else if (p === 'oneMore' && d?.rep != null) phases.push(`oneMore:${d.rep}`);
    else if (p === 'hold' && d?.countdown != null) phases.push(`hold:${d.countdown}`);
    else phases.push(p);
  });
  return phases;
}

async function caseHappyPathCount(): Promise<void> {
  installMocks();
  resetCoachState();

  const phases = await collectPhases((onPhaseChange) =>
    runVoiceCoachFlow({
      targetReps: 3,
      oneMoreEnabled: false,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 50,
      locale: 'ko',
      onPhaseChange,
    })
  );

  const hasCd = [5, 4, 3, 2, 1].every((n) => phases.includes(`countdown:${n}`));
  const hasReps = [1, 2, 3].every((n) => phases.includes(`counting:${n}`));
  const clipKeys = playedClips.map((c) => c.replace(/^(fetch|html):/, ''));
  const playedCd5 = clipKeys.includes('cd-5');
  const playedStart = clipKeys.includes('start') || spoken.some((s) => s.includes('시작'));
  const ok =
    hasCd && hasReps && phases.includes('start') && phases.includes('done') && playedCd5 && playedStart;
  record(
    'count/prep5/reps3',
    ok,
    `phases=${phases.join('>')} clips=${[...new Set(clipKeys)].join(',')} spoken=${spoken.join('|')}`
  );
}

async function casePrep10(): Promise<void> {
  installMocks();
  resetCoachState();

  const phases = await collectPhases((onPhaseChange) =>
    runVoiceCoachFlow({
      targetReps: 2,
      oneMoreEnabled: false,
      prepCount: 10,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 40,
      locale: 'ko',
      onPhaseChange,
    })
  );

  const countdown = phases.filter((p) => p.startsWith('countdown:'));
  const ok =
    countdown.length === 10 &&
    phases.includes('countdown:10') &&
    phases.includes('countdown:6') &&
    phases.includes('countdown:1') &&
    phases.includes('done');
  record('count/prep10', ok, countdown.join(','));
}

async function caseOneMore(): Promise<void> {
  installMocks();
  resetCoachState();

  const phases = await collectPhases((onPhaseChange) =>
    runVoiceCoachFlow({
      targetReps: 2,
      oneMoreEnabled: true,
      maxOneMore: 2,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 40,
      locale: 'ko',
      onPhaseChange,
    })
  );

  const ok =
    phases.includes('counting:2') &&
    phases.includes('oneMore:3') &&
    phases.includes('oneMore:4') &&
    phases.includes('done');
  record(
    'count+oneMore×2',
    ok,
    phases.filter((p) => p.startsWith('oneMore') || p.startsWith('counting')).join(',')
  );
}

async function caseHoldOnly(): Promise<void> {
  installMocks();
  resetCoachState();

  const phases = await collectPhases((onPhaseChange) =>
    runVoiceCoachFlow({
      targetReps: 5,
      oneMoreEnabled: false,
      prepCount: 5,
      flowMode: 'hold',
      holdDurationSec: 3,
      locale: 'ko',
      onPhaseChange,
    })
  );

  const hasPrep = [5, 4, 3, 2, 1].every((n) => phases.includes(`countdown:${n}`));
  const hasHold = phases.some((p) => p === 'hold' || p.startsWith('hold:'));
  const ok =
    hasPrep &&
    phases.includes('start') &&
    hasHold &&
    phases.includes('done') &&
    spoken.some((s) => s.includes('버텨'));
  record('hold-only/prep5+3s', ok, `phases=${phases.join('>')} spoken=${spoken.join('|')}`);
}

async function caseCountHold(): Promise<void> {
  installMocks();
  resetCoachState();

  const phases = await collectPhases((onPhaseChange) =>
    runVoiceCoachFlow({
      targetReps: 2,
      oneMoreEnabled: false,
      prepCount: 5,
      flowMode: 'count_hold',
      holdDurationSec: 2,
      countMode: 'normal',
      repGapMs: 40,
      locale: 'ko',
      onPhaseChange,
    })
  );

  const ok =
    phases.includes('counting:2') &&
    phases.some((p) => p.startsWith('hold:') || p === 'hold') &&
    phases.includes('done');
  record('count_hold', ok, phases.join('>'));
}

async function caseAbortMidCountdown(): Promise<void> {
  installMocks();
  resetCoachState();

  const ac = new AbortController();
  const phases: string[] = [];
  await runVoiceCoachFlow({
    targetReps: 5,
    oneMoreEnabled: false,
    prepCount: 5,
    flowMode: 'count',
    countMode: 'normal',
    repGapMs: 40,
    locale: 'ko',
    signal: ac.signal,
    onPhaseChange: (p, d) => {
      phases.push(p === 'countdown' && d?.countdown != null ? `countdown:${d.countdown}` : p);
      if (p === 'countdown' && d?.countdown === 4) ac.abort();
    },
  });
  const ok = !phases.includes('done') && phases.includes('idle') && !phases.includes('counting:1');
  record('abort@countdown:4', ok, phases.join('>'));
}

async function caseRestTipsRaceMustNotKillCount(): Promise<void> {
  installMocks();
  resetCoachState();

  const tipsAc = new AbortController();
  const tipsPromise = speakRestTipsAndWarnings({
    warnings: ['무릎 조심'],
    tips: ['호흡을 유지하세요'],
    locale: 'ko',
    signal: tipsAc.signal,
  });

  // Let tips start speaking
  await new Promise((r) => setTimeout(r, 25));
  tipsAc.abort();
  // Old buggy path called stopVoiceCoach() in tips catch — must NOT kill this run.
  stopVoiceCoachClips();
  speechManager.cancel();

  const phases = await collectPhases((onPhaseChange) =>
    runVoiceCoachFlow({
      targetReps: 2,
      oneMoreEnabled: false,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 40,
      locale: 'ko',
      onPhaseChange,
    })
  );

  await tipsPromise.catch(() => undefined);

  const ok =
    phases.includes('countdown:5') &&
    phases.includes('countdown:1') &&
    phases.includes('counting:1') &&
    phases.includes('counting:2') &&
    phases.includes('done');
  record(
    'race/restTipsAbort→start',
    ok,
    `phases=${phases.join('>')} (must complete full count despite tips abort)`
  );
}

async function caseStopClipsDoesNotHang(): Promise<void> {
  installMocks();
  resetCoachState();
  mockSourceEndDelayMs = 2000;

  const ac = new AbortController();
  const playPromise = playVoiceCoachClip('cd-5', ac.signal);
  // Wait until Web Audio source is playing (fetch+decode done).
  await new Promise((r) => setTimeout(r, 80));
  stopVoiceCoachClips();

  let result: unknown;
  try {
    result = await Promise.race([
      playPromise,
      new Promise((_r, reject) => setTimeout(() => reject(new Error('hang')), 500)),
    ]);
  } catch (e) {
    result = e;
  } finally {
    mockSourceEndDelayMs = 0;
  }

  const ok = result === false;
  record('clip/stop-does-not-hang', ok, `result=${String(result)}`);
}

async function caseExternalCancelDuringTtsDoesNotAbortSession(): Promise<void> {
  installMocks();
  resetCoachState();

  const phases: string[] = [];
  let canceledOnce = false;
  await runVoiceCoachFlow({
    targetReps: 2,
    oneMoreEnabled: false,
    prepCount: 5,
    flowMode: 'count',
    countMode: 'normal',
    repGapMs: 40,
    locale: 'ko',
    onPhaseChange: (p, d) => {
      let label = p;
      if (p === 'countdown' && d?.countdown != null) label = `countdown:${d.countdown}`;
      if (p === 'counting' && d?.rep != null) label = `counting:${d.rep}`;
      phases.push(label);
      if (!canceledOnce && p === 'countdown' && d?.countdown === 5) {
        canceledOnce = true;
        speechManager.cancel();
      }
    },
  });
  const ok = phases.includes('done') && phases.includes('counting:2');
  record('tts/stray-cancel-survives', ok, phases.join('>'));
}

async function caseDisabledUnlockSilent(): Promise<void> {
  installMocks();
  resetCoachState();
  await unlockVoiceCoachClips('female');
  const leakedCd = playedClips.some((c) => c.includes('cd-5') && c.startsWith('html:'));
  record('unlock/no-audible-cd5', !leakedCd, `played=${playedClips.join(',')}`);
}

/**
 * First Count Start on 추천기록 used to await clip fetch/decode inside unlock.
 * That lost the mobile gesture so the first tap was silent until set-complete
 * primed audio. Unlock must resolve without waiting on preload.
 */
async function caseUnlockDoesNotWaitForClipPreload(): Promise<void> {
  installMocks();
  resetCoachState();

  const g = globalThis as typeof globalThis & { fetch: typeof fetch };
  const realFetch = g.fetch;
  g.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    await new Promise((r) => setTimeout(r, 800));
    return realFetch(input, init);
  }) as typeof fetch;

  const t0 = Date.now();
  await unlockVoiceCoachAudio();
  const elapsed = Date.now() - t0;

  // Must not wait on the 800ms clip fetches (allow HTML silent-play race ~250ms).
  const ok = elapsed < 400;
  record(
    'unlock/first-start-no-preload-wait',
    ok,
    `elapsed=${elapsed}ms (must be <400; slow fetch=800ms)`
  );
}

async function caseTurboMode(): Promise<void> {
  installMocks();
  resetCoachState();
  const phases = await collectPhases((onPhaseChange) =>
    runVoiceCoachFlow({
      targetReps: 4,
      oneMoreEnabled: false,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'normal_turbo',
      repGapMs: 40,
      locale: 'ko',
      onPhaseChange,
    })
  );
  const ok = phases.includes('counting:4') && phases.includes('done');
  record('countMode/normal_turbo', ok, phases.filter((p) => p.startsWith('counting')).join(','));
}

async function caseAiAccelMode(): Promise<void> {
  installMocks();
  resetCoachState();
  const phases = await collectPhases((onPhaseChange) =>
    runVoiceCoachFlow({
      targetReps: 4,
      oneMoreEnabled: true,
      maxOneMore: 1,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'ai_accel_turbo',
      repGapMs: 40,
      locale: 'ko',
      onPhaseChange,
    })
  );
  const ok = phases.includes('counting:4') && phases.includes('oneMore:5') && phases.includes('done');
  record(
    'countMode/ai_accel_turbo+oneMore',
    ok,
    phases.filter((p) => p.startsWith('counting') || p.startsWith('oneMore')).join(',')
  );
}

async function caseEnglishLocale(): Promise<void> {
  installMocks();
  resetCoachState();
  const phases = await collectPhases((onPhaseChange) =>
    runVoiceCoachFlow({
      targetReps: 2,
      oneMoreEnabled: true,
      maxOneMore: 1,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 40,
      locale: 'en',
      onPhaseChange,
    })
  );
  const ok =
    phases.includes('done') &&
    spoken.some((s) => /ready/i.test(s)) &&
    spoken.some((s) => /start/i.test(s)) &&
    spoken.some((s) => /one more/i.test(s));
  record('locale/en', ok, `spoken=${spoken.join('|')}`);
}

async function caseDoubleStartSecondWins(): Promise<void> {
  installMocks();
  resetCoachState();
  const ac1 = new AbortController();
  const phases1: string[] = [];

  const run1 = runVoiceCoachFlow({
    targetReps: 3,
    oneMoreEnabled: false,
    prepCount: 5,
    flowMode: 'count',
    countMode: 'normal',
    repGapMs: 40,
    locale: 'ko',
    signal: ac1.signal,
    onPhaseChange: (p, d) => {
      phases1.push(p === 'countdown' && d?.countdown != null ? `countdown:${d.countdown}` : p);
      if (p === 'countdown' && d?.countdown === 5) {
        // Mimic Start tapped again: abort + stopVoiceCoach soft path.
        ac1.abort();
        stopVoiceCoach({ keepAudioSession: true });
      }
    },
  });

  await new Promise((r) => setTimeout(r, 80));

  const phases = await collectPhases((onPhaseChange) =>
    runVoiceCoachFlow({
      targetReps: 2,
      oneMoreEnabled: false,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 40,
      locale: 'ko',
      onPhaseChange,
    })
  );

  await run1;
  const ok =
    phases.includes('countdown:5') &&
    phases.includes('countdown:1') &&
    phases.includes('counting:2') &&
    phases.includes('done');
  record(
    'double-start/second-wins',
    ok,
    `first=${phases1.join('>')} second=${phases.filter((p) => p.startsWith('countdown') || p.startsWith('counting') || p === 'done').join('>')}`
  );
}

async function caseOverlapCleanupDoesNotKillSuccessor(): Promise<void> {
  installMocks();
  resetCoachState();

  const ac1 = new AbortController();
  let hitFive = false;
  const run1 = runVoiceCoachFlow({
    targetReps: 5,
    oneMoreEnabled: false,
    prepCount: 5,
    flowMode: 'count',
    countMode: 'normal',
    repGapMs: 40,
    locale: 'ko',
    signal: ac1.signal,
    onPhaseChange: (p, d) => {
      if (p === 'countdown' && d?.countdown === 5 && !hitFive) {
        hitFive = true;
        ac1.abort();
        stopVoiceCoach({ keepAudioSession: true });
      }
    },
  });

  // Successor starts immediately (same as UI Start after soft-stop).
  await new Promise((r) => setTimeout(r, 30));
  const phases = await collectPhases((onPhaseChange) =>
    runVoiceCoachFlow({
      targetReps: 3,
      oneMoreEnabled: false,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 40,
      locale: 'ko',
      onPhaseChange,
    })
  );
  await run1;

  const countdown = [5, 4, 3, 2, 1].every((n) => phases.includes(`countdown:${n}`));
  const reps = [1, 2, 3].every((n) => phases.includes(`counting:${n}`));
  record(
    'overlap/old-finally-safe',
    countdown && reps && phases.includes('done'),
    phases.join('>')
  );
}

async function main(): Promise<void> {
  console.log('\n=== Voice coach scenario matrix ===\n');
  await caseHappyPathCount();
  await casePrep10();
  await caseOneMore();
  await caseHoldOnly();
  await caseCountHold();
  await caseAbortMidCountdown();
  await caseRestTipsRaceMustNotKillCount();
  await caseStopClipsDoesNotHang();
  await caseExternalCancelDuringTtsDoesNotAbortSession();
  await caseDisabledUnlockSilent();
  await caseUnlockDoesNotWaitForClipPreload();
  await caseTurboMode();
  await caseAiAccelMode();
  await caseEnglishLocale();
  await caseDoubleStartSecondWins();
  await caseOverlapCleanupDoesNotKillSuccessor();

  const failed = results.filter((r) => !r.ok);
  console.log('\n--- Summary ---');
  console.log(`Total: ${results.length}  Pass: ${results.length - failed.length}  Fail: ${failed.length}`);
  if (failed.length) {
    for (const f of failed) console.error(`FAIL: ${f.id} — ${f.detail}`);
    process.exitCode = 1;
  } else {
    console.log('All matrix cases passed.');
  }
}

void main();
