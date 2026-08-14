/**
 * Premium TODAY'S WORKOUT screenshot poster (1080×1920 story).
 * Tight editorial grid with per-exercise rows — not a DOM raster.
 */
import {
  formatVolumeKg,
  formatWorkoutDateDots,
  formatWorkoutDurationCompact,
  type WorkoutCompleteReport,
  type WorkoutDayExerciseMetric,
} from '@machinefit/shared';
import { drawShareBrandLockup } from '@/utils/shareBrandFooter';

export type WorkoutScreenshotLabels = {
  brand: string;
  titleLead: string;
  titleAccent: string;
  tagline: string;
  duration: string;
  /** Localized short labels (single language). */
  exercisesLabel: string;
  setsLabel: string;
  volumeLabel: string;
  powerTitle: string;
  powerEarned: string;
  mvpTitle: string;
  newRecordTitle: string;
  exerciseListTitle: string;
  setsCol: string;
  volumeCol: string;
  /** Must include {{count}} placeholder. */
  moreExercises: string;
  oneLinerTitle: string;
  oneLiner: string;
  keepGoing: string;
  hashtags: string;
};

const W = 1080;
const H = 1920;
const LIME = '#b8ff3c';
const TEXT = '#f4f7f0';
const MUTED = 'rgba(228, 237, 220, 0.68)';
const RULE = 'rgba(184, 255, 60, 0.22)';
const PANEL = 'rgba(6, 10, 6, 0.64)';
const FONT =
  '"Barlow Condensed", "Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, sans-serif';
const FONT_BODY = '"Noto Sans KR", Pretendard, system-ui, sans-serif';

const PAD = 64;
const CONTENT_W = W - PAD * 2;
const COL_SETS_X = PAD + CONTENT_W - 210;
const COL_VOL_X = PAD + CONTENT_W - 8;
const NAME_MAX_W = CONTENT_W - 290;

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

function resolveBgUrl(): string {
  const base = String(import.meta.env.BASE_URL ?? '/');
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${normalized}assets/share/workout/cinematic-gym.png`;
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

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const t = text.trim();
  if (!t) return '';
  if (ctx.measureText(t).width <= maxWidth) return t;
  let out = t;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3
): string[] {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized) return [''];

  const cleaned = normalized.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
  const source = cleaned || normalized;

  const hasSpaces = /\s/.test(source);
  const tokens = hasSpaces ? source.split(/\s+/).filter(Boolean) : Array.from(source);
  const lines: string[] = [];
  let current = '';
  const joiner = hasSpaces ? ' ' : '';

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]!;
    const next = current ? `${current}${joiner}${token}` : token;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = token;
    if (lines.length >= maxLines - 1) {
      let last = tokens.slice(i).join(joiner);
      while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines.push(ctx.measureText(last).width > maxWidth ? `${last}…` : last);
      return lines.slice(0, maxLines);
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

async function paintAtmosphere(ctx: CanvasRenderingContext2D) {
  const img = await loadImage(resolveBgUrl());
  if (img) {
    drawCover(ctx, img, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a1208');
    g.addColorStop(0.5, '#050705');
    g.addColorStop(1, '#020302');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  const veil = ctx.createLinearGradient(0, 0, 0, H);
  veil.addColorStop(0, 'rgba(2,6,2,0.74)');
  veil.addColorStop(0.2, 'rgba(0,0,0,0.48)');
  veil.addColorStop(0.55, 'rgba(0,0,0,0.7)');
  veil.addColorStop(1, 'rgba(0,0,0,0.93)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, W, H);

  const bloom = ctx.createRadialGradient(W * 0.78, 100, 8, W * 0.78, 140, 380);
  bloom.addColorStop(0, 'rgba(184,255,60,0.16)');
  bloom.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);
}

function drawHairline(ctx: CanvasRenderingContext2D, y: number) {
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(PAD + CONTENT_W, y);
  ctx.stroke();
}

function drawSectionLabel(ctx: CanvasRenderingContext2D, label: string, y: number) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = LIME;
  const text = label.toUpperCase();
  ctx.fillText(text, PAD, y);
  const lw = ctx.measureText(text).width;
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD + lw + 18, y - 6);
  ctx.lineTo(PAD + CONTENT_W, y - 6);
  ctx.stroke();
}

function sortExercises(list: WorkoutDayExerciseMetric[]): WorkoutDayExerciseMetric[] {
  return [...list].sort((a, b) => b.volumeKg - a.volumeKg || b.setCount - a.setCount);
}

/**
 * Build a Photos-ready poster for the screenshot button.
 */
export async function buildWorkoutScreenshotPoster(input: {
  report: WorkoutCompleteReport;
  labels: WorkoutScreenshotLabels;
}): Promise<Blob> {
  const { report, labels } = input;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  await paintAtmosphere(ctx);
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  const cx = W / 2;
  let y = 86;

  // Header
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.fillText(labels.brand.toUpperCase(), PAD, y);

  ctx.textAlign = 'right';
  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.fillText(labels.tagline, PAD + CONTENT_W, y);

  y += 56;
  ctx.textAlign = 'left';
  ctx.font = `800 76px ${FONT}`;
  const leadW = ctx.measureText(`${labels.titleLead} `).width;
  ctx.fillStyle = '#fff';
  ctx.fillText(labels.titleLead, PAD, y);
  ctx.fillStyle = LIME;
  ctx.fillText(labels.titleAccent, PAD + leadW, y);

  y += 38;
  ctx.font = `600 26px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(formatWorkoutDateDots(report.dateKey), PAD, y);

  // Duration + summary on one aligned band
  y += 70;
  const duration = formatWorkoutDurationCompact(report.summary.durationMs);
  ctx.font = `800 108px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.shadowColor = 'rgba(184,255,60,0.3)';
  ctx.shadowBlur = 16;
  ctx.fillText(duration, PAD, y);
  ctx.shadowBlur = 0;

  const durW = ctx.measureText(duration).width;
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(labels.duration.toUpperCase(), PAD + durW + 24, y - 10);

  // Right-aligned summary stack (fixed label / value columns)
  const sumLabelX = PAD + CONTENT_W - 300;
  const summaryLines: Array<[string, string]> = [
    [labels.exercisesLabel, String(report.summary.exerciseCount)],
    [labels.setsLabel, String(report.summary.setCount)],
    [labels.volumeLabel, `${formatVolumeKg(report.summary.totalVolumeKg)} kg`],
  ];
  summaryLines.forEach(([label, value], i) => {
    const sy = y - 58 + i * 34;
    ctx.textAlign = 'left';
    ctx.font = `600 22px ${FONT_BODY}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(label, sumLabelX, sy);
    ctx.textAlign = 'right';
    ctx.font = `800 30px ${FONT}`;
    ctx.fillStyle = TEXT;
    ctx.fillText(value, COL_VOL_X, sy);
  });
  ctx.textAlign = 'left';

  y += 28;
  drawHairline(ctx, y);

  // Highlights (compact, above list so list fills remaining height)
  const highlightBits: string[] = [];
  if (report.power) {
    const earned = report.power.earnedToday > 0 ? ` · ${labels.powerEarned}` : '';
    highlightBits.push(`${labels.powerTitle}  ${report.power.balance}${earned}`);
  }
  if (report.mvp) {
    highlightBits.push(`${labels.mvpTitle}  ${report.mvp.machineName} · ${report.mvp.valueLabel}`);
  } else if (report.newRecord) {
    highlightBits.push(
      `${labels.newRecordTitle}  ${report.newRecord.machineName}  (+${formatVolumeKg(report.newRecord.deltaKg)} kg)`
    );
  }

  y += 36;
  if (highlightBits.length > 0) {
    const stripH = 20 + highlightBits.length * 40;
    roundRect(ctx, PAD, y, CONTENT_W, stripH, 12);
    ctx.fillStyle = 'rgba(184,255,60,0.08)';
    ctx.fill();
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = LIME;
    ctx.fillRect(PAD, y + 10, 4, stripH - 20);

    highlightBits.forEach((line, i) => {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `700 26px ${FONT}`;
      ctx.fillStyle = TEXT;
      ctx.fillText(ellipsize(ctx, line, CONTENT_W - 40), PAD + 22, y + 22 + i * 40);
    });
    y += stripH + 28;
  }

  // Fixed bottom blocks: quote + keepGoing + footer
  const FOOTER_Y = H - 150;
  const quotePreviewFont = `600 28px ${FONT_BODY}`;
  ctx.font = quotePreviewFont;
  const quoteLines = wrapText(ctx, labels.oneLiner, CONTENT_W - 40, 2);
  const quoteBlockH = 48 + quoteLines.length * 36;
  const keepGoingH = 48;
  const gapBeforeQuote = 24;
  const listEndY = FOOTER_Y - keepGoingH - quoteBlockH - gapBeforeQuote;

  // Exercise list fills middle
  drawSectionLabel(ctx, labels.exerciseListTitle, y);
  y += 26;

  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 20px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'left';
  ctx.fillText(labels.exercisesLabel.toUpperCase(), PAD + 8, y);
  ctx.textAlign = 'right';
  ctx.fillText(labels.setsCol.toUpperCase(), COL_SETS_X, y);
  ctx.fillText(labels.volumeCol.toUpperCase(), COL_VOL_X, y);
  y += 12;
  drawHairline(ctx, y);
  y += 8;

  const exercises = sortExercises(report.summary.exercises);
  const minRowH = 52;
  const moreH = 36;
  const listBudget = Math.max(minRowH + 16, listEndY - y);
  let maxRowsBySpace = Math.max(1, Math.floor((listBudget - 12) / minRowH));
  if (exercises.length > maxRowsBySpace) {
    maxRowsBySpace = Math.max(1, Math.floor((listBudget - 12 - moreH) / minRowH));
  }
  const visible = exercises.slice(0, maxRowsBySpace);
  const hidden = Math.max(0, exercises.length - visible.length);
  const rowsPad = 10;
  const moreSpace = hidden > 0 ? moreH : 0;
  const panelH = listBudget;
  const rowH =
    visible.length > 0
      ? Math.max(minRowH, Math.floor((panelH - rowsPad * 2 - moreSpace) / visible.length))
      : minRowH;

  roundRect(ctx, PAD, y, CONTENT_W, panelH, 14);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  let rowY = y + rowsPad;
  const nameSize = rowH >= 70 ? 34 : 30;
  const valueSize = rowH >= 70 ? 32 : 28;

  visible.forEach((ex, i) => {
    const mid = rowY + rowH / 2;
    if (i % 2 === 1) {
      ctx.fillStyle = 'rgba(184,255,60,0.045)';
      ctx.fillRect(PAD + 2, rowY, CONTENT_W - 4, rowH);
    }

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = `700 ${nameSize}px ${FONT_BODY}`;
    ctx.fillStyle = TEXT;
    ctx.fillText(ellipsize(ctx, ex.machineName, NAME_MAX_W), PAD + 20, mid);

    ctx.textAlign = 'right';
    ctx.font = `700 ${valueSize}px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(`${ex.setCount} ${labels.setsCol}`, COL_SETS_X, mid);

    ctx.font = `800 ${valueSize + 2}px ${FONT}`;
    ctx.fillStyle = LIME;
    ctx.fillText(`${formatVolumeKg(ex.volumeKg)} kg`, COL_VOL_X, mid);

    rowY += rowH;
  });

  if (hidden > 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 24px ${FONT_BODY}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(
      labels.moreExercises.replace(/\{\{count\}\}/g, String(hidden)),
      cx,
      y + panelH - moreH / 2 - 4
    );
  } else if (visible.length === 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 28px ${FONT_BODY}`;
    ctx.fillStyle = MUTED;
    ctx.fillText('—', cx, y + panelH / 2);
  }

  // Quote anchored above footer
  let qy = FOOTER_Y - keepGoingH - quoteBlockH;
  roundRect(ctx, PAD, qy, CONTENT_W, quoteBlockH, 12);
  ctx.fillStyle = PANEL;
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 20px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.fillText(labels.oneLinerTitle.toUpperCase(), PAD + 22, qy + 28);

  ctx.font = quotePreviewFont;
  ctx.fillStyle = TEXT;
  quoteLines.forEach((line, i) => {
    ctx.fillText(line, PAD + 22, qy + 64 + i * 36);
  });

  qy += quoteBlockH + 34;
  ctx.font = `800 34px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.fillText(labels.keepGoing, PAD, qy);

  drawShareBrandLockup(ctx, PAD, H - 96, FONT, {
    markSize: 28,
    brandSize: 24,
    domainSize: 16,
  });

  const tags = labels.hashtags.split(/\s+/).filter(Boolean).slice(0, 3);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = LIME;
  tags.forEach((tag, i) => {
    ctx.fillText(tag, PAD + CONTENT_W, H - 114 + i * 26);
  });

  roundRect(ctx, 18, 18, W - 36, H - 36, 24);
  ctx.strokeStyle = 'rgba(184,255,60,0.14)';
  ctx.lineWidth = 2;
  ctx.stroke();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export workout screenshot poster'));
    }, 'image/png');
  });
}
