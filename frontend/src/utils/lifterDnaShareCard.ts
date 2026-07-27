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

const FONT =
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

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

function measureWrapHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): number {
  const chars = [...text];
  let line = '';
  let lines = 1;

  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      line = ch;
      lines += 1;
    } else {
      line = test;
    }
  }

  return lines * lineHeight;
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

function drawPageBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width * 0.15, height);
  gradient.addColorStop(0, '#14081f');
  gradient.addColorStop(0.45, '#0f172a');
  gradient.addColorStop(1, '#042f2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(167, 139, 250, 0.16)';
  ctx.beginPath();
  ctx.arc(width * 0.12, height * 0.18, 280, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(74, 222, 128, 0.1)';
  ctx.beginPath();
  ctx.arc(width * 0.9, height * 0.72, 320, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.92, 240, 0, Math.PI * 2);
  ctx.fill();
}

function drawEmojiGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
  glow.addColorStop(0, 'rgba(167, 139, 250, 0.28)');
  glow.addColorStop(0.55, 'rgba(74, 222, 128, 0.12)');
  glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function countWrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): number {
  const chars = [...text];
  let line = '';
  let lines = 1;

  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      line = ch;
      lines += 1;
    } else {
      line = test;
    }
  }

  return lines;
}

function drawMetaPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  labels: string[],
  values: string[]
) {
  roundRect(ctx, x, y, w, h, 24);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const colW = w / 3;
  const padX = 18;
  const labelLH = 30;
  const valueLH = 40;
  const labelValueGap = 14;
  const maxColWidth = colW - padX * 2;

  const colHeights = values.map((value) => {
    ctx.font = `bold 32px ${FONT}`;
    const valueLines = countWrapLines(ctx, value, maxColWidth);
    return labelLH + labelValueGap + valueLines * valueLH;
  });
  const contentH = Math.max(...colHeights);
  const contentTop = y + (h - contentH) / 2;
  const dividerTop = contentTop - 10;
  const dividerBottom = contentTop + contentH + 10;

  for (let i = 0; i < 3; i += 1) {
    const colX = x + colW * i + colW / 2;
    const colTop = contentTop + (contentH - colHeights[i]) / 2;

    if (i > 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.beginPath();
      ctx.moveTo(x + colW * i, dividerTop);
      ctx.lineTo(x + colW * i, dividerBottom);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.font = `24px ${FONT}`;
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(labels[i], colX, colTop + labelLH * 0.82);

    ctx.font = `bold 32px ${FONT}`;
    ctx.fillStyle = '#f9fafb';
    wrapText(ctx, values[i], colX, colTop + labelLH + labelValueGap + valueLH * 0.82, maxColWidth, valueLH);
  }
}

const QUOTE_FONT_SIZE = 34;
const QUOTE_LINE_HEIGHT = 46;
/** Prefer wrapping before this many chars so long Korean lines break naturally. */
const QUOTE_TARGET_CHARS_PER_LINE = 20;

function isWrapBreakpoint(ch: string): boolean {
  return /[\s,.·…!?;:)]/.test(ch);
}

function getBalancedWrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxCharsPerLine = QUOTE_TARGET_CHARS_PER_LINE
): string[] {
  const chars = [...text];
  const lines: string[] = [];
  let line = '';

  const pushLine = (value: string) => {
    const trimmed = value.trimEnd();
    if (trimmed) lines.push(trimmed);
  };

  for (const ch of chars) {
    const test = line + ch;
    const tooWide = ctx.measureText(test).width > maxWidth;
    const tooLong = line.length >= maxCharsPerLine;

    if ((tooWide || tooLong) && line.length > 0) {
      let breakAt = -1;
      for (let i = line.length - 1; i >= Math.max(0, line.length - 10); i -= 1) {
        if (isWrapBreakpoint(line[i])) {
          breakAt = i + 1;
          break;
        }
      }

      if (breakAt > 0) {
        pushLine(line.slice(0, breakAt));
        line = line.slice(breakAt).trimStart() + ch;
      } else {
        pushLine(line);
        line = ch;
      }
    } else {
      line = test;
    }
  }

  if (line) pushLine(line);
  return lines.length ? lines : [''];
}

function formatQuotedLines(lines: string[]): string[] {
  if (lines.length === 0) return [''];
  if (lines.length === 1) return [`“${lines[0]}”`];

  return [
    `“${lines[0]}`,
    ...lines.slice(1, -1),
    `${lines[lines.length - 1]}”`,
  ];
}

function measureBalancedWrapHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
  maxCharsPerLine = QUOTE_TARGET_CHARS_PER_LINE
): number {
  const innerLines = getBalancedWrapLines(ctx, text, maxWidth, maxCharsPerLine);
  const quotedLines = formatQuotedLines(innerLines);
  return quotedLines.length * lineHeight;
}

function drawCenteredWrapText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  centerX: number,
  boxY: number,
  boxH: number,
  lineHeight: number
) {
  const totalHeight = lines.length * lineHeight;
  let cursorY = boxY + (boxH - totalHeight) / 2 + lineHeight * 0.82;

  ctx.textAlign = 'center';
  for (const line of lines) {
    ctx.fillText(line, centerX, cursorY);
    cursorY += lineHeight;
  }
}

function drawQuotePanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  quote: string
) {
  roundRect(ctx, x, y, w, h, 24);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(196, 181, 253, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const padX = 56;
  const maxWidth = w - padX * 2;
  const inner = quote.trim();
  const innerLines = getBalancedWrapLines(ctx, inner, maxWidth, QUOTE_TARGET_CHARS_PER_LINE);
  const lines = formatQuotedLines(innerLines);

  ctx.font = `${QUOTE_FONT_SIZE}px ${FONT}`;
  ctx.fillStyle = '#e5e7eb';
  drawCenteredWrapText(ctx, lines, x + w / 2, y, h, QUOTE_LINE_HEIGHT);
}

/** Share card — vertically balanced hero layout for social sharing. */
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

  const cardX = 48;
  const cardY = 48;
  const cardW = width - cardX * 2;
  const cardH = height - cardY * 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 40);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.74)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const cx = width / 2;
  const contentMax = cardW - 128;
  const innerX = cardX + 64;

  ctx.textAlign = 'center';

  const quotePanelW = cardW - 128;
  const quoteMaxWidth = quotePanelW - 112;

  ctx.font = `bold 30px ${FONT}`;
  const headlineHeight = measureWrapHeight(ctx, snapshot.shareHeadline, contentMax, 62);
  ctx.font = `34px ${FONT}`;
  const taglineHeight = measureWrapHeight(ctx, snapshot.character.tagline, contentMax, 44);
  ctx.font = `${QUOTE_FONT_SIZE}px ${FONT}`;
  const quoteHeight = measureBalancedWrapHeight(
    ctx,
    snapshot.oneLiner.trim(),
    quoteMaxWidth,
    QUOTE_LINE_HEIGHT
  );

  const gapSm = 24;
  const gapMd = 40;
  const gapLg = 56;
  const metaPanelH = 168;
  const quotePanelH = Math.max(140, quoteHeight + 88);
  const footerH = 72;

  const blockHeight =
    60 + // eyebrow + gap below
    200 + // emoji zone
    gapMd +
    headlineHeight +
    gapSm +
    taglineHeight +
    gapMd +
    48 + // stars
    gapLg +
    metaPanelH +
    gapLg +
    quotePanelH +
    gapMd +
    footerH;

  const verticalBias = 36;
  let y = cardY + Math.max(96, (cardH - blockHeight) / 2 + verticalBias);

  ctx.font = `bold 30px ${FONT}`;
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText(labels.complete, cx, y);

  y += gapMd + 20;
  drawEmojiGlow(ctx, cx, y + 24, 118);
  ctx.font = `176px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(snapshot.character.emoji, cx, y + 96);

  y += 200;
  ctx.font = `bold 52px ${FONT}`;
  ctx.fillStyle = '#f9fafb';
  y = wrapText(ctx, snapshot.shareHeadline, cx, y, contentMax, 62);

  y += gapSm;
  ctx.font = `34px ${FONT}`;
  ctx.fillStyle = '#86efac';
  y = wrapText(ctx, snapshot.character.tagline, cx, y, contentMax, 44);

  y += gapMd;
  ctx.font = `48px ${FONT}`;
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(starsText(snapshot.confidenceStars), cx, y);

  y += gapLg;
  drawMetaPanel(
    ctx,
    innerX,
    y,
    cardW - 128,
    metaPanelH,
    [labels.confidence, labels.basis, labels.analyzedAt],
    [`${snapshot.confidence}%`, labels.basisValue, analyzedDate]
  );

  y += metaPanelH + gapLg;
  drawQuotePanel(ctx, innerX, y, quotePanelW, quotePanelH, snapshot.oneLiner);

  y += quotePanelH + gapMd;
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillStyle = '#4ade80';
  ctx.fillText('MachineFit', cx, y);
  ctx.font = `24px ${FONT}`;
  ctx.fillStyle = 'rgba(134, 239, 172, 0.72)';
  ctx.fillText('#MacineFit #운동성향', cx, y + 34);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export DNA share card'));
    }, 'image/png');
  });
}
