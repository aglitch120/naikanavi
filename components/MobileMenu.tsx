'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { categories, clusterColors } from '@/lib/blog-config'

// blog-config.ts の全カテゴリをグループ化して表示
const menuCategories = [
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

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  // メニュー開閉時にbodyのスクロールを制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ルート遷移時にメニューを閉じる
  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* ハンバーガーボタン（モバイルのみ表示） */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-s1 transition-colors"
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={isOpen}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-tx"
        >
          {isOpen ? (
            // × アイコン
            <path
              d="M5 5L15 15M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          ) : (
            // ハンバーガーアイコン
            <>
              <path d="M3 5H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M3 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M3 15H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 top-14 bg-tx/30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ドロワーメニュー */}
      <div
        className={`fixed top-14 right-0 bottom-0 w-[280px] bg-s0 z-50 transform transition-transform duration-200 ease-out md:hidden overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5">
          {/* メインリンク */}
          <div className="space-y-1 mb-6">
            <Link
              href="/blog"
              onClick={handleLinkClick}
              className="block py-2.5 px-3 text-sm font-medium text-tx rounded-lg hover:bg-s1 transition-colors"
            >
              ブログ一覧
            </Link>
          </div>

          {/* カテゴリナビ（アコーディオン） */}
          <div className="border-t border-br pt-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-3">
              カテゴリ
            </p>
            {menuCategories.map((group) => (
              <div key={group.title} className="mb-1">
                <button
                  onClick={() => setExpandedGroup(expandedGroup === group.title ? null : group.title)}
                  className="w-full flex items-center justify-between py-2.5 px-3 text-sm font-semibold text-tx rounded-lg hover:bg-s1 transition-colors"
                >
                  {group.title}
                  <svg
                    className={`w-4 h-4 text-muted transition-transform duration-200 ${
                      expandedGroup === group.title ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {expandedGroup === group.title && (
                  <div className="space-y-0.5 pb-2">
                    {group.links.map((link) => {
                      const color = clusterColors[link.cluster as keyof typeof clusterColors]
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={handleLinkClick}
                          className="flex items-center gap-2 py-2.5 px-3 pl-5 text-sm text-muted rounded-lg hover:bg-s1 hover:text-tx transition-colors"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color?.bg || '#6B6760' }}
                          />
                          {link.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* フッターリンク */}
          <div className="border-t border-br pt-4 mt-2">
            <div className="space-y-0.5">
              <Link href="/contact" onClick={handleLinkClick} className="block py-3 px-3 text-sm text-muted rounded-lg hover:bg-s1 transition-colors">
                お問い合わせ
              </Link>
              <Link href="/privacy" onClick={handleLinkClick} className="block py-3 px-3 text-sm text-muted rounded-lg hover:bg-s1 transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/terms" onClick={handleLinkClick} className="block py-3 px-3 text-sm text-muted rounded-lg hover:bg-s1 transition-colors">
                利用規約
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
