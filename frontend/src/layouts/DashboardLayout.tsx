import { Link, NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import '@/styles/layout.css';
import '@/styles/inspection.css';

const EQUIPMENT_LINKS = [
  { to: ROUTES.OWNER_EQUIPMENT, label: '기구관리', end: true },
  { to: ROUTES.OWNER_EQUIPMENT_INVENTORY, label: '보유기구', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_INSPECTIONS, label: '점검일지', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_PM, label: '예방정비', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_FAULTS, label: '고장접수', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_REPAIRS, label: '수리관리', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_PARTS, label: '부품관리', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_STATS, label: '통계', end: false },
  { to: ROUTES.OWNER_EQUIPMENT_SETTINGS, label: '점검설정', end: false },
] as const;

export function DashboardLayout() {
  return (
    <div className="layout inspection-shell">
      <header className="header inspection-shell__header">
        <Link to={ROUTES.OWNER} className="header__logo">
          Owner
        </Link>
        <nav className="inspection-shell__top-nav" aria-label="Owner">
          <NavLink to={ROUTES.OWNER} end className="header__link">
            대시보드
          </NavLink>
          <NavLink to={ROUTES.OWNER_EQUIPMENT} className="header__link">
            기구관리
          </NavLink>
          <NavLink to={ROUTES.HOME} className="header__link">
            홈
          </NavLink>
        </nav>
      </header>

      <nav className="inspection-shell__subnav" aria-label="기구관리">
        <div className="inspection-shell__subnav-track">
          {EQUIPMENT_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inspection-shell__subnav-link${isActive ? ' is-active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="layout__main">
        <div className="layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
