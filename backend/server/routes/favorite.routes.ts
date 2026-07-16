import { Router } from 'express';
import * as favoriteController from '../controllers/favorite.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const favoriteRouter = Router();

favoriteRouter.use(authMiddleware);
favoriteRouter.get('/', favoriteController.listFavorites);
favoriteRouter.post('/', favoriteController.addFavorite);
favoriteRouter.delete('/:id', favoriteController.removeFavorite);
favoriteRouter.get('/check/:machineCode', favoriteController.checkFavorite);
