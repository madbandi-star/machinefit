export const QUERY_KEYS = {
  machines: ['machines'] as const,
  machine: (code: string) => ['machines', code] as const,
  brands: ['brands'] as const,
  brand: (code: string) => ['brands', code] as const,
  gyms: ['gyms'] as const,
  gym: (id: string) => ['gyms', id] as const,
  gymInventory: (id: string, params?: { brandCode?: string; q?: string }) =>
    ['gyms', id, 'inventory', params ?? {}] as const,
  recommendations: ['recommendations'] as const,
  favorites: (gymId: string, memberId = '') => ['favorites', gymId, memberId] as const,
  favoriteCheck: (gymId: string, machineCode: string, memberId = '') =>
    ['favorites', gymId, memberId, 'check', machineCode] as const,
  history: ['history'] as const,
  historyList: (
    gymId: string,
    memberId = '',
    params?: { limit?: number; from?: string; to?: string }
  ) => ['history', gymId, memberId, 'list', params ?? {}] as const,
  historyForMachine: (gymId: string, memberId = '', machineCode: string) =>
    ['history', gymId, memberId, 'machine', machineCode] as const,
  workoutLogs: ['workout-logs'] as const,
  workoutLogsAll: (gymId: string, memberId = '') =>
    ['workout-logs', gymId, memberId, 'all'] as const,
  workoutLogsList: (
    gymId: string,
    memberId = '',
    params?: { from?: string; to?: string; limit?: number }
  ) => ['workout-logs', gymId, memberId, 'list', params ?? {}] as const,
  workoutInsights: (
    gymId: string,
    memberId: string,
    viewMode: string,
    machineCode: string,
    targetMuscleGroup: string,
    period: string,
    customFrom?: string,
    customTo?: string
  ) =>
    [
      'workout-logs',
      gymId,
      memberId,
      'insights',
      viewMode,
      machineCode,
      targetMuscleGroup,
      period,
      customFrom ?? '',
      customTo ?? '',
    ] as const,
  workoutLogToday: (
    gymId: string,
    memberId: string,
    machineCode: string,
    logDate: string,
    targetMuscleGroup?: string
  ) =>
    ['workout-logs', gymId, memberId, machineCode, logDate, targetMuscleGroup ?? ''] as const,
  posts: ['posts'] as const,
  machineRequests: ['machine-requests'] as const,
  ownerDashboard: ['owner', 'dashboard'] as const,
  ownerGyms: ['owner', 'gyms'] as const,
  notifications: ['notifications'] as const,
  notificationCount: ['notifications', 'unread'] as const,
  adminDashboard: ['admin', 'dashboard'] as const,
  adminUsers: ['admin', 'users'] as const,
  adminGyms: ['admin', 'gyms'] as const,
  adminMachines: ['admin', 'machines'] as const,
  adminModeration: ['admin', 'moderation'] as const,
  adminMotivationMedia: ['admin', 'motivation-media'] as const,
  motivationMedia: ['motivation-media'] as const,
  adminOwnerApplications: ['admin', 'owner-applications'] as const,
  adminGymInventory: (gymId: string) => ['admin', 'gyms', gymId, 'inventory'] as const,
  user: ['user', 'me'] as const,
  userGyms: ['user', 'gyms'] as const,
  userGymMembers: (gymId: string) => ['user', 'gyms', gymId, 'members'] as const,
  memberProfileRequests: ['user', 'member-profile-requests'] as const,
} as const;
