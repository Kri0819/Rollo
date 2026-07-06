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
          <span className="switch-content">
            <Circle className="switch-icon" size={17} strokeWidth={2.4} />
            <span className="switch-label">待辦</span>
          </span>
        </button>

        <button
          className={`top-switch-item ${activeTab === "done" ? "active" : "compact"}`}
          onClick={() => onChangeTab("done")}
          aria-label="已完成"
        >
          <span className="switch-content">
            <CheckCircle2 className="switch-icon" size={17} strokeWidth={2.4} />
            <span className="switch-label">已完成</span>
          </span>
        </button>
      </div>
    </div>
  );
}
