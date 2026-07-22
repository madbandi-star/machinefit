import {
  LIVE_COUNTRIES,
  LIVE_KR_DISTRICTS,
  LIVE_KR_METROS,
  liveGeoLabel,
  type LiveBreadcrumbItem,
  type LiveChildNode,
  type LiveDashboardLevel,
  type LiveDashboardSnapshot,
  type LiveFeedItem,
  type LiveHotCard,
  type LiveInsight,
  type LiveRankingBoard,
  type LiveRankingPeriod,
  type LiveRankingResponse,
  type LiveScopeQuery,
  type LiveSearchHit,
  type LiveStatCard,
} from '@machinefit/shared';
import {
  liveDashboardRepository,
  liveSnapshotCache,
  type LiveScopeFilter,
} from '../repositories/live-dashboard.repository.js';
import { locationRepository } from '../repositories/location.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { userGymRepository } from '../repositories/user-gym.repository.js';

function locName(name: { ko?: string; en?: string }, locale: string): string {
  return locale.startsWith('ko') ? name.ko || name.en || '' : name.en || name.ko || '';
}

function heatScore(volumeKg: number, activeNow: number): number {
  const raw = volumeKg / 500 + activeNow * 8;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function maskName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return '*';
  if (trimmed.length === 2) return `${trimmed[0]}*`;
  return `${trimmed[0]}*${trimmed.slice(-1)}`;
}

function muscleLabel(code: string | null, locale: string): string {
  if (!code) return locale.startsWith('ko') ? '—' : '—';
  const map: Record<string, { ko: string; en: string }> = {
    chest: { ko: '가슴', en: 'Chest' },
    back: { ko: '등', en: 'Back' },
    shoulders: { ko: '어깨', en: 'Shoulders' },
    arms: { ko: '팔', en: 'Arms' },
    legs: { ko: '하체', en: 'Legs' },
    core: { ko: '코어', en: 'Core' },
    full_body: { ko: '전신', en: 'Full body' },
    biceps: { ko: '이두', en: 'Biceps' },
    triceps: { ko: '삼두', en: 'Triceps' },
  };
  const hit = map[code];
  if (!hit) return code;
  return locale.startsWith('ko') ? hit.ko : hit.en;
}

function buildBreadcrumbs(
  level: LiveDashboardLevel,
  scope: LiveScopeQuery,
  locale: string,
  gymName?: string,
  userName?: string
): LiveBreadcrumbItem[] {
  const items: LiveBreadcrumbItem[] = [
    { level: 'world', code: 'world', label: liveGeoLabel('world', 'world', locale) },
  ];
  if (scope.countryCode) {
    items.push({
      level: 'country',
      code: scope.countryCode,
      label: liveGeoLabel('country', scope.countryCode, locale),
    });
  }
  if (scope.metroCode) {
    items.push({
      level: 'metro',
      code: scope.metroCode,
      label: liveGeoLabel('metro', scope.metroCode, locale),
    });
  }
  if (scope.districtCode) {
    items.push({
      level: 'district',
      code: scope.districtCode,
      label: liveGeoLabel('district', scope.districtCode, locale),
    });
  }
  if (scope.gymId && gymName) {
    items.push({ level: 'gym', code: scope.gymId, label: gymName });
  }
  if (scope.userId && userName && level === 'user') {
    items.push({ level: 'user', code: scope.userId, label: userName });
  }
  return items;
}

function buildStats(
  totals: Awaited<ReturnType<typeof liveDashboardRepository.getTodayTotals>>,
  locale: string,
  extras?: { avgMinutes?: number; topMachine?: string; topBrand?: string; topMuscle?: string }
): LiveStatCard[] {
  const ko = locale.startsWith('ko');
  const cards: LiveStatCard[] = [
    {
      id: 'activeNow',
      emoji: '👤',
      label: ko ? '현재 운동 중' : 'Working out now',
      value: totals.activeNow,
      unit: ko ? '명' : '',
    },
    {
      id: 'completed',
      emoji: '👥',
      label: ko ? '오늘 운동 완료' : 'Finished today',
      value: totals.completedUsers,
      unit: ko ? '명' : '',
    },
    {
      id: 'sets',
      emoji: '🏋️',
      label: ko ? '오늘 수행 세트' : 'Sets today',
      value: totals.totalSets,
      unit: ko ? '세트' : 'sets',
    },
    {
      id: 'volume',
      emoji: '💪',
      label: ko ? '오늘 총 볼륨' : 'Volume today',
      value: Math.round(totals.totalVolumeKg),
      unit: 'KG',
    },
    {
      id: 'machines',
      emoji: '🛠️',
      label: ko ? '오늘 사용된 머신' : 'Machines used',
      value: totals.machineCount,
      unit: ko ? '종' : '',
    },
    {
      id: 'gyms',
      emoji: '🏟️',
      label: ko ? '오늘 사용된 헬스장' : 'Gyms active',
      value: totals.gymCount,
      unit: ko ? '개' : '',
    },
  ];

  if (extras?.avgMinutes != null) {
    cards.push({
      id: 'avgMinutes',
      emoji: '⏱️',
      label: ko ? '평균 운동시간(추정)' : 'Avg session (est.)',
      value: extras.avgMinutes,
      unit: ko ? '분' : 'min',
    });
  }
  if (totals.countryCount > 0) {
    cards.push({
      id: 'countries',
      emoji: '🌍',
      label: ko ? '참여 국가' : 'Countries',
      value: totals.countryCount,
      unit: ko ? '개국' : '',
    });
  }
  // Estimated totals (schema has no per-set reps / duration)
  cards.push({
    id: 'repsEst',
    emoji: '🔁',
    label: ko ? '오늘 총 반복(추정)' : 'Reps today (est.)',
    value: totals.totalSets * 10,
    unit: ko ? '회' : 'reps',
  });
  const hours =
    totals.completedUsers > 0
      ? Math.round(((extras?.avgMinutes ?? 60) * totals.completedUsers) / 60)
      : 0;
  if (hours > 0) {
    cards.push({
      id: 'hoursEst',
      emoji: '⏳',
      label: ko ? '오늘 운동 시간(추정)' : 'Training hours (est.)',
      value: hours,
      unit: ko ? '시간' : 'hrs',
    });
  }
  return cards;
}

function buildInsights(
  totals: Awaited<ReturnType<typeof liveDashboardRepository.getTodayTotals>>,
  topMachine: string | null,
  topMuscle: string | null,
  hourly: { hour: number; activeUsers: number }[],
  locale: string
): LiveInsight[] {
  const ko = locale.startsWith('ko');
  const insights: LiveInsight[] = [];
  const peak = [...hourly].sort((a, b) => b.activeUsers - a.activeUsers)[0];
  if (peak && peak.activeUsers > 0) {
    insights.push({
      id: 'peak',
      text: ko
        ? `오늘 ${peak.hour}~${peak.hour + 1}시가 가장 붐비는 시간입니다.`
        : `Peak hour today is ${peak.hour}:00–${peak.hour + 1}:00.`,
    });
  }
  if (topMuscle) {
    insights.push({
      id: 'muscle',
      text: ko
        ? `오늘은 ${muscleLabel(topMuscle, locale)} 운동이 가장 활발합니다.`
        : `${muscleLabel(topMuscle, locale)} is the hottest muscle group today.`,
    });
  }
  if (topMachine) {
    insights.push({
      id: 'machine',
      text: ko
        ? `${topMachine} 사용량이 가장 많이 늘었습니다.`
        : `${topMachine} usage leads today.`,
    });
  }
  if (totals.activeNow > 0) {
    insights.push({
      id: 'live',
      text: ko
        ? `지금 ${totals.activeNow}명이 MachineFit에서 운동 중입니다.`
        : `${totals.activeNow} members are training on MachineFit right now.`,
    });
  } else {
    insights.push({
      id: 'quiet',
      text: ko
        ? '지금은 한산합니다. 곧 세트가 쌓일 거예요.'
        : 'It’s quiet right now — sets will start stacking soon.',
    });
  }
  if (totals.totalVolumeKg > 0) {
    insights.push({
      id: 'volume',
      text: ko
        ? `오늘 누적 볼륨 ${Math.round(totals.totalVolumeKg).toLocaleString('ko-KR')}KG입니다.`
        : `Today’s volume is ${Math.round(totals.totalVolumeKg).toLocaleString('en-US')} KG.`,
    });
  }
  return insights.slice(0, 5);
}

export const liveDashboardService = {
  async getSnapshot(options: {
    level: LiveDashboardLevel;
    scope: LiveScopeQuery;
    locale?: string;
    viewerUserId?: string;
  }): Promise<LiveDashboardSnapshot> {
    const locale = options.locale ?? 'ko';
    const cacheKey = JSON.stringify({ ...options, locale });
    const cached = liveSnapshotCache.get(cacheKey) as LiveDashboardSnapshot | undefined;
    if (cached) return cached;

    const filter: LiveScopeFilter = {
      countryCode: options.scope.countryCode,
      metroCode: options.scope.metroCode,
      districtCode: options.scope.districtCode,
      gymId: options.scope.gymId,
      userId: options.scope.userId,
    };

    const [totals, topMachines, topBrands, topMuscle, hourly, feedRows] = await Promise.all([
      liveDashboardRepository.getTodayTotals(filter),
      liveDashboardRepository.topMachines(filter, 5),
      liveDashboardRepository.topBrands(filter, 5),
      liveDashboardRepository.topMuscle(filter),
      liveDashboardRepository.hourly(filter),
      liveDashboardRepository.recentFeed(filter, 15),
    ]);

    let gymName: string | undefined;
    let userName: string | undefined;
    let flag: string | undefined;

    const [ownedGym, publicGymName, scopedUser, countries] = await Promise.all([
      options.scope.gymId && options.viewerUserId
        ? userGymRepository.findByIdForUser(options.viewerUserId, options.scope.gymId)
        : Promise.resolve(null),
      options.scope.gymId
        ? liveDashboardRepository.findGymName(options.scope.gymId)
        : Promise.resolve(null),
      options.scope.userId
        ? userRepository.findById(options.scope.userId)
        : Promise.resolve(null),
      options.scope.countryCode || options.level === 'world'
        ? locationRepository.listCountries()
        : Promise.resolve([] as Awaited<ReturnType<typeof locationRepository.listCountries>>),
    ]);

    gymName = ownedGym?.name ?? publicGymName ?? undefined;
    userName = scopedUser?.displayName;
    if (options.scope.countryCode) {
      flag =
        countries.find((c) => c.code === options.scope.countryCode)?.flagEmoji ??
        LIVE_COUNTRIES.find((c) => c.code === options.scope.countryCode)?.flag;
    }

    const level = options.level;
    let children: LiveChildNode[] = [];
    if (level === 'world') {
      const rows = await liveDashboardRepository.listChildren('country', {}, locale);
      const countryList = countries.length
        ? countries
        : LIVE_COUNTRIES.map((c) => ({
            code: c.code,
            name: c.name,
            flagEmoji: c.flag,
          }));
      children = countryList
        .map((c) => {
          const hit = rows.find((r) => r.code === c.code);
          return {
            level: 'country' as const,
            code: c.code,
            label: locName(c.name, locale),
            flag: c.flagEmoji,
            activeNow: hit?.activeNow ?? 0,
            volumeTodayKg: hit?.volumeTodayKg ?? 0,
            heat: heatScore(hit?.volumeTodayKg ?? 0, hit?.activeNow ?? 0),
          };
        })
        .sort((a, b) => b.volumeTodayKg - a.volumeTodayKg);
    } else if (level === 'country') {
      const rows = await liveDashboardRepository.listChildren('metro', filter, locale);
      const countryCode = options.scope.countryCode ?? 'KR';
      const states = await locationRepository.listStates(countryCode);
      const metros = states.length
        ? states.map((s) => ({ code: s.code, name: s.name }))
        : countryCode === 'KR'
          ? LIVE_KR_METROS.map((m) => ({ code: m.code, name: m.name }))
          : [];
      children = metros
        .map((m) => {
          const hit = rows.find((r) => r.code === m.code);
          return {
            level: 'metro' as const,
            code: m.code,
            label: locName(m.name, locale),
            activeNow: hit?.activeNow ?? 0,
            volumeTodayKg: hit?.volumeTodayKg ?? 0,
            heat: heatScore(hit?.volumeTodayKg ?? 0, hit?.activeNow ?? 0),
          };
        })
        .sort((a, b) => b.volumeTodayKg - a.volumeTodayKg);
    } else if (level === 'metro') {
      const rows = await liveDashboardRepository.listChildren('district', filter, locale);
      const countryCode = options.scope.countryCode ?? 'KR';
      const metroCode = options.scope.metroCode ?? '';
      const states = await locationRepository.listStates(countryCode);
      const state = states.find((s) => s.code === metroCode);
      let districts: { code: string; name: { ko?: string; en?: string } }[] = [];
      if (state) {
        const cities = await locationRepository.listCities(state.id);
        districts = cities.map((c) => ({ code: c.code, name: c.name }));
      } else {
        districts = (LIVE_KR_DISTRICTS[metroCode] ?? []).map((d) => ({
          code: d.code,
          name: d.name,
        }));
      }
      children = districts
        .map((d) => {
          const hit = rows.find((r) => r.code === d.code);
          return {
            level: 'district' as const,
            code: d.code,
            label: locName(d.name, locale),
            activeNow: hit?.activeNow ?? 0,
            volumeTodayKg: hit?.volumeTodayKg ?? 0,
            heat: heatScore(hit?.volumeTodayKg ?? 0, hit?.activeNow ?? 0),
          };
        })
        .sort((a, b) => b.volumeTodayKg - a.volumeTodayKg);
    } else if (level === 'district') {
      const rows = await liveDashboardRepository.listChildren('gym', filter, locale);
      children = rows.map((r) => ({
        level: 'gym' as const,
        code: r.code,
        label: r.label,
        activeNow: r.activeNow,
        volumeTodayKg: r.volumeTodayKg,
        heat: heatScore(r.volumeTodayKg, r.activeNow),
      }));
    } else if (level === 'gym') {
      const rows = await liveDashboardRepository.listChildren('user', filter, locale);
      children = rows.map((r) => ({
        level: 'user' as const,
        code: r.code,
        label: maskName(r.label),
        activeNow: r.activeNow,
        volumeTodayKg: r.volumeTodayKg,
        heat: heatScore(r.volumeTodayKg, r.activeNow),
      }));
    }

    const estMinutes =
      totals.completedUsers > 0
        ? Math.max(20, Math.round((totals.totalSets / totals.completedUsers) * 2.5))
        : 0;

    const hotCards: LiveHotCard[] = [
      {
        id: 'hot-machine',
        emoji: '🔥',
        title: locale.startsWith('ko') ? '가장 많이 쓰는 머신' : 'Hottest machine',
        value: topMachines[0]?.name ?? '—',
        subtitle: topMachines[0] ? `${topMachines[0].sets} sets` : undefined,
      },
      {
        id: 'hot-gym',
        emoji: '🏋️',
        title: locale.startsWith('ko') ? '가장 붐비는 헬스장' : 'Busiest gym',
        value:
          children.find((c) => c.level === 'gym')?.label ??
          (level === 'gym' ? gymName ?? '—' : children[0]?.label ?? '—'),
      },
      {
        id: 'hot-region',
        emoji: '📍',
        title: locale.startsWith('ko') ? '가장 활발한 지역' : 'Hottest region',
        value:
          level === 'world' || level === 'country'
            ? children[0]?.label ?? '—'
            : liveGeoLabel(
                level === 'metro' ? 'metro' : 'district',
                options.scope.metroCode || options.scope.districtCode || '',
                locale
              ),
      },
      {
        id: 'hot-muscle',
        emoji: '💪',
        title: locale.startsWith('ko') ? '인기 운동 부위' : 'Top muscle',
        value: muscleLabel(topMuscle, locale),
      },
      {
        id: 'hot-brand',
        emoji: '⭐',
        title: locale.startsWith('ko') ? '인기 브랜드' : 'Top brand',
        value: topBrands[0]?.name ?? '—',
      },
      {
        id: 'hot-active',
        emoji: '🏃',
        title: locale.startsWith('ko') ? '현재 운동중' : 'Live now',
        value: String(totals.activeNow),
      },
    ];

    const feed: LiveFeedItem[] = feedRows.map((row) => {
      const machineName =
        typeof row.machine_name === 'object'
          ? row.machine_name.ko || row.machine_name.en || '머신'
          : '머신';
      const vol = Math.round(parseFloat(row.volume) || 0);
      return {
        id: row.id,
        emoji: vol > 500 ? '🏆' : '🏋️',
        text: locale.startsWith('ko')
          ? `${maskName(row.display_name)}님이 ${row.gym_name}에서 ${machineName} · ${vol.toLocaleString('ko-KR')}KG`
          : `${maskName(row.display_name)} @ ${row.gym_name} · ${machineName} · ${vol.toLocaleString('en-US')}KG`,
        createdAt: row.updated_at,
      };
    });

    const title =
      level === 'world'
        ? 'MachineFit LIVE'
        : level === 'user'
          ? maskName(userName || '회원')
          : level === 'gym'
            ? gymName || 'Gym'
            : liveGeoLabel(
                level,
                options.scope.districtCode ||
                  options.scope.metroCode ||
                  options.scope.countryCode ||
                  'world',
                locale
              );

    const snapshot: LiveDashboardSnapshot = {
      level,
      scope: options.scope,
      breadcrumbs: buildBreadcrumbs(level, options.scope, locale, gymName, userName),
      title,
      flag,
      stats: buildStats(totals, locale, {
        avgMinutes: estMinutes || undefined,
        topMachine: topMachines[0]?.name,
        topBrand: topBrands[0]?.name,
        topMuscle: topMuscle ?? undefined,
      }),
      hotCards,
      children,
      feed,
      insights: buildInsights(
        totals,
        topMachines[0]?.name ?? null,
        topMuscle,
        hourly,
        locale
      ),
      hourly: Array.from({ length: 24 }, (_, hour) => {
        const hit = hourly.find((h) => h.hour === hour);
        return {
          hour,
          activeUsers: hit?.activeUsers ?? 0,
          sets: hit?.sets ?? 0,
          volumeKg: hit?.volumeKg ?? 0,
        };
      }),
      topMachines,
      topBrands,
      refreshedAt: new Date().toISOString(),
    };

    liveSnapshotCache.set(cacheKey, snapshot);
    return snapshot;
  },
  async getRankings(options: {
    board: LiveRankingBoard;
    period: LiveRankingPeriod;
    scope?: LiveScopeQuery;
    locale?: string;
    viewerUserId?: string;
  }): Promise<LiveRankingResponse> {
    const locale = options.locale ?? 'ko';
    const period = options.period;
    const filter: LiveScopeFilter = {
      countryCode: options.scope?.countryCode,
      metroCode: options.scope?.metroCode,
      districtCode: options.scope?.districtCode,
      gymId: options.scope?.gymId,
    };

    if (options.board === 'machine') {
      const items = await liveDashboardRepository.topMachines(filter, 50, period);
      return {
        board: options.board,
        period,
        items: items.map((item, i) => ({
          rank: i + 1,
          code: item.code,
          label: item.name,
          value: item.sets,
          unit: locale.startsWith('ko') ? '세트' : 'sets',
        })),
      };
    }
    if (options.board === 'brand') {
      const items = await liveDashboardRepository.topBrands(filter, 50, period);
      return {
        board: options.board,
        period,
        items: items.map((item, i) => ({
          rank: i + 1,
          code: item.code,
          label: item.name,
          value: item.sets,
          unit: locale.startsWith('ko') ? '세트' : 'sets',
        })),
      };
    }
    if (options.board === 'muscle') {
      const items = await liveDashboardRepository.topMuscles(filter, 50, period);
      return {
        board: options.board,
        period,
        items: items.map((item, i) => ({
          rank: i + 1,
          code: item.code,
          label: muscleLabel(item.code, locale),
          value: item.sets,
          unit: locale.startsWith('ko') ? '세트' : 'sets',
        })),
      };
    }

    const groupBy =
      options.board === 'country'
        ? 'country'
        : options.board === 'metro'
          ? 'metro'
          : options.board === 'district'
            ? 'district'
            : options.board === 'gym'
              ? 'gym'
              : 'user';

    const rows = await liveDashboardRepository.listChildren(groupBy, filter, locale, period);
    return {
      board: options.board,
      period,
      items: rows.map((row, i) => {
        let label = row.label;
        if (options.board === 'country') label = liveGeoLabel('country', row.code, locale, row.label);
        if (options.board === 'metro') label = liveGeoLabel('metro', row.code, locale, row.label);
        if (options.board === 'district') {
          label = liveGeoLabel('district', row.code, locale, row.label);
        }
        if (options.board === 'member') label = maskName(row.label);
        return {
          rank: i + 1,
          code: row.code,
          label,
          value: Math.round(row.volumeTodayKg),
          unit: 'KG',
          isMe: options.board === 'member' && row.code === options.viewerUserId,
        };
      }),
    };
  },

  async search(q: string, locale = 'ko'): Promise<LiveSearchHit[]> {
    if (!q.trim()) return [];
    const needle = q.trim().toLowerCase();
    const hits: LiveSearchHit[] = [];
    const worldCrumb = {
      level: 'world' as const,
      code: 'world',
      label: liveGeoLabel('world', 'world', locale),
    };

    const countries = await locationRepository.listCountries();
    const countryList = countries.length
      ? countries
      : LIVE_COUNTRIES.map((c) => ({
          code: c.code,
          name: c.name,
          flagEmoji: c.flag,
        }));

    for (const country of countryList) {
      const label = locName(country.name, locale);
      if (
        label.toLowerCase().includes(needle) ||
        country.code.toLowerCase().includes(needle)
      ) {
        hits.push({
          level: 'country',
          code: country.code,
          label: `${country.flagEmoji ? `${country.flagEmoji} ` : ''}${label}`,
          path: [worldCrumb, { level: 'country', code: country.code, label }],
        });
      }
    }

    // Search seeded states/cities for major countries (global hierarchy).
    for (const country of countryList.slice(0, 12)) {
      const states = await locationRepository.listStates(country.code);
      const countryLabel = locName(country.name, locale);
      for (const state of states) {
        const label = locName(state.name, locale);
        if (label.toLowerCase().includes(needle) || state.code.includes(needle)) {
          hits.push({
            level: 'metro',
            code: state.code,
            label,
            path: [
              worldCrumb,
              { level: 'country', code: country.code, label: countryLabel },
              { level: 'metro', code: state.code, label },
            ],
          });
        }
        if (hits.length > 40) break;
        const cities = await locationRepository.listCities(state.id);
        for (const city of cities) {
          const cityLabel = locName(city.name, locale);
          if (cityLabel.toLowerCase().includes(needle) || city.code.includes(needle)) {
            hits.push({
              level: 'district',
              code: city.code,
              label: cityLabel,
              path: [
                worldCrumb,
                { level: 'country', code: country.code, label: countryLabel },
                { level: 'metro', code: state.code, label },
                { level: 'district', code: city.code, label: cityLabel },
              ],
            });
          }
          if (hits.length > 40) break;
        }
        if (hits.length > 40) break;
      }
      if (hits.length > 40) break;
    }

    // Fallback static KR labels when DB hierarchy is empty.
    if (hits.length < 5) {
      for (const metro of LIVE_KR_METROS) {
        const label = locale.startsWith('ko') ? metro.name.ko : metro.name.en;
        if (label.toLowerCase().includes(needle) || metro.code.includes(needle)) {
          hits.push({
            level: 'metro',
            code: metro.code,
            label,
            path: [
              worldCrumb,
              { level: 'country', code: 'KR', label: liveGeoLabel('country', 'KR', locale) },
              { level: 'metro', code: metro.code, label },
            ],
          });
        }
      }
      for (const [metroCode, districts] of Object.entries(LIVE_KR_DISTRICTS)) {
        for (const district of districts) {
          const label = locale.startsWith('ko') ? district.name.ko : district.name.en;
          if (label.toLowerCase().includes(needle) || district.code.includes(needle)) {
            hits.push({
              level: 'district',
              code: district.code,
              label,
              path: [
                worldCrumb,
                { level: 'country', code: 'KR', label: liveGeoLabel('country', 'KR', locale) },
                {
                  level: 'metro',
                  code: metroCode,
                  label: liveGeoLabel('metro', metroCode, locale),
                },
                { level: 'district', code: district.code, label },
              ],
            });
          }
        }
      }
    }

    const raw = await liveDashboardRepository.search(q, locale);
    for (const gym of raw.gyms) {
      hits.push({
        level: 'gym',
        code: gym.id,
        label: gym.name,
        path: [
          { level: 'world', code: 'world', label: liveGeoLabel('world', 'world', locale) },
          {
            level: 'country',
            code: gym.country_code,
            label: liveGeoLabel('country', gym.country_code, locale),
          },
          {
            level: 'metro',
            code: gym.metro_code,
            label: liveGeoLabel('metro', gym.metro_code, locale),
          },
          {
            level: 'district',
            code: gym.district_code,
            label: liveGeoLabel('district', gym.district_code, locale),
          },
          { level: 'gym', code: gym.id, label: gym.name },
        ],
      });
    }
    for (const user of raw.users) {
      hits.push({
        level: 'user',
        code: user.id,
        label: maskName(user.display_name),
        path: [
          { level: 'world', code: 'world', label: liveGeoLabel('world', 'world', locale) },
          { level: 'user', code: user.id, label: maskName(user.display_name) },
        ],
      });
    }
    for (const machine of raw.machines) {
      const name = machine.name?.ko || machine.name?.en || machine.code;
      hits.push({
        level: 'world',
        code: `machine:${machine.code}`,
        label: name,
        path: [{ level: 'world', code: 'world', label: liveGeoLabel('world', 'world', locale) }],
      });
    }
    return hits.slice(0, 20);
  },
};
