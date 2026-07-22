import { Router } from 'express';
import * as locationController from '../controllers/location.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js';

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
  requireRole('admin'),
  locationController.adminUpsertCountry
);
locationRouter.post(
  '/admin/states',
  authMiddleware,
  requireRole('admin'),
  locationController.adminUpsertState
);
locationRouter.post(
  '/admin/cities',
  authMiddleware,
  requireRole('admin'),
  locationController.adminUpsertCity
);
locationRouter.post(
  '/admin/districts',
  authMiddleware,
  requireRole('admin'),
  locationController.adminUpsertDistrict
);
