import type { Request, Response } from 'express';
import {
  createInspectionTemplateSchema,
  createMachineFaultSchema,
  createMachineInspectionSchema,
  createMachinePartSchema,
  createMachinePmScheduleSchema,
  createMachineRepairSchema,
  createMemberMachineReportSchema,
  gymMachinePhotoTypeSchema,
  gymMachinesOpsQuerySchema,
  inspectionListQuerySchema,
  patchInspectionTemplateSchema,
  patchMachineFaultSchema,
  patchMachinePartSchema,
  patchMachinePmScheduleSchema,
} from '@machinefit/shared';
import { z } from 'zod';
import { inspectionService } from '../services/inspection.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

const gymIdQuerySchema = z.object({ gymId: z.string().uuid() });
const byCodeQuerySchema = z.object({
  gymId: z.string().uuid(),
  machineCode: z.string().min(1).max(100),
});
const templatesQuerySchema = z.object({
  brandId: z.string().uuid().optional(),
});

function requireUser(req: Request) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return req.user;
}

export async function listTemplates(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const query = templatesQuerySchema.parse(req.query);
  const data = await inspectionService.listTemplates(query.brandId);
  res.json({ success: true, data });
}

export async function listGymMachines(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = gymMachinesOpsQuerySchema.parse(req.query);
  const data = await inspectionService.listGymMachinesOps(
    user.userId,
    query.gymId,
    { opsStatus: query.opsStatus, q: query.q },
    user.roleCode
  );
  res.json({ success: true, data });
}

export async function getGymMachine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await inspectionService.getGymMachineOps(
    user.userId,
    getParam(req.params.id),
    user.roleCode
  );
  res.json({ success: true, data });
}

export async function getGymMachineByCode(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = byCodeQuerySchema.parse(req.query);
  const isOwnerOrAbove =
    user.roleCode === 'owner' || user.roleCode === 'admin' || user.roleCode === 'trainer';
  const data = await inspectionService.getGymMachineOpsByCode(
    user.userId,
    query.gymId,
    query.machineCode,
    user.roleCode,
    !isOwnerOrAbove
  );
  res.json({ success: true, data });
}

export async function createInspection(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createMachineInspectionSchema.parse(req.body);
  const data = await inspectionService.createInspection(user.userId, input, user.roleCode);
  res.status(201).json({ success: true, data });
}

export async function listInspections(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = inspectionListQuerySchema.parse(req.query);
  const data = await inspectionService.listInspections(user.userId, query, user.roleCode);
  res.json({ success: true, data });
}

export async function getInspection(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await inspectionService.getInspection(
    user.userId,
    getParam(req.params.id),
    user.roleCode
  );
  res.json({ success: true, data });
}

export async function listFaults(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = gymIdQuerySchema.parse(req.query);
  const data = await inspectionService.listFaults(user.userId, query.gymId, user.roleCode);
  res.json({ success: true, data });
}

export async function createFault(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createMachineFaultSchema.parse(req.body);
  const data = await inspectionService.createFault(user.userId, input, user.roleCode);
  res.status(201).json({ success: true, data });
}

export async function updateFault(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = patchMachineFaultSchema.parse(req.body);
  const data = await inspectionService.updateFault(
    user.userId,
    getParam(req.params.id),
    input,
    user.roleCode
  );
  res.json({ success: true, data });
}

export async function createMemberReport(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createMemberMachineReportSchema.parse(req.body);
  const data = await inspectionService.createMemberReport(user.userId, input);
  res.status(201).json({ success: true, data });
}

export async function dashboard(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = gymIdQuerySchema.parse(req.query);
  const data = await inspectionService.dashboard(user.userId, query.gymId, user.roleCode);
  res.json({ success: true, data });
}

export async function statistics(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = gymIdQuerySchema.parse(req.query);
  const data = await inspectionService.statistics(user.userId, query.gymId, user.roleCode);
  res.json({ success: true, data });
}

export async function getGymMachinePublic(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await inspectionService.getGymMachineOpsPublic(getParam(req.params.id));
  res.json({ success: true, data });
}

export async function listPm(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = gymIdQuerySchema.parse(req.query);
  const data = await inspectionService.listPm(user.userId, query.gymId, user.roleCode);
  res.json({ success: true, data });
}

export async function createPm(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createMachinePmScheduleSchema.parse(req.body);
  const data = await inspectionService.createPm(user.userId, input, user.roleCode);
  res.status(201).json({ success: true, data });
}

export async function updatePm(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = patchMachinePmScheduleSchema.parse(req.body);
  const data = await inspectionService.updatePm(
    user.userId,
    getParam(req.params.id),
    input,
    user.roleCode
  );
  res.json({ success: true, data });
}

export async function deletePm(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  await inspectionService.deletePm(user.userId, getParam(req.params.id), user.roleCode);
  res.json({ success: true, data: { deleted: true } });
}

export async function refreshPmDue(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = gymIdQuerySchema.parse(req.query);
  const data = await inspectionService.refreshPmDue(user.userId, query.gymId, user.roleCode);
  res.json({ success: true, data });
}

export async function listRepairs(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = gymIdQuerySchema.parse(req.query);
  const data = await inspectionService.listRepairs(user.userId, query.gymId, user.roleCode);
  res.json({ success: true, data });
}

export async function createRepair(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createMachineRepairSchema.parse(req.body);
  const data = await inspectionService.createRepair(user.userId, input, user.roleCode);
  res.status(201).json({ success: true, data });
}

export async function listParts(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = gymIdQuerySchema.parse(req.query);
  const data = await inspectionService.listParts(user.userId, query.gymId, user.roleCode);
  res.json({ success: true, data });
}

export async function createPart(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createMachinePartSchema.parse(req.body);
  const data = await inspectionService.createPart(user.userId, input, user.roleCode);
  res.status(201).json({ success: true, data });
}

export async function updatePart(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = patchMachinePartSchema.parse(req.body);
  const data = await inspectionService.updatePart(
    user.userId,
    getParam(req.params.id),
    input,
    user.roleCode
  );
  res.json({ success: true, data });
}

export async function deletePart(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  await inspectionService.deletePart(user.userId, getParam(req.params.id), user.roleCode);
  res.json({ success: true, data: { deleted: true } });
}

export async function createTemplate(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createInspectionTemplateSchema.parse(req.body);
  const data = await inspectionService.createTemplate(user.userId, input, user.roleCode);
  res.status(201).json({ success: true, data });
}

export async function updateTemplate(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = patchInspectionTemplateSchema.parse(req.body);
  const data = await inspectionService.updateTemplate(
    user.userId,
    getParam(req.params.id),
    input,
    user.roleCode
  );
  res.json({ success: true, data });
}

export async function listPhotos(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await inspectionService.listPhotos(
    user.userId,
    getParam(req.params.id),
    user.roleCode
  );
  res.json({ success: true, data });
}

export async function uploadPhoto(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const file = req.file;
  if (!file) throw new AppError(400, 'FILE_REQUIRED', 'Image file is required');
  const imageType = gymMachinePhotoTypeSchema.parse(
    typeof req.body?.imageType === 'string' ? req.body.imageType : 'CURRENT'
  );
  const data = await inspectionService.uploadPhoto(
    user.userId,
    getParam(req.params.id),
    imageType,
    file,
    user.roleCode
  );
  res.status(201).json({ success: true, data });
}
