import { useState } from "react";
import { Moon, Pencil, Sun, Trash2, X } from "lucide-react";
import { MAX_TAGS } from "../constants/defaults";
import { BottomSheet } from "./Modal";

export default function SettingsSheet({
  theme,
  setTheme,
  tags,
  setTags,
  onAddTag,
  onLogout,
  onExportData,
  onClose,
}) {
  const [screen, setScreen] = useState("main");
  const [newTag, setNewTag] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  function removeTag(id) {
    setTags((prev) => prev.filter((tag) => tag.id !== id));
  }

  function startEdit(tag) {
    setEditingId(tag.id);
    setEditingName(tag.name);
  }

  function commitEdit() {
    const clean = editingName.trim();

    if (editingId && clean) {
      setTags((prev) =>
        prev.map((tag) =>
          tag.id === editingId ? { ...tag, name: clean } : tag
        )
      );
    }

    setEditingId(null);
    setEditingName("");
  }

  function handleAddTag() {
    const ok = onAddTag(newTag);
    if (ok) setNewTag("");
  }

  const title =
    screen === "main" ? "設定" : screen === "tags" ? "編輯標籤" : "關於";

  return (
    <BottomSheet onClose={onClose}>
      <div className="settings-head">
        <h2>{title}</h2>
        <button className="settings-close" onClick={onClose} aria-label="關閉">
          <X size={22} />
        </button>
      </div>

      {screen === "main" && (
        <div className="settings-body">
          <section className="settings-section">
            <p className="settings-section-title">帳號</p>

            <div className="settings-account-card">
              <div className="settings-avatar">R</div>
              <div className="settings-account-name">Rollo 本機版</div>
              <div className="settings-account-sub">本機帳號</div>
            </div>
          </section>

          <section className="settings-section">
            <p className="settings-section-title">外觀</p>

            <div className="settings-appearance-card">
              <span>外觀</span>

              <div className="mini-theme-toggle">
                <button
                  className={theme === "light" ? "active" : ""}
                  onClick={() => setTheme("light")}
                >
                  <Sun size={15} />
                  淺色
                </button>

                <button
                  className={theme === "dark" ? "active" : ""}
                  onClick={() => setTheme("dark")}
                >
                  <Moon size={15} />
                  深色
                </button>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <p className="settings-section-title">標籤</p>

            <button className="settings-list-row" onClick={() => setScreen("tags")}>
              <span>編輯標籤</span>
              <span className="settings-row-right">
                {tags.length} 個
                <span className="settings-chevron">›</span>
              </span>
            </button>
          </section>

          <section className="settings-section">
            <p className="settings-section-title">其他</p>

            <button className="settings-list-row" onClick={() => setScreen("about")}>
              <span>關於</span>
              <span className="settings-chevron">›</span>
            </button>

            <button className="settings-list-row" onClick={onExportData}>
              <span>匯出本機備份</span>
              <span className="settings-chevron">›</span>
            </button>

            <button className="settings-logout-row" onClick={onLogout}>
              登出
            </button>
          </section>
        </div>
      )}

      {screen === "tags" && (
        <div className="settings-body">
          <button className="settings-back" onClick={() => setScreen("main")}>
            ← 返回設定
          </button>

          <p className="settings-section-title">
            目前的標籤（{tags.length}/{MAX_TAGS}）
          </p>

          <div className="tag-manage-list">
            {tags.map((tag) => (
              <div className="tag-manage-row" key={tag.id}>
                {editingId === tag.id ? (
                  <input
                    className="tag-edit-input"
                    value={editingName}
                    autoFocus
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                    }}
                  />
                ) : (
                  <span className="tag-name-display">{tag.name}</span>
                )}

                <div className="tag-manage-actions">
                  <button onClick={() => startEdit(tag)} aria-label="編輯標籤">
                    <Pencil size={18} />
                  </button>

                  <button
                    className="danger"
                    onClick={() => removeTag(tag.id)}
                    aria-label="刪除標籤"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="settings-section-title add-title">新增標籤</p>

          <div className="settings-add-tag-row">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="標籤名稱"
              maxLength={12}
            />

            <button
              onClick={handleAddTag}
              disabled={!newTag.trim() || tags.length >= MAX_TAGS}
            >
              新增
            </button>
          </div>
        </div>
      )}

      {screen === "about" && (
        <div className="settings-body">
          <button className="settings-back" onClick={() => setScreen("main")}>
            ← 返回設定
          </button>

          <div className="about-card">
            <div className="about-ball" />
            <h3>滾滾 Rollo</h3>
            <p>會自己滾到明天的待辦清單。</p>
            <p className="about-version">v0.1.10</p>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
