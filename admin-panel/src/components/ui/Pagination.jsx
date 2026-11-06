import { clampPage, normalizeTotalPages } from '../../utils/pagination.js';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.total === 0) return null;
  const totalPages = normalizeTotalPages(meta.totalPages);
  const page = clampPage(meta.page, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span aria-live="polite" aria-atomic="true">
        Page {page} of {totalPages} &middot; {meta.total} total
      </span>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        aria-label="Go to previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        aria-label="Go to next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
