import type { LifterDnaSnapshot } from '@machinefit/shared';

export interface DnaShareCardLabels {
  complete: string;
  confidence: string;
  basis: string;
  basisValue: string;
  analyzedAt: string;
}

interface DnaShareInput {
  snapshot: LifterDnaSnapshot;
  labels: DnaShareCardLabels;
  analyzedDate: string;
}

function starsText(n: number): string {
  const filled = Math.max(0, Math.min(5, n));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

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

function drawPageBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width * 0.2, height);
  gradient.addColorStop(0, '#14081f');
  gradient.addColorStop(0.5, '#0f172a');
  gradient.addColorStop(1, '#042f2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(167, 139, 250, 0.18)';
  ctx.beginPath();
  ctx.arc(width * 0.14, height * 0.12, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(74, 222, 128, 0.12)';
  ctx.beginPath();
  ctx.arc(width * 0.88, height * 0.22, 260, 0, Math.PI * 2);
  ctx.fill();
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

function drawMetaColumn(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  maxWidth: number,
  label: string,
  value: string
): number {
  ctx.textAlign = 'center';
  ctx.font = '24px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText(label, centerX, topY);

  ctx.font = 'bold 30px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = '#f3f4f6';
  return wrapText(ctx, value, centerX, topY + 42, maxWidth, 38);
}

/** Share card matching on-screen Lifter DNA hero card. */
export async function buildLifterDnaShareCard(input: DnaShareInput): Promise<Blob> {
  const { snapshot, labels, analyzedDate } = input;
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  drawPageBackground(ctx, width, height);

  const cardX = 56;
  const cardY = 72;
  const cardW = width - cardX * 2;
  const cardH = height - cardY * 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.68)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.11)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const cx = width / 2;
  const contentMax = cardW - 120;
  let y = cardY + 88;

  ctx.textAlign = 'center';
  ctx.font = 'bold 30px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText(labels.complete, cx, y);

  y += 120;
  ctx.font = '168px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(snapshot.character.emoji, cx, y);

  y += 72;
  ctx.font = 'bold 52px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = '#f9fafb';
  y = wrapText(ctx, snapshot.shareHeadline, cx, y, contentMax, 62);

  y += 18;
  ctx.font = '34px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = '#86efac';
  y = wrapText(ctx, snapshot.character.tagline, cx, y, contentMax, 44);

  y += 28;
  ctx.font = '48px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(starsText(snapshot.confidenceStars), cx, y);

  y += 88;
  const colW = contentMax / 3;
  const metaLabels = [labels.confidence, labels.basis, labels.analyzedAt];
  const metaValues = [`${snapshot.confidence}%`, labels.basisValue, analyzedDate];
  let metaBottom = y;

  for (let i = 0; i < 3; i += 1) {
    const colX = cx - contentMax / 2 + colW * i + colW / 2;
    const bottom = drawMetaColumn(ctx, colX, y, colW - 24, metaLabels[i], metaValues[i]);
    metaBottom = Math.max(metaBottom, bottom);
  }

  y = metaBottom + 56;
  ctx.font = '34px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = '#e5e7eb';
  const quote = `“${snapshot.oneLiner}”`;
  wrapText(ctx, quote, cx, y, contentMax, 48);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export DNA share card'));
    }, 'image/png');
  });
}
