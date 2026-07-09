import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { reportsApi } from '../api/resources';
import Spinner from '../components/ui/Spinner';
import ErrorBanner from '../components/ui/ErrorBanner';
import { DownloadIcon } from '../components/icons';
import { formatCurrency, formatDateOnly, titleCase } from '../utils/format';
import { exportReportPdf } from '../utils/exportPdf';
import { exportReportExcel } from '../utils/exportExcel';

export default function ReportsPage() {
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
  const generatedAt = new Date().toLocaleString('en-US');

  const sections = {
    pdf: [
      {
        heading: 'Totals',
        head: ['Metric', 'Value'],
        body: [
          ['Revenue', formatCurrency(totals.revenue)],
          ['Orders', String(totals.orders)],
          ['Delivered Orders', String(totals.deliveredOrders)],
          ['Cancelled Orders', String(totals.cancelledOrders)],
          ['Customers', String(totals.customers)],
          ['Riders', String(totals.riders)],
          ['Pharmacists', String(totals.pharmacists)],
          ['Medicines', String(totals.medicines)],
        ],
      },
      {
        heading: 'Revenue by Day (last 14 days)',
        head: ['Date', 'Orders', 'Revenue'],
        body: revenueByDay.map((row) => [row.date, String(row.orders), formatCurrency(row.revenue)]),
      },
      {
        heading: 'Orders by Status',
        head: ['Status', 'Count'],
        body: ordersByStatus.map((row) => [titleCase(row.status), String(row.count)]),
      },
      {
        heading: 'Payments by Method',
        head: ['Method', 'Attempts', 'Collected'],
        body: paymentsByMethod.map((row) => [titleCase(row.method), String(row.count), formatCurrency(row.collectedAmount)]),
      },
      {
        heading: 'Top Medicines',
        head: ['Medicine', 'Units Sold', 'Revenue'],
        body: topMedicines.map((row) => [row.name, String(row.unitsSold), formatCurrency(row.revenue)]),
      },
    ],
    excel: [
      {
        sheetName: 'Totals',
        rows: Object.entries(totals).map(([metric, value]) => ({ Metric: titleCase(metric), Value: value })),
      },
      { sheetName: 'Revenue by Day', rows: revenueByDay },
      { sheetName: 'Orders by Status', rows: ordersByStatus },
      { sheetName: 'Payments by Method', rows: paymentsByMethod },
      { sheetName: 'Top Medicines', rows: topMedicines },
    ],
  };

  const onExportPdf = () => {
    exportReportPdf({ title: 'Zaad e-Dahab Business Report', generatedAt, sections: sections.pdf }).catch((err) =>
      setError(err),
    );
  };

  const onExportExcel = () => {
    exportReportExcel({ fileName: 'zaad-edahab-report', sections: sections.excel }).catch((err) => setError(err));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Business performance, exportable as PDF or Excel</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-outline" onClick={onExportExcel}>
            <DownloadIcon /> Export Excel
          </button>
          <button type="button" className="btn btn-primary" onClick={onExportPdf}>
            <DownloadIcon /> Export PDF
          </button>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v) => formatDateOnly(v).replace(/,.*/, '')} tick={{ fontSize: 11 }} minTickGap={20} />
              <YAxis tick={{ fontSize: 11 }} width={50} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={formatDateOnly} />
              <Line type="monotone" dataKey="revenue" stroke="#006c49" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Orders per Day</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v) => formatDateOnly(v).replace(/,.*/, '')} tick={{ fontSize: 11 }} minTickGap={20} />
              <YAxis tick={{ fontSize: 11 }} width={30} allowDecimals={false} />
              <Tooltip labelFormatter={formatDateOnly} />
              <Bar dataKey="orders" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Orders by Status</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {ordersByStatus.map((row) => (
              <tr key={row.status}>
                <td>{titleCase(row.status)}</td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Top Medicines</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Units Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topMedicines.map((row) => (
              <tr key={row.medicineId}>
                <td>{row.name}</td>
                <td>{row.unitsSold}</td>
                <td>{formatCurrency(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
  );
}
