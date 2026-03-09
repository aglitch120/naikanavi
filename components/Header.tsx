'use client'

import Image from 'next/image'
import Link from 'next/link'
import MobileMenu from './MobileMenu'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-s0 border-b border-br">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="内科ナビ"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-bold text-tx">内科ナビ</span>
        </Link>
        <nav className="flex items-center gap-1.5 md:gap-3">
          <Link
            href="/blog"
            className="text-sm text-muted hover:text-ac transition-colors hidden md:block"
          >
            ブログ
          </Link>
          <a
            href="https://naikanavi.booth.pm/items/8058590"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs md:text-sm border border-ac text-ac px-2.5 py-1.5 md:px-3 rounded-lg hover:bg-acl transition-colors font-medium"
          >
            購入
          </a>
          <Link
            href="/app"
            className="text-xs md:text-sm bg-ac text-white px-2.5 py-1.5 md:px-3 rounded-lg hover:bg-ac2 transition-colors font-medium"
          >
            ログイン
          </Link>
          <MobileMenu />
        </nav>
      </div>
    </header>
  )
}
