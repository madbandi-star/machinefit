import { Router } from 'express';
import { LOCALES, DEFAULT_LOCALE } from '@machinefit/shared';

export const metaRouter = Router();

metaRouter.get('/countries', (_req, res) => {
  res.json({
    success: true,
    data: [
      { code: 'KR', name: { en: 'South Korea', ko: '대한민국' }, defaultTimezone: 'Asia/Seoul' },
      { code: 'US', name: { en: 'United States', ko: '미국' }, defaultTimezone: 'America/New_York' },
      { code: 'JP', name: { en: 'Japan', ko: '일본' }, defaultTimezone: 'Asia/Tokyo' },
      { code: 'CN', name: { en: 'China', ko: '중국' }, defaultTimezone: 'Asia/Shanghai' },
    ],
  });
});

metaRouter.get('/languages', (_req, res) => {
  res.json({
    success: true,
    data: LOCALES.map((code) => ({
      code,
      name: code,
      isDefault: code === DEFAULT_LOCALE,
    })),
  });
});

metaRouter.get('/units', (_req, res) => {
  res.json({
    success: true,
    data: {
      height: ['cm', 'ft_in'],
      weight: ['kg', 'lb'],
    },
  });
});
