import type { LiftedComparisonResult } from '@machinefit/shared';
import { formatVolumeKg } from '@machinefit/shared';

export interface LiftedShareCardLabels {
  aboutCount: (count: string, unit: string) => string;
  shareClosing: string;
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
const ACCENT_SOFT = 'rgba(34, 197, 94, 0.16)';
const ACCENT_BORDER = 'rgba(34, 197, 94, 0.22)';

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const chars = [...text];
  let line = '';
  let cursorY = y;

  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = ch;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }

  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }

  return cursorY;
}

function drawPageBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width * 0.2, height);
  gradient.addColorStop(0, '#0b1220');
  gradient.addColorStop(0.5, '#111827');
  gradient.addColorStop(1, '#0f3d2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(34, 197, 94, 0.14)';
  ctx.beginPath();
  ctx.arc(width * 0.88, height * 0.14, 300, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
  ctx.beginPath();
  ctx.arc(width * 0.12, height * 0.78, 280, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeroPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  roundRect(ctx, x, y, w, h, 32);
  const panelGrad = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
  panelGrad.addColorStop(0, '#0b1220');
  panelGrad.addColorStop(0.55, '#111827');
  panelGrad.addColorStop(1, '#0f3d2e');
  ctx.fillStyle = panelGrad;
  ctx.fill();

  ctx.save();
  roundRect(ctx, x, y, w, h, 32);
  ctx.clip();
  ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
  ctx.beginPath();
  ctx.arc(x + w * 0.92, y + h * 0.08, w * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(74, 222, 128, 0.12)';
  ctx.beginPath();
  ctx.arc(x + w * 0.78, y + h * 0.92, w * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = ACCENT_BORDER;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 32);
  ctx.stroke();
}

function drawEmojiGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius);
  glow.addColorStop(0, 'rgba(74, 222, 128, 0.32)');
  glow.addColorStop(0.55, 'rgba(34, 197, 94, 0.12)');
  glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawTotalWeight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  totalKg: number,
  locale: string
) {
  const numText = formatVolumeKg(totalKg, locale);
  ctx.font = `800 108px ${FONT}`;
  const numW = ctx.measureText(numText).width;
  ctx.font = `700 44px ${FONT}`;
  const unitW = ctx.measureText('KG').width;
  const gap = 16;
  const startX = cx - (numW + gap + unitW) / 2;

  ctx.textAlign = 'left';
  ctx.font = `800 108px ${FONT}`;
  ctx.fillStyle = ACCENT;
  ctx.fillText(numText, startX, y);

  ctx.font = `700 44px ${FONT}`;
  ctx.fillStyle = '#86efac';
  ctx.fillText('KG', startX + numW + gap, y - 8);
  ctx.textAlign = 'center';
}

function drawComparisonCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  comparison: LiftedComparisonResult,
  countLabel: string
) {
  const iconSize = 104;
  const pad = 28;
  const bodyX = x + pad + iconSize + 24;
  const bodyW = w - pad * 2 - iconSize - 24;

  ctx.font = `bold 36px ${FONT}`;
  const nameH = measureWrapHeight(ctx, comparison.name, bodyW, 44);
  ctx.font = `32px ${FONT}`;
  const countH = 40;
  ctx.font = `28px ${FONT}`;
  const tipH = measureWrapHeight(ctx, comparison.tip, bodyW, 38);

  const contentH = Math.max(iconSize, nameH + countH + tipH + 12);
  const cardH = contentH + pad * 2;

  roundRect(ctx, x, y, w, cardH, 24);
  ctx.fillStyle = 'rgba(17, 24, 39, 0.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const iconY = y + pad + (contentH - iconSize) / 2;
  roundRect(ctx, x + pad, iconY, iconSize, iconSize, 20);
  ctx.fillStyle = ACCENT_SOFT;
  ctx.fill();
  ctx.font = `56px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(comparison.emoji, x + pad + iconSize / 2, iconY + iconSize / 2 + 20);

  const textTop = y + pad + (contentH - (nameH + countH + tipH + 12)) / 2;
  ctx.textAlign = 'left';
  ctx.font = `bold 36px ${FONT}`;
  ctx.fillStyle = '#f9fafb';
  wrapText(ctx, comparison.name, bodyX, textTop + 34, bodyW, 44);

  ctx.font = `bold 32px ${FONT}`;
  ctx.fillStyle = ACCENT;
  ctx.fillText(countLabel, bodyX, textTop + nameH + 44);

  ctx.font = `28px ${FONT}`;
  ctx.fillStyle = '#9ca3af';
  wrapText(ctx, comparison.tip, bodyX, textTop + nameH + countH + 56, bodyW, 38);

  ctx.textAlign = 'center';
  return cardH;
}

function measureComparisonCardHeight(
  ctx: CanvasRenderingContext2D,
  w: number,
  comparison: LiftedComparisonResult
): number {
  const iconSize = 104;
  const pad = 28;
  const bodyW = w - pad * 2 - iconSize - 24;

  ctx.font = `bold 36px ${FONT}`;
  const nameH = measureWrapHeight(ctx, comparison.name, bodyW, 44);
  ctx.font = `28px ${FONT}`;
  const tipH = measureWrapHeight(ctx, comparison.tip, bodyW, 38);
  const contentH = Math.max(iconSize, nameH + 40 + tipH + 12);
  return contentH + pad * 2;
}

/** Share card — matches lifted-weight hero + comparison card for social sharing. */
export async function buildLiftedShareCard(input: ShareCardInput): Promise<Blob> {
  const { headline, totalKg, closing, funLine, comparison, locale, labels } = input;
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  drawPageBackground(ctx, width, height);

  const cardX = 48;
  const cardY = 48;
  const cardW = width - cardX * 2;
  const cardH = height - cardY * 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 40);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const cx = width / 2;
  const innerX = cardX + 56;
  const innerW = cardW - 112;
  const heroPadX = 48;
  const heroInnerW = innerW - heroPadX * 2;

  ctx.textAlign = 'center';

  ctx.font = `36px ${FONT}`;
  const headlineH = measureWrapHeight(ctx, headline, heroInnerW, 50);
  ctx.font = `32px ${FONT}`;
  const closingH = measureWrapHeight(ctx, closing, heroInnerW, 44);
  ctx.font = `32px ${FONT}`;
  const funH = measureWrapHeight(ctx, funLine, heroInnerW, 44);

  const emojiZone = 140;
  const totalRowH = 120;
  const gapSm = 20;
  const gapMd = 32;
  const heroContentH =
    emojiZone + gapMd + headlineH + gapSm + totalRowH + gapSm + closingH + gapSm + funH + 48;
  const comparisonBlockH = comparison
    ? measureComparisonCardHeight(ctx, innerW, comparison) + gapMd * 2
    : gapMd;
  const footerH = 96;

  const blockHeight = heroContentH + comparisonBlockH + footerH;
  const verticalBias = 24;
  const blockTop = cardY + Math.max(72, (cardH - blockHeight) / 2 + verticalBias);

  drawHeroPanel(ctx, innerX, blockTop, innerW, heroContentH);

  let y = blockTop + 36;
  drawEmojiGlow(ctx, cx, y + 28, 88);
  ctx.font = `120px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🏋️', cx, y + 88);

  y += emojiZone + gapMd;
  ctx.font = `36px ${FONT}`;
  ctx.fillStyle = '#e5e7eb';
  y = wrapText(ctx, headline, cx, y, heroInnerW, 50);

  y += gapSm;
  drawTotalWeight(ctx, cx, y + 88, totalKg, locale);

  y += totalRowH + gapSm;
  ctx.font = `32px ${FONT}`;
  ctx.fillStyle = '#cbd5e1';
  y = wrapText(ctx, closing, cx, y, heroInnerW, 44);

  y += gapSm;
  ctx.font = `32px ${FONT}`;
  ctx.fillStyle = '#86efac';
  wrapText(ctx, funLine, cx, y, heroInnerW, 44);

  let cursorY = blockTop + heroContentH + gapMd;
  if (comparison) {
    const countLabel = labels.aboutCount(
      formatVolumeKg(comparison.count, locale),
      comparison.unit
    );
    cursorY += drawComparisonCard(ctx, innerX, cursorY, innerW, comparison, countLabel);
  }

  const footerY = blockTop + blockHeight - footerH + 28;
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillStyle = '#22c55e';
  ctx.fillText('MachineFit', cx, footerY);
  ctx.font = `24px ${FONT}`;
  ctx.fillStyle = 'rgba(134, 239, 172, 0.78)';
  ctx.fillText('#MacineFit #누적무게', cx, footerY + 34);
  ctx.font = `22px ${FONT}`;
  ctx.fillStyle = 'rgba(203, 213, 225, 0.72)';
  ctx.fillText(labels.shareClosing, cx, footerY + 64);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export share card'));
    }, 'image/png');
  });
}
