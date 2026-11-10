import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getFocusableElements, getNextFocusable, restoreFocus } from '../../utils/modalFocus';
import {
  AuditIcon,
  CategoryIcon,
  DashboardIcon,
  LogoutIcon,
  MenuIcon,
  OrderIcon,
  PaymentIcon,
  PillIcon,
  ReportIcon,
  RoleIcon,
  UsersIcon,
} from '../icons';

const ADMIN_NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/medicines', label: 'Medicines', icon: PillIcon },
  { to: '/categories', label: 'Categories', icon: CategoryIcon },
  { to: '/orders', label: 'Orders', icon: OrderIcon },
  { to: '/customers', label: 'Customers', icon: UsersIcon },
  { to: '/payments', label: 'Payments', icon: PaymentIcon },
  { to: '/reports', label: 'Reports', icon: ReportIcon },
  { to: '/roles', label: 'Role Management', icon: RoleIcon },
  { to: '/audit-logs', label: 'Audit Logs', icon: AuditIcon },
];

// A pharmacist manages order fulfillment platform-wide (assigning a
// rider, flagging an item out of stock, confirming payments) and has
// full user-management access alongside admin — every other page here
// is either irrelevant to them or backed by an admin-only endpoint that
// would just 403, so it's left out of their nav entirely rather than
// shown and then failing.
const PHARMACIST_NAV_ITEMS = [
  { to: '/orders', label: 'Orders', icon: OrderIcon, end: true },
  { to: '/customers', label: 'Customers', icon: UsersIcon },
  { to: '/roles', label: 'Role Management', icon: RoleIcon },
];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const isPharmacist = user?.role === 'pharmacist';
  const navItems = isPharmacist ? PHARMACIST_NAV_ITEMS : ADMIN_NAV_ITEMS;
  const [navOpen, setNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 800px)').matches);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 800px)');
    const syncViewport = (event) => {
      setIsMobile(event.matches);
      if (!event.matches) setNavOpen(false);
    };
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    if (!navOpen) return undefined;

    const sidebar = sidebarRef.current;
    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    getFocusableElements(sidebar)[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setNavOpen(false);
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        getNextFocusable(sidebar, document.activeElement, event.shiftKey)?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocus(menuButton);
    };
  }, [navOpen]);

  const closeNavigation = () => setNavOpen(false);

  return (
    <div className="app-shell">
      <aside
        ref={sidebarRef}
        id="admin-navigation"
        className={`sidebar${navOpen ? ' mobile-open' : ''}`}
        aria-label="Admin navigation"
        aria-hidden={isMobile && !navOpen}
        inert={isMobile && !navOpen ? true : undefined}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">Z</div>
          <div className="sidebar-brand-text">
            Zaad/e-Dahab
            <br />
            {isPharmacist ? 'Pharmacy' : 'Admin'}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={closeNavigation}
            >
              <Icon className="icon" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }} onClick={logout}>
            <LogoutIcon className="icon" />
            Log Out
          </button>
        </div>
      </aside>

      {navOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={closeNavigation}
        />
      )}

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-heading">
            <button
              ref={menuButtonRef}
              type="button"
              className="menu-toggle"
              aria-label="Open navigation"
              aria-controls="admin-navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((open) => !open)}
            >
              <MenuIcon aria-hidden="true" />
            </button>
            <div className="topbar-title">{isPharmacist ? 'Pharmacy Orders' : 'Admin Dashboard'}</div>
          </div>
          <div className="topbar-user">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>{user?.email}</div>
            </div>
            <div className="avatar">{initials(user?.name) || 'A'}</div>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
