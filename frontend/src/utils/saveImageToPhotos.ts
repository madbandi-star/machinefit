/**
 * Save a PNG toward the device photo library.
 * Browsers cannot write the Camera Roll directly — Web Share with an image file
 * is what surfaces “Save Image” / gallery targets on iOS & Android.
 */
export async function savePngBlobToPhotos(input: {
  blob: Blob;
  filename: string;
  title?: string;
  /** Shown on touch devices when Web Share file API is unavailable. */
  longPressHint?: string;
  closeLabel?: string;
}): Promise<'shared' | 'preview' | 'downloaded'> {
  const { blob, filename, title, longPressHint, closeLabel } = input;
  const file = new File([blob], filename, { type: 'image/png' });

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: title || filename,
    });
    return 'shared';
  }

  // Touch devices without file-share: show the image so the user can long-press → Save Image.
  if (isLikelyTouchDevice()) {
    await openImageSavePreview(blob, filename, {
      hint: longPressHint || 'Long-press the image to save it to Photos',
      closeLabel: closeLabel || 'Close',
    });
    return 'preview';
  }

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
  return 'downloaded';
}

export async function dataUrlToPngBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  if (blob.type && blob.type !== 'image/png') {
    return new Blob([blob], { type: 'image/png' });
  }
  return blob;
}

export function isShareAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name?: string }).name) : '';
  return name === 'AbortError';
}

function isLikelyTouchDevice(): boolean {
  return (
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)
  );
}

function openImageSavePreview(
  blob: Blob,
  filename: string,
  labels: { hint: string; closeLabel: string }
): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem;padding-bottom:calc(1rem + env(safe-area-inset-bottom,0px));gap:.75rem;';

    const hint = document.createElement('p');
    hint.textContent = labels.hint;
    hint.style.cssText =
      'margin:0;color:#f4f7f0;font:600 0.95rem/1.4 system-ui,sans-serif;text-align:center;';

    const img = document.createElement('img');
    img.src = url;
    img.alt = filename;
    img.style.cssText =
      'max-width:100%;max-height:min(78dvh,900px);object-fit:contain;border-radius:12px;touch-action:manipulation;-webkit-touch-callout:default;user-select:none;';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = labels.closeLabel;
    closeBtn.style.cssText =
      'min-height:2.75rem;padding:.65rem 1.4rem;border-radius:999px;border:1px solid rgba(255,255,255,.45);background:rgba(0,0,0,.4);color:#fff;font:700 1rem/1 system-ui,sans-serif;cursor:pointer;';

    const cleanup = () => {
      overlay.remove();
      URL.revokeObjectURL(url);
      resolve();
    };
    closeBtn.addEventListener('click', cleanup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup();
    });

    overlay.append(hint, img, closeBtn);
    document.body.append(overlay);
  });
}
