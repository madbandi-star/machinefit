import { Outlet } from 'react-router-dom';
import '@/styles/easy-mode.css';

/** Standalone shell — no MainLayout header/bottom nav, no legal footer. */
export function EasyLayout() {
  return (
    <div className="easy-layout">
      <div className="easy-layout__frame">
        <Outlet />
      </div>
    </div>
  );
}
