import {
  AD_TYPE_FEATURE_FLAG,
  Role,
  hasMinRole,
  type AdDecision,
  type AdDecisionQuery,
  type AdTrackEventBody,
  type AdType,
  type AdUserStatus,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';
import { adRepository } from '../repositories/ad.repository.js';
import { bannerRepository } from '../repositories/banner.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { billingService } from './billing.service.js';

function startOfSeoulDay(): Date {
  // Approximate Seoul day boundary via UTC+9 fixed offset (matches usage quotas style).
  const now = new Date();
  const seoulMs = now.getTime() + 9 * 60 * 60 * 1000;
  const seoul = new Date(seoulMs);
  seoul.setUTCHours(0, 0, 0, 0);
  return new Date(seoul.getTime() - 9 * 60 * 60 * 1000);
}

function startOfSessionWindow(): Date {
  // Rolling 12h as a practical "session" for server-side caps.
  return new Date(Date.now() - 12 * 60 * 60 * 1000);
}

async function classifyUser(
  userId: string | undefined,
  roleCode: string | undefined
): Promise<{ status: AdUserStatus; marketingOptIn: boolean }> {
  if (!userId) {
    return { status: 'ANONYMOUS', marketingOptIn: false };
  }
  if (hasMinRole(roleCode, Role.ADMIN)) {
    const user = await userRepository.findById(userId);
    return { status: 'ADMIN', marketingOptIn: Boolean(user?.marketingOptIn) };
  }
  const premium = await billingService.userHasPremiumEntitlement(userId, roleCode);
  const user = await userRepository.findById(userId);
  if (premium) {
    return { status: 'PAID_USER', marketingOptIn: Boolean(user?.marketingOptIn) };
  }
  return { status: 'FREE_USER', marketingOptIn: Boolean(user?.marketingOptIn) };
}

function audienceAllows(
  status: AdUserStatus,
  policy: {
    anonymousEnabled: boolean;
    freeUserEnabled: boolean;
    paidUserEnabled: boolean;
    adminEnabled: boolean;
  }
): boolean {
  if (status === 'ANONYMOUS') return policy.anonymousEnabled;
  if (status === 'ADMIN') return policy.adminEnabled;
  if (status === 'PAID_USER') return policy.paidUserEnabled;
  return policy.freeUserEnabled;
}

export const adPolicyService = {
  async decide(
    query: AdDecisionQuery,
    auth?: { userId?: string; roleCode?: string }
  ): Promise<AdDecision> {
    const pool = getPool();
    if (!pool || !(await adRepository.isReady())) {
      return deny(query.placement, 'ANONYMOUS', 'ADS_TABLES_MISSING');
    }

    try {
      if (!(await adRepository.getFlag('ADS_ENABLED'))) {
        return deny(query.placement, 'ANONYMOUS', 'ADS_DISABLED');
      }

      const { status, marketingOptIn } = await classifyUser(auth?.userId, auth?.roleCode);
      const placement = await adRepository.getPlacementByKey(query.placement);
      if (!placement) {
        return deny(query.placement, status, 'PLACEMENT_NOT_FOUND');
      }
      if (!placement.enabled) {
        return deny(query.placement, status, 'PLACEMENT_DISABLED', placement.adType);
      }

      const typeFlag = AD_TYPE_FEATURE_FLAG[placement.adType];
      if (typeFlag && !(await adRepository.getFlag(typeFlag))) {
        return deny(query.placement, status, 'TYPE_FLAG_OFF', placement.adType);
      }
      if (
        placement.adType === 'interstitial' &&
        query.event === 'PAGE_TRANSITION' &&
        !(await adRepository.getFlag('PAGE_TRANSITION_AD_ENABLED'))
      ) {
        return deny(query.placement, status, 'PAGE_TRANSITION_FLAG_OFF', placement.adType);
      }

      const policy = await adRepository.getPolicyForDecision(placement.id, query.event ?? null);
      if (!policy || !policy.enabled) {
        return deny(query.placement, status, 'POLICY_DISABLED', placement.adType);
      }

      const now = Date.now();
      if (policy.startAt && new Date(policy.startAt).getTime() > now) {
        return deny(query.placement, status, 'NOT_STARTED', placement.adType);
      }
      if (policy.endAt && new Date(policy.endAt).getTime() < now) {
        return deny(query.placement, status, 'ENDED', placement.adType);
      }

      if (!audienceAllows(status, policy)) {
        return deny(query.placement, status, 'AUDIENCE_BLOCKED', placement.adType);
      }

      if (policy.requireMarketingOptIn && !marketingOptIn) {
        return deny(query.placement, status, 'MARKETING_OPT_IN_REQUIRED', placement.adType);
      }

      if (
        policy.eventIntervalCount &&
        policy.eventIntervalCount > 0 &&
        typeof query.eventCount === 'number'
      ) {
        if (query.eventCount <= 0 || query.eventCount % policy.eventIntervalCount !== 0) {
          return deny(query.placement, status, 'EVENT_INTERVAL', placement.adType);
        }
      }

      const identity = {
        userId: auth?.userId ?? null,
        sessionId: query.sessionId ?? null,
      };

      if (policy.minIntervalSeconds > 0) {
        const last = await adRepository.lastImpressionAt({
          ...identity,
          placementKey: placement.placementKey,
        });
        if (last) {
          const elapsed = (Date.now() - new Date(last).getTime()) / 1000;
          if (elapsed < policy.minIntervalSeconds) {
            return deny(query.placement, status, 'MIN_INTERVAL', placement.adType);
          }
        }
      }

      if (policy.sessionLimit != null) {
        const sessionCount = await adRepository.countImpressionsSince({
          ...identity,
          placementKey: placement.placementKey,
          since: startOfSessionWindow(),
        });
        if (sessionCount >= policy.sessionLimit) {
          return deny(query.placement, status, 'SESSION_LIMIT', placement.adType);
        }
      }

      if (policy.dailyLimit != null) {
        const dailyCount = await adRepository.countImpressionsSince({
          ...identity,
          placementKey: placement.placementKey,
          since: startOfSeoulDay(),
        });
        if (dailyCount >= policy.dailyLimit) {
          return deny(query.placement, status, 'DAILY_LIMIT', placement.adType);
        }
      }

      // Creative resolution
      if (placement.adType === 'inline_cms') {
        const slotKey = placement.mapsToBannerSlotKey || placement.placementKey;
        const banners = await bannerRepository.listPublicForSlot(slotKey);
        if (!banners.length) {
          return deny(query.placement, status, 'NO_CMS_CREATIVE', placement.adType);
        }
        return {
          show: true,
          reason: 'OK',
          placementKey: placement.placementKey,
          adType: placement.adType,
          userStatus: status,
          creative: { kind: 'cms_banner', banners },
          provider: 'cms',
        };
      }

      return {
        show: true,
        reason: 'OK',
        placementKey: placement.placementKey,
        adType: placement.adType,
        userStatus: status,
        creative: {
          kind: 'mock',
          title: placement.name,
          body: placement.description || 'MachineFit ad placement (mock)',
          ctaLabel: placement.adType === 'rewarded' ? 'Watch' : 'Learn more',
        },
        provider: 'mock',
      };
    } catch (err) {
      // Never break the app if ads fail.
      return deny(query.placement, 'ANONYMOUS', 'DECISION_ERROR');
    }
  },

  async track(
    body: AdTrackEventBody,
    auth?: { userId?: string }
  ): Promise<{ ok: true }> {
    if (!(await adRepository.isReady())) return { ok: true };
    const placement = await adRepository.getPlacementByKey(body.placement);
    const adType = body.adType || placement?.adType || 'inline';
    if (body.type === 'impression') {
      await adRepository.recordImpression({
        userId: auth?.userId ?? null,
        sessionId: body.sessionId ?? null,
        placementKey: body.placement,
        adType,
        eventType: body.event ?? null,
        provider: body.provider,
      });
    } else if (body.type === 'click') {
      await adRepository.recordClick({
        userId: auth?.userId ?? null,
        sessionId: body.sessionId ?? null,
        placementKey: body.placement,
        adType,
        eventType: body.event ?? null,
        provider: body.provider,
      });
    } else if (body.type === 'reward_complete') {
      await adRepository.recordReward({
        userId: auth?.userId ?? null,
        sessionId: body.sessionId ?? null,
        placementKey: body.placement,
        status: 'complete',
        provider: body.provider,
      });
    } else {
      await adRepository.recordReward({
        userId: auth?.userId ?? null,
        sessionId: body.sessionId ?? null,
        placementKey: body.placement,
        status: 'fail',
        provider: body.provider,
      });
    }
    return { ok: true };
  },

  async claimReward(
    body: { placement: string; sessionId?: string; provider?: string },
    auth?: { userId?: string; roleCode?: string }
  ): Promise<{ granted: false; message: string }> {
    if (!(await adRepository.isReady())) {
      throw new AppError(503, 'ADS_UNAVAILABLE', 'Ad system not ready');
    }
    if (!(await adRepository.getFlag('ADS_ENABLED')) || !(await adRepository.getFlag('REWARDED_AD_ENABLED'))) {
      throw new AppError(403, 'REWARDED_DISABLED', 'Rewarded ads are disabled');
    }
    const decision = await this.decide(
      { placement: body.placement, event: 'FREE_LIMIT_REACHED', sessionId: body.sessionId },
      auth
    );
    if (!decision.show) {
      throw new AppError(403, 'REWARD_NOT_ELIGIBLE', decision.reason);
    }
    await adRepository.recordReward({
      userId: auth?.userId ?? null,
      sessionId: body.sessionId ?? null,
      placementKey: body.placement,
      status: 'claim_stub',
      provider: body.provider ?? 'mock',
    });
    // No quota grant yet — prevents abuse until mediation + signed claim exist.
    return {
      granted: false,
      message: 'Reward recorded (stub). Quota unlock is not enabled yet.',
    };
  },
};

function deny(
  placementKey: string,
  userStatus: AdUserStatus,
  reason: string,
  adType: AdType | null = null
): AdDecision {
  return {
    show: false,
    reason,
    placementKey,
    adType,
    userStatus,
    creative: null,
    provider: 'none',
  };
}
