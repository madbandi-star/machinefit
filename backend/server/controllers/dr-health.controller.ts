import type { Request, Response, NextFunction } from 'express';
import {
  buildDrHealth,
  buildLiveProbe,
  buildMetaPayload,
  buildReadyProbe,
} from '../services/dr-health.service.js';

/** Root / detailed DR health — 200 healthy / 503 unhealthy. */
export async function drHealthCheck(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { httpStatus, body } = await buildDrHealth();
    res.status(httpStatus).json(body);
  } catch (error) {
    next(error);
  }
}

export async function readyCheck(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { httpStatus, body } = await buildReadyProbe();
    res.status(httpStatus).json(body);
  } catch (error) {
    next(error);
  }
}

export function liveCheck(_req: Request, res: Response): void {
  const { httpStatus, body } = buildLiveProbe();
  res.status(httpStatus).json(body);
}

/** Non-secret deploy metadata (env / version / commit). */
export function metaCheck(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: buildMetaPayload(),
  });
}
