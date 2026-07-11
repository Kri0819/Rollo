import { useMemo, useRef, useState } from "react";
import { Check, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { getUrgency, isCheckedToday, tagColorKey } from "./lib";
import { EmptyState } from "./AppShell";

export function SwipeCard({ children, leftAction, rightAction }) {
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

export function TodoCard({ task, tag, onCheck, onEdit, onDelete }) {
  const urgency = getUrgency(task);
  const checked = isCheckedToday(task);

  return (
    <SwipeCard
      leftAction={
        checked
          ? null
          : {
              label: "編輯",
              icon: <Pencil size={18} />,
              onClick: () => onEdit(task),
            }
      }
      rightAction={{
        label: "刪除",
        icon: <Trash2 size={18} />,
        onClick: () => onDelete(task),
        danger: true,
      }}
    >
      <article
        className={`task-card todo-card ${checked ? "checked" : ""}`}
        onClick={() => onCheck(task)}
      >
        <div className="task-main">
          <div className="task-line">
            <h2
              className={`task-title ${
                checked ? "checked-title" : `urgency-${urgency.level}`
              }`}
            >
              {task.title}
            </h2>

            {tag ? (
              <span className={`tag tag-${tagColorKey(tag.id)}`}>{tag.name}</span>
            ) : null}
          </div>

          <p className="task-note">{task.note || " "}</p>
        </div>

        <div className={`task-side ${checked ? "checked-side" : ""}`}>
          {!checked && urgency.text ? (
            <div className={`urgency-text urgency-${urgency.level}`}>
              {urgency.text}
            </div>
          ) : null}

          <div className={`check-circle ${checked ? "checked" : ""}`}>
            {checked ? <Check size={15} strokeWidth={3} /> : null}
          </div>
        </div>
      </article>
    </SwipeCard>
  );
}

export function DoneCard({ task, tag, onOpen, onRestore, onDelete }) {
  return (
    <SwipeCard
      leftAction={{
        label: "復原",
        icon: <RotateCcw size={18} />,
        onClick: () => onRestore(task),
      }}
      rightAction={{
        label: "刪除",
        icon: <Trash2 size={18} />,
        onClick: () => onDelete(task),
        danger: true,
      }}
    >
      <article className="task-card done-card" onClick={() => onOpen(task)}>
        <div className="task-main">
          <div className="task-line">
            <h2 className="task-title done-title">{task.title}</h2>
            {tag ? (
              <span className={`tag tag-${tagColorKey(tag.id)}`}>{tag.name}</span>
            ) : null}
          </div>
        </div>

        <div className="done-check">
          <Check size={17} strokeWidth={3} />
        </div>
      </article>
    </SwipeCard>
  );
}

export function TodoPage({ tasks, tagMap, hasFilter, onCheck, onEdit, onDelete }) {
  if (!tasks.length) {
    return hasFilter ? (
      <EmptyState
        title="這個標籤沒有待辦事項"
        subtitle="換個標籤看看，或新增一件事吧"
      />
    ) : (
      <EmptyState
        title="待辦清單空空的"
        subtitle="新增一件事，讓它開始每天滾動吧"
      />
    );
  }

  return (
    <div className="list">
      {tasks.map((task) => (
        <TodoCard
          key={task.id}
          task={task}
          tag={tagMap[task.tagId]}
          onCheck={onCheck}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export function DonePage({ tasks, tagMap, hasFilter, onOpen, onRestore, onDelete }) {
  if (!tasks.length) {
    return hasFilter ? (
      <EmptyState
        title="這個標籤還沒有完成的事項"
        subtitle="換個標籤看看，或先去待辦頁打勾吧"
      />
    ) : (
      <EmptyState
        title="還沒有完成的事項"
        subtitle="今天打勾的事情，明天會滾到這裡"
      />
    );
  }

  return (
    <div className="list">
      {tasks.map((task) => (
        <DoneCard
          key={task.id}
          task={task}
          tag={tagMap[task.tagId]}
          onOpen={onOpen}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
