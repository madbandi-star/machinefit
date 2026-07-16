export type RoleCode = 'guest' | 'member' | 'owner' | 'admin';

export type Gender = 'male' | 'female';

export type ExperienceLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'professional';

export type UnitHeight = 'cm' | 'ft_in';
export type UnitWeight = 'kg' | 'lb';

export type BoardType = 'free' | 'announcement' | 'request';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'added';

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface LocalizedString {
  ko?: string;
  en?: string;
  ja?: string;
  zh?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
