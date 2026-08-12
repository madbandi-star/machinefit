export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'note'; text: string }
  | { type: 'list'; items: string[] };

const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[가-힣A-Z])/;
const BULLET_LINE = /^[•\-*]\s+/;
const LONG_SENTENCE = 110;
const CAUTION =
  /주의|원칙적으로 불가|금지합니다|대체하지 않습니다|법령이 허용하는 범위|의료·재활 진단/;

export function isCautionSentence(text: string): boolean {
  return CAUTION.test(text);
}

export function splitSentences(text: string): string[] {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return [];
  return trimmed.split(SENTENCE_SPLIT).map((part) => part.trim()).filter(Boolean);
}

function groupSentences(text: string): GuideBlock[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  const blocks: GuideBlock[] = [];
  let index = 0;
  while (index < sentences.length) {
    const current = sentences[index];
    if (isCautionSentence(current)) {
      blocks.push({ type: 'note', text: current });
      index += 1;
      continue;
    }

    const next = sentences[index + 1];
    const currentLong = current.length >= LONG_SENTENCE;
    if (!next || isCautionSentence(next) || currentLong || next.length >= LONG_SENTENCE) {
      blocks.push({ type: 'p', text: current });
      index += 1;
      continue;
    }

    blocks.push({ type: 'p', text: `${current} ${next}` });
    index += 2;
  }
  return blocks;
}

function parseBlock(block: string): GuideBlock[] {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const bulletAt = lines.findIndex((line) => BULLET_LINE.test(line));
  if (bulletAt === -1) {
    return groupSentences(lines.join(' '));
  }

  const out: GuideBlock[] = [];
  if (bulletAt > 0) {
    out.push(...groupSentences(lines.slice(0, bulletAt).join(' ')));
  }
  out.push({
    type: 'list',
    items: lines.slice(bulletAt).map((line) => line.replace(BULLET_LINE, '').trim()),
  });
  return out;
}

/** Split guide copy into paragraphs / notes / lists without changing wording. */
export function splitGuideBlocks(text: string): GuideBlock[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  return normalized.split(/\n{2,}/).flatMap(parseBlock);
}

export function flattenGuidePlainText(blocks: GuideBlock[]): string {
  return blocks
    .map((block) => (block.type === 'list' ? block.items.join(' ') : block.text))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sourcePlainText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(BULLET_LINE, '')
    .replace(/\n[•\-*]\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
