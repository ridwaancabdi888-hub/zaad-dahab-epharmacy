import { useMemo, useState } from 'react';
import { ordersApi } from '../api/resources';
import { usePaginatedList } from '../hooks/usePaginatedList';
import Spinner from '../components/ui/Spinner';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { formatCurrency, formatDate, titleCase } from '../utils/format';

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const STATUS_VARIANT = {
  pending: 'neutral',
  confirmed: 'info',
  preparing: 'info',
  out_for_delivery: 'primary',
  delivered: 'success',
  cancelled: 'error',
};

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'preparing',
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [actionError, setActionError] = useState(null);

  const filters = useMemo(() => ({ status: statusFilter || undefined }), [statusFilter]);
  const { items, meta, setPage, isLoading, error, refresh } = usePaginatedList(
    (params) => ordersApi.list(params),
    { filters },
  );

  const openDetail = async (order) => {
    setActionError(null);
    setSelected(order);
    try {
      const full = await ordersApi.getById(order._id);
      setSelected(full);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const advance = async (targetStatus) => {
    setIsWorking(true);
    setActionError(null);
    try {
      const updated = await ordersApi.updateStatus(selected._id, targetStatus);
      setSelected(updated);
      refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsWorking(false);
    }
  };

  const cancel = async () => {
    setIsWorking(true);
    setActionError(null);
    try {
      const updated = await ordersApi.cancel(selected._id);
      setSelected(updated);
      refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsWorking(false);
    }
  };

  const nextStatus = selected ? NEXT_STATUS[selected.status] : null;
  const canCancel = selected && ['pending', 'confirmed', 'preparing'].includes(selected.status);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Every order placed on the platform</p>
        </div>
      </div>

      <div className="toolbar">
        <select className="search-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {error && <ErrorBanner error={error} onRetry={refresh} />}
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="No orders found" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Placed</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <strong>#{order.orderNumber}</strong>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{titleCase(order.paymentMethod)}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>
                        <Badge variant={STATUS_VARIANT[order.status]}>{titleCase(order.status)}</Badge>
                      </td>
                      <td>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => openDetail(order)}>
                          View
                        </button>
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

      {selected && (
        <Modal title={`Order #${selected.orderNumber}`} onClose={() => setSelected(null)} width={620}>
          {actionError && <div className="error-banner">{actionError}</div>}

          <div className="flex-between mt-sm">
            <Badge variant={STATUS_VARIANT[selected.status]}>{titleCase(selected.status)}</Badge>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {formatDate(selected.createdAt)}
            </span>
          </div>

          <h4 className="mt-md">Items</h4>
          {(selected.items || []).map((item, index) => (
            <div key={index} className="flex-between" style={{ fontSize: 14, padding: '4px 0' }}>
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}

          <h4 className="mt-md">Delivery Address</h4>
          <p className="text-muted" style={{ fontSize: 14 }}>
            {selected.deliveryAddress?.label} — {selected.deliveryAddress?.street}, {selected.deliveryAddress?.city}
          </p>

          <h4 className="mt-md">Totals</h4>
          <div style={{ fontSize: 14 }}>
            <div className="flex-between">
              <span>Subtotal</span>
              <span>{formatCurrency(selected.subtotal)}</span>
            </div>
            <div className="flex-between">
              <span>Delivery Fee</span>
              <span>{formatCurrency(selected.deliveryFee)}</span>
            </div>
            <div className="flex-between">
              <span>Tax</span>
              <span>{formatCurrency(selected.tax)}</span>
            </div>
            {selected.discount > 0 && (
              <div className="flex-between">
                <span>Discount</span>
                <span>-{formatCurrency(selected.discount)}</span>
              </div>
            )}
            <div className="flex-between" style={{ fontWeight: 700 }}>
              <span>Total</span>
              <span>{formatCurrency(selected.total)}</span>
            </div>
          </div>

          {(nextStatus || canCancel) && (
            <div className="modal-actions">
              {canCancel && (
                <button type="button" className="btn btn-danger" onClick={cancel} disabled={isWorking}>
                  Cancel Order
                </button>
              )}
              {nextStatus && (
                <button type="button" className="btn btn-primary" onClick={() => advance(nextStatus)} disabled={isWorking}>
                  {isWorking ? 'Working…' : `Mark ${titleCase(nextStatus)}`}
                </button>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
