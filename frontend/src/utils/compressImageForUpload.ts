/** Browser-side image shrink before multipart upload (avoids stuck progress on large Gemini/PNG files). */

const DEFAULT_MAX_EDGE = 1280;
const DEFAULT_MAX_BYTES = 1.5 * 1024 * 1024;
const JPEG_QUALITY_START = 0.85;

function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not encode image'));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

/**
 * Resize/compress an image File for admin cover uploads.
 * Returns the original file when the browser cannot decode it (non-image or exotic codec).
 */
export async function compressImageForUpload(
  file: File,
  options?: { maxEdge?: number; maxBytes?: number }
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;

  const maxEdge = options?.maxEdge ?? DEFAULT_MAX_EDGE;
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;

  // Already small enough — skip work.
  if (file.size <= maxBytes && file.type !== 'image/png') {
    // Still decode PNG/JPEG that are huge in pixels even if under maxBytes? Check below.
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await loadImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (scale >= 1 && file.size <= maxBytes && file.type === 'image/jpeg') {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let quality = JPEG_QUALITY_START;
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    while (blob.size > maxBytes && quality > 0.5) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'cover';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    try {
      bitmap.close();
    } catch {
      /* ignore */
    }
    return file;
  }
}
