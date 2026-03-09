'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const menuCategories = [
  {
    title: 'J-OSLER',
    links: [
      { name: 'J-OSLER基礎', href: '/blog/category/josler-basics' },
      { name: '症例登録', href: '/blog/category/case-registration' },
      { name: '病歴要約', href: '/blog/category/medical-history' },
      { name: '進捗管理', href: '/blog/category/progress-management' },
    ],
  },
  {
    title: '試験・キャリア',
    links: [
      { name: '内科専門医試験', href: '/blog/category/specialist-exam' },
      { name: 'キャリア', href: '/blog/category/career' },
      { name: 'AI・ツール', href: '/blog/category/ai-tools' },
      { name: '学会・論文', href: '/blog/category/academic' },
    ],
  },
  {
    title: 'お金・生活',
    links: [
      { name: 'バイト・収入', href: '/blog/category/part-time' },
      { name: '税金・節税', href: '/blog/category/tax-saving' },
      { name: 'メンタル・生活', href: '/blog/category/mental-life' },
      { name: '結婚・出産', href: '/blog/category/life-events' },
    ],
  },
]

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

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

          {/* カテゴリナビ */}
          <div className="border-t border-br pt-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-3">
              カテゴリ
            </p>
            {menuCategories.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="text-xs font-semibold text-tx px-3 mb-1.5">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleLinkClick}
                      className="block py-2 px-3 text-sm text-muted rounded-lg hover:bg-s1 hover:text-tx transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* フッターリンク */}
          <div className="border-t border-br pt-4 mt-2">
            <div className="space-y-0.5">
              <Link href="/contact" onClick={handleLinkClick} className="block py-2 px-3 text-sm text-muted rounded-lg hover:bg-s1 transition-colors">
                お問い合わせ
              </Link>
              <Link href="/privacy" onClick={handleLinkClick} className="block py-2 px-3 text-sm text-muted rounded-lg hover:bg-s1 transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/terms" onClick={handleLinkClick} className="block py-2 px-3 text-sm text-muted rounded-lg hover:bg-s1 transition-colors">
                利用規約
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
