import { Router } from 'express';
import * as machineController from '../controllers/machine.controller.js';

export const machineRouter = Router();

machineRouter.get('/', machineController.listMachines);
machineRouter.get('/search', machineController.searchMachines);
machineRouter.get('/:machineCode', machineController.getMachineByCode);
