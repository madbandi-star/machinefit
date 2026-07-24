import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as locationController from '../controllers/location.controller.js';
import { authMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';

export const locationRouter = Router();

locationRouter.get('/countries', locationController.listCountries);
locationRouter.get('/countries/:countryCode/states', locationController.listStates);
locationRouter.get('/states/:stateId/cities', locationController.listCities);
locationRouter.get('/cities/:cityId/districts', locationController.listDistricts);
locationRouter.post('/reverse-geocode', locationController.reverseGeocode);

locationRouter.get('/me', authMiddleware, locationController.getMyLocation);
locationRouter.put('/me', authMiddleware, locationController.upsertMyLocation);
locationRouter.delete('/me', authMiddleware, locationController.deleteMyLocation);

locationRouter.post(
  '/admin/countries',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  locationController.adminUpsertCountry
);
locationRouter.post(
  '/admin/states',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  locationController.adminUpsertState
);
locationRouter.post(
  '/admin/cities',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  locationController.adminUpsertCity
);
locationRouter.post(
  '/admin/districts',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  locationController.adminUpsertDistrict
);
