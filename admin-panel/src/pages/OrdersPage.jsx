import { useMemo, useState } from 'react';
import { deliveriesApi, ordersApi, usersApi } from '../api/resources';
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

const DELIVERY_STATUS_VARIANT = {
  pending: 'neutral',
  assigned: 'info',
  picked_up: 'info',
  in_transit: 'primary',
  delivered: 'success',
  cancelled: 'error',
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [delivery, setDelivery] = useState(null);
  const [isDeliveryLoading, setIsDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState(null);
  const [riders, setRiders] = useState([]);
  const [riderChoice, setRiderChoice] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const filters = useMemo(() => ({ status: statusFilter || undefined }), [statusFilter]);
  const { items, meta, setPage, isLoading, error, refresh } = usePaginatedList(
    (params) => ordersApi.list(params),
    { filters },
  );

  const loadDelivery = async (orderId) => {
    setIsDeliveryLoading(true);
    setDeliveryError(null);
    try {
      const [deliveryResult, ridersResult] = await Promise.all([
        deliveriesApi.getByOrderId(orderId),
        usersApi.list({ role: 'rider', limit: 100 }),
      ]);
      setDelivery(deliveryResult);
      setRiders(ridersResult.items);
    } catch (err) {
      setDelivery(null);
      setDeliveryError(err);
    } finally {
      setIsDeliveryLoading(false);
    }
  };

  const openDetail = async (order) => {
    setActionError(null);
    setSelected(order);
    setDelivery(null);
    setRiderChoice('');
    loadDelivery(order._id);
    try {
      const full = await ordersApi.getById(order._id);
      setSelected(full);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const assignRider = async () => {
    if (!riderChoice) return;
    setIsAssigning(true);
    setDeliveryError(null);
    try {
      const updated = await deliveriesApi.assign(delivery._id, riderChoice);
      setDelivery(updated);
      setRiderChoice('');
    } catch (err) {
      setDeliveryError(err);
    } finally {
      setIsAssigning(false);
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

          <h4 className="mt-md">Delivery &amp; Rider</h4>
          {isDeliveryLoading ? (
            <Spinner />
          ) : deliveryError ? (
            <ErrorBanner error={deliveryError} onRetry={() => loadDelivery(selected._id)} />
          ) : !delivery ? (
            <p className="text-muted" style={{ fontSize: 14 }}>No delivery record for this order.</p>
          ) : (
            <div style={{ fontSize: 14 }}>
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span>Status</span>
                <Badge variant={DELIVERY_STATUS_VARIANT[delivery.status]}>{titleCase(delivery.status)}</Badge>
              </div>

              {delivery.rider ? (
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <span>Rider</span>
                  <span>
                    {delivery.rider.name}
                    {delivery.rider.phone ? ` • ${delivery.rider.phone}` : ''}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <select
                    className="search-input"
                    style={{ flex: 1 }}
                    value={riderChoice}
                    onChange={(e) => setRiderChoice(e.target.value)}
                  >
                    <option value="">Select a rider…</option>
                    {riders.map((rider) => (
                      <option key={rider._id} value={rider._id}>
                        {rider.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={!riderChoice || isAssigning}
                    onClick={assignRider}
                  >
                    {isAssigning ? 'Assigning…' : 'Assign Rider'}
                  </button>
                </div>
              )}
              {!delivery.rider && riders.length === 0 && (
                <p className="text-muted" style={{ fontSize: 12.5, marginTop: -4, marginBottom: 8 }}>
                  No riders exist yet — create one from Role Management.
                </p>
              )}

              {delivery.estimatedDeliveryStart && (
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <span>Estimated arrival</span>
                  <span>
                    {formatDate(delivery.estimatedDeliveryStart)} – {formatDate(delivery.estimatedDeliveryEnd)}
                  </span>
                </div>
              )}

              {delivery.currentLocation?.lat != null && (
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <span>Rider location</span>
                  <span>
                    {delivery.currentLocation.lat.toFixed(4)}, {delivery.currentLocation.lng.toFixed(4)}
                    <span className="text-muted"> ({formatDate(delivery.currentLocation.updatedAt)})</span>
                  </span>
                </div>
              )}

              {delivery.statusHistory?.length > 0 && (
                <>
                  <div className="text-muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 4 }}>
                    Status history
                  </div>
                  {delivery.statusHistory.map((entry, index) => (
                    <div key={index} className="flex-between" style={{ fontSize: 13, padding: '2px 0' }}>
                      <span>{titleCase(entry.status)}</span>
                      <span className="text-muted">{formatDate(entry.at)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

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
