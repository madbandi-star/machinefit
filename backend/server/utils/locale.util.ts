import type { Request } from 'express';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@machinefit/shared';

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function resolveRequestLocale(req: Request): Locale {
  const queryLocale = req.query.locale;
  if (typeof queryLocale === 'string' && isLocale(queryLocale)) {
    return queryLocale;
  }

  const acceptLanguage = req.headers['accept-language'];
  if (typeof acceptLanguage === 'string') {
    for (const part of acceptLanguage.split(',')) {
      const code = part.trim().split(';')[0]?.slice(0, 2);
      if (code && isLocale(code)) {
        return code;
      }
    }
  }

  return DEFAULT_LOCALE;
}
