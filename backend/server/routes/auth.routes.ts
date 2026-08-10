import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  oauthCredentialSchema,
  oauthCompleteSchema,
  consentAcceptSchema,
} from '@machinefit/shared';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware.js';
import {
  authSessionRateLimit,
  authStrictRateLimit,
} from '../middlewares/rate-limit.middleware.js';

export const authRouter = Router();

/** Social login — provider path: google | kakao | apple */
authRouter.post(
  '/google',
  authStrictRateLimit,
  validateBody(oauthCredentialSchema),
  (req, res, next) => {
    req.params.provider = 'google';
    void authController.oauthLogin(req, res).catch(next);
  }
);
authRouter.post(
  '/kakao',
  authStrictRateLimit,
  validateBody(oauthCredentialSchema),
  (req, res, next) => {
    req.params.provider = 'kakao';
    void authController.oauthLogin(req, res).catch(next);
  }
);
authRouter.post(
  '/apple',
  authStrictRateLimit,
  validateBody(oauthCredentialSchema),
  (req, res, next) => {
    req.params.provider = 'apple';
    void authController.oauthLogin(req, res).catch(next);
  }
);

/** Finish OAuth signup after terms acceptance (pending token). */
authRouter.post(
  '/oauth/complete',
  authStrictRateLimit,
  validateBody(oauthCompleteSchema),
  authController.completeOAuthSignup
);

/** Accept/update required consents (version bump) while authenticated. */
authRouter.post(
  '/consents',
  authSessionRateLimit,
  authMiddleware,
  validateBody(consentAcceptSchema),
  authController.acceptConsents
);

authRouter.post('/refresh', authSessionRateLimit, authController.refresh);
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
