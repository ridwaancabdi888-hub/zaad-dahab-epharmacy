import { useMemo, useState } from 'react';
import { usersApi } from '../api/resources';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { useAuth } from '../auth/AuthContext';
import Spinner from '../components/ui/Spinner';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { titleCase } from '../utils/format';

const ROLES = ['customer', 'pharmacist', 'rider', 'admin'];

const ROLE_VARIANT = {
  customer: 'neutral',
  pharmacist: 'info',
  rider: 'primary',
  admin: 'success',
};

const emptyForm = { name: '', email: '', phone: '', password: '', role: 'customer' };

export default function RolesPage() {
  const { user: currentUser } = useAuth();
  const [roleFilter, setRoleFilter] = useState('');
  const [pendingChange, setPendingChange] = useState(null); // { user, nextRole }
  const [isWorking, setIsWorking] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [creating, setCreating] = useState(null); // null = closed, {} = form state
  const [createError, setCreateError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

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

  const openCreate = () => {
    setCreateError(null);
    setCreating({ ...emptyForm });
  };

  const onCreateFormChange = (key, value) => setCreating((prev) => ({ ...prev, [key]: value }));

  const onCreateSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);
    try {
      await usersApi.create({
        name: creating.name.trim(),
        email: creating.email.trim(),
        phone: creating.phone.trim() || undefined,
        password: creating.password,
        role: creating.role,
      });
      setCreating(null);
      setRoleFilter('');
      refresh();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Role Management</h1>
          <p className="page-subtitle">Add users and grant or revoke admin, pharmacist, and rider access</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add User
        </button>
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

      {creating && (
        <Modal title="Add User" onClose={() => setCreating(null)}>
          <form onSubmit={onCreateSubmit}>
            {createError && <div className="error-banner">{createError}</div>}
            <div className="field">
              <label htmlFor="new-user-name">Name</label>
              <input
                id="new-user-name"
                required
                value={creating.name}
                onChange={(e) => onCreateFormChange('name', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="new-user-email">Email</label>
              <input
                id="new-user-email"
                type="email"
                required
                value={creating.email}
                onChange={(e) => onCreateFormChange('email', e.target.value)}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="new-user-phone">Phone (optional)</label>
                <input
                  id="new-user-phone"
                  value={creating.phone}
                  onChange={(e) => onCreateFormChange('phone', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="new-user-role">Role</label>
                <select
                  id="new-user-role"
                  value={creating.role}
                  onChange={(e) => onCreateFormChange('role', e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {titleCase(r)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="new-user-password">Password</label>
              <input
                id="new-user-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={creating.password}
                onChange={(e) => onCreateFormChange('password', e.target.value)}
              />
              <span className="text-muted" style={{ fontSize: 12 }}>
                At least 8 characters, with a letter and a number.
              </span>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setCreating(null)} disabled={isCreating}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isCreating}>
                {isCreating ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
