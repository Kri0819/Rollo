import { Check, RotateCcw, Trash2 } from "lucide-react";
import SwipeCard from "./SwipeCard";

export default function DoneCard({ task, tag, onOpen, onRestore, onDelete }) {
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
            {tag ? <span className="tag">{tag.name}</span> : null}
          </div>
        </div>

        <div className="done-check">
          <Check size={17} strokeWidth={3} />
        </div>
      </article>
    </SwipeCard>
  );
}
