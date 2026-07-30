import type { Request, Response, NextFunction } from 'express';
import {
  machineCoverListQuerySchema,
  machineCoverTargetMuscleQuerySchema,
  machineCoverUploadParamsSchema,
} from '@machinefit/shared';
import { machineCoverImageService } from '../services/machine-cover-image.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function listMachineCoverBrands(_req: Request, res: Response, next: NextFunction) {
  try {
    const brands = await machineCoverImageService.listBrands();
    res.json({ success: true, data: { brands } });
  } catch (error) {
    next(error);
  }
}

export async function listMachineCovers(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = machineCoverListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query');
    }
    const data = await machineCoverImageService.list(parsed.data);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function uploadMachineCover(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = machineCoverUploadParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid machine code');
    }
    const muscleParsed = machineCoverTargetMuscleQuerySchema.safeParse(req.query);
    if (!muscleParsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid target muscle');
    }
    if (!req.file) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Image file is required');
    }
    const item = await machineCoverImageService.upload({
      machineCode: parsed.data.machineCode,
      targetMuscle: muscleParsed.data.targetMuscle,
      file: req.file,
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteMachineCover(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = machineCoverUploadParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid machine code');
    }
    const muscleParsed = machineCoverTargetMuscleQuerySchema.safeParse(req.query);
    if (!muscleParsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid target muscle');
    }
    const data = await machineCoverImageService.remove(
      parsed.data.machineCode,
      muscleParsed.data.targetMuscle
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
