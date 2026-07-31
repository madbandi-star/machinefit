import { env } from '../config/env.js';

export function publicApiBase(): string {
  if (env.PUBLIC_API_BASE_URL?.trim()) {
    return env.PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  // Prefer the production API host whenever we are not clearly in local/test,
  // so cover URLs written from one-off scripts still work on GitHub Pages.
  if (env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    return 'https://machinefit.onrender.com/api/v1';
  }
  return `http://localhost:${env.PORT}${env.API_BASE_PATH}`;
}

export function muscleGroupMediaUrl(muscleGroup: string, kind: 'main' | 'thumb'): string {
  return `${publicApiBase()}/media/muscle-group-images/${encodeURIComponent(muscleGroup)}/${kind}`;
}

export function machineCoverMediaUrl(
  machineCode: string,
  kind: 'main' | 'thumb',
  targetMuscle?: string | null
): string {
  const code = encodeURIComponent(machineCode);
  if (targetMuscle) {
    return `${publicApiBase()}/media/machine-covers/${code}/${encodeURIComponent(targetMuscle)}/${kind}`;
  }
  return `${publicApiBase()}/media/machine-covers/${code}/${kind}`;
}

export function brandAssetMediaUrl(brandCode: string, kind: 'logo' | 'hero'): string {
  return `${publicApiBase()}/media/brand-assets/${encodeURIComponent(brandCode)}/${kind}`;
}

export function photoBoardImageUrl(imageId: string, variant: 'main' | 'thumb' = 'thumb'): string {
  return `${publicApiBase()}/photo-board/images/${encodeURIComponent(imageId)}?variant=${variant}`;
}

export function machineTradeImageUrl(imageId: string, variant: 'full' | 'thumb' = 'thumb'): string {
  return `${publicApiBase()}/machine-trades/images/${encodeURIComponent(imageId)}?variant=${variant}`;
}

export function machineRequestImageUrl(
  imageId: string,
  variant: 'full' | 'thumb' = 'thumb'
): string {
  return `${publicApiBase()}/machine-requests/images/${encodeURIComponent(imageId)}?variant=${variant}`;
}
