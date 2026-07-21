import type { Request, Response } from 'express';
import {
  adminLocationCitySchema,
  adminLocationCountrySchema,
  adminLocationStateSchema,
  reverseGeocodeSchema,
  userLocationUpsertSchema,
} from '@machinefit/shared';
import { locationService } from '../services/location.service.js';
import { AppError } from '../middlewares/error.middleware.js';

function localeOf(req: Request): string {
  return String(req.headers['accept-language'] ?? 'ko').slice(0, 2);
}

export async function listCountries(_req: Request, res: Response): Promise<void> {
  const data = await locationService.listCountries();
  res.json({ success: true, data });
}

export async function listStates(req: Request, res: Response): Promise<void> {
  const countryCode = String(req.params.countryCode || '');
  if (!countryCode) throw new AppError(400, 'VALIDATION_ERROR', 'countryCode required');
  const data = await locationService.listStates(countryCode);
  res.json({ success: true, data });
}

export async function listCities(req: Request, res: Response): Promise<void> {
  const stateId = String(req.params.stateId || '');
  if (!stateId) throw new AppError(400, 'VALIDATION_ERROR', 'stateId required');
  const data = await locationService.listCities(stateId);
  res.json({ success: true, data });
}

export async function listDistricts(req: Request, res: Response): Promise<void> {
  const cityId = String(req.params.cityId || '');
  if (!cityId) throw new AppError(400, 'VALIDATION_ERROR', 'cityId required');
  const data = await locationService.listDistricts(cityId);
  res.json({ success: true, data });
}

export async function reverseGeocode(req: Request, res: Response): Promise<void> {
  const body = reverseGeocodeSchema.parse(req.body);
  const data = await locationService.reverseGeocode(body.latitude, body.longitude, localeOf(req));
  res.json({ success: true, data });
}

export async function getMyLocation(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = await locationService.getUserLocation(req.user.userId, localeOf(req));
  res.json({ success: true, data });
}

export async function upsertMyLocation(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = userLocationUpsertSchema.parse(req.body);
  const data = await locationService.upsertUserLocation(req.user.userId, input, localeOf(req));
  res.json({ success: true, data });
}

export async function deleteMyLocation(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = await locationService.clearUserLocation(req.user.userId);
  res.json({ success: true, data });
}

export async function adminUpsertCountry(req: Request, res: Response): Promise<void> {
  const input = adminLocationCountrySchema.parse(req.body);
  const data = await locationService.adminUpsertCountry(input);
  res.json({ success: true, data });
}

export async function adminUpsertState(req: Request, res: Response): Promise<void> {
  const input = adminLocationStateSchema.parse(req.body);
  const data = await locationService.adminUpsertState(input);
  res.json({ success: true, data });
}

export async function adminUpsertCity(req: Request, res: Response): Promise<void> {
  const input = adminLocationCitySchema.parse(req.body);
  const data = await locationService.adminUpsertCity(input);
  res.json({ success: true, data });
}
