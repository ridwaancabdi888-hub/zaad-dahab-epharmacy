import { useMemo, useState } from 'react';
import { paymentsApi } from '../api/resources';
import { usePaginatedList } from '../hooks/usePaginatedList';
import Spinner from '../components/ui/Spinner';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatCurrency, formatDate, titleCase } from '../utils/format';

const STATUS_OPTIONS = ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'];
const METHOD_OPTIONS = ['zaad', 'edahab', 'cod'];

const STATUS_VARIANT = {
  pending: 'neutral',
  processing: 'info',
  completed: 'success',
  failed: 'error',
  refunded: 'neutral',
  cancelled: 'neutral',
};

export default function PaymentsPage() {
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [actionError, setActionError] = useState(null);

  const filters = useMemo(() => ({ status: status || undefined, method: method || undefined }), [status, method]);
  const { items, meta, setPage, isLoading, error, refresh } = usePaginatedList(
    (params) => paymentsApi.list(params),
    { filters },
  );

  const onConfirm = async () => {
    setIsWorking(true);
    setActionError(null);
    try {
      await paymentsApi.confirm(confirming._id);
      setConfirming(null);
      refresh();
    } catch (err) {
      setActionError(err.message);
      setConfirming(null);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Every payment attempt across Zaad, e-Dahab, and Cash on Delivery</p>
        </div>
      </div>

      <div className="toolbar">
        <select className="search-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </select>
        <select className="search-input" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="">All methods</option>
          {METHOD_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {titleCase(m)}
            </option>
          ))}
        </select>
      </div>

      {actionError && <ErrorBanner error={{ message: actionError }} />}

      <div className="card">
        {error && <ErrorBanner error={error} onRetry={refresh} />}
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="No payments found" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((payment) => (
                    <tr key={payment._id}>
                      <td>{payment.order?.orderNumber ? `#${payment.order.orderNumber}` : '—'}</td>
                      <td>{payment.user?.name || '—'}</td>
                      <td>{titleCase(payment.method)}</td>
                      <td>{formatCurrency(payment.amount, payment.currency)}</td>
                      <td>
                        <Badge variant={STATUS_VARIANT[payment.status]}>{titleCase(payment.status)}</Badge>
                      </td>
                      <td>{formatDate(payment.createdAt)}</td>
                      <td>
                        {['pending', 'processing', 'failed'].includes(payment.status) && (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirming(payment)}>
                            Confirm Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          title="Confirm Payment"
          message={`Mark this ${formatCurrency(confirming.amount, confirming.currency)} payment as completed? Use this for manual/offline confirmations only.`}
          confirmLabel="Confirm Paid"
          isWorking={isWorking}
          onConfirm={onConfirm}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
