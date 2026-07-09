import { useMemo, useState } from 'react';
import { auditLogsApi } from '../api/resources';
import { usePaginatedList } from '../hooks/usePaginatedList';
import Spinner from '../components/ui/Spinner';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import { formatDate } from '../utils/format';

const RESOURCE_TYPES = ['Medicine', 'Category', 'Coupon', 'User', 'Order', 'Payment'];

const ACTION_VARIANT = (action) => {
  if (action.endsWith('.delete') || action.endsWith('.cancel')) return 'error';
  if (action.endsWith('.create')) return 'success';
  return 'info';
};

export default function AuditLogsPage() {
  const [resourceType, setResourceType] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filters = useMemo(
    () => ({
      resourceType: resourceType || undefined,
      action: actionFilter || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [resourceType, actionFilter, from, to],
  );

  const { items, meta, setPage, isLoading, error, refresh } = usePaginatedList(
    (params) => auditLogsApi.list(params),
    { filters },
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Every mutating admin action — who did what, and when</p>
        </div>
      </div>

      <div className="toolbar">
        <select className="search-input" value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
          <option value="">All resource types</option>
          {RESOURCE_TYPES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          className="search-input"
          placeholder="Filter by action (e.g. medicine.create)"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        />
        <label className="text-muted" style={{ fontSize: 13 }}>
          From{' '}
          <input type="date" className="search-input" style={{ minWidth: 0 }} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-muted" style={{ fontSize: 13 }}>
          To <input type="date" className="search-input" style={{ minWidth: 0 }} value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      <div className="card">
        {error && <ErrorBanner error={error} onRetry={refresh} />}
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="No audit log entries found" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((entry) => (
                    <tr key={entry._id}>
                      <td>{formatDate(entry.createdAt)}</td>
                      <td>
                        {entry.actor?.name || 'Unknown'}
                        <div className="text-muted" style={{ fontSize: 11.5 }}>
                          {entry.actor?.role}
                        </div>
                      </td>
                      <td>
                        <Badge variant={ACTION_VARIANT(entry.action)}>{entry.action}</Badge>
                      </td>
                      <td>
                        {entry.resourceType}
                        {entry.resourceId && (
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            {entry.resourceId}
                          </div>
                        )}
                      </td>
                      <td>{entry.statusCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
