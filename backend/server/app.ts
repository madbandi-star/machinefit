import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { rateLimitMiddleware } from './middlewares/rate-limit.middleware.js';
import { cacheHeadersMiddleware } from './middlewares/cache-headers.middleware.js';
import { storageService } from './services/storage.service.js';

export function createApp() {
  const app = express();

  // Behind Render/proxy: trust X-Forwarded-* for correct IPs / rate limits.
  app.set('trust proxy', 1);
  app.set('etag', 'weak');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(compression());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimitMiddleware);
  app.use(env.API_BASE_PATH, cacheHeadersMiddleware);

  // Local-dev fallback for motivation audio when Supabase Storage is not configured.
  app.use(
    `${env.API_BASE_PATH}/media/motivation-audio`,
    express.static(storageService.localUploadRoot, {
      fallthrough: false,
      maxAge: '7d',
      setHeaders(res) {
        res.setHeader('Accept-Ranges', 'bytes');
      },
    })
  );

  app.use(env.API_BASE_PATH, apiRouter);

  app.use(errorMiddleware);

  return app;
}
