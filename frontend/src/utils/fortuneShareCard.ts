import type { FortuneScores, FortuneSection } from '@machinefit/shared';
import { drawShareBrandLockup } from '@/utils/shareBrandFooter';

export interface FortuneShareCardLabels {
  title: string;
  healthman: string;
  prLuck: string;
  recoveryLuck: string;
  tagline: string;
  hashtags: string;
}

export interface FortuneShareCardInput {
  fortune: FortuneSection;
  scores: FortuneScores;
  emoji: string;
  themeLabel: string;
  dateLabel: string;
  labels: FortuneShareCardLabels;
}

const FONT =
  '"Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, -apple-system, "Segoe UI", "Apple Color Emoji", sans-serif';

const W = 1080;
const H = 1350;

const GOLD = '#ffd24a';
const GOLD_SOFT = '#f6c453';
const ORANGE = '#ff7a3d';
const CYAN = '#45e0c8';
const GREEN = '#4ade80';
const WHITE = '#f8fafc';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxChars = 24
): string[] {
  const chars = [...text];
  const lines: string[] = [];
  let line = '';
  const push = (v: string) => {
    const t = v.trimEnd();
    if (t) lines.push(t);
  };
  for (const ch of chars) {
    const test = line + ch;
    if ((ctx.measureText(test).width > maxWidth || [...line].length >= maxChars) && line) {
      push(line);
      line = ch.trimStart();
    } else {
      line = test;
    }
  }
  if (line) push(line);
  return lines.length ? lines : [''];
}

function splitHeadline(title: string): { top: string; bottom: string | null } {
  const trimmed = title.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { top: trimmed, bottom: null };
  const last = parts[parts.length - 1]!.toUpperCase();
  if (last === 'DAY' || last === '데이' || last === 'DAY!') {
    return { top: parts[0]!, bottom: parts.slice(1).join(' ') };
  }
  if (parts.length === 2) return { top: parts[0]!, bottom: parts[1]! };
  const mid = Math.max(1, Math.ceil(parts.length / 2));
  return { top: parts.slice(0, mid).join(' '), bottom: parts.slice(mid).join(' ') };
}

function starsFilled(n: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, Math.round(n))));
}

function resolveShareBgUrl(): string {
  const base = String(import.meta.env.BASE_URL ?? '/');
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${normalized}assets/share/fortune-share-bg.png`;
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = width / height;
  let dw: number;
  let dh: number;
  let dx: number;
  let dy: number;
  if (ir > cr) {
    dh = height;
    dw = height * ir;
    dx = (width - dw) / 2;
    dy = 0;
  } else {
    dw = width;
    dh = width / ir;
    dx = 0;
    dy = (height - dh) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawFallbackAtmosphere(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, W * 0.2, H);
  bg.addColorStop(0, '#07090f');
  bg.addColorStop(0.5, '#0c121a');
  bg.addColorStop(1, '#05070b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, H * 0.32, 40, W / 2, H * 0.32, 460);
  glow.addColorStop(0, 'rgba(255, 190, 50, 0.42)');
  glow.addColorStop(0.4, 'rgba(255, 110, 20, 0.14)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.32, 460, 0, Math.PI * 2);
  ctx.fill();
}

function drawReadabilityVeils(ctx: CanvasRenderingContext2D) {
  const top = ctx.createLinearGradient(0, 0, 0, 220);
  top.addColorStop(0, 'rgba(0,0,0,0.55)');
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, 220);

  const mid = ctx.createRadialGradient(W / 2, 300, 40, W / 2, 320, 380);
  mid.addColorStop(0, 'rgba(0,0,0,0.18)');
  mid.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.arc(W / 2, 320, 380, 0, Math.PI * 2);
  ctx.fill();

  const bottom = ctx.createLinearGradient(0, H * 0.52, 0, H);
  bottom.addColorStop(0, 'rgba(0,0,0,0)');
  bottom.addColorStop(0.35, 'rgba(0,0,0,0.45)');
  bottom.addColorStop(1, 'rgba(0,0,0,0.82)');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, H * 0.5, W, H * 0.5);
}

function drawTextShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  blur = 18
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawMetricCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
  icon: string,
  label: string,
  valueMain: string,
  valueSuffix?: string
) {
  // Soft outer glow
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 22;
  roundRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = 'rgba(8, 10, 14, 0.55)';
  ctx.fill();
  ctx.restore();

  // Glass fill
  const glass = ctx.createLinearGradient(x, y, x, y + h);
  glass.addColorStop(0, 'rgba(255,255,255,0.10)');
  glass.addColorStop(0.45, 'rgba(12, 16, 22, 0.72)');
  glass.addColorStop(1, 'rgba(6, 8, 12, 0.78)');
  roundRect(ctx, x, y, w, h, 22);
  ctx.fillStyle = glass;
  ctx.fill();

  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 21);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Top sheen
  roundRect(ctx, x + 8, y + 8, w - 16, 28, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = `46px ${FONT}`;
  ctx.fillStyle = WHITE;
  ctx.fillText(icon, x + w / 2, y + 58);

  ctx.font = `700 23px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText(label, x + w / 2, y + 96);

  if (valueSuffix) {
    ctx.font = `800 42px ${FONT}`;
    const mainW = ctx.measureText(valueMain).width;
    ctx.font = `600 24px ${FONT}`;
    const sufW = ctx.measureText(valueSuffix).width;
    const total = mainW + sufW + 6;
    let cursor = x + w / 2 - total / 2;
    ctx.textAlign = 'left';
    ctx.font = `800 42px ${FONT}`;
    ctx.fillStyle = accent;
    ctx.fillText(valueMain, cursor, y + h - 30);
    cursor += mainW + 6;
    ctx.font = `600 24px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(valueSuffix, cursor, y + h - 30);
    ctx.textAlign = 'center';
  } else {
    ctx.font = `800 42px ${FONT}`;
    ctx.fillStyle = accent;
    ctx.fillText(valueMain, x + w / 2, y + h - 30);
  }
}

function drawHashtagPills(
  ctx: CanvasRenderingContext2D,
  tags: string[],
  right: number,
  centerY: number
) {
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `700 20px ${FONT}`;
  let y = centerY + ((Math.min(tags.length, 3) - 1) * 42) / 2;
  for (const tag of tags.slice(0, 3).reverse()) {
    const padX = 16;
    const tw = ctx.measureText(tag).width;
    const bw = tw + padX * 2;
    const bh = 34;
    const bx = right - bw;
    const by = y - bh / 2;
    roundRect(ctx, bx, by, bw, bh, 999);
    ctx.fillStyle = 'rgba(6, 14, 12, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = GREEN;
    ctx.fillText(tag, right - padX, y + 1);
    y -= 42;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
}

/**
 * Instagram-ready Helchang fortune share card (restored 22:27 KST / 9ca0d00d).
 * Photo background + premium typography + neon glass score cards.
 */
export async function buildFortuneShareCard(input: FortuneShareCardInput): Promise<Blob> {
  const { fortune, scores, emoji, themeLabel, dateLabel, labels } = input;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const bg = await loadImage(resolveShareBgUrl());
  if (bg) drawImageCover(ctx, bg, W, H);
  else drawFallbackAtmosphere(ctx);
  drawReadabilityVeils(ctx);

  const cx = W / 2;
  const padX = 52;
  const contentW = W - padX * 2;

  // Header
  ctx.textAlign = 'center';
  ctx.font = `800 32px ${FONT}`;
  drawTextShadow(ctx, `⚡  ${labels.title}  ⚡`, cx, 72, WHITE, 10);

  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = 'rgba(210, 216, 224, 0.88)';
  ctx.fillText(dateLabel, cx, 112);

  // Hero emoji (behind title stack)
  const emojiY = 360;
  const eg = ctx.createRadialGradient(cx, emojiY, 20, cx, emojiY, 220);
  eg.addColorStop(0, 'rgba(255, 210, 80, 0.35)');
  eg.addColorStop(0.55, 'rgba(255, 140, 30, 0.08)');
  eg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = eg;
  ctx.beginPath();
  ctx.arc(cx, emojiY, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `200px ${FONT}`;
  ctx.globalAlpha = 0.96;
  drawTextShadow(ctx, emoji, cx, emojiY + 72, WHITE, 24);
  ctx.globalAlpha = 1;

  // Headline
  const headline = fortune.keywordTitle || fortune.title;
  const { top, bottom } = splitHeadline(headline);
  const topDisplay = /[A-Za-z]/.test(top) ? top.toUpperCase() : top;
  const bottomDisplay = bottom
    ? /[A-Za-z]/.test(bottom)
      ? bottom.toUpperCase()
      : bottom
    : null;

  ctx.font = `900 100px ${FONT}`;
  drawTextShadow(ctx, topDisplay, cx, 250, '#f5f7fa', 16);

  if (bottomDisplay) {
    ctx.save();
    ctx.shadowColor = 'rgba(255, 180, 20, 0.55)';
    ctx.shadowBlur = 28;
    ctx.font = `900 italic 86px ${FONT}`;
    ctx.fillStyle = GOLD;
    ctx.fillText(bottomDisplay, cx, 340);
    ctx.restore();
  }

  // Theme ribbon
  const star = starsFilled(fortune.scoreStars);
  const themeText = star ? `${star}   ${themeLabel}   ${star}` : themeLabel;
  ctx.font = `800 30px ${FONT}`;
  const themeW = Math.min(contentW - 40, ctx.measureText(themeText).width + 64);
  const themeH = 52;
  const themeX = cx - themeW / 2;
  const themeY = 488;
  roundRect(ctx, themeX, themeY, themeW, themeH, 999);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 210, 74, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = GOLD_SOFT;
  ctx.textBaseline = 'middle';
  ctx.fillText(themeText, cx, themeY + themeH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  // Score cards
  const cardGap = 16;
  const cardW = (contentW - cardGap * 2) / 3;
  const cardH = 176;
  const cardY = 568;
  drawMetricCard(
    ctx,
    padX,
    cardY,
    cardW,
    cardH,
    GOLD,
    '💪',
    labels.healthman,
    String(scores.healthmanIndex),
    '/ 100'
  );
  drawMetricCard(
    ctx,
    padX + cardW + cardGap,
    cardY,
    cardW,
    cardH,
    ORANGE,
    '🔥',
    labels.prLuck,
    `${scores.prLuck}%`
  );
  drawMetricCard(
    ctx,
    padX + (cardW + cardGap) * 2,
    cardY,
    cardW,
    cardH,
    CYAN,
    '💚',
    labels.recoveryLuck,
    `${scores.recoveryLuck}%`
  );

  // Quote panel
  const quote = (fortune.oneLiner || fortune.headline || '').trim();
  const detailRaw = (fortune.oneLinerDetail || '').trim();
  const detail =
    detailRaw && detailRaw !== quote
      ? detailRaw
      : fortune.headline && fortune.headline !== quote
        ? fortune.headline
        : '';

  const quoteY = cardY + cardH + 28;
  const quoteH = detail ? 228 : 150;
  roundRect(ctx, padX, quoteY, contentW, quoteH, 24);
  const qGlass = ctx.createLinearGradient(padX, quoteY, padX, quoteY + quoteH);
  qGlass.addColorStop(0, 'rgba(255,255,255,0.08)');
  qGlass.addColorStop(1, 'rgba(4, 10, 12, 0.72)');
  ctx.fillStyle = qGlass;
  ctx.fill();
  ctx.strokeStyle = 'rgba(69, 224, 200, 0.55)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.font = `italic 800 38px ${FONT}`;
  ctx.fillStyle = WHITE;
  const qLines = wrapLines(ctx, `“${quote}”`, contentW - 88, 18);
  let qy = quoteY + (detail ? 64 : 82);
  for (const line of qLines.slice(0, 3)) {
    ctx.fillText(line, cx, qy);
    qy += 46;
  }

  if (detail) {
    ctx.font = `500 25px ${FONT}`;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    const dLines = wrapLines(ctx, detail, contentW - 96, 30);
    qy = quoteY + quoteH - 24 - Math.min(dLines.length, 3) * 32;
    for (const line of dLines.slice(0, 3)) {
      ctx.fillText(line, cx, qy);
      qy += 32;
    }
  }

  // Footer
  const footerY = H - 96;
  drawShareBrandLockup(ctx, padX + 4, footerY, FONT, {
    markSize: 28,
    brandSize: 24,
    domainSize: 17,
  });
  const tags = labels.hashtags.split(/\s+/).filter(Boolean);
  drawHashtagPills(ctx, tags, W - padX - 4, footerY + 6);

  // Subtle film grain (deterministic-ish light noise via sparse pixels)
  ctx.save();
  ctx.globalAlpha = 0.035;
  for (let i = 0; i < 1800; i += 1) {
    const x = (i * 97) % W;
    const y = (i * 53) % H;
    ctx.fillStyle = i % 2 === 0 ? '#fff' : '#000';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export fortune share card'));
      },
      'image/png',
      0.95
    );
  });
}
