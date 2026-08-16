import {
  isPrivacyCorrectionFieldKey,
  isPrivacyDeletionCategory,
  type AdminPrivacyRightsFulfillInput,
  type PrivacyCorrectionFieldKey,
  type PrivacyDeletionCategory,
  type PrivacyRightsRequest,
  validateUsername,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { complianceRepository } from '../repositories/compliance.repository.js';
import { privacyRightsRepository } from '../repositories/privacy-rights.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

async function tableExists(table: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const { rows } = await pool.query<{ exists: boolean }>(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    [`public.${table}`]
  );
  return Boolean(rows[0]?.exists);
}

async function deleteForUser(table: string, userId: string, column = 'user_id'): Promise<number> {
  const pool = getPool();
  if (!pool || !(await tableExists(table))) return 0;
  try {
    const result = await pool.query(`DELETE FROM ${table} WHERE ${column} = $1`, [userId]);
    return result.rowCount ?? 0;
  } catch {
    return 0;
  }
}

async function clearProfileDisplay(userId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  const anon = `member_${userId.replace(/-/g, '').slice(0, 8)}`;
  const result = await pool.query(
    `UPDATE users
     SET avatar_url = NULL,
         display_name = $2,
         updated_at = NOW()
     WHERE id = $1 AND is_active = TRUE`,
    [userId, anon]
  );
  return result.rowCount ?? 0;
}

async function clearBodyMetrics(userId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  const result = await pool.query(
    `UPDATE users
     SET gender = NULL,
         height_cm = NULL,
         weight_kg = NULL,
         age = NULL,
         experience_level = NULL,
         workout_goal = NULL,
         updated_at = NOW()
     WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );
  return result.rowCount ?? 0;
}

async function clearBirthProfile(userId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  const result = await pool.query(
    `UPDATE users
     SET birth_date = NULL,
         birth_time = NULL,
         birth_time_unknown = FALSE,
         updated_at = NOW()
     WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );
  return result.rowCount ?? 0;
}

async function clearLocationRegion(userId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  let n = 0;
  n += await deleteForUser('user_locations', userId);
  const result = await pool.query(
    `UPDATE users
     SET home_gym_id = NULL,
         home_gym_name = NULL,
         location_opt_in = FALSE,
         updated_at = NOW()
     WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );
  n += result.rowCount ?? 0;
  return n;
}

async function clearWorkoutLogs(userId: string): Promise<number> {
  let n = 0;
  n += await deleteForUser('workout_logs', userId);
  n += await deleteForUser('recommendation_feedback', userId);
  n += await deleteForUser('machine_recommendations', userId);
  n += await deleteForUser('user_achievements', userId);
  n += await deleteForUser('user_lifted_badges', userId);
  return n;
}

async function clearTemplatesCards(userId: string): Promise<number> {
  let n = 0;
  n += await deleteForUser('workout_cards', userId);
  n += await deleteForUser('workout_card_templates', userId);
  return n;
}

async function clearFavoritesHistory(userId: string): Promise<number> {
  let n = 0;
  n += await deleteForUser('favorites', userId);
  n += await deleteForUser('recent_history', userId);
  n += await deleteForUser('user_machine_preferences', userId);
  return n;
}

async function clearCommunityUgc(userId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  let n = 0;
  if (await tableExists('comments')) {
    const r = await pool.query(`DELETE FROM comments WHERE user_id = $1`, [userId]);
    n += r.rowCount ?? 0;
  }
  if (await tableExists('likes')) {
    const r = await pool.query(`DELETE FROM likes WHERE user_id = $1`, [userId]);
    n += r.rowCount ?? 0;
  }
  n += await deleteForUser('posts', userId);
  if (await tableExists('photo_post_comments')) {
    const r = await pool.query(`DELETE FROM photo_post_comments WHERE user_id = $1`, [userId]);
    n += r.rowCount ?? 0;
  }
  n += await deleteForUser('photo_posts', userId);
  n += await deleteForUser('template_share_comments', userId);
  n += await deleteForUser('template_share_likes', userId);
  n += await deleteForUser('template_share_favorites', userId);
  n += await deleteForUser('template_share_downloads', userId);
  n += await deleteForUser('template_share_reports', userId);
  n += await deleteForUser('template_share_posts', userId, 'author_user_id');
  return n;
}

async function clearPushTokens(userId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  let n = 0;
  n += await deleteForUser('notifications', userId);
  const result = await pool.query(
    `UPDATE users
     SET push_service_opt_in = FALSE,
         updated_at = NOW()
     WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );
  n += result.rowCount ?? 0;
  return n;
}

async function clearOptionalConsents(userId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  let n = await deleteForUser('user_locations', userId);
  const result = await pool.query(
    `UPDATE users
     SET marketing_opt_in = FALSE,
         event_opt_in = FALSE,
         location_opt_in = FALSE,
         push_service_opt_in = FALSE,
         updated_at = NOW()
     WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );
  n += result.rowCount ?? 0;
  return n;
}

const CATEGORY_CLEARERS: Record<
  PrivacyDeletionCategory,
  (userId: string) => Promise<number>
> = {
  profile_display: clearProfileDisplay,
  body_metrics: clearBodyMetrics,
  birth_profile: clearBirthProfile,
  location_region: clearLocationRegion,
  workout_logs: clearWorkoutLogs,
  templates_cards: clearTemplatesCards,
  favorites_history: clearFavoritesHistory,
  community_ugc: clearCommunityUgc,
  push_tokens: clearPushTokens,
  optional_consents: clearOptionalConsents,
};

async function applyCorrectionField(
  userId: string,
  fieldKey: PrivacyCorrectionFieldKey,
  rawValue: string
): Promise<{ fieldKey: string; applied: boolean; note?: string }> {
  const value = rawValue.trim();
  if (fieldKey === 'other') {
    return {
      fieldKey,
      applied: false,
      note: 'Manual/other fields are not auto-applied; record result message for the member.',
    };
  }

  if (fieldKey === 'displayName') {
    const validated = validateUsername(value);
    if (!validated.ok) {
      throw new AppError(400, 'VALIDATION_ERROR', validated.message || 'Invalid display name');
    }
    const taken = await userRepository.isDisplayNameTaken(validated.normalized, userId);
    if (taken) {
      throw new AppError(409, 'USERNAME_TAKEN', 'Display name already taken');
    }
    await userRepository.updateProfile(userId, { displayName: validated.normalized });
    return { fieldKey, applied: true };
  }

  if (fieldKey === 'gender') {
    const g = value.toLowerCase();
    if (g !== 'male' && g !== 'female') {
      throw new AppError(400, 'VALIDATION_ERROR', 'gender must be male|female');
    }
    await userRepository.updateProfile(userId, {
      gender: g as 'male' | 'female',
    });
    return { fieldKey, applied: true };
  }

  if (fieldKey === 'heightCm' || fieldKey === 'weightKg' || fieldKey === 'age') {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      throw new AppError(400, 'VALIDATION_ERROR', `${fieldKey} must be a positive number`);
    }
    if (fieldKey === 'heightCm') await userRepository.updateProfile(userId, { heightCm: num });
    if (fieldKey === 'weightKg') await userRepository.updateProfile(userId, { weightKg: num });
    if (fieldKey === 'age') await userRepository.updateProfile(userId, { age: Math.round(num) });
    return { fieldKey, applied: true };
  }

  if (fieldKey === 'birthDate') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'birthDate must be YYYY-MM-DD');
    }
    await userRepository.updateProfile(userId, { birthDate: value });
    return { fieldKey, applied: true };
  }

  if (fieldKey === 'birthTime') {
    await userRepository.updateProfile(userId, {
      birthTime: value || null,
      birthTimeUnknown: !value,
    });
    return { fieldKey, applied: true };
  }

  if (fieldKey === 'experienceLevel') {
    const allowed = ['beginner', 'intermediate', 'advanced', 'professional'] as const;
    if (!(allowed as readonly string[]).includes(value)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid experienceLevel');
    }
    await userRepository.updateProfile(userId, {
      experienceLevel: value as (typeof allowed)[number],
    });
    return { fieldKey, applied: true };
  }

  if (fieldKey === 'workoutGoal') {
    await userRepository.updateProfile(userId, {
      workoutGoal: value as NonNullable<
        Parameters<typeof userRepository.updateProfile>[1]['workoutGoal']
      >,
    });
    return { fieldKey, applied: true };
  }

  if (fieldKey === 'homeGymName') {
    await userRepository.updateProfile(userId, {
      homeGymName: value || null,
      homeGymId: null,
    });
    return { fieldKey, applied: true };
  }

  return { fieldKey, applied: false, note: 'Unsupported field' };
}

function appendFulfillmentLog(
  existing: Record<string, unknown>,
  entry: Record<string, unknown>
): Record<string, unknown> {
  const prev = Array.isArray(existing.fulfillmentLog) ? existing.fulfillmentLog : [];
  return {
    ...existing,
    fulfillmentLog: [...prev, entry].slice(-50),
  };
}

export const privacyRightsFulfillmentService = {
  async fulfill(
    requestId: string,
    adminId: string,
    input: AdminPrivacyRightsFulfillInput
  ): Promise<{
    request: PrivacyRightsRequest;
    results: Array<Record<string, unknown>>;
  }> {
    const existing = await privacyRightsRepository.getById(requestId);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Rights request not found');
    if (existing.status === 'cancelled') {
      throw new AppError(400, 'INVALID_STATE', 'Cancelled request cannot be fulfilled');
    }

    const results: Array<Record<string, unknown>> = [];
    let payload = { ...existing.payload };

    if (input.mode === 'delete_categories') {
      if (existing.requestType !== 'deletion') {
        throw new AppError(400, 'INVALID_STATE', 'Category delete requires a deletion request');
      }
      const categories = (input.categories ?? []).filter(isPrivacyDeletionCategory);
      if (categories.length === 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'At least one deletable category is required');
      }

      const requested = Array.isArray(payload.categories)
        ? payload.categories.map(String).filter(isPrivacyDeletionCategory)
        : null;
      for (const category of categories) {
        if (requested && requested.length > 0 && !requested.includes(category)) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            `Category ${category} was not requested by the member`
          );
        }
        const rowsAffected = await CATEGORY_CLEARERS[category](existing.userId);
        results.push({ category, rowsAffected, ok: true });
      }

      const deletedSoFar = Array.isArray(payload.categoriesDeleted)
        ? payload.categoriesDeleted.map(String)
        : [];
      payload = appendFulfillmentLog(
        {
          ...payload,
          categoriesDeleted: Array.from(new Set([...deletedSoFar, ...categories])),
        },
        {
          at: new Date().toISOString(),
          by: adminId,
          mode: 'delete_categories',
          categories,
          results,
        }
      );
    } else {
      if (existing.requestType !== 'correction') {
        throw new AppError(400, 'INVALID_STATE', 'Correction apply requires a correction request');
      }
      const fieldRaw = String(input.fieldKey ?? payload.fieldKey ?? '');
      if (!isPrivacyCorrectionFieldKey(fieldRaw)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Unsupported or missing correction fieldKey');
      }
      const correctionValue = String(
        input.correctionValue ?? payload.requestedValue ?? ''
      ).trim();
      if (!correctionValue && fieldRaw !== 'other') {
        throw new AppError(400, 'VALIDATION_ERROR', 'correctionValue is required');
      }
      const applied = await applyCorrectionField(existing.userId, fieldRaw, correctionValue);
      results.push(applied);
      payload = appendFulfillmentLog(
        {
          ...payload,
          fieldKey: fieldRaw,
          requestedValue: correctionValue || payload.requestedValue,
          correctionApplied: applied.applied,
        },
        {
          at: new Date().toISOString(),
          by: adminId,
          mode: 'apply_correction',
          ...applied,
          value: correctionValue,
        }
      );
    }

    await privacyRightsRepository.mergePayload(requestId, payload);

    let request = (await privacyRightsRepository.getById(requestId))!;
    if (input.markCompleted || input.resultMessage) {
      request =
        (await privacyRightsRepository.updateAdmin(requestId, adminId, {
          status: input.markCompleted ? 'completed' : (existing.status as 'received' | 'reviewing' | 'completed' | 'rejected'),
          resultMessage: input.resultMessage,
        })) ?? request;
    } else if (existing.status === 'received') {
      request =
        (await privacyRightsRepository.updateAdmin(requestId, adminId, {
          status: 'reviewing',
        })) ?? request;
    }

    await complianceRepository.writeAuditLog({
      actorId: adminId,
      action: 'privacy.rights.admin.fulfill',
      targetType: 'privacy_rights_request',
      targetId: requestId,
      meta: {
        mode: input.mode,
        markCompleted: input.markCompleted,
        results,
      },
    });

    return { request, results };
  },
};
