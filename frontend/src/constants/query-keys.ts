export const QUERY_KEYS = {
  machines: ['machines'] as const,
  machine: (code: string) => ['machines', code] as const,
  brands: ['brands'] as const,
  brand: (code: string) => ['brands', code] as const,
  gyms: ['gyms'] as const,
  gym: (id: string) => ['gyms', id] as const,
  me: ['user', 'me'] as const,
  gymInventory: (id: string, params?: { brandCode?: string; q?: string }) =>
    ['gyms', id, 'inventory', params ?? {}] as const,
  recommendations: ['recommendations'] as const,
  favorites: (gymId: string, memberId = '') => ['favorites', gymId, memberId] as const,
  favoriteCheck: (gymId: string, machineCode: string, memberId = '') =>
    ['favorites', gymId, memberId, 'check', machineCode] as const,
  history: ['history'] as const,
  historyList: (
    gymId: string,
    memberId: string,
    params?: { limit?: number; from?: string; to?: string }
  ) => ['history', gymId, memberId, 'list', params ?? {}] as const,
  historyForMachine: (gymId: string, memberId: string, machineCode: string) =>
    ['history', gymId, memberId, 'machine', machineCode] as const,
  workoutLogs: ['workout-logs'] as const,
  workoutLogsAll: (gymId: string, memberId: string) =>
    ['workout-logs', gymId, memberId, 'all'] as const,
  workoutLogsList: (
    gymId: string,
    memberId: string,
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
  adminBrands: ['admin', 'catalog', 'brands'] as const,
  adminMachines: ['admin', 'catalog', 'machines'] as const,
  adminModeration: ['admin', 'moderation'] as const,
  adminMotivationMedia: ['admin', 'motivation-media'] as const,
  adminMuscleGroupImages: ['admin', 'muscle-group-images'] as const,
  muscleGroupImages: ['muscle-group-images'] as const,
  adminMachineCoverBrands: ['admin', 'machine-covers', 'brands'] as const,
  adminMachineCovers: (params: {
    q?: string;
    brandCode?: string;
    page?: number;
    pageSize?: number;
  }) => ['admin', 'machine-covers', params] as const,
  motivationMedia: ['motivation-media'] as const,
  userMotivationTracks: ['user', 'motivation-tracks'] as const,
  adminOwnerApplications: ['admin', 'owner-applications'] as const,
  adminTrainerApplications: ['admin', 'trainer-applications'] as const,
  adminGymInventory: (gymId: string) => ['admin', 'gyms', gymId, 'inventory'] as const,
  user: ['user', 'me'] as const,
  userGyms: ['user', 'gyms'] as const,
  homeBootstrap: (gymId?: string | null, memberId?: string | null) =>
    ['user', 'home-bootstrap', gymId ?? '', memberId ?? ''] as const,
  userGymMembers: (gymId: string) => ['user', 'gyms', gymId, 'members'] as const,
  memberProfileRequests: ['user', 'member-profile-requests'] as const,
  liftedWeight: ['user', 'lifted-weight'] as const,
  liftedWeightRankings: ['user', 'lifted-weight', 'rankings'] as const,
  lifterDna: (gymId?: string | null, memberId?: string | null) =>
    ['user', 'lifter-dna', gymId ?? 'all', memberId ?? 'all'] as const,
  achievements: (gymId?: string | null, memberId?: string | null) =>
    ['user', 'achievements', gymId ?? 'all', memberId ?? 'all'] as const,
  achievementRankings: ['user', 'achievements', 'rankings'] as const,
  growthTimeline: (gymId?: string | null, memberId?: string | null) =>
    ['user', 'growth-timeline', gymId ?? 'all', memberId ?? 'all'] as const,
  locationCountries: ['locations', 'countries'] as const,
  locationStates: (countryCode: string) => ['locations', 'states', countryCode] as const,
  locationCities: (stateId: string) => ['locations', 'cities', stateId] as const,
  locationDistricts: (cityId: string) => ['locations', 'districts', cityId] as const,
  userLocation: ['user', 'location'] as const,
  liveDashboard: ['live', 'dashboard'] as const,
  liveRankings: ['live', 'rankings'] as const,
  photoBoard: (params?: Record<string, unknown>) => ['photo-board', params ?? {}] as const,
  photoBoardPost: (postId: string) => ['photo-board', 'post', postId] as const,
  adminPhotoBoard: ['admin', 'photo-board'] as const,
  machineTrades: (params?: Record<string, unknown>) => ['machine-trades', params ?? {}] as const,
  machineTrade: (tradeId: string) => ['machine-trades', 'detail', tradeId] as const,
  machineTradeMyReports: ['machine-trades', 'my-reports'] as const,
  adminMachineTrades: (params?: Record<string, unknown>) =>
    ['admin', 'machine-trades', params ?? {}] as const,
  adminMachineTradeReports: ['admin', 'machine-trades', 'reports'] as const,
  adminMachineTradeStats: ['admin', 'machine-trades', 'stats'] as const,
  gymDirectory: ['gym-directory'] as const,
  onlinePtPolicy: ['online-pt', 'policy'] as const,
  onlinePtTrainers: (params?: Record<string, unknown>) =>
    ['online-pt', 'trainers', params ?? {}] as const,
  onlinePtTrainer: (id: string) => ['online-pt', 'trainer', id] as const,
  onlinePtMyTrainer: ['online-pt', 'me', 'trainer'] as const,
  onlinePtTickets: ['online-pt', 'me', 'tickets'] as const,
  onlinePtQuestions: (params?: Record<string, unknown>) =>
    ['online-pt', 'questions', params ?? {}] as const,
  onlinePtQuestion: (id: string) => ['online-pt', 'question', id] as const,
  onlinePtWallet: ['online-pt', 'me', 'wallet'] as const,
  onlinePtPayouts: ['online-pt', 'me', 'payouts'] as const,
  onlinePtAdminStats: ['online-pt', 'admin', 'stats'] as const,
  onlinePtAdminPayouts: ['online-pt', 'admin', 'payouts'] as const,
  pushCapabilities: ['push', 'capabilities'] as const,
  pushCampaigns: (params?: { all?: boolean }) =>
    ['push', 'campaigns', params ?? {}] as const,
  pushCampaignLogs: (campaignId: string) =>
    ['push', 'campaigns', campaignId, 'logs'] as const,
  friends: ['friends'] as const,
  friendsList: (params?: Record<string, unknown>) => ['friends', 'list', params ?? {}] as const,
  friendsSearch: (q: string, page: number) => ['friends', 'search', q, page] as const,
  friendsIncoming: (page: number) => ['friends', 'incoming', page] as const,
  friendsOutgoing: (page: number) => ['friends', 'outgoing', page] as const,
  friendsBlocked: (page: number) => ['friends', 'blocked', page] as const,
  friendsPrivacy: ['friends', 'privacy'] as const,
  friendsFeed: (page: number) => ['friends', 'feed', page] as const,
  friendsRankings: (metric: string, page: number) =>
    ['friends', 'rankings', metric, page] as const,
  friendsInvite: ['friends', 'invite'] as const,
  friendProfile: (userId: string) => ['friends', 'profile', userId] as const,
  friendsAdminStats: ['friends', 'admin', 'stats'] as const,
  friendsAdminList: (page: number) => ['friends', 'admin', 'list', page] as const,
  friendsAdminReports: ['friends', 'admin', 'reports'] as const,
  friendsAdminSpam: ['friends', 'admin', 'spam'] as const,
} as const;
