import { env } from '../config/env.js';

export function publicApiBase(): string {
  if (env.PUBLIC_API_BASE_URL?.trim()) {
    return env.PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  if (env.NODE_ENV === 'production') {
    return 'https://machinefit-api.onrender.com/api/v1';
  }
  return `http://localhost:${env.PORT}${env.API_BASE_PATH}`;
}

export function muscleGroupMediaUrl(
  muscleGroup: string,
  kind: 'main' | 'thumb',
  version: number
): string {
  return `${publicApiBase()}/media/muscle-group-images/${encodeURIComponent(muscleGroup)}/${kind}?v=${version}`;
}
