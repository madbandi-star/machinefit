import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { OpsRange } from '@machinefit/shared';
import { opsService } from '../services/ops.service.js';
import { AppError } from '../middlewares/error.middleware.js';

const ingestSchema = z.object({
  events: z
    .array(
      z.object({
        type: z.enum(['page_view', 'feature', 'error', 'session_ping', 'pwa', 'security']),
        occurredAt: z.string().optional(),
        pathKey: z.string().max(200).optional(),
        featureKey: z.string().max(80).optional(),
        dwellMs: z.number().optional(),
        isEntrance: z.boolean().optional(),
        isExit: z.boolean().optional(),
        isBounce: z.boolean().optional(),
        sessionId: z.string().max(64).optional(),
        error: z
          .object({
            title: z.string().max(400),
            message: z.string().max(2000).optional(),
            stack: z.string().max(8000).optional(),
            severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
            source: z.string().max(40).optional(),
            url: z.string().max(1000).optional(),
            fingerprint: z.string().max(64).optional(),
          })
          .optional(),
        meta: z.record(z.unknown()).optional(),
        browser: z.string().max(120).optional(),
        os: z.string().max(80).optional(),
        device: z.string().max(80).optional(),
        appVersion: z.string().max(40).optional(),
      })
    )
    .max(50),
});

function rangeParam(raw: unknown): OpsRange {
  const v = String(raw ?? '30d');
  if (v === 'today' || v === '7d' || v === '30d' || v === '90d' || v === '1y') return v;
  return '30d';
}

function actorId(req: Request): string | undefined {
  return (req as Request & { user?: { id?: string } }).user?.id;
}

export async function ingest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = ingestSchema.parse(req.body ?? {});
    const result = await opsService.ingest(body.events, {
      userId: actorId(req) ?? null,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? null,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function healthDetailed(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Always 200 — severity lives in statusColor for the ops UI.
    // Do not 503 here; this path must never take the API out of rotation.
    const data = await opsService.getHealth();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await opsService.getDashboard(rangeParam(req.query.range));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function errors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const unresolvedOnly = String(req.query.unresolvedOnly ?? 'true') !== 'false';
    const data = await opsService.listErrors(unresolvedOnly);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

function paramId(req: Request): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? String(raw[0] ?? '') : String(raw ?? '');
}

export async function resolveError(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = actorId(req);
    if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Login required');
    const ok = await opsService.resolveErrorGroup(paramId(req), adminId);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Error group not found');
    res.json({ success: true, data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

export async function apiStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await opsService.apiStats(rangeParam(req.query.range));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function pageStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await opsService.pageStats(rangeParam(req.query.range));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function featureStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await opsService.featureStats(rangeParam(req.query.range));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function logs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await opsService.searchLogs({
      kind: req.query.kind ? String(req.query.kind) : undefined,
      q: req.query.q ? String(req.query.q) : undefined,
      from: req.query.from ? String(req.query.from) : undefined,
      to: req.query.to ? String(req.query.to) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 100,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function exportLogsCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rows = await opsService.searchLogs({
      kind: req.query.kind ? String(req.query.kind) : undefined,
      q: req.query.q ? String(req.query.q) : undefined,
      from: req.query.from ? String(req.query.from) : undefined,
      to: req.query.to ? String(req.query.to) : undefined,
      limit: 5000,
    });
    const header = ['id', 'loggedAt', 'level', 'kind', 'message', 'userId', 'ipAddress', 'apiRoute'];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [
          r.id,
          r.loggedAt,
          r.level,
          r.kind,
          JSON.stringify(r.message ?? ''),
          r.userId ?? '',
          r.ipAddress ?? '',
          r.apiRoute ?? '',
        ].join(',')
      ),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ops-logs.csv"');
    res.send(lines.join('\n'));
  } catch (err) {
    next(err);
  }
}

export async function security(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await opsService.securityEvents(Number(req.query.limit ?? 50));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function audits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await opsService.recentAudits(Number(req.query.limit ?? 50));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function alerts(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await opsService.openAlerts(50);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function ackAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = actorId(req);
    if (!adminId) throw new AppError(401, 'UNAUTHORIZED', 'Login required');
    const ok = await opsService.acknowledgeAlert(paramId(req), adminId);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'Alert not found');
    res.json({ success: true, data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

export async function slowQueries(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await opsService.slowQueries(50);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function report(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const period = String(req.query.period ?? 'daily');
    const normalized =
      period === 'weekly' || period === 'monthly' ? period : ('daily' as const);
    const data = await opsService.buildReport(normalized);
    if (String(req.query.format ?? '') === 'csv') {
      const lines = [
        'period,generatedAt,newMembers,activeMembers,apiAvgMs,errorCount,uptimeSec,premiumConversionRate',
        [
          data.period,
          data.generatedAt,
          data.newMembers,
          data.activeMembers,
          data.apiAvgMs ?? '',
          data.errorCount,
          data.uptimeSec,
          data.premiumConversionRate ?? '',
        ].join(','),
      ];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="ops-report-${data.period}.csv"`);
      res.send(lines.join('\n'));
      return;
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
