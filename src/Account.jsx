import { useState } from "react";
import { Moon, Pencil, Sun, Trash2, X } from "lucide-react";
import { APP_VERSION, MAX_TAGS, supabase, supabaseReady, tagColorKey } from "./lib";
import { BottomSheet } from "./Modal";
import Rollo from "./Rollo";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

export function LoginSheet({ onClose }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!supabaseReady) {
      setError("尚未設定 Supabase 連線，請洽開發者完成設定。");
      return;
    }

    setPending(true);
    setError("");

    sessionStorage.setItem("rollo:post-login", "settings");

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

    if (authError) {
      setPending(false);
      setError("登入失敗，請再試一次。");
      sessionStorage.removeItem("rollo:post-login");
    }
    // On success the browser navigates away to Google, then back - no
    // further action needed here.
  }

  return (
    <BottomSheet onClose={onClose}>
      <div className="settings-head">
        <h2>登入 Rollo｜滾滾</h2>
        <button className="settings-close" onClick={onClose} aria-label="關閉">
          <X size={22} />
        </button>
      </div>

      <div className="login-body">
        <div className="login-intro">
          <Rollo size={40} mood="happy" showShadow={false} />
          <div>
            <p className="login-title">Rollo｜滾滾</p>
            <p className="login-sub">用 Google 一鍵登入</p>
          </div>
        </div>

        <button className="google-login-btn" onClick={handleLogin} disabled={pending}>
          <GoogleMark />
          {pending ? "跳轉中…" : "Continue with Google"}
        </button>

        {error && <p className="login-error">{error}</p>}

        <p className="login-disclaimer">
          使用 Google 帳號登入，不需要密碼、不需要信箱驗證連結。
        </p>
      </div>
    </BottomSheet>
  );
}

export function SettingsSheet({
  account,
  theme,
  setTheme,
  tags,
  onAddTag,
  onRenameTag,
  onDeleteTag,
  onLogout,
  onExportJSON,
  onExportCSV,
  onClose,
}) {
  const [screen, setScreen] = useState("main");
  const [newTag, setNewTag] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  function startEdit(tag) {
    setEditingId(tag.id);
    setEditingName(tag.name);
  }

  function commitEdit() {
    const clean = editingName.trim();

    if (editingId && clean) {
      onRenameTag(editingId, clean);
    }

    setEditingId(null);
    setEditingName("");
  }

  async function handleAddTag() {
    const ok = await onAddTag(newTag);
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
                    onClick={() => onDeleteTag(tag.id)}
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
            <Rollo size={56} mood="happy" showShadow={false} trail className="about-ball" />
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
