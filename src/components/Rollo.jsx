import { useId } from "react";

export default function Rollo({
  size = 32,
  mood = "happy",
  showShadow = true,
  trail = false,
  className = "",
}) {
  const gradId = `rollo-grad-${useId()}`;

  const svgWidth = trail ? Math.round(size * 1.5) : size;
  const svgHeight = size;

  return (
    <svg
      viewBox={trail ? "0 0 170 110" : "0 0 100 100"}
      width={svgWidth}
      height={svgHeight}
      className={className}
      role="img"
      aria-label="滾滾"
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffb25a" />
          <stop offset="40%" stopColor="#fe9927" />
          <stop offset="100%" stopColor="#f5871f" />
        </radialGradient>
      </defs>

      {trail && (
        <>
          {/* trailing dashes under the ball */}
          <path
            d="M6 80 Q34 92 60 84"
            stroke="#fdd9a0"
            strokeWidth="4"
            strokeDasharray="1 10"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />

          {/* rising dashed path to the top right */}
          <path
            d="M90 70 Q116 84 130 62 Q140 46 149 27"
            stroke="#fea83d"
            strokeWidth="5"
            strokeDasharray="1 11"
            strokeLinecap="round"
            fill="none"
          />

          <circle cx="116" cy="74" r="7" fill="#e0b782" />
          <circle cx="138" cy="45" r="9" fill="#e0b782" />
          <circle cx="155" cy="20" r="10" fill="none" stroke="#fea83d" strokeWidth="6" />
        </>
      )}

      {showShadow && (
        <ellipse
          cx={trail ? 58 : 50}
          cy={trail ? 100 : 93}
          rx="27"
          ry="5"
          fill="#fedca6"
        />
      )}

      <circle cx={trail ? 58 : 50} cy={trail ? 53 : 48} r="42" fill={`url(#${gradId})`} />

      <path
        d={trail ? "M38 33 Q30 44 34 61" : "M20 28 Q13 44 17 62"}
        stroke="#fff6e5"
        strokeWidth="7.5"
        strokeLinecap="round"
        fill="none"
      />

      {mood === "sleepy" ? (
        <g transform={trail ? "translate(8, 5)" : ""}>
          <path
            d="M33 48 Q38 43 43 48"
            stroke="#4a3c2e"
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M57 48 Q62 43 67 48"
            stroke="#4a3c2e"
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M42 62 Q50 65 58 62"
            stroke="#4a3c2e"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ) : (
        <g transform={trail ? "translate(8, 5)" : ""}>
          <ellipse cx="39" cy="50" rx="4.2" ry="6" fill="#4a3c2e" />
          <ellipse cx="61" cy="50" rx="4.2" ry="6" fill="#4a3c2e" />
          <path
            d="M40 62 Q50 70 60 62"
            stroke="#4a3c2e"
            strokeWidth="3.6"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
}
