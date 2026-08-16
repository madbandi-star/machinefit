import type { LocalizedString } from './api.types.js';

/** Persisted user ↔ brand favorite relation (brand master unchanged). */
export interface FavoriteBrandItem {
  id: string;
  brandId: string;
  brandCode: string;
  brandName: LocalizedString;
  logoUrl?: string;
  countryCode?: string;
  createdAt: string;
}
