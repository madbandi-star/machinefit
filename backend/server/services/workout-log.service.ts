import type {
  UpsertWorkoutLogInput,
  WorkoutLogListQuery,
  DeleteWorkoutLogInput,
  DeleteWorkoutLogsByDateBody,
  Locale,
} from '@machinefit/shared';
import { isFreeWeightMachineCode, normalizeWorkoutLogTargetMuscle, isAllGymsId } from '@machinefit/shared';
import { workoutLogRepository } from '../repositories/workout-log.repository.js';
import { workoutCardRepository } from '../repositories/workout-card.repository.js';
import { historyRepository } from '../repositories/history.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { gymScopeService } from './gym-scope.service.js';
import { trackUsageSafe } from './usage.service.js';
import { liftedVolumeService } from './lifted-volume.service.js';
import { achievementService } from './achievement.service.js';
import { growthTimelineService } from './growth-timeline.service.js';
import { resolveWorkoutLoadContexts } from './workout-load.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { assertSafeUgc } from '../utils/content-safety.util.js';

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const workoutLogService = {
  async list(userId: string, query: WorkoutLogListQuery, locale: Locale = 'en') {
    const { gymIds } = await gymScopeService.resolveGymFilter(userId, query.gymId);
    const linkScope = await gymScopeService.resolveLinkedRecordListScope(
      userId,
      query.memberId
    );

    let machineId: string | undefined;
    if (query.machineCode) {
      const foundId = await machineRepository.findIdByCode(query.machineCode);
      if (!foundId) {
        throw new AppError(404, 'NOT_FOUND', `Machine not found: ${query.machineCode}`);
      }
      machineId = foundId;
    }

    const targetMuscleGroup =
      query.machineCode && query.targetMuscleGroup !== undefined
        ? normalizeWorkoutLogTargetMuscle(query.machineCode, query.targetMuscleGroup)
        : undefined;

    if (isAllGymsId(query.gymId)) {
      return workoutLogRepository.listByUser(
        userId,
        {
          gymId: query.gymId,
          gymIds,
          memberId: query.memberId,
          machineId,
          logDate: query.logDate,
          from: query.from,
          to: query.to,
          limit: query.limit,
          targetMuscleGroup,
          linkScope,
        },
        locale
      );
    }

    return workoutLogRepository.listByUser(
      userId,
      {
        gymId: query.gymId,
        memberId: query.memberId,
        machineId,
        logDate: query.logDate,
        from: query.from,
        to: query.to,
        limit: query.limit,
        targetMuscleGroup,
        linkScope,
      },
      locale
    );
  },

  async upsert(userId: string, input: UpsertWorkoutLogInput) {
    await gymScopeService.resolveMemberForWrite(userId, input.gymId, input.memberId);

    const machineId = await machineRepository.findIdByCode(input.machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${input.machineCode}`);
    }

    const targetMuscleKey = normalizeWorkoutLogTargetMuscle(
      input.machineCode,
      input.targetMuscleGroup
    );

    if (isFreeWeightMachineCode(input.machineCode) && !targetMuscleKey) {
      throw new AppError(400, 'VALIDATION_ERROR', 'targetMuscleGroup is required for free-weight logs');
    }

    const logDate = input.logDate ?? todayDateKey();
    assertSafeUgc(input.diary);

    const previous = await workoutLogRepository.findByUserMachineDate(
      userId,
      input.gymId,
      machineId,
      logDate,
      targetMuscleKey,
      input.memberId
    );

    try {
      const saved = await workoutLogRepository.upsert(userId, input.gymId, input.memberId, machineId, {
        recommendationId: input.recommendationId,
        logDate,
        targetMuscleGroup: targetMuscleKey,
        setCount: input.setCount,
        setWeightsKg: input.setWeightsKg,
        setCompleted: input.setCompleted,
        diary: input.diary,
      });

      // Best-effort: mirror diary/sets onto matching workout_card for date-copy.
      try {
        await workoutCardRepository.syncFromWorkoutLog(userId, {
          gymId: input.gymId,
          memberId: input.memberId,
          machineId,
          scheduledDate: logDate,
          targetMuscleGroup: targetMuscleKey,
          setCount: input.setCount,
          setWeightsKg: input.setWeightsKg,
          setCompleted: input.setCompleted,
          diary: input.diary ?? null,
          workoutLogId: saved.id,
        });
      } catch {
        /* card sync must not fail workout save */
      }

      // Ensure Records can show this machine: recommend usually writes history,
      // but easy-mode / edge paths may save a log without a recent_history row.
      if (input.recommendationId) {
        try {
          await historyRepository.record(
            userId,
            input.gymId,
            input.memberId,
            machineId,
            input.recommendationId
          );
        } catch {
          /* history mirror must not fail workout save */
        }
      }

      try {
        const loadLogs = [
          ...(previous ? [previous] : []),
          {
            id: saved.id,
            gymId: saved.gymId,
            memberId: saved.memberId,
            machineCode: saved.machineCode,
            recommendationId: saved.recommendationId ?? input.recommendationId,
            logDate: saved.logDate,
            setCount: saved.setCount,
            setWeightsKg: saved.setWeightsKg,
            setCompleted: saved.setCompleted,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
          },
        ];
        const loadById = await resolveWorkoutLoadContexts(userId, loadLogs, {
          gymId: input.gymId,
          memberId: input.memberId,
        });

        await liftedVolumeService.applyLogDelta({
          userId,
          gymId: input.gymId,
          logDate,
          previousWeights: previous?.setWeightsKg ?? [],
          previousCompleted: previous?.setCompleted,
          previousSets: previous?.setCount,
          previousLoad: previous ? loadById.get(previous.id) : null,
          nextWeights: input.setWeightsKg,
          nextCompleted: input.setCompleted,
          nextSets: input.setCount,
          nextLoad: loadById.get(saved.id),
        });
      } catch {
        // Aggregate update must not fail the workout save.
      }

      // Achievements + growth timeline are not part of the upsert response.
      // Refresh in the background so save latency stays low.
      growthTimelineService.invalidateUser(userId);
      void Promise.allSettled([
        achievementService.refreshUser(userId),
        growthTimelineService.refreshUser(userId),
      ]);

      // Friend activity feed: publish once when a log first becomes fully completed.
      const prevAllDone =
        Boolean(previous) &&
        (previous!.setCompleted?.length ?? 0) >= previous!.setCount &&
        (previous!.setCompleted ?? []).slice(0, previous!.setCount).every(Boolean);
      const nextAllDone =
        (input.setCompleted?.length ?? 0) >= input.setCount &&
        (input.setCompleted ?? []).slice(0, input.setCount).every(Boolean);
      if (nextAllDone && !prevAllDone && input.setCount > 0) {
        void import('./friend.service.js')
          .then(async ({ friendService }) => {
            const privacy = await friendService.getPrivacy(userId);
            if (privacy.workoutRecordsVisibility === 'private') return;
            await friendService.publishActivity({
              actorId: userId,
              activityType: 'workout_completed',
              title: 'workout_completed',
              body: input.machineCode,
              payload: {
                logId: saved.id,
                logDate,
                machineCode: input.machineCode,
                setCount: input.setCount,
              },
              visibility: privacy.workoutRecordsVisibility,
            });
          })
          .catch(() => {
            /* feed must not fail workout save */
          });
      }

      trackUsageSafe(userId, 'exercise_record_save');
      return saved;
    } catch (error) {
      const pgCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (pgCode === '23505') {
        throw new AppError(
          409,
          'DUPLICATE_LOG',
          'A workout log already exists for this machine, date, and target muscle'
        );
      }
      throw error;
    }
  },

  async remove(userId: string, input: DeleteWorkoutLogInput) {
    await gymScopeService.resolveMemberForWrite(userId, input.gymId, input.memberId);

    const machineId = await machineRepository.findIdByCode(input.machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${input.machineCode}`);
    }

    const targetMuscleKey = normalizeWorkoutLogTargetMuscle(
      input.machineCode,
      input.targetMuscleGroup
    );

    if (isFreeWeightMachineCode(input.machineCode) && !targetMuscleKey) {
      throw new AppError(400, 'VALIDATION_ERROR', 'targetMuscleGroup is required for free-weight logs');
    }

    const previous = await workoutLogRepository.findByUserMachineDate(
      userId,
      input.gymId,
      machineId,
      input.logDate,
      targetMuscleKey,
      input.memberId
    );

    const deleted = await workoutLogRepository.deleteByUserMachineDate(
      userId,
      input.gymId,
      input.memberId,
      machineId,
      input.logDate,
      targetMuscleKey
    );

    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', 'Workout log not found');
    }

    trackUsageSafe(userId, 'exercise_record_delete');

    if (previous) {
      try {
        const loadById = await resolveWorkoutLoadContexts(userId, [previous], {
          gymId: input.gymId,
          memberId: input.memberId,
        });
        await liftedVolumeService.applyLogDelta({
          userId,
          gymId: input.gymId,
          logDate: input.logDate,
          previousWeights: previous.setWeightsKg,
          previousCompleted: previous.setCompleted,
          previousSets: previous.setCount,
          previousLoad: loadById.get(previous.id),
          nextWeights: [],
          nextCompleted: [],
          nextSets: 0,
          nextLoad: null,
        });
      } catch {
        /* ignore aggregate failure */
      }

      growthTimelineService.invalidateUser(userId);
      void Promise.allSettled([
        achievementService.refreshUser(userId),
        growthTimelineService.refreshUser(userId),
      ]);
    }
  },

  /**
   * Delete every workout log, history row, and workout card for a single calendar day.
   * Multi-day / all-time bulk delete is intentionally unsupported.
   */
  async removeByDate(
    userId: string,
    logDate: string,
    input: DeleteWorkoutLogsByDateBody
  ): Promise<{ deletedCount: number; logDate: string }> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid date; expected YYYY-MM-DD');
    }

    await gymScopeService.resolveMemberForWrite(userId, input.gymId, input.memberId);

    const deletedLogs = await workoutLogRepository.deleteByUserDate(
      userId,
      input.gymId,
      input.memberId,
      logDate
    );

    if (deletedLogs.length > 0) {
      try {
        const loadById = await resolveWorkoutLoadContexts(userId, deletedLogs, {
          gymId: input.gymId,
          memberId: input.memberId,
        });
        for (const previous of deletedLogs) {
          await liftedVolumeService.applyLogDelta({
            userId,
            gymId: input.gymId,
            logDate,
            previousWeights: previous.setWeightsKg,
            previousCompleted: previous.setCompleted,
            previousSets: previous.setCount,
            previousLoad: loadById.get(previous.id),
            nextWeights: [],
            nextCompleted: [],
            nextSets: 0,
            nextLoad: null,
          });
        }
      } catch {
        /* ignore aggregate failure — next snapshot recomputes from logs */
      }

      growthTimelineService.invalidateUser(userId);
      void Promise.allSettled([
        achievementService.refreshUser(userId),
        growthTimelineService.refreshUser(userId),
      ]);
    }

    return { deletedCount: deletedLogs.length, logDate };
  },
};
