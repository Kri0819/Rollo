import { useState } from "react";
import { X } from "lucide-react";
import { supabase, supabaseReady } from "../utils/supabaseClient";
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

export default function LoginSheet({ onClose }) {
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
