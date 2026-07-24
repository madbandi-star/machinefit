import type { Request, Response } from 'express';
import {
  createOnlinePtAnswerSchema,
  createOnlinePtFollowupSchema,
  createOnlinePtPayoutSchema,
  createOnlinePtQuestionSchema,
  createOnlinePtReviewSchema,
  listOnlinePtQuestionsSchema,
  listOnlinePtTrainersSchema,
  purchaseOnlinePtTicketsSchema,
  resolveOnlinePtReportSchema,
  reviewOnlinePtPayoutSchema,
  reviewOnlinePtTrainerSchema,
  updateOnlinePtPolicySchema,
  upsertOnlinePtTrainerProfileSchema,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { onlinePtService } from '../services/online-pt.service.js';
import { getParam } from '../utils/params.util.js';

function requireUser(req: Request) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return req.user;
}

export async function getPolicy(_req: Request, res: Response): Promise<void> {
  const data = await onlinePtService.getPolicy();
  res.json({ success: true, data });
}

export async function updatePolicy(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = updateOnlinePtPolicySchema.parse(req.body);
  const data = await onlinePtService.updatePolicy(user.userId, input);
  res.json({ success: true, data });
}

export async function listTrainers(req: Request, res: Response): Promise<void> {
  const query = listOnlinePtTrainersSchema.parse(req.query);
  const data = await onlinePtService.listTrainers(query, req.user?.userId);
  res.json({ success: true, data });
}

export async function getTrainer(req: Request, res: Response): Promise<void> {
  const data = await onlinePtService.getTrainer(
    getParam(req.params.trainerId),
    req.user?.userId
  );
  res.json({ success: true, data });
}

export async function getMyTrainerProfile(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await onlinePtService.getMyTrainerProfile(user.userId);
  res.json({ success: true, data });
}

export async function upsertMyTrainerProfile(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = upsertOnlinePtTrainerProfileSchema.parse(req.body);
  const data = await onlinePtService.upsertTrainerProfile(user.userId, input);
  res.json({ success: true, data });
}

export async function purchaseTickets(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = purchaseOnlinePtTicketsSchema.parse(req.body);
  const data = await onlinePtService.purchaseTickets(user.userId, input);
  res.status(201).json({ success: true, data });
}

export async function listMyBalances(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await onlinePtService.listMyBalances(user.userId);
  res.json({ success: true, data });
}

export async function createQuestion(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createOnlinePtQuestionSchema.parse(req.body);
  const data = await onlinePtService.createQuestion(user.userId, input);
  res.status(201).json({ success: true, data });
}

export async function listQuestions(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = listOnlinePtQuestionsSchema.parse(req.query);
  const data = await onlinePtService.listQuestions(user.userId, query);
  res.json({ success: true, data });
}

export async function getQuestion(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await onlinePtService.getQuestion(getParam(req.params.questionId), user.userId);
  res.json({ success: true, data });
}

export async function answerQuestion(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createOnlinePtAnswerSchema.parse(req.body);
  const data = await onlinePtService.answerQuestion(
    user.userId,
    getParam(req.params.questionId),
    input
  );
  res.status(201).json({ success: true, data });
}

export async function addFollowup(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createOnlinePtFollowupSchema.parse(req.body);
  const data = await onlinePtService.addFollowup(
    user.userId,
    getParam(req.params.questionId),
    input
  );
  res.status(201).json({ success: true, data });
}

export async function createReview(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createOnlinePtReviewSchema.parse(req.body);
  const data = await onlinePtService.createReview(
    user.userId,
    getParam(req.params.questionId),
    input
  );
  res.status(201).json({ success: true, data });
}

export async function getWallet(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await onlinePtService.getWallet(user.userId);
  res.json({ success: true, data });
}

export async function requestPayout(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createOnlinePtPayoutSchema.parse(req.body);
  const data = await onlinePtService.requestPayout(user.userId, input.amount);
  res.status(201).json({ success: true, data });
}

export async function listMyPayouts(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await onlinePtService.listMyPayouts(user.userId);
  res.json({ success: true, data });
}

export async function adminStats(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await onlinePtService.adminStats();
  res.json({ success: true, data });
}

export async function adminListTrainers(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const query = listOnlinePtTrainersSchema.parse(req.query);
  const data = await onlinePtService.adminListTrainers(query);
  res.json({ success: true, data });
}

export async function adminReviewTrainer(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = reviewOnlinePtTrainerSchema.parse(req.body);
  const data = await onlinePtService.setTrainerApproval(
    user.userId,
    getParam(req.params.trainerId),
    input.approvalStatus
  );
  res.json({ success: true, data });
}

export async function adminListPayouts(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await onlinePtService.adminListPayouts();
  res.json({ success: true, data });
}

export async function adminReviewPayout(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = reviewOnlinePtPayoutSchema.parse(req.body);
  const data = await onlinePtService.reviewPayout(
    user.userId,
    getParam(req.params.payoutId),
    input.status,
    input.adminNote
  );
  res.json({ success: true, data });
}

export async function adminListReviews(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await onlinePtService.adminListReviews();
  res.json({ success: true, data });
}

export async function adminListReports(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await onlinePtService.adminListReports();
  res.json({ success: true, data });
}

export async function adminResolveReport(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = resolveOnlinePtReportSchema.parse(req.body);
  await onlinePtService.resolveReport(user.userId, getParam(req.params.reportId), input.status);
  res.json({ success: true, data: { ok: true } });
}

export async function processOverdue(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await onlinePtService.processOverdueQuestions();
  res.json({ success: true, data });
}
