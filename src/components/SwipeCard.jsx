import { useMemo, useRef, useState } from "react";

export default function SwipeCard({ children, leftAction, rightAction }) {
  const [open, setOpen] = useState(false);
  const startX = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);

  const actions = useMemo(() => {
    return [leftAction, rightAction].filter(Boolean);
  }, [leftAction, rightAction]);

  const openDistance = actions.length === 1 ? 58 : 116;

  function handleStart(clientX) {
    startX.current = clientX;
    dragging.current = true;
    moved.current = false;
  }

  function handleEnd(clientX) {
    if (!dragging.current) return;

    const delta = startX.current - clientX;

    if (delta > 35 && actions.length > 0) {
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
    <div
      className={`swipe-wrap ${open ? "open" : ""}`}
      style={{ "--swipe-open-distance": `-${openDistance}px` }}
      data-action-count={actions.length}
    >
      <div className="swipe-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            className={`swipe-btn ${action.danger ? "delete" : "edit"}`}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              setOpen(false);
            }}
            aria-label={action.label}
          >
            {action.icon}
          </button>
        ))}
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
