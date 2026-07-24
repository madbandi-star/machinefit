import type { PaginatedResponse } from './api.types.js';

export interface GymDirectoryEntry {
  id: string;
  name: string;
  address?: string;
  stateId?: string;
  cityId?: string;
  districtId?: string;
  stateName?: string;
  cityName?: string;
  districtName?: string;
  latitude?: number;
  longitude?: number;
  /** Display path e.g. 서울 강남구 역삼동 */
  locationLabel?: string;
}

export type GymDirectoryListResponse = PaginatedResponse<GymDirectoryEntry>;
