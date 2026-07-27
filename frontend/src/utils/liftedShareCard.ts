import type { LiftedComparisonResult } from '@machinefit/shared';
import { formatVolumeKg } from '@machinefit/shared';

export interface LiftedShareCardLabels {
  aboutCount: (count: string, unit: string) => string;
  badge: string;
  comparisonSection: string;
  tagline: string;
  shareCta: string;
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
}

const CARD_W = 1080;
const PAD = 36;

const FONT =
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

const NEON = '#39FF9F';
const NEON_SOFT = 'rgba(57, 255, 159, 0.22)';
const BG = '#0B1115';
const PANEL = '#101820';

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

function blockHeight(lines: string[], lh: number): number {
  return lines.length * lh;
}

function drawEmojiCentered(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  cx: number,
  cy: number,
  fontSize: number
) {
  ctx.font = `${fontSize}px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  const w = ctx.measureText(emoji).width;
  ctx.fillText(emoji, cx - w / 2, cy);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
}

function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  cx: number,
  startY: number,
  lh: number
): number {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = startY;
  for (const line of lines) {
    ctx.fillText(line, cx, y);
    y += lh;
  }
  return y;
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', 0, 0);
  ctx.restore();
}

function drawLaurel(ctx: CanvasRenderingContext2D, cx: number, cy: number, h: number, flip: boolean) {
  ctx.save();
  ctx.translate(cx, cy);
  if (flip) ctx.scale(-1, 1);
  ctx.strokeStyle = 'rgba(57, 255, 159, 0.32)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.35);
  ctx.quadraticCurveTo(h * 0.45, h * 0.05, h * 0.15, -h * 0.35);
  ctx.moveTo(0, h * 0.35);
  ctx.quadraticCurveTo(h * 0.35, h * 0.15, h * 0.08, -h * 0.12);
  ctx.moveTo(0, h * 0.35);
  ctx.quadraticCurveTo(h * 0.28, h * 0.42, h * 0.2, h * 0.05);
  ctx.stroke();
  ctx.restore();
}

function drawMachineFitMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = NEON;
  ctx.lineWidth = size * 0.14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size;
  ctx.beginPath();
  ctx.moveTo(s * 0.15, s * 0.75);
  ctx.lineTo(s * 0.42, s * 0.25);
  ctx.lineTo(s * 0.58, s * 0.55);
  ctx.lineTo(s * 0.85, s * 0.15);
  ctx.stroke();
  ctx.restore();
}

function drawGymSilhouette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.globalAlpha = 0.14;
  const gx = w * 0.78;
  const gy = h * 0.1;
  const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 280);
  grad.addColorStop(0, 'rgba(57, 255, 159, 0.35)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(gx, gy, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 200, 210, 0.25)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(gx - 120, gy + 30);
  ctx.lineTo(gx + 120, gy + 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(gx - 90, gy + 30, 28, 0, Math.PI * 2);
  ctx.arc(gx + 90, gy + 30, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCardBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0a1018');
  grad.addColorStop(0.5, BG);
  grad.addColorStop(1, '#0c1612');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  drawGymSilhouette(ctx, w, h);
}

function drawBadgeWithLine(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  label: string,
  cardW: number
) {
  const lineW = cardW - 120;
  const lineY = y + 22;
  ctx.strokeStyle = 'rgba(57, 255, 159, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - lineW / 2, lineY);
  ctx.lineTo(cx + lineW / 2, lineY);
  ctx.stroke();

  const glow = ctx.createLinearGradient(cx - 80, lineY, cx + 80, lineY);
  glow.addColorStop(0, 'rgba(57, 255, 159, 0)');
  glow.addColorStop(0.5, 'rgba(57, 255, 159, 0.55)');
  glow.addColorStop(1, 'rgba(57, 255, 159, 0)');
  ctx.strokeStyle = glow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 80, lineY);
  ctx.lineTo(cx + 80, lineY);
  ctx.stroke();

  ctx.font = `600 26px ${FONT}`;
  const textW = ctx.measureText(label).width;
  const pillW = textW + 52;
  const pillH = 44;
  const px = cx - pillW / 2;
  const py = y;
  roundRect(ctx, px, py, pillW, pillH, 22);
  ctx.fillStyle = 'rgba(11, 17, 21, 0.92)';
  ctx.fill();
  ctx.strokeStyle = NEON_SOFT;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = NEON;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, py + pillH / 2);
  ctx.textBaseline = 'alphabetic';
}

function drawAvatarRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const ring = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.2);
  ring.addColorStop(0, 'rgba(57, 255, 159, 0.2)');
  ring.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(57, 255, 159, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(16, 24, 32, 0.85)';
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
  ctx.fill();

  drawSparkle(ctx, cx - radius - 28, cy - 8, 22);
  drawSparkle(ctx, cx + radius + 28, cy - 8, 22);
  drawEmojiCentered(ctx, '🏋️', cx, cy, 72);
}

function drawHeadlineBoldName(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  headline: string,
  labelName: string
) {
  const useBold = labelName && headline.includes(labelName);
  if (!useBold) {
    ctx.font = `400 34px ${FONT}`;
    ctx.fillStyle = 'rgba(241, 245, 249, 0.92)';
    ctx.textAlign = 'center';
    ctx.fillText(headline, cx, y);
    return;
  }
  const rest = headline.slice(labelName.length);
  ctx.font = `700 34px ${FONT}`;
  const boldW = ctx.measureText(labelName).width;
  ctx.font = `400 34px ${FONT}`;
  const restW = ctx.measureText(rest).width;
  const startX = cx - (boldW + restW) / 2;
  ctx.textAlign = 'left';
  ctx.font = `700 34px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(labelName, startX, y);
  ctx.font = `400 34px ${FONT}`;
  ctx.fillStyle = 'rgba(226, 232, 240, 0.88)';
  ctx.fillText(rest, startX + boldW, y);
  ctx.textAlign = 'center';
}

function drawStatPanel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  totalKg: number,
  closing: string,
  locale: string
): number {
  const h = 196;
  const x = cx - w / 2;
  roundRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.strokeStyle = 'rgba(57, 255, 159, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const numText = formatVolumeKg(totalKg, locale);
  ctx.font = `900 108px ${FONT}`;
  const numW = ctx.measureText(numText).width;
  ctx.font = `800 46px ${FONT}`;
  const unitW = ctx.measureText('KG').width;
  const blockW = numW + 12 + unitW;
  const statY = y + 108;

  drawLaurel(ctx, cx - blockW / 2 - 36, statY - 20, 56, false);
  drawLaurel(ctx, cx + blockW / 2 + 36, statY - 20, 56, true);

  const grad = ctx.createLinearGradient(cx - numW / 2, statY - 70, cx + numW / 2, statY);
  grad.addColorStop(0, '#86efac');
  grad.addColorStop(0.45, NEON);
  grad.addColorStop(1, '#22c55e');
  ctx.font = `900 108px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = grad;
  const numX = cx - blockW / 2;
  ctx.fillText(numText, numX, statY);
  ctx.font = `800 46px ${FONT}`;
  ctx.fillStyle = NEON;
  ctx.fillText('KG', numX + numW + 12, statY - 10);
  ctx.textAlign = 'center';

  const closeY = y + h - 36;
  ctx.font = `400 30px ${FONT}`;
  ctx.fillStyle = 'rgba(203, 213, 225, 0.88)';
  const closeW = ctx.measureText(closing).width;
  const lineGap = 20;
  const lineLen = Math.min(120, (w - closeW - lineGap * 2 - 40) / 2);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - closeW / 2 - lineGap - lineLen, closeY - 10);
  ctx.lineTo(cx - closeW / 2 - lineGap, closeY - 10);
  ctx.moveTo(cx + closeW / 2 + lineGap, closeY - 10);
  ctx.lineTo(cx + closeW / 2 + lineGap + lineLen, closeY - 10);
  ctx.stroke();
  ctx.fillText(closing, cx, closeY);

  return h;
}

function drawQuoteBlock(ctx: CanvasRenderingContext2D, cx: number, y: number, text: string, maxW: number): number {
  ctx.font = `400 30px ${FONT}`;
  const lines = getWrapLines(ctx, text, maxW - 80);
  const lh = 44;
  const h = blockHeight(lines, lh) + 16;

  ctx.font = `700 52px ${FONT}`;
  ctx.fillStyle = NEON;
  ctx.textAlign = 'center';
  ctx.fillText('“', cx - maxW / 2 + 36, y + 38);

  ctx.font = `400 30px ${FONT}`;
  ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
  drawCenteredLines(ctx, lines, cx, y + 40, lh);

  ctx.font = `700 52px ${FONT}`;
  ctx.fillStyle = NEON;
  ctx.fillText('”', cx + maxW / 2 - 36, y + h - 8);

  return h;
}

function drawComparisonPanel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  comparison: LiftedComparisonResult,
  countLabel: string,
  sectionTitle: string,
  tipLines: string[]
): number {
  ctx.font = `28px ${FONT}`;
  const tipH = blockHeight(tipLines, 36);
  const h = 36 + 32 + 88 + 24 + 44 + 16 + 40 + 16 + tipH + 36;
  const x = cx - w / 2;

  roundRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = '#0d141c';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  let cy = y + 36;
  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = 'rgba(203, 213, 225, 0.75)';
  ctx.textAlign = 'center';
  ctx.fillText(sectionTitle, cx, cy);
  cy += 32;

  const ringR = 44;
  const ringCy = cy + ringR;
  ctx.strokeStyle = 'rgba(57, 255, 159, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, ringCy, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(57, 255, 159, 0.08)';
  ctx.fill();
  drawEmojiCentered(ctx, comparison.emoji, cx, ringCy, 48);
  cy += ringR * 2 + 24;

  ctx.font = `700 38px ${FONT}`;
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(comparison.name, cx, cy);
  cy += 44;

  ctx.font = `700 28px ${FONT}`;
  const pillW = ctx.measureText(countLabel).width + 48;
  roundRect(ctx, cx - pillW / 2, cy - 20, pillW, 40, 20);
  ctx.fillStyle = 'rgba(57, 255, 159, 0.18)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(57, 255, 159, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = NEON;
  ctx.textBaseline = 'middle';
  ctx.fillText(countLabel, cx, cy);
  ctx.textBaseline = 'alphabetic';
  cy += 40;

  ctx.font = `26px ${FONT}`;
  ctx.fillStyle = 'rgba(148, 163, 184, 0.92)';
  drawCenteredLines(ctx, tipLines, cx, cy + 8, 36);

  return h;
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  y: number,
  w: number,
  pad: number,
  labels: LiftedShareCardLabels
) {
  const leftX = pad + 8;
  const rightX = w - pad - 8;
  const footerY = y + 28;

  ctx.strokeStyle = 'rgba(57, 255, 159, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(w - pad, y);
  ctx.stroke();

  drawMachineFitMark(ctx, leftX, footerY - 8, 44);
  ctx.textAlign = 'left';
  ctx.font = `800 28px ${FONT}`;
  ctx.fillStyle = '#f8fafc';
  ctx.fillText('Machine', leftX + 52, footerY + 4);
  ctx.fillStyle = NEON;
  ctx.fillText('Fit', leftX + 52 + ctx.measureText('Machine').width, footerY + 4);
  ctx.font = `22px ${FONT}`;
  ctx.fillStyle = 'rgba(148, 163, 184, 0.88)';
  ctx.fillText(labels.tagline, leftX + 52, footerY + 38);

  ctx.textAlign = 'right';
  ctx.font = `500 24px ${FONT}`;
  ctx.fillStyle = 'rgba(226, 232, 240, 0.88)';
  ctx.fillText(labels.shareCta, rightX, footerY + 4);
  ctx.font = `22px ${FONT}`;
  ctx.fillStyle = NEON;
  ctx.fillText(labels.hashtags, rightX, footerY + 38);
}

interface LayoutResult {
  height: number;
  tipLines: string[];
}

function measureLayout(ctx: CanvasRenderingContext2D, input: ShareCardInput, innerW: number): LayoutResult {
  ctx.font = `400 30px ${FONT}`;
  const tipLines = input.comparison
    ? getWrapLines(ctx, input.comparison.tip, innerW - 96)
    : [];

  const h =
    PAD +
    44 +
    28 +
    96 +
    20 +
    48 +
    24 +
    196 +
    28 +
    60 +
    (input.comparison ? 24 + (36 + 32 + 88 + 24 + 44 + 16 + 40 + 16 + blockHeight(tipLines, 36) + 36) : 0) +
    24 +
    88 +
    PAD;

  return { height: h, tipLines };
}

/** Share card — matches reference sample layout for social sharing. */
export async function buildLiftedShareCard(input: ShareCardInput): Promise<Blob> {
  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = CARD_W;
  measureCanvas.height = 1;
  const mctx = measureCanvas.getContext('2d');
  if (!mctx) throw new Error('Canvas unavailable');

  const innerW = CARD_W - PAD * 2 - 48;
  const { height, tipLines } = measureLayout(mctx, input, innerW);

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const cx = CARD_W / 2;
  drawCardBackground(ctx, CARD_W, height);

  roundRect(ctx, PAD, PAD, CARD_W - PAD * 2, height - PAD * 2, 28);
  ctx.strokeStyle = 'rgba(57, 255, 159, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(57, 255, 159, 0.08)';
  ctx.lineWidth = 6;
  roundRect(ctx, PAD + 2, PAD + 2, CARD_W - PAD * 2 - 4, height - PAD * 2 - 4, 26);
  ctx.stroke();

  const contentX = PAD + 24;
  const contentW = CARD_W - contentX * 2;
  let y = PAD + 32;

  drawBadgeWithLine(ctx, cx, y, input.labels.badge, contentW);
  y += 44 + 28;

  drawAvatarRing(ctx, cx, y + 48, 48);
  y += 96 + 20;

  drawHeadlineBoldName(ctx, cx, y + 32, input.headline, input.labelName);
  y += 48 + 24;

  y += drawStatPanel(ctx, cx, y, contentW - 16, input.totalKg, input.closing, input.locale);
  y += 28;

  y += drawQuoteBlock(ctx, cx, y, input.funLine, contentW);
  y += 24;

  if (input.comparison) {
    const countLabel = input.labels.aboutCount(
      formatVolumeKg(input.comparison.count, input.locale),
      input.comparison.unit
    );
    y += drawComparisonPanel(
      ctx,
      cx,
      y,
      contentW - 16,
      input.comparison,
      countLabel,
      input.labels.comparisonSection,
      tipLines
    );
    y += 24;
  }

  drawFooter(ctx, y, CARD_W, PAD + 16, input.labels);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export share card'));
    }, 'image/png');
  });
}
