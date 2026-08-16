import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  adminBrandListQuerySchema,
  adminBrandSortMoveSchema,
  adminBrandUpsertSchema,
  adminMachineListQuerySchema,
  adminMachineTipsUpdateSchema,
  adminMachineUpsertSchema,
  adminToggleActiveBodySchema,
} from '@machinefit/shared';
import { adminCatalogService } from '../services/admin-catalog.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

function requireFile(req: Request) {
  if (!req.file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Image file is required');
  }
  return req.file;
}

export async function listBrands(req: Request, res: Response, next: NextFunction) {
  try {
    const query = adminBrandListQuerySchema.parse(req.query);
    const data = await adminCatalogService.listBrands(query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminBrandUpsertSchema.parse(req.body);
    const data = await adminCatalogService.createBrand(input);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminBrandUpsertSchema.parse(req.body);
    const data = await adminCatalogService.updateBrand(getParam(req.params.id), input);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function setBrandActive(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminToggleActiveBodySchema.parse(req.body);
    const data = await adminCatalogService.setBrandActive(getParam(req.params.id), input.isActive);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function setBrandDefaultFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const input = z.object({ isDefaultFavorite: z.boolean() }).parse(req.body);
    const data = await adminCatalogService.setBrandDefaultFavorite(
      getParam(req.params.id),
      input.isDefaultFavorite
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function moveBrandSort(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminBrandSortMoveSchema.parse(req.body);
    const data = await adminCatalogService.moveBrandSort(
      getParam(req.params.id),
      input.direction
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminCatalogService.deleteBrand(getParam(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function uploadBrandLogo(req: Request, res: Response, next: NextFunction) {
  try {
    const file = requireFile(req);
    const data = await adminCatalogService.uploadBrandLogo(getParam(req.params.id), file);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function clearBrandLogo(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminCatalogService.clearBrandLogo(getParam(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function uploadBrandImage(req: Request, res: Response, next: NextFunction) {
  try {
    const file = requireFile(req);
    const data = await adminCatalogService.uploadBrandImage(getParam(req.params.id), file);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function clearBrandImage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminCatalogService.clearBrandImage(getParam(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listMachines(req: Request, res: Response, next: NextFunction) {
  try {
    const query = adminMachineListQuerySchema.parse(req.query);
    const data = await adminCatalogService.listMachines(query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createMachine(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminMachineUpsertSchema.parse(req.body);
    const data = await adminCatalogService.createMachine(input);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateMachine(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminMachineUpsertSchema.parse(req.body);
    const data = await adminCatalogService.updateMachine(getParam(req.params.id), input);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function setMachineActive(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminToggleActiveBodySchema.parse(req.body);
    const data = await adminCatalogService.setMachineActive(
      getParam(req.params.id),
      input.isActive
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteMachine(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminCatalogService.deleteMachine(getParam(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getMachineTips(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminCatalogService.getMachine(getParam(req.params.id));
    if (!data) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateMachineTips(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminMachineTipsUpdateSchema.parse(req.body);
    const data = await adminCatalogService.updateMachineTips(getParam(req.params.id), input);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function uploadMachineImage(req: Request, res: Response, next: NextFunction) {
  try {
    const file = requireFile(req);
    const data = await adminCatalogService.uploadMachineImage(getParam(req.params.id), file);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function clearMachineImage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminCatalogService.clearMachineImage(getParam(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
