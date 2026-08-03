import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  oauthCredentialSchema,
} from '@machinefit/shared';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), authController.register);
authRouter.post('/login', validateBody(loginSchema), authController.login);

/** Social login — provider path: google | kakao | apple */
authRouter.post(
  '/google',
  validateBody(oauthCredentialSchema),
  (req, res, next) => {
    req.params.provider = 'google';
    void authController.oauthLogin(req, res).catch(next);
  }
);
authRouter.post(
  '/kakao',
  validateBody(oauthCredentialSchema),
  (req, res, next) => {
    req.params.provider = 'kakao';
    void authController.oauthLogin(req, res).catch(next);
  }
);
authRouter.post(
  '/apple',
  validateBody(oauthCredentialSchema),
  (req, res, next) => {
    req.params.provider = 'apple';
    void authController.oauthLogin(req, res).catch(next);
  }
);

authRouter.post('/refresh', authController.refresh);
/** Optional auth: clear cookie even when access JWT already expired. */
authRouter.post('/logout', optionalAuthMiddleware, authController.logout);
authRouter.delete('/me', authMiddleware, authController.deactivateAccount);
authRouter.patch('/me/marketing', authMiddleware, authController.updateMarketingPref);

/** Linked login providers for the current user (`/auth/me/providers`). */
authRouter.get('/me/providers', authMiddleware, authController.listProviders);
authRouter.post(
  '/me/providers/:provider/connect',
  authMiddleware,
  validateBody(oauthCredentialSchema),
  authController.connectProvider
);
authRouter.delete('/me/providers/:provider', authMiddleware, authController.disconnectProvider);
