let scriptPromise = null;

export function loadGoogleScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Google 登入元件載入失敗"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

// Client-side only: decodes the identity token Google hands back so we can
// show the person's name / photo. This is NOT server-verified - fine for
// gating a local-only UI feature, not something to trust for real security.
export function decodeGoogleCredential(credential) {
  const payload = credential.split(".")[1];
  const json = decodeURIComponent(
    atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );

  const data = JSON.parse(json);

  return {
    name: data.name || "",
    email: data.email || "",
    picture: data.picture || "",
  };
}
