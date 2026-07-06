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
