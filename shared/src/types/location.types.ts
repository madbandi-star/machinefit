export type LocalizedName = { ko?: string; en?: string; [key: string]: string | undefined };

export type LocationVisibility = 'hidden' | 'country' | 'city' | 'gym';

export interface LocationCountry {
  code: string;
  name: LocalizedName;
  flagEmoji?: string;
  defaultTimezone?: string;
  sortOrder?: number;
}

export interface LocationState {
  id: string;
  countryCode: string;
  code: string;
  name: LocalizedName;
  latitude?: number | null;
  longitude?: number | null;
  sortOrder?: number;
}

export interface LocationCity {
  id: string;
  stateId: string;
  countryCode?: string;
  code: string;
  name: LocalizedName;
  latitude?: number | null;
  longitude?: number | null;
  sortOrder?: number;
}

export interface LocationDistrict {
  id: string;
  cityId: string;
  code: string;
  name: LocalizedName;
  latitude?: number | null;
  longitude?: number | null;
  sortOrder?: number;
}

/** Normalized location payload shared by users and gyms. */
export interface LocationRef {
  countryCode: string | null;
  stateId: string | null;
  cityId: string | null;
  districtId: string | null;
  /** Free-text dong/neighborhood when not in catalog (or override). */
  districtName?: string | null;
  stateCode?: string | null;
  cityCode?: string | null;
  districtCode?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** Human-readable breadcrumb for UI */
  label?: {
    country?: string;
    state?: string;
    city?: string;
    district?: string;
    flagEmoji?: string;
    path: string;
  };
}

export interface UserLocation extends LocationRef {
  visibility: LocationVisibility;
  isSet: boolean;
  updatedAt?: string;
}

export interface ReverseGeocodeResult extends LocationRef {
  accuracyMeters?: number;
}
