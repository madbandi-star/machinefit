import type { Request, Response } from 'express';
import {
  updateUserAdminSchema,
  moderatePostSchema,
  verifyGymSchema,
  updateMachineRequestAdminSchema,
  resolveReportSchema,
  toggleActiveSchema,
  reviewOwnerApplicationSchema,
  adminGymMachineActionSchema,
} from '@machinefit/shared';
import { adminService } from '../services/admin.service.js';
import { ownerService } from '../services/owner.service.js';
import { gymInventoryService } from '../services/gym-inventory.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

export async function dashboard(_req: Request, res: Response): Promise<void> {
  const stats = await adminService.dashboard();
  res.json({ success: true, data: stats });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const page = parseInt(String(req.query.page ?? '1'), 10);
  const limit = parseInt(String(req.query.limit ?? '20'), 10);
  const result = await adminService.listUsers(page, limit);
  res.json({ success: true, data: result });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const input = updateUserAdminSchema.parse(req.body);
  const user = await adminService.updateUser(getParam(req.params.id), input);
  res.json({ success: true, data: user });
}

export async function listGyms(_req: Request, res: Response): Promise<void> {
  const gyms = adminService.listGyms();
  res.json({ success: true, data: gyms });
}

export async function verifyGym(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = verifyGymSchema.parse(req.body);
  const gym = await adminService.verifyGym(getParam(req.params.id), input, req.user.userId);
  res.json({ success: true, data: gym });
}

export async function listBrands(_req: Request, res: Response): Promise<void> {
  const brands = adminService.listBrands();
  res.json({ success: true, data: brands });
}

export async function updateBrand(req: Request, res: Response): Promise<void> {
  const input = toggleActiveSchema.parse(req.body);
  const brand = adminService.updateBrand(getParam(req.params.id), input);
  res.json({ success: true, data: brand });
}

export async function listMachines(_req: Request, res: Response): Promise<void> {
  const machines = adminService.listMachines();
  res.json({ success: true, data: machines });
}

export async function updateMachine(req: Request, res: Response): Promise<void> {
  const input = toggleActiveSchema.parse(req.body);
  const machine = adminService.updateMachine(getParam(req.params.id), input);
  res.json({ success: true, data: machine });
}

export async function listPosts(_req: Request, res: Response): Promise<void> {
  const posts = adminService.listPosts();
  res.json({ success: true, data: posts });
}

export async function moderatePost(req: Request, res: Response): Promise<void> {
  const input = moderatePostSchema.parse(req.body);
  const post = adminService.moderatePost(getParam(req.params.id), input);
  res.json({ success: true, data: post });
}

export async function listMachineRequests(_req: Request, res: Response): Promise<void> {
  const items = adminService.listMachineRequests();
  res.json({ success: true, data: items });
}

export async function updateMachineRequest(req: Request, res: Response): Promise<void> {
  const input = updateMachineRequestAdminSchema.parse(req.body);
  const item = await adminService.updateMachineRequest(getParam(req.params.id), input);
  res.json({ success: true, data: item });
}

export async function listReports(_req: Request, res: Response): Promise<void> {
  const reports = adminService.listReports();
  res.json({ success: true, data: reports });
}

export async function resolveReport(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = resolveReportSchema.parse(req.body);
  const report = adminService.resolveReport(getParam(req.params.id), input, req.user.userId);
  res.json({ success: true, data: report });
}

export async function listOwnerApplications(req: Request, res: Response): Promise<void> {
  const status = req.query.status
    ? (String(req.query.status) as 'pending' | 'approved' | 'rejected')
    : undefined;
  const items = await ownerService.listApplications(status);
  res.json({ success: true, data: items });
}

export async function reviewOwnerApplication(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = reviewOwnerApplicationSchema.parse(req.body);
  const item = await ownerService.reviewApplication(
    getParam(req.params.id),
    req.user.userId,
    input
  );
  res.json({ success: true, data: item });
}

export async function listGymInventory(req: Request, res: Response): Promise<void> {
  const includeDeleted = String(req.query.includeDeleted ?? 'true') !== 'false';
  const items = await gymInventoryService.adminList(getParam(req.params.gymId), includeDeleted);
  res.json({ success: true, data: items });
}

export async function gymInventoryAction(req: Request, res: Response): Promise<void> {
  const input = adminGymMachineActionSchema.parse(req.body);
  const itemId = getParam(req.params.itemId);
  if (input.action === 'restore') {
    await gymInventoryService.adminRestore(itemId);
  } else {
    await gymInventoryService.adminForceDelete(itemId);
  }
  res.json({ success: true, data: { message: input.action === 'restore' ? 'Restored' : 'Deleted' } });
}
