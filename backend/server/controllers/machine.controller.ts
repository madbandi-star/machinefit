import type { Request, Response } from 'express';
import { machineService } from '../services/machine.service.js';
import { machineCoverTargetMuscleSchema, machineListQuerySchema } from '@machinefit/shared';
import { getParam } from '../utils/params.util.js';
import { awardPointsSafe } from '../services/points.service.js';

export async function listMachines(req: Request, res: Response): Promise<void> {
  const query = machineListQuerySchema.parse(req.query);
  const result = await machineService.list(query);
  res.json({ success: true, data: result });
}

export async function getMachineByCode(req: Request, res: Response): Promise<void> {
  const muscleRaw = typeof req.query.muscle === 'string' ? req.query.muscle : undefined;
  const muscleParsed = muscleRaw ? machineCoverTargetMuscleSchema.safeParse(muscleRaw) : null;
  const code = getParam(req.params.machineCode);
  const machine = await machineService.getByCode(
    code,
    muscleParsed?.success ? muscleParsed.data : null
  );
  if (req.user?.userId) {
    const seoulDay = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
    awardPointsSafe({
      userId: req.user.userId,
      actionCode: 'machine_detail_view',
      referenceType: 'machine',
      referenceId: code,
      idempotencyKey: `machine_detail_view:machine:${code}:${seoulDay}`,
    });
  }
  res.json({ success: true, data: machine });
}

export async function searchMachines(req: Request, res: Response): Promise<void> {
  const q = String(req.query.q ?? '');
  const result = await machineService.search(q);
  if (req.user?.userId && q.trim().length >= 2) {
    awardPointsSafe({
      userId: req.user.userId,
      actionCode: 'machine_search',
      referenceType: 'search',
      referenceId: q.trim().slice(0, 40),
      idempotencyKey: `machine_search:${req.user.userId}:slot:${Math.floor(Date.now() / 10_000)}`,
    });
  }
  res.json({ success: true, data: result });
}
