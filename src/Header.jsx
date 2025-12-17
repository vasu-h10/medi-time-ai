// src/Header.jsx
import "./styles/header.css";

export default function Header() {
  return (
    <header className="app-header">
      <svg
        className="app-logo"
        width="40"
        height="40"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="leftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#66BB6A" />
            <stop offset="100%" stopColor="#388E3C" />
          </linearGradient>

          <linearGradient id="rightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB74D" />
            <stop offset="100%" stopColor="#F57C00" />
          </linearGradient>
        </defs>

        <g transform="rotate(-30 256 256)">
          <rect
            x="50"
            y="200"
            width="412"
            height="112"
            rx="56"
            ry="56"
            fill="url(#leftGradient)"
          />
          <clipPath id="rightHalf">
            <rect x="256" y="200" width="206" height="112" />
          </clipPath>
          <rect
            x="50"
            y="200"
            width="412"
            height="112"
            rx="56"
            ry="56"
            fill="url(#rightGradient)"
            clipPath="url(#rightHalf)"
          />
          <line
            x1="256"
            y1="200"
            x2="256"
            y2="312"
            stroke="#fff"
            strokeWidth="4"
          />
        </g>
      </svg>

      <h2 className="app-title">Medi-Time</h2>
    </header>
  );
}