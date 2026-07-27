import type { LiftedComparisonResult } from '@machinefit/shared';
import { formatVolumeKg } from '@machinefit/shared';

export type ShareCardAspectRatio = '1:1' | '9:16';

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
  funLine: string;
  comparison?: LiftedComparisonResult;
  locale: string;
  labels: LiftedShareCardLabels;
  /** @default '9:16' */
  aspectRatio?: ShareCardAspectRatio;
}

const W = 1080;

const FONT =
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

const GREEN = '#4ade80';
const GREEN_MID = '#22c55e';
const NAVY = '#0a1018';
const WHITE = '#f8fafc';
const GRAY = '#94a3b8';
const GRAY_DIM = 'rgba(148, 163, 184, 0.75)';

const CARD_RADIUS = 24;
const BOX_RADIUS = 18;
const POSTER_PAD = 52;
const GAP_LG = 52;
const GAP_MD = 40;
const GAP_SM = 28;

function canvasHeight(aspect: ShareCardAspectRatio): number {
  return aspect === '9:16' ? 1920 : 1080;
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
  y: number,
  lh: number,
  color: string
): number {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  let cy = y;
  for (const ln of lines) {
    ctx.fillText(ln, cx, cy);
    cy += lh;
  }
  return cy;
}

function splitSlogan(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?。:])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [text];
}

function drawSubtleGymBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#080d14');
  bg.addColorStop(0.45, NAVY);
  bg.addColorStop(1, '#0a1210');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.045;
  ctx.strokeStyle = '#cbd5e1';
  ctx.fillStyle = '#64748b';

  const bx = width * 0.72;
  const by = height * 0.14;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(bx - 140, by);
  ctx.lineTo(bx + 140, by);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bx - 100, by, 22, 0, Math.PI * 2);
  ctx.arc(bx + 100, by, 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.035;
  roundRect(ctx, width * 0.08, height * 0.62, 120, 180, 12);
  ctx.stroke();
  roundRect(ctx, width * 0.82, height * 0.55, 90, 140, 10);
  ctx.stroke();

  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(width * 0.15 + i * 8, height * 0.78, 36 - i * 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.38,
    0,
    width * 0.5,
    height * 0.38,
    width * 0.55
  );
  glow.addColorStop(0, 'rgba(74, 222, 128, 0.07)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function drawLaurel(ctx: CanvasRenderingContext2D, cx: number, cy: number, h: number, flip: boolean) {
  ctx.save();
  ctx.translate(cx, cy);
  if (flip) ctx.scale(-1, 1);
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.3);
  ctx.quadraticCurveTo(h * 0.4, -h * 0.05, h * 0.12, -h * 0.32);
  ctx.moveTo(0, h * 0.3);
  ctx.quadraticCurveTo(h * 0.32, h * 0.08, h * 0.1, -h * 0.08);
  ctx.stroke();
  ctx.restore();
}

function drawMachineFitLogo(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(4, 28);
  ctx.lineTo(14, 10);
  ctx.lineTo(22, 20);
  ctx.lineTo(30, 6);
  ctx.stroke();
  ctx.font = `800 22px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = WHITE;
  ctx.fillText('Machine', 38, 22);
  ctx.fillStyle = GREEN;
  ctx.fillText('Fit', 38 + ctx.measureText('Machine').width, 22);
  ctx.restore();
}

interface ContentMetrics {
  blockH: number;
  sloganLines: string[];
  tipLines: string[];
}

function measureContent(
  ctx: CanvasRenderingContext2D,
  input: ShareCardInput,
  innerW: number
): ContentMetrics {
  const sloganLines = splitSlogan(input.funLine);
  ctx.font = `400 26px ${FONT}`;
  const tipLines = input.comparison
    ? getWrapLines(ctx, input.comparison.tip, innerW - 120)
    : [];

  let h = POSTER_PAD;
  h += 44 + GAP_LG;
  h += 64 + GAP_SM;
  h += 40 + GAP_LG;
  h += 200 + GAP_SM;
  h += 36 + GAP_MD;
  h += blockH(sloganLines, 34) + 24 + GAP_LG;
  if (input.comparison) {
    h += 36 + GAP_SM + 88 + GAP_SM + 44 + GAP_SM + 40 + GAP_SM + blockH(tipLines, 32) + 36;
    h += GAP_LG;
  }
  h += 88 + POSTER_PAD;

  return { blockH: h, sloganLines, tipLines };
}

function drawPillBadge(ctx: CanvasRenderingContext2D, cx: number, y: number, label: string) {
  ctx.font = `600 24px ${FONT}`;
  const tw = ctx.measureText(label).width;
  const pw = tw + 44;
  const ph = 40;
  const px = cx - pw / 2;
  roundRect(ctx, px, y, pw, ph, 20);
  ctx.fillStyle = 'rgba(74, 222, 128, 0.1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, y + ph / 2);
  ctx.textBaseline = 'alphabetic';
}

function drawHeadline(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
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
    ctx.font = `700 32px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.fillText(labelName, sx, y);
    ctx.font = `400 32px ${FONT}`;
    ctx.fillStyle = GRAY_DIM;
    ctx.fillText(rest, sx + bw, y);
  } else {
    ctx.font = `400 32px ${FONT}`;
    ctx.fillStyle = GRAY_DIM;
    ctx.textAlign = 'center';
    ctx.fillText(headline, cx, y);
  }
  ctx.textAlign = 'center';
}

function drawHeroKg(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  totalKg: number,
  closing: string,
  locale: string
): number {
  const zoneH = 200;
  const numText = formatVolumeKg(totalKg, locale);

  const glow = ctx.createRadialGradient(cx, y + 70, 0, cx, y + 70, 200);
  glow.addColorStop(0, 'rgba(74, 222, 128, 0.14)');
  glow.addColorStop(0.6, 'rgba(74, 222, 128, 0.04)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 220, y, 440, zoneH);

  ctx.font = `900 148px ${FONT}`;
  const numW = ctx.measureText(numText).width;
  ctx.font = `700 48px ${FONT}`;
  const unitW = ctx.measureText('KG').width;
  const totalW = numW + 14 + unitW;

  drawLaurel(ctx, cx - totalW / 2 - 32, y + 75, 48, false);
  drawLaurel(ctx, cx + totalW / 2 + 32, y + 75, 48, true);

  const grad = ctx.createLinearGradient(cx - numW / 2, y + 20, cx + numW / 2, y + 130);
  grad.addColorStop(0, '#bbf7d0');
  grad.addColorStop(0.5, GREEN);
  grad.addColorStop(1, GREEN_MID);

  ctx.font = `900 148px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = grad;
  const nx = cx - totalW / 2;
  ctx.fillText(numText, nx, y + 130);
  ctx.font = `700 48px ${FONT}`;
  ctx.fillStyle = GREEN;
  ctx.fillText('KG', nx + numW + 14, y + 118);
  ctx.textAlign = 'center';

  ctx.font = `400 28px ${FONT}`;
  ctx.fillStyle = GRAY_DIM;
  ctx.fillText(closing, cx, y + zoneH - 8);

  return zoneH;
}

function drawSlogan(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  lines: string[],
  maxW: number
): number {
  const lh = 34;
  const h = blockH(lines, lh) + 8;
  ctx.font = `400 26px ${FONT}`;
  ctx.fillStyle = 'rgba(74, 222, 128, 0.55)';
  ctx.fillText('“', cx - maxW / 2 + 8, y + 26);
  ctx.fillText('”', cx + maxW / 2 - 8, y + h - 4);
  drawCenteredLines(ctx, lines, cx, y + 28, lh, 'rgba(203, 213, 225, 0.82)');
  return h + 16;
}

function drawComparisonCard(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  comparison: LiftedComparisonResult,
  countLabel: string,
  sectionTitle: string,
  tipLines: string[]
): number {
  const tipH = blockH(tipLines, 32);
  const h = 36 + GAP_SM + 88 + GAP_SM + 44 + GAP_SM + 40 + GAP_SM + tipH + 36;
  const x = cx - w / 2;

  roundRect(ctx, x, y, w, h, BOX_RADIUS);
  ctx.fillStyle = 'rgba(15, 23, 36, 0.65)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  let cy = y + 36;
  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = GRAY_DIM;
  ctx.textAlign = 'center';
  ctx.fillText(sectionTitle, cx, cy);
  cy += GAP_SM;

  const ringR = 44;
  const ringCy = cy + ringR;
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, ringCy, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(74, 222, 128, 0.06)';
  ctx.fill();
  drawEmojiCentered(ctx, comparison.emoji, cx, ringCy, 46);
  cy += ringR * 2 + GAP_SM;

  ctx.font = `700 36px ${FONT}`;
  ctx.fillStyle = WHITE;
  ctx.fillText(comparison.name, cx, cy);
  cy += 44 + GAP_SM;

  ctx.font = `700 28px ${FONT}`;
  const pw = ctx.measureText(countLabel).width + 44;
  roundRect(ctx, cx - pw / 2, cy - 22, pw, 40, 20);
  ctx.fillStyle = 'rgba(74, 222, 128, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.textBaseline = 'middle';
  ctx.fillText(countLabel, cx, cy);
  ctx.textBaseline = 'alphabetic';
  cy += 40 + GAP_SM;

  ctx.font = `400 26px ${FONT}`;
  drawCenteredLines(ctx, tipLines, cx, cy + 8, 32, GRAY);

  return h;
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  labels: LiftedShareCardLabels
) {
  const leftX = cx - w / 2 + 8;
  const rightX = cx + w / 2 - 8;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, y);
  ctx.lineTo(cx + w / 2, y);
  ctx.stroke();

  drawMachineFitLogo(ctx, leftX, y + 18, 1.15);
  ctx.textAlign = 'left';
  ctx.font = `400 22px ${FONT}`;
  ctx.fillStyle = GRAY;
  ctx.fillText(labels.tagline, leftX + 52, y + 58);

  ctx.textAlign = 'right';
  ctx.font = `500 24px ${FONT}`;
  ctx.fillStyle = GREEN;
  const tags = labels.hashtags.split(/\s+/).filter(Boolean);
  tags.forEach((tag, i) => {
    ctx.fillText(tag, rightX, y + 32 + i * 30);
  });
}

function drawPosterContent(
  ctx: CanvasRenderingContext2D,
  input: ShareCardInput,
  posterX: number,
  posterY: number,
  posterW: number,
  metrics: ContentMetrics
) {
  const cx = posterX + posterW / 2;
  const innerW = posterW - POSTER_PAD * 2;
  let y = posterY + POSTER_PAD;

  drawPillBadge(ctx, cx, y + 20, input.labels.badge);
  y += 44 + GAP_LG;

  drawEmojiCentered(ctx, '🏋️', cx, y + 32, 64);
  y += 64 + GAP_SM;

  drawHeadline(ctx, cx, y + 28, input.headline, input.labelName);
  y += 40 + GAP_LG;

  y += drawHeroKg(ctx, cx, y, input.totalKg, input.closing, input.locale);
  y += GAP_MD;

  y += drawSlogan(ctx, cx, y, metrics.sloganLines, innerW);
  y += GAP_LG;

  if (input.comparison) {
    const countLabel = input.labels.aboutCount(
      formatVolumeKg(input.comparison.count, input.locale),
      input.comparison.unit
    );
    y += drawComparisonCard(
      ctx,
      cx,
      y,
      innerW,
      input.comparison,
      countLabel,
      input.labels.comparisonSection,
      metrics.tipLines
    );
    y += GAP_LG;
  }

  drawFooter(ctx, cx, y, innerW, input.labels);
}

/** Premium poster share card for SNS (9:16 default, optional 1:1). */
export async function buildLiftedShareCard(input: ShareCardInput): Promise<Blob> {
  const aspect = input.aspectRatio ?? '9:16';
  const height = canvasHeight(aspect);

  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = W;
  measureCanvas.height = 1;
  const mctx = measureCanvas.getContext('2d');
  if (!mctx) throw new Error('Canvas unavailable');

  const posterMargin = 40;
  const posterW = W - posterMargin * 2;
  const metrics = measureContent(mctx, input, posterW - POSTER_PAD * 2);
  const posterH = Math.min(metrics.blockH, height - posterMargin * 2);
  const posterY = posterMargin + Math.max(0, (height - posterMargin * 2 - posterH) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  drawSubtleGymBackground(ctx, W, height);

  roundRect(ctx, posterMargin, posterY, posterW, posterH, CARD_RADIUS);
  const cardFill = ctx.createLinearGradient(
    posterMargin,
    posterY,
    posterMargin,
    posterY + posterH
  );
  cardFill.addColorStop(0, 'rgba(15, 23, 36, 0.88)');
  cardFill.addColorStop(1, 'rgba(10, 16, 26, 0.92)');
  ctx.fillStyle = cardFill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.save();
  roundRect(ctx, posterMargin, posterY, posterW, posterH, CARD_RADIUS);
  ctx.clip();
  const innerGlow = ctx.createRadialGradient(
    W / 2,
    posterY + posterH * 0.35,
    0,
    W / 2,
    posterY + posterH * 0.35,
    posterW * 0.6
  );
  innerGlow.addColorStop(0, 'rgba(74, 222, 128, 0.06)');
  innerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = innerGlow;
  ctx.fillRect(posterMargin, posterY, posterW, posterH);
  ctx.restore();

  drawPosterContent(ctx, input, posterMargin, posterY, posterW, metrics);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export share card'));
    }, 'image/png');
  });
}
