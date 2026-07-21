/**
 * App-wide TTS manager: one selected Voice, fixed prosody, single queue.
 * All speechSynthesis usage must go through this module — never call speak() directly.
 */

export const SPEECH_DEFAULTS = {
  lang: 'ko-KR',
  pitch: 1.0,
  rate: 1.0,
  volume: 1.0,
} as const;

function isKoreanVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = voice.lang.toLowerCase();
  return lang === 'ko-kr' || lang.startsWith('ko');
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

/** Pick the single best Korean voice available on this device. */
function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const korean = voices.filter(isKoreanVoice);
  const pool = korean.length > 0 ? korean : voices;
  return [...pool].sort((a, b) => scoreVoiceQuality(b) - scoreVoiceQuality(a))[0] ?? null;
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
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private queueGeneration = 0;

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

      this.selectedVoice = pickBestVoice(voices);
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
    utterance.pitch = SPEECH_DEFAULTS.pitch;
    utterance.rate = SPEECH_DEFAULTS.rate;
    utterance.volume = SPEECH_DEFAULTS.volume;
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
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

  /** Speak one phrase. Cancels any existing queue first. */
  async speak(text: string, signal?: AbortSignal): Promise<void> {
    await this.init();
    this.cancel();
    const generation = this.queueGeneration;
    await this.speakUtterance(text, generation, signal);
  }

  /** Speak a queue with the same locked Voice / prosody. */
  async speakQueue(texts: string[], options: SpeakQueueOptions = {}): Promise<void> {
    const { signal, gapMs = 120, onItemStart } = options;
    await this.init();
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
