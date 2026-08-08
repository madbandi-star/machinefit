import type {
  ApplyWorkoutCardTemplateInput,
  CopyWorkoutCardInput,
  CreateWorkoutCardInput,
  CreateWorkoutCardTemplateInput,
  Locale,
  MoveWorkoutCardDateInput,
  PatchWorkoutCardStatusInput,
  ResolveMissedWorkoutCardInput,
  UpdateWorkoutCardInput,
  WorkoutCard,
  WorkoutCardCalendarSummaryQuery,
  WorkoutCardListQuery,
  WorkoutCardMissedQuery,
  WorkoutCardStatus,
  WorkoutCardTemplate,
  WorkoutCardTemplateItem,
  WorkoutCardTemplateListQuery,
  WorkoutPlanStats,
  WorkoutPlanStatsQuery,
} from '@machinefit/shared';
import {
  isFreeWeightMachineCode,
  normalizeWorkoutLogTargetMuscle,
} from '@machinefit/shared';
import { workoutCardRepository } from '../repositories/workout-card.repository.js';
import { workoutLogRepository } from '../repositories/workout-log.repository.js';
import { historyRepository } from '../repositories/history.repository.js';
import { workoutRecordOrderRepository } from '../repositories/workout-record-order.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { gymScopeService } from './gym-scope.service.js';
import { liftedVolumeService } from './lifted-volume.service.js';
import { resolveWorkoutLoadContexts } from './workout-load.service.js';
import { growthTimelineService } from './growth-timeline.service.js';
import { achievementService } from './achievement.service.js';
import { AppError } from '../middlewares/error.middleware.js';

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function defaultStatusForDate(
  scheduledDate: string,
  explicit?: WorkoutCardStatus
): WorkoutCardStatus {
  if (explicit) return explicit;
  const today = todayDateKey();
  return scheduledDate > today ? 'PLANNED' : 'COMPLETED';
}

function pgCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return '';
}

function throwDuplicateCard(error: unknown): never {
  if (pgCode(error) === '23505') {
    throw new AppError(
      409,
      'DUPLICATE_CARD',
      'A workout card already exists for this machine, date, and target muscle'
    );
  }
  throw error;
}

function completionRate(counts: Record<WorkoutCardStatus, number>): number {
  const total =
    counts.PLANNED + counts.IN_PROGRESS + counts.COMPLETED + counts.SKIPPED;
  if (total <= 0) return 0;
  return Math.round((counts.COMPLETED / total) * 1000) / 1000;
}

function stripMachineId(
  card: WorkoutCard & { machineId: string }
): WorkoutCard {
  const { machineId: _machineId, ...rest } = card;
  return rest;
}

async function resolveMachineAndMuscle(
  machineCode: string,
  targetMuscleGroup?: CreateWorkoutCardInput['targetMuscleGroup']
): Promise<{ machineId: string; targetMuscleKey: string }> {
  const machineId = await machineRepository.findIdByCode(machineCode);
  if (!machineId) {
    throw new AppError(404, 'NOT_FOUND', `Machine not found: ${machineCode}`);
  }
  const targetMuscleKey = normalizeWorkoutLogTargetMuscle(
    machineCode,
    targetMuscleGroup
  );
  if (isFreeWeightMachineCode(machineCode) && !targetMuscleKey) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'targetMuscleGroup is required for free-weight cards'
    );
  }
  return { machineId, targetMuscleKey };
}

async function upsertLogForCompletedCard(
  userId: string,
  card: WorkoutCard & { machineId: string }
): Promise<string> {
  const setCompleted =
    card.setCompleted && card.setCompleted.length === card.setCount
      ? card.setCompleted
      : Array.from({ length: card.setCount }, () => true);

  const log = await workoutLogRepository.upsert(
    userId,
    card.gymId,
    card.memberId,
    card.machineId,
    {
      recommendationId: card.recommendationId,
      logDate: card.scheduledDate,
      targetMuscleGroup: card.targetMuscleGroup ?? '',
      setCount: card.setCount,
      setWeightsKg: card.setWeightsKg,
      setCompleted,
      diary: card.diary,
    }
  );
  return log.id;
}

export const workoutCardService = {
  async list(
    userId: string,
    query: WorkoutCardListQuery,
    locale: Locale = 'en'
  ): Promise<WorkoutCard[]> {
    await gymScopeService.resolveMemberForWrite(
      userId,
      query.gymId,
      query.memberId
    );
    return workoutCardRepository.listByUser(
      userId,
      {
        gymId: query.gymId,
        memberId: query.memberId,
        scheduledDate: query.scheduledDate,
        from: query.from,
        to: query.to,
        status: query.status,
        limit: query.limit,
      },
      locale
    );
  },

  async create(
    userId: string,
    input: CreateWorkoutCardInput,
    locale: Locale = 'en'
  ): Promise<WorkoutCard> {
    await gymScopeService.resolveMemberForWrite(
      userId,
      input.gymId,
      input.memberId
    );
    const { machineId, targetMuscleKey } = await resolveMachineAndMuscle(
      input.machineCode,
      input.targetMuscleGroup
    );

    const status = defaultStatusForDate(input.scheduledDate, input.status);
    const nowIso = new Date().toISOString();
    const completedAt = status === 'COMPLETED' ? nowIso : null;
    const startedAt = status === 'IN_PROGRESS' ? nowIso : null;

    try {
      const created = await workoutCardRepository.create(
        userId,
        {
          gymId: input.gymId,
          memberId: input.memberId,
          machineId,
          recommendationId: input.recommendationId,
          targetMuscleGroup: targetMuscleKey,
          scheduledDate: input.scheduledDate,
          status,
          setCount: input.setCount,
          setWeightsKg: input.setWeightsKg,
          setReps: input.setReps,
          setCompleted: input.setCompleted,
          diary: input.diary,
          restSeconds: input.restSeconds,
          displayOrder: input.displayOrder,
          templateId: input.templateId,
          startedAt,
          completedAt,
        },
        locale
      );

      if (status === 'COMPLETED') {
        try {
          const logId = await upsertLogForCompletedCard(userId, created);
          const linked = await workoutCardRepository.updateStatus(
            userId,
            created.id,
            { status: 'COMPLETED', workoutLogId: logId, completedAt },
            locale
          );
          return stripMachineId(linked ?? created);
        } catch {
          return stripMachineId(created);
        }
      }

      return stripMachineId(created);
    } catch (error) {
      throwDuplicateCard(error);
    }
  },

  async update(
    userId: string,
    id: string,
    input: UpdateWorkoutCardInput,
    locale: Locale = 'en'
  ): Promise<WorkoutCard> {
    const existing = await workoutCardRepository.findById(userId, id, locale);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
    }

    if (existing.status === 'SKIPPED') {
      throw new AppError(
        400,
        'INVALID_STATUS',
        'Skipped cards can only change status or be deleted'
      );
    }

    const setCount = input.setCount ?? existing.setCount;
    if (input.setWeightsKg && input.setWeightsKg.length !== setCount) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'setWeightsKg length must match setCount'
      );
    }
    if (input.setReps && input.setReps.length !== setCount) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'setReps length must match setCount'
      );
    }
    if (input.setCompleted && input.setCompleted.length !== setCount) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'setCompleted length must match setCount'
      );
    }

    const updated = await workoutCardRepository.update(
      userId,
      id,
      {
        setCount: input.setCount,
        setWeightsKg: input.setWeightsKg,
        setReps: input.setReps,
        setCompleted: input.setCompleted,
        diary: input.diary,
        restSeconds: input.restSeconds,
        displayOrder: input.displayOrder,
        recommendationId: input.recommendationId,
      },
      locale
    );
    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
    }

    // Keep linked workout log in sync when completed card sets change.
    if (updated.status === 'COMPLETED') {
      try {
        const logId = await upsertLogForCompletedCard(userId, updated);
        if (logId !== updated.workoutLogId) {
          const linked = await workoutCardRepository.updateStatus(
            userId,
            updated.id,
            { status: 'COMPLETED', workoutLogId: logId },
            locale
          );
          return stripMachineId(linked ?? updated);
        }
      } catch {
        /* log sync must not fail card update */
      }
    }

    return stripMachineId(updated);
  },

  async patchStatus(
    userId: string,
    id: string,
    input: PatchWorkoutCardStatusInput,
    locale: Locale = 'en'
  ): Promise<WorkoutCard> {
    const existing = await workoutCardRepository.findById(userId, id, locale);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
    }

    const next = input.status;
    const nowIso = new Date().toISOString();

    if (next === 'IN_PROGRESS') {
      const updated = await workoutCardRepository.updateStatus(
        userId,
        id,
        {
          status: 'IN_PROGRESS',
          startedAt: existing.startedAt ?? nowIso,
          clearCompletedAt: true,
        },
        locale
      );
      if (!updated) throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
      return stripMachineId(updated);
    }

    if (next === 'COMPLETED') {
      let workoutLogId = existing.workoutLogId ?? null;
      try {
        workoutLogId = await upsertLogForCompletedCard(userId, {
          ...existing,
          status: 'COMPLETED',
        });
      } catch (error) {
        if (pgCode(error) === '23505') {
          throw new AppError(
            409,
            'DUPLICATE_LOG',
            'A workout log already exists for this machine, date, and target muscle'
          );
        }
        throw error;
      }

      const updated = await workoutCardRepository.updateStatus(
        userId,
        id,
        {
          status: 'COMPLETED',
          completedAt: nowIso,
          startedAt: existing.startedAt ?? nowIso,
          workoutLogId,
        },
        locale
      );
      if (!updated) throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
      return stripMachineId(updated);
    }

    if (next === 'SKIPPED') {
      const updated = await workoutCardRepository.updateStatus(
        userId,
        id,
        { status: 'SKIPPED' },
        locale
      );
      if (!updated) throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
      return stripMachineId(updated);
    }

    // PLANNED
    const updated = await workoutCardRepository.updateStatus(
      userId,
      id,
      {
        status: 'PLANNED',
        clearStartedAt: true,
        clearCompletedAt: true,
      },
      locale
    );
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
    return stripMachineId(updated);
  },

  async moveDate(
    userId: string,
    id: string,
    input: MoveWorkoutCardDateInput,
    locale: Locale = 'en'
  ): Promise<WorkoutCard> {
    const existing = await workoutCardRepository.findById(userId, id, locale);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
    }

    const fromDate = existing.scheduledDate;
    const toDate = input.scheduledDate;
    if (fromDate === toDate) {
      return stripMachineId(existing);
    }

    const targetMuscleKey = existing.targetMuscleGroup ?? '';

    try {
      const moved = await workoutCardRepository.moveDate(
        userId,
        id,
        toDate,
        locale
      );
      if (!moved) {
        throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
      }

      // Records UI merges workout_logs + recent_history by date. Moving only the
      // plan card left the source-date row behind — move/remove those too.
      const sourceLog = await workoutLogRepository.findByUserMachineDate(
        userId,
        existing.gymId,
        existing.machineId,
        fromDate,
        targetMuscleKey,
        existing.memberId
      );

      if (sourceLog) {
        const targetLog = await workoutLogRepository.findByUserMachineDate(
          userId,
          existing.gymId,
          existing.machineId,
          toDate,
          targetMuscleKey,
          existing.memberId
        );

        try {
          const loadById = await resolveWorkoutLoadContexts(
            userId,
            targetLog ? [sourceLog, targetLog] : [sourceLog],
            { gymId: existing.gymId, memberId: existing.memberId }
          );

          // Remove volume from the old date.
          await liftedVolumeService.applyLogDelta({
            userId,
            gymId: existing.gymId,
            logDate: fromDate,
            previousWeights: sourceLog.setWeightsKg,
            previousCompleted: sourceLog.setCompleted,
            previousSets: sourceLog.setCount,
            previousLoad: loadById.get(sourceLog.id),
            nextWeights: [],
            nextCompleted: [],
            nextSets: 0,
            nextLoad: null,
          });

          const saved = await workoutLogRepository.upsert(
            userId,
            existing.gymId,
            existing.memberId,
            existing.machineId,
            {
              recommendationId:
                existing.recommendationId ?? sourceLog.recommendationId,
              logDate: toDate,
              targetMuscleGroup: targetMuscleKey,
              setCount: sourceLog.setCount,
              setWeightsKg: sourceLog.setWeightsKg,
              setCompleted: sourceLog.setCompleted,
              diary: sourceLog.diary,
            }
          );

          // Add volume on the new date (replace any pre-existing target log).
          await liftedVolumeService.applyLogDelta({
            userId,
            gymId: existing.gymId,
            logDate: toDate,
            previousWeights: targetLog?.setWeightsKg ?? [],
            previousCompleted: targetLog?.setCompleted,
            previousSets: targetLog?.setCount ?? 0,
            previousLoad: targetLog ? loadById.get(targetLog.id) ?? null : null,
            nextWeights: sourceLog.setWeightsKg,
            nextCompleted: sourceLog.setCompleted,
            nextSets: sourceLog.setCount,
            nextLoad: null,
          });

          await workoutLogRepository.deleteByUserMachineDate(
            userId,
            existing.gymId,
            existing.memberId,
            existing.machineId,
            fromDate,
            targetMuscleKey
          );

          await workoutCardRepository.syncFromWorkoutLog(userId, {
            gymId: existing.gymId,
            memberId: existing.memberId,
            machineId: existing.machineId,
            scheduledDate: toDate,
            targetMuscleGroup: targetMuscleKey,
            setCount: sourceLog.setCount,
            setWeightsKg: sourceLog.setWeightsKg,
            setCompleted: sourceLog.setCompleted,
            diary: sourceLog.diary ?? null,
            workoutLogId: saved.id,
          });
        } catch {
          /* log/volume move is best-effort after card date change */
        }

        growthTimelineService.invalidateUser(userId);
        void Promise.allSettled([
          achievementService.refreshUser(userId),
          growthTimelineService.refreshUser(userId),
        ]);
      }

      try {
        await historyRepository.removeForMachineDate(
          userId,
          existing.gymId,
          existing.memberId,
          existing.machineId,
          fromDate
        );
      } catch {
        /* history cleanup must not fail move */
      }

      try {
        await workoutRecordOrderRepository.removeForCard(
          userId,
          existing.gymId,
          existing.memberId,
          fromDate,
          existing.machineId,
          targetMuscleKey
        );
      } catch {
        /* display-order cleanup must not fail move */
      }

      // Status rules: COMPLETED stays COMPLETED even when moved to future;
      // PLANNED stays PLANNED. No automatic status flip on move.
      const refreshed = await workoutCardRepository.findById(userId, id, locale);
      return stripMachineId(refreshed ?? moved);
    } catch (error) {
      throwDuplicateCard(error);
    }
  },

  async copy(
    userId: string,
    id: string,
    input: CopyWorkoutCardInput,
    locale: Locale = 'en'
  ): Promise<WorkoutCard> {
    const existing = await workoutCardRepository.findById(userId, id, locale);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
    }

    const status = defaultStatusForDate(input.scheduledDate, input.status);
    const nowIso = new Date().toISOString();
    const targetMuscleKey = existing.targetMuscleGroup ?? '';

    // Diary/sets often live on workout_logs after 「계획 저장」 while card.diary stays empty.
    const sourceLog = await workoutLogRepository.findByUserMachineDate(
      userId,
      existing.gymId,
      existing.machineId,
      existing.scheduledDate,
      targetMuscleKey,
      existing.memberId
    );

    const setCount = sourceLog?.setCount ?? existing.setCount;
    const setWeightsKg = sourceLog?.setWeightsKg?.length
      ? sourceLog.setWeightsKg
      : existing.setWeightsKg;
    const diary =
      (existing.diary?.trim() || sourceLog?.diary?.trim() || '') || undefined;
    const setCompleted =
      status === 'COMPLETED'
        ? sourceLog?.setCompleted && sourceLog.setCompleted.length === setCount
          ? sourceLog.setCompleted
          : existing.setCompleted && existing.setCompleted.length === setCount
            ? existing.setCompleted
            : Array.from({ length: setCount }, () => true)
        : Array.from({ length: setCount }, () => false);

    try {
      const created = await workoutCardRepository.create(
        userId,
        {
          gymId: existing.gymId,
          memberId: existing.memberId,
          machineId: existing.machineId,
          recommendationId: existing.recommendationId ?? sourceLog?.recommendationId,
          targetMuscleGroup: targetMuscleKey,
          scheduledDate: input.scheduledDate,
          status,
          setCount,
          setWeightsKg,
          setReps: existing.setReps,
          setCompleted,
          diary,
          restSeconds: existing.restSeconds,
          displayOrder: existing.displayOrder,
          sourceCardId: existing.id,
          startedAt: status === 'IN_PROGRESS' ? nowIso : null,
          completedAt: status === 'COMPLETED' ? nowIso : null,
        },
        locale
      );

      // Mirror onto workout_logs so history UI (reads diary from logs) shows the copy.
      try {
        const log = await workoutLogRepository.upsert(
          userId,
          created.gymId,
          created.memberId,
          created.machineId,
          {
            recommendationId: created.recommendationId,
            logDate: input.scheduledDate,
            targetMuscleGroup: targetMuscleKey,
            setCount,
            setWeightsKg,
            setCompleted,
            diary,
          }
        );
        const linked = await workoutCardRepository.updateStatus(
          userId,
          created.id,
          {
            status,
            workoutLogId: log.id,
            ...(status === 'COMPLETED' ? { completedAt: nowIso } : {}),
            ...(status === 'IN_PROGRESS' ? { startedAt: nowIso } : {}),
          },
          locale
        );
        return stripMachineId(linked ?? created);
      } catch {
        return stripMachineId(created);
      }
    } catch (error) {
      throwDuplicateCard(error);
    }
  },

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await workoutCardRepository.delete(userId, id);
    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
    }
  },

  async listMissed(
    userId: string,
    query: WorkoutCardMissedQuery,
    locale: Locale = 'en'
  ): Promise<WorkoutCard[]> {
    await gymScopeService.resolveMemberForWrite(
      userId,
      query.gymId,
      query.memberId
    );
    return workoutCardRepository.listMissed(
      userId,
      query.gymId,
      query.memberId,
      todayDateKey(),
      locale
    );
  },

  async resolveMissed(
    userId: string,
    id: string,
    input: ResolveMissedWorkoutCardInput,
    locale: Locale = 'en'
  ): Promise<WorkoutCard | null> {
    const existing = await workoutCardRepository.findById(userId, id, locale);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Workout card not found');
    }
    if (existing.status !== 'PLANNED') {
      throw new AppError(
        400,
        'INVALID_STATUS',
        'Only PLANNED missed cards can be resolved'
      );
    }
    const today = todayDateKey();
    if (existing.scheduledDate >= today) {
      throw new AppError(400, 'NOT_MISSED', 'Card is not in the past');
    }

    if (input.action === 'delete') {
      await this.remove(userId, id);
      return null;
    }

    if (input.action === 'dismiss') {
      return this.patchStatus(userId, id, { status: 'SKIPPED' }, locale);
    }

    if (input.action === 'move_today') {
      return this.moveDate(userId, id, { scheduledDate: today }, locale);
    }

    // move_date
    if (!input.scheduledDate) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'scheduledDate is required for move_date'
      );
    }
    return this.moveDate(
      userId,
      id,
      { scheduledDate: input.scheduledDate },
      locale
    );
  },

  async getStats(
    userId: string,
    query: WorkoutPlanStatsQuery
  ): Promise<WorkoutPlanStats> {
    await gymScopeService.resolveMemberForWrite(
      userId,
      query.gymId,
      query.memberId
    );

    const today = todayDateKey();
    const periodFrom = query.from;
    const periodTo = query.to;

    const periodCounts = await workoutCardRepository.getStatusCounts(
      userId,
      query.gymId,
      query.memberId,
      periodFrom,
      periodTo
    );

    const weekFrom = shiftDateKey(today, -6);
    const weekCounts = await workoutCardRepository.getStatusCounts(
      userId,
      query.gymId,
      query.memberId,
      weekFrom,
      today
    );

    const monthFrom = shiftDateKey(today, -29);
    const monthCounts = await workoutCardRepository.getStatusCounts(
      userId,
      query.gymId,
      query.memberId,
      monthFrom,
      today
    );

    return {
      plannedCount: periodCounts.PLANNED + periodCounts.IN_PROGRESS,
      completedCount: periodCounts.COMPLETED,
      skippedCount: periodCounts.SKIPPED,
      completionRate: completionRate(periodCounts),
      weeklyCompletionRate: completionRate(weekCounts),
      monthlyCompletionRate: completionRate(monthCounts),
    };
  },

  async calendarSummary(
    userId: string,
    query: WorkoutCardCalendarSummaryQuery
  ) {
    await gymScopeService.resolveMemberForWrite(
      userId,
      query.gymId,
      query.memberId
    );
    return workoutCardRepository.calendarSummary(
      userId,
      query.gymId,
      query.memberId,
      query.from,
      query.to
    );
  },

  async createTemplate(
    userId: string,
    input: CreateWorkoutCardTemplateInput
  ): Promise<WorkoutCardTemplate> {
    if (input.gymId) {
      await gymScopeService.assertOwned(userId, input.gymId);
    }

    let items: WorkoutCardTemplateItem[] = input.items ?? [];

    if (input.fromDate && items.length === 0) {
      if (!input.gymId) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'gymId is required when creating a template fromDate'
        );
      }
      items = await workoutCardRepository.listTemplateSourceItems(
        userId,
        input.gymId,
        input.fromDate
      );
      if (items.length === 0) {
        throw new AppError(400, 'EMPTY_TEMPLATE', 'No cards found for fromDate');
      }
    }

    if (items.length === 0) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Template requires items or fromDate with cards'
      );
    }

    return workoutCardRepository.createTemplate(userId, {
      gymId: input.gymId,
      name: input.name,
      items,
    });
  },

  async listTemplates(
    userId: string,
    query: WorkoutCardTemplateListQuery
  ): Promise<WorkoutCardTemplate[]> {
    if (query.gymId) {
      await gymScopeService.assertOwned(userId, query.gymId);
    }
    return workoutCardRepository.listTemplates(userId, query.gymId);
  },

  async applyTemplate(
    userId: string,
    input: ApplyWorkoutCardTemplateInput,
    locale: Locale = 'en'
  ): Promise<WorkoutCard[]> {
    await gymScopeService.resolveMemberForWrite(
      userId,
      input.gymId,
      input.memberId
    );

    const template = await workoutCardRepository.findTemplateById(
      userId,
      input.templateId
    );
    if (!template) {
      throw new AppError(404, 'NOT_FOUND', 'Template not found');
    }

    const status = defaultStatusForDate(input.scheduledDate);
    const created: WorkoutCard[] = [];

    for (const item of template.items) {
      const { machineId, targetMuscleKey } = await resolveMachineAndMuscle(
        item.machineCode,
        item.targetMuscleGroup
      );
      try {
        const card = await workoutCardRepository.create(
          userId,
          {
            gymId: input.gymId,
            memberId: input.memberId,
            machineId,
            recommendationId: item.recommendationId,
            targetMuscleGroup: targetMuscleKey,
            scheduledDate: input.scheduledDate,
            status,
            setCount: item.setCount,
            setWeightsKg: item.setWeightsKg,
            setReps: item.setReps,
            diary: item.diary,
            restSeconds: item.restSeconds,
            displayOrder: item.displayOrder,
            templateId: template.id,
            completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
          },
          locale
        );

        if (status === 'COMPLETED') {
          try {
            const logId = await upsertLogForCompletedCard(userId, card);
            const linked = await workoutCardRepository.updateStatus(
              userId,
              card.id,
              {
                status: 'COMPLETED',
                workoutLogId: logId,
                completedAt: new Date().toISOString(),
              },
              locale
            );
            created.push(stripMachineId(linked ?? card));
          } catch {
            created.push(stripMachineId(card));
          }
        } else {
          created.push(stripMachineId(card));
        }
      } catch (error) {
        throwDuplicateCard(error);
      }
    }

    return created;
  },

  async deleteTemplate(userId: string, id: string): Promise<void> {
    const deleted = await workoutCardRepository.deleteTemplate(userId, id);
    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', 'Template not found');
    }
  },

  /** Reminder job entry — returns number of notifications created. */
  async sendDueReminders(): Promise<number> {
    const today = todayDateKey();
    const userIds =
      await workoutCardRepository.listUserIdsWithPlannedOnDate(today);
    let created = 0;

    for (const userId of userIds) {
      try {
        const already =
          await workoutCardRepository.hasReminderNotificationForDate(
            userId,
            today
          );
        if (already) continue;

        const count = await workoutCardRepository.countPlannedForUserOnDate(
          userId,
          today
        );
        if (count <= 0) continue;

        const { notificationRepository } = await import(
          '../repositories/notification.repository.js'
        );
        await notificationRepository.create(
          userId,
          'push_schedule',
          {
            en: 'Workout plan reminder',
            ko: '운동 계획 알림',
          },
          {
            en: `You have ${count} planned workout(s) scheduled for today.`,
            ko: `오늘 예정된 운동이 ${count}개 있습니다.`,
          },
          {
            kind: 'workout_card_reminder',
            date: today,
            plannedCount: count,
          }
        );
        created += 1;
      } catch {
        /* push/notification unavailable — continue */
      }
    }

    return created;
  },
};
