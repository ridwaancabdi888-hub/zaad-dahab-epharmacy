import Modal from './Modal';

export default function ConfirmDialog({ title = 'Are you sure?', message, confirmLabel = 'Confirm', danger, onConfirm, onCancel, isWorking }) {
  return (
    <Modal title={title} onClose={onCancel} width={420}>
      <p className="text-muted">{message}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={isWorking}>
          Cancel
        </button>
        <button
          type="button"
          className={danger ? 'btn btn-danger' : 'btn btn-primary'}
          onClick={onConfirm}
          disabled={isWorking}
        >
          {isWorking ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
