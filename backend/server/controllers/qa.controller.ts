import type { Request, Response, NextFunction } from 'express';
import {
  createQaArticleSchema,
  qaFeedbackBodySchema,
  qaIdParamsSchema,
  qaListQuerySchema,
  qaPublishBodySchema,
  qaReorderBodySchema,
  updateQaArticleSchema,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { qaService } from '../services/qa.service.js';

export async function listPublicQa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = qaListQuerySchema.parse(req.query);
    const data = await qaService.listPublic(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listAdminQa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = qaListQuerySchema.parse(req.query);
    const data = await qaService.listAdmin({
      ...query,
      includeUnpublished: true,
      pageSize: query.pageSize || 50,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listQaCategories(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await qaService.categories();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getPublicQa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = qaIdParamsSchema.parse(req.params);
    const data = await qaService.getPublic(id, req.user?.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getAdminQa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = qaIdParamsSchema.parse(req.params);
    const data = await qaService.getAdmin(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createQa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const body = createQaArticleSchema.parse(req.body);
    const data = await qaService.create(body, req.user.userId);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateQa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const { id } = qaIdParamsSchema.parse(req.params);
    const body = updateQaArticleSchema.parse(req.body);
    const data = await qaService.update(id, body, req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function publishQa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const { id } = qaIdParamsSchema.parse(req.params);
    const body = qaPublishBodySchema.parse(req.body);
    await qaService.setPublished(id, body.isPublished, req.user.userId);
    res.json({ success: true, data: { id, isPublished: body.isPublished } });
  } catch (err) {
    next(err);
  }
}

export async function deleteQa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = qaIdParamsSchema.parse(req.params);
    await qaService.remove(id);
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
}

export async function reorderQa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = qaReorderBodySchema.parse(req.body);
    await qaService.reorder(body.items);
    res.json({ success: true, data: { updated: body.items.length } });
  } catch (err) {
    next(err);
  }
}

export async function feedbackQa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const { id } = qaIdParamsSchema.parse(req.params);
    const body = qaFeedbackBodySchema.parse(req.body);
    const data = await qaService.feedback(id, req.user.userId, body.value);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function qaStats(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await qaService.stats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
