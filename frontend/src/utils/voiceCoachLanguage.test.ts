/**
 * Voice pack language policy regression.
 *   npx vite-node src/utils/voiceCoachLanguage.test.ts
 */
import assert from 'node:assert/strict';
import {
  resolveVoiceCoachSpeechLocale,
  voiceCoachCue,
  voiceCoachSpeechLangTag,
} from './voiceCoachLanguage.js';
import { formatRepWord, speakRestTipsAndWarnings } from './voiceCoach.js';
import { holdCuePhrase, pickHoldFinish } from './voiceHold.js';
import { speechManager } from './speechManager.js';

assert.equal(resolveVoiceCoachSpeechLocale('female'), 'ko');
assert.equal(resolveVoiceCoachSpeechLocale('male'), 'en');
assert.equal(voiceCoachSpeechLangTag('ko'), 'ko-KR');
assert.equal(voiceCoachSpeechLangTag('en'), 'en-US');

assert.equal(voiceCoachCue('start', 'female'), '시작합니다.');
assert.equal(voiceCoachCue('start', 'male'), 'Start');
assert.equal(voiceCoachCue('hold', 'female'), '버텨!!!');
assert.equal(voiceCoachCue('hold', 'male'), 'Hold!');
assert.equal(voiceCoachCue('restStart', 'female'), '휴식 시작');
assert.equal(voiceCoachCue('restStart', 'male'), 'Rest');
assert.equal(voiceCoachCue('workoutComplete', 'female'), '운동 종료');
assert.equal(voiceCoachCue('workoutComplete', 'male'), 'Workout Complete');

assert.equal(holdCuePhrase('ko', 'female'), '버텨!!!');
assert.equal(holdCuePhrase('ko', 'male'), 'Hold!');
assert.equal(pickHoldFinish('ko', () => 0, 'female').phrase, '운동 종료');
assert.equal(pickHoldFinish('ko', () => 0, 'male').phrase, 'Workout Complete');

assert.equal(formatRepWord(5, 'ko', 'female'), '다섯');
assert.equal(formatRepWord(5, 'en', 'female'), '다섯'); // UI locale must not override pack
assert.equal(formatRepWord(5, 'ko', 'male'), 'five');
assert.equal(formatRepWord(1, 'en', 'male'), 'one');
assert.equal(formatRepWord(1, 'ko', 'male'), 'one');

// Rest queue language follows pack (not UI locale).
const spoken: string[] = [];
const langs: string[] = [];
const g = globalThis as typeof globalThis & {
  window: typeof globalThis;
  speechSynthesis: {
    speaking: boolean;
    pending: boolean;
    paused: boolean;
    cancel: () => void;
    resume: () => void;
    speak: (u: { text?: string; lang?: string; onend?: (() => void) | null }) => void;
    getVoices: () => SpeechSynthesisVoice[];
    addEventListener: () => void;
    removeEventListener: () => void;
  };
  SpeechSynthesisUtterance: new (text: string) => {
    text: string;
    lang: string;
    onend: (() => void) | null;
    onerror: (() => void) | null;
  };
  performance: { now: () => number };
};
g.window = g;
g.performance = { now: () => Date.now() };
g.SpeechSynthesisUtterance = class {
  text: string;
  lang = 'ko-KR';
  rate = 1;
  pitch = 1;
  volume = 1;
  voice = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
} as unknown as new (text: string) => {
  text: string;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
let current: { text?: string; lang?: string; onend?: (() => void) | null } | null = null;
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
    if (u.text?.trim()) {
      spoken.push(u.text);
      langs.push(u.lang || '');
    }
    setTimeout(() => {
      if (current !== u) return;
      this.speaking = false;
      current = null;
      u.onend?.();
    }, 4);
  },
  getVoices: () =>
    [
      { name: 'Yuna', lang: 'ko-KR', localService: true, default: true, voiceURI: 'yuna' },
      { name: 'Aaron', lang: 'en-US', localService: true, default: false, voiceURI: 'aaron' },
    ] as unknown as SpeechSynthesisVoice[],
  addEventListener() {},
  removeEventListener() {},
};

spoken.length = 0;
langs.length = 0;
await speakRestTipsAndWarnings({
  voicePack: 'female',
  tips: ['호흡을 유지하세요'],
  announceRestStart: true,
});
assert.equal(spoken[0], '휴식 시작');
assert.ok(spoken.includes('운동 팁.'));
assert.ok(langs.every((l) => l.toLowerCase().startsWith('ko')));

spoken.length = 0;
langs.length = 0;
await speakRestTipsAndWarnings({
  voicePack: 'male',
  tips: ['Keep breathing'],
  announceRestStart: true,
});
assert.equal(spoken[0], 'Rest');
assert.ok(spoken.includes('Workout tips.'));
assert.ok(langs.every((l) => l.toLowerCase().startsWith('en')));

// Abort must not throw out of speakRestTipsAndWarnings.
const ac = new AbortController();
ac.abort();
await speakRestTipsAndWarnings({
  voicePack: 'male',
  tips: ['x'],
  signal: ac.signal,
});

void speechManager;
console.log('voiceCoachLanguage.test.ts: ok');
console.log('  female rest:', '휴식 시작 / 운동 팁');
console.log('  male rest:', 'Rest / Workout tips');
