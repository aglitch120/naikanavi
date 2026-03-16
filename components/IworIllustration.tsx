/**
 * iwor 幾何学イラスト — 森の中の小川
 * 丸みのある広葉樹 + 自然に蛇行する小川（左下→右上）
 * ブランドグリーン #1B4F3A のみ、opacity で濃淡
 */
export function IworIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 320"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* ── 小川（左下から右上へ自然に蛇行） ── */}
      <path
        d="M-10,290 C60,280 100,260 160,245 C240,225 280,230 340,210 C420,185 460,178 540,160 C620,142 680,128 760,108 C800,98 820,90 840,85"
        stroke="#1B4F3A"
        strokeWidth="22"
        opacity="0.04"
        strokeLinecap="round"
      />
      <path
        d="M-10,295 C70,284 110,266 175,250 C250,230 300,234 360,215 C440,192 480,182 555,165 C635,148 695,132 775,112"
        stroke="#1B4F3A"
        strokeWidth="10"
        opacity="0.06"
        strokeLinecap="round"
      />
      {/* 川面のきらめき */}
      <path
        d="M50,286 C100,275 150,260 210,248 C290,230 350,226 400,210"
        stroke="#1B4F3A"
        strokeWidth="1.5"
        opacity="0.08"
        strokeLinecap="round"
      />
      <path
        d="M420,205 C480,190 530,178 590,162 C640,150 700,132 740,118"
        stroke="#1B4F3A"
        strokeWidth="1.5"
        opacity="0.07"
        strokeLinecap="round"
      />

      {/* ── 左の大きな木（手前、大きく） ── */}
      {/* 幹 */}
      <path d="M75,300 C73,275 70,250 72,230 C74,218 78,210 80,200" stroke="#1B4F3A" strokeWidth="6" opacity="0.08" strokeLinecap="round" />
      <path d="M72,240 C60,225 50,218 42,210" stroke="#1B4F3A" strokeWidth="3" opacity="0.06" strokeLinecap="round" />
      <path d="M78,250 C90,238 100,230 108,225" stroke="#1B4F3A" strokeWidth="3" opacity="0.06" strokeLinecap="round" />
      {/* 葉（丸い塊） */}
      <ellipse cx="78" cy="185" rx="35" ry="28" fill="#1B4F3A" opacity="0.07" />
      <ellipse cx="55" cy="195" rx="25" ry="22" fill="#1B4F3A" opacity="0.06" />
      <ellipse cx="105" cy="195" rx="22" ry="20" fill="#1B4F3A" opacity="0.05" />
      <ellipse cx="78" cy="168" rx="22" ry="18" fill="#1B4F3A" opacity="0.06" />

      {/* ── 左の小さな木 ── */}
      <path d="M25,302 C24,288 22,275 24,265" stroke="#1B4F3A" strokeWidth="3.5" opacity="0.06" strokeLinecap="round" />
      <ellipse cx="24" cy="252" rx="18" ry="16" fill="#1B4F3A" opacity="0.05" />
      <ellipse cx="16" cy="258" rx="12" ry="11" fill="#1B4F3A" opacity="0.04" />

      {/* ── 左2本目 ── */}
      <path d="M138,296 C136,278 134,260 136,248" stroke="#1B4F3A" strokeWidth="4.5" opacity="0.07" strokeLinecap="round" />
      <path d="M134,264 C122,252 115,246 108,240" stroke="#1B4F3A" strokeWidth="2.5" opacity="0.05" strokeLinecap="round" />
      <ellipse cx="136" cy="232" rx="28" ry="24" fill="#1B4F3A" opacity="0.06" />
      <ellipse cx="116" cy="240" rx="18" ry="16" fill="#1B4F3A" opacity="0.05" />
      <ellipse cx="136" cy="218" rx="18" ry="15" fill="#1B4F3A" opacity="0.05" />

      {/* ── 中央やや左の木 ── */}
      <path d="M240,280 C238,262 236,248 238,235" stroke="#1B4F3A" strokeWidth="4" opacity="0.06" strokeLinecap="round" />
      <ellipse cx="240" cy="220" rx="24" ry="20" fill="#1B4F3A" opacity="0.06" />
      <ellipse cx="225" cy="228" rx="16" ry="14" fill="#1B4F3A" opacity="0.04" />
      <ellipse cx="255" cy="225" rx="14" ry="13" fill="#1B4F3A" opacity="0.04" />

      {/* ── 中央の木（川沿い） ── */}
      <path d="M320,268 C318,250 316,235 318,220" stroke="#1B4F3A" strokeWidth="5" opacity="0.07" strokeLinecap="round" />
      <path d="M316,240 C304,228 296,222 288,218" stroke="#1B4F3A" strokeWidth="2.5" opacity="0.05" strokeLinecap="round" />
      <path d="M322,245 C334,234 342,228 350,224" stroke="#1B4F3A" strokeWidth="2.5" opacity="0.05" strokeLinecap="round" />
      <ellipse cx="320" cy="204" rx="30" ry="24" fill="#1B4F3A" opacity="0.06" />
      <ellipse cx="296" cy="212" rx="20" ry="17" fill="#1B4F3A" opacity="0.05" />
      <ellipse cx="346" cy="210" rx="18" ry="16" fill="#1B4F3A" opacity="0.04" />
      <ellipse cx="320" cy="188" rx="20" ry="16" fill="#1B4F3A" opacity="0.05" />

      {/* ── 右寄りの木（少し小さく） ── */}
      <path d="M480,245 C478,230 477,218 479,208" stroke="#1B4F3A" strokeWidth="3.5" opacity="0.05" strokeLinecap="round" />
      <ellipse cx="480" cy="195" rx="20" ry="17" fill="#1B4F3A" opacity="0.05" />
      <ellipse cx="468" cy="200" rx="14" ry="12" fill="#1B4F3A" opacity="0.04" />
      <ellipse cx="492" cy="200" rx="13" ry="11" fill="#1B4F3A" opacity="0.03" />

      {/* ── 右の木（さらに小さく、遠景） ── */}
      <path d="M570,225 C569,215 568,205 569,198" stroke="#1B4F3A" strokeWidth="3" opacity="0.04" strokeLinecap="round" />
      <ellipse cx="570" cy="188" rx="16" ry="14" fill="#1B4F3A" opacity="0.04" />
      <ellipse cx="560" cy="192" rx="11" ry="10" fill="#1B4F3A" opacity="0.03" />

      {/* ── 遠景の木（とても小さく、薄い） ── */}
      <path d="M650,200 C649,192 649,186 650,180" stroke="#1B4F3A" strokeWidth="2" opacity="0.03" strokeLinecap="round" />
      <ellipse cx="650" cy="174" rx="12" ry="10" fill="#1B4F3A" opacity="0.03" />

      <path d="M700,190 C699,184 699,178 700,173" stroke="#1B4F3A" strokeWidth="2" opacity="0.03" strokeLinecap="round" />
      <ellipse cx="700" cy="168" rx="10" ry="9" fill="#1B4F3A" opacity="0.03" />

      <path d="M740,182 C739,176 739,172 740,167" stroke="#1B4F3A" strokeWidth="1.5" opacity="0.02" strokeLinecap="round" />
      <ellipse cx="740" cy="163" rx="8" ry="7" fill="#1B4F3A" opacity="0.02" />

      {/* ── 地面の草（曲線のやわらかい表現） ── */}
      <path d="M0,305 C40,302 80,298 120,300 C180,303 220,298 280,295 C340,292 400,296 460,290" stroke="#1B4F3A" strokeWidth="1" opacity="0.04" strokeLinecap="round" />
    </svg>
  )
}
