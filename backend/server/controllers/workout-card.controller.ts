import type { Request, Response } from 'express';
import type {
  ApplyWorkoutCardTemplateInput,
  CopyWorkoutCardInput,
  CreateWorkoutCardInput,
  CreateWorkoutCardTemplateInput,
  MoveWorkoutCardDateInput,
  PatchWorkoutCardStatusInput,
  ResolveMissedWorkoutCardInput,
  UpdateWorkoutCardInput,
} from '@machinefit/shared';
import { workoutCardService } from '../services/workout-card.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getValidatedQuery } from '../middlewares/validate.middleware.js';
import { resolveRequestLocale } from '../utils/locale.util.js';
import { getParam } from '../utils/params.util.js';

export async function listWorkoutCards(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = getValidatedQuery<Parameters<typeof workoutCardService.list>[1]>(res);
  const locale = resolveRequestLocale(req);
  const items = await workoutCardService.list(req.user.userId, query, locale);
  res.json({ success: true, data: items });
}

export async function createWorkoutCard(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = req.body as CreateWorkoutCardInput;
  const locale = resolveRequestLocale(req);
  const item = await workoutCardService.create(req.user.userId, body, locale);
  res.status(201).json({ success: true, data: item });
}

export async function updateWorkoutCard(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const body = req.body as UpdateWorkoutCardInput;
  const locale = resolveRequestLocale(req);
  const item = await workoutCardService.update(req.user.userId, id, body, locale);
  res.json({ success: true, data: item });
}

export async function patchWorkoutCardStatus(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const body = req.body as PatchWorkoutCardStatusInput;
  const locale = resolveRequestLocale(req);
  const item = await workoutCardService.patchStatus(req.user.userId, id, body, locale);
  res.json({ success: true, data: item });
}

export async function moveWorkoutCardDate(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const body = req.body as MoveWorkoutCardDateInput;
  const locale = resolveRequestLocale(req);
  const item = await workoutCardService.moveDate(req.user.userId, id, body, locale);
  res.json({ success: true, data: item });
}

export async function copyWorkoutCard(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const body = req.body as CopyWorkoutCardInput;
  const locale = resolveRequestLocale(req);
  const item = await workoutCardService.copy(req.user.userId, id, body, locale);
  res.status(201).json({ success: true, data: item });
}

export async function deleteWorkoutCard(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  await workoutCardService.remove(req.user.userId, id);
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function listMissedWorkoutCards(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = getValidatedQuery<Parameters<typeof workoutCardService.listMissed>[1]>(res);
  const locale = resolveRequestLocale(req);
  const items = await workoutCardService.listMissed(req.user.userId, query, locale);
  res.json({ success: true, data: items });
}

export async function resolveMissedWorkoutCard(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  const body = req.body as ResolveMissedWorkoutCardInput;
  const locale = resolveRequestLocale(req);
  const item = await workoutCardService.resolveMissed(req.user.userId, id, body, locale);
  res.json({ success: true, data: item });
}

export async function getWorkoutPlanStats(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = getValidatedQuery<Parameters<typeof workoutCardService.getStats>[1]>(res);
  const data = await workoutCardService.getStats(req.user.userId, query);
  res.json({ success: true, data });
}

export async function getWorkoutCardCalendarSummary(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = getValidatedQuery<
    Parameters<typeof workoutCardService.calendarSummary>[1]
  >(res);
  const data = await workoutCardService.calendarSummary(req.user.userId, query);
  res.json({ success: true, data });
}

export async function createWorkoutCardTemplate(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = req.body as CreateWorkoutCardTemplateInput;
  const item = await workoutCardService.createTemplate(req.user.userId, body);
  res.status(201).json({ success: true, data: item });
}

export async function listWorkoutCardTemplates(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = getValidatedQuery<Parameters<typeof workoutCardService.listTemplates>[1]>(
    res
  );
  const items = await workoutCardService.listTemplates(req.user.userId, query);
  res.json({ success: true, data: items });
}

export async function applyWorkoutCardTemplate(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = req.body as ApplyWorkoutCardTemplateInput;
  const locale = resolveRequestLocale(req);
  const items = await workoutCardService.applyTemplate(req.user.userId, body, locale);
  res.status(201).json({ success: true, data: items });
}

export async function deleteWorkoutCardTemplate(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const id = getParam(req.params.id);
  await workoutCardService.deleteTemplate(req.user.userId, id);
  res.json({ success: true, data: { message: 'Deleted' } });
}
