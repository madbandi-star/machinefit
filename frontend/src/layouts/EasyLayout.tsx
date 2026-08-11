import { Outlet } from 'react-router-dom';
import { LegalFooter } from '@/components/layout/LegalFooter/LegalFooter';
import '@/styles/easy-mode.css';
import '@/styles/legal.css';

/** Standalone shell — no MainLayout header/bottom nav. */
export function EasyLayout() {
  return (
    <div className="easy-layout">
      <div className="easy-layout__frame">
        <Outlet />
      </div>
      <LegalFooter compact />
    </div>
  );
}
