import { SITE_DOMAIN } from '@/config/site';

const WHITE = '#ffffff';
const GREEN = '#4ade80';
const DOMAIN_FILL = 'rgba(74, 222, 128, 0.82)';

/** Shared MachineFit mark used on share-card footers. */
export function drawMachineFitMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = size * 0.11;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(size * 0.35, size * 0.15);
  ctx.lineTo(size * 0.55, size * 0.55);
  ctx.lineTo(size * 0.85, 0);
  ctx.stroke();
  ctx.restore();
}

/**
 * Brand lockup: mark + MachineFit name, with machine-fit.com under the wordmark.
 */
export function drawShareBrandLockup(
  ctx: CanvasRenderingContext2D,
  left: number,
  logoRowY: number,
  font: string,
  options?: { markSize?: number; brandSize?: number; domainSize?: number }
) {
  const markSize = options?.markSize ?? 28;
  const brandSize = options?.brandSize ?? 22;
  const domainSize = options?.domainSize ?? 17;

  drawMachineFitMark(ctx, left, logoRowY - markSize + 4, markSize);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${brandSize}px ${font}`;
  ctx.fillStyle = WHITE;
  const brandX = left + markSize + 10;
  ctx.fillText('Machine', brandX, logoRowY);
  ctx.fillStyle = GREEN;
  const machineW = ctx.measureText('Machine').width;
  ctx.fillText('Fit', brandX + machineW, logoRowY);

  ctx.font = `600 ${domainSize}px ${font}`;
  ctx.fillStyle = DOMAIN_FILL;
  ctx.fillText(SITE_DOMAIN, left, logoRowY + 26);
}
