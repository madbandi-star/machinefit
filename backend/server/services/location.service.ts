import type {
  LocationCity,
  LocationCountry,
  LocationDistrict,
  LocationState,
  ReverseGeocodeResult,
  UserLocation,
  UserLocationUpsertInput,
} from '@machinefit/shared';
import { locationRepository } from '../repositories/location.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const locationService = {
  listCountries(): Promise<LocationCountry[]> {
    return locationRepository.listCountries();
  },

  listStates(countryCode: string): Promise<LocationState[]> {
    return locationRepository.listStates(countryCode);
  },

  listCities(stateId: string): Promise<LocationCity[]> {
    return locationRepository.listCities(stateId);
  },

  listDistricts(cityId: string): Promise<LocationDistrict[]> {
    return locationRepository.listDistricts(cityId);
  },

  getUserLocation(userId: string, locale = 'ko'): Promise<UserLocation> {
    return locationRepository.getUserLocation(userId, locale);
  },

  async upsertUserLocation(
    userId: string,
    input: UserLocationUpsertInput,
    locale = 'ko'
  ): Promise<UserLocation> {
    if (input.countryCode) {
      const states = await locationRepository.listStates(input.countryCode);
      if (input.stateId && !states.some((s) => s.id === input.stateId)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid state for country');
      }
      if (input.cityId && input.stateId) {
        const cities = await locationRepository.listCities(input.stateId);
        if (!cities.some((c) => c.id === input.cityId)) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Invalid city for state');
        }
      }
    }
    return locationRepository.upsertUserLocation(userId, input, locale);
  },

  clearUserLocation(userId: string): Promise<UserLocation> {
    return locationRepository.deleteUserLocation(userId);
  },

  reverseGeocode(
    latitude: number,
    longitude: number,
    locale = 'ko'
  ): Promise<ReverseGeocodeResult | null> {
    return locationRepository.reverseGeocode(latitude, longitude, locale);
  },

  adminUpsertCountry: locationRepository.adminUpsertCountry.bind(locationRepository),
  adminUpsertState: locationRepository.adminUpsertState.bind(locationRepository),
  adminUpsertCity: locationRepository.adminUpsertCity.bind(locationRepository),
};
