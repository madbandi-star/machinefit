import type { Request, Response, NextFunction } from 'express';
import {
  machineCoverListQuerySchema,
  machineCoverTargetMuscleSchema,
  machineCoverUploadParamsSchema,
  parseMachineCoverTargetMuscle,
  type TargetMuscleGroup,
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

async function handleUpload(
  req: Request,
  res: Response,
  targetMuscle?: TargetMuscleGroup
): Promise<void> {
  const parsed = machineCoverUploadParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid machine code');
  }
  if (!req.file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Image file is required');
  }
  const item = await machineCoverImageService.upload({
    machineCode: parsed.data.machineCode,
    targetMuscle,
    file: req.file,
  });
  res.status(201).json({ success: true, data: item });
}

export async function uploadMachineCover(req: Request, res: Response, next: NextFunction) {
  try {
    const muscleParsed = parseMachineCoverTargetMuscle(req.query, req.body);
    if (!muscleParsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid target muscle');
    }
    await handleUpload(req, res, muscleParsed.data.targetMuscle);
  } catch (error) {
    next(error);
  }
}

export async function uploadMachineCoverForMuscle(req: Request, res: Response, next: NextFunction) {
  try {
    const muscle = machineCoverTargetMuscleSchema.safeParse(req.params.targetMuscle);
    if (!muscle.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid target muscle');
    }
    await handleUpload(req, res, muscle.data);
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
    const muscleParsed = parseMachineCoverTargetMuscle(req.query, req.body);
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

export async function deleteMachineCoverForMuscle(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = machineCoverUploadParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid machine code');
    }
    const muscle = machineCoverTargetMuscleSchema.safeParse(req.params.targetMuscle);
    if (!muscle.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid target muscle');
    }
    const data = await machineCoverImageService.remove(parsed.data.machineCode, muscle.data);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
