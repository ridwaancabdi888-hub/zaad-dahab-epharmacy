export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.total === 0) return null;
  const { page, totalPages, total } = meta;

  return (
    <div className="pagination">
      <span>
        Page {page} of {Math.max(totalPages, 1)} &middot; {total} total
      </span>
      <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
