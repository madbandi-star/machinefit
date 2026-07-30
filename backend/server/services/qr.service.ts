import { qrRepository, type QrResolveResult } from '../repositories/qr.repository.js';
import { inspectionOpsRepository } from '../repositories/inspection-ops.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const qrService = {
  async resolve(qrCode: string): Promise<QrResolveResult> {
    // Prefer gym asset QR (inspection / report flow)
    const gymMachine = await inspectionOpsRepository.findGymMachineByQr(qrCode);
    if (gymMachine) {
      return {
        machineId: gymMachine.machineId,
        machineCode: gymMachine.machineCode,
        deepLinkPath: `/equipment/qr/${gymMachine.gymMachineId}`,
        gymMachineId: gymMachine.gymMachineId,
        gymId: gymMachine.gymId,
        kind: 'gym_machine',
      };
    }

    const result = await qrRepository.resolveByCode(qrCode);
    if (!result) {
      throw new AppError(404, 'NOT_FOUND', `QR code not found: ${qrCode}`);
    }
    return { ...result, kind: 'catalog' };
  },

  async scan(qrCode: string, options: { userId?: string; sessionId?: string } = {}) {
    const result = await this.resolve(qrCode);
    await qrRepository.recordScan({
      qrCode,
      userId: options.userId,
      machineId: result.machineId,
      deepLinkPath: result.deepLinkPath,
      sessionId: options.sessionId,
    });
    return result;
  },
};
