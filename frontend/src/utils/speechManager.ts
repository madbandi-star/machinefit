/**
 * App-wide TTS manager: one selected Voice, fixed prosody, single queue.
 * All speechSynthesis usage must go through this module — never call speak() directly.
 */

export type SpeechGender = 'male' | 'female';

export const SPEECH_DEFAULTS = {
  lang: 'ko-KR',
  pitch: 1.0,
  rate: 1.0,
  volume: 1.0,
} as const;

/** Pitch nudges only when male/female resolve to the same OS voice. */
const SAME_VOICE_PITCH: Record<SpeechGender, number> = {
  male: 0.82,
  female: 1.18,
};

/**
 * Explicit Korean male voice names / patterns.
 * Google ko-KR: A/B ≈ female, C/D ≈ male.
 */
const MALE_NAME_HINTS = [
  /male/i,
  /남성/i,
  /\bman\b/i,
  /injoon/i,
  /in-joon/i,
  /hyunsu/i,
  /hyun-su/i,
  /jinho/i,
  /minsu/i,
  /yunsang/i,
  /bongjin/i,
  /gookhwa/i,
  /standard-c/i,
  /standard-d/i,
  /wavenet-c/i,
  /wavenet-d/i,
  /neural2-c/i,
  /neural2-d/i,
  /\(c\)/i,
  /\(d\)/i,
  /#c\b/i,
  /#d\b/i,
  /ko-kr-.*[-_]c\b/i,
  /ko-kr-.*[-_]d\b/i,
];

const FEMALE_NAME_HINTS = [
  /female/i,
  /여성/i,
  /\bwoman\b/i,
  /sunhi/i,
  /sun-hi/i,
  /yuna/i,
  /sora/i,
  /heami/i,
  /sumi/i,
  /jihyun/i,
  /standard-a/i,
  /standard-b/i,
  /wavenet-a/i,
  /wavenet-b/i,
  /neural2-b/i,
  /\(a\)/i,
  /\(b\)/i,
  /#a\b/i,
  /#b\b/i,
  /ko-kr-.*[-_]a\b/i,
  /ko-kr-.*[-_]b\b/i,
];

function isKoreanVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = voice.lang.toLowerCase();
  return lang === 'ko-kr' || lang.startsWith('ko');
}

function hasGenderHint(voice: SpeechSynthesisVoice, gender: SpeechGender): boolean {
  const name = `${voice.name} ${voice.voiceURI}`;
  const hints = gender === 'male' ? MALE_NAME_HINTS : FEMALE_NAME_HINTS;
  return hints.some((hint) => hint.test(name));
}

function scoreVoiceQuality(voice: SpeechSynthesisVoice): number {
  const name = voice.name;
  const lang = voice.lang.toLowerCase();
  let score = 0;

  if (lang === 'ko-kr') score += 1000;
  else if (lang.startsWith('ko')) score += 800;
  else score -= 500;

  if (/google/i.test(name)) score += 120;
  if (/microsoft/i.test(name)) score += 110;
  if (/premium/i.test(name)) score += 100;
  if (/enhanced/i.test(name)) score += 90;
  if (/natural/i.test(name)) score += 80;
  if (/samsung/i.test(name)) score += 70;
  if (/neural|wavenet|studio/i.test(name)) score += 60;
  if (voice.localService) score += 20;
  if (voice.default) score += 10;

  return score;
}

function voiceKey(voice: SpeechSynthesisVoice): string {
  return `${voice.voiceURI}::${voice.name}::${voice.lang}`;
}

function sortByQuality(a: SpeechSynthesisVoice, b: SpeechSynthesisVoice): number {
  return scoreVoiceQuality(b) - scoreVoiceQuality(a);
}

/**
 * Prefer explicitly gendered Korean voices. Never pick an opposite-gender
 * named voice when a same-gender or neutral option exists.
 */
function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  gender: SpeechGender,
  avoidKey?: string | null
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const opposite: SpeechGender = gender === 'male' ? 'female' : 'male';
  const korean = voices.filter(isKoreanVoice);
  const pool = korean.length > 0 ? korean : voices;

  const matched = pool.filter((v) => hasGenderHint(v, gender)).sort(sortByQuality);
  if (matched.length > 0) {
    const preferred = avoidKey
      ? matched.find((v) => voiceKey(v) !== avoidKey) ?? matched[0]
      : matched[0];
    return preferred;
  }

  // No explicit gender label — prefer voices not labeled as the opposite gender.
  const neutral = pool
    .filter((v) => !hasGenderHint(v, opposite))
    .sort(sortByQuality);
  if (neutral.length > 0) {
    const preferred = avoidKey
      ? neutral.find((v) => voiceKey(v) !== avoidKey) ?? neutral[0]
      : neutral[0];
    return preferred;
  }

  const fallback = [...pool].sort(sortByQuality);
  if (avoidKey) {
    return fallback.find((v) => voiceKey(v) !== avoidKey) ?? fallback[0] ?? null;
  }
  return fallback[0] ?? null;
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
  onItemStart?: (index: number, text: string) => void;
}

class SpeechManagerImpl {
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private maleVoice: SpeechSynthesisVoice | null = null;
  private femaleVoice: SpeechSynthesisVoice | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private gender: SpeechGender = 'male';
  /** True when male/female share one OS voice — pitch differentiates. */
  private usePitchFallback = false;
  private queueGeneration = 0;

  /** Load voices once and lock male/female selections for the app lifetime. */
  async init(preferredGender: SpeechGender = 'male'): Promise<void> {
    if (this.initialized) {
      this.setGender(preferredGender);
      return;
    }
    if (this.initPromise) {
      await this.initPromise;
      this.setGender(preferredGender);
      return;
    }

    this.initPromise = (async () => {
      // Chrome often populates voices asynchronously — try twice.
      let voices = await waitForVoices();
      if (voices.length === 0) {
        await new Promise((r) => window.setTimeout(r, 400));
        voices = window.speechSynthesis?.getVoices?.() ?? [];
      }

      this.femaleVoice = pickBestVoice(voices, 'female');
      const femaleKey = this.femaleVoice ? voiceKey(this.femaleVoice) : null;
      this.maleVoice = pickBestVoice(voices, 'male', femaleKey);

      // If still identical, try forcing male to any other Korean voice.
      if (
        this.maleVoice &&
        this.femaleVoice &&
        voiceKey(this.maleVoice) === voiceKey(this.femaleVoice)
      ) {
        const korean = voices.filter(isKoreanVoice);
        const other = korean.find((v) => voiceKey(v) !== femaleKey) ?? null;
        if (other) {
          this.maleVoice = other;
        }
      }

      this.usePitchFallback = Boolean(
        this.maleVoice &&
          this.femaleVoice &&
          voiceKey(this.maleVoice) === voiceKey(this.femaleVoice)
      );

      this.gender = preferredGender;
      this.selectedVoice =
        preferredGender === 'female'
          ? this.femaleVoice ?? this.maleVoice
          : this.maleVoice ?? this.femaleVoice;
      this.initialized = true;

      console.log('Selected Voice :', this.selectedVoice?.name ?? '(none)');
      console.log('Male Voice mapping :', this.maleVoice?.name ?? '(none)');
      console.log('Female Voice mapping :', this.femaleVoice?.name ?? '(none)');
      console.log(
        'Pitch fallback (same OS voice) :',
        this.usePitchFallback,
        this.usePitchFallback ? SAME_VOICE_PITCH : SPEECH_DEFAULTS.pitch
      );
      console.log(
        'Available Korean voices :',
        voices.filter(isKoreanVoice).map((v) => v.name)
      );
    })();

    await this.initPromise;
  }

  /** Switch to the pre-selected male/female voice — never re-runs getVoices scoring. */
  setGender(gender: SpeechGender): void {
    this.gender = gender === 'female' ? 'female' : 'male';
    this.selectedVoice =
      this.gender === 'female'
        ? this.femaleVoice ?? this.maleVoice
        : this.maleVoice ?? this.femaleVoice;
    console.log(
      'Active coach gender :',
      this.gender,
      '| Voice :',
      this.selectedVoice?.name ?? '(none)',
      '| pitch :',
      this.effectivePitch()
    );
  }

  getGender(): SpeechGender {
    return this.gender;
  }

  getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  getSelectedVoiceName(): string | null {
    return this.selectedVoice?.name ?? null;
  }

  getVoiceMapping(): { male: string | null; female: string | null; selected: string | null } {
    return {
      male: this.maleVoice?.name ?? null,
      female: this.femaleVoice?.name ?? null,
      selected: this.selectedVoice?.name ?? null,
    };
  }

  private effectivePitch(): number {
    if (this.usePitchFallback) return SAME_VOICE_PITCH[this.gender];
    return SPEECH_DEFAULTS.pitch;
  }

  /** Cancel any in-flight utterance / queue. */
  cancel(): void {
    this.queueGeneration += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Unlock TTS inside a user-gesture turn (mobile).
   * Does not cancel afterwards — cancel would undo unlock on some WebViews.
   */
  unlock(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const utterance = this.createUtterance('\u200B');
      utterance.volume = 0;
      utterance.rate = 2;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }

  private createUtterance(text: string): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_DEFAULTS.lang;
    utterance.pitch = this.effectivePitch();
    utterance.rate = SPEECH_DEFAULTS.rate;
    utterance.volume = SPEECH_DEFAULTS.volume;
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
      // Keep lang fixed to ko-KR; some engines ignore voice if lang mismatches.
      utterance.lang = SPEECH_DEFAULTS.lang;
    }
    return utterance;
  }

  private speakUtterance(
    text: string,
    generation: number,
    signal?: AbortSignal
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

      const utterance = this.createUtterance(trimmed);
      const maxMs = Math.min(20_000, Math.max(2_000, trimmed.length * 180 + 1_200));
      let timeoutId = 0;
      let settled = false;

      const finish = (error?: DOMException) => {
        if (settled) return;
        settled = true;
        if (timeoutId) window.clearTimeout(timeoutId);
        signal?.removeEventListener('abort', onAbort);
        utterance.onend = null;
        utterance.onerror = null;
        if (error) reject(error);
        else resolve();
      };

      const onAbort = () => {
        window.speechSynthesis.cancel();
        finish(new DOMException('Aborted', 'AbortError'));
      };

      utterance.onend = () => finish();
      utterance.onerror = () => finish();
      timeoutId = window.setTimeout(() => finish(), maxMs);
      signal?.addEventListener('abort', onAbort, { once: true });

      if (generation !== this.queueGeneration) {
        finish(new DOMException('Aborted', 'AbortError'));
        return;
      }

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Speak one phrase. Cancels any existing queue first (no overlapping speech).
   */
  async speak(text: string, signal?: AbortSignal): Promise<void> {
    await this.init(this.gender);
    this.cancel();
    const generation = this.queueGeneration;
    await this.speakUtterance(text, generation, signal);
  }

  /**
   * Speak a queue with the same locked Voice / prosody.
   * Cancels any existing queue first, then plays items in order.
   */
  async speakQueue(texts: string[], options: SpeakQueueOptions = {}): Promise<void> {
    const { signal, gapMs = 120, onItemStart } = options;
    await this.init(this.gender);
    this.cancel();
    const generation = this.queueGeneration;

    const items = texts.map((t) => t.trim()).filter(Boolean);
    for (let i = 0; i < items.length; i += 1) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      if (generation !== this.queueGeneration) {
        throw new DOMException('Aborted', 'AbortError');
      }

      onItemStart?.(i, items[i]);
      await this.speakUtterance(items[i], generation, signal);

      if (i < items.length - 1 && gapMs > 0) {
        await new Promise<void>((resolve, reject) => {
          if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          const timer = window.setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
          }, gapMs);
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
