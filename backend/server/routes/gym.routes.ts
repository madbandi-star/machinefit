import { Router } from 'express';
import * as gymController from '../controllers/gym.controller.js';

export const gymRouter = Router();

gymRouter.get('/', gymController.listGyms);
gymRouter.get('/nearby', gymController.nearbyGyms);
gymRouter.get('/:gymId', gymController.getGym);
gymRouter.get('/:gymId/machines', gymController.getGymMachines);
