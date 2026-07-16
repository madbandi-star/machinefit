import { Router } from 'express';
import * as historyController from '../controllers/history.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const historyRouter = Router();

historyRouter.use(authMiddleware);
historyRouter.get('/', historyController.listHistory);
historyRouter.post('/', historyController.recordHistory);
historyRouter.delete('/', historyController.clearHistory);
historyRouter.delete('/:id', historyController.removeHistoryItem);
