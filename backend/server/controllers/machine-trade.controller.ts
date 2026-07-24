import type { Request, Response } from 'express';
import {
  createMachineTradeSchema,
  createTradeReportSchema,
  listMachineTradesSchema,
  resolveTradeReportSchema,
  updateMachineTradeSchema,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { machineTradeService } from '../services/machine-trade.service.js';
import { getParam } from '../utils/params.util.js';

function emptyToNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const str = String(value).trim();
  return str === '' ? null : str;
}

function parseFormNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : Number.NaN;
}

export async function listTrades(req: Request, res: Response): Promise<void> {
  const query = listMachineTradesSchema.parse(req.query);
  if ((query.mineOnly || query.likedOnly) && !req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const result = await machineTradeService.list(query, req.user?.userId);
  res.json({ success: true, data: result });
}

export async function listAdminTrades(req: Request, res: Response): Promise<void> {
  const query = listMachineTradesSchema.parse(req.query);
  const result = await machineTradeService.list(query, req.user?.userId, { admin: true });
  res.json({ success: true, data: result });
}

export async function getTrade(req: Request, res: Response): Promise<void> {
  const result = await machineTradeService.getById(getParam(req.params.tradeId), req.user?.userId);
  res.json({ success: true, data: result });
}

export async function createTrade(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const input = createMachineTradeSchema.parse({
    tradeType: req.body.tradeType,
    machineId: req.body.machineId,
    price: parseFormNumber(req.body.price),
    condition: emptyToNull(req.body.condition),
    quantity: parseFormNumber(req.body.quantity) ?? 1,
    regionLabel: req.body.regionLabel,
    countryCode: emptyToNull(req.body.countryCode),
    stateId: emptyToNull(req.body.stateId),
    cityId: emptyToNull(req.body.cityId),
    districtId: emptyToNull(req.body.districtId),
    description: req.body.description ?? '',
  });

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const trade = await machineTradeService.create(req.user.userId, input, files);
  res.status(201).json({ success: true, data: trade });
}

export async function updateTrade(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = { ...req.body };
  if (body.price !== undefined) body.price = parseFormNumber(body.price);
  if (body.quantity !== undefined) body.quantity = parseFormNumber(body.quantity);
  if (body.condition !== undefined) body.condition = emptyToNull(body.condition);
  if (body.countryCode !== undefined) body.countryCode = emptyToNull(body.countryCode);
  if (body.stateId !== undefined) body.stateId = emptyToNull(body.stateId);
  if (body.cityId !== undefined) body.cityId = emptyToNull(body.cityId);
  if (body.districtId !== undefined) body.districtId = emptyToNull(body.districtId);

  const input = updateMachineTradeSchema.parse(body);
  const trade = await machineTradeService.update(
    getParam(req.params.tradeId),
    req.user.userId,
    req.user.roleCode,
    input
  );
  res.json({ success: true, data: trade });
}

export async function deleteTrade(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await machineTradeService.delete(
    getParam(req.params.tradeId),
    req.user.userId,
    req.user.roleCode
  );
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function republishTrade(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const trade = await machineTradeService.republish(
    getParam(req.params.tradeId),
    req.user.userId,
    req.user.roleCode
  );
  res.status(201).json({ success: true, data: trade });
}

export async function getImage(req: Request, res: Response): Promise<void> {
  const variant = req.query.variant === 'full' ? 'full' : 'thumb';
  const image = await machineTradeService.getImageBinary(getParam(req.params.imageId), variant);
  res.setHeader('Content-Type', image.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  res.send(image.data);
}

export async function toggleLike(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const result = await machineTradeService.toggleLike(getParam(req.params.tradeId), req.user.userId);
  res.json({ success: true, data: result });
}

export async function createReport(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createTradeReportSchema.parse(req.body);
  const report = await machineTradeService.createReport(
    getParam(req.params.tradeId),
    req.user.userId,
    input
  );
  res.status(201).json({ success: true, data: report });
}

export async function listReports(_req: Request, res: Response): Promise<void> {
  const reports = await machineTradeService.listReports();
  res.json({ success: true, data: reports });
}

export async function resolveReport(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = resolveTradeReportSchema.parse(req.body);
  const report = await machineTradeService.resolveReport(
    getParam(req.params.reportId),
    req.user.userId,
    input
  );
  res.json({ success: true, data: report });
}

export async function restoreTrade(req: Request, res: Response): Promise<void> {
  const trade = await machineTradeService.restore(getParam(req.params.tradeId));
  res.json({ success: true, data: trade });
}

export async function getStats(_req: Request, res: Response): Promise<void> {
  const stats = await machineTradeService.stats();
  res.json({ success: true, data: stats });
}
