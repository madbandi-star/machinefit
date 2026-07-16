import { Router } from 'express';
import * as brandController from '../controllers/brand.controller.js';

export const brandRouter = Router();

brandRouter.get('/', brandController.listBrands);
brandRouter.get('/:brandCode', brandController.getBrandByCode);
brandRouter.get('/:brandCode/machines', brandController.getBrandMachines);
