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

          {/* ═══ 川（穏やかなアニメーション） ═══ */}
          {/* メインの川面 — 山(y=220)より下 */}
          <path
            fill="#1B4F3A"
            opacity="0.10"
          >
            <animate
              attributeName="d"
              values="
                M0,248 Q100,242 200,250 Q350,258 500,246 Q650,238 800,248 L800,268 Q650,258 500,264 Q350,274 200,268 Q100,260 0,268Z;
                M0,252 Q100,260 200,250 Q350,242 500,254 Q650,264 800,252 L800,272 Q650,266 500,270 Q350,260 200,266 Q100,274 0,272Z;
                M0,248 Q100,242 200,250 Q350,258 500,246 Q650,238 800,248 L800,268 Q650,258 500,264 Q350,274 200,268 Q100,260 0,268Z
              "
              dur="5s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            />
          </path>

          {/* 第2の波 — 逆位相 */}
          <path
            fill="#1B4F3A"
            opacity="0.07"
          >
            <animate
              attributeName="d"
              values="
                M0,256 Q150,264 300,258 Q500,250 700,262 L800,258 L800,274 Q700,270 500,264 Q300,272 150,274 L0,274Z;
                M0,260 Q150,252 300,262 Q500,270 700,254 L800,262 L800,278 Q700,268 500,276 Q300,264 150,268 L0,278Z;
                M0,256 Q150,264 300,258 Q500,250 700,262 L800,258 L800,274 Q700,270 500,264 Q300,272 150,274 L0,274Z
              "
              dur="8s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            />
          </path>

          {/* 第3の波 — 細い水面ライン */}
          <path
            fill="#1B4F3A"
            opacity="0.05"
          >
            <animate
              attributeName="d"
              values="
                M0,268 Q200,262 400,270 Q600,278 800,268 L800,276 Q600,282 400,278 Q200,270 0,276Z;
                M0,272 Q200,278 400,268 Q600,262 800,272 L800,280 Q600,270 400,278 Q200,284 0,280Z;
                M0,268 Q200,262 400,270 Q600,278 800,268 L800,276 Q600,282 400,278 Q200,270 0,276Z
              "
              dur="5s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            />
          </path>

          {/* 川のストローク線 ×3本 */}
          <path
            fill="none"
            stroke="url(#hero-river)"
            strokeWidth="1.8"
            opacity="0.9"
          >
            <animate
              attributeName="d"
              values="
                M0,250 Q200,244 400,252 Q600,260 800,250;
                M0,254 Q200,262 400,254 Q600,246 800,254;
                M0,250 Q200,244 400,252 Q600,260 800,250
              "
              dur="5s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            />
          </path>
          <path
            fill="none"
            stroke="url(#hero-river2)"
            strokeWidth="1.2"
            opacity="0.8"
          >
            <animate
              attributeName="d"
              values="
                M0,260 Q200,268 400,260 Q600,252 800,260;
                M0,264 Q200,254 400,264 Q600,272 800,264;
                M0,260 Q200,268 400,260 Q600,252 800,260
              "
              dur="7s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            />
          </path>
          <path
            fill="none"
            stroke="url(#hero-river2)"
            strokeWidth="0.9"
            opacity="0.7"
          >
            <animate
              attributeName="d"
              values="
                M0,268 Q200,262 400,270 Q600,276 800,268;
                M0,272 Q200,278 400,270 Q600,264 800,272;
                M0,268 Q200,262 400,270 Q600,276 800,268
              "
              dur="12s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
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

          {/* ═══ 鳥 — 山鳥シルエット（トビ/ツバメ型: 細身・長翼・二股尾） ═══ */}

          {/* 鳥1 — 手前 */}
          <g opacity="0.15">
            <animateTransform attributeName="transform" type="translate"
              values="880,0; -120,0" dur="26s" repeatCount="indefinite" />
            <g transform="translate(0,100) scale(1.5)">
              {/* 細い胴体 */}
              <ellipse cx="0" cy="0" rx="5" ry="1.2" fill="#1B4F3A" />

              {/* 左翼 — 長く尖った形状 */}
              <path d="M-2,-1 Q0,-8 8,-14 Q9,-13.5 6,-8 Q3,-4 1,-1Z" fill="#1B4F3A">
                <animateTransform attributeName="transform" type="rotate"
                  values="0,0,-1; -15,0,-1; 0,0,-1" dur="1.0s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
              </path>
              {/* 右翼 */}
              <path d="M-2,1 Q0,7 7,12 Q8,11.5 5,7 Q3,3.5 1,1Z" fill="#1B4F3A">
                <animateTransform attributeName="transform" type="rotate"
                  values="0,0,1; 12,0,1; 0,0,1" dur="1.0s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
              </path>
            </g>
          </g>

          {/* 鳥2 — 中距離 */}
          <g opacity="0.12">
            <animateTransform attributeName="transform" type="translate"
              values="920,5; -80,5" dur="32s" repeatCount="indefinite" />
            <g transform="translate(0,85) scale(1.1)">
              <ellipse cx="0" cy="0" rx="4.5" ry="1" fill="#1B4F3A" />
              <path d="M-1.5,-0.8 Q0.5,-7 7,-12 Q7.8,-11.5 5,-7 Q2.5,-3.5 0.5,-0.8Z" fill="#1B4F3A">
                <animateTransform attributeName="transform" type="rotate"
                  values="0,0,-0.8; -13,0,-0.8; 0,0,-0.8" dur="1.2s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
              </path>
              <path d="M-1.5,0.8 Q0.5,6 6,10 Q6.8,9.5 4.5,6 Q2.5,3 0.5,0.8Z" fill="#1B4F3A">
                <animateTransform attributeName="transform" type="rotate"
                  values="0,0,0.8; 10,0,0.8; 0,0,0.8" dur="1.2s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
              </path>
            </g>
          </g>

          {/* 鳥3 — 遠景 */}
          <g opacity="0.09">
            <animateTransform attributeName="transform" type="translate"
              values="950,-5; -50,-5" dur="40s" repeatCount="indefinite" />
            <g transform="translate(0,72) scale(0.8)">
              <ellipse cx="0" cy="0" rx="4" ry="0.9" fill="#1B4F3A" />
              <path d="M-1,-0.7 Q0.5,-6 6,-10 Q6.8,-9.5 4.5,-6 Q2,-3 0.5,-0.7Z" fill="#1B4F3A">
                <animateTransform attributeName="transform" type="rotate"
                  values="0,0,-0.7; -11,0,-0.7; 0,0,-0.7" dur="1.5s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
              </path>
              <path d="M-1,0.7 Q0.5,5 5.5,8.5 Q6.3,8 4,5.5 Q2,2.8 0.5,0.7Z" fill="#1B4F3A">
                <animateTransform attributeName="transform" type="rotate"
                  values="0,0,0.7; 9,0,0.7; 0,0,0.7" dur="1.5s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
              </path>
            </g>
          </g>

          {/* 鳥4 — 最遠景 */}
          <g opacity="0.07">
            <animateTransform attributeName="transform" type="translate"
              values="840,15; -60,15" dur="36s" repeatCount="indefinite" />
            <g transform="translate(0,90) scale(0.6)">
              <ellipse cx="0" cy="0" rx="3.5" ry="0.8" fill="#1B4F3A" />
              <path d="M-1,-0.6 Q0.5,-5.5 5.5,-9 Q6.2,-8.5 4,-5.5 Q2,-2.5 0.5,-0.6Z" fill="#1B4F3A">
                <animateTransform attributeName="transform" type="rotate"
                  values="0,0,-0.6; -10,0,-0.6; 0,0,-0.6" dur="1.7s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
              </path>
              <path d="M-1,0.6 Q0.5,4.5 5,7.5 Q5.7,7 3.5,4.5 Q2,2.3 0.5,0.6Z" fill="#1B4F3A">
                <animateTransform attributeName="transform" type="rotate"
                  values="0,0,0.6; 8,0,0.6; 0,0,0.6" dur="1.7s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.4 0 0.6 1; 0.4 0 0.6 1" />
              </path>
            </g>
          </g>

        </g>
      </svg>
    </div>
  )
}
