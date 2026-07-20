import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AuthGuard } from '@/routes/guards/AuthGuard';
import { GuestGuard } from '@/routes/guards/GuestGuard';
import { ROUTES } from '@/constants/routes';

import { HomePage } from '@/pages/home/HomePage';
import { MachineSearchPage } from '@/pages/machine-search/MachineSearchPage';
import { BrandListPage } from '@/pages/brand-list/BrandListPage';
import { BrandDetailPage } from '@/pages/brand-detail/BrandDetailPage';
import { MachineDetailPage } from '@/pages/machine-detail/MachineDetailPage';
import { RecommendationFormPage } from '@/pages/recommendation-result/RecommendationFormPage';
import { RecommendationResultPage } from '@/pages/recommendation-result/RecommendationResultPage';
import { GymFinderPage } from '@/pages/gym-finder/GymFinderPage';
import { GymDetailPage } from '@/pages/gym-detail/GymDetailPage';
import { RecordsPage } from '@/pages/records/RecordsPage';
import { CommunityPage } from '@/pages/community/CommunityPage';
import { PostDetailPage } from '@/pages/community/PostDetailPage';
import { MachineRequestBoardPage } from '@/pages/machine-request-board/MachineRequestBoardPage';
import { FreeBoardPage } from '@/pages/free-board/FreeBoardPage';
import { LoginPage } from '@/pages/auth/login/LoginPage';
import { RegisterPage } from '@/pages/auth/register/RegisterPage';
import { GrowthAnalysisPage } from '@/pages/growth-analysis/GrowthAnalysisPage';
import { MyPage } from '@/pages/my-page/MyPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { OwnerDashboardPage } from '@/pages/gym-owner/dashboard/OwnerDashboardPage';
import { OwnerApplyPage } from '@/pages/gym-owner/apply/OwnerApplyPage';
import { AdminDashboardPage } from '@/pages/admin/dashboard/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/users/AdminUsersPage';
import { AdminGymsPage } from '@/pages/admin/gyms/AdminGymsPage';
import { AdminOwnerApplicationsPage } from '@/pages/admin/owner-applications/AdminOwnerApplicationsPage';
import { AdminMachinesPage } from '@/pages/admin/machines/AdminMachinesPage';
import { AdminModerationPage } from '@/pages/admin/moderation/AdminModerationPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { NotFoundPage } from '@/pages/not-found/NotFoundPage';
import { QrRedirectPage } from '@/pages/qr-redirect/QrRedirectPage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';

const QrScanPage = lazy(() =>
  import('@/pages/qr-scan/QrScanPage').then((m) => ({ default: m.QrScanPage }))
);

function QrScanPageLazy() {
  return (
    <Suspense fallback={<Skeleton count={3} height={100} />}>
      <QrScanPage />
    </Suspense>
  );
}

export const router = createBrowserRouter(
  [
    {
      element: <MainLayout />,
      children: [
        { path: ROUTES.HOME, element: <HomePage /> },
        { path: ROUTES.MACHINES, element: <MachineSearchPage /> },
        { path: ROUTES.BRANDS, element: <BrandListPage /> },
        { path: ROUTES.BRAND_DETAIL, element: <BrandDetailPage /> },
        { path: ROUTES.MACHINE_DETAIL, element: <MachineDetailPage /> },
        { path: ROUTES.SCAN, element: <QrScanPageLazy /> },
        { path: ROUTES.QR, element: <QrRedirectPage /> },
        { path: ROUTES.GYMS, element: <GymFinderPage /> },
        { path: ROUTES.GYM_DETAIL, element: <GymDetailPage /> },
        { path: ROUTES.COMMUNITY, element: <CommunityPage /> },
        { path: ROUTES.MACHINE_REQUESTS, element: <MachineRequestBoardPage /> },
        { path: ROUTES.FREE_BOARD, element: <FreeBoardPage /> },
        { path: ROUTES.POST_DETAIL, element: <PostDetailPage /> },
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
            { path: ROUTES.RECORDS, element: <RecordsPage /> },
            { path: ROUTES.RECOMMEND, element: <RecommendationFormPage /> },
            { path: ROUTES.RECOMMEND_RESULT, element: <RecommendationResultPage /> },
            { path: ROUTES.MY_PAGE, element: <MyPage /> },
            { path: ROUTES.OWNER_APPLY, element: <OwnerApplyPage /> },
            { path: ROUTES.GROWTH_ANALYSIS, element: <GrowthAnalysisPage /> },
            { path: ROUTES.SETTINGS, element: <SettingsPage /> },
            { path: ROUTES.NOTIFICATIONS, element: <NotificationsPage /> },
          ],
        },
        { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
      ],
    },
    {
      element: (
        <GuestGuard>
          <AuthLayout />
        </GuestGuard>
      ),
      children: [
        { path: ROUTES.LOGIN, element: <LoginPage /> },
        { path: ROUTES.REGISTER, element: <RegisterPage /> },
      ],
    },
    {
      element: (
        <AuthGuard minRole="owner">
          <DashboardLayout />
        </AuthGuard>
      ),
      children: [
        { path: ROUTES.OWNER, element: <OwnerDashboardPage /> },
      ],
    },
    {
      element: (
        <AuthGuard minRole="admin">
          <AdminLayout />
        </AuthGuard>
      ),
      children: [
        { path: ROUTES.ADMIN, element: <AdminDashboardPage /> },
        { path: ROUTES.ADMIN_USERS, element: <AdminUsersPage /> },
        { path: ROUTES.ADMIN_GYMS, element: <AdminGymsPage /> },
        { path: ROUTES.ADMIN_OWNER_APPLICATIONS, element: <AdminOwnerApplicationsPage /> },
        { path: ROUTES.ADMIN_MACHINES, element: <AdminMachinesPage /> },
        { path: ROUTES.ADMIN_MODERATION, element: <AdminModerationPage /> },
      ],
    },
    { path: '*', element: <Navigate to={ROUTES.NOT_FOUND} replace /> },
  ],
  { basename: '/machinefit' }
);
