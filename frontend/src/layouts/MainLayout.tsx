import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation/BottomNavigation';
import { Toast } from '@/components/feedback/Toast/Toast';
import '@/styles/layout.css';

export function MainLayout() {
  return (
    <div className="layout">
      <Header />
      <main className="layout__main">
        <div className="layout__content">
          <Outlet />
        </div>
      </main>
      <BottomNavigation />
      <Toast />
    </div>
  );
}
