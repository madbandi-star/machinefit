import type { FortuneScores, FortuneSection } from '@machinefit/shared';
import { drawShareBrandLockup } from '@/utils/shareBrandFooter';
import { measureShareFooterH } from '@/utils/shareHashtags';

export interface FortuneShareCardLabels {
  title: string;
  healthman: string;
  prLuck: string;
  recoveryLuck: string;
  tagline: string;
  hashtags: string;
}

export interface FortuneShareCardInput {
  fortune: FortuneSection;
  scores: FortuneScores;
  emoji: string;
  themeLabel: string;
  dateLabel: string;
  labels: FortuneShareCardLabels;
}

/** Match Lifter DNA share stack font / spacing language. */
const FONT =
  'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", "Apple Color Emoji", sans-serif';

const W = 1080;
const H = 1350;
const GREEN = '#4ade80';
const GOLD = '#fbbf24';
const FOOTER_MIN_H = 64;

const QUOTE_FONT_SIZE = 34;
const QUOTE_LINE_HEIGHT = 46;
const QUOTE_TARGET_CHARS_PER_LINE = 20;

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

function countWrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): number {
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
        if (isWrapBreakpoint(line[i]!)) {
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
  return [`“${lines[0]}`, ...lines.slice(1, -1), `${lines[lines.length - 1]}”`];
}

function measureBalancedWrapHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): number {
  const quoted = formatQuotedLines(getBalancedWrapLines(ctx, text, maxWidth));
  return quoted.length * lineHeight;
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

function starsText(n: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(n)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

function resolveShareBgUrl(): string {
  const base = String(import.meta.env.BASE_URL ?? '/');
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${normalized}assets/share/fortune-share-bg.png`;
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

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = width / height;
  let dw: number;
  let dh: number;
  let dx: number;
  let dy: number;
  if (ir > cr) {
    dh = height;
    dw = height * ir;
    dx = (width - dw) / 2;
    dy = 0;
  } else {
    dw = width;
    dh = width / ir;
    dx = 0;
    dy = (height - dh) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawPageBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, W * 0.15, H);
  gradient.addColorStop(0, '#1a0a14');
  gradient.addColorStop(0.45, '#0f172a');
  gradient.addColorStop(1, '#042f2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
  ctx.beginPath();
  ctx.arc(W * 0.18, H * 0.2, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
  ctx.beginPath();
  ctx.arc(W * 0.88, H * 0.72, 320, 0, Math.PI * 2);
  ctx.fill();
}

function drawEmojiGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
  glow.addColorStop(0.55, 'rgba(251, 113, 133, 0.12)');
  glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
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
    return labelLH + labelValueGap + countWrapLines(ctx, value, maxColWidth) * valueLH;
  });
  const contentH = Math.max(...colHeights);
  const contentTop = y + (h - contentH) / 2;
  const dividerTop = contentTop - 10;
  const dividerBottom = contentTop + contentH + 10;

  for (let i = 0; i < 3; i += 1) {
    const colX = x + colW * i + colW / 2;
    const colTop = contentTop + (contentH - colHeights[i]!) / 2;
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
    ctx.fillText(labels[i]!, colX, colTop + labelLH * 0.82);
    ctx.font = `bold 32px ${FONT}`;
    ctx.fillStyle = '#f9fafb';
    wrapText(
      ctx,
      values[i]!,
      colX,
      colTop + labelLH + labelValueGap + valueLH * 0.82,
      maxColWidth,
      valueLH
    );
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
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const padX = 56;
  const maxWidth = w - padX * 2;
  const lines = formatQuotedLines(
    getBalancedWrapLines(ctx, quote.trim(), maxWidth, QUOTE_TARGET_CHARS_PER_LINE)
  );
  ctx.font = `${QUOTE_FONT_SIZE}px ${FONT}`;
  ctx.fillStyle = '#e5e7eb';
  drawCenteredWrapText(ctx, lines, x + w / 2, y, h, QUOTE_LINE_HEIGHT);
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  left: number,
  topY: number,
  width: number,
  _height: number,
  hashtags: string
) {
  const right = left + width;
  const markSize = 28;
  const logoRowY = topY + markSize;
  drawShareBrandLockup(ctx, left, logoRowY, FONT);

  const tags = hashtags.split(/\s+/).filter(Boolean);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `600 22px ${FONT}`;
  ctx.fillStyle = GREEN;
  const tagsBlockH = Math.max(0, (tags.length - 1) * 26);
  const tagStartY = logoRowY + 10 - tagsBlockH / 2;
  tags.forEach((tag, i) => {
    ctx.fillText(tag, right, tagStartY + i * 26);
  });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
}

/**
 * Helchang fortune share card — same centered DNA stack composition:
 * eyebrow → emoji → headline → theme → stars → 3-col meta → quote → footer.
 */
export async function buildFortuneShareCard(input: FortuneShareCardInput): Promise<Blob> {
  const { fortune, scores, emoji, themeLabel, dateLabel, labels } = input;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const bg = await loadImage(resolveShareBgUrl());
  if (bg) {
    drawImageCover(ctx, bg, W, H);
    ctx.fillStyle = 'rgba(8, 12, 20, 0.42)';
    ctx.fillRect(0, 0, W, H);
  } else {
    drawPageBackground(ctx);
  }

  const cardX = 48;
  const cardY = 48;
  const cardW = W - cardX * 2;
  const cardH = H - cardY * 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 40);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const cx = W / 2;
  const contentMax = cardW - 128;
  const innerX = cardX + 64;
  const footerInnerW = cardW - 128;
  const quotePanelW = cardW - 128;
  const quoteMaxWidth = quotePanelW - 112;

  const headline = fortune.keywordTitle || fortune.title;
  const quote = (fortune.oneLiner || fortune.headline || '').trim();
  const eyebrow = `⚡ ${labels.title}`;

  ctx.textAlign = 'center';
  ctx.font = `bold 52px ${FONT}`;
  const headlineHeight = measureWrapHeight(ctx, headline, contentMax, 62);
  ctx.font = `34px ${FONT}`;
  const themeHeight = measureWrapHeight(ctx, themeLabel, contentMax, 44);
  ctx.font = `${QUOTE_FONT_SIZE}px ${FONT}`;
  const quoteHeight = measureBalancedWrapHeight(ctx, quote, quoteMaxWidth, QUOTE_LINE_HEIGHT);

  const gapSm = 24;
  const gapMd = 40;
  const gapLg = 56;
  const gapQuoteToFooter = 12;
  const metaPanelH = 168;
  const quotePanelH = Math.max(140, quoteHeight + 88);
  const footerH = measureShareFooterH(labels.hashtags, { minH: FOOTER_MIN_H });

  // DNA-identical vertical stack budget (eyebrow → date → emoji → title → theme → stars → meta → quote → footer)
  const blockHeight =
    30 + // eyebrow
    28 + // date
    gapMd +
    200 + // emoji zone
    gapMd +
    headlineHeight +
    gapSm +
    themeHeight +
    gapMd +
    48 + // stars
    gapLg +
    metaPanelH +
    gapLg +
    quotePanelH +
    gapQuoteToFooter +
    footerH;

  const verticalBias = 36;
  let y = cardY + Math.max(96, (cardH - blockHeight) / 2 + verticalBias);

  // Eyebrow
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillStyle = '#fda4af';
  ctx.fillText(eyebrow, cx, y);

  y += 28;
  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = '#9ca3af';
  ctx.fillText(dateLabel, cx, y);

  // Emoji zone (same 200px slot as DNA)
  y += gapMd;
  drawEmojiGlow(ctx, cx, y + 24, 118);
  ctx.font = `176px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(emoji, cx, y + 96);

  y += 200;
  ctx.font = `bold 52px ${FONT}`;
  ctx.fillStyle = '#f9fafb';
  y = wrapText(ctx, headline, cx, y, contentMax, 62);

  y += gapSm;
  ctx.font = `34px ${FONT}`;
  ctx.fillStyle = GOLD;
  y = wrapText(ctx, themeLabel, cx, y, contentMax, 44);

  y += gapMd;
  ctx.font = `48px ${FONT}`;
  ctx.fillStyle = GOLD;
  ctx.fillText(starsText(fortune.scoreStars), cx, y);

  y += gapLg;
  drawMetaPanel(
    ctx,
    innerX,
    y,
    cardW - 128,
    metaPanelH,
    [labels.healthman, labels.prLuck, labels.recoveryLuck],
    [`${scores.healthmanIndex}`, `${scores.prLuck}%`, `${scores.recoveryLuck}%`]
  );

  y += metaPanelH + gapLg;
  if (quote) {
    drawQuotePanel(ctx, innerX, y, quotePanelW, quotePanelH, quote);
    y += quotePanelH + gapQuoteToFooter;
  } else {
    y += gapMd;
  }

  drawFooter(ctx, innerX, y, footerInnerW, footerH, labels.hashtags);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export fortune share card'));
    }, 'image/png');
  });
}
