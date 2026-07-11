export function CenterModal({ children, onClose, small = false }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`center-modal ${small ? "small" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function BottomSheet({ children, onClose }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmText,
  danger,
  onConfirm,
  onCancel,
}) {
  return (
    <CenterModal onClose={onCancel} small>
      <h2 className="confirm-title">{title}</h2>
      <p className="confirm-message">{message}</p>

      <div className="modal-actions two">
        <button className="secondary-btn" onClick={onCancel}>
          取消
        </button>

        <button
          className={danger ? "danger-btn" : "primary-btn"}
          onClick={onConfirm}
        >
          {confirmText || "確定"}
        </button>
      </div>
    </CenterModal>
  );
}
