import { useEffect, useMemo, useState } from 'react';
import { categoriesApi, medicinesApi, pharmaciesApi } from '../api/resources';
import { usePaginatedList } from '../hooks/usePaginatedList';
import Spinner from '../components/ui/Spinner';
import ErrorBanner from '../components/ui/ErrorBanner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SearchIcon } from '../components/icons';
import { formatCurrency } from '../utils/format';

const emptyForm = {
  name: '',
  description: '',
  category: '',
  pharmacy: '',
  manufacturer: '',
  unit: '',
  price: '',
  discountPrice: '',
  stock: '',
  requiresPrescription: false,
  tags: '',
  isActive: true,
  imageUrl: '',
};

function toFormState(medicine) {
  return {
    name: medicine.name,
    description: medicine.description || '',
    category: medicine.category?._id || medicine.category || '',
    pharmacy: medicine.pharmacy?._id || medicine.pharmacy || '',
    manufacturer: medicine.manufacturer || '',
    unit: medicine.unit,
    price: String(medicine.price),
    discountPrice: medicine.discountPrice != null ? String(medicine.discountPrice) : '',
    stock: String(medicine.stock),
    requiresPrescription: medicine.requiresPrescription,
    tags: (medicine.tags || []).join(', '),
    isActive: medicine.isActive,
    imageUrl: (medicine.images || [])[0] || '',
  };
}

function toPayload(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category,
    pharmacy: form.pharmacy,
    manufacturer: form.manufacturer.trim(),
    unit: form.unit.trim(),
    price: Number(form.price),
    discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice),
    stock: Number(form.stock),
    requiresPrescription: form.requiresPrescription,
    tags: form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    isActive: form.isActive,
    images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
  };
}

export default function MedicinesPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [deleting, setDeleting] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filters = useMemo(() => ({ search: search || undefined }), [search]);
  const { items, meta, setPage, isLoading, error, refresh } = usePaginatedList(
    (params) => medicinesApi.list(params),
    { filters },
  );

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
    pharmaciesApi.list().then(setPharmacies).catch(() => {});
  }, []);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const openCreate = () => {
    setFormError(null);
    setEditing({ ...emptyForm });
  };

  const openEdit = (medicine) => {
    setFormError(null);
    setEditing({ ...toFormState(medicine), _id: medicine._id });
  };

  const closeForm = () => setEditing(null);

  const onFormChange = (key, value) => setEditing((prev) => ({ ...prev, [key]: value }));

  const onSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      const payload = toPayload(editing);
      if (editing._id) {
        await medicinesApi.update(editing._id, payload);
      } else {
        await medicinesApi.create(payload);
      }
      setEditing(null);
      refresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async () => {
    setIsDeleting(true);
    try {
      await medicinesApi.remove(deleting._id);
      setDeleting(null);
      refresh();
    } catch (err) {
      setFormError(err.message);
      setDeleting(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Medicines</h1>
          <p className="page-subtitle">Catalog of medicines across all pharmacies</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add Medicine
        </button>
      </div>

      <form className="toolbar" onSubmit={onSearchSubmit}>
        <SearchIcon />
        <input
          className="search-input"
          placeholder="Search medicines…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-outline btn-sm">
          Search
        </button>
      </form>

      <div className="card">
        {error && <ErrorBanner error={error} onRetry={refresh} />}
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="No medicines found" message="Add your first medicine to get started." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Pharmacy</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((medicine) => (
                    <tr key={medicine._id}>
                      <td>
                        {medicine.images?.[0] ? (
                          <img
                            src={medicine.images[0]}
                            alt=""
                            style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: 'var(--surface-2, #eee)',
                            }}
                          />
                        )}
                      </td>
                      <td>
                        <strong>{medicine.name}</strong>
                        {medicine.requiresPrescription && (
                          <span style={{ marginLeft: 6 }}>
                            <Badge variant="info">RX</Badge>
                          </span>
                        )}
                      </td>
                      <td>{medicine.category?.name || '—'}</td>
                      <td>{medicine.pharmacy?.name || '—'}</td>
                      <td>
                        {formatCurrency(medicine.discountPrice ?? medicine.price)}
                        {medicine.discountPrice != null && (
                          <span className="text-muted" style={{ textDecoration: 'line-through', marginLeft: 6, fontSize: 12 }}>
                            {formatCurrency(medicine.price)}
                          </span>
                        )}
                      </td>
                      <td>{medicine.stock}</td>
                      <td>
                        <Badge variant={medicine.isActive ? 'success' : 'neutral'}>
                          {medicine.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(medicine)}>
                            Edit
                          </button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleting(medicine)}>
                            Delete
                          </button>
                        </div>
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

      {editing && (
        <Modal title={editing._id ? 'Edit Medicine' : 'Add Medicine'} onClose={closeForm} width={560}>
          <form onSubmit={onSave}>
            {formError && <div className="error-banner">{formError}</div>}
            <div className="field">
              <label htmlFor="med-name">Name</label>
              <input id="med-name" required value={editing.name} onChange={(e) => onFormChange('name', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="med-description">Description</label>
              <textarea
                id="med-description"
                rows={3}
                value={editing.description}
                onChange={(e) => onFormChange('description', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="med-image">Image URL (optional)</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {editing.imageUrl && (
                  <img
                    src={editing.imageUrl}
                    alt=""
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      objectFit: 'cover',
                      border: '1px solid var(--border, #ddd)',
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      e.currentTarget.style.visibility = 'hidden';
                    }}
                  />
                )}
                <input
                  id="med-image"
                  placeholder="https://example.com/photo.jpg"
                  value={editing.imageUrl}
                  onChange={(e) => onFormChange('imageUrl', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="med-category">Category</label>
                <select
                  id="med-category"
                  required
                  value={editing.category}
                  onChange={(e) => onFormChange('category', e.target.value)}
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="med-pharmacy">Pharmacy</label>
                <select
                  id="med-pharmacy"
                  required
                  value={editing.pharmacy}
                  onChange={(e) => onFormChange('pharmacy', e.target.value)}
                >
                  <option value="" disabled>
                    Select pharmacy
                  </option>
                  {pharmacies.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="med-unit">Unit</label>
                <input
                  id="med-unit"
                  required
                  placeholder="e.g. 20 Tablets"
                  value={editing.unit}
                  onChange={(e) => onFormChange('unit', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="med-manufacturer">Manufacturer</label>
                <input
                  id="med-manufacturer"
                  value={editing.manufacturer}
                  onChange={(e) => onFormChange('manufacturer', e.target.value)}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="med-price">Price ($)</label>
                <input
                  id="med-price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={editing.price}
                  onChange={(e) => onFormChange('price', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="med-discount">Discount Price ($, optional)</label>
                <input
                  id="med-discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.discountPrice}
                  onChange={(e) => onFormChange('discountPrice', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="med-stock">Stock</label>
                <input
                  id="med-stock"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={editing.stock}
                  onChange={(e) => onFormChange('stock', e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="med-tags">Tags (comma-separated)</label>
              <input id="med-tags" value={editing.tags} onChange={(e) => onFormChange('tags', e.target.value)} />
            </div>
            <div className="field-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={editing.requiresPrescription}
                  onChange={(e) => onFormChange('requiresPrescription', e.target.checked)}
                />
                Requires prescription
              </label>
              {editing._id && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={editing.isActive}
                    onChange={(e) => onFormChange('isActive', e.target.checked)}
                  />
                  Active
                </label>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={closeForm} disabled={isSaving}>
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
          title="Delete Medicine"
          message={`Delete "${deleting.name}"? This cannot be undone.`}
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
