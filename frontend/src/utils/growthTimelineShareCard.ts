interface GrowthShareInput {
  locale: string;
  displayName: string;
  journeyDays: number;
  workouts: number;
  volumeKg: number;
  topMachineName: string | null;
  bestGrowthPct: number | null;
  headline: string;
}

export async function buildGrowthTimelineShareCard(input: GrowthShareInput): Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.45, '#1e293b');
  gradient.addColorStop(1, '#134e4a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(45, 212, 191, 0.14)';
  ctx.beginPath();
  ctx.arc(width * 0.85, 180, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillStyle = '#99f6e4';
  ctx.fillText(
    input.locale.startsWith('ko') ? '📈 MachineFit 성장 리포트' : '📈 MachineFit Growth Report',
    width / 2,
    180
  );

  ctx.font = '36px system-ui, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  wrapText(ctx, input.headline, width / 2, 280, width - 160, 48);

  ctx.font = '800 72px system-ui, sans-serif';
  ctx.fillStyle = '#5eead4';
  ctx.fillText(`${input.journeyDays.toLocaleString()} days`, width / 2, 480);

  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(
    `${input.workouts.toLocaleString()} workouts`,
    width / 2,
    580
  );
  ctx.fillText(
    `${(input.volumeKg / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} tons`,
    width / 2,
    650
  );

  if (input.topMachineName) {
    ctx.font = '34px system-ui, sans-serif';
    ctx.fillStyle = '#a5f3fc';
    ctx.fillText(
      input.locale.startsWith('ko')
        ? `최고 성장 머신 · ${input.topMachineName}`
        : `Top growth machine · ${input.topMachineName}`,
      width / 2,
      760
    );
  }

  if (input.bestGrowthPct != null) {
    ctx.font = '800 64px system-ui, sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText(`+${input.bestGrowthPct}%`, width / 2, 880);
  }

  ctx.font = '32px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(input.displayName, width / 2, 1080);
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('MachineFit', width / 2, 1160);
  ctx.font = '28px system-ui, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('#MachineFit', width / 2, 1220);

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
