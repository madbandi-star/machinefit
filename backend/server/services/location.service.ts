import type {
  LocationCity,
  LocationCountry,
  LocationDistrict,
  LocationState,
  UserLocation,
  UserLocationUpsertInput,
} from '@machinefit/shared';
import { profileFeatureConsentVersion } from '@machinefit/shared';
import { locationRepository } from '../repositories/location.repository.js';
import { userRepository } from '../repositories/user.repository.js';
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
    const { locationGymConsent, ...fields } = input;
    // Never persist member GPS. Region hierarchy only.
    const locationInput = { ...fields, latitude: null, longitude: null };

    // Clearing via upsert (no country) does not require consent.
    if (locationInput.countryCode) {
      const version = profileFeatureConsentVersion('location_gym');
      const already = await userRepository.hasAgreedConsent(
        userId,
        'location_gym',
        version
      );
      if (!already && locationGymConsent !== true) {
        throw new AppError(
          400,
          'CONSENT_REQUIRED',
          'Location and home gym processing consent is required'
        );
      }
      if (locationGymConsent === true) {
        await userRepository.recordConsents(userId, [
          { type: 'location_gym', version, agreed: true },
        ]);
      }

      const states = await locationRepository.listStates(locationInput.countryCode);
      if (locationInput.stateId && !states.some((s) => s.id === locationInput.stateId)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid state for country');
      }
      if (locationInput.cityId && locationInput.stateId) {
        const cities = await locationRepository.listCities(locationInput.stateId);
        if (!cities.some((c) => c.id === locationInput.cityId)) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Invalid city for state');
        }
      }
    }

    return locationRepository.upsertUserLocation(userId, locationInput, locale);
  },

  clearUserLocation(userId: string): Promise<UserLocation> {
    return locationRepository.deleteUserLocation(userId);
  },

  adminUpsertCountry: locationRepository.adminUpsertCountry.bind(locationRepository),
  adminUpsertState: locationRepository.adminUpsertState.bind(locationRepository),
  adminUpsertCity: locationRepository.adminUpsertCity.bind(locationRepository),
  adminUpsertDistrict: locationRepository.adminUpsertDistrict.bind(locationRepository),
};
