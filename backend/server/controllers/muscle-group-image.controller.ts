import type { Request, Response, NextFunction } from 'express';
import { muscleGroupImageKeySchema } from '@machinefit/shared';
import { muscleGroupImageService } from '../services/muscle-group-image.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function listMuscleGroupImages(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = await muscleGroupImageService.list();
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
}

export async function uploadMuscleGroupImage(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = muscleGroupImageKeySchema.safeParse(req.params.muscleGroup);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid muscle group');
    }
    if (!req.file) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Image file is required');
    }
    const item = await muscleGroupImageService.upload({
      muscleGroup: parsed.data,
      file: req.file,
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteMuscleGroupImage(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = muscleGroupImageKeySchema.safeParse(req.params.muscleGroup);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid muscle group');
    }
    const item = await muscleGroupImageService.remove(parsed.data);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}
