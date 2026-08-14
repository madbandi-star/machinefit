/**
 * Premium TODAY'S WORKOUT screenshot poster — Instagram 4:5 (1080×1350).
 * Dark graphite + neon lime. No cinematic gym bg / purple bloom.
 */
import {
  formatVolumeKg,
  formatWorkoutDateDots,
  formatWorkoutDurationCompact,
  type WorkoutCompleteReport,
} from '@machinefit/shared';
import { drawShareBrandLockup } from '@/utils/shareBrandFooter';
import type { WorkoutPosterExercise } from '@/utils/workoutPosterExerciseDetails';

export type WorkoutScreenshotLabels = {
  brand: string;
  titleLead: string;
  titleAccent: string;
  tagline: string;
  duration: string;
  exercisesLabel: string;
  setsLabel: string;
  volumeLabel: string;
  powerTitle: string;
  mvpTitle: string;
  newRecordTitle: string;
  exerciseListTitle: string;
  setsMeta: string;
  setCol: string;
  repsCol: string;
  loadCol: string;
  moreExercises: string;
  oneLinerTitle: string;
  oneLiner: string;
  keepGoing: string;
  hashtags: string;
  bodyweight: string;
};

const W = 1080;
const H = 1350;
const LIME = '#b8ff3c';
const TEXT = '#f2f5ef';
const MUTED = 'rgba(220, 230, 214, 0.62)';
const LINE = 'rgba(184, 255, 60, 0.16)';
const CARD = '#121612';
const CARD_EDGE = 'rgba(184, 255, 60, 0.2)';
const BG_TOP = '#0b0d0b';
const BG_BOT = '#050605';
const FONT =
  '"Barlow Condensed", "Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, sans-serif';
const FONT_BODY = '"Noto Sans KR", Pretendard, system-ui, sans-serif';

const PAD = 56;
const CONTENT_W = W - PAD * 2;

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
  maxLines = 2
): string[] {
  const normalized = text
    .trim()
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ');
  if (!normalized) return [''];

  const hasSpaces = /\s/.test(normalized);
  const tokens = hasSpaces ? normalized.split(/\s+/).filter(Boolean) : Array.from(normalized);
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

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function paintBackground(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, BG_TOP);
  g.addColorStop(1, BG_BOT);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const bloom = ctx.createRadialGradient(W * 0.85, 0, 20, W * 0.85, 40, 380);
  bloom.addColorStop(0, 'rgba(184,255,60,0.07)');
  bloom.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 1600; i += 1) {
    const x = (i * 97) % W;
    const y = (i * 53) % H;
    ctx.fillStyle = i % 2 === 0 ? '#fff' : '#000';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 18
) {
  roundRect(ctx, x, y, w, h, r);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#161b16');
  g.addColorStop(1, CARD);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = CARD_EDGE;
  ctx.lineWidth = 1.25;
  ctx.stroke();
}

function drawBolt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.moveTo(size * 0.55, 0);
  ctx.lineTo(size * 0.18, size * 0.52);
  ctx.lineTo(size * 0.48, size * 0.52);
  ctx.lineTo(size * 0.35, size);
  ctx.lineTo(size * 0.82, size * 0.42);
  ctx.lineTo(size * 0.52, size * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.72);
  ctx.lineTo(0, size * 0.28);
  ctx.lineTo(size * 0.28, size * 0.48);
  ctx.lineTo(size * 0.5, size * 0.12);
  ctx.lineTo(size * 0.72, size * 0.48);
  ctx.lineTo(size, size * 0.28);
  ctx.lineTo(size, size * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(0, size * 0.72, size, size * 0.16);
  ctx.restore();
}

function drawKgLeft(
  ctx: CanvasRenderingContext2D,
  num: string,
  x: number,
  y: number,
  numSize: number
) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${numSize}px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.fillText(num, x, y);
  const nw = ctx.measureText(num).width;
  ctx.font = `700 ${Math.round(numSize * 0.48)}px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText('kg', x + nw + 8, y);
}

function drawKgRight(
  ctx: CanvasRenderingContext2D,
  num: string,
  x: number,
  y: number,
  numSize: number
) {
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${Math.round(numSize * 0.48)}px ${FONT}`;
  ctx.fillStyle = MUTED;
  const unitW = ctx.measureText('kg').width;
  ctx.fillText('kg', x, y);
  ctx.font = `800 ${numSize}px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.fillText(num, x - unitW - 8, y);
}

/**
 * Build a Photos / Instagram-ready poster.
 */
export async function buildWorkoutScreenshotPoster(input: {
  report: WorkoutCompleteReport;
  labels: WorkoutScreenshotLabels;
  exercises?: WorkoutPosterExercise[];
  locale?: string;
}): Promise<Blob> {
  const { report, labels, locale = 'ko' } = input;
  const exercises =
    input.exercises && input.exercises.length > 0
      ? input.exercises
      : report.summary.exercises.map((ex) => ({
          machineCode: ex.machineCode,
          machineName: ex.machineName,
          muscleLabel: null as string | null,
          setCount: ex.setCount,
          volumeKg: ex.volumeKg,
          imageUrl: null as string | null,
          sets: Array.from({ length: Math.min(ex.setCount, 6) }, (_, i) => ({
            index: i + 1,
            reps: null as number | null,
            loadKg: 0,
          })),
        }));

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  paintBackground(ctx);
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  const thumbs = new Map<string, HTMLImageElement>();
  await Promise.all(
    exercises.slice(0, 8).map(async (ex) => {
      if (!ex.imageUrl) return;
      const img = await loadImage(ex.imageUrl);
      if (img) thumbs.set(ex.machineCode, img);
    })
  );

  let y = 72;

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillText(labels.brand.toUpperCase(), PAD, y);

  ctx.textAlign = 'right';
  ctx.font = `600 20px ${FONT}`;
  ctx.fillStyle = 'rgba(184,255,60,0.55)';
  ctx.fillText(labels.tagline, PAD + CONTENT_W, y);

  y += 52;
  ctx.textAlign = 'left';
  ctx.font = `800 72px ${FONT}`;
  const leadW = ctx.measureText(`${labels.titleLead} `).width;
  ctx.fillStyle = '#fff';
  ctx.fillText(labels.titleLead, PAD, y);
  ctx.fillStyle = LIME;
  ctx.fillText(labels.titleAccent, PAD + leadW, y);

  y += 34;
  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(formatWorkoutDateDots(report.dateKey), PAD, y);

  y += 28;
  const gridGap = 14;
  const cellW = (CONTENT_W - gridGap) / 2;
  const cellH = 118;
  const duration = formatWorkoutDurationCompact(report.summary.durationMs);
  const grid: Array<{ label: string; value: string; lime: boolean; kg?: boolean }> = [
    { label: labels.duration, value: duration, lime: true },
    { label: labels.exercisesLabel, value: String(report.summary.exerciseCount), lime: false },
    { label: labels.setsLabel, value: String(report.summary.setCount), lime: false },
    {
      label: labels.volumeLabel,
      value: formatVolumeKg(report.summary.totalVolumeKg, locale),
      lime: true,
      kg: true,
    },
  ];

  grid.forEach((cell, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = PAD + col * (cellW + gridGap);
    const cy = y + row * (cellH + gridGap);
    drawCard(ctx, cx, cy, cellW, cellH, 16);

    ctx.textAlign = 'left';
    ctx.font = `600 20px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(cell.label.toUpperCase(), cx + 22, cy + 34);

    if (cell.kg) {
      drawKgLeft(ctx, cell.value, cx + 22, cy + 88, 48);
    } else {
      ctx.font = `800 48px ${FONT}`;
      ctx.fillStyle = cell.lime ? LIME : TEXT;
      ctx.fillText(cell.value, cx + 22, cy + 88);
    }
  });
  y += cellH * 2 + gridGap + 22;

  const halfW = (CONTENT_W - gridGap) / 2;
  const highlightH = 132;
  drawCard(ctx, PAD, y, halfW, highlightH, 16);
  drawCard(ctx, PAD + halfW + gridGap, y, halfW, highlightH, 16);

  drawBolt(ctx, PAD + 22, y + 22, 22);
  ctx.textAlign = 'left';
  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(labels.powerTitle.toUpperCase(), PAD + 52, y + 40);
  const powerVal = report.power ? String(report.power.balance) : '—';
  ctx.font = `800 52px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.fillText(powerVal, PAD + 22, y + 100);
  ctx.font = `800 52px ${FONT}`;
  const powerNumW = ctx.measureText(powerVal).width;
  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText('POWER', PAD + 22 + powerNumW + 12, y + 92);

  const mvpX = PAD + halfW + gridGap;
  drawCrown(ctx, mvpX + 22, y + 22, 22);
  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = MUTED;
  const mvpTitle = report.mvp
    ? labels.mvpTitle
    : report.newRecord
      ? labels.newRecordTitle
      : labels.mvpTitle;
  ctx.fillText(mvpTitle.toUpperCase(), mvpX + 52, y + 40);

  const mvpName = report.mvp?.machineName ?? report.newRecord?.machineName ?? '—';
  const mvpValue = report.mvp?.valueLabel
    ?? (report.newRecord
      ? `${formatVolumeKg(report.newRecord.todayVolumeKg, locale)} kg`
      : '');
  ctx.font = `800 28px ${FONT_BODY}`;
  ctx.fillStyle = TEXT;
  ctx.fillText(ellipsize(ctx, mvpName, halfW - 44), mvpX + 22, y + 78);
  if (mvpValue) {
    const mv = mvpValue.replace(/\s*kg$/i, '').trim();
    if (/kg/i.test(mvpValue)) {
      drawKgLeft(ctx, mv, mvpX + 22, y + 112, 28);
    } else {
      ctx.font = `700 24px ${FONT}`;
      ctx.fillStyle = LIME;
      ctx.fillText(mvpValue, mvpX + 22, y + 112);
    }
  }
  y += highlightH + 26;

  ctx.textAlign = 'left';
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.fillText(labels.exerciseListTitle.toUpperCase(), PAD, y);
  const sectionTitleW = ctx.measureText(labels.exerciseListTitle.toUpperCase()).width;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD + sectionTitleW + 16, y - 6);
  ctx.lineTo(PAD + CONTENT_W, y - 6);
  ctx.stroke();
  y += 18;

  const FOOTER_TOP = H - 168;
  const listBottom = FOOTER_TOP - 8;

  type Plan = { ex: WorkoutPosterExercise; setRows: number; h: number };
  const plans: Plan[] = [];
  let used = 0;
  const cardGap = 12;

  for (let i = 0; i < exercises.length; i += 1) {
    const ex = exercises[i]!;
    const maxSets = ex.sets.length;
    const headerH = 78;
    const tableHead = 26;
    const setRowH = 28;
    const padY = 16;

    let setRows = maxSets;
    let h = headerH + tableHead + setRows * setRowH + padY;
    const remaining = listBottom - y - used - (plans.length > 0 ? cardGap : 0);
    const moreReserve = i < exercises.length - 1 ? 36 : 0;

    if (h + moreReserve > remaining) {
      const avail = remaining - moreReserve - headerH - tableHead - padY;
      setRows = Math.max(0, Math.floor(avail / setRowH));
      h = headerH + (setRows > 0 ? tableHead + setRows * setRowH : 0) + padY;
      if (h + moreReserve > remaining || remaining < headerH + padY + 20) {
        break;
      }
    }

    plans.push({ ex, setRows, h });
    used += h + (plans.length > 1 ? cardGap : 0);
    if (setRows < maxSets) break;
    if (listBottom - y - used < 90) break;
  }

  const hiddenExercises = Math.max(0, exercises.length - plans.length);

  for (let pi = 0; pi < plans.length; pi += 1) {
    const { ex, setRows, h } = plans[pi]!;
    if (pi > 0) y += cardGap;
    drawCard(ctx, PAD, y, CONTENT_W, h, 18);

    const thumbR = 28;
    const thumbCx = PAD + 28 + thumbR;
    const thumbCy = y + 28 + thumbR;
    const thumb = thumbs.get(ex.machineCode);
    ctx.save();
    ctx.beginPath();
    ctx.arc(thumbCx, thumbCy, thumbR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (thumb) {
      const ir = thumb.naturalWidth / Math.max(1, thumb.naturalHeight);
      let dw = thumbR * 2;
      let dh = thumbR * 2;
      let dx = thumbCx - thumbR;
      let dy = thumbCy - thumbR;
      if (ir > 1) {
        dw = thumbR * 2 * ir;
        dx = thumbCx - dw / 2;
      } else {
        dh = (thumbR * 2) / Math.max(ir, 0.01);
        dy = thumbCy - dh / 2;
      }
      ctx.drawImage(thumb, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = '#1a211a';
      ctx.fill();
      ctx.font = `800 22px ${FONT}`;
      ctx.fillStyle = LIME;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ex.machineName.slice(0, 1).toUpperCase(), thumbCx, thumbCy + 1);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(thumbCx, thumbCy, thumbR, 0, Math.PI * 2);
    ctx.strokeStyle = CARD_EDGE;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const textLeft = thumbCx + thumbR + 16;
    const nameMax = CONTENT_W - (textLeft - PAD) - 160;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `800 28px ${FONT_BODY}`;
    ctx.fillStyle = TEXT;
    ctx.fillText(ellipsize(ctx, ex.machineName, nameMax), textLeft, y + 48);

    const metaParts = [
      ex.muscleLabel || (ex.volumeKg <= 0 ? labels.bodyweight : null),
      `${ex.setCount} ${labels.setsMeta}`,
    ].filter(Boolean);
    ctx.font = `600 20px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(metaParts.join('  ·  '), textLeft, y + 76);

    drawKgRight(
      ctx,
      formatVolumeKg(ex.volumeKg, locale),
      PAD + CONTENT_W - 24,
      y + 56,
      36
    );

    if (setRows > 0) {
      const tableTop = y + 92;
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD + 20, tableTop);
      ctx.lineTo(PAD + CONTENT_W - 20, tableTop);
      ctx.stroke();

      const colSet = PAD + 36;
      const colReps = PAD + CONTENT_W * 0.42;
      const colLoad = PAD + CONTENT_W - 36;

      ctx.font = `700 16px ${FONT}`;
      ctx.fillStyle = MUTED;
      ctx.textAlign = 'left';
      ctx.fillText(labels.setCol.toUpperCase(), colSet, tableTop + 22);
      ctx.textAlign = 'center';
      ctx.fillText(labels.repsCol.toUpperCase(), colReps, tableTop + 22);
      ctx.textAlign = 'right';
      ctx.fillText(labels.loadCol.toUpperCase(), colLoad, tableTop + 22);

      const visibleSets = ex.sets.slice(0, setRows);
      visibleSets.forEach((row, ri) => {
        const ry = tableTop + 48 + ri * 28;
        ctx.font = `700 22px ${FONT}`;
        ctx.fillStyle = TEXT;
        ctx.textAlign = 'left';
        ctx.fillText(String(row.index).padStart(2, '0'), colSet, ry);

        ctx.textAlign = 'center';
        ctx.fillStyle = MUTED;
        ctx.fillText(row.reps != null ? String(row.reps) : '—', colReps, ry);

        ctx.textAlign = 'right';
        if (row.loadKg > 0) {
          drawKgRight(ctx, formatVolumeKg(row.loadKg, locale), colLoad, ry, 22);
        } else {
          ctx.font = `700 22px ${FONT}`;
          ctx.fillStyle = MUTED;
          ctx.fillText('—', colLoad, ry);
        }
      });
    }

    y += h;
  }

  if (hiddenExercises > 0) {
    y += 10;
    ctx.textAlign = 'center';
    ctx.font = `600 20px ${FONT_BODY}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(
      labels.moreExercises.replace(/\{\{count\}\}/g, String(hiddenExercises)),
      W / 2,
      Math.min(y + 18, FOOTER_TOP - 8)
    );
  }

  const fy = FOOTER_TOP;
  ctx.textAlign = 'left';
  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(labels.oneLinerTitle, PAD, fy);

  ctx.font = `600 26px ${FONT_BODY}`;
  ctx.fillStyle = TEXT;
  const quoteLines = wrapText(ctx, labels.oneLiner, CONTENT_W - 280, 2);
  quoteLines.forEach((line, i) => {
    ctx.fillText(line, PAD, fy + 34 + i * 30);
  });

  ctx.font = `800 28px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.textAlign = 'right';
  ctx.fillText(labels.keepGoing, PAD + CONTENT_W, fy + 34);

  drawShareBrandLockup(ctx, PAD, H - 78, FONT, {
    markSize: 24,
    brandSize: 20,
    domainSize: 14,
  });

  const tags = labels.hashtags.split(/\s+/).filter(Boolean).slice(0, 3);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `600 18px ${FONT}`;
  ctx.fillStyle = 'rgba(184,255,60,0.7)';
  tags.forEach((tag, i) => {
    ctx.fillText(tag, PAD + CONTENT_W, H - 96 + i * 22);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export workout screenshot poster'));
    }, 'image/png');
  });
}
