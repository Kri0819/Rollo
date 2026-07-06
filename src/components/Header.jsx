import { Settings } from "lucide-react";

export default function Header({ onOpenSettings }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-ball" />
        <div>
          <h1>滾滾</h1>
          <p>Rollo</p>
        </div>
      </div>

      <button className="icon-btn" onClick={onOpenSettings} aria-label="設定">
        <Settings size={20} />
      </button>
    </header>
  );
}
