/**
 * App-wide TTS manager: one selected Voice, fixed prosody, single queue.
 * All speechSynthesis usage must go through this module — never call speak() directly.
 */

import { nudgeVoiceCoachSpeech } from '@/utils/voiceCoachAudioSession';

export const SPEECH_DEFAULTS = {
  lang: 'ko-KR',
  pitch: 1.0,
  rate: 1.0,
  volume: 1.0,
} as const;

export interface SpeakOptions {
  signal?: AbortSignal;
  /** BCP-47 language for this utterance (e.g. ko-KR, en-US). */
  lang?: string;
  /** Override utterance rate (SpeechSynthesis default band ~0.1–10). */
  rate?: number;
  /**
   * Prefer a male system voice for this utterance only
   * (does not replace the app-wide locked default voice).
   */
  preferMaleVoice?: boolean;
  /** Prefer a female system voice for this utterance only. */
  preferFemaleVoice?: boolean;
  /** Silence after the utterance ends (ms). Abort-aware. */
  trailingPauseMs?: number;
}

function isKoreanVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = voice.lang.toLowerCase();
  return lang === 'ko-kr' || lang.startsWith('ko');
}

/** Known male Korean system / neural voices (InJoon, Jinho, …). */
function isLikelyKoreanMaleVoice(voice: SpeechSynthesisVoice): boolean {
  const hay = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  return /jinho|injoon|minsu|hyunsu|siwoo|wansung|bongjin|gwanwoo|guy|male|남성|남자|기호|민수|인준|시우|완석|standard-b|standard-d|ko-kr-x-frm|_ko_kr_m/.test(
    hay
  );
}

function isLikelyKoreanFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const hay = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  return /yuna|sunhi|sora|yena|heami|nara|female|여성|여자|유나|선희|소라|예나|standard-a|standard-c|ko-kr-x-frc|_ko_kr_f/.test(
    hay
  );
}

/** Prefer a male ko-KR voice; null when none match. */
export function pickMaleKoreanVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const korean = voices.filter(isKoreanVoice);
  const males = korean.filter(isLikelyKoreanMaleVoice);
  if (males.length === 0) return null;
  return (
    [...males].sort(
      (a, b) =>
        scoreVoiceQuality(b, { preferGender: 'male', langPrefix: 'ko-KR' }) -
        scoreVoiceQuality(a, { preferGender: 'male', langPrefix: 'ko-KR' })
    )[0] ?? null
  );
}

function scoreVoiceQuality(
  voice: SpeechSynthesisVoice,
  options?: { preferGender?: 'male' | 'female'; langPrefix?: string }
): number {
  const name = voice.name;
  const lang = voice.lang.toLowerCase();
  const preferGender = options?.preferGender;
  const langPrefix = options?.langPrefix?.toLowerCase();
  let score = 0;

  if (langPrefix) {
    if (lang === langPrefix) score += 1200;
    else if (lang.startsWith(langPrefix.split('-')[0] ?? langPrefix)) score += 900;
    else score -= 600;
  } else {
    if (lang === 'ko-kr') score += 1000;
    else if (lang.startsWith('ko')) score += 800;
    else score -= 500;
  }

  if (/google/i.test(name)) score += 120;
  if (/microsoft/i.test(name)) score += 110;
  if (/premium/i.test(name)) score += 100;
  if (/enhanced/i.test(name)) score += 90;
  if (/natural/i.test(name)) score += 80;
  if (/samsung/i.test(name)) score += 70;
  if (/neural|wavenet|studio/i.test(name)) score += 60;
  if (voice.localService) score += 20;
  if (voice.default) score += 10;

  const looksMale =
    /male|남|jinho|injoon|minsu|hyunsu|siwoo|wansung|bongjin|gwanwoo|guy|christopher|daniel|기호|민수|인준|시우|완석|standard-b|standard-d|ko-kr-x-frm|_ko_kr_m/i.test(
      name
    );
  const looksFemale =
    /female|여|yuna|sunhi|sora|yena|heami|nara|samantha|karen|moira|유나|선희|소라|예나|standard-a|standard-c|ko-kr-x-frc|_ko_kr_f/i.test(
      name
    );
  if (preferGender === 'male') {
    if (looksMale) score += 200;
    if (looksFemale) score -= 250;
  } else if (preferGender === 'female') {
    if (looksFemale) score += 200;
    if (looksMale) score -= 250;
  }

  return score;
}

/** Pick the best matching voice for optional language / gender preferences. */
function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  options?: { preferGender?: 'male' | 'female'; langPrefix?: string }
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const langPrefix = options?.langPrefix?.toLowerCase();
  const langRoot = langPrefix?.split('-')[0];
  let pool = voices;
  if (langRoot) {
    const matched = voices.filter((v) => v.lang.toLowerCase().startsWith(langRoot));
    if (matched.length > 0) pool = matched;
    else if (!langRoot.startsWith('ko')) {
      // Keep full pool for English if no en voice is installed.
      pool = voices;
    } else {
      pool = voices.filter(isKoreanVoice);
      if (pool.length === 0) pool = voices;
    }
  } else {
    const korean = voices.filter(isKoreanVoice);
    pool = korean.length > 0 ? korean : voices;
  }
  return (
    [...pool].sort(
      (a, b) => scoreVoiceQuality(b, options) - scoreVoiceQuality(a, options)
    )[0] ?? null
  );
}

function waitForVoices(timeoutMs = 2500): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }

  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
      resolve(window.speechSynthesis.getVoices());
    };
    const onVoices = () => finish();
    window.speechSynthesis.addEventListener('voiceschanged', onVoices);
    window.setTimeout(finish, timeoutMs);
  });
}

export interface SpeakQueueOptions {
  signal?: AbortSignal;
  /** Pause between queue items (ms). Default 120. */
  gapMs?: number;
  /**
   * Optional per-item gap after index `i` (before i+1).
   * When set, overrides `gapMs` for that step. Return 0 to skip pause.
   */
  getGapMs?: (index: number, total: number) => number;
  onItemStart?: (index: number, text: string) => void;
  lang?: string;
  preferMaleVoice?: boolean;
  preferFemaleVoice?: boolean;
  rate?: number;
}

class SpeechManagerImpl {
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private queueGeneration = 0;
  /** Count of in-flight audible (volume>0) utterances we started. */
  private audibleInFlight = 0;

  /** Load voices once and lock a single Voice for the app lifetime. */
  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      let voices = await waitForVoices();
      if (voices.length === 0) {
        await new Promise((r) => window.setTimeout(r, 400));
        voices = window.speechSynthesis?.getVoices?.() ?? [];
      }

      this.selectedVoice = pickBestVoice(voices, { langPrefix: 'ko-KR' });
      this.initialized = true;
    })();

    await this.initPromise;
  }

  getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  getSelectedVoiceName(): string | null {
    return this.selectedVoice?.name ?? null;
  }

  /** Cancel any in-flight utterance / queue (user Stop / hard reset). */
  cancel(): void {
    this.queueGeneration += 1;
    this.audibleInFlight = 0;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Start a new speak generation.
   * Only hard-cancel when an audible phrase is in flight. Canceling the silent
   * unlock utterance (or canceling while idle) undoes mobile TTS permission and
   * silences Hold ("버텨") / rest tips on iOS/WebView.
   */
  private beginSpeakGeneration(): number {
    this.queueGeneration += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      if (this.audibleInFlight > 0 && (synth.speaking || synth.pending)) {
        synth.cancel();
        this.audibleInFlight = 0;
      } else {
        try {
          synth.resume();
        } catch {
          // ignore
        }
      }
    }
    return this.queueGeneration;
  }

  /**
   * Unlock TTS inside a user-gesture turn (mobile).
   * Silent utterance — must not be canceled by the next speak().
   */
  unlock(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
      const utterance = this.createUtterance('\u200B');
      utterance.volume = 0;
      utterance.rate = 2;
      // Not tracked as audible — beginSpeakGeneration must not cancel this.
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }

  private createUtterance(
    text: string,
    prosody?: {
      rate?: number;
      lang?: string;
      preferMaleVoice?: boolean;
      preferFemaleVoice?: boolean;
    }
  ): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = prosody?.lang?.trim() || SPEECH_DEFAULTS.lang;
    utterance.lang = lang;
    utterance.pitch = SPEECH_DEFAULTS.pitch;
    const rate = prosody?.rate;
    utterance.rate =
      typeof rate === 'number' && Number.isFinite(rate)
        ? Math.min(2, Math.max(0.1, rate))
        : SPEECH_DEFAULTS.rate;
    utterance.volume = SPEECH_DEFAULTS.volume;

    let voice: SpeechSynthesisVoice | null = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const allVoices = window.speechSynthesis.getVoices() ?? [];
      const preferGender = prosody?.preferMaleVoice
        ? 'male'
        : prosody?.preferFemaleVoice
          ? 'female'
          : undefined;
      const langRoot = lang.toLowerCase().split('-')[0] ?? '';
      if (preferGender === 'male' && langRoot === 'ko') {
        voice = pickMaleKoreanVoice(allVoices);
        if (!voice) {
          const nonFemale = allVoices
            .filter(isKoreanVoice)
            .filter((v) => !isLikelyKoreanFemaleVoice(v));
          voice =
            nonFemale.length > 0
              ? pickBestVoice(nonFemale, { preferGender: 'male', langPrefix: lang })
              : null;
        }
      } else if (preferGender || prosody?.lang) {
        const picked = pickBestVoice(allVoices, {
          preferGender,
          langPrefix: lang,
        });
        if (picked) voice = picked;
      } else {
        voice = this.selectedVoice;
      }
    } else {
      voice = this.selectedVoice;
    }
    // Never attach a mismatched voice (e.g. locked Korean Yuna/InJoon on en-US).
    // That made male-pack English fallbacks sound like Korean counts on some devices.
    if (voice) {
      const langRoot = lang.toLowerCase().split('-')[0] ?? '';
      const voiceRoot = voice.lang.toLowerCase().split('-')[0] ?? '';
      if (langRoot && voiceRoot && langRoot !== voiceRoot) {
        voice = null;
      }
    }
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = lang;
    return utterance;
  }

  private speakUtterance(
    text: string,
    generation: number,
    signal?: AbortSignal,
    attempt = 0,
    prosody?: {
      rate?: number;
      lang?: string;
      preferMaleVoice?: boolean;
      preferFemaleVoice?: boolean;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      const trimmed = text.trim();
      if (!trimmed) {
        resolve();
        return;
      }

      nudgeVoiceCoachSpeech();
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }

      const utterance = this.createUtterance(trimmed, prosody);
      const maxMs = Math.min(20_000, Math.max(2_000, trimmed.length * 180 + 1_200));
      let timeoutId = 0;
      let settled = false;
      let countedAudible = false;

      const finish = (error?: DOMException) => {
        if (settled) return;
        settled = true;
        if (countedAudible) {
          this.audibleInFlight = Math.max(0, this.audibleInFlight - 1);
          countedAudible = false;
        }
        if (timeoutId) window.clearTimeout(timeoutId);
        signal?.removeEventListener('abort', onAbort);
        utterance.onend = null;
        utterance.onerror = null;
        if (error) reject(error);
        else resolve();
      };

      const onAbort = () => {
        window.speechSynthesis.cancel();
        this.audibleInFlight = 0;
        finish(new DOMException('Aborted', 'AbortError'));
      };

      utterance.onend = () => finish();
      utterance.onerror = (event) => {
        const errName = String(
          (event as SpeechSynthesisErrorEvent).error || ''
        ).toLowerCase();
        // Background / audio-focus interruptions — retry a few times.
        if (
          (errName === 'interrupted' || errName === 'audio-busy' || errName === 'network') &&
          attempt < 4 &&
          generation === this.queueGeneration &&
          !signal?.aborted
        ) {
          settled = true;
          if (countedAudible) {
            this.audibleInFlight = Math.max(0, this.audibleInFlight - 1);
            countedAudible = false;
          }
          if (timeoutId) window.clearTimeout(timeoutId);
          signal?.removeEventListener('abort', onAbort);
          utterance.onend = null;
          utterance.onerror = null;
          window.setTimeout(() => {
            nudgeVoiceCoachSpeech();
            this.speakUtterance(trimmed, generation, signal, attempt + 1, prosody).then(
              resolve,
              reject
            );
          }, 180 + attempt * 120);
          return;
        }
        // Superseded by cancel()/newer speak — finish quietly.
        // User stop must go through signal.abort → onAbort → AbortError.
        // Treating "canceled" as AbortError previously killed set-count when
        // rest-tip teardown raced a freshly started coach session.
        if (errName === 'canceled' || generation !== this.queueGeneration) {
          finish();
          return;
        }
        finish();
      };
      timeoutId = window.setTimeout(() => finish(), maxMs);
      signal?.addEventListener('abort', onAbort, { once: true });

      if (generation !== this.queueGeneration) {
        finish(new DOMException('Aborted', 'AbortError'));
        return;
      }

      this.audibleInFlight += 1;
      countedAudible = true;
      window.speechSynthesis.speak(utterance);
    });
  }

  private async trailingPause(
    ms: number,
    generation: number,
    signal?: AbortSignal
  ): Promise<void> {
    const waitMs = Math.max(0, Math.round(ms));
    if (waitMs <= 0) return;
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted || generation !== this.queueGeneration) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      const timer = window.setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, waitMs);
      const onAbort = () => {
        window.clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  private normalizeSpeakArgs(
    signalOrOptions?: AbortSignal | SpeakOptions
  ): SpeakOptions {
    if (!signalOrOptions) return {};
    if (typeof AbortSignal !== 'undefined' && signalOrOptions instanceof AbortSignal) {
      return { signal: signalOrOptions };
    }
    return signalOrOptions as SpeakOptions;
  }

  /** Speak one phrase. Replaces an active utterance only when needed. */
  async speak(text: string, signalOrOptions?: AbortSignal | SpeakOptions): Promise<void> {
    const options = this.normalizeSpeakArgs(signalOrOptions);
    await this.init();
    const generation = this.beginSpeakGeneration();
    await this.speakUtterance(text, generation, options.signal, 0, {
      rate: options.rate,
      lang: options.lang,
      preferMaleVoice: options.preferMaleVoice,
      preferFemaleVoice: options.preferFemaleVoice,
    });
    if (options.trailingPauseMs && options.trailingPauseMs > 0) {
      if (generation !== this.queueGeneration) return;
      await this.trailingPause(options.trailingPauseMs, generation, options.signal);
    }
  }

  /**
   * Speak a sequence as one generation (no cancel between items).
   * Used for iOS male count clarity tests / multi-digit pacing.
   */
  async speakSequentialCounts(
    texts: string[],
    options: SpeakOptions & { gapMs?: number } = {}
  ): Promise<void> {
    const {
      signal,
      gapMs = 100,
      rate,
      lang,
      preferMaleVoice,
      preferFemaleVoice,
      trailingPauseMs,
    } = options;
    await this.init();
    const generation = this.beginSpeakGeneration();
    const items = texts.map((t) => t.trim()).filter(Boolean);
    for (let i = 0; i < items.length; i += 1) {
      if (signal?.aborted || generation !== this.queueGeneration) {
        throw new DOMException('Aborted', 'AbortError');
      }
      await this.speakUtterance(items[i], generation, signal, 0, {
        rate,
        lang,
        preferMaleVoice,
        preferFemaleVoice,
      });
      const pause = trailingPauseMs ?? gapMs;
      if (i < items.length - 1 && pause > 0) {
        await this.trailingPause(pause, generation, signal);
      }
    }
  }

  /** Speak a queue with the same locked Voice / prosody. */
  async speakQueue(texts: string[], options: SpeakQueueOptions = {}): Promise<void> {
    const {
      signal,
      gapMs = 120,
      getGapMs,
      onItemStart,
      lang,
      preferMaleVoice,
      preferFemaleVoice,
      rate,
    } = options;
    await this.init();
    const generation = this.beginSpeakGeneration();
    const prosody = { lang, preferMaleVoice, preferFemaleVoice, rate };

    const items = texts.map((t) => t.trim()).filter(Boolean);
    for (let i = 0; i < items.length; i += 1) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      if (generation !== this.queueGeneration) {
        throw new DOMException('Aborted', 'AbortError');
      }

      onItemStart?.(i, items[i]);
      await this.speakUtterance(items[i], generation, signal, 0, prosody);

      if (i < items.length - 1) {
        const waitMs = Math.max(
          0,
          Math.round(getGapMs ? getGapMs(i, items.length) : gapMs)
        );
        if (waitMs <= 0) continue;
        await new Promise<void>((resolve, reject) => {
          if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          const timer = window.setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            nudgeVoiceCoachSpeech();
            resolve();
          }, waitMs);
          const onAbort = () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          };
          signal?.addEventListener('abort', onAbort, { once: true });
        });
      }
    }
  }
}

/** Singleton — the only allowed path to speechSynthesis.speak. */
export const speechManager = new SpeechManagerImpl();
