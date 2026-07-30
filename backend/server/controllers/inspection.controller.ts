import type { Request, Response } from 'express';
import {
  createMachineFaultSchema,
  createMachineInspectionSchema,
  createMemberMachineReportSchema,
  gymMachinesOpsQuerySchema,
  inspectionListQuerySchema,
  patchMachineFaultSchema,
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
