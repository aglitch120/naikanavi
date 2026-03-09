import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import './globals.css'
import { siteConfig, categories } from '@/lib/blog-config'
import { websiteJsonLd, siteNavigationJsonLd } from '@/lib/seo'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-noto-sans-jp',
})

// Organization構造化データ
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo.png`,
  description: siteConfig.description,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - ${siteConfig.description}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: '内科専攻医の悩みをすべて解決する。J-OSLER、病歴要約、内科専門医試験対策から、キャリア・お金の情報まで。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large' as const,
    'max-video-preview': -1,
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteNavigationJsonLd),
          }}
        />
      </head>
      <body className={`${notoSansJP.className} min-h-screen bg-bg text-tx antialiased`}>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

// ヘッダーコンポーネント
function Header() {
  return (
    <header className="sticky top-0 z-50 bg-s0 border-b border-br">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
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
        <nav className="flex items-center gap-2 md:gap-3">
          <Link href="/blog" className="text-sm text-muted hover:text-ac transition-colors hidden md:block">
            ブログ
          </Link>
          <a 
            href="https://naikanavi.booth.pm/items/8058590" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm border border-ac text-ac px-3 py-1.5 rounded-lg hover:bg-acl transition-colors font-medium"
          >
            購入する
          </a>
          <Link href="/app" className="text-sm bg-ac text-white px-3 py-1.5 rounded-lg hover:bg-ac2 transition-colors font-medium">
            ログイン
          </Link>
        </nav>
      </div>
    </header>
  )
}

// フッターカテゴリグループ（SEO内部リンク強化）
const footerCategories = [
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

// フッターコンポーネント
function Footer() {
  return (
    <footer className="bg-s0 border-t border-br mt-16">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* カテゴリリンク */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {footerCategories.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-tx mb-3">{group.title}</h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted hover:text-ac transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-br pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/icon.png" 
                alt="内科ナビ" 
                width={32} 
                height={32} 
                className="rounded-lg"
              />
              <span className="font-semibold text-tx">内科ナビ</span>
            </Link>
            <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted">
              <Link href="/blog" className="hover:text-ac">ブログ</Link>
              <a href="https://naikanavi.booth.pm/items/8058590" target="_blank" rel="noopener noreferrer" className="hover:text-ac">購入</a>
              <Link href="/privacy" className="hover:text-ac">プライバシーポリシー</Link>
              <Link href="/terms" className="hover:text-ac">利用規約</Link>
              <Link href="/tokushoho" className="hover:text-ac">特商法表示</Link>
              <Link href="/contact" className="hover:text-ac">お問い合わせ</Link>
            </nav>
          </div>
          <p className="text-center text-sm text-muted mt-6">
            © 2026 内科ナビ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
