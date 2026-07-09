import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import RequireAdmin from './auth/RequireAdmin';
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
        <Route index element={<Page><DashboardPage /></Page>} />
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
