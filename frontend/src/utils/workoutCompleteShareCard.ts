import {
  formatVolumeKg,
  formatWorkoutDateDots,
  formatWorkoutDurationCompact,
  type WorkoutCompleteReport,
} from '@machinefit/shared';
import { drawShareBrandLockup } from '@/utils/shareBrandFooter';
import {
  pickRandomWorkoutShareTheme,
  type WorkoutShareTheme,
} from '@/utils/workoutCompleteShareThemes';

export interface WorkoutCompleteShareLabels {
  title: string;
  exercises: string;
  sets: string;
  volume: string;
  power: string;
  newRecord: string;
  keepGoing: string;
  hashtags: string;
}

const FONT =
  '"Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, -apple-system, "Segoe UI", "Apple Color Emoji", sans-serif';

const W = 1080;
const H = 1350;

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

function resolveBgUrl(bgFile: string): string {
  const base = String(import.meta.env.BASE_URL ?? '/');
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${normalized}assets/share/workout/${bgFile}`;
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

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = width / height;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (ir > cr) {
    sw = img.naturalHeight * cr;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / cr;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
}

function drawGradientBg(ctx: CanvasRenderingContext2D, theme: WorkoutShareTheme) {
  const g = ctx.createLinearGradient(0, 0, W * 0.15, H);
  g.addColorStop(0, theme.bgTop);
  g.addColorStop(0.55, theme.bgMid);
  g.addColorStop(1, theme.bgBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawCarbonTexture(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 28) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, n = 120) {
  ctx.save();
  for (let i = 0; i < n; i += 1) {
    const x = (i * 97) % W;
    const y = (i * 53) % H;
    const a = 0.15 + ((i * 17) % 50) / 100;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
  ctx.restore();
}

function drawSplatter(ctx: CanvasRenderingContext2D, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  const blobs = [
    [180, 420, 18],
    [900, 380, 22],
    [240, 980, 14],
    [820, 900, 20],
    [500, 1100, 12],
    [140, 700, 10],
    [960, 640, 16],
  ] as const;
  for (const [x, y, r] of blobs) {
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  len = 36
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len, y);
  ctx.moveTo(x + w - len, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + len);
  ctx.moveTo(x + w, y + h - len);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - len, y + h);
  ctx.moveTo(x + len, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h - len);
  ctx.stroke();
  ctx.restore();
}

function drawHeroGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 220);
  g.addColorStop(0, color);
  g.addColorStop(0.55, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 220, 0, Math.PI * 2);
  ctx.fill();
}

function drawTextGlow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  blur = 18
) {
  ctx.save();
  ctx.shadowColor = fill;
  ctx.shadowBlur = blur;
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawHashtags(
  ctx: CanvasRenderingContext2D,
  tags: string[],
  right: number,
  top: number,
  color: string
) {
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `600 22px ${FONT}`;
  ctx.fillStyle = color;
  tags.forEach((tag, i) => {
    ctx.fillText(tag, right, top + i * 26);
  });
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  theme: WorkoutShareTheme,
  hashtags: string,
  padX = 72
) {
  const tags = hashtags.split(/\s+/).filter(Boolean);
  const footerY = H - 110;
  drawShareBrandLockup(ctx, padX, footerY, FONT, {
    markSize: 28,
    brandSize: 24,
    domainSize: 17,
  });
  drawHashtags(ctx, tags, W - padX, footerY - 4, theme.hashtag);
}

type StatRow = { label: string; value: string; color: string };

function buildStats(
  report: WorkoutCompleteReport,
  labels: WorkoutCompleteShareLabels,
  theme: WorkoutShareTheme
): StatRow[] {
  return [
    {
      label: `${labels.exercises} TOTAL`,
      value: String(report.summary.exerciseCount),
      color: theme.accent,
    },
    {
      label: `${labels.sets} TOTAL`,
      value: String(report.summary.setCount),
      color: theme.accent2,
    },
    {
      label: `KG TOTAL ${labels.volume}`,
      value: formatVolumeKg(report.summary.totalVolumeKg),
      color: theme.accent3,
    },
  ];
}

function drawHeaderBlock(
  ctx: CanvasRenderingContext2D,
  theme: WorkoutShareTheme,
  title: string,
  dateLabel: string,
  opts?: { italic?: boolean; brush?: boolean; framed?: boolean; gradientTitle?: boolean }
) {
  const cx = W / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = theme.brand;
  ctx.fillText('MACHINE FIT', cx, 88);

  if (opts?.framed) {
    const boxW = 720;
    const boxH = 88;
    const bx = cx - boxW / 2;
    const by = 118;
    roundRect(ctx, bx, by, boxW, boxH, 10);
    ctx.strokeStyle = theme.panelStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawCornerBrackets(ctx, bx - 8, by - 8, boxW + 16, boxH + 16, theme.accent, 28);
    ctx.font = `900 48px ${FONT}`;
    ctx.fillStyle = theme.title;
    ctx.fillText(title, cx, by + 60);
  } else if (opts?.brush) {
    ctx.save();
    ctx.translate(cx, 175);
    ctx.rotate((-4 * Math.PI) / 180);
    ctx.font = `900 italic 58px ${FONT}`;
    drawTextGlow(ctx, title, 0, 0, theme.title, 12);
    ctx.restore();
  } else if (opts?.italic) {
    ctx.save();
    ctx.translate(cx, 170);
    ctx.rotate((-6 * Math.PI) / 180);
    ctx.font = `900 italic 56px ${FONT}`;
    drawTextGlow(ctx, title, 0, 0, theme.title, 10);
    ctx.restore();
  } else if (opts?.gradientTitle) {
    ctx.font = `900 54px ${FONT}`;
    const grad = ctx.createLinearGradient(cx - 280, 0, cx + 280, 0);
    grad.addColorStop(0, theme.accent3);
    grad.addColorStop(0.45, theme.accent2);
    grad.addColorStop(1, theme.accent);
    ctx.fillStyle = grad;
    ctx.fillText(title, cx, 168);
  } else {
    ctx.font = `900 54px ${FONT}`;
    ctx.fillStyle = theme.title;
    ctx.fillText(title, cx, 168);
  }

  ctx.font = `600 28px ${FONT}`;
  ctx.fillStyle = theme.date;
  ctx.fillText(dateLabel, cx, 230);

  // date rails
  const dw = ctx.measureText(dateLabel).width;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - dw / 2 - 80, 222);
  ctx.lineTo(cx - dw / 2 - 16, 222);
  ctx.moveTo(cx + dw / 2 + 16, 222);
  ctx.lineTo(cx + dw / 2 + 80, 222);
  ctx.stroke();
}

function drawStatStack(
  ctx: CanvasRenderingContext2D,
  stats: StatRow[],
  y0: number,
  theme: WorkoutShareTheme,
  glass = true
) {
  const padX = 96;
  const rowH = 86;
  const gap = 14;
  stats.forEach((s, i) => {
    const y = y0 + i * (rowH + gap);
    if (glass) {
      roundRect(ctx, padX, y, W - padX * 2, rowH, 18);
      ctx.fillStyle = theme.panel;
      ctx.fill();
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
    ctx.font = `700 26px ${FONT}`;
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText(s.label.toUpperCase(), padX + 36, y + 52);
    ctx.textAlign = 'right';
    ctx.font = `900 44px ${FONT}`;
    ctx.fillStyle = s.color;
    ctx.fillText(s.value, W - padX - 36, y + 56);
  });
  return y0 + stats.length * (rowH + gap);
}

function drawStatColumns(
  ctx: CanvasRenderingContext2D,
  stats: StatRow[],
  y: number
) {
  const colW = 280;
  const startX = (W - colW * 3) / 2;
  stats.forEach((s, i) => {
    const x = startX + i * colW + colW / 2;
    ctx.textAlign = 'center';
    ctx.font = `900 48px ${FONT}`;
    ctx.fillStyle = s.color;
    ctx.fillText(s.value, x, y);
    ctx.font = `700 22px ${FONT}`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(s.label.toUpperCase(), x, y + 40);
  });
}

function drawPowerPill(
  ctx: CanvasRenderingContext2D,
  theme: WorkoutShareTheme,
  labels: WorkoutCompleteShareLabels,
  report: WorkoutCompleteReport,
  y: number,
  style: 'pill' | 'box' | 'brush' | 'plain' = 'box'
) {
  if (!report.power) return y;
  const text = `${labels.power}  ${report.power.balance}`;
  const cx = W / 2;
  ctx.textAlign = 'center';

  if (style === 'plain') {
    ctx.font = `900 40px ${FONT}`;
    drawTextGlow(ctx, `⚡ ${text}`, cx, y + 40, theme.power, 12);
    return y + 70;
  }

  if (style === 'brush') {
    const bw = 420;
    const bh = 72;
    ctx.save();
    ctx.translate(cx, y + bh / 2);
    ctx.rotate((-2 * Math.PI) / 180);
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.moveTo(-bw / 2, -bh / 2 + 8);
    ctx.lineTo(bw / 2, -bh / 2);
    ctx.lineTo(bw / 2 - 10, bh / 2);
    ctx.lineTo(-bw / 2 + 6, bh / 2 + 4);
    ctx.closePath();
    ctx.fill();
    ctx.font = `900 36px ${FONT}`;
    ctx.fillStyle = theme.power;
    ctx.fillText(`⚡ ${text}`, 0, 12);
    ctx.restore();
    return y + 90;
  }

  const pw = style === 'pill' ? 420 : 520;
  const ph = 78;
  const px = cx - pw / 2;
  roundRect(ctx, px, y, pw, ph, style === 'pill' ? 999 : 16);
  ctx.fillStyle = theme.panel;
  ctx.fill();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = style === 'pill' ? 2.5 : 3;
  ctx.shadowColor = theme.heroGlow;
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = `900 36px ${FONT}`;
  ctx.fillStyle = theme.power;
  ctx.fillText(`⚡ ${text}`, cx, y + 50);
  return y + 100;
}

function drawKeepGoing(
  ctx: CanvasRenderingContext2D,
  theme: WorkoutShareTheme,
  text: string,
  y: number,
  brush = false
) {
  const cx = W / 2;
  ctx.textAlign = 'center';
  if (brush) {
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate((-5 * Math.PI) / 180);
    ctx.font = `900 italic 42px ${FONT}`;
    drawTextGlow(ctx, `>>>  ${text}  <<<`, 0, 0, theme.keepGoing, 10);
    ctx.restore();
  } else {
    ctx.font = `800 34px ${FONT}`;
    ctx.fillStyle = theme.keepGoing;
    ctx.fillText(text, cx, y);
  }
}

function drawNewRecord(
  ctx: CanvasRenderingContext2D,
  labels: WorkoutCompleteShareLabels,
  report: WorkoutCompleteReport,
  y: number
) {
  if (!report.newRecord) return;
  ctx.textAlign = 'center';
  ctx.font = `800 28px ${FONT}`;
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`🔥 ${labels.newRecord}`, W / 2, y);
}

async function paintBase(
  ctx: CanvasRenderingContext2D,
  theme: WorkoutShareTheme
) {
  if (theme.bgFile) {
    const img = await loadImage(resolveBgUrl(theme.bgFile));
    if (img) {
      drawCover(ctx, img, W, H);
      // readability veil
      const veil = ctx.createLinearGradient(0, 0, 0, H);
      veil.addColorStop(0, 'rgba(0,0,0,0.55)');
      veil.addColorStop(0.45, 'rgba(0,0,0,0.35)');
      veil.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, W, H);
      return;
    }
  }
  drawGradientBg(ctx, theme);
  if (theme.layout === 'sport' || theme.layout === 'grunge') drawCarbonTexture(ctx);
  if (theme.layout === 'cosmic') {
    drawStars(ctx, 160);
    const neb = ctx.createRadialGradient(W * 0.3, H * 0.35, 40, W * 0.45, H * 0.4, 420);
    neb.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
    neb.addColorStop(0.5, 'rgba(59, 130, 246, 0.18)');
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, W, H);
  }
  if (theme.layout === 'heat') {
    const heat = ctx.createRadialGradient(W * 0.85, H * 0.55, 20, W * 0.7, H * 0.6, 520);
    heat.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
    heat.addColorStop(0.5, 'rgba(239, 68, 68, 0.12)');
    heat.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = heat;
    ctx.fillRect(0, 0, W, H);
  }
  if (theme.layout === 'grunge') drawSplatter(ctx, theme.accent);
}

/**
 * TODAY'S WORKOUT share card — visual themes only (10 mock variants, random pick).
 * Does not change report data or share business logic.
 */
export async function buildWorkoutCompleteShareCard(input: {
  report: WorkoutCompleteReport;
  labels: WorkoutCompleteShareLabels;
}): Promise<Blob> {
  const { report, labels } = input;
  const theme = pickRandomWorkoutShareTheme();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  await paintBase(ctx, theme);

  const dateLabel = formatWorkoutDateDots(report.dateKey);
  const duration = formatWorkoutDurationCompact(report.summary.durationMs);
  const stats = buildStats(report, labels, theme);
  const cx = W / 2;
  const layout = theme.layout;

  if (layout === 'neonFrame') {
    roundRect(ctx, 48, 48, W - 96, H - 96, 28);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 4;
    ctx.shadowColor = theme.heroGlow;
    ctx.shadowBlur = 24;
    ctx.stroke();
    ctx.shadowBlur = 0;
    drawCornerBrackets(ctx, 64, 64, W - 128, H - 128, theme.accent2, 42);
  }

  // Header variants
  drawHeaderBlock(ctx, theme, labels.title, dateLabel, {
    italic: layout === 'sport',
    brush: layout === 'grunge',
    framed: layout === 'hud',
    gradientTitle: layout === 'cosmic',
  });

  // Hero duration
  const heroY = layout === 'gauge' ? 520 : 430;
  drawHeroGlow(ctx, cx, heroY - 40, theme.heroGlow);

  if (layout === 'gauge') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(cx, heroY - 20, 160, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.shadowColor = theme.heroGlow;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, heroY - 20, 160, -Math.PI * 0.85, Math.PI * 0.55);
    ctx.stroke();
    ctx.restore();
  }

  ctx.textAlign = 'center';
  ctx.font =
    layout === 'grunge'
      ? `900 italic 130px ${FONT}`
      : layout === 'sport'
        ? `900 italic 120px ${FONT}`
        : `900 120px ${FONT}`;
  if (layout === 'cosmic') {
    const grad = ctx.createLinearGradient(cx - 160, heroY - 80, cx + 160, heroY + 40);
    grad.addColorStop(0, theme.accent3);
    grad.addColorStop(0.5, theme.accent2);
    grad.addColorStop(1, '#fda4af');
    ctx.fillStyle = grad;
    ctx.shadowColor = theme.heroGlow;
    ctx.shadowBlur = 28;
    ctx.fillText(duration, cx, heroY);
    ctx.shadowBlur = 0;
  } else if (layout === 'heat') {
    const grad = ctx.createLinearGradient(cx, heroY - 90, cx, heroY + 20);
    grad.addColorStop(0, '#fdba74');
    grad.addColorStop(1, '#ef4444');
    drawTextGlow(ctx, duration, cx, heroY, theme.hero, 28);
    ctx.fillStyle = grad;
    ctx.fillText(duration, cx, heroY);
  } else {
    drawTextGlow(ctx, duration, cx, heroY, theme.hero, 26);
  }

  let y = heroY + 70;

  if (layout === 'gauge') {
    drawStatColumns(ctx, stats, y + 40);
    y += 140;
  } else if (layout === 'minimal' || layout === 'sport' || layout === 'photo') {
    ctx.font = `800 34px ${FONT}`;
    for (const s of stats) {
      ctx.fillStyle = s.color;
      ctx.fillText(`${s.value}  ${s.label.toUpperCase()}`, cx, y);
      y += 52;
    }
    y += 10;
  } else if (layout === 'hud') {
    roundRect(ctx, 120, y - 20, W - 240, 220, 16);
    ctx.strokeStyle = theme.panelStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawStatColumns(ctx, stats, y + 70);
    y += 230;
  } else {
    y = drawStatStack(ctx, stats, y, theme, layout !== 'grunge') + 10;
  }

  const powerStyle =
    layout === 'hud' || layout === 'neonFrame'
      ? 'pill'
      : layout === 'grunge'
        ? 'brush'
        : layout === 'minimal' || layout === 'sport' || layout === 'photo'
          ? 'plain'
          : 'box';
  y = drawPowerPill(ctx, theme, labels, report, y + 8, powerStyle);

  drawNewRecord(ctx, labels, report, y + 10);
  drawKeepGoing(
    ctx,
    theme,
    labels.keepGoing,
    H - 170,
    layout === 'cinematic' || layout === 'grunge' || layout === 'cosmic'
  );
  drawFooter(ctx, theme, labels.hashtags);

  // light grain
  ctx.save();
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 1400; i += 1) {
    const x = (i * 97) % W;
    const gy = (i * 53) % H;
    ctx.fillStyle = i % 2 === 0 ? '#fff' : '#000';
    ctx.fillRect(x, gy, 1, 1);
  }
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export workout share card'));
    }, 'image/png');
  });
}
