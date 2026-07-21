import type { LifterDnaSnapshot } from '@machinefit/shared';

interface DnaShareInput {
  snapshot: LifterDnaSnapshot;
  locale: string;
  displayName: string;
}

function starsText(n: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(Math.max(0, 5 - n));
}

/** Spotify Wrapped–style share card for Lifter DNA. */
export async function buildLifterDnaShareCard(input: DnaShareInput): Promise<Blob> {
  const { snapshot, locale, displayName } = input;
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a0b2e');
  gradient.addColorStop(0.45, '#0f172a');
  gradient.addColorStop(1, '#064e3b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(167, 139, 250, 0.14)';
  ctx.beginPath();
  ctx.arc(width * 0.15, height * 0.2, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(74, 222, 128, 0.12)';
  ctx.beginPath();
  ctx.arc(width * 0.9, height * 0.75, 300, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText('🤖 MachineFit AI', width / 2, 140);

  ctx.font = '28px system-ui, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText(displayName, width / 2, 200);

  ctx.font = '140px system-ui, sans-serif';
  ctx.fillText(snapshot.character.emoji, width / 2, 380);

  ctx.font = 'bold 56px system-ui, sans-serif';
  ctx.fillStyle = '#f9fafb';
  wrapText(ctx, snapshot.shareHeadline, width / 2, 460, width - 140, 64);

  const topTraits = snapshot.traits.slice(0, 3);
  let y = 700;
  for (const trait of topTraits) {
    ctx.font = '32px system-ui, sans-serif';
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText(`${trait.emoji} ${trait.label}  ${starsText(trait.stars)}`, width / 2, y);
    y += 70;
  }

  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillStyle = '#a78bfa';
  const conf =
    locale.startsWith('ko')
      ? `AI 신뢰도 ${snapshot.confidence}%`
      : `AI confidence ${snapshot.confidence}%`;
  ctx.fillText(conf, width / 2, 980);

  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('MachineFit', width / 2, height - 120);

  ctx.font = '28px system-ui, sans-serif';
  ctx.fillStyle = '#86efac';
  ctx.fillText('#MachineFit #LifterDNA', width / 2, height - 70);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export DNA share card'));
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
  if (line) ctx.fillText(line, x, cursorY);
}
