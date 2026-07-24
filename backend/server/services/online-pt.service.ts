import {
  Role,
  hasMinRole,
  type CreateOnlinePtAnswerInput,
  type CreateOnlinePtFollowupInput,
  type CreateOnlinePtQuestionInput,
  type CreateOnlinePtReviewInput,
  type ListOnlinePtQuestionsInput,
  type ListOnlinePtTrainersInput,
  type PurchaseOnlinePtTicketsInput,
  type RoleCode,
  type UpdateOnlinePtPolicyInput,
  type UpsertOnlinePtTrainerProfileInput,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { getPool } from '../config/database.js';
import { userRepository } from '../repositories/user.repository.js';
import { findDevUserById } from '../data/dev-users.js';
import { onlinePtRepository } from '../repositories/online-pt.repository.js';
import { notificationService } from './notification.service.js';

async function loadUser(userId: string): Promise<{ id: string; roleCode: RoleCode; displayName: string }> {
  const pool = getPool();
  if (pool) {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return {
      id: user.id,
      roleCode: user.roleCode as RoleCode,
      displayName: user.displayName,
    };
  }
  const dev = findDevUserById(userId);
  if (!dev || !dev.isActive) throw new AppError(404, 'NOT_FOUND', 'User not found');
  return { id: dev.id, roleCode: dev.roleCode, displayName: dev.displayName };
}

function assertTrainerRole(role: RoleCode) {
  if (!hasMinRole(role, Role.TRAINER)) {
    throw new AppError(403, 'FORBIDDEN', 'Trainer role required');
  }
}

function calcEarning(unitPrice: number, feePercent: number): number {
  const fee = Math.round((unitPrice * feePercent) / 100);
  return Math.max(0, unitPrice - fee);
}

let overdueTimer: ReturnType<typeof setInterval> | null = null;

export const onlinePtService = {
  startOverdueJob() {
    if (overdueTimer) return;
    overdueTimer = setInterval(() => {
      void this.processOverdueQuestions().catch(() => undefined);
    }, 60_000);
    void this.processOverdueQuestions().catch(() => undefined);
  },

  getPolicy() {
    return onlinePtRepository.getPolicy();
  },

  async updatePolicy(adminId: string, input: UpdateOnlinePtPolicyInput) {
    const cur = await onlinePtRepository.getPolicy();
    const nextMin = input.minTicketPrice ?? cur.minTicketPrice;
    const nextMax = input.maxTicketPrice ?? cur.maxTicketPrice;
    if (nextMin > nextMax) {
      throw new AppError(400, 'VALIDATION_ERROR', 'minTicketPrice must be <= maxTicketPrice');
    }
    return onlinePtRepository.updatePolicy(input, adminId);
  },

  async getMyTrainerProfile(userId: string) {
    const user = await loadUser(userId);
    assertTrainerRole(user.roleCode);
    return onlinePtRepository.getTrainerByUserId(userId);
  },

  async upsertTrainerProfile(userId: string, input: UpsertOnlinePtTrainerProfileInput) {
    const user = await loadUser(userId);
    assertTrainerRole(user.roleCode);
    const policy = await onlinePtRepository.getPolicy();
    if (input.ticketPrice < policy.minTicketPrice || input.ticketPrice > policy.maxTicketPrice) {
      throw new AppError(
        400,
        'PRICE_OUT_OF_RANGE',
        `Ticket price must be between ${policy.minTicketPrice} and ${policy.maxTicketPrice}`
      );
    }
    const existing = await onlinePtRepository.getTrainerByUserId(userId);
    let approvalStatus = existing?.approvalStatus;
    if (!existing) {
      approvalStatus = policy.trainerApprovalRequired ? 'pending' : 'approved';
    }
    // Admin/owners auto-approved when creating
    if (hasMinRole(user.roleCode, Role.ADMIN)) {
      approvalStatus = 'approved';
    }
    return onlinePtRepository.upsertTrainerProfile(userId, {
      ...input,
      career: input.career ?? '',
      certifications: input.certifications ?? [],
      regionLabel: input.regionLabel ?? '',
      gymName: input.gymName ?? '',
      approvalStatus,
    });
  },

  listTrainers(query: ListOnlinePtTrainersInput, viewerId?: string) {
    return onlinePtRepository.listTrainers({
      sort: query.sort ?? 'popular',
      q: query.q,
      specialty: query.specialty,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      acceptingOnly: query.acceptingOnly ?? true,
      viewerId,
    });
  },

  async getTrainer(trainerId: string, viewerId?: string) {
    const profile = await onlinePtRepository.getTrainerByUserId(trainerId, viewerId);
    if (!profile) throw new AppError(404, 'NOT_FOUND', 'Trainer profile not found');
    if (profile.approvalStatus !== 'approved' && viewerId !== trainerId) {
      const viewer = viewerId ? await loadUser(viewerId) : null;
      if (!viewer || !hasMinRole(viewer.roleCode, Role.ADMIN)) {
        throw new AppError(404, 'NOT_FOUND', 'Trainer profile not found');
      }
    }
    return profile;
  },

  async purchaseTickets(buyerId: string, input: PurchaseOnlinePtTicketsInput) {
    const buyer = await loadUser(buyerId);
    if (!hasMinRole(buyer.roleCode, Role.MEMBER)) {
      throw new AppError(403, 'FORBIDDEN', 'Members only');
    }
    if (buyerId === input.trainerId) {
      throw new AppError(400, 'INVALID_PURCHASE', 'Cannot buy your own tickets');
    }
    const trainer = await onlinePtRepository.getTrainerByUserId(input.trainerId);
    if (!trainer || trainer.approvalStatus !== 'approved' || !trainer.acceptingQuestions) {
      throw new AppError(400, 'TRAINER_UNAVAILABLE', 'Trainer is not accepting questions');
    }
    const productType = input.productType ?? 'trainer_specific';
    if (productType !== 'trainer_specific') {
      throw new AppError(400, 'NOT_IMPLEMENTED', 'Only trainer-specific tickets are available now');
    }
    const unitPrice = trainer.ticketPrice;
    const totalAmount = unitPrice * input.quantity;
    const order = await onlinePtRepository.createOrder({
      buyerId,
      trainerId: input.trainerId,
      productType,
      quantity: input.quantity,
      unitPrice,
      totalAmount,
      status: 'paid',
      paymentMethod: 'demo',
      paidAt: new Date(),
    });
    await onlinePtRepository.creditTickets({
      userId: buyerId,
      trainerId: input.trainerId,
      productType,
      quantity: input.quantity,
    });
    await onlinePtRepository.addPaymentAudit({
      orderId: order.id,
      userId: buyerId,
      action: 'ticket_purchase_paid',
      amount: totalAmount,
      meta: { quantity: input.quantity, trainerId: input.trainerId, productType },
    });
    void notificationService.notify(
      buyerId,
      'online_pt_question_received',
      { ko: '온라인 PT 질문권 구매 완료', en: 'Online PT tickets purchased' },
      {
        ko: `${trainer.displayName} 질문권 ${input.quantity}회가 지급되었어요.`,
        en: `${input.quantity} ticket(s) for ${trainer.displayName} credited.`,
      },
      { orderId: order.id, trainerId: input.trainerId }
    );
    return order;
  },

  listMyBalances(userId: string) {
    return onlinePtRepository.listBalances(userId);
  },

  async createQuestion(memberId: string, input: CreateOnlinePtQuestionInput) {
    const member = await loadUser(memberId);
    if (!hasMinRole(member.roleCode, Role.MEMBER)) {
      throw new AppError(403, 'FORBIDDEN', 'Members only');
    }
    if (hasMinRole(member.roleCode, Role.TRAINER) && memberId === input.trainerId) {
      throw new AppError(400, 'INVALID_QUESTION', 'Cannot ask yourself');
    }
    const trainer = await onlinePtRepository.getTrainerByUserId(input.trainerId);
    if (!trainer || trainer.approvalStatus !== 'approved' || !trainer.acceptingQuestions) {
      throw new AppError(400, 'TRAINER_UNAVAILABLE', 'Trainer is not accepting questions');
    }
    const todayCount = await onlinePtRepository.countTrainerQuestionsToday(input.trainerId);
    if (todayCount >= trainer.maxQuestionsPerDay) {
      throw new AppError(429, 'DAILY_LIMIT', 'Trainer daily question limit reached');
    }
    const productType = input.productType ?? 'trainer_specific';
    const consumed = await onlinePtRepository.consumeTicket({
      userId: memberId,
      trainerId: input.trainerId,
      productType,
    });
    if (!consumed) {
      throw new AppError(402, 'NO_TICKETS', 'No tickets available for this trainer');
    }
    const policy = await onlinePtRepository.getPolicy();
    const deadlineAt = new Date(Date.now() + policy.answerDeadlineHours * 3600_000);
    const question = await onlinePtRepository.createQuestion({
      memberId,
      trainerId: input.trainerId,
      title: input.title,
      body: input.body,
      workoutGoal: input.workoutGoal,
      machineCode: input.machineCode,
      brandCode: input.brandCode,
      muscleGroup: input.muscleGroup,
      photoUrls: input.photoUrls ?? [],
      videoUrls: input.videoUrls ?? [],
      workoutLogRef: input.workoutLogRef,
      isPublic: input.isPublic ?? false,
      ticketUnitPrice: trainer.ticketPrice,
      platformFeePercent: policy.platformFeePercent,
      deadlineAt,
    });
    await onlinePtRepository.addPaymentAudit({
      questionId: question.id,
      userId: memberId,
      action: 'ticket_consumed',
      amount: trainer.ticketPrice,
      meta: { trainerId: input.trainerId, productType },
    });
    void notificationService.notify(
      memberId,
      'online_pt_question_received',
      { ko: '질문이 접수되었어요', en: 'Question received' },
      { ko: '트레이너 답변을 기다려 주세요.', en: 'Please wait for the trainer reply.' },
      { questionId: question.id }
    );
    void notificationService.notify(
      input.trainerId,
      'online_pt_new_question',
      { ko: '새 온라인 PT 질문', en: 'New Online PT question' },
      { ko: question.title, en: question.title },
      { questionId: question.id }
    );
    return question;
  },

  async getQuestion(questionId: string, viewerId: string) {
    const q = await onlinePtRepository.getQuestion(questionId);
    if (!q) throw new AppError(404, 'NOT_FOUND', 'Question not found');
    const viewer = await loadUser(viewerId);
    const isParty = q.memberId === viewerId || q.trainerId === viewerId;
    if (!isParty && !hasMinRole(viewer.roleCode, Role.ADMIN) && !q.isPublic) {
      throw new AppError(403, 'FORBIDDEN', 'Not allowed to view this question');
    }
    const policy = await onlinePtRepository.getPolicy();
    const now = Date.now();
    q.canFollowup =
      q.memberId === viewerId &&
      (q.status === 'answered' || q.status === 'followup') &&
      q.followupUsed < policy.followupMaxCount &&
      Boolean(q.followupExpiresAt && new Date(q.followupExpiresAt).getTime() > now);
    q.canReview =
      q.memberId === viewerId &&
      !q.review &&
      (q.status === 'answered' || q.status === 'followup' || q.status === 'closed');
    return q;
  },

  async listQuestions(viewerId: string, query: ListOnlinePtQuestionsInput) {
    const viewer = await loadUser(viewerId);
    const role = query.role ?? 'member';
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    if (role === 'admin') {
      if (!hasMinRole(viewer.roleCode, Role.ADMIN)) {
        throw new AppError(403, 'FORBIDDEN', 'Admin only');
      }
      return onlinePtRepository.listQuestions({ status: query.status, page, limit });
    }
    if (role === 'trainer') {
      assertTrainerRole(viewer.roleCode);
      return onlinePtRepository.listQuestions({
        trainerId: viewerId,
        status: query.status,
        page,
        limit,
      });
    }
    return onlinePtRepository.listQuestions({
      memberId: viewerId,
      status: query.status,
      page,
      limit,
    });
  },

  async answerQuestion(
    trainerId: string,
    questionId: string,
    input: CreateOnlinePtAnswerInput
  ) {
    const trainer = await loadUser(trainerId);
    assertTrainerRole(trainer.roleCode);
    const q = await onlinePtRepository.getQuestion(questionId);
    if (!q) throw new AppError(404, 'NOT_FOUND', 'Question not found');
    if (q.trainerId !== trainerId && !hasMinRole(trainer.roleCode, Role.ADMIN)) {
      throw new AppError(403, 'FORBIDDEN', 'Not your question');
    }
    if (!['received', 'answering', 'followup'].includes(q.status)) {
      throw new AppError(400, 'INVALID_STATUS', 'Question cannot be answered');
    }
    const isFollowupReply = q.status === 'followup';
    const answer = await onlinePtRepository.createAnswer({
      questionId,
      trainerId,
      body: input.body,
      photoUrls: input.photoUrls ?? [],
      videoUrls: input.videoUrls ?? [],
      audioUrls: input.audioUrls ?? [],
      isFollowupReply,
    });

    const policy = await onlinePtRepository.getPolicy();
    const onTime = new Date(q.deadlineAt).getTime() >= Date.now();

    if (q.status === 'received' || q.status === 'answering') {
      const earning = calcEarning(q.ticketUnitPrice, Number(q.platformFeePercent));
      await onlinePtRepository.updateQuestionStatus(questionId, {
        status: 'answered',
        answeredAt: new Date(),
        followupExpiresAt: new Date(Date.now() + policy.followupDays * 86400_000),
        trainerEarning: earning,
      });
      await onlinePtRepository.addWalletEntry({
        trainerId: q.trainerId,
        questionId,
        entryType: 'earning',
        amount: earning,
        note: 'Answer completed',
      });
      await onlinePtRepository.bumpTrainerAnswerStats(q.trainerId, onTime);
      await onlinePtRepository.addPaymentAudit({
        questionId,
        userId: q.trainerId,
        action: 'trainer_earning_credited',
        amount: earning,
        meta: { feePercent: q.platformFeePercent, unitPrice: q.ticketUnitPrice },
      });
    } else {
      await onlinePtRepository.updateQuestionStatus(questionId, {
        status: 'answered',
        answeredAt: new Date(),
      });
    }

    void notificationService.notify(
      q.memberId,
      'online_pt_answer_ready',
      { ko: '온라인 PT 답변이 도착했어요', en: 'Your Online PT answer is ready' },
      { ko: q.title, en: q.title },
      { questionId }
    );
    return answer;
  },

  async addFollowup(
    memberId: string,
    questionId: string,
    input: CreateOnlinePtFollowupInput
  ) {
    const q = await this.getQuestion(questionId, memberId);
    if (!q.canFollowup) {
      throw new AppError(400, 'FOLLOWUP_NOT_ALLOWED', 'Follow-up not allowed');
    }
    const policy = await onlinePtRepository.getPolicy();
    const followup = await onlinePtRepository.createFollowup({
      questionId,
      memberId,
      body: input.body,
      photoUrls: input.photoUrls ?? [],
      videoUrls: input.videoUrls ?? [],
    });
    await onlinePtRepository.updateQuestionStatus(questionId, {
      status: 'followup',
      followupUsed: q.followupUsed + 1,
      // keep followup window; extend deadline for reply
      // deadline refreshed for trainer response window
    });
    // extend answer deadline for follow-up reply
    const pool = getPool();
    if (pool) {
      await pool.query(
        `UPDATE online_pt_questions SET deadline_at = NOW() + ($2 || ' hours')::interval
         WHERE id = $1`,
        [questionId, String(policy.answerDeadlineHours)]
      );
    }
    void notificationService.notify(
      q.trainerId,
      'online_pt_followup',
      { ko: '추가 질문이 도착했어요', en: 'Follow-up question received' },
      { ko: q.title, en: q.title },
      { questionId }
    );
    return followup;
  },

  async createReview(
    memberId: string,
    questionId: string,
    input: CreateOnlinePtReviewInput
  ) {
    const q = await this.getQuestion(questionId, memberId);
    if (!q.canReview) {
      throw new AppError(400, 'REVIEW_NOT_ALLOWED', 'Review not allowed');
    }
    const review = await onlinePtRepository.createReview({
      questionId,
      memberId,
      trainerId: q.trainerId,
      rating: input.rating,
      body: input.body ?? '',
    });
    await onlinePtRepository.updateQuestionStatus(questionId, {
      status: 'closed',
      closedAt: new Date(),
    });
    void notificationService.notify(
      q.trainerId,
      'online_pt_review',
      { ko: '새 리뷰가 등록되었어요', en: 'New review received' },
      { ko: `${input.rating}점`, en: `${input.rating} stars` },
      { questionId, reviewId: review.id }
    );
    void notificationService.notify(
      memberId,
      'online_pt_closed',
      { ko: '온라인 PT 질문이 종료되었어요', en: 'Online PT question closed' },
      { ko: q.title, en: q.title },
      { questionId }
    );
    return review;
  },

  async getWallet(trainerId: string) {
    const user = await loadUser(trainerId);
    assertTrainerRole(user.roleCode);
    return onlinePtRepository.getWalletSummary(trainerId);
  },

  async requestPayout(trainerId: string, amount: number) {
    const user = await loadUser(trainerId);
    assertTrainerRole(user.roleCode);
    const wallet = await onlinePtRepository.getWalletSummary(trainerId);
    if (amount < wallet.minPayoutAmount) {
      throw new AppError(
        400,
        'BELOW_MIN_PAYOUT',
        `Minimum payout is ${wallet.minPayoutAmount}`
      );
    }
    if (amount > wallet.availableBalance) {
      throw new AppError(400, 'INSUFFICIENT_BALANCE', 'Insufficient wallet balance');
    }
    const pending = await onlinePtRepository.listPayouts({
      trainerId,
      status: 'pending',
    });
    if (pending.length > 0) {
      throw new AppError(400, 'PAYOUT_PENDING', 'A payout request is already pending');
    }
    return onlinePtRepository.createPayoutRequest(trainerId, amount);
  },

  listMyPayouts(trainerId: string) {
    return onlinePtRepository.listPayouts({ trainerId });
  },

  async reviewPayout(
    adminId: string,
    payoutId: string,
    status: 'approved' | 'rejected' | 'paid',
    adminNote?: string | null
  ) {
    const payouts = await onlinePtRepository.listPayouts({});
    const current = payouts.find((p) => p.id === payoutId);
    if (!current) throw new AppError(404, 'NOT_FOUND', 'Payout not found');
    const updated = await onlinePtRepository.reviewPayout(
      payoutId,
      status,
      adminId,
      adminNote
    );
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Payout not found');
    if (status === 'paid') {
      await onlinePtRepository.addWalletEntry({
        trainerId: current.trainerId,
        payoutRequestId: payoutId,
        entryType: 'payout',
        amount: -current.amount,
        note: 'Payout paid',
      });
      void notificationService.notify(
        current.trainerId,
        'online_pt_payout',
        { ko: '정산이 완료되었어요', en: 'Payout completed' },
        {
          ko: `${current.amount.toLocaleString('ko-KR')}원이 지급 처리되었습니다.`,
          en: `${current.amount} has been paid out.`,
        },
        { payoutId }
      );
    }
    return updated;
  },

  async setTrainerApproval(
    _adminId: string,
    trainerUserId: string,
    approvalStatus: 'approved' | 'rejected' | 'suspended' | 'pending'
  ) {
    const updated = await onlinePtRepository.setTrainerApproval(trainerUserId, approvalStatus);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Trainer not found');
    return updated;
  },

  adminStats() {
    return onlinePtRepository.getAdminStats();
  },

  adminListTrainers(query: ListOnlinePtTrainersInput) {
    return onlinePtRepository.listTrainers({
      sort: query.sort ?? 'newest',
      q: query.q,
      specialty: query.specialty,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      acceptingOnly: false,
      admin: true,
    });
  },

  adminListPayouts() {
    return onlinePtRepository.listPayouts({});
  },

  adminListReviews() {
    return onlinePtRepository.listReviews();
  },

  adminListReports() {
    return onlinePtRepository.listReports();
  },

  resolveReport(adminId: string, reportId: string, status: 'resolved' | 'dismissed') {
    return onlinePtRepository.resolveReport(reportId, status, adminId);
  },

  async processOverdueQuestions() {
    const policy = await onlinePtRepository.getPolicy();
    const overdue = await onlinePtRepository.listOverdueOpenQuestions();
    for (const q of overdue) {
      if (policy.overdueAction === 'refund') {
        await onlinePtRepository.creditTickets({
          userId: q.memberId,
          trainerId: q.trainerId,
          productType: 'trainer_specific',
          quantity: 1,
        });
        await onlinePtRepository.updateQuestionStatus(q.id, {
          status: 'auto_refunded',
          closedAt: new Date(),
        });
        await onlinePtRepository.addPaymentAudit({
          questionId: q.id,
          userId: q.memberId,
          action: 'auto_refund_ticket',
          amount: q.ticketUnitPrice,
          meta: { reason: 'deadline_exceeded' },
        });
        // clawback earning if already credited (answered path shouldn't be overdue open)
        void notificationService.notify(
          q.memberId,
          'online_pt_refund',
          { ko: '질문권이 자동 환불되었어요', en: 'Ticket auto-refunded' },
          {
            ko: '답변 기한이 지나 질문권이 반환되었습니다.',
            en: 'Deadline passed; your ticket was refunded.',
          },
          { questionId: q.id }
        );
      } else {
        await onlinePtRepository.updateQuestionStatus(q.id, {
          status: 'reassigned',
        });
        // Future: pick another accepting trainer. For now mark reassigned + refund ticket.
        await onlinePtRepository.creditTickets({
          userId: q.memberId,
          trainerId: q.trainerId,
          productType: 'trainer_specific',
          quantity: 1,
        });
        await onlinePtRepository.addPaymentAudit({
          questionId: q.id,
          userId: q.memberId,
          action: 'reassign_placeholder_refund',
          amount: q.ticketUnitPrice,
        });
      }
    }
    return { processed: overdue.length };
  },
};
