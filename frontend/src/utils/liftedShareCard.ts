import type { LiftedComparisonResult } from '@machinefit/shared';
import { formatVolumeKg } from '@machinefit/shared';
import { measureShareFooterH } from '@/utils/shareHashtags';

export type ShareCardAspectRatio = '4:5' | '1:1' | '9:16';

export interface LiftedShareCardLabels {
  aboutCount: (count: string, unit: string) => string;
  badge: string;
  comparisonSection: string;
  tagline: string;
  hashtags: string;
}

interface ShareCardInput {
  headline: string;
  labelName: string;
  totalKg: number;
  closing: string;
  comparison?: LiftedComparisonResult;
  locale: string;
  labels: LiftedShareCardLabels;
  /** @default '4:5' — compact share card (720×900) */
  aspectRatio?: ShareCardAspectRatio;
}

const W = 720;
const POSTER_MARGIN = 28;

const CARD_INNER_PAD = 40;

/** Top badge — weightlifter emoji + label */
const BADGE_EMOJI_SIZE = 42;
const BADGE_TEXT_SIZE = 35;
const BADGE_PILL_H = 52;
const GAP_AFTER_HEADER = 40;

/** Hero KG stat — tight vertical layout */
const HERO_ZONE_H = 114;
const HERO_NUM_BASELINE_OFFSET = 70;
const HERO_CLOSING_AFTER_NUM = 28;

/** Comparison emoji ring */
const COMP_RING_R = 62;
const COMP_EMOJI_SIZE = 70;
const COMP_ICON_LABEL_GAP = 18;
const COMP_SECTION_TOP_PAD = 36;
const COMP_TIP_BOTTOM_PAD = 22;

const FOOTER_H = 56;
const GAP_BEFORE_FOOTER = 20;

const FONT =
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

const GREEN = '#4ade80';
const GREEN_MID = '#22c55e';
const WHITE = '#f8fafc';
const GRAY = '#94a3b8';
const GRAY_DIM = 'rgba(148, 163, 184, 0.82)';

const CARD_RADIUS = 32;
const BOX_RADIUS = 14;

function canvasHeight(aspect: ShareCardAspectRatio): number {
  if (aspect === '9:16') return 1280;
  if (aspect === '1:1') return 720;
  return 900;
}

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

function drawEmojiCentered(
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
  const ew = ctx.measureText(emoji).width;
  ctx.fillText(emoji, cx - ew / 2, cy);
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
): number {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  let y = topY + lh * 0.78;
  for (const ln of lines) {
    ctx.fillText(ln, cx, y);
    y += lh;
  }
  return y - topY;
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

/** Symmetric laurel wreath (U-shape) flanking the hero stat. */
function drawLaurelWreath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  halfSpan: number,
  branchH: number
) {
  const leafCount = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(side, 1);

    ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, branchH * 0.42);
    ctx.bezierCurveTo(
      halfSpan * 0.35,
      branchH * 0.38,
      halfSpan * 0.88,
      branchH * 0.05,
      halfSpan * 0.92,
      -branchH * 0.42
    );
    ctx.stroke();

    for (let i = 0; i < leafCount; i += 1) {
      const t = i / (leafCount - 1);
      const angle = Math.PI * 0.52 - t * Math.PI * 0.88;
      const lx = halfSpan * 0.92 * Math.cos(angle);
      const ly = -branchH * 0.42 * Math.sin(angle);
      const leafRot = angle - Math.PI / 2 + 0.35;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(leafRot);
      ctx.fillStyle = 'rgba(74, 222, 128, 0.28)';
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(0, 11);
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
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

interface LayoutMetrics {
  contentH: number;
  comparisonH: number;
  tipLines: string[];
  footerH: number;
}

function splitLeadingEmoji(label: string): { emoji: string; text: string } {
  const trimmed = label.trim();
  const m = trimmed.match(
    /^(\p{RI}\p{RI}|\p{Extended_Pictographic}(?:\p{EMod}|\uFE0F|\u200D\p{Extended_Pictographic})*)\s*(.*)$/u
  );
  if (m) return { emoji: m[1], text: m[2] };
  return { emoji: '', text: trimmed };
}

function heroBlockHeight(closing: string): number {
  return closing.trim() ? HERO_ZONE_H : HERO_ZONE_H - HERO_CLOSING_AFTER_NUM;
}

function measureHeaderBlock(): number {
  return BADGE_PILL_H + GAP_AFTER_HEADER;
}

function measureLayout(ctx: CanvasRenderingContext2D, input: ShareCardInput, innerW: number): LayoutMetrics {
  ctx.font = `400 24px ${FONT}`;
  const tipLines = input.comparison ? getWrapLines(ctx, input.comparison.tip, innerW - 44) : [];

  const headerBlock = measureHeaderBlock();
  const heroBlock = heroBlockHeight(input.closing);
  const comparisonH = input.comparison ? measureComparisonCardH(tipLines) : 0;
  const footerH = measureShareFooterH(input.labels.hashtags, { minH: FOOTER_H });

  const contentH = headerBlock + heroBlock + comparisonH + GAP_BEFORE_FOOTER + footerH;

  return { contentH, comparisonH, tipLines, footerH };
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

function drawHeroKg(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  totalKg: number,
  closing: string,
  locale: string
): number {
  const zoneH = heroBlockHeight(closing);
  const numText = formatVolumeKg(totalKg, locale);

  ctx.font = `900 118px ${FONT}`;
  const numW = ctx.measureText(numText).width;
  ctx.font = `800 36px ${FONT}`;
  const unitW = ctx.measureText('KG').width;
  const gap = 10;
  const totalW = numW + gap + unitW;
  const nx = cx - totalW / 2;
  const numBaseline = topY + HERO_NUM_BASELINE_OFFSET;

  const glow = ctx.createRadialGradient(cx, numBaseline - 26, 0, cx, numBaseline - 26, 150);
  glow.addColorStop(0, 'rgba(74, 222, 128, 0.16)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 170, topY, 340, zoneH);

  drawLaurelWreath(ctx, cx, numBaseline - 22, totalW / 2 + 36, 48);

  const grad = ctx.createLinearGradient(nx, topY + 40, nx + numW, numBaseline);
  grad.addColorStop(0, '#bbf7d0');
  grad.addColorStop(0.5, GREEN);
  grad.addColorStop(1, GREEN_MID);

  ctx.font = `900 118px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = grad;
  ctx.fillText(numText, nx, numBaseline);

  ctx.font = `800 36px ${FONT}`;
  ctx.fillStyle = GREEN;
  ctx.fillText('KG', nx + numW + gap, numBaseline - 8);

  if (closing.trim()) {
    ctx.textAlign = 'center';
    ctx.font = `400 22px ${FONT}`;
    ctx.fillStyle = GRAY_DIM;
    ctx.fillText(closing, cx, numBaseline + HERO_CLOSING_AFTER_NUM);
  }

  ctx.textAlign = 'center';
  return zoneH;
}

function measureComparisonCardH(tipLines: string[]): number {
  return (
    COMP_SECTION_TOP_PAD +
    22 +
    COMP_RING_R * 2 +
    COMP_ICON_LABEL_GAP +
    34 +
    16 +
    blockH(tipLines, 26) +
    COMP_TIP_BOTTOM_PAD
  );
}

function drawComparisonCard(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  w: number,
  comparison: LiftedComparisonResult,
  countLabel: string,
  sectionTitle: string,
  tipLines: string[]
): number {
  const h = measureComparisonCardH(tipLines);
  const x = cx - w / 2;

  roundRect(ctx, x, topY, w, h, BOX_RADIUS);
  ctx.fillStyle = 'rgba(15, 23, 36, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  ctx.stroke();

  let cy = topY + COMP_SECTION_TOP_PAD;
  ctx.font = `500 20px ${FONT}`;
  ctx.fillStyle = GRAY_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(sectionTitle, cx, cy);
  cy += 22;

  const ringR = COMP_RING_R;
  const ringCy = cy + ringR;
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, ringCy, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
  ctx.fill();
  drawEmojiCentered(ctx, comparison.emoji, cx, ringCy, COMP_EMOJI_SIZE);
  cy += ringR * 2 + COMP_ICON_LABEL_GAP;

  ctx.font = `700 30px ${FONT}`;
  ctx.fillStyle = WHITE;
  ctx.fillText(comparison.name, cx, cy);
  cy += 32;

  ctx.font = `700 22px ${FONT}`;
  const pw = ctx.measureText(countLabel).width + 36;
  const pillH = 34;
  roundRect(ctx, cx - pw / 2, cy - pillH / 2, pw, pillH, 23);
  ctx.fillStyle = 'rgba(74, 222, 128, 0.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.textBaseline = 'middle';
  ctx.fillText(countLabel, cx, cy);
  ctx.textBaseline = 'alphabetic';
  cy += pillH / 2 + 12;

  drawCenteredLines(ctx, tipLines, cx, cy, 26, GRAY, `400 20px ${FONT}`);
  return h;
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  left: number,
  topY: number,
  width: number,
  height: number,
  labels: LiftedShareCardLabels,
  showDivider: boolean
) {
  const right = left + width;
  const midY = topY + height / 2;

  if (showDivider) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, topY);
    ctx.lineTo(right, topY);
    ctx.stroke();
  }

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
  input: ShareCardInput,
  posterX: number,
  posterY: number,
  posterW: number,
  posterH: number,
  metrics: LayoutMetrics
) {
  const cx = posterX + posterW / 2;
  const innerW = posterW - CARD_INNER_PAD * 2;
  const innerLeft = posterX + CARD_INNER_PAD;

  let y = posterY + (posterH - metrics.contentH) / 2;

  drawPillBadge(ctx, cx, y + BADGE_PILL_H / 2, input.labels.badge);
  y += measureHeaderBlock();

  y += drawHeroKg(ctx, cx, y, input.totalKg, input.closing, input.locale);

  if (input.comparison) {
    const countLabel = input.labels.aboutCount(
      formatVolumeKg(input.comparison.count, input.locale),
      input.comparison.unit
    );
    drawComparisonCard(
      ctx,
      cx,
      y,
      innerW,
      input.comparison,
      countLabel,
      input.labels.comparisonSection,
      metrics.tipLines
    );
    y += metrics.comparisonH;
  }

  y += GAP_BEFORE_FOOTER;
  drawFooter(ctx, innerLeft, y, innerW, metrics.footerH, input.labels, Boolean(input.comparison));
}

/** Compact poster share card for SNS (4:5 default — 720×900). */
export async function buildLiftedShareCard(input: ShareCardInput): Promise<Blob> {
  const aspect = input.aspectRatio ?? '4:5';
  const height = canvasHeight(aspect);

  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = W;
  measureCanvas.height = 1;
  const mctx = measureCanvas.getContext('2d');
  if (!mctx) throw new Error('Canvas unavailable');

  const posterW = W - POSTER_MARGIN * 2;
  const innerW = posterW - CARD_INNER_PAD * 2;
  const metrics = measureLayout(mctx, input, innerW);
  const posterH = height - POSTER_MARGIN * 2;
  const posterY = POSTER_MARGIN;

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
