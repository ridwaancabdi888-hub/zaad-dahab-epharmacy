import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAdmin from './auth/RequireAdmin';
import { useAuth } from './auth/AuthContext';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import Spinner from './components/ui/Spinner';

// Route-level code splitting: DashboardPage/ReportsPage pull in recharts
// (and, on demand, jspdf/xlsx), which would otherwise sit in the main
// bundle for every user regardless of which page they land on.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MedicinesPage = lazy(() => import('./pages/MedicinesPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAdmin>
            <AppShell />
          </RequireAdmin>
        }
      >
        <Route index element={<Page><Index /></Page>} />
        <Route path="medicines" element={<Page><MedicinesPage /></Page>} />
        <Route path="categories" element={<Page><CategoriesPage /></Page>} />
        <Route path="orders" element={<Page><OrdersPage /></Page>} />
        <Route path="customers" element={<Page><CustomersPage /></Page>} />
        <Route path="payments" element={<Page><PaymentsPage /></Page>} />
        <Route path="reports" element={<Page><ReportsPage /></Page>} />
        <Route path="roles" element={<Page><RolesPage /></Page>} />
        <Route path="audit-logs" element={<Page><AuditLogsPage /></Page>} />
      </Route>
    </Routes>
  );
}

function Page({ children }) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}

// The Dashboard is backed by admin-only report endpoints — a pharmacist
// would just see it fail, so send them straight to the one page they
// actually have (Orders) instead.
function Index() {
  const { user } = useAuth();
  if (user?.role === 'pharmacist') {
    return <Navigate to="/orders" replace />;
  }
  return <DashboardPage />;
}
