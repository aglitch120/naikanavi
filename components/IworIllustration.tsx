/**
 * iwor イラスト — 幾何学的な山と川
 * フェードアウトする端（四角い境界なし）
 */
export function IworIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 300"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        {/* 端をフェードアウト */}
        <radialGradient id="iwor-fade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="70%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="iwor-mask">
          <rect width="800" height="300" fill="url(#iwor-fade)" />
        </mask>
      </defs>

      <g mask="url(#iwor-mask)">
        {/* 遠景の山 */}
        <polygon points="0,220 120,120 240,220" fill="#1B4F3A" opacity="0.05" />
        <polygon points="160,220 320,90 480,220" fill="#1B4F3A" opacity="0.07" />
        <polygon points="400,220 560,100 720,220" fill="#1B4F3A" opacity="0.04" />
        <polygon points="600,220 740,130 800,180 800,220" fill="#1B4F3A" opacity="0.06" />

        {/* 幾何学的な木 — 三角形 */}
        <polygon points="60,220 80,160 100,220" fill="#1B4F3A" opacity="0.10" />
        <polygon points="90,220 115,150 140,220" fill="#1B4F3A" opacity="0.08" />
        <polygon points="30,220 50,170 70,220" fill="#1B4F3A" opacity="0.06" />
        <polygon points="120,220 140,175 160,220" fill="#1B4F3A" opacity="0.07" />

        <polygon points="340,220 365,140 390,220" fill="#1B4F3A" opacity="0.09" />
        <polygon points="370,220 400,130 430,220" fill="#1B4F3A" opacity="0.07" />
        <polygon points="420,220 445,155 470,220" fill="#1B4F3A" opacity="0.10" />

        <polygon points="620,220 645,155 670,220" fill="#1B4F3A" opacity="0.08" />
        <polygon points="660,220 690,140 720,220" fill="#1B4F3A" opacity="0.10" />
        <polygon points="710,220 735,165 760,220" fill="#1B4F3A" opacity="0.06" />
        <polygon points="750,220 770,170 790,220" fill="#1B4F3A" opacity="0.08" />

        {/* 川 */}
        <path
          d="M0,240 Q100,230 200,245 Q350,260 500,238 Q650,215 800,240 L800,260 Q650,235 500,258 Q350,280 200,265 Q100,250 0,260Z"
          fill="#1B4F3A"
          opacity="0.05"
        />
        <path
          d="M0,255 Q150,248 300,258 Q500,270 700,250 L800,252 L800,258 Q700,256 500,276 Q300,264 150,254 L0,261Z"
          fill="#1B4F3A"
          opacity="0.03"
        />

        {/* 地面ライン */}
        <line x1="0" y1="220" x2="800" y2="220" stroke="#1B4F3A" strokeWidth="0.5" opacity="0.08" />
      </g>
    </svg>
  )
}
