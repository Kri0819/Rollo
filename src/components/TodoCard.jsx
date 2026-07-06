import { useRef } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { getUrgency, isCheckedToday } from "../utils/date";
import SwipeCard from "./SwipeCard";

export default function TodoCard({
  task,
  tag,
  onCheck,
  onUncheck,
  onEdit,
  onDelete,
}) {
  const urgency = getUrgency(task);
  const checked = isCheckedToday(task);
  const longPressTimer = useRef(null);
  const longPressed = useRef(false);

  function startPress() {
    longPressed.current = false;

    if (!checked) return;

    longPressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      onUncheck(task);
    }, 520);
  }

  function endPress() {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleClick() {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }

    onCheck(task);
  }

  return (
    <SwipeCard
      leftAction={{
        label: "編輯",
        icon: <Pencil size={18} />,
        onClick: () => onEdit(task),
      }}
      rightAction={{
        label: "刪除",
        icon: <Trash2 size={18} />,
        onClick: () => onDelete(task),
        danger: true,
      }}
    >
      <article
        className={`task-card todo-card ${checked ? "checked" : ""}`}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onPointerLeave={endPress}
        onClick={handleClick}
      >
        <div className="task-main">
          <div className="task-line">
            <h2
              className={`task-title urgency-${urgency.level} ${
                checked ? "checked-title" : ""
              }`}
            >
              {task.title}
            </h2>

            {tag ? <span className="tag">{tag.name}</span> : null}
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
