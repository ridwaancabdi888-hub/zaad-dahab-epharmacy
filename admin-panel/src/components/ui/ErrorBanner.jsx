export default function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="error-banner flex-between">
      <span>{error.message || 'Something went wrong.'}</span>
      {onRetry && (
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
