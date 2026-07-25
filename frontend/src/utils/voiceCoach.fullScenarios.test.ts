/**
 * Full voice-count scenario suite — run with:
 *   npx vite-node src/utils/voiceCoach.fullScenarios.test.ts
 *
 * Covers clip inventory, key/URL clamps, all count/flow/prep/oneMore
 * combinations, turbo flags, aborts, and locale.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCountPaceSchedule,
  clampVoiceCountMode,
  DEFAULT_VOICE_COUNT_MODE,
  resolveTurboCount,
  VOICE_COUNT_MODES,
  type VoiceCountMode,
} from './aiCountPace';
import {
  __resetVoiceCoachClipsForTests,
  countdownClipKey,
  MAX_VOICE_COACH_CLIP_COUNTDOWN,
  MAX_VOICE_COACH_CLIP_REP,
  normalizeVoiceCoachPack,
  playVoiceCoachClip,
  preloadVoiceCoachClips,
  repClipKey,
  stopVoiceCoachClips,
  unlockVoiceCoachClips,
  voiceCoachClipUrl,
  VOICE_COACH_PACKS,
} from './voiceCoachClips';
import {
  clampVoiceCoachOneMoreCount,
  clampVoiceCoachPrepCount,
  clampVoiceCoachRepGapMs,
  DEFAULT_VOICE_COACH_PREP_COUNT,
  runVoiceCoachFlow,
  speakRestTipsAndWarnings,
  stopVoiceCoach,
  unlockVoiceCoachAudio,
  VOICE_COACH_PREP_COUNTS,
} from './voiceCoach';
import {
  clampVoiceHoldDurationSec,
  clampVoiceHoldFlowMode,
  DEFAULT_VOICE_HOLD_FLOW_MODE,
  VOICE_HOLD_FLOW_MODES,
  type VoiceHoldFlowMode,
} from './voiceHold';
import { speechManager } from './speechManager';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.resolve(__dirname, '../../public/voice-coach');

type ResultRow = { id: string; ok: boolean; detail: string; group: string };
const results: ResultRow[] = [];

function record(group: string, id: string, ok: boolean, detail: string): void {
  results.push({ group, id, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${group}] ${id} — ${detail}`);
}

// --- Minimal browser mocks (shared with matrix harness) --------------------

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
let mockSourceEndDelayMs = 0;

class MockAudioBuffer {
  duration: number;
  constructor(duration = 0.12) {
    this.duration = duration;
  }
}

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

function installMocks(packRoot = path.join(publicRoot, 'female')): void {
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
    // Resolve pack from URL path …/voice-coach/{pack}/{file}
    const parts = url.split('/');
    const packIdx = parts.findIndex((p) => p === 'voice-coach');
    const pack = packIdx >= 0 ? parts[packIdx + 1] : 'female';
    const abs = path.join(publicRoot, pack, file);
    try {
      const buf = readFileSync(abs);
      playedClips.push(`fetch:${file.replace('.mp3', '')}`);
      return new Response(buf, { status: 200 });
    } catch {
      // Fall back to requested packRoot for tests that only mount female
      try {
        const buf = readFileSync(path.join(packRoot, file));
        playedClips.push(`fetch:${file.replace('.mp3', '')}`);
        return new Response(buf, { status: 200 });
      } catch {
        return new Response(null, { status: 404 });
      }
    }
  }) as typeof fetch;

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

function clipKeysOnly(): string[] {
  return [...new Set(playedClips.map((c) => c.replace(/^(fetch|html):/, '')))];
}

type PhaseDetail = {
  countdown?: number;
  rep?: number;
  turbo?: boolean;
  intensity?: number;
};

async function runFlow(opts: Parameters<typeof runVoiceCoachFlow>[0]): Promise<{
  phases: string[];
  turboReps: number[];
}> {
  const phases: string[] = [];
  const turboReps: number[] = [];
  await runVoiceCoachFlow({
    ...opts,
    onPhaseChange: (p, d) => {
      const detail = d as PhaseDetail | undefined;
      if (p === 'countdown' && detail?.countdown != null) {
        phases.push(`countdown:${detail.countdown}`);
      } else if (p === 'counting' && detail?.rep != null) {
        phases.push(`counting:${detail.rep}`);
        if (detail.turbo && detail.rep > 0) turboReps.push(detail.rep);
      } else if (p === 'oneMore' && detail?.rep != null) {
        phases.push(`oneMore:${detail.rep}`);
        if (detail.turbo) turboReps.push(detail.rep);
      } else if (p === 'hold' && detail?.countdown != null) {
        phases.push(`hold:${detail.countdown}`);
      } else {
        phases.push(p);
      }
      opts.onPhaseChange?.(p, d);
    },
  });
  return { phases, turboReps };
}

// --- A. Clip inventory -----------------------------------------------------

function caseClipInventory(): void {
  const required = [
    ...Array.from({ length: MAX_VOICE_COACH_CLIP_COUNTDOWN }, (_, i) => `cd-${i + 1}.mp3`),
    ...Array.from({ length: MAX_VOICE_COACH_CLIP_REP }, (_, i) => `rep-${i + 1}.mp3`),
    'start.mp3',
    'one-more.mp3',
  ];
  for (const pack of VOICE_COACH_PACKS) {
    const dir = path.join(publicRoot, pack);
    const files = new Set(readdirSync(dir));
    const missing = required.filter((f) => !files.has(f));
    record(
      'inventory',
      `pack/${pack}`,
      missing.length === 0,
      missing.length ? `missing=${missing.join(',')}` : `files=${files.size}`
    );
  }
}

// --- B. Keys / URL / clamps ------------------------------------------------

function caseKeysAndClamps(): void {
  for (let n = 1; n <= 10; n += 1) {
    record('keys', `countdownClipKey(${n})`, countdownClipKey(n) === `cd-${n}`, String(countdownClipKey(n)));
  }
  record('keys', 'countdownClipKey(0)', countdownClipKey(0) === null, String(countdownClipKey(0)));
  record('keys', 'countdownClipKey(11)', countdownClipKey(11) === null, String(countdownClipKey(11)));

  for (let n = 1; n <= 30; n += 1) {
    if (n === 1 || n === 15 || n === 30) {
      record('keys', `repClipKey(${n})`, repClipKey(n) === `rep-${n}`, String(repClipKey(n)));
    }
  }
  record('keys', 'repClipKey(31)', repClipKey(31) === null, String(repClipKey(31)));

  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const expected = `${normalizedBase}voice-coach/female/start.mp3`;
  record(
    'keys',
    'voiceCoachClipUrl(start)',
    voiceCoachClipUrl('start', 'female') === expected,
    voiceCoachClipUrl('start', 'female')
  );

  record('clamp', 'prep default', clampVoiceCoachPrepCount(undefined) === DEFAULT_VOICE_COACH_PREP_COUNT, String(clampVoiceCoachPrepCount(undefined)));
  record('clamp', 'prep 10', clampVoiceCoachPrepCount(10) === 10, String(clampVoiceCoachPrepCount(10)));
  record('clamp', 'prep invalid→5', clampVoiceCoachPrepCount(7) === 5, String(clampVoiceCoachPrepCount(7)));
  record('clamp', 'countMode default', clampVoiceCountMode('nope') === DEFAULT_VOICE_COUNT_MODE, clampVoiceCountMode('nope'));
  for (const m of VOICE_COUNT_MODES) {
    record('clamp', `countMode ${m}`, clampVoiceCountMode(m) === m, m);
  }
  record('clamp', 'flow default', clampVoiceHoldFlowMode('x') === DEFAULT_VOICE_HOLD_FLOW_MODE, clampVoiceHoldFlowMode('x'));
  for (const m of VOICE_HOLD_FLOW_MODES) {
    record('clamp', `flow ${m}`, clampVoiceHoldFlowMode(m) === m, m);
  }
  record('clamp', 'repGap 40→800', clampVoiceCoachRepGapMs(40) === 800, String(clampVoiceCoachRepGapMs(40)));
  record('clamp', 'oneMore 0→1', clampVoiceCoachOneMoreCount(0) === 1, String(clampVoiceCoachOneMoreCount(0)));
  record('clamp', 'oneMore 99→10', clampVoiceCoachOneMoreCount(99) === 10, String(clampVoiceCoachOneMoreCount(99)));
  record('clamp', 'hold 0→1', clampVoiceHoldDurationSec(0) === 1, String(clampVoiceHoldDurationSec(0)));
  record('clamp', 'pack nope→female', normalizeVoiceCoachPack('nope') === 'female', normalizeVoiceCoachPack('nope'));
}

// --- C. Pace schedules -----------------------------------------------------

function casePaceSchedules(): void {
  const totals = [4, 10, 12, 30, 45, 60, 90];
  for (const total of totals) {
    for (const mode of VOICE_COUNT_MODES) {
      const pace = buildCountPaceSchedule({
        totalCounts: total,
        baseGapMs: 2000,
        mode,
        minGapMs: 800,
      });
      const turboN = mode.includes('turbo') ? resolveTurboCount(total) : 0;
      const turboFlags = pace.filter((s) => s.turbo).length;
      const lastGap = pace[pace.length - 2]?.gapAfterMs ?? 0;
      const firstGap = pace[0]?.gapAfterMs ?? 0;
      let ok = pace.length === total && turboFlags === turboN;
      if (mode === 'normal') {
        ok = ok && pace.every((s) => !s.turbo) && pace.slice(0, -1).every((s) => s.gapAfterMs === 2000);
      }
      if (mode === 'ai_accel' || mode === 'ai_accel_turbo') {
        ok = ok && firstGap >= lastGap;
      }
      if (mode === 'normal_turbo' && total >= 10) {
        const pre = pace.filter((s) => !s.turbo);
        ok = ok && pre.slice(0, -1).every((s) => s.gapAfterMs === 2000 || s.gapAfterMs === 0);
        ok = ok && lastGap < 2000;
      }
      record(
        'pace',
        `${mode}/n=${total}`,
        ok,
        `turbo=${turboFlags}/${turboN} first=${firstGap} last=${lastGap}`
      );
    }
  }

  // One-more shares schedule: turbo lands on finale
  const combined = buildCountPaceSchedule({
    totalCounts: 13,
    baseGapMs: 2000,
    mode: 'ai_accel_turbo',
    minGapMs: 800,
  });
  record(
    'pace',
    'oneMore-shares-turbo-finale',
    combined[combined.length - 1].turbo === true,
    `last.turbo=${combined[combined.length - 1].turbo}`
  );
}

// --- D. Flow combinations --------------------------------------------------

async function caseFlowMatrix(): Promise<void> {
  const countModes = [...VOICE_COUNT_MODES] as VoiceCountMode[];
  const preps = [...VOICE_COACH_PREP_COUNTS] as Array<5 | 10>;

  // hold-only (countMode/prep/oneMore irrelevant)
  {
    installMocks();
    resetCoachState();
    const { phases } = await runFlow({
      targetReps: 5,
      oneMoreEnabled: false,
      flowMode: 'hold',
      holdDurationSec: 2,
      locale: 'ko',
    });
    const ok =
      phases.includes('hold:2') &&
      phases.includes('hold:1') &&
      phases.includes('done') &&
      spoken.some((s) => s.includes('버텨'));
    record('flow', 'hold-only', ok, phases.join('>'));
  }

  for (const flowMode of ['count', 'count_hold'] as VoiceHoldFlowMode[]) {
    for (const countMode of countModes) {
      for (const prepCount of preps) {
        for (const oneMoreEnabled of [false, true]) {
          const id = `${flowMode}/${countMode}/prep${prepCount}/oneMore=${oneMoreEnabled ? 1 : 0}`;
          installMocks();
          resetCoachState();
          const reps = 3;
          const { phases, turboReps } = await runFlow({
            targetReps: reps,
            oneMoreEnabled,
            maxOneMore: 1,
            prepCount,
            flowMode,
            holdDurationSec: 1,
            countMode,
            repGapMs: 800,
            locale: 'ko',
          });

          const cdOk = Array.from({ length: prepCount }, (_, i) => prepCount - i).every((n) =>
            phases.includes(`countdown:${n}`)
          );
          const repsOk = [1, 2, 3].every((n) => phases.includes(`counting:${n}`));
          const oneMoreOk = !oneMoreEnabled || phases.includes('oneMore:4');
          const holdOk = flowMode !== 'count_hold' || phases.some((p) => p.startsWith('hold:'));
          const doneOk = phases.includes('done') && phases.includes('start');

          // Turbo flags: modes with turbo mark the last N counts of the shared
          // schedule. oneMore bridge also emits turbo on rep===reps (duplicate
          // label) — compare unique rep numbers against the pace schedule.
          const expectTurbo = countMode.includes('turbo');
          const totalCounts = oneMoreEnabled ? reps + 1 : reps;
          const pace = buildCountPaceSchedule({
            totalCounts,
            baseGapMs: 800,
            mode: countMode,
            minGapMs: 800,
          });
          const expectedTurboReps = new Set(
            pace.map((s, i) => (s.turbo ? i + 1 : 0)).filter((n) => n > 0)
          );
          const actualTurboReps = new Set(turboReps);
          const turboOk = expectTurbo
            ? [...expectedTurboReps].every((n) => actualTurboReps.has(n)) &&
              [...actualTurboReps].every((n) => expectedTurboReps.has(n))
            : turboReps.length === 0;

          // Prep countdown clips for all numbers (esp. 6–10 spoken, not beep)
          const keys = clipKeysOnly();
          const prepClipOk = Array.from({ length: prepCount }, (_, i) => `cd-${prepCount - i}`).every(
            (k) => keys.includes(k)
          );
          const startClipOk = keys.includes('start');
          const repClipOk = ['rep-1', 'rep-2', 'rep-3'].every((k) => keys.includes(k));
          const oneMoreClipOk = !oneMoreEnabled || keys.includes('one-more');

          const ok =
            cdOk &&
            repsOk &&
            oneMoreOk &&
            holdOk &&
            doneOk &&
            turboOk &&
            prepClipOk &&
            startClipOk &&
            repClipOk &&
            oneMoreClipOk;

          record(
            'flow',
            id,
            ok,
            `cd=${cdOk} reps=${repsOk} om=${oneMoreOk} hold=${holdOk} turbo=${turboReps.join(',') || '-'} clipsOk=${prepClipOk && startClipOk}`
          );
        }
      }
    }
  }
}

// --- E. Abort / race / overlap ---------------------------------------------

async function caseAbortsAndRace(): Promise<void> {
  // Abort mid count
  {
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
      repGapMs: 800,
      locale: 'ko',
      signal: ac.signal,
      onPhaseChange: (p, d) => {
        const label =
          p === 'counting' && d?.rep != null
            ? `counting:${d.rep}`
            : p === 'countdown' && d?.countdown != null
              ? `countdown:${d.countdown}`
              : p;
        phases.push(label);
        if (p === 'counting' && d?.rep === 2) ac.abort();
      },
    });
    record(
      'abort',
      'mid-counting@2',
      phases.includes('idle') && !phases.includes('done') && !phases.includes('counting:5'),
      phases.join('>')
    );
  }

  // Abort mid one-more
  {
    installMocks();
    resetCoachState();
    const ac = new AbortController();
    const phases: string[] = [];
    await runVoiceCoachFlow({
      targetReps: 2,
      oneMoreEnabled: true,
      maxOneMore: 3,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 800,
      locale: 'ko',
      signal: ac.signal,
      onPhaseChange: (p, d) => {
        const label =
          p === 'oneMore' && d?.rep != null
            ? `oneMore:${d.rep}`
            : p === 'counting' && d?.rep != null
              ? `counting:${d.rep}`
              : p;
        phases.push(label);
        if (p === 'oneMore' && d?.rep === 3) ac.abort();
      },
    });
    record(
      'abort',
      'mid-oneMore@3',
      phases.includes('idle') && !phases.includes('done') && !phases.includes('oneMore:5'),
      phases.join('>')
    );
  }

  // Abort mid hold
  {
    installMocks();
    resetCoachState();
    const ac = new AbortController();
    const phases: string[] = [];
    await runVoiceCoachFlow({
      targetReps: 2,
      oneMoreEnabled: false,
      flowMode: 'hold',
      holdDurationSec: 5,
      locale: 'ko',
      signal: ac.signal,
      onPhaseChange: (p, d) => {
        const label = p === 'hold' && d?.countdown != null ? `hold:${d.countdown}` : p;
        phases.push(label);
        if (p === 'hold' && d?.countdown === 4) ac.abort();
      },
    });
    record(
      'abort',
      'mid-hold@4',
      phases.includes('idle') && !phases.includes('done'),
      phases.join('>')
    );
  }

  // Rest tips race
  {
    installMocks();
    resetCoachState();
    const tipsAc = new AbortController();
    const tipsPromise = speakRestTipsAndWarnings({
      warnings: ['무릎 조심'],
      tips: ['호흡'],
      locale: 'ko',
      signal: tipsAc.signal,
    });
    await new Promise((r) => setTimeout(r, 25));
    tipsAc.abort();
    stopVoiceCoachClips();
    speechManager.cancel();
    const { phases } = await runFlow({
      targetReps: 2,
      oneMoreEnabled: false,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 800,
      locale: 'ko',
    });
    await tipsPromise.catch(() => undefined);
    record(
      'race',
      'restTipsAbort→count',
      phases.includes('countdown:1') && phases.includes('counting:2') && phases.includes('done'),
      phases.filter((p) => p.startsWith('countdown') || p.startsWith('counting') || p === 'done').join('>')
    );
  }

  // Double start — second wins
  {
    installMocks();
    resetCoachState();
    const ac1 = new AbortController();
    const run1 = runVoiceCoachFlow({
      targetReps: 5,
      oneMoreEnabled: false,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 800,
      locale: 'ko',
      signal: ac1.signal,
      onPhaseChange: (p, d) => {
        if (p === 'countdown' && d?.countdown === 5) {
          ac1.abort();
          stopVoiceCoach({ keepAudioSession: true });
        }
      },
    });
    await new Promise((r) => setTimeout(r, 60));
    const { phases } = await runFlow({
      targetReps: 2,
      oneMoreEnabled: false,
      prepCount: 5,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 800,
      locale: 'ko',
    });
    await run1;
    record(
      'race',
      'double-start/second-wins',
      [5, 4, 3, 2, 1].every((n) => phases.includes(`countdown:${n}`)) &&
        phases.includes('counting:2') &&
        phases.includes('done'),
      phases.filter((p) => !p.startsWith('hold')).slice(0, 20).join('>')
    );
  }
}

// --- F. Clip play / unlock / preload ---------------------------------------

async function caseClipRuntime(): Promise<void> {
  // Prep10 must fetch cd-10…cd-1 (spoken, not beep-only for 6–10)
  {
    installMocks();
    resetCoachState();
    const { phases } = await runFlow({
      targetReps: 2,
      oneMoreEnabled: false,
      prepCount: 10,
      flowMode: 'count',
      countMode: 'normal',
      repGapMs: 800,
      locale: 'ko',
    });
    const keys = clipKeysOnly();
    const allCd = Array.from({ length: 10 }, (_, i) => `cd-${10 - i}`).every((k) => keys.includes(k));
    record(
      'clips',
      'prep10-spoken-cd10…1',
      allCd && phases.includes('countdown:10') && phases.includes('countdown:6'),
      `missing=${Array.from({ length: 10 }, (_, i) => `cd-${10 - i}`).filter((k) => !keys.includes(k)).join(',') || 'none'}`
    );
  }

  // High reps use rep clips through 30 (spot-check play)
  {
    installMocks();
    resetCoachState();
    await unlockVoiceCoachClips('female');
    const ac = new AbortController();
    const played = await playVoiceCoachClip('rep-30', ac.signal, 'female');
    record('clips', 'play/rep-30', played === true, `played=${played} keys=${clipKeysOnly().join(',')}`);
  }

  // Male pack play
  {
    installMocks();
    resetCoachState();
    const ac = new AbortController();
    const played = await playVoiceCoachClip('cd-10', ac.signal, 'male');
    record('clips', 'play/male/cd-10', played === true, `played=${played}`);
  }

  // Stop does not hang
  {
    installMocks();
    resetCoachState();
    mockSourceEndDelayMs = 2000;
    const ac = new AbortController();
    const playPromise = playVoiceCoachClip('cd-5', ac.signal);
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
    record('clips', 'stop-no-hang', result === false, `result=${String(result)}`);
  }

  // Unlock does not wait for preload
  {
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
    record('clips', 'unlock-no-preload-wait', elapsed < 400, `elapsed=${elapsed}ms`);
  }

  // Preload lists expected keys without throwing
  {
    installMocks();
    resetCoachState();
    await preloadVoiceCoachClips({
      reps: 5,
      oneMoreEnabled: true,
      prepCount: 10,
      pack: 'female',
    });
    const keys = clipKeysOnly();
    record(
      'clips',
      'preload/prep10+reps5+oneMore',
      keys.includes('cd-10') && keys.includes('rep-5') && keys.includes('one-more') && keys.includes('start'),
      keys.join(',')
    );
  }
}

// --- G. Locale -------------------------------------------------------------

async function caseLocales(): Promise<void> {
  installMocks();
  resetCoachState();
  const { phases } = await runFlow({
    targetReps: 2,
    oneMoreEnabled: true,
    maxOneMore: 1,
    prepCount: 5,
    flowMode: 'count',
    countMode: 'normal',
    repGapMs: 800,
    locale: 'en',
  });
  record(
    'locale',
    'en/ready-start-oneMore',
    phases.includes('done') &&
      spoken.some((s) => /ready/i.test(s)) &&
      spoken.some((s) => /start/i.test(s)) &&
      spoken.some((s) => /one more/i.test(s)),
    `spoken=${spoken.join('|')}`
  );

  installMocks();
  resetCoachState();
  const ko = await runFlow({
    targetReps: 2,
    oneMoreEnabled: false,
    prepCount: 5,
    flowMode: 'count',
    countMode: 'normal',
    repGapMs: 800,
    locale: 'ko',
  });
  // Korean path prefers clips; ready may be dual-beep (no TTS). Start clip must play.
  record(
    'locale',
    'ko/clips-preferred',
    ko.phases.includes('done') && clipKeysOnly().includes('start') && clipKeysOnly().includes('rep-1'),
    `clips=${clipKeysOnly().join(',')}`
  );
}

async function main(): Promise<void> {
  console.log('\n=== Voice count FULL scenario suite ===\n');
  if (!existsSync(publicRoot)) {
    console.error(`Missing clip root: ${publicRoot}`);
    process.exitCode = 1;
    return;
  }

  caseClipInventory();
  caseKeysAndClamps();
  casePaceSchedules();
  await caseFlowMatrix();
  await caseAbortsAndRace();
  await caseClipRuntime();
  await caseLocales();

  const failed = results.filter((r) => !r.ok);
  const byGroup = new Map<string, { pass: number; fail: number }>();
  for (const r of results) {
    const g = byGroup.get(r.group) ?? { pass: 0, fail: 0 };
    if (r.ok) g.pass += 1;
    else g.fail += 1;
    byGroup.set(r.group, g);
  }

  console.log('\n--- Summary by group ---');
  for (const [g, s] of byGroup) {
    console.log(`  ${g}: ${s.pass} pass / ${s.fail} fail`);
  }
  console.log(
    `\nTotal: ${results.length}  Pass: ${results.length - failed.length}  Fail: ${failed.length}`
  );
  if (failed.length) {
    for (const f of failed) console.error(`FAIL: [${f.group}] ${f.id} — ${f.detail}`);
    process.exitCode = 1;
  } else {
    console.log('All full-scenario cases passed.');
  }

  // Write machine-readable summary for artifacts
  const summaryPath = '/tmp/voice-count-full-scenarios.json';
  try {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(
      summaryPath,
      JSON.stringify(
        {
          total: results.length,
          pass: results.length - failed.length,
          fail: failed.length,
          groups: Object.fromEntries(byGroup),
          failures: failed,
          results,
        },
        null,
        2
      )
    );
    console.log(`\nWrote ${summaryPath}`);
  } catch {
    /* optional */
  }
}

void main();
