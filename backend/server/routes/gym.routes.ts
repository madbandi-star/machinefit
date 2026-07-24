import { Router } from 'express';
import * as gymController from '../controllers/gym.controller.js';
import * as gymInventoryController from '../controllers/gym-inventory.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware.js';

export const gymRouter = Router();

gymRouter.get('/', gymController.listGyms);
gymRouter.get('/directory', gymController.searchGymDirectory);
gymRouter.get('/nearby', gymController.nearbyGyms);
gymRouter.get('/:gymId', gymController.getGym);
gymRouter.get('/:gymId/machines', gymController.getGymMachines);

/** Community + owner inventory management on gym detail */
gymRouter.get(
  '/:gymId/inventory',
  optionalAuthMiddleware,
  gymInventoryController.listInventory
);
gymRouter.post(
  '/:gymId/inventory',
  authMiddleware,
  gymInventoryController.addInventory
);
gymRouter.delete(
  '/:gymId/inventory/:itemId',
  authMiddleware,
  gymInventoryController.removeInventory
);
