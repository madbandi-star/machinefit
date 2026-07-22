import { Router } from 'express';
import * as muscleGroupImageController from '../controllers/muscle-group-image.controller.js';

export const muscleGroupImageRouter = Router();

/** Public read — used by all muscle-group UI surfaces. */
muscleGroupImageRouter.get('/', muscleGroupImageController.listMuscleGroupImages);
