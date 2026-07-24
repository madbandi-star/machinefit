/** Online PT ticket product kinds — extend without breaking clients. */
export const ONLINE_PT_PRODUCT_TYPES = [
  'trainer_specific',
  'shared',
  'premium',
  'vip',
] as const;
export type OnlinePtProductType = (typeof ONLINE_PT_PRODUCT_TYPES)[number];

export const ONLINE_PT_QUESTION_STATUSES = [
  'received',
  'answering',
  'answered',
  'followup',
  'closed',
  'auto_refunded',
  'reassigned',
] as const;
export type OnlinePtQuestionStatus = (typeof ONLINE_PT_QUESTION_STATUSES)[number];

export const ONLINE_PT_TRAINER_SORTS = [
  'popular',
  'rating',
  'fastest',
  'price_asc',
  'price_desc',
  'newest',
] as const;
export type OnlinePtTrainerSort = (typeof ONLINE_PT_TRAINER_SORTS)[number];

export const ONLINE_PT_OVERDUE_ACTIONS = ['refund', 'reassign'] as const;
export type OnlinePtOverdueAction = (typeof ONLINE_PT_OVERDUE_ACTIONS)[number];

export const ONLINE_PT_DEADLINE_HOURS = [24, 48, 72] as const;
export type OnlinePtDeadlineHours = (typeof ONLINE_PT_DEADLINE_HOURS)[number];

export interface OnlinePtPolicy {
  minTicketPrice: number;
  maxTicketPrice: number;
  platformFeePercent: number;
  answerDeadlineHours: OnlinePtDeadlineHours;
  overdueAction: OnlinePtOverdueAction;
  followupDays: number;
  followupMaxCount: number;
  minPayoutAmount: number;
  trainerApprovalRequired: boolean;
  updatedAt?: string;
}

export interface OnlinePtTrainerProfile {
  id: string;
  userId: string;
  displayName: string;
  ticketPrice: number;
  acceptingQuestions: boolean;
  maxQuestionsPerDay: number;
  avgAnswerTargetHours: number;
  specialties: string[];
  intro: string;
  career: string;
  certifications: string[];
  regionLabel: string;
  gymName: string;
  avatarUrl?: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  isOnline: boolean;
  answerCount: number;
  reviewCount: number;
  ratingAvg: number;
  answerRate?: number;
  avgAnswerHours?: number | null;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Viewer ticket balance for this trainer (when authenticated). */
  myTicketBalance?: number;
}

export interface OnlinePtTicketBalance {
  trainerId: string;
  trainerName: string;
  productType: OnlinePtProductType;
  balance: number;
  ticketPrice: number;
}

export interface OnlinePtOrder {
  id: string;
  buyerId: string;
  trainerId: string;
  trainerName?: string;
  productType: OnlinePtProductType;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface OnlinePtAnswer {
  id: string;
  questionId: string;
  trainerId: string;
  body: string;
  photoUrls: string[];
  videoUrls: string[];
  audioUrls: string[];
  isFollowupReply: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnlinePtFollowup {
  id: string;
  questionId: string;
  memberId: string;
  body: string;
  photoUrls: string[];
  videoUrls: string[];
  createdAt: string;
}

export interface OnlinePtQuestion {
  id: string;
  memberId: string;
  memberName?: string;
  trainerId: string;
  trainerName?: string;
  status: OnlinePtQuestionStatus;
  title: string;
  body: string;
  workoutGoal?: string | null;
  machineCode?: string | null;
  brandCode?: string | null;
  muscleGroup?: string | null;
  photoUrls: string[];
  videoUrls: string[];
  workoutLogRef?: string | null;
  isPublic: boolean;
  ticketUnitPrice: number;
  platformFeePercent: number;
  trainerEarning: number;
  deadlineAt: string;
  answeredAt?: string | null;
  closedAt?: string | null;
  followupUsed: number;
  followupExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  answers?: OnlinePtAnswer[];
  followups?: OnlinePtFollowup[];
  review?: OnlinePtReview | null;
  canFollowup?: boolean;
  canReview?: boolean;
}

export interface OnlinePtReview {
  id: string;
  questionId: string;
  memberId: string;
  memberName?: string;
  trainerId: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface OnlinePtWalletSummary {
  totalEarned: number;
  monthEarned: number;
  pendingPayout: number;
  paidOut: number;
  availableBalance: number;
  answerCount: number;
  ratingAvg: number;
  reviewCount: number;
  minPayoutAmount: number;
}

export interface OnlinePtPayoutRequest {
  id: string;
  trainerId: string;
  trainerName?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  adminNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface OnlinePtAdminStats {
  questionCount: number;
  answeredCount: number;
  openCount: number;
  revenuePaid: number;
  trainerEarnings: number;
  platformFees: number;
  activeTrainers: number;
  pendingApprovals: number;
  pendingPayouts: number;
  topTrainers: Array<{
    trainerId: string;
    displayName: string;
    answerCount: number;
    ratingAvg: number;
    earned: number;
  }>;
  popularSpecialties: Array<{ specialty: string; count: number }>;
}

export interface UpdateOnlinePtPolicyInput {
  minTicketPrice?: number;
  maxTicketPrice?: number;
  platformFeePercent?: number;
  answerDeadlineHours?: OnlinePtDeadlineHours;
  overdueAction?: OnlinePtOverdueAction;
  followupDays?: number;
  followupMaxCount?: number;
  minPayoutAmount?: number;
  trainerApprovalRequired?: boolean;
}

export interface UpsertOnlinePtTrainerProfileInput {
  ticketPrice: number;
  acceptingQuestions: boolean;
  maxQuestionsPerDay: number;
  avgAnswerTargetHours: number;
  specialties: string[];
  intro: string;
  career?: string;
  certifications?: string[];
  regionLabel?: string;
  gymName?: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
}

export interface PurchaseOnlinePtTicketsInput {
  trainerId: string;
  quantity: number;
  productType?: OnlinePtProductType;
}

export interface CreateOnlinePtQuestionInput {
  trainerId: string;
  title: string;
  body: string;
  workoutGoal?: string | null;
  machineCode?: string | null;
  brandCode?: string | null;
  muscleGroup?: string | null;
  photoUrls?: string[];
  videoUrls?: string[];
  workoutLogRef?: string | null;
  isPublic?: boolean;
  productType?: OnlinePtProductType;
}

export interface CreateOnlinePtAnswerInput {
  body: string;
  photoUrls?: string[];
  videoUrls?: string[];
  audioUrls?: string[];
}

export interface CreateOnlinePtFollowupInput {
  body: string;
  photoUrls?: string[];
  videoUrls?: string[];
}

export interface CreateOnlinePtReviewInput {
  rating: number;
  body?: string;
}

export interface ListOnlinePtTrainersInput {
  sort?: OnlinePtTrainerSort;
  q?: string;
  specialty?: string;
  page?: number;
  limit?: number;
  acceptingOnly?: boolean;
}

export interface ListOnlinePtQuestionsInput {
  role?: 'member' | 'trainer' | 'admin';
  status?: OnlinePtQuestionStatus;
  page?: number;
  limit?: number;
}
