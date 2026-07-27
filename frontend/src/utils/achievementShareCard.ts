import type { AchievementRarity } from '@machinefit/shared';

export interface AchievementShareCardLabels {
  badge: string;
  tagline: string;
  hashtags: string;
  metaRarity: string;
  metaXp: string;
  metaEarnedAt: string;
  earnedAtDate: string;
  earnedAtTime: string;
}

interface AchievementShareInput {
  emoji: string;
  name: string;
  description: string;
  rarity: string;
  rarityKey: AchievementRarity;
  xp: number;
  locale: string;
  labels: AchievementShareCardLabels;
}

const W = 720;
const POSTER_MARGIN = 28;
const CARD_INNER_PAD = 40;
const CARD_RADIUS = 32;
const VERTICAL_BIAS = 12;

const BADGE_EMOJI_SIZE = 42;
const BADGE_TEXT_SIZE = 35;
const BADGE_PILL_H = 52;

const HERO_EMOJI_SIZE = 152;
const EMOJI_GLOW_R = 160;
const GAP_BADGE_EMOJI = 6;
const GAP_EMOJI_NAME = 4;
const GAP_NAME_DESC = 4;

const META_PANEL_H = 118;
const FOOTER_H = 56;

const FONT =
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

const GREEN = '#4ade80';
const WHITE = '#f8fafc';
const GRAY = '#94a3b8';

interface RarityAccent {
  glowInner: string;
  glowMid: string;
  value: string;
}

const RARITY_ACCENT: Record<AchievementRarity, RarityAccent> = {
  common: {
    glowInner: 'rgba(148, 163, 184, 0.22)',
    glowMid: 'rgba(148, 163, 184, 0.08)',
    value: '#cbd5e1',
  },
  uncommon: {
    glowInner: 'rgba(74, 222, 128, 0.26)',
    glowMid: 'rgba(74, 222, 128, 0.1)',
    value: GREEN,
  },
  rare: {
    glowInner: 'rgba(251, 191, 36, 0.3)',
    glowMid: 'rgba(251, 191, 36, 0.1)',
    value: '#fbbf24',
  },
  epic: {
    glowInner: 'rgba(167, 139, 250, 0.32)',
    glowMid: 'rgba(167, 139, 250, 0.12)',
    value: '#a78bfa',
  },
  legendary: {
    glowInner: 'rgba(251, 191, 36, 0.34)',
    glowMid: 'rgba(249, 115, 22, 0.14)',
    value: '#fb923c',
  },
  mythic: {
    glowInner: 'rgba(244, 114, 182, 0.32)',
    glowMid: 'rgba(236, 72, 153, 0.12)',
    value: '#f472b6',
  },
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function splitLeadingEmoji(label: string): { emoji: string; text: string } {
  const trimmed = label.trim();
  const m = trimmed.match(
    /^(\p{RI}\p{RI}|\p{Extended_Pictographic}(?:\p{EMod}|\uFE0F|\u200D\p{Extended_Pictographic})*)\s*(.*)$/u
  );
  if (m) return { emoji: m[1], text: m[2] };
  return { emoji: '', text: trimmed };
}

function getWrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const chars = [...text];
  const lines: string[] = [];
  let line = '';
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function blockH(lines: string[], lh: number): number {
  return lines.length * lh;
}

function countWrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): number {
  return getWrapLines(ctx, text, maxWidth).length;
}

function wrapTextCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = getWrapLines(ctx, text, maxWidth);
  let y = startY;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const ln of lines) {
    ctx.fillText(ln, cx, y);
    y += lineHeight;
  }
  return y;
}

function drawPageBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width * 0.15, height);
  gradient.addColorStop(0, '#14081f');
  gradient.addColorStop(0.45, '#0f172a');
  gradient.addColorStop(1, '#042f2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(167, 139, 250, 0.16)';
  ctx.beginPath();
  ctx.arc(width * 0.12, height * 0.18, width * 0.259, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(74, 222, 128, 0.1)';
  ctx.beginPath();
  ctx.arc(width * 0.9, height * 0.72, width * 0.296, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.92, width * 0.222, 0, Math.PI * 2);
  ctx.fill();
}

function drawCenteredEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  cx: number,
  cy: number,
  size: number
) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = WHITE;
  const m = ctx.measureText(emoji);
  const left = m.actualBoundingBoxLeft;
  const right = m.actualBoundingBoxRight;
  const x =
    left != null && right != null
      ? cx - right / 2 + left / 2
      : cx - m.width / 2;
  ctx.fillText(emoji, x, cy);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
}

function drawEmojiGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  accent: RarityAccent
) {
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
  glow.addColorStop(0, accent.glowInner);
  glow.addColorStop(0.55, accent.glowMid);
  glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawMachineFitMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = size * 0.11;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(size * 0.35, size * 0.15);
  ctx.lineTo(size * 0.55, size * 0.55);
  ctx.lineTo(size * 0.85, 0);
  ctx.stroke();
  ctx.restore();
}

function drawPillBadge(ctx: CanvasRenderingContext2D, cx: number, centerY: number, label: string) {
  const { emoji, text } = splitLeadingEmoji(label);
  const gap = emoji && text ? 12 : 0;

  ctx.font = `${BADGE_EMOJI_SIZE}px ${FONT}`;
  const emojiW = emoji ? ctx.measureText(emoji).width : 0;
  ctx.font = `700 ${BADGE_TEXT_SIZE}px ${FONT}`;
  const textW = text ? ctx.measureText(text).width : ctx.measureText(label).width;

  const contentW = emoji ? emojiW + gap + textW : textW;
  const pw = contentW + 52;
  const ph = BADGE_PILL_H;
  const left = cx - pw / 2;

  roundRect(ctx, left, centerY - ph / 2, pw, ph, ph / 2);
  ctx.fillStyle = 'rgba(74, 222, 128, 0.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  let x = left + (pw - contentW) / 2;
  ctx.textBaseline = 'middle';

  if (emoji) {
    ctx.font = `${BADGE_EMOJI_SIZE}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = WHITE;
    ctx.fillText(emoji, x, centerY);
    x += emojiW + gap;
  }

  ctx.font = `700 ${BADGE_TEXT_SIZE}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = GREEN;
  ctx.fillText(text || label, x, centerY);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
}

function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  cx: number,
  topY: number,
  lh: number,
  color: string,
  font: string
) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  let y = topY + lh * 0.78;
  for (const ln of lines) {
    ctx.fillText(ln, cx, y);
    y += lh;
  }
}

interface LayoutMetrics {
  contentH: number;
  nameLines: string[];
  descLines: string[];
  nameBlockH: number;
  descPanelH: number;
}

function measureLayout(ctx: CanvasRenderingContext2D, input: AchievementShareInput, innerW: number): LayoutMetrics {
  ctx.font = `700 36px ${FONT}`;
  const nameLines = getWrapLines(ctx, input.name, innerW - 16);
  const nameBlockH = blockH(nameLines, 40) + 4;

  ctx.font = `400 21px ${FONT}`;
  const descLines = getWrapLines(ctx, input.description, innerW - 56);
  const descPanelH = blockH(descLines, 28) + 24;

  const badgeBlock = BADGE_PILL_H + GAP_BADGE_EMOJI;
  const emojiBlock = HERO_EMOJI_SIZE + GAP_EMOJI_NAME;
  const gapNameDesc = GAP_NAME_DESC;
  const gapDescMeta = 12;

  const contentH =
    badgeBlock +
    emojiBlock +
    nameBlockH +
    gapNameDesc +
    descPanelH +
    gapDescMeta +
    META_PANEL_H +
    12 +
    FOOTER_H;

  return { contentH, nameLines, descLines, nameBlockH, descPanelH };
}

function drawDescPanel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  w: number,
  h: number,
  lines: string[]
) {
  const x = cx - w / 2;
  roundRect(ctx, x, topY, w, h, 16);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(196, 181, 253, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const textBlockH = blockH(lines, 28);
  const textTop = topY + (h - textBlockH) / 2 + 20;
  drawCenteredLines(ctx, lines, cx, textTop - 20, 28, '#e5e7eb', `400 21px ${FONT}`);
}

function measureEarnedColH(hasEarnedAt: boolean): number {
  const labelLH = 22;
  const labelValueGap = 8;
  const valueLH = 22;
  const blankLine = 10;
  if (!hasEarnedAt) return labelLH + labelValueGap + valueLH;
  return labelLH + labelValueGap + valueLH + blankLine + valueLH;
}

function drawMetaPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colLabels: [string, string, string],
  colValues: [string, string, string],
  valueColors: [string, string, string],
  earnedAtDate: string,
  earnedAtTime: string
) {
  roundRect(ctx, x, y, w, h, 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const colW = w / 3;
  const padX = 10;
  const labelLH = 22;
  const valueLH = 28;
  const earnedValueLH = 22;
  const labelValueGap = 8;
  const earnedBlankLine = 10;
  const maxColWidth = colW - padX * 2;

  const colHeights = colValues.map((value, i) => {
    if (i === 2 && earnedAtDate && earnedAtTime) {
      return measureEarnedColH(true);
    }
    ctx.font = `700 20px ${FONT}`;
    const valueLines = countWrapLines(ctx, value, maxColWidth);
    return labelLH + labelValueGap + valueLines * valueLH;
  });
  const contentH = Math.max(...colHeights);
  const contentTop = y + (h - contentH) / 2;
  const dividerTop = contentTop - 8;
  const dividerBottom = contentTop + contentH + 8;

  for (let i = 0; i < 3; i += 1) {
    const colX = x + colW * i + colW / 2;
    const colTop = contentTop + (contentH - colHeights[i]) / 2;

    if (i > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.beginPath();
      ctx.moveTo(x + colW * i, dividerTop);
      ctx.lineTo(x + colW * i, dividerBottom);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.font = `400 18px ${FONT}`;
    ctx.fillStyle = '#9ca3af';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(colLabels[i], colX, colTop + labelLH * 0.82);

    if (i === 2 && earnedAtDate && earnedAtTime) {
      const dateY = colTop + labelLH + labelValueGap + earnedValueLH * 0.78;
      ctx.font = `700 18px ${FONT}`;
      ctx.fillStyle = valueColors[i];
      ctx.fillText(earnedAtDate, colX, dateY);
      ctx.fillText(earnedAtTime, colX, dateY + earnedValueLH + earnedBlankLine);
    } else {
      ctx.font = `700 20px ${FONT}`;
      ctx.fillStyle = valueColors[i];
      wrapTextCentered(
        ctx,
        colValues[i],
        colX,
        colTop + labelLH + labelValueGap + valueLH * 0.78,
        maxColWidth,
        valueLH
      );
    }
  }
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  left: number,
  topY: number,
  width: number,
  height: number,
  labels: AchievementShareCardLabels
) {
  const right = left + width;
  const midY = topY + height / 2;
  const markSize = 28;
  const logoRowY = midY - 4;

  drawMachineFitMark(ctx, left, logoRowY - markSize + 4, markSize);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 22px ${FONT}`;
  ctx.fillStyle = WHITE;
  const brandX = left + markSize + 10;
  ctx.fillText('Machine', brandX, logoRowY);
  ctx.font = `800 22px ${FONT}`;
  ctx.fillStyle = GREEN;
  const machineW = ctx.measureText('Machine').width;
  ctx.fillText('Fit', brandX + machineW, logoRowY);

  ctx.font = `400 20px ${FONT}`;
  ctx.fillStyle = GRAY;
  ctx.fillText(labels.tagline, left, logoRowY + 28);

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `600 22px ${FONT}`;
  ctx.fillStyle = GREEN;
  const tags = labels.hashtags.split(/\s+/).filter(Boolean);
  const tagStartY = midY - ((tags.length - 1) * 26) / 2;
  tags.forEach((tag, i) => {
    ctx.fillText(tag, right, tagStartY + i * 26);
  });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
}

function drawPosterContent(
  ctx: CanvasRenderingContext2D,
  input: AchievementShareInput,
  posterX: number,
  posterY: number,
  posterW: number,
  posterH: number,
  metrics: LayoutMetrics
) {
  const cx = posterX + posterW / 2;
  const innerW = posterW - CARD_INNER_PAD * 2;
  const innerLeft = posterX + CARD_INNER_PAD;
  const accent = RARITY_ACCENT[input.rarityKey] ?? RARITY_ACCENT.rare;
  const xpLabel = `+${input.xp.toLocaleString(input.locale.startsWith('ko') ? 'ko-KR' : 'en-US')}`;

  let y = posterY + Math.max(12, (posterH - metrics.contentH) / 2 + VERTICAL_BIAS);

  drawPillBadge(ctx, cx, y + BADGE_PILL_H / 2, input.labels.badge);
  y += BADGE_PILL_H + GAP_BADGE_EMOJI;

  const emojiCy = y + HERO_EMOJI_SIZE / 2;
  drawEmojiGlow(ctx, cx, emojiCy, EMOJI_GLOW_R, accent);
  drawCenteredEmoji(ctx, input.emoji, cx, emojiCy, HERO_EMOJI_SIZE);
  y += HERO_EMOJI_SIZE + GAP_EMOJI_NAME;

  drawCenteredLines(ctx, metrics.nameLines, cx, y, 40, WHITE, `700 36px ${FONT}`);
  y += metrics.nameBlockH + GAP_NAME_DESC;

  drawDescPanel(ctx, cx, y, innerW, metrics.descPanelH, metrics.descLines);
  y += metrics.descPanelH + 12;

  drawMetaPanel(
    ctx,
    innerLeft,
    y,
    innerW,
    META_PANEL_H,
    [input.labels.metaRarity, input.labels.metaXp, input.labels.metaEarnedAt],
    [input.rarity, xpLabel, ''],
    [accent.value, GREEN, WHITE],
    input.labels.earnedAtDate,
    input.labels.earnedAtTime
  );
  y += META_PANEL_H + 12;

  drawFooter(ctx, innerLeft, y, innerW, FOOTER_H, input.labels);
}

/** Compact achievement share card (720×900 — matches lifted weight card). */
export async function buildAchievementShareCard(input: AchievementShareInput): Promise<Blob> {
  const height = 900;
  const posterW = W - POSTER_MARGIN * 2;
  const innerW = posterW - CARD_INNER_PAD * 2;
  const posterH = height - POSTER_MARGIN * 2;
  const posterY = POSTER_MARGIN;

  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = W;
  measureCanvas.height = 1;
  const mctx = measureCanvas.getContext('2d');
  if (!mctx) throw new Error('Canvas unavailable');
  const metrics = measureLayout(mctx, input, innerW);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  drawPageBackground(ctx, W, height);

  roundRect(ctx, POSTER_MARGIN, posterY, posterW, posterH, CARD_RADIUS);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.74)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  drawPosterContent(ctx, input, POSTER_MARGIN, posterY, posterW, posterH, metrics);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export share card'));
    }, 'image/png');
  });
}
