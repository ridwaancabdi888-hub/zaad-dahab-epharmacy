import { useMemo, useState } from 'react';
import { usersApi } from '../api/resources';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { useAuth } from '../auth/AuthContext';
import Spinner from '../components/ui/Spinner';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { titleCase } from '../utils/format';

const ROLES = ['customer', 'pharmacist', 'rider', 'admin'];

const ROLE_VARIANT = {
  customer: 'neutral',
  pharmacist: 'info',
  rider: 'primary',
  admin: 'success',
};

export default function RolesPage() {
  const { user: currentUser } = useAuth();
  const [roleFilter, setRoleFilter] = useState('');
  const [pendingChange, setPendingChange] = useState(null); // { user, nextRole }
  const [isWorking, setIsWorking] = useState(false);
  const [actionError, setActionError] = useState(null);

  const filters = useMemo(() => ({ role: roleFilter || undefined }), [roleFilter]);
  const { items, meta, setPage, isLoading, error, refresh } = usePaginatedList(
    (params) => usersApi.list(params),
    { filters },
  );

  const requestRoleChange = (user, nextRole) => {
    if (nextRole === user.role) return;
    setActionError(null);
    setPendingChange({ user, nextRole });
  };

  const confirmRoleChange = async () => {
    setIsWorking(true);
    setActionError(null);
    try {
      await usersApi.adminUpdate(pendingChange.user._id, { role: pendingChange.nextRole });
      setPendingChange(null);
      refresh();
    } catch (err) {
      setActionError(err.message);
      setPendingChange(null);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Role Management</h1>
          <p className="page-subtitle">Grant or revoke admin, pharmacist, and rider access</p>
        </div>
      </div>

      <div className="toolbar">
        <select className="search-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {titleCase(r)}
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
          <EmptyState title="No users found" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <strong>{user.name}</strong>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <Badge variant={ROLE_VARIANT[user.role]}>{titleCase(user.role)}</Badge>
                      </td>
                      <td>
                        <select
                          className="search-input"
                          style={{ minWidth: 150 }}
                          value={user.role}
                          disabled={user._id === currentUser?._id}
                          onChange={(e) => requestRoleChange(user, e.target.value)}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {titleCase(r)}
                            </option>
                          ))}
                        </select>
                        {user._id === currentUser?._id && (
                          <span className="text-muted" style={{ fontSize: 11, marginLeft: 6 }}>
                            (you)
                          </span>
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

      {pendingChange && (
        <ConfirmDialog
          title="Change Role"
          message={`Change ${pendingChange.user.name}'s role from ${titleCase(pendingChange.user.role)} to ${titleCase(pendingChange.nextRole)}?`}
          confirmLabel="Change Role"
          isWorking={isWorking}
          onConfirm={confirmRoleChange}
          onCancel={() => setPendingChange(null)}
        />
      )}
    </div>
  );
}
