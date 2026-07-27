import type { LiftedComparisonResult } from '@machinefit/shared';
import { formatVolumeKg } from '@machinefit/shared';

export interface LiftedShareCardLabels {
  aboutCount: (count: string, unit: string) => string;
}

interface ShareCardInput {
  headline: string;
  totalKg: number;
  closing: string;
  funLine: string;
  comparison?: LiftedComparisonResult;
  locale: string;
  labels: LiftedShareCardLabels;
}

const FONT =
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

const ACCENT = '#4ade80';
const ACCENT_SOFT = 'rgba(34, 197, 94, 0.18)';
const ACCENT_BORDER = 'rgba(34, 197, 94, 0.28)';

const CARD_W = 1080;
const CARD_H = 1350;

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

function measureWrapHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): number {
  const chars = [...text];
  let line = '';
  let lines = 1;

  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      line = ch;
      lines += 1;
    } else {
      line = test;
    }
  }

  return lines * lineHeight;
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

function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  cx: number,
  startY: number,
  lineHeight: number
) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = startY;
  for (const line of lines) {
    ctx.fillText(line, cx, y);
    y += lineHeight;
  }
  return y;
}

function drawPageBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width * 0.15, height);
  gradient.addColorStop(0, '#0b1220');
  gradient.addColorStop(0.5, '#111827');
  gradient.addColorStop(1, '#0f3d2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
  ctx.beginPath();
  ctx.arc(width * 0.9, height * 0.12, 260, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeroPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  roundRect(ctx, x, y, w, h, 28);
  const panelGrad = ctx.createLinearGradient(x, y, x + w * 0.35, y + h);
  panelGrad.addColorStop(0, '#0b1220');
  panelGrad.addColorStop(0.55, '#111827');
  panelGrad.addColorStop(1, '#0f3d2e');
  ctx.fillStyle = panelGrad;
  ctx.fill();

  ctx.save();
  roundRect(ctx, x, y, w, h, 28);
  ctx.clip();
  ctx.fillStyle = 'rgba(34, 197, 94, 0.18)';
  ctx.beginPath();
  ctx.arc(x + w * 0.94, y + h * 0.06, w * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = ACCENT_BORDER;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 28);
  ctx.stroke();
}

function drawEmojiGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius);
  glow.addColorStop(0, 'rgba(74, 222, 128, 0.35)');
  glow.addColorStop(0.6, 'rgba(34, 197, 94, 0.1)');
  glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCenteredEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  cx: number,
  cy: number,
  fontSize: number
) {
  drawEmojiGlow(ctx, cx, cy, fontSize * 0.72);
  ctx.font = `${fontSize}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(emoji, cx, cy);
  ctx.textBaseline = 'alphabetic';
}

function drawTotalWeight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baselineY: number,
  totalKg: number,
  locale: string
) {
  const numText = formatVolumeKg(totalKg, locale);
  ctx.font = `800 100px ${FONT}`;
  const numW = ctx.measureText(numText).width;
  ctx.font = `700 40px ${FONT}`;
  const unitW = ctx.measureText('KG').width;
  const gap = 14;
  const startX = cx - (numW + gap + unitW) / 2;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 100px ${FONT}`;
  ctx.fillStyle = ACCENT;
  ctx.fillText(numText, startX, baselineY);

  ctx.font = `700 40px ${FONT}`;
  ctx.fillStyle = '#86efac';
  ctx.fillText('KG', startX + numW + gap, baselineY - 6);

  ctx.textAlign = 'center';
}

interface HeroMetrics {
  height: number;
  headlineLines: string[];
  closingLines: string[];
  funLines: string[];
}

function measureHeroMetrics(
  ctx: CanvasRenderingContext2D,
  headline: string,
  closing: string,
  funLine: string,
  innerW: number
): HeroMetrics {
  const padY = 40;
  const emojiH = 96;
  const gapSm = 16;
  const gapMd = 24;
  const totalH = 96;

  ctx.font = `34px ${FONT}`;
  const headlineLines = getWrapLines(ctx, headline, innerW);
  const headlineBlockH = headlineLines.length * 46;

  ctx.font = `30px ${FONT}`;
  const closingLines = getWrapLines(ctx, closing, innerW);
  const closingBlockH = closingLines.length * 40;

  ctx.font = `30px ${FONT}`;
  const funLines = getWrapLines(ctx, funLine, innerW);
  const funBlockH = funLines.length * 40;

  const height =
    padY +
    emojiH +
    gapMd +
    headlineBlockH +
    gapSm +
    totalH +
    gapSm +
    closingBlockH +
    gapSm +
    funBlockH +
    padY;

  return { height, headlineLines, closingLines, funLines };
}

function drawHeroContent(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  metrics: HeroMetrics,
  totalKg: number,
  locale: string
) {
  const padY = 40;
  const emojiH = 96;
  const gapSm = 16;
  const gapMd = 24;

  const emojiCy = top + padY + emojiH / 2;
  drawCenteredEmoji(ctx, '🏋️', cx, emojiCy, 92);

  let y = top + padY + emojiH + gapMd + 34;

  ctx.font = `34px ${FONT}`;
  ctx.fillStyle = '#e5e7eb';
  y = drawCenteredLines(ctx, metrics.headlineLines, cx, y, 46);

  y += gapSm;
  drawTotalWeight(ctx, cx, y + 72, totalKg, locale);

  y += 96 + gapSm;
  ctx.font = `30px ${FONT}`;
  ctx.fillStyle = '#cbd5e1';
  y = drawCenteredLines(ctx, metrics.closingLines, cx, y, 40);

  y += gapSm;
  ctx.font = `30px ${FONT}`;
  ctx.fillStyle = '#86efac';
  drawCenteredLines(ctx, metrics.funLines, cx, y, 40);
}

function measureComparisonCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  comparison: LiftedComparisonResult
): number {
  const pad = 28;
  const iconSize = 92;
  const gap = 24;
  const bodyW = w - pad * 2 - iconSize - gap;

  ctx.font = `bold 34px ${FONT}`;
  const nameH = measureWrapHeight(ctx, comparison.name, bodyW, 42);
  ctx.font = `28px ${FONT}`;
  const tipH = measureWrapHeight(ctx, comparison.tip, bodyW, 36);
  const textH = nameH + 36 + tipH;
  const rowH = Math.max(iconSize, textH);
  return rowH + pad * 2;
}

function drawComparisonCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  comparison: LiftedComparisonResult,
  countLabel: string
): number {
  const pad = 28;
  const iconSize = 92;
  const gap = 24;
  const bodyX = x + pad + iconSize + gap;
  const bodyW = w - pad * 2 - iconSize - gap;

  ctx.font = `bold 34px ${FONT}`;
  const nameH = measureWrapHeight(ctx, comparison.name, bodyW, 42);
  ctx.font = `28px ${FONT}`;
  const tipH = measureWrapHeight(ctx, comparison.tip, bodyW, 36);
  const textH = nameH + 36 + tipH;
  const rowH = Math.max(iconSize, textH);
  const cardH = rowH + pad * 2;

  roundRect(ctx, x, y, w, cardH, 22);
  ctx.fillStyle = 'rgba(17, 24, 39, 0.94)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const rowTop = y + pad;
  const iconX = x + pad;
  const iconY = rowTop + (rowH - iconSize) / 2;

  roundRect(ctx, iconX, iconY, iconSize, iconSize, 18);
  ctx.fillStyle = ACCENT_SOFT;
  ctx.fill();

  const iconCx = iconX + iconSize / 2;
  const iconCy = iconY + iconSize / 2;
  ctx.font = `52px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(comparison.emoji, iconCx, iconCy);
  ctx.textBaseline = 'alphabetic';

  const textTop = rowTop + (rowH - textH) / 2;
  ctx.textAlign = 'left';
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillStyle = '#f9fafb';
  wrapTextLeft(ctx, comparison.name, bodyX, textTop + 30, bodyW, 42);

  ctx.font = `bold 30px ${FONT}`;
  ctx.fillStyle = ACCENT;
  ctx.fillText(countLabel, bodyX, textTop + nameH + 34);

  ctx.font = `28px ${FONT}`;
  ctx.fillStyle = '#9ca3af';
  wrapTextLeft(ctx, comparison.tip, bodyX, textTop + nameH + 68, bodyW, 36);

  ctx.textAlign = 'center';
  return cardH;
}

function wrapTextLeft(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const lines = getWrapLines(ctx, text, maxWidth);
  let cursorY = y;
  for (const line of lines) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
}

/** Share card — lifted-weight hero + comparison card for social sharing. */
export async function buildLiftedShareCard(input: ShareCardInput): Promise<Blob> {
  const { headline, totalKg, closing, funLine, comparison, locale, labels } = input;
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  drawPageBackground(ctx, CARD_W, CARD_H);

  const frameX = 40;
  const frameY = 40;
  const frameW = CARD_W - frameX * 2;
  const frameH = CARD_H - frameY * 2;
  roundRect(ctx, frameX, frameY, frameW, frameH, 36);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const cx = CARD_W / 2;
  const innerX = frameX + 44;
  const innerW = frameW - 88;
  const heroInnerW = innerW - 56;

  const heroMetrics = measureHeroMetrics(ctx, headline, closing, funLine, heroInnerW);
  const sectionGap = 28;
  const comparisonH = comparison ? measureComparisonCard(ctx, innerW, comparison) : 0;
  const footerH = 58;

  const contentH =
    heroMetrics.height +
    (comparison ? sectionGap + comparisonH : 0) +
    sectionGap +
    footerH;

  const contentTop = frameY + Math.max(48, (frameH - contentH) / 2);

  drawHeroPanel(ctx, innerX, contentTop, innerW, heroMetrics.height);
  drawHeroContent(ctx, cx, contentTop, heroMetrics, totalKg, locale);

  let cursorY = contentTop + heroMetrics.height + sectionGap;
  if (comparison) {
    const countLabel = labels.aboutCount(
      formatVolumeKg(comparison.count, locale),
      comparison.unit
    );
    cursorY += drawComparisonCard(ctx, innerX, cursorY, innerW, comparison, countLabel);
  }

  const footerY = contentTop + contentH - footerH + 36;
  ctx.textAlign = 'center';
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillStyle = '#22c55e';
  ctx.fillText('MachineFit', cx, footerY);
  ctx.font = `24px ${FONT}`;
  ctx.fillStyle = 'rgba(134, 239, 172, 0.82)';
  ctx.fillText('#MacineFit #누적무게', cx, footerY + 34);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export share card'));
    }, 'image/png');
  });
}
