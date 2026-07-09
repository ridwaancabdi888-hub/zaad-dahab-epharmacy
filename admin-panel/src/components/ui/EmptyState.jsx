export default function EmptyState({ title = 'Nothing here yet', message }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {message && <span>{message}</span>}
    </div>
  );
}
