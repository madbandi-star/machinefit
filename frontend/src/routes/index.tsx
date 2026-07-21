import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
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
const settings = () =>
  import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }));
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
const adminMotivation = () =>
  import('@/pages/admin/motivation/AdminMotivationPage').then((m) => ({
    default: m.AdminMotivationPage,
  }));
const notifications = () =>
  import('@/pages/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  }));
const notFound = () =>
  import('@/pages/not-found/NotFoundPage').then((m) => ({ default: m.NotFoundPage }));
const qrRedirect = () =>
  import('@/pages/qr-redirect/QrRedirectPage').then((m) => ({ default: m.QrRedirectPage }));
const qrScan = () =>
  import('@/pages/qr-scan/QrScanPage').then((m) => ({ default: m.QrScanPage }));

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
        { path: ROUTES.POST_DETAIL, element: lazyRoute(postDetail) },
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
            { path: ROUTES.OWNER_APPLY, element: lazyRoute(ownerApply) },
            { path: ROUTES.GROWTH_ANALYSIS, element: lazyRoute(growth) },
            { path: ROUTES.SETTINGS, element: lazyRoute(settings) },
            { path: ROUTES.NOTIFICATIONS, element: lazyRoute(notifications) },
          ],
        },
        { path: ROUTES.NOT_FOUND, element: lazyRoute(notFound) },
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
        <AuthGuard minRole="owner">
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [{ path: ROUTES.OWNER, element: lazyRoute(ownerDash) }],
    },
    {
      element: (
        <AuthGuard minRole="admin">
          <AdminLayout />
        </AuthGuard>
      ),
      children: [
        { path: ROUTES.ADMIN, element: lazyRoute(adminDash) },
        { path: ROUTES.ADMIN_USERS, element: lazyRoute(adminUsers) },
        { path: ROUTES.ADMIN_GYMS, element: lazyRoute(adminGyms) },
        { path: ROUTES.ADMIN_OWNER_APPLICATIONS, element: lazyRoute(adminOwnerApps) },
        { path: ROUTES.ADMIN_MACHINES, element: lazyRoute(adminMachines) },
        { path: ROUTES.ADMIN_MOTIVATION, element: lazyRoute(adminMotivation) },
        { path: ROUTES.ADMIN_MODERATION, element: lazyRoute(adminModeration) },
      ],
    },
    { path: '*', element: <Navigate to={ROUTES.NOT_FOUND} replace /> },
  ],
  { basename: '/machinefit' }
);
