/**
 * Premium TODAY'S WORKOUT screenshot poster (1080×1920 story).
 * Designed for Photos / Instagram — not a DOM raster of the modal.
 */
import {
  formatVolumeKg,
  formatWorkoutDateDots,
  formatWorkoutDurationCompact,
  type WorkoutCompleteReport,
} from '@machinefit/shared';
import { drawShareBrandLockup } from '@/utils/shareBrandFooter';

export type WorkoutScreenshotLabels = {
  brand: string;
  titleLead: string;
  titleAccent: string;
  tagline: string;
  duration: string;
  exercises: string;
  exercisesSub: string;
  sets: string;
  setsSub: string;
  volume: string;
  volumeSub: string;
  powerTitle: string;
  powerEarned: string;
  mvpTitle: string;
  newRecordTitle: string;
  recordToday: string;
  recordPrev: string;
  oneLinerTitle: string;
  oneLiner: string;
  keepGoing: string;
  hashtags: string;
};

const W = 1080;
const H = 1920;
const LIME = '#b8ff3c';
const TEXT = '#f4f7f0';
const MUTED = 'rgba(228, 237, 220, 0.7)';
const FONT =
  '"Barlow Condensed", "Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, sans-serif';
const FONT_BODY = '"Noto Sans KR", Pretendard, system-ui, sans-serif';
const FONT_SCRIPT = '"Caveat", "Barlow Condensed", cursive';

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3
): string[] {
  const normalized = text.trim();
  if (!normalized) return [''];

  const hasSpaces = /\s/.test(normalized);
  const tokens = hasSpaces
    ? normalized.split(/\s+/).filter(Boolean)
    : Array.from(normalized);

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
    g.addColorStop(0.45, '#050705');
    g.addColorStop(1, '#020302');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Top stage light + deep bottom fade for typography
  const veil = ctx.createLinearGradient(0, 0, 0, H);
  veil.addColorStop(0, 'rgba(2,6,2,0.55)');
  veil.addColorStop(0.22, 'rgba(0,0,0,0.28)');
  veil.addColorStop(0.55, 'rgba(0,0,0,0.52)');
  veil.addColorStop(0.78, 'rgba(0,0,0,0.78)');
  veil.addColorStop(1, 'rgba(0,0,0,0.94)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, W, H);

  const bloom = ctx.createRadialGradient(W * 0.5, 160, 10, W * 0.5, 220, 560);
  bloom.addColorStop(0, 'rgba(184,255,60,0.26)');
  bloom.addColorStop(0.45, 'rgba(184,255,60,0.07)');
  bloom.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  // Soft film grain
  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 2400; i += 1) {
    const x = (i * 97) % W;
    const y = (i * 53) % H;
    ctx.fillStyle = i % 2 === 0 ? '#fff' : '#000';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

function drawStatColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  value: string,
  en: string,
  ko: string
) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.font = `800 72px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.shadowColor = 'rgba(184,255,60,0.4)';
  ctx.shadowBlur = 18;
  ctx.fillText(value, x + w / 2, y);
  ctx.shadowBlur = 0;

  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = 'rgba(244,247,240,0.92)';
  ctx.fillText(en.toUpperCase(), x + w / 2, y + 42);

  ctx.font = `600 22px ${FONT_BODY}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(ko, x + w / 2, y + 74);
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

  const pad = 72;
  const contentW = W - pad * 2;
  const cx = W / 2;
  let y = 108;

  // Brand wordmark
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 italic 30px ${FONT}`;
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(184,255,60,0.45)';
  ctx.shadowBlur = 16;
  ctx.fillText(labels.brand.toUpperCase(), pad, y);
  ctx.shadowBlur = 0;

  // Lime accent rule under brand
  ctx.fillStyle = LIME;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(pad, y + 16, 56, 4);
  ctx.globalAlpha = 1;

  y += 96;
  // Hero title
  ctx.font = `800 98px ${FONT}`;
  ctx.fillStyle = '#fff';
  const lead = labels.titleLead;
  const accent = labels.titleAccent;
  const leadW = ctx.measureText(`${lead} `).width;
  ctx.fillText(lead, pad, y);
  ctx.fillStyle = LIME;
  ctx.shadowColor = 'rgba(184,255,60,0.5)';
  ctx.shadowBlur = 24;
  ctx.fillText(accent, pad + leadW, y);
  ctx.shadowBlur = 0;

  // Handwritten tagline (Caveat)
  ctx.save();
  ctx.translate(W - pad + 8, y - 58);
  ctx.rotate((-10 * Math.PI) / 180);
  ctx.textAlign = 'right';
  ctx.font = `700 44px ${FONT_SCRIPT}`;
  ctx.fillStyle = LIME;
  ctx.shadowColor = 'rgba(184,255,60,0.35)';
  ctx.shadowBlur = 10;
  ctx.fillText(labels.tagline, 0, 0);
  ctx.restore();

  y += 46;
  ctx.textAlign = 'left';
  ctx.font = `600 30px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(formatWorkoutDateDots(report.dateKey), pad, y);

  // Duration hero ring
  y += 150;
  const duration = formatWorkoutDurationCompact(report.summary.durationMs);
  const ringR = 188;
  const ringCy = y;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(cx, ringCy, ringR, 0, Math.PI * 2);
  ctx.stroke();

  const progress = Math.min(1, Math.max(0.14, report.summary.durationMs / (90 * 60 * 1000)));
  ctx.strokeStyle = LIME;
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(184,255,60,0.6)';
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.arc(cx, ringCy, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();
  ctx.restore();

  // Soft inner disc for legibility
  const disc = ctx.createRadialGradient(cx, ringCy, 20, cx, ringCy, ringR - 28);
  disc.addColorStop(0, 'rgba(6,12,6,0.55)');
  disc.addColorStop(1, 'rgba(6,12,6,0)');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, ringCy, ringR - 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = `800 108px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.shadowColor = 'rgba(184,255,60,0.4)';
  ctx.shadowBlur = 22;
  ctx.fillText(duration, cx, ringCy + 22);
  ctx.shadowBlur = 0;
  ctx.font = `700 28px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(labels.duration.toUpperCase(), cx, ringCy + 68);

  // Stats — open typography, not boxed cards
  y = ringCy + ringR + 88;
  const colW = contentW / 3;
  drawStatColumn(
    ctx,
    pad,
    y,
    colW,
    String(report.summary.exerciseCount),
    labels.exercises,
    labels.exercisesSub
  );
  drawStatColumn(
    ctx,
    pad + colW,
    y,
    colW,
    String(report.summary.setCount),
    labels.sets,
    labels.setsSub
  );
  drawStatColumn(
    ctx,
    pad + colW * 2,
    y,
    colW,
    formatVolumeKg(report.summary.totalVolumeKg),
    labels.volume,
    labels.volumeSub
  );

  // Thin lime dividers between stats
  ctx.strokeStyle = 'rgba(184,255,60,0.28)';
  ctx.lineWidth = 2;
  for (const dx of [1, 2]) {
    const lx = pad + colW * dx;
    ctx.beginPath();
    ctx.moveTo(lx, y - 48);
    ctx.lineTo(lx, y + 56);
    ctx.stroke();
  }

  y += 118;

  // Highlight band: power + MVP / record (single composition)
  const highlights: Array<{ kicker: string; title: string; sub?: string }> = [];
  if (report.power) {
    highlights.push({
      kicker: labels.powerTitle,
      title: String(report.power.balance),
      sub: report.power.earnedToday > 0 ? labels.powerEarned : undefined,
    });
  }
  if (report.mvp) {
    highlights.push({
      kicker: labels.mvpTitle,
      title: report.mvp.machineName,
      sub: report.mvp.valueLabel,
    });
  } else if (report.newRecord) {
    highlights.push({
      kicker: labels.newRecordTitle,
      title: report.newRecord.machineName,
      sub: `${labels.recordToday} ${formatVolumeKg(report.newRecord.todayVolumeKg)} kg · ${labels.recordPrev} ${formatVolumeKg(report.newRecord.previousBestKg)} kg`,
    });
  }

  if (highlights.length > 0) {
    const bandH = highlights.length === 1 ? 168 : 280;
    roundRect(ctx, pad, y, contentW, bandH, 28);
    const bandGrad = ctx.createLinearGradient(pad, y, pad, y + bandH);
    bandGrad.addColorStop(0, 'rgba(184,255,60,0.1)');
    bandGrad.addColorStop(1, 'rgba(6,10,6,0.72)');
    ctx.fillStyle = bandGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(184,255,60,0.32)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Left lime bar
    ctx.fillStyle = LIME;
    ctx.fillRect(pad, y + 24, 6, bandH - 48);

    let rowY = y + 48;
    highlights.slice(0, 2).forEach((h, idx) => {
      if (idx > 0) {
        ctx.strokeStyle = 'rgba(184,255,60,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad + 36, rowY - 22);
        ctx.lineTo(pad + contentW - 36, rowY - 22);
        ctx.stroke();
      }
      ctx.textAlign = 'left';
      ctx.font = `700 22px ${FONT}`;
      ctx.fillStyle = LIME;
      ctx.fillText(h.kicker.toUpperCase(), pad + 40, rowY);

      ctx.font = `800 48px ${FONT}`;
      ctx.fillStyle = TEXT;
      const titleLines = wrapText(ctx, h.title, contentW - 100, 1);
      ctx.fillText(titleLines[0] || h.title, pad + 40, rowY + 52);

      if (h.sub) {
        ctx.font = `600 24px ${FONT_BODY}`;
        ctx.fillStyle = MUTED;
        const subLines = wrapText(ctx, h.sub, contentW - 100, 1);
        ctx.fillText(subLines[0] || h.sub, pad + 40, rowY + 90);
        rowY += 140;
      } else {
        rowY += 110;
      }
    });

    y += bandH + 40;
  } else {
    y += 24;
  }

  // Quote — editorial, light panel
  const quoteH = 200;
  roundRect(ctx, pad, y, contentW, quoteH, 28);
  ctx.fillStyle = 'rgba(6, 10, 6, 0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = `800 110px ${FONT}`;
  ctx.fillStyle = 'rgba(184,255,60,0.22)';
  ctx.fillText('“', pad + 22, y + 96);

  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = LIME;
  ctx.fillText(labels.oneLinerTitle.toUpperCase(), pad + 56, y + 46);

  ctx.font = `700 34px ${FONT_BODY}`;
  ctx.fillStyle = TEXT;
  const quoteLines = wrapText(ctx, labels.oneLiner, contentW - 112, 3);
  quoteLines.forEach((line, i) => {
    ctx.fillText(line, pad + 56, y + 96 + i * 40);
  });

  y += quoteH + 56;

  // Closing script line
  const keepY = Math.min(y + 8, H - 210);
  ctx.save();
  ctx.translate(cx, keepY);
  ctx.rotate((-5 * Math.PI) / 180);
  ctx.textAlign = 'center';
  ctx.font = `700 52px ${FONT_SCRIPT}`;
  ctx.fillStyle = LIME;
  ctx.shadowColor = 'rgba(184,255,60,0.4)';
  ctx.shadowBlur = 14;
  ctx.fillText(labels.keepGoing, 0, 0);
  ctx.restore();

  // Footer
  drawShareBrandLockup(ctx, pad, H - 118, FONT, {
    markSize: 34,
    brandSize: 30,
    domainSize: 18,
  });

  const tags = labels.hashtags.split(/\s+/).filter(Boolean).slice(0, 3);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `700 24px ${FONT}`;
  ctx.fillStyle = LIME;
  tags.forEach((tag, i) => {
    ctx.fillText(tag, W - pad, H - 136 + i * 28);
  });

  // Outer neon frame
  roundRect(ctx, 24, 24, W - 48, H - 48, 40);
  ctx.strokeStyle = 'rgba(184,255,60,0.2)';
  ctx.lineWidth = 3;
  ctx.stroke();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export workout screenshot poster'));
    }, 'image/png');
  });
}
