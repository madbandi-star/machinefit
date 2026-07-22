import type { Request, Response, NextFunction } from 'express';
import {
  createMotivationTrackFromUrlSchema,
  updateMotivationTrackSchema,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { userMotivationTrackService } from '../services/user-motivation-track.service.js';

function requireUser(req: Request) {
  if (!req.user?.userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.user.userId;
}

export async function listTracks(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUser(req);
    const data = await userMotivationTrackService.list(userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createFromUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUser(req);
    const input = createMotivationTrackFromUrlSchema.parse(req.body);
    const track = await userMotivationTrackService.createFromUrl(userId, input);
    res.status(201).json({ success: true, data: track });
  } catch (error) {
    next(error);
  }
}

export async function createFromUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUser(req);
    if (!req.file) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Audio file is required');
    }

    const title = typeof req.body?.title === 'string' ? req.body.title : undefined;
    const setAsDefault =
      req.body?.setAsDefault === true ||
      req.body?.setAsDefault === 'true' ||
      req.body?.setAsDefault === '1';
    const durationRaw = req.body?.durationSeconds;
    const durationSeconds =
      durationRaw === undefined || durationRaw === '' || durationRaw === null
        ? null
        : Number(durationRaw);

    if (durationSeconds != null && (!Number.isFinite(durationSeconds) || durationSeconds < 0)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid durationSeconds');
    }

    const track = await userMotivationTrackService.createFromUpload(userId, req.file, {
      title,
      durationSeconds,
      setAsDefault,
    });
    res.status(201).json({ success: true, data: track });
  } catch (error) {
    next(error);
  }
}

export async function updateTrack(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUser(req);
    const input = updateMotivationTrackSchema.parse(req.body);
    const track = await userMotivationTrackService.update(userId, String(req.params.id), input);
    res.json({ success: true, data: track });
  } catch (error) {
    next(error);
  }
}

export async function deleteTrack(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUser(req);
    await userMotivationTrackService.remove(userId, String(req.params.id));
    res.json({ success: true, data: { message: 'deleted' } });
  } catch (error) {
    next(error);
  }
}
