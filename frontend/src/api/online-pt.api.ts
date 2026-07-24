import type {
  ApiResponse,
  CreateOnlinePtAnswerInput,
  CreateOnlinePtFollowupInput,
  CreateOnlinePtQuestionInput,
  CreateOnlinePtReviewInput,
  ListOnlinePtQuestionsInput,
  ListOnlinePtTrainersInput,
  OnlinePtAdminStats,
  OnlinePtAnswer,
  OnlinePtFollowup,
  OnlinePtOrder,
  OnlinePtPayoutRequest,
  OnlinePtPolicy,
  OnlinePtQuestion,
  OnlinePtReview,
  OnlinePtTicketBalance,
  OnlinePtTrainerProfile,
  OnlinePtWalletSummary,
  PurchaseOnlinePtTicketsInput,
  UpdateOnlinePtPolicyInput,
  UpsertOnlinePtTrainerProfileInput,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export type OnlinePtTrainerListResult = {
  items: OnlinePtTrainerProfile[];
  total: number;
};

export type OnlinePtQuestionListResult = {
  items: OnlinePtQuestion[];
  total: number;
};

export const onlinePtApi = {
  getPolicy: () => apiClient.get<ApiResponse<OnlinePtPolicy>>('/online-pt/policy'),

  listTrainers: (params?: Partial<ListOnlinePtTrainersInput>) =>
    apiClient.get<ApiResponse<OnlinePtTrainerListResult>>('/online-pt/trainers', { params }),

  getTrainer: (trainerId: string) =>
    apiClient.get<ApiResponse<OnlinePtTrainerProfile>>(`/online-pt/trainers/${trainerId}`),

  getMyTrainerProfile: () =>
    apiClient.get<ApiResponse<OnlinePtTrainerProfile | null>>('/online-pt/me/trainer-profile'),

  upsertMyTrainerProfile: (input: UpsertOnlinePtTrainerProfileInput) =>
    apiClient.put<ApiResponse<OnlinePtTrainerProfile>>('/online-pt/me/trainer-profile', input),

  getWallet: () =>
    apiClient.get<ApiResponse<OnlinePtWalletSummary>>('/online-pt/me/wallet'),

  listMyPayouts: () =>
    apiClient.get<ApiResponse<OnlinePtPayoutRequest[]>>('/online-pt/me/payouts'),

  requestPayout: (amount: number) =>
    apiClient.post<ApiResponse<OnlinePtPayoutRequest>>('/online-pt/me/payouts', { amount }),

  listMyTickets: () =>
    apiClient.get<ApiResponse<OnlinePtTicketBalance[]>>('/online-pt/me/tickets'),

  purchase: (input: PurchaseOnlinePtTicketsInput) =>
    apiClient.post<ApiResponse<OnlinePtOrder>>('/online-pt/orders', input),

  createQuestion: (input: CreateOnlinePtQuestionInput) =>
    apiClient.post<ApiResponse<OnlinePtQuestion>>('/online-pt/questions', input),

  listQuestions: (params?: Partial<ListOnlinePtQuestionsInput>) =>
    apiClient.get<ApiResponse<OnlinePtQuestionListResult>>('/online-pt/questions', { params }),

  getQuestion: (questionId: string) =>
    apiClient.get<ApiResponse<OnlinePtQuestion>>(`/online-pt/questions/${questionId}`),

  answer: (questionId: string, input: CreateOnlinePtAnswerInput) =>
    apiClient.post<ApiResponse<OnlinePtAnswer>>(
      `/online-pt/questions/${questionId}/answers`,
      input
    ),

  followup: (questionId: string, input: CreateOnlinePtFollowupInput) =>
    apiClient.post<ApiResponse<OnlinePtFollowup>>(
      `/online-pt/questions/${questionId}/followups`,
      input
    ),

  review: (questionId: string, input: CreateOnlinePtReviewInput) =>
    apiClient.post<ApiResponse<OnlinePtReview>>(
      `/online-pt/questions/${questionId}/reviews`,
      input
    ),

  adminStats: () =>
    apiClient.get<ApiResponse<OnlinePtAdminStats>>('/online-pt/admin/stats'),

  adminPolicyUpdate: (input: UpdateOnlinePtPolicyInput) =>
    apiClient.patch<ApiResponse<OnlinePtPolicy>>('/online-pt/admin/policy', input),

  adminTrainers: (params?: Partial<ListOnlinePtTrainersInput>) =>
    apiClient.get<ApiResponse<OnlinePtTrainerListResult>>('/online-pt/admin/trainers', {
      params,
    }),

  adminReviewTrainer: (
    trainerId: string,
    approvalStatus: 'approved' | 'rejected' | 'suspended' | 'pending'
  ) =>
    apiClient.patch<ApiResponse<OnlinePtTrainerProfile>>(
      `/online-pt/admin/trainers/${trainerId}`,
      { approvalStatus }
    ),

  adminPayouts: () =>
    apiClient.get<ApiResponse<OnlinePtPayoutRequest[]>>('/online-pt/admin/payouts'),

  adminReviewPayout: (
    payoutId: string,
    status: 'approved' | 'rejected' | 'paid',
    adminNote?: string
  ) =>
    apiClient.patch<ApiResponse<OnlinePtPayoutRequest>>(
      `/online-pt/admin/payouts/${payoutId}`,
      { status, adminNote }
    ),

  adminReviews: () =>
    apiClient.get<ApiResponse<OnlinePtReview[]>>('/online-pt/admin/reviews'),

  adminReports: () =>
    apiClient.get<ApiResponse<unknown[]>>('/online-pt/admin/reports'),

  adminQuestions: (params?: Partial<ListOnlinePtQuestionsInput>) =>
    apiClient.get<ApiResponse<OnlinePtQuestionListResult>>('/online-pt/questions', {
      params: { ...params, role: 'admin' },
    }),
};
