import { Router } from 'express';
import * as motivationMediaController from '../controllers/motivation-media.controller.js';

export const motivationMediaRouter = Router();

/** Public playlist for header play buttons (selected items only). */
motivationMediaRouter.get('/', motivationMediaController.listPlaylist);
