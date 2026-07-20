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
  favorites: ['favorites'] as const,
  favoriteCheck: (machineCode: string) => ['favorites', 'check', machineCode] as const,
  history: ['history'] as const,
  historyList: (params?: { limit?: number; from?: string; to?: string }) =>
    ['history', 'list', params ?? {}] as const,
  historyForMachine: (machineCode: string) =>
    ['history', 'machine', machineCode] as const,
  workoutLogs: ['workout-logs'] as const,
  workoutLogsAll: ['workout-logs', 'all'] as const,
  workoutLogsList: (params?: { from?: string; to?: string; limit?: number }) =>
    ['workout-logs', 'list', params ?? {}] as const,
  workoutInsights: (
    viewMode: string,
    machineCode: string,
    targetMuscleGroup: string,
    period: string,
    customFrom?: string,
    customTo?: string
  ) =>
    [
      'workout-logs',
      'insights',
      viewMode,
      machineCode,
      targetMuscleGroup,
      period,
      customFrom ?? '',
      customTo ?? '',
    ] as const,
  workoutLogToday: (machineCode: string, logDate: string, targetMuscleGroup?: string) =>
    ['workout-logs', machineCode, logDate, targetMuscleGroup ?? ''] as const,
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
  adminOwnerApplications: ['admin', 'owner-applications'] as const,
  adminGymInventory: (gymId: string) => ['admin', 'gyms', gymId, 'inventory'] as const,
  user: ['user', 'me'] as const,
} as const;
