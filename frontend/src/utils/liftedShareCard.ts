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

const CARD_W = 1080;
const OUTER_PAD = 28;

const FONT =
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

const ACCENT = '#4ade80';
const ACCENT_SOFT = 'rgba(34, 197, 94, 0.2)';
const ACCENT_BORDER = 'rgba(34, 197, 94, 0.3)';

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

function blockHeight(lines: string[], lineHeight: number): number {
  return lines.length * lineHeight;
}

/** Emoji glyphs are visually off-center with textAlign:center — measure width instead. */
function drawEmojiCentered(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  cx: number,
  cy: number,
  fontSize: number,
  glowRadius?: number
) {
  if (glowRadius) {
    const glow = ctx.createRadialGradient(cx, cy, glowRadius * 0.05, cx, cy, glowRadius);
    glow.addColorStop(0, 'rgba(74, 222, 128, 0.38)');
    glow.addColorStop(0.55, 'rgba(34, 197, 94, 0.12)');
    glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

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
  lineHeight: number
): number {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = startY;
  for (const line of lines) {
    ctx.fillText(line, cx, y);
    y += lineHeight;
  }
  return y;
}

function drawTotalWeight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baselineY: number,
  totalKg: number,
  locale: string
) {
  const numText = formatVolumeKg(totalKg, locale);
  ctx.font = `800 118px ${FONT}`;
  const numW = ctx.measureText(numText).width;
  ctx.font = `700 46px ${FONT}`;
  const unitW = ctx.measureText('KG').width;
  const gap = 16;
  const startX = cx - (numW + gap + unitW) / 2;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 118px ${FONT}`;
  ctx.fillStyle = ACCENT;
  ctx.fillText(numText, startX, baselineY);

  ctx.font = `700 46px ${FONT}`;
  ctx.fillStyle = '#86efac';
  ctx.fillText('KG', startX + numW + gap, baselineY - 8);

  ctx.textAlign = 'center';
}

function drawPageBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width * 0.12, height);
  gradient.addColorStop(0, '#0b1220');
  gradient.addColorStop(0.55, '#111827');
  gradient.addColorStop(1, '#0f3d2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.08, 320, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(74, 222, 128, 0.06)';
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.92, 280, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeroPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  roundRect(ctx, x, y, w, h, 30);
  const panelGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  panelGrad.addColorStop(0, '#0b1220');
  panelGrad.addColorStop(0.5, '#111827');
  panelGrad.addColorStop(1, '#0f3d2e');
  ctx.fillStyle = panelGrad;
  ctx.fill();

  ctx.save();
  roundRect(ctx, x, y, w, h, 30);
  ctx.clip();
  ctx.fillStyle = 'rgba(34, 197, 94, 0.16)';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.04, w * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = ACCENT_BORDER;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 30);
  ctx.stroke();
}

interface HeroLayout {
  height: number;
  headlineLines: string[];
  closingLines: string[];
  funLines: string[];
}

function measureHeroLayout(
  ctx: CanvasRenderingContext2D,
  headline: string,
  closing: string,
  funLine: string,
  textW: number
): HeroLayout {
  const padY = 44;
  const emojiBlock = 112;
  const gapSm = 18;
  const gapMd = 28;
  const totalBlock = 112;

  ctx.font = `38px ${FONT}`;
  const headlineLines = getWrapLines(ctx, headline, textW);

  ctx.font = `34px ${FONT}`;
  const closingLines = getWrapLines(ctx, closing, textW);
  const funLines = getWrapLines(ctx, funLine, textW);

  const height =
    padY +
    emojiBlock +
    gapMd +
    blockHeight(headlineLines, 50) +
    gapSm +
    totalBlock +
    gapSm +
    blockHeight(closingLines, 44) +
    gapSm +
    blockHeight(funLines, 44) +
    padY;

  return { height, headlineLines, closingLines, funLines };
}

function drawHeroContent(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  layout: HeroLayout,
  totalKg: number,
  locale: string
) {
  const padY = 44;
  const emojiBlock = 112;
  const gapSm = 18;
  const gapMd = 28;

  const emojiCy = top + padY + emojiBlock / 2;
  drawEmojiCentered(ctx, '🏋️', cx, emojiCy, 108, 82);

  let y = top + padY + emojiBlock + gapMd + 38;
  ctx.font = `38px ${FONT}`;
  ctx.fillStyle = '#e5e7eb';
  y = drawCenteredLines(ctx, layout.headlineLines, cx, y, 50);

  y += gapSm;
  drawTotalWeight(ctx, cx, y + 84, totalKg, locale);

  y += 112 + gapSm;
  ctx.font = `34px ${FONT}`;
  ctx.fillStyle = '#cbd5e1';
  y = drawCenteredLines(ctx, layout.closingLines, cx, y, 44);

  y += gapSm;
  ctx.font = `34px ${FONT}`;
  ctx.fillStyle = '#86efac';
  drawCenteredLines(ctx, layout.funLines, cx, y, 44);
}

interface ComparisonLayout {
  height: number;
  tipLines: string[];
}

function measureComparisonLayout(
  ctx: CanvasRenderingContext2D,
  w: number,
  comparison: LiftedComparisonResult
): ComparisonLayout {
  const padY = 36;
  const iconSize = 108;
  const gapSm = 14;
  const gapMd = 22;
  const textW = w - 80;

  ctx.font = `28px ${FONT}`;
  const tipLines = getWrapLines(ctx, comparison.tip, textW);

  const height =
    padY +
    iconSize +
    gapMd +
    42 +
    gapSm +
    38 +
    gapSm +
    blockHeight(tipLines, 36) +
    padY;

  return { height, tipLines };
}

function drawComparisonCardCentered(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  comparison: LiftedComparisonResult,
  countLabel: string,
  layout: ComparisonLayout
): number {
  const cx = x + w / 2;
  const padY = 36;
  const iconSize = 108;
  const gapSm = 14;
  const gapMd = 22;
  const cardH = layout.height;

  roundRect(ctx, x, y, w, cardH, 24);
  ctx.fillStyle = 'rgba(17, 24, 39, 0.95)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  let cursorY = y + padY;
  const iconX = x + (w - iconSize) / 2;

  roundRect(ctx, iconX, cursorY, iconSize, iconSize, 20);
  ctx.fillStyle = ACCENT_SOFT;
  ctx.fill();

  drawEmojiCentered(ctx, comparison.emoji, cx, cursorY + iconSize / 2, 58);

  cursorY += iconSize + gapMd;
  ctx.font = `bold 38px ${FONT}`;
  ctx.fillStyle = '#f9fafb';
  cursorY = drawCenteredLines(ctx, [comparison.name], cx, cursorY + 32, 42);

  cursorY += gapSm;
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillStyle = ACCENT;
  cursorY = drawCenteredLines(ctx, [countLabel], cx, cursorY + 6, 38);

  cursorY += gapSm;
  ctx.font = `28px ${FONT}`;
  ctx.fillStyle = '#9ca3af';
  drawCenteredLines(ctx, layout.tipLines, cx, cursorY + 28, 36);

  return cardH;
}

interface ShareLayout {
  canvasH: number;
  contentTop: number;
  innerX: number;
  innerW: number;
  heroH: number;
  heroLayout: HeroLayout;
  comparisonH: number;
  comparisonLayout: ComparisonLayout | null;
  sectionGap: number;
  footerH: number;
}

function computeShareLayout(
  ctx: CanvasRenderingContext2D,
  input: ShareCardInput
): ShareLayout {
  const innerX = OUTER_PAD + 20;
  const innerW = CARD_W - innerX * 2;
  const textW = innerW - 72;

  const heroLayout = measureHeroLayout(
    ctx,
    input.headline,
    input.closing,
    input.funLine,
    textW
  );
  const frameInnerPad = 20;
  const sectionGap = 24;
  const footerH = 64;
  const comparisonLayout = input.comparison
    ? measureComparisonLayout(ctx, innerW, input.comparison)
    : null;
  const comparisonH = comparisonLayout?.height ?? 0;

  const contentH =
    heroLayout.height +
    (comparisonLayout ? sectionGap + comparisonH : 0) +
    sectionGap +
    footerH;

  const canvasH = OUTER_PAD * 2 + frameInnerPad * 2 + contentH;

  return {
    canvasH,
    contentTop: OUTER_PAD + frameInnerPad,
    innerX,
    innerW,
    heroH: heroLayout.height,
    heroLayout,
    comparisonH,
    comparisonLayout,
    sectionGap,
    footerH,
  };
}

/** Share card — compact height, centered hero + comparison stack. */
export async function buildLiftedShareCard(input: ShareCardInput): Promise<Blob> {
  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = CARD_W;
  measureCanvas.height = 1;
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) throw new Error('Canvas unavailable');

  const layout = computeShareLayout(measureCtx, input);

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = layout.canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const cx = CARD_W / 2;
  drawPageBackground(ctx, CARD_W, layout.canvasH);

  roundRect(ctx, OUTER_PAD, OUTER_PAD, CARD_W - OUTER_PAD * 2, layout.canvasH - OUTER_PAD * 2, 32);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const { contentTop } = layout;
  drawHeroPanel(ctx, layout.innerX, contentTop, layout.innerW, layout.heroH);
  drawHeroContent(ctx, cx, contentTop, layout.heroLayout, input.totalKg, input.locale);

  let cursorY = contentTop + layout.heroH + layout.sectionGap;
  if (input.comparison && layout.comparisonLayout) {
    const countLabel = input.labels.aboutCount(
      formatVolumeKg(input.comparison.count, input.locale),
      input.comparison.unit
    );
    cursorY += drawComparisonCardCentered(
      ctx,
      layout.innerX,
      cursorY,
      layout.innerW,
      input.comparison,
      countLabel,
      layout.comparisonLayout
    );
  }

  const footerY = contentTop + layout.heroH +
    (layout.comparisonLayout ? layout.sectionGap + layout.comparisonH : 0) +
    layout.sectionGap + 36;

  ctx.textAlign = 'center';
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillStyle = '#22c55e';
  ctx.fillText('MachineFit', cx, footerY);
  ctx.font = `26px ${FONT}`;
  ctx.fillStyle = 'rgba(134, 239, 172, 0.85)';
  ctx.fillText('#MacineFit #누적무게', cx, footerY + 36);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export share card'));
    }, 'image/png');
  });
}
