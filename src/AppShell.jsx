import { CheckCircle2, Circle, Settings } from "lucide-react";
import { tagColorKey } from "./lib";
import Rollo from "./Rollo";

export function Header({ onOpenSettings }) {
  return (
    <header className="topbar">
      <div className="brand">
        <Rollo size={30} mood="happy" showShadow={false} trail className="brand-ball" />
        <h1 className="brand-name">滾滾</h1>
      </div>

      <button className="icon-btn" onClick={onOpenSettings} aria-label="設定">
        <Settings size={20} />
      </button>
    </header>
  );
}

export function TopSwitch({ activeTab, onChangeTab }) {
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

export function TagFilter({ tags, activeId, onChange, locked, onLocked }) {
  if (!tags.length) return null;

  function handleClick(nextId) {
    if (locked) {
      onLocked?.();
      return;
    }
    onChange(nextId);
  }

  return (
    <div className={`tag-filter ${locked ? "locked" : ""}`}>
      <button
        className={`tag-filter-chip ${activeId === null ? "active" : ""}`}
        onClick={() => handleClick(null)}
      >
        全部
      </button>

      {tags.map((tag) => (
        <button
          key={tag.id}
          className={`tag-filter-chip tag-${tagColorKey(tag.id)} ${
            activeId === tag.id ? "active" : ""
          }`}
          onClick={() => handleClick(activeId === tag.id ? null : tag.id)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, subtitle }) {
  return (
    <div className="empty">
      <div className="empty-ball-wrap">
        <Rollo size={64} mood="sleepy" trail />
      </div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}
