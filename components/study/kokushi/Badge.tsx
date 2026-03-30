'use client'

type BadgeColor = 'default' | 'accent' | 'ok' | 'dn' | 'wn' | 'ai' | 'pro'

const COLOR_MAP: Record<BadgeColor, string> = {
  default: 'bg-s1 text-muted',
  accent: 'bg-acl text-ac',
  ok: 'bg-okl text-ok',
  dn: 'bg-dnl text-dn',
  wn: 'bg-wnl text-wn',
  ai: 'bg-[rgba(108,92,231,0.08)] text-[#6C5CE7]',
  pro: 'text-white',
}

export default function Badge({
  children,
  color = 'default',
  className = '',
}: {
  children: React.ReactNode
  color?: BadgeColor
  className?: string
}) {
  const isPro = color === 'pro'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${COLOR_MAP[color]} ${className}`}
      style={isPro ? { background: 'linear-gradient(135deg,#1B4F3A,#2D6A4F)' } : undefined}
    >
      {children}
    </span>
  )
}
