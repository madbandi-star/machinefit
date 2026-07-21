import type { LiftedComparisonResult } from '@machinefit/shared';
import { formatVolumeKg } from '@machinefit/shared';

interface ShareCardInput {
  headline: string;
  totalKg: number;
  comparison?: LiftedComparisonResult;
  locale: string;
  displayName: string;
}

/** Canvas Open-Graph style share card (brand dark + green accent). */
export async function buildLiftedShareCard(input: ShareCardInput): Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0b1220');
  gradient.addColorStop(0.55, '#111827');
  gradient.addColorStop(1, '#0f3d2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
  ctx.beginPath();
  ctx.arc(width * 0.85, height * 0.15, 280, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '64px system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('🏋️', width / 2, 180);

  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.fillStyle = '#e5e7eb';
  wrapText(ctx, input.headline, width / 2, 280, width - 160, 52);

  ctx.font = '800 96px system-ui, sans-serif';
  ctx.fillStyle = '#4ade80';
  ctx.fillText(`${formatVolumeKg(input.totalKg, input.locale)} KG`, width / 2, 520);

  if (input.comparison) {
    ctx.font = '56px system-ui, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(input.comparison.emoji, width / 2, 680);
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillStyle = '#f9fafb';
    ctx.fillText(input.comparison.name, width / 2, 760);
    ctx.font = '36px system-ui, sans-serif';
    ctx.fillStyle = '#86efac';
    const countLabel =
      input.locale === 'ko'
        ? `약 ${formatVolumeKg(input.comparison.count, input.locale)}${input.comparison.unit}`
        : `≈ ${formatVolumeKg(input.comparison.count, input.locale)} ${input.comparison.unit}`;
    ctx.fillText(countLabel, width / 2, 820);
  }

  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillStyle = '#22c55e';
  ctx.fillText('MachineFit', width / 2, height - 120);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export share card'));
    }, 'image/png');
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}
