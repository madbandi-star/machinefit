import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AuthGuard } from '@/routes/guards/AuthGuard';
import { ROUTES } from '@/constants/routes';

import { HomePage } from '@/pages/home/HomePage';
import { MachineSearchPage } from '@/pages/machine-search/MachineSearchPage';
import { BrandListPage } from '@/pages/brand-list/BrandListPage';
import { MachineDetailPage } from '@/pages/machine-detail/MachineDetailPage';
import { RecommendationFormPage } from '@/pages/recommendation-result/RecommendationFormPage';
import { RecommendationResultPage } from '@/pages/recommendation-result/RecommendationResultPage';
import { GymFinderPage } from '@/pages/gym-finder/GymFinderPage';
import { GymDetailPage } from '@/pages/gym-detail/GymDetailPage';
import { FavoritesPage } from '@/pages/favorites/FavoritesPage';
import { RecentHistoryPage } from '@/pages/recent-history/RecentHistoryPage';
import { CommunityPage } from '@/pages/community/CommunityPage';
import { PostDetailPage } from '@/pages/community/PostDetailPage';
import { MachineRequestBoardPage } from '@/pages/machine-request-board/MachineRequestBoardPage';
import { FreeBoardPage } from '@/pages/free-board/FreeBoardPage';
import { LoginPage } from '@/pages/auth/login/LoginPage';
import { RegisterPage } from '@/pages/auth/register/RegisterPage';
import { MyPage } from '@/pages/my-page/MyPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { OwnerDashboardPage } from '@/pages/gym-owner/dashboard/OwnerDashboardPage';
import { AdminDashboardPage } from '@/pages/admin/dashboard/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/users/AdminUsersPage';
import { AdminGymsPage } from '@/pages/admin/gyms/AdminGymsPage';
import { AdminMachinesPage } from '@/pages/admin/machines/AdminMachinesPage';
import { AdminModerationPage } from '@/pages/admin/moderation/AdminModerationPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { NotFoundPage } from '@/pages/not-found/NotFoundPage';

export const router = createBrowserRouter(
  [
    {
      element: <MainLayout />,
      children: [
        { path: ROUTES.HOME, element: <HomePage /> },
        { path: ROUTES.MACHINES, element: <MachineSearchPage /> },
        { path: ROUTES.BRANDS, element: <BrandListPage /> },
        { path: ROUTES.MACHINE_DETAIL, element: <MachineDetailPage /> },
        { path: ROUTES.RECOMMEND, element: <RecommendationFormPage /> },
        { path: ROUTES.RECOMMEND_RESULT, element: <RecommendationResultPage /> },
        { path: ROUTES.GYMS, element: <GymFinderPage /> },
        { path: ROUTES.GYM_DETAIL, element: <GymDetailPage /> },
        { path: ROUTES.COMMUNITY, element: <CommunityPage /> },
        { path: ROUTES.MACHINE_REQUESTS, element: <MachineRequestBoardPage /> },
        { path: ROUTES.FREE_BOARD, element: <FreeBoardPage /> },
        { path: ROUTES.POST_DETAIL, element: <PostDetailPage /> },
        {
          path: ROUTES.FAVORITES,
          element: (
            <AuthGuard>
              <FavoritesPage />
            </AuthGuard>
          ),
        },
        {
          path: ROUTES.HISTORY,
          element: (
            <AuthGuard>
              <RecentHistoryPage />
            </AuthGuard>
          ),
        },
        {
          path: ROUTES.MY_PAGE,
          element: (
            <AuthGuard>
              <MyPage />
            </AuthGuard>
          ),
        },
        {
          path: ROUTES.SETTINGS,
          element: (
            <AuthGuard>
              <SettingsPage />
            </AuthGuard>
          ),
        },
        {
          path: ROUTES.NOTIFICATIONS,
          element: (
            <AuthGuard>
              <NotificationsPage />
            </AuthGuard>
          ),
        },
        { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
      ],
    },
    {
      element: <AuthLayout />,
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
        { path: ROUTES.ADMIN_MACHINES, element: <AdminMachinesPage /> },
        { path: ROUTES.ADMIN_MODERATION, element: <AdminModerationPage /> },
      ],
    },
    { path: '*', element: <Navigate to={ROUTES.NOT_FOUND} replace /> },
  ],
  { basename: '/machinefit' }
);
