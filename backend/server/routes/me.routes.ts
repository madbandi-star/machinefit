import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { oauthCredentialSchema } from '@machinefit/shared';
import { authMiddleware } from '../middlewares/auth.middleware.js';

/**
 * Spec paths: GET/POST/DELETE /me/providers...
 * Mounted at /api/v1/me (aliases of /auth/me/providers).
 */
export const meRouter = Router();

meRouter.get('/providers', authMiddleware, authController.listProviders);
meRouter.post(
  '/providers/:provider/connect',
  authMiddleware,
  validateBody(oauthCredentialSchema),
  authController.connectProvider
);
meRouter.delete('/providers/:provider', authMiddleware, authController.disconnectProvider);
