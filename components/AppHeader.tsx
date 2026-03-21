'use client'

import Link from 'next/link'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'

interface AppHeaderProps {
  title: string
  subtitle: string
  badge?: 'FREE' | 'PRO' | 'NEW' | 'FREEMIUM'
  favoriteSlug?: string
  favoriteHref?: string
  /** Extra element to render right-aligned (e.g. save status) */
  rightSlot?: React.ReactNode
}

export default function AppHeader({
  title,
  subtitle,
  badge,
  favoriteSlug,
  favoriteHref,
  rightSlot,
}: AppHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-ac transition-colors">ホーム</Link>
        <span>›</span>
        <span className="text-tx font-medium">{title}</span>
      </nav>

      {/* Title row */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-tx">{title}</h1>
            {badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                badge === 'FREE' ? 'text-muted bg-s1 border border-br'
                : badge === 'FREEMIUM' ? 'text-muted bg-s1 border border-br'
                : badge === 'PRO' ? 'text-ac bg-acl border border-ac/15'
                : badge === 'NEW' ? 'text-white bg-ac'
                : ''
              }`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {favoriteSlug && (
            <ProPulseHint>
              <FavoriteButton slug={favoriteSlug} title={title} href={favoriteHref || '#'} type="app" size="sm" />
            </ProPulseHint>
          )}
          {rightSlot}
        </div>
      </div>
    </div>
  )
}
