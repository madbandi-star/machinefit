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
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

const W = 1080;
const H = 1350;

const YELLOW = '#f5c518';
const ORANGE = '#ff6a2a';
const CYAN = '#3ee0c2';
const GREEN = '#4ade80';

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function starsFilled(n: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(n)));
  return '★'.repeat(filled);
}

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
  maxChars = 22
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
    const tooWide = ctx.measureText(test).width > maxWidth;
    const tooLong = [...line].length >= maxChars;
    if ((tooWide || tooLong) && line) {
      push(line);
      line = ch.trimStart();
    } else {
      line = test;
    }
  }
  if (line) push(line);
  return lines.length ? lines : [''];
}

/** Split "SUPER SET DAY" → top SUPER / bottom SET DAY for poster hierarchy. */
function splitHeadline(title: string): { top: string; bottom: string | null } {
  const trimmed = title.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { top: trimmed, bottom: null };

  const last = parts[parts.length - 1]!.toUpperCase();
  if (last === 'DAY' && parts.length >= 2) {
    return { top: parts[0]!, bottom: parts.slice(1).join(' ') };
  }
  if (parts.length === 2) return { top: parts[0]!, bottom: parts[1]! };
  const mid = Math.max(1, Math.ceil(parts.length / 2));
  return { top: parts.slice(0, mid).join(' '), bottom: parts.slice(mid).join(' ') };
}

function drawGymAtmosphere(ctx: CanvasRenderingContext2D, rand: () => number) {
  const bg = ctx.createLinearGradient(0, 0, W * 0.3, H);
  bg.addColorStop(0, '#05070c');
  bg.addColorStop(0.45, '#0a1018');
  bg.addColorStop(1, '#060a0e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  for (const [cx, cy, r, c] of [
    [W * 0.2, H * 0.78, 340, 'rgba(40, 28, 18, 0.55)'],
    [W * 0.82, H * 0.72, 300, 'rgba(30, 24, 16, 0.5)'],
    [W * 0.5, H * 0.92, 420, 'rgba(20, 16, 12, 0.65)'],
  ] as const) {
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, r);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(W / 2, H * 0.34, 20, W / 2, H * 0.34, 420);
  glow.addColorStop(0, 'rgba(255, 196, 40, 0.38)');
  glow.addColorStop(0.35, 'rgba(255, 120, 30, 0.16)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.34, 420, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const bolts: Array<[number, number, number, number]> = [
    [W * 0.18, H * 0.22, W * 0.42, H * 0.36],
    [W * 0.82, H * 0.18, W * 0.58, H * 0.34],
    [W * 0.28, H * 0.42, W * 0.48, H * 0.3],
    [W * 0.74, H * 0.44, W * 0.55, H * 0.32],
    [W * 0.12, H * 0.36, W * 0.35, H * 0.28],
    [W * 0.9, H * 0.38, W * 0.66, H * 0.28],
  ];
  for (const [x1, y1, x2, y2] of bolts) {
    ctx.strokeStyle = 'rgba(255, 210, 60, 0.55)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const mx = (x1 + x2) / 2 + (rand() * 40 - 20);
    const my = (y1 + y2) / 2 + (rand() * 30 - 15);
    ctx.lineTo(mx, my);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 220, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  for (let i = 0; i < 48; i += 1) {
    const x = rand() * W;
    const y = H * 0.12 + rand() * H * 0.45;
    const a = 0.25 + rand() * 0.55;
    ctx.fillStyle = `rgba(255, ${180 + Math.floor(rand() * 60)}, 40, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + rand() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMetricCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  border: string,
  icon: string,
  label: string,
  value: string,
  valueAccent?: string
) {
  ctx.save();
  ctx.shadowColor = border;
  ctx.shadowBlur = 18;
  roundRect(ctx, x, y, w, h, 18);
  ctx.fillStyle = 'rgba(8, 12, 18, 0.72)';
  ctx.fill();
  ctx.restore();

  roundRect(ctx, x, y, w, h, 18);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 16);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = `48px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(icon, x + w / 2, y + 58);

  ctx.font = `700 24px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText(label, x + w / 2, y + 98);

  ctx.font = `800 40px ${FONT}`;
  if (valueAccent) {
    const parts = value.split(' / ');
    if (parts.length === 2) {
      const main = parts[0]!;
      const rest = ` / ${parts[1]}`;
      ctx.fillStyle = valueAccent;
      const mainW = ctx.measureText(main).width;
      ctx.font = `600 28px ${FONT}`;
      const restW = ctx.measureText(rest).width;
      const total = mainW + restW;
      const start = x + w / 2 - total / 2;
      ctx.font = `800 40px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(main, start, y + h - 28);
      ctx.font = `600 28px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(rest, start + mainW, y + h - 28);
      ctx.textAlign = 'center';
      return;
    }
  }
  ctx.fillStyle = '#f9fafb';
  ctx.fillText(value, x + w / 2, y + h - 28);
}

function drawHashtagPills(
  ctx: CanvasRenderingContext2D,
  tags: string[],
  right: number,
  bottomY: number
) {
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `700 22px ${FONT}`;
  let y = bottomY;
  for (const tag of tags.slice(0, 4).reverse()) {
    const padX = 18;
    const tw = ctx.measureText(tag).width;
    const bw = tw + padX * 2;
    const bh = 36;
    const bx = right - bw;
    const by = y - bh / 2;
    roundRect(ctx, bx, by, bw, bh, 999);
    ctx.fillStyle = 'rgba(10, 18, 16, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = GREEN;
    ctx.fillText(tag, right - padX, y + 1);
    y -= bh + 10;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
}

/**
 * Cinematic Helchang fortune share card — dark gym poster layout
 * matching the product share mock (hero keyword, neon score cards, quote).
 */
export async function buildFortuneShareCard(input: FortuneShareCardInput): Promise<Blob> {
  const { fortune, scores, emoji, themeLabel, dateLabel, labels } = input;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const rand = mulberry32(hashSeed(`${fortune.keyword}|${dateLabel}|${scores.healthmanIndex}`));
  drawGymAtmosphere(ctx, rand);

  const cx = W / 2;
  const padX = 56;
  const contentW = W - padX * 2;

  // Header
  ctx.textAlign = 'center';
  ctx.font = `800 34px ${FONT}`;
  ctx.fillStyle = '#f3f4f6';
  ctx.fillText(`⚡ ${labels.title} ⚡`, cx, 78);

  ctx.font = `600 26px ${FONT}`;
  ctx.fillStyle = 'rgba(180, 186, 196, 0.85)';
  ctx.fillText(dateLabel, cx, 118);

  // Hero emoji (behind headline)
  const heroY = 340;
  const eg = ctx.createRadialGradient(cx, heroY + 20, 10, cx, heroY + 20, 210);
  eg.addColorStop(0, 'rgba(255, 200, 40, 0.5)');
  eg.addColorStop(0.45, 'rgba(255, 120, 20, 0.14)');
  eg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = eg;
  ctx.beginPath();
  ctx.arc(cx, heroY + 20, 210, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `210px ${FONT}`;
  ctx.globalAlpha = 0.98;
  ctx.fillStyle = '#fff';
  ctx.fillText(emoji, cx, heroY + 90);
  ctx.globalAlpha = 1;

  // Split headline over emoji
  const headline = fortune.keywordTitle || fortune.title;
  const { top, bottom } = splitHeadline(headline);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.font = `900 96px ${FONT}`;
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(top.toUpperCase(), cx, 248);
  ctx.restore();

  if (bottom) {
    ctx.save();
    ctx.shadowColor = 'rgba(255, 170, 0, 0.65)';
    ctx.shadowBlur = 22;
    ctx.font = `900 82px ${FONT}`;
    ctx.fillStyle = YELLOW;
    ctx.fillText(bottom.toUpperCase(), cx, 336);
    ctx.restore();
  }

  // Theme + stars
  const star = starsFilled(fortune.scoreStars);
  const themeLine = star ? `${star}  ${themeLabel}  ${star}` : themeLabel;
  ctx.font = `800 34px ${FONT}`;
  ctx.fillStyle = YELLOW;
  ctx.shadowColor = 'rgba(245, 197, 24, 0.4)';
  ctx.shadowBlur = 12;
  ctx.fillText(themeLine, cx, 520);
  ctx.shadowBlur = 0;

  // Metric cards
  const cardGap = 18;
  const cardW = (contentW - cardGap * 2) / 3;
  const cardH = 168;
  const cardY = 560;
  const cards: Array<{
    border: string;
    icon: string;
    label: string;
    value: string;
    accent?: string;
  }> = [
    {
      border: YELLOW,
      icon: '💪',
      label: labels.healthman,
      value: `${scores.healthmanIndex} / 100`,
      accent: YELLOW,
    },
    {
      border: ORANGE,
      icon: '🔥',
      label: labels.prLuck,
      value: `${scores.prLuck}%`,
    },
    {
      border: CYAN,
      icon: '💚',
      label: labels.recoveryLuck,
      value: `${scores.recoveryLuck}%`,
    },
  ];

  cards.forEach((c, i) => {
    drawMetricCard(
      ctx,
      padX + i * (cardW + cardGap),
      cardY,
      cardW,
      cardH,
      c.border,
      c.icon,
      c.label,
      c.value,
      c.accent
    );
  });

  // Quote panel
  const quote = (fortune.oneLiner || fortune.headline || '').trim();
  const detailRaw = (fortune.oneLinerDetail || '').trim();
  const detail =
    detailRaw && detailRaw !== quote
      ? detailRaw
      : fortune.headline && fortune.headline !== quote
        ? fortune.headline
        : '';

  const quoteY = cardY + cardH + 36;
  const quoteH = detail ? 240 : 170;
  roundRect(ctx, padX, quoteY, contentW, quoteH, 22);
  ctx.fillStyle = 'rgba(6, 12, 16, 0.62)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(62, 224, 194, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = `italic 800 40px ${FONT}`;
  ctx.fillStyle = '#f9fafb';
  const quoteLines = wrapLines(ctx, `“${quote}”`, contentW - 80, 18);
  let qy = quoteY + (detail ? 70 : 88);
  for (const line of quoteLines.slice(0, 3)) {
    ctx.fillText(line, cx, qy);
    qy += 48;
  }

  if (detail) {
    ctx.font = `500 26px ${FONT}`;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.88)';
    const detailLines = wrapLines(ctx, detail, contentW - 90, 28);
    qy = quoteY + quoteH - 28 - Math.min(detailLines.length, 3) * 34;
    for (const line of detailLines.slice(0, 3)) {
      ctx.fillText(line, cx, qy);
      qy += 34;
    }
  }

  // Footer
  const footerY = H - 110;
  drawShareBrandLockup(ctx, padX + 8, footerY, FONT, {
    markSize: 30,
    brandSize: 26,
    domainSize: 18,
  });

  const tags = labels.hashtags.split(/\s+/).filter(Boolean);
  drawHashtagPills(ctx, tags, W - padX - 8, footerY + 8);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export fortune share card'));
    }, 'image/png');
  });
}
