import type { LiftedComparisonResult } from '@machinefit/shared';
import { formatVolumeKg } from '@machinefit/shared';

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
  /** @default '4:5' — compact share card (900×1125) */
  aspectRatio?: ShareCardAspectRatio;
}

const W = 900;
const POSTER_MARGIN = 40;

const CARD_INNER_PAD = 52;

/** Comparison emoji ring — larger icon with tighter label gap */
const COMP_RING_R = 78;
const COMP_EMOJI_SIZE = 86;
const COMP_ICON_LABEL_GAP = 22;

const FONT =
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

const GREEN = '#4ade80';
const GREEN_MID = '#22c55e';
const WHITE = '#f8fafc';
const GRAY = '#94a3b8';
const GRAY_DIM = 'rgba(148, 163, 184, 0.82)';

const CARD_RADIUS = 40;
const BOX_RADIUS = 18;

function canvasHeight(aspect: ShareCardAspectRatio): number {
  if (aspect === '9:16') return 1600;
  if (aspect === '1:1') return 900;
  return 1125;
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
  const bg = ctx.createLinearGradient(0, 0, width, height * 0.85);
  bg.addColorStop(0, '#060a12');
  bg.addColorStop(0.45, '#0c1420');
  bg.addColorStop(1, '#071018');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const accent = ctx.createRadialGradient(
    width * 0.5,
    height * 0.32,
    0,
    width * 0.5,
    height * 0.32,
    width * 0.62
  );
  accent.addColorStop(0, 'rgba(74, 222, 128, 0.07)');
  accent.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, width, height);
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

function measureLayout(ctx: CanvasRenderingContext2D, input: ShareCardInput, innerW: number): LayoutMetrics {
  ctx.font = `400 32px ${FONT}`;
  const tipLines = input.comparison ? getWrapLines(ctx, input.comparison.tip, innerW - 52) : [];

  const badgeBlock = 40 + 24;
  const avatarBlock = 64 + 20;
  const headlineBlock = 40 + 24;
  const heroBlock = 172;
  const comparisonH = input.comparison ? measureComparisonCardH(tipLines) : 0;
  const footerH = 68;

  const contentH = badgeBlock + avatarBlock + headlineBlock + heroBlock + comparisonH + footerH;

  return { contentH, comparisonH, tipLines, footerH };
}

function drawPillBadge(ctx: CanvasRenderingContext2D, cx: number, centerY: number, label: string) {
  ctx.font = `600 24px ${FONT}`;
  const tw = ctx.measureText(label).width;
  const pw = tw + 40;
  const ph = 40;
  roundRect(ctx, cx - pw / 2, centerY - ph / 2, pw, ph, 20);
  ctx.fillStyle = 'rgba(74, 222, 128, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, centerY);
  ctx.textBaseline = 'alphabetic';
}

function drawHeadlineCentered(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baselineY: number,
  headline: string,
  labelName: string
) {
  if (labelName && headline.startsWith(labelName)) {
    const rest = headline.slice(labelName.length);
    ctx.font = `700 32px ${FONT}`;
    const bw = ctx.measureText(labelName).width;
    ctx.font = `400 32px ${FONT}`;
    const rw = ctx.measureText(rest).width;
    const sx = cx - (bw + rw) / 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `700 32px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.fillText(labelName, sx, baselineY);
    ctx.font = `400 32px ${FONT}`;
    ctx.fillStyle = GRAY_DIM;
    ctx.fillText(rest, sx + bw, baselineY);
  } else {
    ctx.font = `400 32px ${FONT}`;
    ctx.fillStyle = GRAY_DIM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(headline, cx, baselineY);
  }
  ctx.textAlign = 'center';
}

function drawHeroKg(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  totalKg: number,
  closing: string,
  locale: string
): number {
  const zoneH = 172;
  const numText = formatVolumeKg(totalKg, locale);

  ctx.font = `900 148px ${FONT}`;
  const numW = ctx.measureText(numText).width;
  ctx.font = `800 46px ${FONT}`;
  const unitW = ctx.measureText('KG').width;
  const gap = 14;
  const totalW = numW + gap + unitW;
  const nx = cx - totalW / 2;
  const numBaseline = topY + 114;

  const glow = ctx.createRadialGradient(cx, numBaseline - 34, 0, cx, numBaseline - 34, 200);
  glow.addColorStop(0, 'rgba(74, 222, 128, 0.16)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 220, topY, 440, zoneH);

  drawLaurelWreath(ctx, cx, numBaseline - 30, totalW / 2 + 46, 62);

  const grad = ctx.createLinearGradient(nx, topY + 40, nx + numW, numBaseline);
  grad.addColorStop(0, '#bbf7d0');
  grad.addColorStop(0.5, GREEN);
  grad.addColorStop(1, GREEN_MID);

  ctx.font = `900 148px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = grad;
  ctx.fillText(numText, nx, numBaseline);

  ctx.font = `800 46px ${FONT}`;
  ctx.fillStyle = GREEN;
  ctx.fillText('KG', nx + numW + gap, numBaseline - 12);

  ctx.textAlign = 'center';
  ctx.font = `400 28px ${FONT}`;
  ctx.fillStyle = GRAY_DIM;
  ctx.fillText(closing, cx, topY + zoneH - 14);

  return zoneH;
}

function measureComparisonCardH(tipLines: string[]): number {
  return 32 + 24 + COMP_RING_R * 2 + COMP_ICON_LABEL_GAP + 40 + 18 + blockH(tipLines, 32) + 14;
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

  let cy = topY + 32;
  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = GRAY_DIM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(sectionTitle, cx, cy);
  cy += 24;

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

  ctx.font = `700 36px ${FONT}`;
  ctx.fillStyle = WHITE;
  ctx.fillText(comparison.name, cx, cy);
  cy += 40;

  ctx.font = `700 28px ${FONT}`;
  const pw = ctx.measureText(countLabel).width + 44;
  const pillH = 40;
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

  drawCenteredLines(ctx, tipLines, cx, cy, 32, GRAY, `400 24px ${FONT}`);
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

  const markSize = 32;
  const logoRowY = midY - 6;
  drawMachineFitMark(ctx, left, logoRowY - markSize + 6, markSize);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = WHITE;
  const brandX = left + markSize + 12;
  ctx.fillText('Machine', brandX, logoRowY);
  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = GREEN;
  const machineW = ctx.measureText('Machine').width;
  ctx.fillText('Fit', brandX + machineW, logoRowY);

  ctx.font = `400 22px ${FONT}`;
  ctx.fillStyle = GRAY;
  ctx.fillText(labels.tagline, left, logoRowY + 32);

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = GREEN;
  const tags = labels.hashtags.split(/\s+/).filter(Boolean);
  const tagStartY = midY - ((tags.length - 1) * 30) / 2;
  tags.forEach((tag, i) => {
    ctx.fillText(tag, right, tagStartY + i * 30);
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

  drawPillBadge(ctx, cx, y + 20, input.labels.badge);
  y += 40 + 24;

  drawEmojiCentered(ctx, '🏋️', cx, y + 32, 64);
  y += 64 + 20;

  drawHeadlineCentered(ctx, cx, y + 30, input.headline, input.labelName);
  y += 40 + 24;

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

  drawFooter(ctx, innerLeft, y, innerW, metrics.footerH, input.labels, Boolean(input.comparison));
}

/** Compact poster share card for SNS (4:5 default — 900×1125). */
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
  const cardFill = ctx.createLinearGradient(
    POSTER_MARGIN,
    posterY,
    POSTER_MARGIN + posterW,
    posterY + posterH
  );
  cardFill.addColorStop(0, '#121c2a');
  cardFill.addColorStop(0.48, '#0f1728');
  cardFill.addColorStop(1, '#0b121c');
  ctx.fillStyle = cardFill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawPosterContent(ctx, input, POSTER_MARGIN, posterY, posterW, posterH, metrics);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export share card'));
    }, 'image/png');
  });
}
