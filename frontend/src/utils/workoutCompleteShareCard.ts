import {
  formatVolumeKg,
  formatWorkoutDateDots,
  formatWorkoutDurationCompact,
  type WorkoutCompleteReport,
} from '@machinefit/shared';
import { drawShareBrandLockup } from '@/utils/shareBrandFooter';
import { measureShareFooterH } from '@/utils/shareHashtags';

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
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';
const GREEN = '#4ade80';
const FOOTER_MIN_H = 64;

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

export async function buildWorkoutCompleteShareCard(input: {
  report: WorkoutCompleteReport;
  labels: WorkoutCompleteShareLabels;
}): Promise<Blob> {
  const { report, labels } = input;
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const gradient = ctx.createLinearGradient(0, 0, width * 0.2, height);
  gradient.addColorStop(0, '#0b1220');
  gradient.addColorStop(0.55, '#0f172a');
  gradient.addColorStop(1, '#042f2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(74, 222, 128, 0.12)';
  ctx.beginPath();
  ctx.arc(width * 0.85, height * 0.18, 260, 0, Math.PI * 2);
  ctx.fill();

  const cardX = 56;
  const cardY = 56;
  const cardW = width - cardX * 2;
  const cardH = height - cardY * 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const cx = width / 2;
  let y = cardY + 100;

  ctx.textAlign = 'center';
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillStyle = GREEN;
  ctx.fillText('MACHINE FIT', cx, y);

  y += 70;
  ctx.font = `bold 56px ${FONT}`;
  ctx.fillStyle = '#f9fafb';
  ctx.fillText(labels.title, cx, y);

  y += 52;
  ctx.font = `32px ${FONT}`;
  ctx.fillStyle = '#9ca3af';
  ctx.fillText(formatWorkoutDateDots(report.dateKey), cx, y);

  y += 110;
  ctx.font = `bold 96px ${FONT}`;
  ctx.fillStyle = '#f9fafb';
  ctx.fillText(formatWorkoutDurationCompact(report.summary.durationMs), cx, y);

  y += 90;
  const stats = [
    `${report.summary.exerciseCount} ${labels.exercises}`,
    `${report.summary.setCount} ${labels.sets}`,
    `${formatVolumeKg(report.summary.totalVolumeKg)} KG`,
  ];
  ctx.font = `bold 36px ${FONT}`;
  ctx.fillStyle = '#e5e7eb';
  for (const line of stats) {
    ctx.fillText(line, cx, y);
    y += 54;
  }

  if (report.power) {
    y += 36;
    ctx.font = `bold 40px ${FONT}`;
    ctx.fillStyle = GREEN;
    ctx.fillText(`${labels.power} ${report.power.balance}`, cx, y);
  }

  if (report.newRecord) {
    y += 70;
    ctx.font = `bold 34px ${FONT}`;
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🔥 ${labels.newRecord}`, cx, y);
  }

  y += 80;
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText(labels.keepGoing, cx, y);

  const footerH = measureShareFooterH(labels.hashtags, { minH: FOOTER_MIN_H });
  const footerY = cardY + cardH - footerH - 48;
  const innerX = cardX + 64;
  const footerW = cardW - 128;
  drawShareBrandLockup(ctx, innerX, footerY + 28, FONT);

  const tags = labels.hashtags.split(/\s+/).filter(Boolean);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `600 22px ${FONT}`;
  ctx.fillStyle = GREEN;
  tags.forEach((tag, i) => {
    ctx.fillText(tag, innerX + footerW, footerY + 28 + i * 26);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export workout share card'));
    }, 'image/png');
  });
}
