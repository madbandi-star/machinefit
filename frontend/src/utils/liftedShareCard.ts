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
const OUTER_PAD = 24;

const FONT =
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

const GREEN = '#4ade80';
const GREEN_DARK = '#16a34a';
const GREEN_LIGHT = '#bbf7d0';

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

function drawGradientTextCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  baselineY: number,
  font: string,
  colors: [string, string, string]
) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText(text).width;
  const grad = ctx.createLinearGradient(cx - w / 2, baselineY - 80, cx + w / 2, baselineY + 8);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.45, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, baselineY);
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  centerY: number,
  label: string,
  opts: { bg: string; border: string; color: string; fontSize?: number; padX?: number }
) {
  const fontSize = opts.fontSize ?? 24;
  ctx.font = `bold ${fontSize}px ${FONT}`;
  const textW = ctx.measureText(label).width;
  const padX = opts.padX ?? 28;
  const pillW = textW + padX * 2;
  const pillH = fontSize + 22;
  const x = cx - pillW / 2;
  const y = centerY - pillH / 2;

  roundRect(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.fillStyle = opts.bg;
  ctx.fill();
  ctx.strokeStyle = opts.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = opts.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, centerY + 1);
  ctx.textBaseline = 'alphabetic';
}

function drawPageBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, '#030712');
  base.addColorStop(0.35, '#0a1628');
  base.addColorStop(0.7, '#071a14');
  base.addColorStop(1, '#041510');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const blobs = [
    { x: width * 0.15, y: height * 0.08, r: 340, c: 'rgba(34, 197, 94, 0.14)' },
    { x: width * 0.88, y: height * 0.22, r: 280, c: 'rgba(74, 222, 128, 0.08)' },
    { x: width * 0.5, y: height * 0.55, r: 420, c: 'rgba(16, 185, 129, 0.06)' },
    { x: width * 0.2, y: height * 0.88, r: 260, c: 'rgba(34, 197, 94, 0.07)' },
  ];
  for (const b of blobs) {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, b.c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  for (let gy = 48; gy < height; gy += 48) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }
}

function drawGlassCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  roundRect(ctx, x, y, w, h, radius);
  const fill = ctx.createLinearGradient(x, y, x + w, y + h);
  fill.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
  fill.addColorStop(0.5, 'rgba(10, 18, 32, 0.88)');
  fill.addColorStop(1, 'rgba(8, 20, 18, 0.9)');
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.strokeStyle = 'rgba(74, 222, 128, 0.22)';
  ctx.lineWidth = 2;
  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, radius - 1);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 3, y + 3, w - 6, h - 6, radius - 2);
  ctx.stroke();
}

function drawStatShowcase(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  totalKg: number,
  closingLines: string[],
  locale: string
): number {
  const panelH = 200;
  const panelX = cx - w / 2;
  roundRect(ctx, panelX, y, w, panelH, 28);
  const inset = ctx.createLinearGradient(panelX, y, panelX, y + panelH);
  inset.addColorStop(0, 'rgba(34, 197, 94, 0.12)');
  inset.addColorStop(0.5, 'rgba(15, 23, 42, 0.55)');
  inset.addColorStop(1, 'rgba(34, 197, 94, 0.06)');
  ctx.fillStyle = inset;
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const ringCy = y + panelH / 2 - 8;
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, ringCy, 118, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(167, 243, 208, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, ringCy, 108, -Math.PI * 0.72, Math.PI * 0.15);
  ctx.stroke();

  const numText = formatVolumeKg(totalKg, locale);
  ctx.font = `900 112px ${FONT}`;
  const numW = ctx.measureText(numText).width;
  drawGradientTextCentered(
    ctx,
    numText,
    cx,
    ringCy + 28,
    `900 112px ${FONT}`,
    [GREEN_LIGHT, GREEN, GREEN_DARK]
  );

  ctx.font = `800 44px ${FONT}`;
  ctx.fillStyle = '#86efac';
  ctx.textAlign = 'left';
  ctx.fillText('KG', cx + numW / 2 + 14, ringCy + 18);
  ctx.textAlign = 'center';

  ctx.font = `500 32px ${FONT}`;
  ctx.fillStyle = 'rgba(226, 232, 240, 0.88)';
  drawCenteredLines(ctx, closingLines, cx, y + panelH - 28, 40);

  return panelH;
}

function drawFunQuoteBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  lines: string[]
): number {
  const padY = 22;
  const lineH = 40;
  const boxH = padY * 2 + blockHeight(lines, lineH);

  roundRect(ctx, cx - w / 2, y, w, boxH, 20);
  ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(134, 239, 172, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = `italic 500 30px ${FONT}`;
  ctx.fillStyle = '#86efac';
  drawCenteredLines(ctx, lines, cx, y + padY + 28, lineH);

  return boxH;
}

interface HeroLayout {
  height: number;
  badgeH: number;
  headlineLines: string[];
  closingLines: string[];
  funLines: string[];
}

function measureHeroLayout(
  ctx: CanvasRenderingContext2D,
  headline: string,
  closing: string,
  funLine: string,
  textW: number,
  statW: number
): HeroLayout {
  const badgeH = 52;
  const gapMd = 24;
  const gapSm = 18;
  const statH = 200;
  const funW = statW;

  ctx.font = `36px ${FONT}`;
  const headlineLines = getWrapLines(ctx, headline, textW);
  ctx.font = `500 32px ${FONT}`;
  const closingLines = getWrapLines(ctx, closing, statW - 64);
  ctx.font = `italic 500 30px ${FONT}`;
  const funLines = getWrapLines(ctx, funLine, funW - 48);

  const height =
    36 +
    badgeH +
    gapMd +
    88 +
    gapSm +
    blockHeight(headlineLines, 48) +
    gapMd +
    statH +
    gapMd +
    44 +
    blockHeight(funLines, 40) +
    36;

  return { height, badgeH, headlineLines, closingLines, funLines };
}

function drawHeroContent(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  innerW: number,
  layout: HeroLayout,
  totalKg: number,
  locale: string
) {
  const statW = innerW - 48;
  let y = top + 36;

  const badgeLabel = locale === 'ko' ? '🏋️  누적 무게' : '🏋️  TOTAL LIFTED';
  drawPill(ctx, cx, y + layout.badgeH / 2, badgeLabel, {
    bg: 'rgba(34, 197, 94, 0.14)',
    border: 'rgba(74, 222, 128, 0.35)',
    color: GREEN_LIGHT,
    fontSize: 26,
    padX: 32,
  });
  y += layout.badgeH + 24;

  const emojiCy = y + 44;
  const halo = ctx.createRadialGradient(cx, emojiCy, 0, cx, emojiCy, 72);
  halo.addColorStop(0, 'rgba(74, 222, 128, 0.45)');
  halo.addColorStop(0.55, 'rgba(34, 197, 94, 0.12)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, emojiCy, 72, 0, Math.PI * 2);
  ctx.fill();
  drawEmojiCentered(ctx, '🏋️', cx, emojiCy, 96);
  y += 88 + 18;

  ctx.font = `36px ${FONT}`;
  ctx.fillStyle = 'rgba(241, 245, 249, 0.92)';
  y = drawCenteredLines(ctx, layout.headlineLines, cx, y + 34, 48);

  y += 24;
  y += drawStatShowcase(ctx, cx, y, statW, totalKg, layout.closingLines, locale);

  y += 24;
  drawFunQuoteBox(ctx, cx, y, statW, layout.funLines);
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
  const padY = 32;
  const iconSize = 100;
  const gapMd = 20;
  const textW = w - 96;

  ctx.font = `28px ${FONT}`;
  const tipLines = getWrapLines(ctx, comparison.tip, textW);

  const height =
    padY +
    36 +
    gapMd +
    iconSize +
    gapMd +
    40 +
    14 +
    36 +
    14 +
    blockHeight(tipLines, 34) +
    padY;

  return { height, tipLines };
}

function drawComparisonPremium(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  comparison: LiftedComparisonResult,
  countLabel: string,
  layout: ComparisonLayout,
  locale: string
): number {
  const cx = x + w / 2;
  const cardH = layout.height;

  roundRect(ctx, x, y, w, cardH, 26);
  const cardFill = ctx.createLinearGradient(x, y, x, y + cardH);
  cardFill.addColorStop(0, 'rgba(17, 24, 39, 0.95)');
  cardFill.addColorStop(1, 'rgba(10, 20, 18, 0.92)');
  ctx.fillStyle = cardFill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  let cursorY = y + 32;
  const sectionLabel = locale === 'ko' ? '이 무게는 어느 정도?' : 'HOW HEAVY IS THAT?';
  drawPill(ctx, cx, cursorY + 18, sectionLabel, {
    bg: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.12)',
    color: 'rgba(203, 213, 225, 0.9)',
    fontSize: 22,
    padX: 24,
  });
  cursorY += 36 + 20;

  const iconSize = 100;
  const iconX = cx - iconSize / 2;

  roundRect(ctx, iconX, cursorY, iconSize, iconSize, 22);
  const iconBg = ctx.createLinearGradient(iconX, cursorY, iconX, cursorY + iconSize);
  iconBg.addColorStop(0, 'rgba(74, 222, 128, 0.22)');
  iconBg.addColorStop(1, 'rgba(34, 197, 94, 0.08)');
  ctx.fillStyle = iconBg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawEmojiCentered(ctx, comparison.emoji, cx, cursorY + iconSize / 2, 54);
  cursorY += iconSize + 20;

  ctx.font = `bold 40px ${FONT}`;
  ctx.fillStyle = '#f8fafc';
  cursorY = drawCenteredLines(ctx, [comparison.name], cx, cursorY + 32, 44);

  cursorY += 14;
  drawPill(ctx, cx, cursorY + 18, countLabel, {
    bg: 'rgba(34, 197, 94, 0.18)',
    border: 'rgba(74, 222, 128, 0.4)',
    color: GREEN,
    fontSize: 30,
    padX: 36,
  });
  cursorY += 36 + 14;

  ctx.font = `28px ${FONT}`;
  ctx.fillStyle = 'rgba(148, 163, 184, 0.95)';
  drawCenteredLines(ctx, layout.tipLines, cx, cursorY + 26, 34);

  return cardH;
}

function drawFooter(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, y);
  ctx.lineTo(cx + w / 2, y);
  ctx.stroke();

  ctx.textAlign = 'center';
  drawGradientTextCentered(ctx, 'MachineFit', cx, y + 48, `800 32px ${FONT}`, [
    GREEN_LIGHT,
    GREEN,
    '#22c55e',
  ]);

  ctx.font = `24px ${FONT}`;
  ctx.fillStyle = 'rgba(134, 239, 172, 0.75)';
  ctx.fillText('#MacineFit #누적무게', cx, y + 88);
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
  const innerX = OUTER_PAD + 16;
  const innerW = CARD_W - innerX * 2;
  const textW = innerW - 80;
  const statW = innerW - 48;

  const heroLayout = measureHeroLayout(
    ctx,
    input.headline,
    input.closing,
    input.funLine,
    textW,
    statW
  );
  const frameInnerPad = 16;
  const sectionGap = 20;
  const footerH = 108;
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

/** Premium share card — achievement-style layout for social bragging. */
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

  drawGlassCard(
    ctx,
    OUTER_PAD,
    OUTER_PAD,
    CARD_W - OUTER_PAD * 2,
    layout.canvasH - OUTER_PAD * 2,
    36
  );

  const { contentTop, innerX, innerW } = layout;
  drawHeroContent(
    ctx,
    cx,
    contentTop,
    innerW,
    layout.heroLayout,
    input.totalKg,
    input.locale
  );

  let cursorY = contentTop + layout.heroH + layout.sectionGap;
  if (input.comparison && layout.comparisonLayout) {
    const countLabel = input.labels.aboutCount(
      formatVolumeKg(input.comparison.count, input.locale),
      input.comparison.unit
    );
    cursorY += drawComparisonPremium(
      ctx,
      innerX,
      cursorY,
      innerW,
      input.comparison,
      countLabel,
      layout.comparisonLayout,
      input.locale
    );
  }

  const footerY =
    contentTop +
    layout.heroH +
    (layout.comparisonLayout ? layout.sectionGap + layout.comparisonH : 0) +
    layout.sectionGap;

  drawFooter(ctx, cx, footerY, innerW - 80);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export share card'));
    }, 'image/png');
  });
}
