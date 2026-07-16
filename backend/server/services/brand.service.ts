import { brandRepository, machineRepository } from '../repositories/machine.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const brandService = {
  async list() {
    return brandRepository.findAll();
  },

  async getByCode(code: string) {
    const brand = await brandRepository.findByCode(code);
    if (!brand) {
      throw new AppError(404, 'NOT_FOUND', `Brand not found: ${code}`);
    }
    return brand;
  },

  async getMachines(brandCode: string) {
    return machineRepository.findByBrandCode(brandCode);
  },
};
