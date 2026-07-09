import { useState } from "react";
import { Moon, Pencil, Sun, Trash2, X } from "lucide-react";
import { APP_VERSION, MAX_TAGS } from "../constants/defaults";
import { tagColorKey } from "../utils/tagColor";
import { BottomSheet } from "./Modal";
import Rollo from "./Rollo";

export default function SettingsSheet({
  account,
  theme,
  setTheme,
  tags,
  setTags,
  onAddTag,
  onLogout,
  onExportJSON,
  onExportCSV,
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

  const titles = {
    main: "設定",
    tags: "編輯標籤",
    export: "匯出資料",
    about: "關於",
    terms: "使用條款",
    privacy: "隱私權政策",
    contact: "聯絡作者",
  };

  return (
    <BottomSheet onClose={onClose}>
      <div className="settings-head">
        <h2>{titles[screen]}</h2>
        <button className="settings-close" onClick={onClose} aria-label="關閉">
          <X size={22} />
        </button>
      </div>

      {screen === "main" && (
        <div className="settings-body">
          <section className="settings-section">
            <p className="settings-section-title">帳號</p>

            <div className="settings-account-card">
              {account?.picture ? (
                <img className="settings-avatar-img" src={account.picture} alt="" />
              ) : (
                <div className="settings-avatar">
                  <Rollo size={22} mood="happy" showShadow={false} />
                </div>
              )}
              <div className="settings-account-name">{account?.name || "滾滾"}</div>
              <div className="settings-account-sub">雲端帳號</div>
            </div>
          </section>

          <section className="settings-section">
            <p className="settings-section-title">顯示</p>

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
            <p className="settings-section-title">資料管理</p>

            <button className="settings-list-row" onClick={() => setScreen("tags")}>
              <span>編輯標籤</span>
              <span className="settings-row-right">
                {tags.length} 個
                <span className="settings-chevron">›</span>
              </span>
            </button>

            <button className="settings-list-row" onClick={() => setScreen("export")}>
              <span>匯出資料</span>
              <span className="settings-row-right">
                JSON / CSV
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
          </section>

          <section className="settings-section">
            <button className="settings-logout-row" onClick={onLogout}>
              登出
            </button>
          </section>

          <div className="settings-footer">
            <p className="settings-footer-name">Rollo｜滾滾</p>
            <p className="settings-footer-version">Version {APP_VERSION}</p>
            <div className="settings-footer-links">
              <button onClick={() => setScreen("terms")}>使用條款</button>
              <span className="settings-footer-dot">·</span>
              <button onClick={() => setScreen("privacy")}>隱私權政策</button>
              <span className="settings-footer-dot">·</span>
              <button onClick={() => setScreen("contact")}>聯絡作者</button>
            </div>
          </div>
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
                  <span className="tag-name-display">
                    <span className={`tag-dot tag-dot-${tagColorKey(tag.id)}`} />
                    {tag.name}
                  </span>
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

      {screen === "export" && (
        <div className="settings-body">
          <button className="settings-back" onClick={() => setScreen("main")}>
            ← 返回設定
          </button>

          <p className="settings-section-title">選擇匯出格式</p>

          <button className="settings-list-row" onClick={onExportJSON}>
            <span>匯出為 JSON</span>
            <span className="settings-row-right">完整備份</span>
          </button>

          <button className="settings-list-row" onClick={onExportCSV}>
            <span>匯出為 CSV</span>
            <span className="settings-row-right">可用 Excel 開啟</span>
          </button>
        </div>
      )}

      {screen === "about" && (
        <div className="settings-body">
          <button className="settings-back" onClick={() => setScreen("main")}>
            ← 返回設定
          </button>

          <div className="about-card">
            <Rollo size={64} mood="happy" showShadow={false} className="about-ball" />
            <h3>Rollo｜滾滾</h3>
            <p>會自己滾到明天的待辦清單。</p>
            <p className="about-version">v{APP_VERSION}</p>
          </div>
        </div>
      )}

      {(screen === "terms" || screen === "privacy") && (
        <div className="settings-body">
          <button className="settings-back" onClick={() => setScreen("main")}>
            ← 返回設定
          </button>

          <div className="about-card legal-card">
            <p>
              滾滾目前是一個資料只存在你這台裝置上的個人小工具，尚未提供正式的
              {screen === "terms" ? "使用條款" : "隱私權政策"}內容。
            </p>
            <p>之後如果有正式版本，會更新在這裡。</p>
          </div>
        </div>
      )}

      {screen === "contact" && (
        <div className="settings-body">
          <button className="settings-back" onClick={() => setScreen("main")}>
            ← 返回設定
          </button>

          <div className="about-card legal-card">
            <p>有任何想法或問題，歡迎跟作者說一聲。</p>
            <a className="settings-list-row" href="mailto:hello@example.com">
              <span>寄信給作者</span>
              <span className="settings-chevron">›</span>
            </a>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
