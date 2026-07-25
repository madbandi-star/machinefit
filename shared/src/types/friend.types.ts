export const FRIEND_REQUEST_STATUSES = [
  'REQUESTED',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
] as const;
export type FriendRequestStatus = (typeof FRIEND_REQUEST_STATUSES)[number];

export const FRIENDSHIP_STATUSES = ['ACCEPTED', 'BLOCKED'] as const;
export type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];

export const PRIVACY_LEVELS = ['public', 'friends', 'private'] as const;
export type PrivacyLevel = (typeof PRIVACY_LEVELS)[number];

export const FRIEND_SORTS = ['name', 'recent_activity', 'friended_at'] as const;
export type FriendSort = (typeof FRIEND_SORTS)[number];

export const FRIEND_RANKING_METRICS = [
  'weekly_workouts',
  'monthly_workouts',
  'total_duration',
  'total_volume',
  'streak_days',
  'machine_variety',
] as const;
export type FriendRankingMetric = (typeof FRIEND_RANKING_METRICS)[number];

export const FRIEND_ACTIVITY_TYPES = [
  'workout_completed',
  'pr_updated',
  'report_created',
  'badge_earned',
  'streak_achieved',
  'new_machine',
] as const;
export type FriendActivityType = (typeof FRIEND_ACTIVITY_TYPES)[number];

export interface FriendPrivacySettings {
  userId: string;
  profileVisibility: PrivacyLevel;
  workoutRecordsVisibility: PrivacyLevel;
  workoutReportVisibility: PrivacyLevel;
  growthVisibility: PrivacyLevel;
  badgesVisibility: PrivacyLevel;
  achievementsVisibility: PrivacyLevel;
  gymVisibility: PrivacyLevel;
  onlineStatusVisibility: PrivacyLevel;
  bio: string;
  careerText: string;
  favoriteMuscleGroup?: string | null;
  favoriteMachineCode?: string | null;
  updatedAt?: string;
}

export type FriendRelationship =
  | 'self'
  | 'friend'
  | 'none'
  | 'blocked'
  | 'incoming'
  | 'outgoing';

export interface FriendUserSummary {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  experienceLevel?: string | null;
  isOnline?: boolean;
  lastActiveAt?: string | null;
  /** Present on search results. */
  relationship?: Exclude<FriendRelationship, 'self'>;
  pendingRequestId?: string | null;
}

export interface FriendListItem extends FriendUserSummary {
  friendshipId: string;
  friendedAt: string;
  pinned: boolean;
}

export interface FriendRequestItem {
  id: string;
  fromUser: FriendUserSummary;
  toUser: FriendUserSummary;
  status: FriendRequestStatus;
  message: string;
  createdAt: string;
  respondedAt?: string | null;
}

export interface BlockedUserItem {
  id: string;
  user: FriendUserSummary;
  reason: string;
  createdAt: string;
}

export interface FriendActivityItem {
  id: string;
  actor: FriendUserSummary;
  activityType: FriendActivityType | string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface FriendProfile {
  user: FriendUserSummary;
  /**
   * True when viewer cannot see identity under profileVisibility
   * (name/avatar redacted — prevents UUID→identity IDOR).
   */
  identityHidden?: boolean;
  bio?: string;
  careerText?: string;
  experienceLevel?: string | null;
  favoriteMuscleGroup?: string | null;
  favoriteMachineCode?: string | null;
  gymName?: string | null;
  badges?: Array<{ code: string; title: string }>;
  achievements?: Array<{ code: string; title: string }>;
  recentWorkouts?: Array<{
    date: string;
    machineCode?: string | null;
    label?: string;
  }>;
  growthStats?: Record<string, number | string | null>;
  relationship: FriendRelationship;
  /** Set when relationship is incoming or outgoing. */
  pendingRequestId?: string | null;
  canMessage?: boolean;
}

export interface FriendRankingRow {
  user: FriendUserSummary;
  value: number;
  rank: number;
}

export interface FriendInviteInfo {
  code: string;
  shareUrl: string;
  inviteCount: number;
}

export interface FriendAdminStats {
  friendshipCount: number;
  pendingRequestCount: number;
  blockCount: number;
  reportCount: number;
  spamRequestSuspects: number;
}

export interface ListFriendsInput {
  q?: string;
  sort?: FriendSort;
  page?: number;
  limit?: number;
}

export interface SearchUsersForFriendInput {
  q: string;
  page?: number;
  limit?: number;
}

export interface CreateFriendRequestInput {
  toUserId: string;
  message?: string;
}

export interface UpdateFriendPrivacyInput {
  profileVisibility?: PrivacyLevel;
  workoutRecordsVisibility?: PrivacyLevel;
  workoutReportVisibility?: PrivacyLevel;
  growthVisibility?: PrivacyLevel;
  badgesVisibility?: PrivacyLevel;
  achievementsVisibility?: PrivacyLevel;
  gymVisibility?: PrivacyLevel;
  onlineStatusVisibility?: PrivacyLevel;
  bio?: string;
  careerText?: string;
  favoriteMuscleGroup?: string | null;
  favoriteMachineCode?: string | null;
}

export interface ListFriendFeedInput {
  page?: number;
  limit?: number;
}

export interface ListFriendRankingsInput {
  metric: FriendRankingMetric;
  page?: number;
  limit?: number;
}
