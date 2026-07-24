import type {
  OnlinePtAnswer,
  OnlinePtFollowup,
  OnlinePtOrder,
  OnlinePtPolicy,
  OnlinePtPayoutRequest,
  OnlinePtQuestion,
  OnlinePtQuestionStatus,
  OnlinePtReview,
  OnlinePtTicketBalance,
  OnlinePtTrainerProfile,
  OnlinePtTrainerSort,
  OnlinePtWalletSummary,
  OnlinePtAdminStats,
  OnlinePtProductType,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function mapPolicy(row: Record<string, unknown>): OnlinePtPolicy {
  return {
    minTicketPrice: num(row.min_ticket_price),
    maxTicketPrice: num(row.max_ticket_price),
    platformFeePercent: num(row.platform_fee_percent),
    answerDeadlineHours: num(row.answer_deadline_hours, 48) as 24 | 48 | 72,
    overdueAction: (row.overdue_action as OnlinePtPolicy['overdueAction']) ?? 'refund',
    followupDays: num(row.followup_days, 7),
    followupMaxCount: num(row.followup_max_count, 3),
    minPayoutAmount: num(row.min_payout_amount, 50000),
    trainerApprovalRequired: Boolean(row.trainer_approval_required),
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : undefined,
  };
}

function mapTrainer(row: Record<string, unknown>): OnlinePtTrainerProfile {
  const answerCount = num(row.answer_count);
  const onTime = num(row.answered_on_time_count);
  return {
    id: String(row.id),
    userId: String(row.user_id),
    displayName: String(row.display_name ?? ''),
    ticketPrice: num(row.ticket_price),
    acceptingQuestions: Boolean(row.accepting_questions),
    maxQuestionsPerDay: num(row.max_questions_per_day, 10),
    avgAnswerTargetHours: num(row.avg_answer_target_hours, 24),
    specialties: (row.specialties as string[]) ?? [],
    intro: String(row.intro ?? ''),
    career: String(row.career ?? ''),
    certifications: (row.certifications as string[]) ?? [],
    regionLabel: String(row.region_label ?? ''),
    gymName: String(row.gym_name ?? ''),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    approvalStatus: row.approval_status as OnlinePtTrainerProfile['approvalStatus'],
    isOnline: Boolean(row.is_online),
    answerCount,
    reviewCount: num(row.review_count),
    ratingAvg: num(row.rating_avg),
    answerRate: answerCount > 0 ? Math.round((onTime / answerCount) * 100) : undefined,
    lastActiveAt: row.last_active_at
      ? new Date(String(row.last_active_at)).toISOString()
      : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    myTicketBalance:
      row.my_ticket_balance != null ? num(row.my_ticket_balance) : undefined,
  };
}

function mapQuestion(row: Record<string, unknown>): OnlinePtQuestion {
  return {
    id: String(row.id),
    memberId: String(row.member_id),
    memberName: row.member_name ? String(row.member_name) : undefined,
    trainerId: String(row.trainer_id),
    trainerName: row.trainer_name ? String(row.trainer_name) : undefined,
    status: row.status as OnlinePtQuestionStatus,
    title: String(row.title),
    body: String(row.body),
    workoutGoal: row.workout_goal ? String(row.workout_goal) : null,
    machineCode: row.machine_code ? String(row.machine_code) : null,
    brandCode: row.brand_code ? String(row.brand_code) : null,
    muscleGroup: row.muscle_group ? String(row.muscle_group) : null,
    photoUrls: (row.photo_urls as string[]) ?? [],
    videoUrls: (row.video_urls as string[]) ?? [],
    workoutLogRef: row.workout_log_ref ? String(row.workout_log_ref) : null,
    isPublic: Boolean(row.is_public),
    ticketUnitPrice: num(row.ticket_unit_price),
    platformFeePercent: num(row.platform_fee_percent),
    trainerEarning: num(row.trainer_earning),
    deadlineAt: new Date(String(row.deadline_at)).toISOString(),
    answeredAt: row.answered_at ? new Date(String(row.answered_at)).toISOString() : null,
    closedAt: row.closed_at ? new Date(String(row.closed_at)).toISOString() : null,
    followupUsed: num(row.followup_used),
    followupExpiresAt: row.followup_expires_at
      ? new Date(String(row.followup_expires_at)).toISOString()
      : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapAnswer(row: Record<string, unknown>): OnlinePtAnswer {
  return {
    id: String(row.id),
    questionId: String(row.question_id),
    trainerId: String(row.trainer_id),
    body: String(row.body ?? ''),
    photoUrls: (row.photo_urls as string[]) ?? [],
    videoUrls: (row.video_urls as string[]) ?? [],
    audioUrls: (row.audio_urls as string[]) ?? [],
    isFollowupReply: Boolean(row.is_followup_reply),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapFollowup(row: Record<string, unknown>): OnlinePtFollowup {
  return {
    id: String(row.id),
    questionId: String(row.question_id),
    memberId: String(row.member_id),
    body: String(row.body),
    photoUrls: (row.photo_urls as string[]) ?? [],
    videoUrls: (row.video_urls as string[]) ?? [],
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapReview(row: Record<string, unknown>): OnlinePtReview {
  return {
    id: String(row.id),
    questionId: String(row.question_id),
    memberId: String(row.member_id),
    memberName: row.member_name ? String(row.member_name) : undefined,
    trainerId: String(row.trainer_id),
    rating: num(row.rating),
    body: String(row.body ?? ''),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapOrder(row: Record<string, unknown>): OnlinePtOrder {
  return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    trainerId: String(row.trainer_id),
    trainerName: row.trainer_name ? String(row.trainer_name) : undefined,
    productType: row.product_type as OnlinePtProductType,
    quantity: num(row.quantity),
    unitPrice: num(row.unit_price),
    totalAmount: num(row.total_amount),
    status: row.status as OnlinePtOrder['status'],
    paymentMethod: String(row.payment_method ?? 'demo'),
    paidAt: row.paid_at ? new Date(String(row.paid_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapPayout(row: Record<string, unknown>): OnlinePtPayoutRequest {
  return {
    id: String(row.id),
    trainerId: String(row.trainer_id),
    trainerName: row.trainer_name ? String(row.trainer_name) : undefined,
    amount: num(row.amount),
    status: row.status as OnlinePtPayoutRequest['status'],
    adminNote: row.admin_note ? String(row.admin_note) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    reviewedAt: row.reviewed_at ? new Date(String(row.reviewed_at)).toISOString() : null,
  };
}

export const onlinePtRepository = {
  async getPolicy(): Promise<OnlinePtPolicy> {
    const pool = getPool();
    if (!pool) {
      return {
        minTicketPrice: 3000,
        maxTicketPrice: 50000,
        platformFeePercent: 20,
        answerDeadlineHours: 48,
        overdueAction: 'refund',
        followupDays: 7,
        followupMaxCount: 3,
        minPayoutAmount: 50000,
        trainerApprovalRequired: true,
      };
    }
    const { rows } = await pool.query(`SELECT * FROM online_pt_policies WHERE id = 1`);
    if (!rows[0]) {
      await pool.query(`INSERT INTO online_pt_policies (id) VALUES (1) ON CONFLICT DO NOTHING`);
      const again = await pool.query(`SELECT * FROM online_pt_policies WHERE id = 1`);
      return mapPolicy(again.rows[0]);
    }
    return mapPolicy(rows[0]);
  },

  async updatePolicy(
    patch: Partial<OnlinePtPolicy>,
    adminId: string
  ): Promise<OnlinePtPolicy> {
    const pool = getPool()!;
    const cur = await this.getPolicy();
    const next = { ...cur, ...patch };
    const { rows } = await pool.query(
      `UPDATE online_pt_policies SET
         min_ticket_price = $1,
         max_ticket_price = $2,
         platform_fee_percent = $3,
         answer_deadline_hours = $4,
         overdue_action = $5,
         followup_days = $6,
         followup_max_count = $7,
         min_payout_amount = $8,
         trainer_approval_required = $9,
         updated_by = $10,
         updated_at = NOW()
       WHERE id = 1
       RETURNING *`,
      [
        next.minTicketPrice,
        next.maxTicketPrice,
        next.platformFeePercent,
        next.answerDeadlineHours,
        next.overdueAction,
        next.followupDays,
        next.followupMaxCount,
        next.minPayoutAmount,
        next.trainerApprovalRequired,
        adminId,
      ]
    );
    return mapPolicy(rows[0]);
  },

  async getTrainerByUserId(
    userId: string,
    viewerId?: string
  ): Promise<OnlinePtTrainerProfile | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query(
      `SELECT p.*, u.display_name,
         (SELECT balance FROM online_pt_ticket_balances b
           WHERE b.user_id = $2 AND b.trainer_id = p.user_id
             AND b.product_type = 'trainer_specific') AS my_ticket_balance
       FROM online_pt_trainer_profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [userId, viewerId ?? null]
    );
    return rows[0] ? mapTrainer(rows[0]) : null;
  },

  async upsertTrainerProfile(
    userId: string,
    input: {
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
      isOnline?: boolean;
      approvalStatus?: OnlinePtTrainerProfile['approvalStatus'];
    }
  ): Promise<OnlinePtTrainerProfile> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `INSERT INTO online_pt_trainer_profiles (
         user_id, ticket_price, accepting_questions, max_questions_per_day,
         avg_answer_target_hours, specialties, intro, career, certifications,
         region_label, gym_name, avatar_url, is_online, approval_status, last_active_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,COALESCE($13,FALSE),COALESCE($14,'pending'),NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         ticket_price = EXCLUDED.ticket_price,
         accepting_questions = EXCLUDED.accepting_questions,
         max_questions_per_day = EXCLUDED.max_questions_per_day,
         avg_answer_target_hours = EXCLUDED.avg_answer_target_hours,
         specialties = EXCLUDED.specialties,
         intro = EXCLUDED.intro,
         career = EXCLUDED.career,
         certifications = EXCLUDED.certifications,
         region_label = EXCLUDED.region_label,
         gym_name = EXCLUDED.gym_name,
         avatar_url = EXCLUDED.avatar_url,
         is_online = COALESCE(EXCLUDED.is_online, online_pt_trainer_profiles.is_online),
         approval_status = COALESCE($14, online_pt_trainer_profiles.approval_status),
         last_active_at = NOW(),
         updated_at = NOW()
       RETURNING *`,
      [
        userId,
        input.ticketPrice,
        input.acceptingQuestions,
        input.maxQuestionsPerDay,
        input.avgAnswerTargetHours,
        input.specialties,
        input.intro,
        input.career,
        input.certifications,
        input.regionLabel,
        input.gymName,
        input.avatarUrl ?? null,
        input.isOnline ?? null,
        input.approvalStatus ?? null,
      ]
    );
    const profile = await this.getTrainerByUserId(userId);
    return profile ?? mapTrainer({ ...rows[0], display_name: '' });
  },

  async setTrainerApproval(
    userId: string,
    status: OnlinePtTrainerProfile['approvalStatus']
  ): Promise<OnlinePtTrainerProfile | null> {
    const pool = getPool()!;
    await pool.query(
      `UPDATE online_pt_trainer_profiles SET approval_status = $2, updated_at = NOW()
       WHERE user_id = $1`,
      [userId, status]
    );
    return this.getTrainerByUserId(userId);
  },

  async listTrainers(options: {
    sort: OnlinePtTrainerSort;
    q?: string;
    specialty?: string;
    page: number;
    limit: number;
    acceptingOnly: boolean;
    viewerId?: string;
    admin?: boolean;
  }): Promise<{ items: OnlinePtTrainerProfile[]; total: number }> {
    const pool = getPool();
    if (!pool) return { items: [], total: 0 };

    const where: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (!options.admin) {
      where.push(`p.approval_status = 'approved'`);
      if (options.acceptingOnly) where.push(`p.accepting_questions = TRUE`);
    }
    if (options.q?.trim()) {
      where.push(`(u.display_name ILIKE $${i} OR p.intro ILIKE $${i} OR p.gym_name ILIKE $${i})`);
      params.push(`%${options.q.trim()}%`);
      i += 1;
    }
    if (options.specialty?.trim()) {
      where.push(`$${i} = ANY(p.specialties)`);
      params.push(options.specialty.trim());
      i += 1;
    }

    const orderBy =
      options.sort === 'rating'
        ? 'p.rating_avg DESC NULLS LAST, p.review_count DESC'
        : options.sort === 'fastest'
          ? 'p.avg_answer_target_hours ASC, p.rating_avg DESC'
          : options.sort === 'price_asc'
            ? 'p.ticket_price ASC'
            : options.sort === 'price_desc'
              ? 'p.ticket_price DESC'
              : options.sort === 'newest'
                ? 'p.created_at DESC'
                : 'p.answer_count DESC, p.rating_avg DESC';

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS c
       FROM online_pt_trainer_profiles p
       JOIN users u ON u.id = p.user_id
       ${whereSql}`,
      params
    );
    const total = countRes.rows[0]?.c ?? 0;
    const offset = (options.page - 1) * options.limit;
    params.push(options.viewerId ?? null, options.limit, offset);
    const { rows } = await pool.query(
      `SELECT p.*, u.display_name,
         (SELECT balance FROM online_pt_ticket_balances b
           WHERE b.user_id = $${i} AND b.trainer_id = p.user_id
             AND b.product_type = 'trainer_specific') AS my_ticket_balance
       FROM online_pt_trainer_profiles p
       JOIN users u ON u.id = p.user_id
       ${whereSql}
       ORDER BY ${orderBy}
       LIMIT $${i + 1} OFFSET $${i + 2}`,
      params
    );
    return { items: rows.map(mapTrainer), total };
  },

  async creditTickets(input: {
    userId: string;
    trainerId: string;
    productType: OnlinePtProductType;
    quantity: number;
  }): Promise<number> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `INSERT INTO online_pt_ticket_balances (user_id, trainer_id, product_type, balance)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, trainer_id, product_type) DO UPDATE SET
         balance = online_pt_ticket_balances.balance + EXCLUDED.balance,
         updated_at = NOW()
       RETURNING balance`,
      [input.userId, input.trainerId, input.productType, input.quantity]
    );
    return num(rows[0].balance);
  },

  async consumeTicket(input: {
    userId: string;
    trainerId: string;
    productType: OnlinePtProductType;
  }): Promise<boolean> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `UPDATE online_pt_ticket_balances
       SET balance = balance - 1, updated_at = NOW()
       WHERE user_id = $1 AND trainer_id = $2 AND product_type = $3 AND balance > 0
       RETURNING balance`,
      [input.userId, input.trainerId, input.productType]
    );
    return Boolean(rows[0]);
  },

  async listBalances(userId: string): Promise<OnlinePtTicketBalance[]> {
    const pool = getPool();
    if (!pool) return [];
    const { rows } = await pool.query(
      `SELECT b.trainer_id, b.product_type, b.balance,
              u.display_name AS trainer_name,
              COALESCE(p.ticket_price, 0) AS ticket_price
       FROM online_pt_ticket_balances b
       JOIN users u ON u.id = b.trainer_id
       LEFT JOIN online_pt_trainer_profiles p ON p.user_id = b.trainer_id
       WHERE b.user_id = $1 AND b.balance > 0
       ORDER BY b.updated_at DESC`,
      [userId]
    );
    return rows.map((r) => ({
      trainerId: String(r.trainer_id),
      trainerName: String(r.trainer_name),
      productType: r.product_type as OnlinePtProductType,
      balance: num(r.balance),
      ticketPrice: num(r.ticket_price),
    }));
  },

  async createOrder(input: {
    buyerId: string;
    trainerId: string;
    productType: OnlinePtProductType;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    status: OnlinePtOrder['status'];
    paymentMethod: string;
    paidAt?: Date | null;
  }): Promise<OnlinePtOrder> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `INSERT INTO online_pt_orders (
         buyer_id, trainer_id, product_type, quantity, unit_price, total_amount,
         status, payment_method, paid_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        input.buyerId,
        input.trainerId,
        input.productType,
        input.quantity,
        input.unitPrice,
        input.totalAmount,
        input.status,
        input.paymentMethod,
        input.paidAt ?? null,
      ]
    );
    return mapOrder(rows[0]);
  },

  async addPaymentAudit(input: {
    orderId?: string | null;
    questionId?: string | null;
    userId?: string | null;
    action: string;
    amount: number;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `INSERT INTO online_pt_payment_audits (order_id, question_id, user_id, action, amount, meta)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
      [
        input.orderId ?? null,
        input.questionId ?? null,
        input.userId ?? null,
        input.action,
        input.amount,
        JSON.stringify(input.meta ?? {}),
      ]
    );
  },

  async countTrainerQuestionsToday(trainerId: string): Promise<number> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS c FROM online_pt_questions
       WHERE trainer_id = $1 AND created_at >= date_trunc('day', NOW())`,
      [trainerId]
    );
    return rows[0]?.c ?? 0;
  },

  async createQuestion(input: {
    memberId: string;
    trainerId: string;
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
    deadlineAt: Date;
  }): Promise<OnlinePtQuestion> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `INSERT INTO online_pt_questions (
         member_id, trainer_id, title, body, workout_goal, machine_code, brand_code,
         muscle_group, photo_urls, video_urls, workout_log_ref, is_public,
         ticket_unit_price, platform_fee_percent, deadline_at, status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'received')
       RETURNING *`,
      [
        input.memberId,
        input.trainerId,
        input.title,
        input.body,
        input.workoutGoal ?? null,
        input.machineCode ?? null,
        input.brandCode ?? null,
        input.muscleGroup ?? null,
        input.photoUrls,
        input.videoUrls,
        input.workoutLogRef ?? null,
        input.isPublic,
        input.ticketUnitPrice,
        input.platformFeePercent,
        input.deadlineAt,
      ]
    );
    return mapQuestion(rows[0]);
  },

  async getQuestion(id: string): Promise<OnlinePtQuestion | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query(
      `SELECT q.*,
         m.display_name AS member_name,
         t.display_name AS trainer_name
       FROM online_pt_questions q
       JOIN users m ON m.id = q.member_id
       JOIN users t ON t.id = q.trainer_id
       WHERE q.id = $1`,
      [id]
    );
    if (!rows[0]) return null;
    const question = mapQuestion(rows[0]);
    const answers = await pool.query(
      `SELECT * FROM online_pt_answers WHERE question_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    const followups = await pool.query(
      `SELECT * FROM online_pt_followups WHERE question_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    const review = await pool.query(`SELECT * FROM online_pt_reviews WHERE question_id = $1`, [
      id,
    ]);
    question.answers = answers.rows.map(mapAnswer);
    question.followups = followups.rows.map(mapFollowup);
    question.review = review.rows[0] ? mapReview(review.rows[0]) : null;
    return question;
  },

  async listQuestions(options: {
    memberId?: string;
    trainerId?: string;
    status?: OnlinePtQuestionStatus;
    page: number;
    limit: number;
  }): Promise<{ items: OnlinePtQuestion[]; total: number }> {
    const pool = getPool();
    if (!pool) return { items: [], total: 0 };
    const where: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (options.memberId) {
      where.push(`q.member_id = $${i++}`);
      params.push(options.memberId);
    }
    if (options.trainerId) {
      where.push(`q.trainer_id = $${i++}`);
      params.push(options.trainerId);
    }
    if (options.status) {
      where.push(`q.status = $${i++}`);
      params.push(options.status);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS c FROM online_pt_questions q ${whereSql}`,
      params
    );
    const offset = (options.page - 1) * options.limit;
    params.push(options.limit, offset);
    const { rows } = await pool.query(
      `SELECT q.*, m.display_name AS member_name, t.display_name AS trainer_name
       FROM online_pt_questions q
       JOIN users m ON m.id = q.member_id
       JOIN users t ON t.id = q.trainer_id
       ${whereSql}
       ORDER BY q.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );
    return { items: rows.map(mapQuestion), total: countRes.rows[0]?.c ?? 0 };
  },

  async updateQuestionStatus(
    id: string,
    patch: Record<string, unknown>
  ): Promise<OnlinePtQuestion | null> {
    const pool = getPool()!;
    const fields: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const map: Record<string, string> = {
      status: 'status',
      answeredAt: 'answered_at',
      closedAt: 'closed_at',
      followupUsed: 'followup_used',
      followupExpiresAt: 'followup_expires_at',
      trainerEarning: 'trainer_earning',
    };
    for (const [k, col] of Object.entries(map)) {
      if (k in patch) {
        fields.push(`${col} = $${i++}`);
        params.push(patch[k]);
      }
    }
    if (!fields.length) return this.getQuestion(id);
    params.push(id);
    await pool.query(
      `UPDATE online_pt_questions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
      params
    );
    return this.getQuestion(id);
  },

  async createAnswer(input: {
    questionId: string;
    trainerId: string;
    body: string;
    photoUrls: string[];
    videoUrls: string[];
    audioUrls: string[];
    isFollowupReply: boolean;
  }): Promise<OnlinePtAnswer> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `INSERT INTO online_pt_answers (
         question_id, trainer_id, body, photo_urls, video_urls, audio_urls, is_followup_reply
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        input.questionId,
        input.trainerId,
        input.body,
        input.photoUrls,
        input.videoUrls,
        input.audioUrls,
        input.isFollowupReply,
      ]
    );
    return mapAnswer(rows[0]);
  },

  async saveAnswerRevision(input: {
    answerId: string;
    editorId: string;
    body: string;
    photoUrls: string[];
    videoUrls: string[];
    audioUrls: string[];
  }): Promise<void> {
    const pool = getPool()!;
    await pool.query(
      `INSERT INTO online_pt_answer_revisions (
         answer_id, editor_id, body, photo_urls, video_urls, audio_urls
       ) VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        input.answerId,
        input.editorId,
        input.body,
        input.photoUrls,
        input.videoUrls,
        input.audioUrls,
      ]
    );
  },

  async createFollowup(input: {
    questionId: string;
    memberId: string;
    body: string;
    photoUrls: string[];
    videoUrls: string[];
  }): Promise<OnlinePtFollowup> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `INSERT INTO online_pt_followups (question_id, member_id, body, photo_urls, video_urls)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [input.questionId, input.memberId, input.body, input.photoUrls, input.videoUrls]
    );
    return mapFollowup(rows[0]);
  },

  async createReview(input: {
    questionId: string;
    memberId: string;
    trainerId: string;
    rating: number;
    body: string;
  }): Promise<OnlinePtReview> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `INSERT INTO online_pt_reviews (question_id, member_id, trainer_id, rating, body)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [input.questionId, input.memberId, input.trainerId, input.rating, input.body]
    );
    await pool.query(
      `UPDATE online_pt_trainer_profiles SET
         review_count = review_count + 1,
         rating_sum = rating_sum + $2,
         rating_avg = ROUND(((rating_sum + $2)::numeric / (review_count + 1)), 2),
         updated_at = NOW()
       WHERE user_id = $1`,
      [input.trainerId, input.rating]
    );
    return mapReview(rows[0]);
  },

  async bumpTrainerAnswerStats(
    trainerId: string,
    onTime: boolean
  ): Promise<void> {
    const pool = getPool()!;
    await pool.query(
      `UPDATE online_pt_trainer_profiles SET
         answer_count = answer_count + 1,
         answered_on_time_count = answered_on_time_count + CASE WHEN $2 THEN 1 ELSE 0 END,
         last_active_at = NOW(),
         updated_at = NOW()
       WHERE user_id = $1`,
      [trainerId, onTime]
    );
  },

  async addWalletEntry(input: {
    trainerId: string;
    questionId?: string | null;
    payoutRequestId?: string | null;
    entryType: 'earning' | 'refund_clawback' | 'payout' | 'adjustment';
    amount: number;
    note?: string;
  }): Promise<void> {
    const pool = getPool()!;
    const bal = await pool.query(
      `SELECT COALESCE(SUM(amount),0)::int AS b FROM online_pt_wallet_ledger WHERE trainer_id = $1`,
      [input.trainerId]
    );
    const balanceAfter = num(bal.rows[0]?.b) + input.amount;
    await pool.query(
      `INSERT INTO online_pt_wallet_ledger (
         trainer_id, question_id, payout_request_id, entry_type, amount, balance_after, note
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        input.trainerId,
        input.questionId ?? null,
        input.payoutRequestId ?? null,
        input.entryType,
        input.amount,
        balanceAfter,
        input.note ?? null,
      ]
    );
  },

  async getWalletSummary(trainerId: string): Promise<OnlinePtWalletSummary> {
    const pool = getPool();
    const policy = await this.getPolicy();
    if (!pool) {
      return {
        totalEarned: 0,
        monthEarned: 0,
        pendingPayout: 0,
        paidOut: 0,
        availableBalance: 0,
        answerCount: 0,
        ratingAvg: 0,
        reviewCount: 0,
        minPayoutAmount: policy.minPayoutAmount,
      };
    }
    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN entry_type = 'earning' THEN amount ELSE 0 END),0)::int AS total_earned,
         COALESCE(SUM(CASE WHEN entry_type = 'earning' AND created_at >= date_trunc('month', NOW()) THEN amount ELSE 0 END),0)::int AS month_earned,
         COALESCE(SUM(CASE WHEN entry_type = 'payout' THEN -amount ELSE 0 END),0)::int AS paid_out_pos,
         COALESCE(SUM(amount),0)::int AS available
       FROM online_pt_wallet_ledger WHERE trainer_id = $1`,
      [trainerId]
    );
    const pending = await pool.query(
      `SELECT COALESCE(SUM(amount),0)::int AS p FROM online_pt_payout_requests
       WHERE trainer_id = $1 AND status IN ('pending','approved')`,
      [trainerId]
    );
    const profile = await this.getTrainerByUserId(trainerId);
    const available = num(rows[0]?.available);
    const pendingPayout = num(pending.rows[0]?.p);
    return {
      totalEarned: num(rows[0]?.total_earned),
      monthEarned: num(rows[0]?.month_earned),
      pendingPayout,
      paidOut: num(rows[0]?.paid_out_pos),
      availableBalance: available,
      answerCount: profile?.answerCount ?? 0,
      ratingAvg: profile?.ratingAvg ?? 0,
      reviewCount: profile?.reviewCount ?? 0,
      minPayoutAmount: policy.minPayoutAmount,
    };
  },

  async createPayoutRequest(
    trainerId: string,
    amount: number
  ): Promise<OnlinePtPayoutRequest> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `INSERT INTO online_pt_payout_requests (trainer_id, amount, status)
       VALUES ($1,$2,'pending') RETURNING *`,
      [trainerId, amount]
    );
    return mapPayout(rows[0]);
  },

  async listPayouts(options: {
    trainerId?: string;
    status?: string;
  }): Promise<OnlinePtPayoutRequest[]> {
    const pool = getPool();
    if (!pool) return [];
    const where: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (options.trainerId) {
      where.push(`p.trainer_id = $${i++}`);
      params.push(options.trainerId);
    }
    if (options.status) {
      where.push(`p.status = $${i++}`);
      params.push(options.status);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT p.*, u.display_name AS trainer_name
       FROM online_pt_payout_requests p
       JOIN users u ON u.id = p.trainer_id
       ${whereSql}
       ORDER BY p.created_at DESC
       LIMIT 100`,
      params
    );
    return rows.map(mapPayout);
  },

  async reviewPayout(
    id: string,
    status: 'approved' | 'rejected' | 'paid',
    adminId: string,
    adminNote?: string | null
  ): Promise<OnlinePtPayoutRequest | null> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `UPDATE online_pt_payout_requests SET
         status = $2, reviewed_by = $3, reviewed_at = NOW(),
         admin_note = COALESCE($4, admin_note), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, status, adminId, adminNote ?? null]
    );
    return rows[0] ? mapPayout(rows[0]) : null;
  },

  async listOverdueOpenQuestions(): Promise<OnlinePtQuestion[]> {
    const pool = getPool();
    if (!pool) return [];
    const { rows } = await pool.query(
      `SELECT q.*, m.display_name AS member_name, t.display_name AS trainer_name
       FROM online_pt_questions q
       JOIN users m ON m.id = q.member_id
       JOIN users t ON t.id = q.trainer_id
       WHERE q.status IN ('received','answering','followup')
         AND q.deadline_at < NOW()
       ORDER BY q.deadline_at ASC
       LIMIT 100`
    );
    return rows.map(mapQuestion);
  },

  async getAdminStats(): Promise<OnlinePtAdminStats> {
    const pool = getPool();
    if (!pool) {
      return {
        questionCount: 0,
        answeredCount: 0,
        openCount: 0,
        revenuePaid: 0,
        trainerEarnings: 0,
        platformFees: 0,
        activeTrainers: 0,
        pendingApprovals: 0,
        pendingPayouts: 0,
        topTrainers: [],
        popularSpecialties: [],
      };
    }
    const q = await pool.query(
      `SELECT
         COUNT(*)::int AS question_count,
         COUNT(*) FILTER (WHERE status IN ('answered','followup','closed'))::int AS answered_count,
         COUNT(*) FILTER (WHERE status IN ('received','answering','followup'))::int AS open_count
       FROM online_pt_questions`
    );
    const rev = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0)::int AS revenue
       FROM online_pt_orders WHERE status = 'paid'`
    );
    const earn = await pool.query(
      `SELECT COALESCE(SUM(amount),0)::int AS e
       FROM online_pt_wallet_ledger WHERE entry_type = 'earning'`
    );
    const trainers = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE approval_status = 'approved' AND accepting_questions)::int AS active,
         COUNT(*) FILTER (WHERE approval_status = 'pending')::int AS pending
       FROM online_pt_trainer_profiles`
    );
    const payouts = await pool.query(
      `SELECT COUNT(*)::int AS c FROM online_pt_payout_requests WHERE status = 'pending'`
    );
    const top = await pool.query(
      `SELECT p.user_id AS trainer_id, u.display_name, p.answer_count, p.rating_avg,
              COALESCE((SELECT SUM(amount) FROM online_pt_wallet_ledger w
                        WHERE w.trainer_id = p.user_id AND w.entry_type = 'earning'),0)::int AS earned
       FROM online_pt_trainer_profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.approval_status = 'approved'
       ORDER BY p.answer_count DESC, p.rating_avg DESC
       LIMIT 10`
    );
    const specs = await pool.query(
      `SELECT unnest(specialties) AS specialty, COUNT(*)::int AS count
       FROM online_pt_trainer_profiles
       WHERE approval_status = 'approved'
       GROUP BY 1 ORDER BY count DESC LIMIT 10`
    );
    const revenuePaid = num(rev.rows[0]?.revenue);
    const trainerEarnings = num(earn.rows[0]?.e);
    return {
      questionCount: num(q.rows[0]?.question_count),
      answeredCount: num(q.rows[0]?.answered_count),
      openCount: num(q.rows[0]?.open_count),
      revenuePaid,
      trainerEarnings,
      platformFees: Math.max(0, revenuePaid - trainerEarnings),
      activeTrainers: num(trainers.rows[0]?.active),
      pendingApprovals: num(trainers.rows[0]?.pending),
      pendingPayouts: num(payouts.rows[0]?.c),
      topTrainers: top.rows.map((r) => ({
        trainerId: String(r.trainer_id),
        displayName: String(r.display_name),
        answerCount: num(r.answer_count),
        ratingAvg: num(r.rating_avg),
        earned: num(r.earned),
      })),
      popularSpecialties: specs.rows.map((r) => ({
        specialty: String(r.specialty),
        count: num(r.count),
      })),
    };
  },

  async listReviews(trainerId?: string): Promise<OnlinePtReview[]> {
    const pool = getPool();
    if (!pool) return [];
    const params: unknown[] = [];
    let sql = `SELECT r.*, u.display_name AS member_name
               FROM online_pt_reviews r
               JOIN users u ON u.id = r.member_id`;
    if (trainerId) {
      params.push(trainerId);
      sql += ` WHERE r.trainer_id = $1`;
    }
    sql += ` ORDER BY r.created_at DESC LIMIT 100`;
    const { rows } = await pool.query(sql, params);
    return rows.map(mapReview);
  },

  async listReports(): Promise<
    Array<{
      id: string;
      questionId?: string | null;
      reviewId?: string | null;
      reporterId: string;
      reason: string;
      description?: string | null;
      status: string;
      createdAt: string;
    }>
  > {
    const pool = getPool();
    if (!pool) return [];
    const { rows } = await pool.query(
      `SELECT * FROM online_pt_reports ORDER BY created_at DESC LIMIT 100`
    );
    return rows.map((r) => ({
      id: String(r.id),
      questionId: r.question_id ? String(r.question_id) : null,
      reviewId: r.review_id ? String(r.review_id) : null,
      reporterId: String(r.reporter_id),
      reason: String(r.reason),
      description: r.description ? String(r.description) : null,
      status: String(r.status),
      createdAt: new Date(String(r.created_at)).toISOString(),
    }));
  },

  async resolveReport(
    id: string,
    status: 'resolved' | 'dismissed',
    adminId: string
  ): Promise<void> {
    const pool = getPool()!;
    await pool.query(
      `UPDATE online_pt_reports SET status = $2, resolved_by = $3, resolved_at = NOW()
       WHERE id = $1`,
      [id, status, adminId]
    );
  },
};
