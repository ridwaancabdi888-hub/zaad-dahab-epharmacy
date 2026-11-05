import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './AppShell.css';
import {
  AuditIcon,
  CategoryIcon,
  CloseIcon,
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

  // On narrow screens the sidebar becomes an off-canvas drawer (see the
  // `max-width: 900px` block in index.css); on desktop this flag is ignored.
  const [isNavOpen, setIsNavOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const location = useLocation();

  // Any navigation (link tap, back/forward) should reveal the new page.
  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isNavOpen) return undefined;
    // Move keyboard focus into the drawer so it can be navigated at once.
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsNavOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isNavOpen]);

  return (
    <div className={`app-shell${isNavOpen ? ' nav-open' : ''}`}>
      <aside id="app-sidebar" className="sidebar" aria-label="Main navigation">
        <button
          ref={closeButtonRef}
          type="button"
          className="sidebar-close"
          aria-label="Close navigation menu"
          onClick={() => {
            setIsNavOpen(false);
            menuButtonRef.current?.focus();
          }}
        >
          <CloseIcon />
        </button>
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

      <div className="sidebar-backdrop" aria-hidden="true" onClick={() => setIsNavOpen(false)} />

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-start">
            <button
              ref={menuButtonRef}
              type="button"
              className="topbar-menu-button"
              aria-label="Open navigation menu"
              aria-controls="app-sidebar"
              aria-expanded={isNavOpen}
              onClick={() => setIsNavOpen(true)}
            >
              <MenuIcon />
            </button>
            <div className="topbar-title">{isPharmacist ? 'Pharmacy Orders' : 'Admin Dashboard'}</div>
          </div>
          <div className="topbar-user">
            <div className="topbar-user-details">
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
