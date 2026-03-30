'use client'

// 国試演習専用のインラインGlowButton（プロトタイプ準拠、テキスト直接含むタイプ）
export default function KokushiGlowButton({
  children,
  onClick,
  small,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  small?: boolean
  className?: string
}) {
  return (
    <span
      className={`relative inline-flex overflow-hidden cursor-pointer ${className}`}
      style={{ borderRadius: small ? 10 : 12, padding: 2 }}
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        className="absolute glow-kokushi-spinner"
        style={{
          top: '-50%', left: '-50%', width: '200%', height: '200%',
          background: 'conic-gradient(from 0deg,transparent 30%,#2DB464 45%,#4ADE80 50%,#86EFAC 53%,#4ADE80 58%,#2DB464 65%,transparent 75%)',
          animation: 'glowKokushiSpin 2.5s linear infinite',
        }}
      />
      <span
        className="relative z-[1] inline-flex items-center justify-center gap-1.5 bg-ac text-white font-semibold whitespace-nowrap w-full"
        style={{
          borderRadius: small ? 8 : 10,
          padding: small ? '8px 16px' : '12px 24px',
          fontSize: small ? 12 : 13,
        }}
      >
        {children}
      </span>
    </span>
  )
}
