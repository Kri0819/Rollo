import { Check, Pencil, Trash2 } from "lucide-react";
import { getUrgency, isCheckedToday } from "../utils/date";
import SwipeCard from "./SwipeCard";

export default function TodoCard({ task, tag, onCheck, onEdit, onDelete }) {
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
