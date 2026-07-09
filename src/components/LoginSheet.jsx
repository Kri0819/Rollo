import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { GOOGLE_CLIENT_ID } from "../constants/defaults";
import { decodeGoogleCredential, loadGoogleScript } from "../utils/googleAuth";
import { BottomSheet } from "./Modal";
import Rollo from "./Rollo";

export default function LoginSheet({ onClose, onSuccess }) {
  const buttonRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError("尚未設定 Google Client ID，請洽開發者完成設定。");
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then((google) => {
        if (cancelled || !buttonRef.current) return;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            try {
              onSuccess(decodeGoogleCredential(response.credential));
            } catch {
              setError("登入失敗，請再試一次。");
            }
          },
        });

        google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 300,
        });
      })
      .catch(() => setError("Google 登入元件載入失敗，請檢查網路連線。"));

    return () => {
      cancelled = true;
    };
  }, [onSuccess]);

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

        <div className="google-btn-slot" ref={buttonRef} />

        {error && <p className="login-error">{error}</p>}

        <p className="login-disclaimer">
          使用 Google 帳號登入，不需要密碼、不需要信箱驗證連結。
        </p>
      </div>
    </BottomSheet>
  );
}
