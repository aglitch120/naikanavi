'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import SearchDialog from './SearchDialog'
import { categories, clusterColors } from '@/lib/blog-config'
import { useProStatus } from '@/components/pro/useProStatus'

const menuGroups = [
  {
    title: 'J-OSLER',
    slugs: ['josler-basics', 'case-registration', 'medical-history', 'disease-specific', 'progress-management', 'jmecc-training'],
  },
  {
    title: '試験・資格',
    slugs: ['specialist-exam', 'exam-by-field', 'comprehensive-exam', 'subspecialty'],
  },
  {
    title: 'キャリア・学術',
    slugs: ['career', 'ai-tools', 'academic'],
  },
  {
    title: 'お金・生活',
    slugs: ['part-time', 'tax-saving', 'mental-life', 'life-events', 'others'],
  },
].map(group => ({
  title: group.title,
  links: group.slugs
    .filter(slug => slug in categories)
    .map(slug => ({
      name: categories[slug as keyof typeof categories].name,
      cluster: categories[slug as keyof typeof categories].cluster,
      href: `/blog/category/${slug}`,
    })),
}))

export default function Header() {
  const [megaOpen, setMegaOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { isPro } = useProStatus()

  const handleEnter = () => {
    clearTimeout(timerRef.current)
    setMegaOpen(true)
  }
  const handleLeave = () => {
    timerRef.current = setTimeout(() => setMegaOpen(false), 150)
  }

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-s0 border-b border-br">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="iwor"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-bold text-tx">iwor</span>
        </Link>
        <nav className="flex items-center gap-1.5 md:gap-3">
          {/* デスクトップ: ブログ + メガメニュー */}
          <div
            className="hidden md:block relative"
            ref={menuRef}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <Link
              href="/blog"
              className={`text-sm px-2 py-1.5 rounded-md transition-colors ${
                megaOpen ? 'text-ac bg-acl' : 'text-muted hover:text-ac'
              }`}
            >
              ブログ
              <svg className="inline-block ml-0.5 w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>

            {/* メガメニュードロップダウン */}
            {megaOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[560px] bg-s0 border border-br rounded-xl shadow-lg p-5 grid grid-cols-2 gap-x-6 gap-y-4">
                {menuGroups.map((group) => (
                  <div key={group.title}>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                      {group.title}
                    </p>
                    <ul className="space-y-0.5">
                      {group.links.map((link) => {
                        const color = clusterColors[link.cluster as keyof typeof clusterColors]
                        return (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={() => setMegaOpen(false)}
                              className="flex items-center gap-2 py-1.5 px-2 -mx-1 rounded-md text-sm text-muted hover:text-tx hover:bg-s1 transition-colors"
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: color?.bg || '#6B6760' }}
                              />
                              {link.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
                <div className="col-span-2 pt-3 mt-1 border-t border-br">
                  <Link
                    href="/blog"
                    onClick={() => setMegaOpen(false)}
                    className="text-sm text-ac hover:text-ac2 font-medium transition-colors"
                  >
                    すべての記事を見る →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* デスクトップ: アプリ */}
          <Link
            href="/app"
            className="hidden md:block text-sm px-2 py-1.5 rounded-md text-muted hover:text-ac transition-colors"
          >
            アプリ
          </Link>

          <SearchDialog />
          {isPro ? (
            <Link
              href="/favorites"
              className="hidden md:inline-flex items-center gap-1.5 text-xs md:text-sm border border-ac text-ac px-2.5 py-1.5 md:px-3 rounded-lg hover:bg-acl transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1.5}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              お気に入り
            </Link>
          ) : (
            <Link
              href="/pro"
              className="text-xs md:text-sm border border-ac text-ac px-2.5 py-1.5 md:px-3 rounded-lg hover:bg-acl transition-colors font-medium"
            >
              PRO
            </Link>
          )}
          <Link
            href="/pro/activate"
            className="text-xs md:text-sm bg-ac text-white px-2.5 py-1.5 md:px-3 rounded-lg hover:bg-ac2 transition-colors font-medium"
          >
            {isPro ? 'マイページ' : 'ログイン'}
          </Link>
          <MobileMenu />
        </nav>
      </div>
    </header>
  )
}
