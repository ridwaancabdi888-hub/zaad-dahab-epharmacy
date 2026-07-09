import { useMemo, useState } from 'react';
import { usersApi } from '../api/resources';
import { usePaginatedList } from '../hooks/usePaginatedList';
import Spinner from '../components/ui/Spinner';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/format';

export default function CustomersPage() {
  const filters = useMemo(() => ({ role: 'customer' }), []);
  const { items, meta, setPage, isLoading, error, refresh } = usePaginatedList(
    (params) => usersApi.list(params),
    { filters },
  );

  const [toggling, setToggling] = useState(null);
  const [isWorking, setIsWorking] = useState(false);

  const onToggleActive = async () => {
    setIsWorking(true);
    try {
      await usersApi.adminUpdate(toggling._id, { isActive: !toggling.isActive });
      setToggling(null);
      refresh();
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Everyone who shops on the platform</p>
        </div>
      </div>

      <div className="card">
        {error && <ErrorBanner error={error} onRetry={refresh} />}
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="No customers yet" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Addresses</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((customer) => (
                    <tr key={customer._id}>
                      <td>
                        <strong>{customer.name}</strong>
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || '—'}</td>
                      <td>{customer.addresses?.length ?? 0}</td>
                      <td>{formatDate(customer.createdAt)}</td>
                      <td>
                        <Badge variant={customer.isActive ? 'success' : 'error'}>
                          {customer.isActive ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={customer.isActive ? 'btn btn-danger btn-sm' : 'btn btn-outline btn-sm'}
                          onClick={() => setToggling(customer)}
                        >
                          {customer.isActive ? 'Suspend' : 'Reactivate'}
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

      {toggling && (
        <ConfirmDialog
          title={toggling.isActive ? 'Suspend Customer' : 'Reactivate Customer'}
          message={
            toggling.isActive
              ? `Suspend ${toggling.name}? They won't be able to log in until reactivated.`
              : `Reactivate ${toggling.name}?`
          }
          confirmLabel={toggling.isActive ? 'Suspend' : 'Reactivate'}
          danger={toggling.isActive}
          isWorking={isWorking}
          onConfirm={onToggleActive}
          onCancel={() => setToggling(null)}
        />
      )}
    </div>
  );
}
