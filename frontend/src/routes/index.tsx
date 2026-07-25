import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Role } from '@machinefit/shared';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { EasyLayout } from '@/layouts/EasyLayout';
import { AuthGuard } from '@/routes/guards/AuthGuard';
import { GuestGuard } from '@/routes/guards/GuestGuard';
import { ROUTES } from '@/constants/routes';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { HomePage } from '@/pages/home/HomePage';

function PageFallback() {
  return <Skeleton count={4} height={88} />;
}

function lazyRoute(loader: () => Promise<{ default: ComponentType }>) {
  const Comp = lazy(loader);
  return (
    <Suspense fallback={<PageFallback />}>
      <Comp />
    </Suspense>
  );
}

const machineSearch = () =>
  import('@/pages/machine-search/MachineSearchPage').then((m) => ({ default: m.MachineSearchPage }));
const brandList = () =>
  import('@/pages/brand-list/BrandListPage').then((m) => ({ default: m.BrandListPage }));
const brandDetail = () =>
  import('@/pages/brand-detail/BrandDetailPage').then((m) => ({ default: m.BrandDetailPage }));
const machineDetail = () =>
  import('@/pages/machine-detail/MachineDetailPage').then((m) => ({ default: m.MachineDetailPage }));
const recommendForm = () =>
  import('@/pages/recommendation-result/RecommendationFormPage').then((m) => ({
    default: m.RecommendationFormPage,
  }));
const recommendResult = () =>
  import('@/pages/recommendation-result/RecommendationResultPage').then((m) => ({
    default: m.RecommendationResultPage,
  }));
const gymFinder = () =>
  import('@/pages/gym-finder/GymFinderPage').then((m) => ({ default: m.GymFinderPage }));
const gymDetail = () =>
  import('@/pages/gym-detail/GymDetailPage').then((m) => ({ default: m.GymDetailPage }));
const records = () =>
  import('@/pages/records/RecordsPage').then((m) => ({ default: m.RecordsPage }));
const community = () =>
  import('@/pages/community/CommunityPage').then((m) => ({ default: m.CommunityPage }));
const postDetail = () =>
  import('@/pages/community/PostDetailPage').then((m) => ({ default: m.PostDetailPage }));
const machineRequests = () =>
  import('@/pages/machine-request-board/MachineRequestBoardPage').then((m) => ({
    default: m.MachineRequestBoardPage,
  }));
const freeBoard = () =>
  import('@/pages/free-board/FreeBoardPage').then((m) => ({ default: m.FreeBoardPage }));
const photoBoard = () =>
  import('@/pages/photo-board/PhotoBoardPage').then((m) => ({ default: m.PhotoBoardPage }));
const photoBoardWrite = () =>
  import('@/pages/photo-board/PhotoPostWritePage').then((m) => ({
    default: m.PhotoPostWritePage,
  }));
const photoBoardDetail = () =>
  import('@/pages/photo-board/PhotoPostDetailPage').then((m) => ({
    default: m.PhotoPostDetailPage,
  }));
const tradeList = () =>
  import('@/pages/machine-trade/TradeListPage').then((m) => ({ default: m.TradeListPage }));
const tradeDetail = () =>
  import('@/pages/machine-trade/TradeDetailPage').then((m) => ({ default: m.TradeDetailPage }));
const tradeWrite = () =>
  import('@/pages/machine-trade/TradeWritePage').then((m) => ({ default: m.TradeWritePage }));
const tradeManage = () =>
  import('@/pages/machine-trade/TradeManagePage').then((m) => ({ default: m.TradeManagePage }));
const tradeMine = () =>
  import('@/pages/machine-trade/TradeMinePage').then((m) => ({ default: m.TradeMinePage }));
const tradeLiked = () =>
  import('@/pages/machine-trade/TradeLikedPage').then((m) => ({ default: m.TradeLikedPage }));
const tradeReports = () =>
  import('@/pages/machine-trade/TradeReportsPage').then((m) => ({ default: m.TradeReportsPage }));
const tradeStats = () =>
  import('@/pages/machine-trade/TradeStatsPage').then((m) => ({ default: m.TradeStatsPage }));
const adminTrades = () =>
  import('@/pages/admin/trades/AdminTradesPage').then((m) => ({ default: m.AdminTradesPage }));
const adminOnlinePt = () =>
  import('@/pages/admin/online-pt/AdminOnlinePtPage').then((m) => ({
    default: m.AdminOnlinePtPage,
  }));
const onlinePtTrainers = () =>
  import('@/pages/online-pt/OnlinePtTrainersPage').then((m) => ({
    default: m.OnlinePtTrainersPage,
  }));
const onlinePtTrainerDetail = () =>
  import('@/pages/online-pt/OnlinePtTrainerDetailPage').then((m) => ({
    default: m.OnlinePtTrainerDetailPage,
  }));
const onlinePtAsk = () =>
  import('@/pages/online-pt/OnlinePtAskPage').then((m) => ({ default: m.OnlinePtAskPage }));
const onlinePtQuestions = () =>
  import('@/pages/online-pt/OnlinePtQuestionsPage').then((m) => ({
    default: m.OnlinePtQuestionsPage,
  }));
const onlinePtQuestion = () =>
  import('@/pages/online-pt/OnlinePtQuestionPage').then((m) => ({
    default: m.OnlinePtQuestionPage,
  }));
const onlinePtManage = () =>
  import('@/pages/online-pt/OnlinePtManagePage').then((m) => ({
    default: m.OnlinePtManagePage,
  }));
const onlinePtWallet = () =>
  import('@/pages/online-pt/OnlinePtWalletPage').then((m) => ({
    default: m.OnlinePtWalletPage,
  }));
const friendsHub = () =>
  import('@/pages/friends/FriendsHubPage').then((m) => ({ default: m.FriendsHubPage }));
const friendProfile = () =>
  import('@/pages/friends/FriendProfilePage').then((m) => ({ default: m.FriendProfilePage }));
const adminFriends = () =>
  import('@/pages/admin/friends/AdminFriendsPage').then((m) => ({
    default: m.AdminFriendsPage,
  }));
const login = () =>
  import('@/pages/auth/login/LoginPage').then((m) => ({ default: m.LoginPage }));
const register = () =>
  import('@/pages/auth/register/RegisterPage').then((m) => ({ default: m.RegisterPage }));
const growth = () =>
  import('@/pages/growth-analysis/GrowthAnalysisPage').then((m) => ({
    default: m.GrowthAnalysisPage,
  }));
const myPage = () => import('@/pages/my-page/MyPage').then((m) => ({ default: m.MyPage }));
const gymMemberManage = () =>
  import('@/pages/gym-member-manage/GymMemberManagePage').then((m) => ({
    default: m.GymMemberManagePage,
  }));
const liftedWeight = () =>
  import('@/pages/lifted-weight/LiftedWeightPage').then((m) => ({ default: m.LiftedWeightPage }));
const liftedWeightRankings = () =>
  import('@/pages/lifted-weight/LiftedWeightRankingsPage').then((m) => ({
    default: m.LiftedWeightRankingsPage,
  }));
const lifterDna = () =>
  import('@/pages/lifter-dna/LifterDnaPage').then((m) => ({ default: m.LifterDnaPage }));
const liveDashboard = () =>
  import('@/pages/live-dashboard/LiveDashboardPage').then((m) => ({
    default: m.LiveDashboardPage,
  }));
const achievements = () =>
  import('@/pages/achievements/AchievementsPage').then((m) => ({
    default: m.AchievementsPage,
  }));
const growthTimeline = () =>
  import('@/pages/growth-timeline/GrowthTimelinePage').then((m) => ({
    default: m.GrowthTimelinePage,
  }));
const settings = () =>
  import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }));
const motivationMusic = () =>
  import('@/pages/motivation-music/MotivationMusicPage').then((m) => ({
    default: m.MotivationMusicPage,
  }));
const ownerDash = () =>
  import('@/pages/gym-owner/dashboard/OwnerDashboardPage').then((m) => ({
    default: m.OwnerDashboardPage,
  }));
const ownerApply = () =>
  import('@/pages/gym-owner/apply/OwnerApplyPage').then((m) => ({ default: m.OwnerApplyPage }));
const adminDash = () =>
  import('@/pages/admin/dashboard/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  }));
const adminUsers = () =>
  import('@/pages/admin/users/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage }));
const adminGyms = () =>
  import('@/pages/admin/gyms/AdminGymsPage').then((m) => ({ default: m.AdminGymsPage }));
const adminOwnerApps = () =>
  import('@/pages/admin/owner-applications/AdminOwnerApplicationsPage').then((m) => ({
    default: m.AdminOwnerApplicationsPage,
  }));
const adminMachines = () =>
  import('@/pages/admin/machines/AdminMachinesPage').then((m) => ({
    default: m.AdminMachinesPage,
  }));
const adminModeration = () =>
  import('@/pages/admin/moderation/AdminModerationPage').then((m) => ({
    default: m.AdminModerationPage,
  }));
const adminPhotoBoard = () =>
  import('@/pages/admin/photo-board/AdminPhotoBoardPage').then((m) => ({
    default: m.AdminPhotoBoardPage,
  }));
const adminMotivation = () =>
  import('@/pages/admin/motivation/AdminMotivationPage').then((m) => ({
    default: m.AdminMotivationPage,
  }));
const adminMuscleImages = () =>
  import('@/pages/admin/muscle-group-images/AdminMuscleGroupImagesPage').then((m) => ({
    default: m.AdminMuscleGroupImagesPage,
  }));
const adminMachineCovers = () =>
  import('@/pages/admin/machine-covers/AdminMachineCoversPage').then((m) => ({
    default: m.AdminMachineCoversPage,
  }));
const adminLocations = () =>
  import('@/pages/admin/locations/AdminLocationsPage').then((m) => ({
    default: m.AdminLocationsPage,
  }));
const notifications = () =>
  import('@/pages/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  }));
const pushCompose = () =>
  import('@/pages/push/PushComposePage').then((m) => ({
    default: m.PushComposePage,
  }));
const notFound = () =>
  import('@/pages/not-found/NotFoundPage').then((m) => ({ default: m.NotFoundPage }));
const qrRedirect = () =>
  import('@/pages/qr-redirect/QrRedirectPage').then((m) => ({ default: m.QrRedirectPage }));
const qrScan = () =>
  import('@/pages/qr-scan/QrScanPage').then((m) => ({ default: m.QrScanPage }));
const easyHome = () =>
  import('@/pages/easy-mode/EasyHomePage').then((m) => ({ default: m.EasyHomePage }));
const easyOnboarding = () =>
  import('@/pages/easy-mode/EasyOnboardingPage').then((m) => ({
    default: m.EasyOnboardingPage,
  }));
const easyWizard = () =>
  import('@/pages/easy-mode/EasyWizardPage').then((m) => ({ default: m.EasyWizardPage }));

export const router = createBrowserRouter(
  [
    {
      element: <MainLayout />,
      children: [
        { path: ROUTES.HOME, element: <HomePage /> },
        { path: ROUTES.MACHINES, element: lazyRoute(machineSearch) },
        { path: ROUTES.BRANDS, element: lazyRoute(brandList) },
        { path: ROUTES.BRAND_DETAIL, element: lazyRoute(brandDetail) },
        { path: ROUTES.MACHINE_DETAIL, element: lazyRoute(machineDetail) },
        { path: ROUTES.SCAN, element: lazyRoute(qrScan) },
        { path: ROUTES.QR, element: lazyRoute(qrRedirect) },
        { path: ROUTES.GYMS, element: lazyRoute(gymFinder) },
        { path: ROUTES.GYM_DETAIL, element: lazyRoute(gymDetail) },
        { path: ROUTES.COMMUNITY, element: lazyRoute(community) },
        { path: ROUTES.MACHINE_REQUESTS, element: lazyRoute(machineRequests) },
        { path: ROUTES.FREE_BOARD, element: lazyRoute(freeBoard) },
        { path: ROUTES.PHOTO_BOARD, element: lazyRoute(photoBoard) },
        { path: ROUTES.PHOTO_BOARD_WRITE, element: lazyRoute(photoBoardWrite) },
        { path: ROUTES.PHOTO_BOARD_DETAIL, element: lazyRoute(photoBoardDetail) },
        { path: ROUTES.POST_DETAIL, element: lazyRoute(postDetail) },
        { path: ROUTES.TRADE_LIST_SELL, element: lazyRoute(tradeList) },
        { path: ROUTES.TRADE_LIST_BUY, element: lazyRoute(tradeList) },
        { path: ROUTES.TRADE_DETAIL, element: lazyRoute(tradeDetail) },
        { path: ROUTES.ONLINE_PT, element: lazyRoute(onlinePtTrainers) },
        { path: ROUTES.ONLINE_PT_TRAINER, element: lazyRoute(onlinePtTrainerDetail) },
        {
          path: ROUTES.HISTORY,
          element: <Navigate to={`${ROUTES.RECORDS}?tab=history`} replace />,
        },
        {
          path: ROUTES.FAVORITES,
          element: <Navigate to={`${ROUTES.RECORDS}?tab=favorites`} replace />,
        },
        {
          element: <AuthGuard />,
          children: [
            { path: ROUTES.RECORDS, element: lazyRoute(records) },
            { path: ROUTES.RECOMMEND, element: lazyRoute(recommendForm) },
            { path: ROUTES.RECOMMEND_RESULT, element: lazyRoute(recommendResult) },
            { path: ROUTES.MY_PAGE, element: lazyRoute(myPage) },
            { path: ROUTES.MY_GYMS, element: lazyRoute(gymMemberManage) },
            { path: ROUTES.LIFTED_WEIGHT, element: lazyRoute(liftedWeight) },
            { path: ROUTES.LIFTED_WEIGHT_RANKINGS, element: lazyRoute(liftedWeightRankings) },
            { path: ROUTES.LIFTER_DNA, element: lazyRoute(lifterDna) },
            { path: ROUTES.LIVE_DASHBOARD, element: lazyRoute(liveDashboard) },
            { path: ROUTES.ACHIEVEMENTS, element: lazyRoute(achievements) },
            { path: ROUTES.GROWTH_TIMELINE, element: lazyRoute(growthTimeline) },
            { path: ROUTES.OWNER_APPLY, element: lazyRoute(ownerApply) },
            { path: ROUTES.GROWTH_ANALYSIS, element: lazyRoute(growth) },
            { path: ROUTES.SETTINGS, element: lazyRoute(settings) },
            { path: ROUTES.MOTIVATION_MUSIC, element: lazyRoute(motivationMusic) },
            { path: ROUTES.NOTIFICATIONS, element: lazyRoute(notifications) },
            { path: ROUTES.ONLINE_PT_ASK, element: lazyRoute(onlinePtAsk) },
            { path: ROUTES.ONLINE_PT_QUESTIONS, element: lazyRoute(onlinePtQuestions) },
            { path: ROUTES.ONLINE_PT_QUESTION, element: lazyRoute(onlinePtQuestion) },
            { path: ROUTES.PUSH, element: lazyRoute(pushCompose) },
            { path: ROUTES.FRIENDS, element: lazyRoute(friendsHub) },
            { path: ROUTES.FRIENDS_ADD, element: lazyRoute(friendsHub) },
            { path: ROUTES.FRIENDS_INCOMING, element: lazyRoute(friendsHub) },
            { path: ROUTES.FRIENDS_OUTGOING, element: lazyRoute(friendsHub) },
            { path: ROUTES.FRIENDS_BLOCKED, element: lazyRoute(friendsHub) },
            { path: ROUTES.FRIENDS_PRIVACY, element: lazyRoute(friendsHub) },
            { path: ROUTES.FRIENDS_FEED, element: lazyRoute(friendsHub) },
            { path: ROUTES.FRIENDS_RANKINGS, element: lazyRoute(friendsHub) },
            { path: ROUTES.FRIENDS_INVITE, element: lazyRoute(friendsHub) },
            { path: ROUTES.FRIEND_PROFILE, element: lazyRoute(friendProfile) },
          ],
        },
        {
          element: <AuthGuard minRole={Role.TRAINER} />,
          children: [
            { path: ROUTES.ONLINE_PT_MANAGE, element: lazyRoute(onlinePtManage) },
            { path: ROUTES.ONLINE_PT_WALLET, element: lazyRoute(onlinePtWallet) },
          ],
        },
        {
          element: <AuthGuard minRole={Role.OWNER} />,
          children: [
            { path: ROUTES.TRADE_SELL_WRITE, element: lazyRoute(tradeWrite) },
            { path: ROUTES.TRADE_BUY_WRITE, element: lazyRoute(tradeWrite) },
            { path: ROUTES.TRADE_MANAGE_SELL, element: lazyRoute(tradeManage) },
            { path: ROUTES.TRADE_MANAGE_BUY_REQUESTS, element: lazyRoute(tradeManage) },
            { path: ROUTES.TRADE_MY, element: lazyRoute(tradeMine) },
            { path: ROUTES.TRADE_LIKED, element: lazyRoute(tradeLiked) },
            { path: ROUTES.TRADE_REPORTS, element: lazyRoute(tradeReports) },
            { path: ROUTES.TRADE_STATS, element: lazyRoute(tradeStats) },
          ],
        },
        { path: ROUTES.NOT_FOUND, element: lazyRoute(notFound) },
      ],
    },
    {
      element: (
        <AuthGuard>
          <EasyLayout />
        </AuthGuard>
      ),
      children: [
        { path: ROUTES.EASY, element: lazyRoute(easyHome) },
        { path: ROUTES.EASY_ONBOARDING, element: lazyRoute(easyOnboarding) },
        { path: ROUTES.EASY_WIZARD, element: lazyRoute(easyWizard) },
      ],
    },
    {
      element: (
        <GuestGuard>
          <AuthLayout />
        </GuestGuard>
      ),
      children: [
        { path: ROUTES.LOGIN, element: lazyRoute(login) },
        { path: ROUTES.REGISTER, element: lazyRoute(register) },
      ],
    },
    {
      element: (
        <AuthGuard minRole={Role.OWNER}>
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [{ path: ROUTES.OWNER, element: lazyRoute(ownerDash) }],
    },
    {
      element: (
        <AuthGuard minRole={Role.ADMIN}>
          <AdminLayout />
        </AuthGuard>
      ),
      children: [
        { path: ROUTES.ADMIN, element: lazyRoute(adminDash) },
        { path: ROUTES.ADMIN_USERS, element: lazyRoute(adminUsers) },
        { path: ROUTES.ADMIN_GYMS, element: lazyRoute(adminGyms) },
        { path: ROUTES.ADMIN_OWNER_APPLICATIONS, element: lazyRoute(adminOwnerApps) },
        { path: ROUTES.ADMIN_MACHINES, element: lazyRoute(adminMachines) },
        { path: ROUTES.ADMIN_LOCATIONS, element: lazyRoute(adminLocations) },
        { path: ROUTES.ADMIN_MOTIVATION, element: lazyRoute(adminMotivation) },
        { path: ROUTES.ADMIN_MUSCLE_IMAGES, element: lazyRoute(adminMuscleImages) },
        { path: ROUTES.ADMIN_MACHINE_COVERS, element: lazyRoute(adminMachineCovers) },
        { path: ROUTES.ADMIN_MODERATION, element: lazyRoute(adminModeration) },
        { path: ROUTES.ADMIN_PHOTO_BOARD, element: lazyRoute(adminPhotoBoard) },
        { path: ROUTES.ADMIN_TRADES, element: lazyRoute(adminTrades) },
        { path: ROUTES.ADMIN_ONLINE_PT, element: lazyRoute(adminOnlinePt) },
        { path: ROUTES.ADMIN_PUSH, element: lazyRoute(pushCompose) },
        { path: ROUTES.ADMIN_FRIENDS, element: lazyRoute(adminFriends) },
      ],
    },
    { path: '*', element: <Navigate to={ROUTES.NOT_FOUND} replace /> },
  ],
  { basename: '/machinefit' }
);
