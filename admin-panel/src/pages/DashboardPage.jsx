import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { reportsApi } from '../api/resources';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import ErrorBanner from '../components/ui/ErrorBanner';
import { formatCurrency, formatDateOnly, titleCase } from '../utils/format';

const STATUS_COLORS = {
  pending: '#bbcabf',
  confirmed: '#0d9488',
  preparing: '#10b981',
  out_for_delivery: '#006a61',
  delivered: '#006c49',
  cancelled: '#ba1a1a',
};

export default function DashboardPage() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    reportsApi
      .dashboard()
      .then(setReport)
      .catch(setError)
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBanner error={error} onRetry={load} />;
  if (!report) return null;

  const { totals, ordersByStatus, revenueByDay, paymentsByMethod, topMedicines } = report;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">A live snapshot of the pharmacy business</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Revenue Today" value={formatCurrency(totals.revenueToday)} hint="Orders placed today (UTC)" />
        <StatCard label="Revenue (All Time)" value={formatCurrency(totals.revenue)} hint={`${totals.orders} orders total`} />
        <StatCard label="Delivered Orders" value={totals.deliveredOrders} hint={`${totals.cancelledOrders} cancelled`} />
        <StatCard label="Customers" value={totals.customers} hint={`${totals.riders} riders · ${totals.pharmacists} pharmacists`} />
        <StatCard label="Medicines" value={totals.medicines} hint={`${totals.categories} categories · ${totals.pharmacies} pharmacies`} />
      </div>

      <div className="chart-grid">
        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Revenue — last 14 days</h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
            Sum of order totals per day (cancelled orders excluded)
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueByDay}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDateOnly(value).replace(/,.*/, '')}
                tick={{ fontSize: 11 }}
                minTickGap={20}
              />
              <YAxis tick={{ fontSize: 11 }} width={50} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(value) => formatDateOnly(value)}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Orders by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={ordersByStatus}
                dataKey="count"
                nameKey="status"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {ordersByStatus.map((row) => (
                  <Cell key={row.status} fill={STATUS_COLORS[row.status] || '#94a5b0'} />
                ))}
              </Pie>
              <Tooltip formatter={(value, _name, entry) => [value, titleCase(entry.payload.status)]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {ordersByStatus.map((row) => (
              <span key={row.status} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: STATUS_COLORS[row.status] || '#94a5b0',
                    display: 'inline-block',
                  }}
                />
                {titleCase(row.status)} ({row.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Top Medicines by Units Sold</h3>
          {topMedicines.length === 0 ? (
            <p className="text-muted">No sales yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topMedicines} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [value, 'Units sold']} />
                <Bar dataKey="unitsSold" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Payments by Method</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Attempts</th>
                <th>Collected</th>
              </tr>
            </thead>
            <tbody>
              {paymentsByMethod.map((row) => (
                <tr key={row.method}>
                  <td>{titleCase(row.method)}</td>
                  <td>{row.count}</td>
                  <td>{formatCurrency(row.collectedAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
