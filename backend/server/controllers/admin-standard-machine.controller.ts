import type { Request, Response, NextFunction } from 'express';
import {
  adminBrandMachineImageMetaSchema,
  adminBrandMachineImageReorderSchema,
  adminStandardMachineImageMetaSchema,
  adminStandardMachineImageReorderSchema,
  adminStandardMachineListQuerySchema,
  adminStandardMachineUpsertSchema,
  adminToggleActiveBodySchema,
} from '@machinefit/shared';
import { adminStandardMachineService } from '../services/admin-standard-machine.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

function requireFile(req: Request) {
  if (!req.file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Image file is required');
  }
  return req.file;
}

function parseImageMeta(raw: unknown) {
  if (raw == null || raw === '') return undefined;
  if (typeof raw === 'string') {
    try {
      return adminStandardMachineImageMetaSchema.parse(JSON.parse(raw));
    } catch {
      return adminStandardMachineImageMetaSchema.parse({});
    }
  }
  return adminStandardMachineImageMetaSchema.parse(raw);
}

function parseBrandImageMeta(raw: unknown) {
  if (raw == null || raw === '') return undefined;
  if (typeof raw === 'string') {
    try {
      return adminBrandMachineImageMetaSchema.parse(JSON.parse(raw));
    } catch {
      return adminBrandMachineImageMetaSchema.parse({});
    }
  }
  return adminBrandMachineImageMetaSchema.parse(raw);
}

export async function listStandardMachines(req: Request, res: Response, next: NextFunction) {
  try {
    const query = adminStandardMachineListQuerySchema.parse(req.query);
    const data = await adminStandardMachineService.list(query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listStandardMachineOptions(req: Request, res: Response, next: NextFunction) {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const data = await adminStandardMachineService.listOptions(activeOnly);
    res.json({ success: true, data: { items: data } });
  } catch (error) {
    next(error);
  }
}

export async function getStandardMachine(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminStandardMachineService.get(getParam(req.params.id));
    if (!data) throw new AppError(404, 'NOT_FOUND', 'Standard machine not found');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createStandardMachine(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminStandardMachineUpsertSchema.parse(req.body);
    const data = await adminStandardMachineService.create(input);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateStandardMachine(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminStandardMachineUpsertSchema.parse(req.body);
    const data = await adminStandardMachineService.update(getParam(req.params.id), input);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function setStandardMachineActive(req: Request, res: Response, next: NextFunction) {
  try {
    const input = adminToggleActiveBodySchema.parse(req.body);
    const data = await adminStandardMachineService.setActive(
      getParam(req.params.id),
      input.isActive
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteStandardMachine(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminStandardMachineService.delete(getParam(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listStandardMachineImages(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await adminStandardMachineService.listImages(getParam(req.params.id));
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
}

export async function uploadStandardMachineImage(req: Request, res: Response, next: NextFunction) {
  try {
    const file = requireFile(req);
    const meta = parseImageMeta(req.body?.meta ?? req.body);
    const data = await adminStandardMachineService.uploadImage(
      getParam(req.params.id),
      file,
      meta
    );
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateStandardMachineImage(req: Request, res: Response, next: NextFunction) {
  try {
    const meta = adminStandardMachineImageMetaSchema.parse(req.body);
    const data = await adminStandardMachineService.updateImageMeta(
      getParam(req.params.imageId),
      meta
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function reorderStandardMachineImages(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = adminStandardMachineImageReorderSchema.parse(req.body);
    const items = await adminStandardMachineService.reorderImages(
      getParam(req.params.id),
      body.orderedIds
    );
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
}

export async function deleteStandardMachineImage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminStandardMachineService.deleteImage(getParam(req.params.imageId));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function serveStandardMachineImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const imageId = getParam(req.params.imageId);
    const kind = (req.params.kind === 'thumb' ? 'thumb' : 'main') as 'main' | 'thumb';
    const blob = await adminStandardMachineService.getImageBlob(imageId, kind);
    if (!blob) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Image not found' } });
      return;
    }
    res.setHeader('Content-Type', blob.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('ETag', `W/"std-img-${imageId}-${kind}-v${blob.version}"`);
    res.send(blob.buffer);
  } catch (error) {
    next(error);
  }
}

/* Brand machine gallery */

export async function listBrandMachineImages(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await adminStandardMachineService.listBrandMachineImages(
      getParam(req.params.id)
    );
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
}

export async function uploadBrandMachineImage(req: Request, res: Response, next: NextFunction) {
  try {
    const file = requireFile(req);
    const meta = parseBrandImageMeta(req.body?.meta ?? req.body);
    const data = await adminStandardMachineService.uploadBrandMachineImage(
      getParam(req.params.id),
      file,
      meta
    );
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateBrandMachineImage(req: Request, res: Response, next: NextFunction) {
  try {
    const meta = adminBrandMachineImageMetaSchema.parse(req.body);
    const data = await adminStandardMachineService.updateBrandMachineImageMeta(
      getParam(req.params.imageId),
      meta
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function reorderBrandMachineImages(req: Request, res: Response, next: NextFunction) {
  try {
    const body = adminBrandMachineImageReorderSchema.parse(req.body);
    const items = await adminStandardMachineService.reorderBrandMachineImages(
      getParam(req.params.id),
      body.orderedIds
    );
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
}

export async function deleteBrandMachineImage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminStandardMachineService.deleteBrandMachineImage(
      getParam(req.params.imageId)
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function serveBrandMachineGalleryImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const imageId = getParam(req.params.imageId);
    const kind = (req.params.kind === 'thumb' ? 'thumb' : 'main') as 'main' | 'thumb';
    const blob = await adminStandardMachineService.getBrandMachineImageBlob(imageId, kind);
    if (!blob) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Image not found' } });
      return;
    }
    res.setHeader('Content-Type', blob.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('ETag', `W/"bm-img-${imageId}-${kind}-v${blob.version}"`);
    res.send(blob.buffer);
  } catch (error) {
    next(error);
  }
}
