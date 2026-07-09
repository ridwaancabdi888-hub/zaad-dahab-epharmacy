import { useEffect, useState } from 'react';
import { categoriesApi } from '../api/resources';
import Spinner from '../components/ui/Spinner';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const emptyForm = { name: '', description: '', icon: '', sortOrder: '0', isActive: true };

function toFormState(category) {
  return {
    name: category.name,
    description: category.description || '',
    icon: category.icon || '',
    sortOrder: String(category.sortOrder ?? 0),
    isActive: category.isActive,
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    setIsLoading(true);
    setError(null);
    categoriesApi
      .list()
      .then(setCategories)
      .catch(setError)
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setFormError(null);
    setEditing({ ...emptyForm });
  };
  const openEdit = (category) => {
    setFormError(null);
    setEditing({ ...toFormState(category), _id: category._id });
  };
  const onFormChange = (key, value) => setEditing((prev) => ({ ...prev, [key]: value }));

  const onSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    const payload = {
      name: editing.name.trim(),
      description: editing.description.trim(),
      icon: editing.icon.trim(),
      sortOrder: Number(editing.sortOrder) || 0,
      isActive: editing.isActive,
    };
    try {
      if (editing._id) {
        await categoriesApi.update(editing._id, payload);
      } else {
        await categoriesApi.create(payload);
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async () => {
    setIsDeleting(true);
    try {
      await categoriesApi.remove(deleting._id);
      setDeleting(null);
      load();
    } catch (err) {
      setDeleting(null);
      setError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize the medicine catalog</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add Category
        </button>
      </div>

      <div className="card">
        {error && <ErrorBanner error={error} onRetry={load} />}
        {isLoading ? (
          <Spinner />
        ) : categories.length === 0 ? (
          <EmptyState title="No categories yet" message="Add your first category to get started." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Sort Order</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <strong>{category.name}</strong>
                      {category.description && (
                        <div className="text-muted" style={{ fontSize: 12.5 }}>
                          {category.description}
                        </div>
                      )}
                    </td>
                    <td>{category.slug}</td>
                    <td>{category.sortOrder}</td>
                    <td>
                      <Badge variant={category.isActive ? 'success' : 'neutral'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(category)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleting(category)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing._id ? 'Edit Category' : 'Add Category'} onClose={() => setEditing(null)}>
          <form onSubmit={onSave}>
            {formError && <div className="error-banner">{formError}</div>}
            <div className="field">
              <label htmlFor="cat-name">Name</label>
              <input id="cat-name" required value={editing.name} onChange={(e) => onFormChange('name', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cat-description">Description</label>
              <textarea
                id="cat-description"
                rows={3}
                value={editing.description}
                onChange={(e) => onFormChange('description', e.target.value)}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="cat-icon">Icon (emoji or URL, optional)</label>
                <input id="cat-icon" value={editing.icon} onChange={(e) => onFormChange('icon', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="cat-sort">Sort Order</label>
                <input
                  id="cat-sort"
                  type="number"
                  value={editing.sortOrder}
                  onChange={(e) => onFormChange('sortOrder', e.target.value)}
                />
              </div>
            </div>
            {editing._id && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={editing.isActive} onChange={(e) => onFormChange('isActive', e.target.checked)} />
                Active
              </label>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)} disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Category"
          message={`Delete "${deleting.name}"? Categories still assigned to medicines or with subcategories can't be deleted.`}
          confirmLabel="Delete"
          danger
          isWorking={isDeleting}
          onConfirm={onDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
