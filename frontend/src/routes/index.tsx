import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Role, FREE_OPEN_MEMBER_FEATURES_MIN_ROLE } from '@machinefit/shared';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { EasyLayout } from '@/layouts/EasyLayout';
import { AuthGuard } from '@/routes/guards/AuthGuard';
import { GuestGuard } from '@/routes/guards/GuestGuard';
import { ConsentFlowGuard } from '@/routes/guards/ConsentFlowGuard';
import { ROUTES } from '@/constants/routes';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { HomePage } from '@/pages/home/HomePage';
import { RouterErrorElement } from '@/routes/RouterErrorElement';
import { OpsTelemetryBridge } from '@/components/ops/OpsTelemetryBridge';
import { SeoRouteSync } from '@/seo/SeoRouteSync';
import { isChunkLoadError, recoverFromChunkError } from '@/utils/chunkLoadRecovery';

function PageFallback() {
  return <Skeleton count={4} height={88} />;
}

function RootOutlet() {
  return (
    <>
      <OpsTelemetryBridge />
      <SeoRouteSync />
      <Outlet />
    </>
  );
}

function lazyRoute(loader: () => Promise<{ default: ComponentType }>) {
  const Comp = lazy(() =>
    loader().catch((error: unknown) => {
      if (isChunkLoadError(error)) {
        void recoverFromChunkError(error, 'lazyImport');
        // Suspend forever while recovery reloads — avoids flashing technical errors.
        return new Promise<{ default: ComponentType }>(() => undefined);
      }
      throw error;
    })
  );
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
const favoritesIndex = () =>
  import('@/pages/favorites/FavoritesIndexPage').then((m) => ({ default: m.FavoritesIndexPage }));
const favoritesEmpty = () =>
  import('@/pages/favorites/FavoritesEmptyPage').then((m) => ({ default: m.FavoritesEmptyPage }));
const community = () =>
  import('@/pages/community/CommunityPage').then((m) => ({ default: m.CommunityPage }));
const postDetail = () =>
  import('@/pages/community/PostDetailPage').then((m) => ({ default: m.PostDetailPage }));
const templateShareHub = () =>
  import('@/pages/template-share/TemplateShareHubPage').then((m) => ({
    default: m.TemplateShareHubPage,
  }));
const templateShareDetail = () =>
  import('@/pages/template-share/TemplateShareDetailPage').then((m) => ({
    default: m.TemplateShareDetailPage,
  }));
const myTemplates = () =>
  import('@/pages/template-share/MyTemplatesPage').then((m) => ({
    default: m.MyTemplatesPage,
  }));
const brandFavorites = () =>
  import('@/pages/brand-favorites/BrandFavoritesPage').then((m) => ({
    default: m.BrandFavoritesPage,
  }));
const adminTemplateShare = () =>
  import('@/pages/admin/template-share/AdminTemplateSharePage').then((m) => ({
    default: m.AdminTemplateSharePage,
  }));
const machineRequests = () =>
  import('@/pages/machine-request-board/MachineRequestBoardPage').then((m) => ({
    default: m.MachineRequestBoardPage,
  }));
const machineRequestsWrite = () =>
  import('@/pages/machine-request-board/MachineRequestWritePage').then((m) => ({
    default: m.MachineRequestWritePage,
  }));
const machineRequestsDetail = () =>
  import('@/pages/machine-request-board/MachineRequestDetailPage').then((m) => ({
    default: m.MachineRequestDetailPage,
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
const tradeHub = () =>
  import('@/pages/machine-trade/TradeHubPage').then((m) => ({ default: m.TradeHubPage }));
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
const authTerms = () =>
  import('@/pages/auth/terms/TermsAgreementPage').then((m) => ({
    default: m.TermsAgreementPage,
  }));
const authSignupComplete = () =>
  import('@/pages/auth/signup-complete/SignupCompletePage').then((m) => ({
    default: m.SignupCompletePage,
  }));
const growth = () =>
  import('@/pages/growth-analysis/GrowthAnalysisPage').then((m) => ({
    default: m.GrowthAnalysisPage,
  }));
const myPage = () => import('@/pages/my-page/MyPage').then((m) => ({ default: m.MyPage }));
const paymentHistory = () =>
  import('@/pages/billing/PaymentHistoryPage').then((m) => ({
    default: m.PaymentHistoryPage,
  }));
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
const lab = () => import('@/pages/lab/LabPage').then((m) => ({ default: m.LabPage }));
const settings = () =>
  import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }));
const fortuneToday = () =>
  import('@/pages/fortune/FortuneDetailPage').then((m) => ({
    default: m.FortuneDetailPage,
  }));
const linkedLogins = () =>
  import('@/pages/settings/LinkedLoginsPage').then((m) => ({
    default: m.LinkedLoginsPage,
  }));
const motivationMusic = () =>
  import('@/pages/motivation-music/MotivationMusicPage').then((m) => ({
    default: m.MotivationMusicPage,
  }));
const ownerDash = () =>
  import('@/pages/gym-owner/dashboard/OwnerDashboardPage').then((m) => ({
    default: m.OwnerDashboardPage,
  }));
const equipmentHub = () =>
  import('@/pages/gym-owner/equipment/EquipmentHubPage').then((m) => ({
    default: m.EquipmentHubPage,
  }));
const equipmentInventory = () =>
  import('@/pages/gym-owner/equipment/EquipmentInventoryPage').then((m) => ({
    default: m.EquipmentInventoryPage,
  }));
const equipmentInspections = () =>
  import('@/pages/gym-owner/equipment/EquipmentInspectionsPage').then((m) => ({
    default: m.EquipmentInspectionsPage,
  }));
const equipmentInspectionNew = () =>
  import('@/pages/gym-owner/equipment/EquipmentInspectionCreatePage').then((m) => ({
    default: m.EquipmentInspectionCreatePage,
  }));
const equipmentFaults = () =>
  import('@/pages/gym-owner/equipment/EquipmentFaultsPage').then((m) => ({
    default: m.EquipmentFaultsPage,
  }));
const equipmentStats = () =>
  import('@/pages/gym-owner/equipment/EquipmentStatsPage').then((m) => ({
    default: m.EquipmentStatsPage,
  }));
const equipmentPm = () =>
  import('@/pages/gym-owner/equipment/EquipmentPmPage').then((m) => ({
    default: m.EquipmentPmPage,
  }));
const equipmentRepairs = () =>
  import('@/pages/gym-owner/equipment/EquipmentRepairsPage').then((m) => ({
    default: m.EquipmentRepairsPage,
  }));
const equipmentParts = () =>
  import('@/pages/gym-owner/equipment/EquipmentPartsPage').then((m) => ({
    default: m.EquipmentPartsPage,
  }));
const equipmentSettings = () =>
  import('@/pages/gym-owner/equipment/EquipmentSettingsPage').then((m) => ({
    default: m.EquipmentSettingsPage,
  }));
const equipmentQrLanding = () =>
  import('@/pages/gym-owner/equipment/EquipmentQrLandingPage').then((m) => ({
    default: m.EquipmentQrLandingPage,
  }));
const memberMachineReport = () =>
  import('@/pages/gym-owner/equipment/MemberMachineReportPage').then((m) => ({
    default: m.MemberMachineReportPage,
  }));
const ownerApply = () =>
  import('@/pages/gym-owner/apply/OwnerApplyPage').then((m) => ({ default: m.OwnerApplyPage }));
const trainerApply = () =>
  import('@/pages/trainer/apply/TrainerApplyPage').then((m) => ({ default: m.TrainerApplyPage }));
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
const adminTrainerApps = () =>
  import('@/pages/admin/trainer-applications/AdminTrainerApplicationsPage').then((m) => ({
    default: m.AdminTrainerApplicationsPage,
  }));
const adminBrands = () =>
  import('@/pages/admin/brands/AdminBrandsPage').then((m) => ({
    default: m.AdminBrandsPage,
  }));
const adminMachines = () =>
  import('@/pages/admin/machines/AdminMachinesPage').then((m) => ({
    default: m.AdminMachinesPage,
  }));
const adminMachineRequests = () =>
  import('@/pages/admin/machine-requests/AdminMachineRequestsPage').then((m) => ({
    default: m.AdminMachineRequestsPage,
  }));
const adminMachineTips = () =>
  import('@/pages/admin/machine-tips/AdminMachineTipsPage').then((m) => ({
    default: m.AdminMachineTipsPage,
  }));
const adminModeration = () =>
  import('@/pages/admin/moderation/AdminModerationPage').then((m) => ({
    default: m.AdminModerationPage,
  }));
const adminPhotoBoard = () =>
  import('@/pages/admin/photo-board/AdminPhotoBoardPage').then((m) => ({
    default: m.AdminPhotoBoardPage,
  }));
const noticesPage = () =>
  import('@/pages/notices/NoticesPage').then((m) => ({ default: m.NoticesPage }));
const noticeDetailPage = () =>
  import('@/pages/notices/NoticeDetailPage').then((m) => ({ default: m.NoticeDetailPage }));
const adminNoticesPage = () =>
  import('@/pages/admin/notices/AdminNoticesPage').then((m) => ({
    default: m.AdminNoticesPage,
  }));
const adminQaPage = () =>
  import('@/pages/admin/qa/AdminQaPage').then((m) => ({ default: m.AdminQaPage }));
const adminQaEditPage = () =>
  import('@/pages/admin/qa/AdminQaEditPage').then((m) => ({ default: m.AdminQaEditPage }));
const adminFortunePage = () =>
  import('@/pages/admin/fortune/AdminFortunePage').then((m) => ({
    default: m.AdminFortunePage,
  }));
const adminNoticeEditPage = () =>
  import('@/pages/admin/notices/AdminNoticeEditPage').then((m) => ({
    default: m.AdminNoticeEditPage,
  }));
const adminBannersPage = () =>
  import('@/pages/admin/banners/AdminBannersPage').then((m) => ({
    default: m.AdminBannersPage,
  }));
const adminBannerEditPage = () =>
  import('@/pages/admin/banners/AdminBannerEditPage').then((m) => ({
    default: m.AdminBannerEditPage,
  }));
const adminBannerSlotsPage = () =>
  import('@/pages/admin/banners/AdminBannerSlotsPage').then((m) => ({
    default: m.AdminBannerSlotsPage,
  }));
const adminBannerStatsPage = () =>
  import('@/pages/admin/banners/AdminBannerStatsPage').then((m) => ({
    default: m.AdminBannerStatsPage,
  }));
const adminAdsPage = () =>
  import('@/pages/admin/ads/AdminAdsPage').then((m) => ({
    default: m.AdminAdsPage,
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
const adminStandardMachines = () =>
  import('@/pages/admin/standard-machines/AdminStandardMachinesPage').then((m) => ({
    default: m.AdminStandardMachinesPage,
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
const easyWizard = () =>
  import('@/pages/easy-mode/EasyWizardPage').then((m) => ({ default: m.EasyWizardPage }));
const termsPage = () =>
  import('@/pages/legal/TermsPage').then((m) => ({ default: m.TermsPage }));
const privacyPage = () =>
  import('@/pages/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage }));
const locationLegalPage = () =>
  import('@/pages/legal/LegalSectionPage').then((m) => ({ default: m.LocationLegalPage }));
const marketingLegalPage = () =>
  import('@/pages/legal/LegalSectionPage').then((m) => ({ default: m.MarketingLegalPage }));
const commerceLegalPage = () =>
  import('@/pages/legal/LegalSectionPage').then((m) => ({ default: m.CommerceLegalPage }));
const communityLegalPage = () =>
  import('@/pages/legal/LegalSectionPage').then((m) => ({ default: m.CommunityLegalPage }));
const copyrightLegalPage = () =>
  import('@/pages/legal/LegalSectionPage').then((m) => ({ default: m.CopyrightLegalPage }));
const securityLegalPage = () =>
  import('@/pages/legal/LegalSectionPage').then((m) => ({ default: m.SecurityLegalPage }));
const illegalUseLegalPage = () =>
  import('@/pages/legal/LegalSectionPage').then((m) => ({ default: m.IllegalUseLegalPage }));
const aiLegalPage = () =>
  import('@/pages/legal/LegalSectionPage').then((m) => ({ default: m.AiDisclaimerLegalPage }));
const privacyRightsPage = () =>
  import('@/pages/settings/PrivacyRightsPage').then((m) => ({ default: m.PrivacyRightsPage }));
const dataManagementPage = () =>
  import('@/pages/settings/DataManagementPage').then((m) => ({ default: m.DataManagementPage }));
const adminBackupPage = () =>
  import('@/pages/admin/backup/AdminBackupPage').then((m) => ({ default: m.AdminBackupPage }));
const supportPage = () =>
  import('@/pages/support/SupportPage').then((m) => ({ default: m.SupportPage }));
const supportDetailPage = () =>
  import('@/pages/support/SupportTicketDetailPage').then((m) => ({
    default: m.SupportTicketDetailPage,
  }));
const adminCompliancePage = () =>
  import('@/pages/admin/compliance/AdminCompliancePage').then((m) => ({
    default: m.AdminCompliancePage,
  }));
const adminPrivacyRightsPage = () =>
  import('@/pages/admin/compliance/AdminPrivacyRightsPage').then((m) => ({
    default: m.AdminPrivacyRightsPage,
  }));
const adminDataRetentionPage = () =>
  import('@/pages/admin/data-retention/AdminDataRetentionPage').then((m) => ({
    default: m.AdminDataRetentionPage,
  }));
const adminDataRetentionScheduledPage = () =>
  import('@/pages/admin/data-retention/AdminDataRetentionScheduledPage').then((m) => ({
    default: m.AdminDataRetentionScheduledPage,
  }));
const adminDataRetentionLogsPage = () =>
  import('@/pages/admin/data-retention/AdminDataRetentionLogsPage').then((m) => ({
    default: m.AdminDataRetentionLogsPage,
  }));
const adminDataRetentionAuditPage = () =>
  import('@/pages/admin/data-retention/AdminDataRetentionAuditPage').then((m) => ({
    default: m.AdminDataRetentionAuditPage,
  }));
const adminUsageStatsPage = () =>
  import('@/pages/admin/usage/AdminUsageStatsPage').then((m) => ({
    default: m.AdminUsageStatsPage,
  }));
const adminUsageUsersPage = () =>
  import('@/pages/admin/usage/AdminUsageUsersPage').then((m) => ({
    default: m.AdminUsageUsersPage,
  }));
const adminUsagePoliciesPage = () =>
  import('@/pages/admin/usage/AdminUsagePoliciesPage').then((m) => ({
    default: m.AdminUsagePoliciesPage,
  }));
const adminUsagePolicyHistoryPage = () =>
  import('@/pages/admin/usage/AdminUsagePolicyHistoryPage').then((m) => ({
    default: m.AdminUsagePolicyHistoryPage,
  }));
const adminAbusePage = () =>
  import('@/pages/admin/usage/AdminAbusePage').then((m) => ({
    default: m.AdminAbusePage,
  }));
const adminPointsPoliciesPage = () =>
  import('@/pages/admin/points/AdminPointsPoliciesPage').then((m) => ({
    default: m.AdminPointsPoliciesPage,
  }));
const adminPointsUsersPage = () =>
  import('@/pages/admin/points/AdminPointsUsersPage').then((m) => ({
    default: m.AdminPointsUsersPage,
  }));
const pointsPage = () =>
  import('@/pages/points/PointsPage').then((m) => ({
    default: m.PointsPage,
  }));
const qaPage = () =>
  import('@/pages/qa/QaPage').then((m) => ({ default: m.QaPage }));
const qaDetailPage = () =>
  import('@/pages/qa/QaDetailPage').then((m) => ({ default: m.QaDetailPage }));
const adminOpsPage = () =>
  import('@/pages/admin/ops/AdminOpsPage').then((m) => ({
    default: m.AdminOpsPage,
  }));
const adminSubscriptionsPage = () =>
  import('@/pages/admin/subscriptions/AdminSubscriptionsPage').then((m) => ({
    default: m.AdminSubscriptionsPage,
  }));

export const router = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter)(
  [
    {
      element: <RootOutlet />,
      errorElement: <RouterErrorElement />,
      children: [
        {
      element: <MainLayout />,
      errorElement: <RouterErrorElement />,
      children: [
        { path: ROUTES.HOME, element: <HomePage /> },
        { path: ROUTES.TERMS, element: lazyRoute(termsPage) },
        { path: ROUTES.PRIVACY, element: lazyRoute(privacyPage) },
        { path: ROUTES.REFUND, element: lazyRoute(commerceLegalPage) },
        { path: ROUTES.LEGAL_LOCATION, element: lazyRoute(locationLegalPage) },
        { path: ROUTES.LOCATION_POLICY, element: lazyRoute(locationLegalPage) },
        { path: ROUTES.LEGAL_MARKETING, element: lazyRoute(marketingLegalPage) },
        { path: ROUTES.LEGAL_COMMERCE, element: lazyRoute(commerceLegalPage) },
        { path: ROUTES.LEGAL_COMMUNITY, element: lazyRoute(communityLegalPage) },
        { path: ROUTES.COMMUNITY_POLICY, element: lazyRoute(communityLegalPage) },
        { path: ROUTES.LEGAL_COPYRIGHT, element: lazyRoute(copyrightLegalPage) },
        { path: ROUTES.COPYRIGHT_POLICY, element: lazyRoute(copyrightLegalPage) },
        { path: ROUTES.LEGAL_SECURITY, element: lazyRoute(securityLegalPage) },
        { path: ROUTES.LEGAL_ILLEGAL_USE, element: lazyRoute(illegalUseLegalPage) },
        { path: ROUTES.LEGAL_AI, element: lazyRoute(aiLegalPage) },
        { path: ROUTES.MACHINES, element: lazyRoute(machineSearch) },
        { path: ROUTES.BRANDS, element: lazyRoute(brandList) },
        { path: ROUTES.BRAND_DETAIL, element: lazyRoute(brandDetail) },
        { path: ROUTES.MACHINE_DETAIL, element: lazyRoute(machineDetail) },
        { path: ROUTES.SCAN, element: lazyRoute(qrScan) },
        { path: ROUTES.QR, element: lazyRoute(qrRedirect) },
        { path: ROUTES.EQUIPMENT_QR, element: lazyRoute(equipmentQrLanding) },
        { path: ROUTES.GYMS, element: lazyRoute(gymFinder) },
        { path: ROUTES.GYM_DETAIL, element: lazyRoute(gymDetail) },
        { path: ROUTES.COMMUNITY, element: lazyRoute(community) },
        { path: ROUTES.MACHINE_REQUESTS, element: lazyRoute(machineRequests) },
        { path: ROUTES.MACHINE_REQUESTS_WRITE, element: lazyRoute(machineRequestsWrite) },
        { path: ROUTES.MACHINE_REQUESTS_DETAIL, element: lazyRoute(machineRequestsDetail) },
        { path: ROUTES.FREE_BOARD, element: lazyRoute(freeBoard) },
        { path: ROUTES.TEMPLATE_SHARE, element: lazyRoute(templateShareHub) },
        { path: ROUTES.TEMPLATE_SHARE_DETAIL, element: lazyRoute(templateShareDetail) },
        { path: ROUTES.NOTICES, element: lazyRoute(noticesPage) },
        { path: ROUTES.NOTICE_DETAIL, element: lazyRoute(noticeDetailPage) },
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
          element: <AuthGuard minRole={FREE_OPEN_MEMBER_FEATURES_MIN_ROLE} />,
          children: [
            { path: ROUTES.PHOTO_BOARD, element: lazyRoute(photoBoard) },
            { path: ROUTES.PHOTO_BOARD_WRITE, element: lazyRoute(photoBoardWrite) },
            { path: ROUTES.PHOTO_BOARD_DETAIL, element: lazyRoute(photoBoardDetail) },
            { path: ROUTES.DATA_MANAGEMENT, element: lazyRoute(dataManagementPage) },
          ],
        },
        {
          element: <AuthGuard />,
          children: [
            { path: ROUTES.FAVORITES, element: lazyRoute(favoritesIndex) },
            { path: ROUTES.RECORDS, element: lazyRoute(records) },
            { path: ROUTES.FAVORITES_EMPTY, element: lazyRoute(favoritesEmpty) },
            { path: ROUTES.RECOMMEND, element: lazyRoute(recommendForm) },
            { path: ROUTES.RECOMMEND_RESULT, element: lazyRoute(recommendResult) },
            { path: ROUTES.MY_PAGE, element: lazyRoute(myPage) },
            { path: ROUTES.MY_TEMPLATES, element: lazyRoute(myTemplates) },
            { path: ROUTES.BRAND_FAVORITES, element: lazyRoute(brandFavorites) },
            { path: ROUTES.PAYMENT_HISTORY, element: lazyRoute(paymentHistory) },
            { path: ROUTES.MY_GYMS, element: lazyRoute(gymMemberManage) },
            { path: ROUTES.LIFTED_WEIGHT, element: lazyRoute(liftedWeight) },
            { path: ROUTES.LIFTED_WEIGHT_RANKINGS, element: lazyRoute(liftedWeightRankings) },
            { path: ROUTES.LIFTER_DNA, element: lazyRoute(lifterDna) },
            { path: ROUTES.LIVE_DASHBOARD, element: lazyRoute(liveDashboard) },
            { path: ROUTES.ACHIEVEMENTS, element: lazyRoute(achievements) },
            { path: ROUTES.POINTS, element: lazyRoute(pointsPage) },
            { path: ROUTES.QA, element: lazyRoute(qaPage) },
            { path: ROUTES.QA_DETAIL, element: lazyRoute(qaDetailPage) },
            { path: ROUTES.GROWTH_TIMELINE, element: lazyRoute(growthTimeline) },
            { path: ROUTES.LAB, element: lazyRoute(lab) },
            { path: ROUTES.OWNER_APPLY, element: lazyRoute(ownerApply) },
            { path: ROUTES.MEMBER_MACHINE_REPORT, element: lazyRoute(memberMachineReport) },
            { path: ROUTES.TRAINER_APPLY, element: lazyRoute(trainerApply) },
            { path: ROUTES.GROWTH_ANALYSIS, element: lazyRoute(growth) },
            { path: ROUTES.SETTINGS, element: lazyRoute(settings) },
            { path: ROUTES.FORTUNE_TODAY, element: lazyRoute(fortuneToday) },
            { path: ROUTES.LINKED_LOGINS, element: lazyRoute(linkedLogins) },
            { path: ROUTES.PRIVACY_RIGHTS, element: lazyRoute(privacyRightsPage) },
            { path: ROUTES.SUPPORT, element: lazyRoute(supportPage) },
            { path: ROUTES.SUPPORT_DETAIL, element: lazyRoute(supportDetailPage) },
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
            { path: ROUTES.TRADE_HUB, element: lazyRoute(tradeHub) },
            {
              path: ROUTES.TRADE_MANAGE_SELL,
              element: <Navigate to={`${ROUTES.TRADE_HUB}?tab=sell`} replace />,
            },
            {
              path: ROUTES.TRADE_MANAGE_BUY_REQUESTS,
              element: <Navigate to={`${ROUTES.TRADE_HUB}?tab=buy`} replace />,
            },
            {
              path: ROUTES.TRADE_MY,
              element: <Navigate to={`${ROUTES.TRADE_HUB}?tab=mine`} replace />,
            },
            {
              path: ROUTES.TRADE_LIKED,
              element: <Navigate to={`${ROUTES.TRADE_HUB}?tab=liked`} replace />,
            },
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
      errorElement: <RouterErrorElement />,
      children: [
        { path: ROUTES.EASY, element: lazyRoute(easyHome) },
        { path: ROUTES.EASY_ONBOARDING, element: <Navigate to={ROUTES.EASY} replace /> },
        { path: ROUTES.EASY_WIZARD, element: lazyRoute(easyWizard) },
      ],
    },
    {
      element: (
        <GuestGuard>
          <AuthLayout />
        </GuestGuard>
      ),
      errorElement: <RouterErrorElement />,
      children: [
        { path: ROUTES.LOGIN, element: lazyRoute(login) },
        { path: '/register', element: <Navigate to={ROUTES.LOGIN} replace /> },
      ],
    },
    {
      element: (
        <ConsentFlowGuard>
          <AuthLayout />
        </ConsentFlowGuard>
      ),
      errorElement: <RouterErrorElement />,
      children: [{ path: ROUTES.AUTH_TERMS, element: lazyRoute(authTerms) }],
    },
    {
      element: (
        <AuthGuard>
          <AuthLayout />
        </AuthGuard>
      ),
      errorElement: <RouterErrorElement />,
      children: [{ path: ROUTES.AUTH_SIGNUP_COMPLETE, element: lazyRoute(authSignupComplete) }],
    },
    {
      element: (
        <AuthGuard minRole={Role.OWNER}>
          <DashboardLayout />
        </AuthGuard>
      ),
      errorElement: <RouterErrorElement />,
      children: [
        { path: ROUTES.OWNER, element: lazyRoute(ownerDash) },
        { path: ROUTES.OWNER_EQUIPMENT, element: lazyRoute(equipmentHub) },
        { path: ROUTES.OWNER_EQUIPMENT_INVENTORY, element: lazyRoute(equipmentInventory) },
        { path: ROUTES.OWNER_EQUIPMENT_INSPECTIONS, element: lazyRoute(equipmentInspections) },
        {
          path: ROUTES.OWNER_EQUIPMENT_INSPECTION_NEW,
          element: lazyRoute(equipmentInspectionNew),
        },
        { path: ROUTES.OWNER_EQUIPMENT_PM, element: lazyRoute(equipmentPm) },
        { path: ROUTES.OWNER_EQUIPMENT_FAULTS, element: lazyRoute(equipmentFaults) },
        { path: ROUTES.OWNER_EQUIPMENT_REPAIRS, element: lazyRoute(equipmentRepairs) },
        { path: ROUTES.OWNER_EQUIPMENT_PARTS, element: lazyRoute(equipmentParts) },
        { path: ROUTES.OWNER_EQUIPMENT_STATS, element: lazyRoute(equipmentStats) },
        { path: ROUTES.OWNER_EQUIPMENT_SETTINGS, element: lazyRoute(equipmentSettings) },
      ],
    },
    {
      element: (
        <AuthGuard minRole={Role.ADMIN}>
          <AdminLayout />
        </AuthGuard>
      ),
      errorElement: <RouterErrorElement />,
      children: [
        { path: ROUTES.ADMIN, element: lazyRoute(adminDash) },
        { path: ROUTES.ADMIN_USERS, element: lazyRoute(adminUsers) },
        { path: ROUTES.ADMIN_GYMS, element: lazyRoute(adminGyms) },
        { path: ROUTES.ADMIN_OWNER_APPLICATIONS, element: lazyRoute(adminOwnerApps) },
        { path: ROUTES.ADMIN_TRAINER_APPLICATIONS, element: lazyRoute(adminTrainerApps) },
        { path: ROUTES.ADMIN_BRANDS, element: lazyRoute(adminBrands) },
        { path: ROUTES.ADMIN_STANDARD_MACHINES, element: lazyRoute(adminStandardMachines) },
        { path: ROUTES.ADMIN_MACHINES, element: lazyRoute(adminMachines) },
        { path: ROUTES.ADMIN_MACHINE_REQUESTS, element: lazyRoute(adminMachineRequests) },
        { path: ROUTES.ADMIN_MACHINE_TIPS, element: lazyRoute(adminMachineTips) },
        { path: ROUTES.ADMIN_LOCATIONS, element: lazyRoute(adminLocations) },
        { path: ROUTES.ADMIN_MOTIVATION, element: lazyRoute(adminMotivation) },
        { path: ROUTES.ADMIN_MUSCLE_IMAGES, element: lazyRoute(adminMuscleImages) },
        { path: ROUTES.ADMIN_MACHINE_COVERS, element: lazyRoute(adminMachineCovers) },
        { path: ROUTES.ADMIN_MODERATION, element: lazyRoute(adminModeration) },
        { path: ROUTES.ADMIN_PHOTO_BOARD, element: lazyRoute(adminPhotoBoard) },
        { path: ROUTES.ADMIN_TEMPLATE_SHARE, element: lazyRoute(adminTemplateShare) },
        { path: ROUTES.ADMIN_NOTICES, element: lazyRoute(adminNoticesPage) },
        { path: ROUTES.ADMIN_NOTICE_NEW, element: lazyRoute(adminNoticeEditPage) },
        { path: ROUTES.ADMIN_NOTICE_EDIT, element: lazyRoute(adminNoticeEditPage) },
        { path: ROUTES.ADMIN_QA, element: lazyRoute(adminQaPage) },
        { path: ROUTES.ADMIN_QA_NEW, element: lazyRoute(adminQaEditPage) },
        { path: ROUTES.ADMIN_QA_EDIT, element: lazyRoute(adminQaEditPage) },
        { path: ROUTES.ADMIN_BANNERS, element: lazyRoute(adminBannersPage) },
        { path: ROUTES.ADMIN_BANNER_NEW, element: lazyRoute(adminBannerEditPage) },
        { path: ROUTES.ADMIN_BANNER_SLOTS, element: lazyRoute(adminBannerSlotsPage) },
        { path: ROUTES.ADMIN_BANNER_STATS, element: lazyRoute(adminBannerStatsPage) },
        { path: ROUTES.ADMIN_BANNER_EDIT, element: lazyRoute(adminBannerEditPage) },
        { path: ROUTES.ADMIN_ADS, element: lazyRoute(adminAdsPage) },
        { path: ROUTES.ADMIN_FORTUNE, element: lazyRoute(adminFortunePage) },
        { path: ROUTES.ADMIN_TRADES, element: lazyRoute(adminTrades) },
        { path: ROUTES.ADMIN_ONLINE_PT, element: lazyRoute(adminOnlinePt) },
        { path: ROUTES.ADMIN_PUSH, element: lazyRoute(pushCompose) },
        { path: ROUTES.ADMIN_FRIENDS, element: lazyRoute(adminFriends) },
        { path: ROUTES.ADMIN_COMPLIANCE, element: lazyRoute(adminCompliancePage) },
        { path: ROUTES.ADMIN_PRIVACY_RIGHTS, element: lazyRoute(adminPrivacyRightsPage) },
        { path: ROUTES.ADMIN_DATA_RETENTION, element: lazyRoute(adminDataRetentionPage) },
        {
          path: ROUTES.ADMIN_DATA_RETENTION_SCHEDULED,
          element: lazyRoute(adminDataRetentionScheduledPage),
        },
        {
          path: ROUTES.ADMIN_DATA_RETENTION_LOGS,
          element: lazyRoute(adminDataRetentionLogsPage),
        },
        {
          path: ROUTES.ADMIN_DATA_RETENTION_AUDIT,
          element: lazyRoute(adminDataRetentionAuditPage),
        },
        { path: ROUTES.ADMIN_USAGE_STATS, element: lazyRoute(adminUsageStatsPage) },
        { path: ROUTES.ADMIN_USAGE_USERS, element: lazyRoute(adminUsageUsersPage) },
        { path: ROUTES.ADMIN_USAGE_POLICIES, element: lazyRoute(adminUsagePoliciesPage) },
        {
          path: ROUTES.ADMIN_USAGE_POLICY_HISTORY,
          element: lazyRoute(adminUsagePolicyHistoryPage),
        },
        { path: ROUTES.ADMIN_USAGE_ABUSE, element: lazyRoute(adminAbusePage) },
        {
          path: ROUTES.ADMIN_POINTS_POLICIES,
          element: lazyRoute(adminPointsPoliciesPage),
        },
        {
          path: ROUTES.ADMIN_POINTS_USERS,
          element: lazyRoute(adminPointsUsersPage),
        },
        { path: ROUTES.ADMIN_OPS, element: lazyRoute(adminOpsPage) },
        { path: ROUTES.ADMIN_BACKUP, element: lazyRoute(adminBackupPage) },
        { path: ROUTES.ADMIN_SUBSCRIPTIONS, element: lazyRoute(adminSubscriptionsPage) },
      ],
    },
    { path: '*', element: <Navigate to={ROUTES.NOT_FOUND} replace /> },
      ],
    },
  ],
  { basename: '/machinefit' }
);
