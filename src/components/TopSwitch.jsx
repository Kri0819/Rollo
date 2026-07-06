import { CheckCircle2, Circle } from "lucide-react";

export default function TopSwitch({ activeTab, onChangeTab }) {
  const todoActive = activeTab === "todo";
  const doneActive = activeTab === "done";

  return (
    <div className="top-switch-wrap">
      <div className="top-switch">
        <button
          className={`top-switch-item ${todoActive ? "active" : "compact"}`}
          onClick={() => onChangeTab("todo")}
          aria-label="待辦"
        >
          {todoActive ? (
            <span>待辦</span>
          ) : (
            <Circle size={18} strokeWidth={2.4} />
          )}
        </button>

        <button
          className={`top-switch-item ${doneActive ? "active" : "compact"}`}
          onClick={() => onChangeTab("done")}
          aria-label="已完成"
        >
          {doneActive ? (
            <span>已完成</span>
          ) : (
            <CheckCircle2 size={18} strokeWidth={2.4} />
          )}
        </button>
      </div>
    </div>
  );
}
