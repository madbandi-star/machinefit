interface AchievementShareInput {
  emoji: string;
  name: string;
  description: string;
  rarity: string;
  xp: number;
  locale: string;
  displayName: string;
}

export async function buildAchievementShareCard(input: AchievementShareInput): Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#120a1f');
  gradient.addColorStop(0.5, '#1a1030');
  gradient.addColorStop(1, '#0c1b2a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(250, 204, 21, 0.12)';
  ctx.beginPath();
  ctx.arc(width * 0.2, height * 0.2, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '72px system-ui, sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.textAlign = 'center';
  ctx.fillText(
    input.locale.startsWith('ko') ? '🏆 새로운 업적 획득!' : '🏆 Achievement Unlocked!',
    width / 2,
    200
  );

  ctx.font = '140px system-ui, sans-serif';
  ctx.fillText(input.emoji, width / 2, 420);

  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillStyle = '#fff7ed';
  wrapText(ctx, input.name, width / 2, 520, width - 160, 72);

  ctx.font = '36px system-ui, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  wrapText(ctx, input.description, width / 2, 680, width - 180, 48);

  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`${input.rarity.toUpperCase()}  ·  +${input.xp.toLocaleString()} XP`, width / 2, 900);

  ctx.font = '32px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(input.displayName, width / 2, 1100);

  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('MachineFit', width / 2, 1180);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Failed to export share card'));
      else resolve(blob);
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
  let yy = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = ch;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
