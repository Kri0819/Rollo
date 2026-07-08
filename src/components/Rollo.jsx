import { useId } from "react";

export default function Rollo({ size = 32, mood = "happy", showShadow = true, className = "" }) {
  const gradId = `rollo-grad-${useId()}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="滾滾"
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f6c070" />
          <stop offset="45%" stopColor="#e8923f" />
          <stop offset="100%" stopColor="#d86d3d" />
        </radialGradient>
      </defs>

      {showShadow && (
        <ellipse cx="50" cy="93" rx="27" ry="5" fill="rgba(47, 36, 20, 0.14)" />
      )}

      <circle cx="50" cy="48" r="42" fill={`url(#${gradId})`} />

      <path
        d="M28 34 Q22 45 25 59"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {mood === "sleepy" ? (
        <>
          <path
            d="M33 48 Q38 43 43 48"
            stroke="#3a2c22"
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M57 48 Q62 43 67 48"
            stroke="#3a2c22"
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M42 62 Q50 65 58 62"
            stroke="#3a2c22"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <ellipse cx="39" cy="50" rx="4.2" ry="6" fill="#3a2c22" />
          <ellipse cx="61" cy="50" rx="4.2" ry="6" fill="#3a2c22" />
          <path
            d="M40 62 Q50 70 60 62"
            stroke="#3a2c22"
            strokeWidth="3.6"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}
