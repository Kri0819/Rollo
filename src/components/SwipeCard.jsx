import { useRef, useState } from "react";

export default function SwipeCard({ children, leftAction, rightAction }) {
  const [open, setOpen] = useState(false);
  const startX = useRef(0);

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    const endX = e.changedTouches[0].clientX;

    if (startX.current - endX > 40) setOpen(true);
    if (endX - startX.current > 40) setOpen(false);
  }

  return (
    <div className={`swipe-wrap ${open ? "open" : ""}`}>
      <div className="swipe-actions">
        <button
          className="swipe-btn edit"
          onClick={(e) => {
            e.stopPropagation();
            leftAction.onClick();
            setOpen(false);
          }}
          aria-label={leftAction.label}
        >
          {leftAction.icon}
        </button>

        <button
          className={`swipe-btn ${rightAction.danger ? "delete" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            rightAction.onClick();
            setOpen(false);
          }}
          aria-label={rightAction.label}
        >
          {rightAction.icon}
        </button>
      </div>

      <div
        className="swipe-content"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onDoubleClick={() => setOpen((value) => !value)}
      >
        {children}
      </div>
    </div>
  );
}
