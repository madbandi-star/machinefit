export interface AchievementShareCardLabels {
  badge: string;
  earnedAt: string;
  tagline: string;
  hashtags: string;
}

interface AchievementShareInput {
  emoji: string;
  name: string;
  description: string;
  rarity: string;
  xp: number;
  locale: string;
  labels: AchievementShareCardLabels;
}

const W = 720;
const POSTER_MARGIN = 28;
const CARD_INNER_PAD = 40;
const CARD_RADIUS = 32;

const BADGE_EMOJI_SIZE = 42;
const BADGE_TEXT_SIZE = 35;
const BADGE_PILL_H = 52;

const HERO_EMOJI_SIZE = 72;
const EMOJI_GLOW_R = 88;

const FONT =
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

const GREEN = '#4ade80';
const WHITE = '#f8fafc';
const GRAY = '#94a3b8';
const GRAY_DIM = 'rgba(148, 163, 184, 0.82)';

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

function drawEmojiGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
  glow.addColorStop(0, 'rgba(167, 139, 250, 0.28)');
  glow.addColorStop(0.55, 'rgba(74, 222, 128, 0.12)');
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
  ctx.font = `700 34px ${FONT}`;
  const nameLines = getWrapLines(ctx, input.name, innerW - 16);
  const nameBlockH = blockH(nameLines, 42) + 8;

  ctx.font = `400 22px ${FONT}`;
  const descLines = getWrapLines(ctx, input.description, innerW - 72);
  const descPanelH = Math.max(72, blockH(descLines, 30) + 44);

  const badgeBlock = BADGE_PILL_H + 18;
  const emojiBlock = EMOJI_GLOW_R * 2 + 12;
  const metaBlock = 44 + 14;
  const earnedBlock = input.labels.earnedAt ? 28 + 12 : 0;
  const footerH = 56;

  const contentH = badgeBlock + emojiBlock + nameBlockH + descPanelH + metaBlock + earnedBlock + footerH;

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
  roundRect(ctx, x, topY, w, h, 18);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(196, 181, 253, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const textTop = topY + (h - blockH(lines, 30)) / 2 + 22;
  drawCenteredLines(ctx, lines, cx, textTop - 22, 30, '#e5e7eb', `400 22px ${FONT}`);
}

function drawMetaPills(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baselineY: number,
  rarity: string,
  xpLabel: string
) {
  ctx.font = `700 22px ${FONT}`;
  const pillH = 36;
  const gap = 14;
  const items: Array<{ label: string; color: string; stroke: string }> = [
    { label: rarity, color: '#fbbf24', stroke: 'rgba(251, 191, 36, 0.35)' },
    { label: xpLabel, color: GREEN, stroke: 'rgba(74, 222, 128, 0.4)' },
  ];
  const widths = items.map((item) => ctx.measureText(item.label).width + 36);
  const totalW = widths[0] + gap + widths[1];
  let x = cx - totalW / 2;

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const pw = widths[i];
    roundRect(ctx, x, baselineY - pillH / 2, pw, pillH, 18);
    ctx.fillStyle = 'rgba(74, 222, 128, 0.1)';
    ctx.fill();
    ctx.strokeStyle = item.stroke;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = item.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, x + pw / 2, baselineY);
    x += pw + gap;
  }
  ctx.textBaseline = 'alphabetic';
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
  const xpLabel = `+${input.xp.toLocaleString(input.locale.startsWith('ko') ? 'ko-KR' : 'en-US')} XP`;

  let y = posterY + (posterH - metrics.contentH) / 2;

  drawPillBadge(ctx, cx, y + BADGE_PILL_H / 2, input.labels.badge);
  y += BADGE_PILL_H + 18;

  const emojiCy = y + EMOJI_GLOW_R;
  drawEmojiGlow(ctx, cx, emojiCy, EMOJI_GLOW_R);
  ctx.font = `${HERO_EMOJI_SIZE}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = WHITE;
  ctx.fillText(input.emoji, cx, emojiCy);
  ctx.textBaseline = 'alphabetic';
  y += EMOJI_GLOW_R * 2 + 12;

  ctx.font = `700 34px ${FONT}`;
  ctx.fillStyle = WHITE;
  drawCenteredLines(ctx, metrics.nameLines, cx, y, 42, WHITE, `700 34px ${FONT}`);
  y += metrics.nameBlockH;

  drawDescPanel(ctx, cx, y, innerW, metrics.descPanelH, metrics.descLines);
  y += metrics.descPanelH + 14;

  drawMetaPills(ctx, cx, y + 18, input.rarity, xpLabel);
  y += 44;

  if (input.labels.earnedAt) {
    ctx.font = `400 20px ${FONT}`;
    ctx.fillStyle = GRAY_DIM;
    ctx.textAlign = 'center';
    ctx.fillText(input.labels.earnedAt, cx, y + 20);
    y += 28 + 12;
  }

  drawFooter(ctx, innerLeft, y, innerW, 56, input.labels);
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
