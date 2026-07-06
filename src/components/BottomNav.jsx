export default function BottomNav({ activeTab, onChangeTab }) {
  return (
    <nav className="tabs">
      <button
        className={activeTab === "todo" ? "active" : ""}
        onClick={() => onChangeTab("todo")}
      >
        待辦
      </button>

      <button
        className={activeTab === "done" ? "active" : ""}
        onClick={() => onChangeTab("done")}
      >
        已完成
      </button>
    </nav>
  );
}
