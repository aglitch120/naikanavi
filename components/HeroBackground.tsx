'use client'

// 山と川のnature背景 — /aboutベースのポリゴン山 + アニメーション
// 鳥: 横向きシルエット（ミニマル）、川: 流れが分かるアニメーション
// ホーム画面 + /about で共有

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -mx-4 md:-mx-8" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 300"
        fill="none"
        preserveAspectRatio="xMidYEnd slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="hero-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="65%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="hero-mask">
            <rect width="800" height="300" fill="url(#hero-fade)" />
          </mask>
          <linearGradient id="hero-river" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1B4F3A" stopOpacity="0" />
            <stop offset="20%" stopColor="#1B4F3A" stopOpacity="0.08" />
            <stop offset="80%" stopColor="#1B4F3A" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1B4F3A" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-river2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1B4F3A" stopOpacity="0" />
            <stop offset="30%" stopColor="#1B4F3A" stopOpacity="0.05" />
            <stop offset="70%" stopColor="#1B4F3A" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#1B4F3A" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g mask="url(#hero-mask)">

          {/* ═══ 遠景の大きな山 ═══ */}
          <polygon points="0,220 120,120 240,220" fill="#1B4F3A" opacity="0.05" />
          <polygon points="160,220 320,90 480,220" fill="#1B4F3A" opacity="0.07" />
          <polygon points="400,220 560,100 720,220" fill="#1B4F3A" opacity="0.04" />
          <polygon points="600,220 740,130 800,180 800,220" fill="#1B4F3A" opacity="0.06" />

          {/* ═══ 中景の峰々 ═══ */}
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

          {/* ═══ 地平線 ═══ */}
          <line x1="0" y1="220" x2="800" y2="220" stroke="#1B4F3A" strokeWidth="0.5" opacity="0.08" />

          {/* ═══ 川（アニメーション強化） ═══ */}
          {/* メインの川面 */}
          <path
            d="M0,238 Q100,228 200,242 Q350,258 500,235 Q650,212 800,238 L800,258 Q650,232 500,255 Q350,278 200,262 Q100,248 0,258Z"
            fill="#1B4F3A"
            opacity="0.06"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -30,3; 0,0"
              dur="5s"
              repeatCount="indefinite"
            />
          </path>
          {/* 第2の波 */}
          <path
            d="M0,250 Q150,242 300,255 Q500,268 700,248 L800,250 L800,262 Q700,254 500,274 Q300,262 150,252 L0,262Z"
            fill="#1B4F3A"
            opacity="0.04"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 25,-2; 0,0"
              dur="7s"
              repeatCount="indefinite"
            />
          </path>

          {/* 川のストローク線（流れの質感）×3本 */}
          <path
            d="M-100,240 Q100,230 300,245 Q500,260 700,238 Q900,216 1100,240"
            fill="none"
            stroke="url(#hero-river)"
            strokeWidth="1.5"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -40,2; 0,0"
              dur="4s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M-50,248 Q150,238 350,252 Q550,266 750,244 Q950,222 1150,248"
            fill="none"
            stroke="url(#hero-river2)"
            strokeWidth="1"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 30,-1.5; 0,0"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M-80,255 Q120,245 320,258 Q520,272 720,250 Q920,228 1120,255"
            fill="none"
            stroke="url(#hero-river2)"
            strokeWidth="0.8"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -20,1; 0,0"
              dur="5.5s"
              repeatCount="indefinite"
            />
          </path>

          {/* ═══ 霧 ═══ */}
          <ellipse cx="200" cy="200" rx="120" ry="20" fill="#1B4F3A" opacity="0.02">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 30,-3; 0,0"
              dur="12s"
              repeatCount="indefinite"
            />
          </ellipse>
          <ellipse cx="600" cy="190" rx="100" ry="15" fill="#1B4F3A" opacity="0.015">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -25,2; 0,0"
              dur="15s"
              repeatCount="indefinite"
            />
          </ellipse>

          {/* ═══ 鳥 — 横向きシルエット（ミニマル） ═══ */}
          {/* 鳥1 — 手前 */}
          <g opacity="0.10">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="850,0; -80,0"
              dur="24s"
              repeatCount="indefinite"
            />
            {/* 横向き鳥シルエット: 胴体+翼+くちばし+尾 */}
            <g transform="translate(0,125) scale(0.6)">
              <ellipse cx="10" cy="0" rx="6" ry="2.5" fill="#1B4F3A" />
              <path d="M4,-1 Q-2,-8 -6,-6" fill="none" stroke="#1B4F3A" strokeWidth="1.2" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0,4,-1; -8,4,-1; 0,4,-1"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </path>
              <path d="M4,1 Q-2,8 -6,6" fill="none" stroke="#1B4F3A" strokeWidth="1.2" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0,4,1; 8,4,1; 0,4,1"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </path>
              <path d="M16,0 L20,-1" fill="none" stroke="#1B4F3A" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M-4,0 Q-8,-2 -10,0 Q-8,2 -4,0" fill="#1B4F3A" opacity="0.6" />
            </g>
          </g>

          {/* 鳥2 — 中距離、小さめ */}
          <g opacity="0.07">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="900,20; -40,20"
              dur="30s"
              repeatCount="indefinite"
            />
            <g transform="translate(0,140) scale(0.4)">
              <ellipse cx="10" cy="0" rx="6" ry="2.5" fill="#1B4F3A" />
              <path d="M4,-1 Q-2,-8 -6,-6" fill="none" stroke="#1B4F3A" strokeWidth="1.2" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0,4,-1; -8,4,-1; 0,4,-1"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </path>
              <path d="M4,1 Q-2,8 -6,6" fill="none" stroke="#1B4F3A" strokeWidth="1.2" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0,4,1; 8,4,1; 0,4,1"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </path>
              <path d="M16,0 L20,-1" fill="none" stroke="#1B4F3A" strokeWidth="0.8" strokeLinecap="round" />
            </g>
          </g>

          {/* 鳥3 — 遠景、最小 */}
          <g opacity="0.05">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="950,-15; -30,-15"
              dur="38s"
              repeatCount="indefinite"
            />
            <g transform="translate(0,108) scale(0.3)">
              <ellipse cx="10" cy="0" rx="6" ry="2.5" fill="#1B4F3A" />
              <path d="M4,-1 Q-2,-8 -6,-6" fill="none" stroke="#1B4F3A" strokeWidth="1.2" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0,4,-1; -8,4,-1; 0,4,-1"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </path>
              <path d="M4,1 Q-2,8 -6,6" fill="none" stroke="#1B4F3A" strokeWidth="1.2" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0,4,1; 8,4,1; 0,4,1"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </path>
              <path d="M16,0 L20,-1" fill="none" stroke="#1B4F3A" strokeWidth="0.8" strokeLinecap="round" />
            </g>
          </g>

        </g>
      </svg>
    </div>
  )
}
