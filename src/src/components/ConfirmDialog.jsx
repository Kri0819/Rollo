import { CenterModal } from "./Modal";

export default function ConfirmDialog({
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
