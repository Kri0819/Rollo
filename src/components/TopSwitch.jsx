import { CheckCircle2, Circle } from "lucide-react";

export default function TopSwitch({ activeTab, onChangeTab }) {
  return (
    <div className="top-switch-wrap">
      <div className="top-switch">
        <button
          className={`top-switch-item ${activeTab === "todo" ? "active" : "compact"}`}
          onClick={() => onChangeTab("todo")}
          aria-label="待辦"
        >
          {activeTab === "todo" ? <span>待辦</span> : <Circle size={18} />}
        </button>

        <button
          className={`top-switch-item ${activeTab === "done" ? "active" : "compact"}`}
          onClick={() => onChangeTab("done")}
          aria-label="已完成"
        >
          {activeTab === "done" ? <span>已完成</span> : <CheckCircle2 size={18} />}
        </button>
      </div>
    </div>
  );
}
