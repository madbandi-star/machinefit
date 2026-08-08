import type { Request, Response, NextFunction } from 'express';
import {
  fortuneContentCreateSchema,
  fortuneContentUpdateSchema,
} from '@machinefit/shared';
import { fortuneContentRepository } from '../repositories/fortune-content.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { fortuneService } from '../services/fortune/fortune.service.js';

export async function listFortuneContent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined;
    const category =
      typeof req.query.category === 'string' ? req.query.category : undefined;
    const includeInactive = req.query.includeInactive === 'true';
    const data = await fortuneContentRepository.listAdmin({
      locale,
      category,
      includeInactive,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createFortuneContent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = fortuneContentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const data = await fortuneContentRepository.create(parsed.data);
    if (!data) throw new AppError(500, 'DB_ERROR', 'Create failed');
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateFortuneContent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const parsed = fortuneContentUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const data = await fortuneContentRepository.update(id, parsed.data);
    if (!data) throw new AppError(404, 'NOT_FOUND', 'Content not found');
    fortuneService.clearCache();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteFortuneContent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ok = await fortuneContentRepository.remove(String(req.params.id));
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Content not found');
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}
