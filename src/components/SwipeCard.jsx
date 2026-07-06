import { useRef, useState } from "react";

export default function SwipeCard({ children, leftAction, rightAction }) {
  const [open, setOpen] = useState(false);
  const startX = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);

  function handleStart(clientX) {
    startX.current = clientX;
    dragging.current = true;
    moved.current = false;
  }

  function handleEnd(clientX) {
    if (!dragging.current) return;

    const delta = startX.current - clientX;

    if (delta > 35) {
      setOpen(true);
      moved.current = true;
    }

    if (delta < -35) {
      setOpen(false);
      moved.current = true;
    }

    dragging.current = false;

    window.setTimeout(() => {
      moved.current = false;
    }, 80);
  }

  function stopIfMoved(e) {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
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
        onClickCapture={stopIfMoved}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseUp={(e) => handleEnd(e.clientX)}
        onMouseLeave={(e) => {
          if (dragging.current) handleEnd(e.clientX);
        }}
      >
        {children}
      </div>
    </div>
  );
}
