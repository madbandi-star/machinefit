import type { PaginatedResponse } from './api.types.js';

export interface GymDirectoryEntry {
  id: string;
  name: string;
  /** Chain brand when known (e.g. 짐박스, 스포애니). */
  brand?: string;
  address?: string;
  stateId?: string;
  cityId?: string;
  districtId?: string;
  stateName?: string;
  cityName?: string;
  districtName?: string;
  latitude?: number;
  longitude?: number;
  /** Distance in meters from query lat/lng when provided. */
  distanceMeters?: number;
  /** Display path e.g. 서울 강남구 역삼동 */
  locationLabel?: string;
}

export type GymDirectoryListResponse = PaginatedResponse<GymDirectoryEntry>;
