import { qrRepository } from '../repositories/qr.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const qrService = {
  async resolve(qrCode: string) {
    const result = await qrRepository.resolveByCode(qrCode);
    if (!result) {
      throw new AppError(404, 'NOT_FOUND', `QR code not found: ${qrCode}`);
    }
    return result;
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
