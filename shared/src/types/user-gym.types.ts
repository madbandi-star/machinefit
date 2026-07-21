import type { LocationRef } from './location.types.js';

export interface UserGym {
  id: string;
  userId: string;
  name: string;
  address?: string;
  brandName?: string;
  isDefault: boolean;
  /** True when country/state/city are set. */
  locationSet?: boolean;
  location?: LocationRef;
  phone?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt?: string;
}
