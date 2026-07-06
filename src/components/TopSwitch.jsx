import { CheckCircle2, Circle } from "lucide-react";

export default function TopSwitch({ activeTab, onChangeTab }) {
  const doneActive = activeTab === "done";

  return (
    <div className="top-switch-wrap">
      <div className={`top-switch ${doneActive ? "done-active" : "todo-active"}`}>
        <span className="top-switch-slider" />

        <button
          className={`top-switch-item ${activeTab === "todo" ? "active" : ""}`}
          onClick={() => onChangeTab("todo")}
          aria-label="待辦"
        >
          {activeTab === "todo" ? <span>待辦</span> : <Circle size={18} />}
        </button>

        <button
          className={`top-switch-item ${activeTab === "done" ? "active" : ""}`}
          onClick={() => onChangeTab("done")}
          aria-label="已完成"
        >
          {activeTab === "done" ? <span>已完成</span> : <CheckCircle2 size={18} />}
        </button>
      </div>
    </div>
  );
}
