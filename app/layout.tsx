import type { Metadata } from 'next'
import './globals.css'
import { siteConfig } from '@/lib/blog-config'

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
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body className="min-h-screen bg-bg text-tx antialiased">
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
        <a href="/" className="flex items-center gap-2">
          <img 
            src="/icon.png" 
            alt="内科ナビ" 
            width={36} 
            height={36} 
            className="rounded-lg"
          />
          <span className="font-bold text-tx">内科ナビ</span>
        </a>
        <nav className="flex items-center gap-2 md:gap-3">
          <a href="/blog" className="text-sm text-muted hover:text-ac transition-colors hidden md:block">
            ブログ
          </a>
          <a 
            href="https://naikanavi.booth.pm/items/8058590" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm border border-ac text-ac px-3 py-1.5 rounded-lg hover:bg-acl transition-colors font-medium"
          >
            購入する
          </a>
          <a href="/app" className="text-sm bg-ac text-white px-3 py-1.5 rounded-lg hover:bg-ac2 transition-colors font-medium">
            ログイン
          </a>
        </nav>
      </div>
    </header>
  )
}

// フッターコンポーネント
function Footer() {
  return (
    <footer className="bg-s0 border-t border-br mt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="/icon.png" 
              alt="内科ナビ" 
              width={32} 
              height={32} 
              className="rounded-lg"
            />
            <span className="font-semibold text-tx">内科ナビ</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted">
            <a href="/blog" className="hover:text-ac">ブログ</a>
            <a href="https://naikanavi.booth.pm/items/8058590" target="_blank" rel="noopener noreferrer" className="hover:text-ac">購入</a>
            <a href="/privacy" className="hover:text-ac">プライバシーポリシー</a>
            <a href="/terms" className="hover:text-ac">利用規約</a>
            <a href="/contact" className="hover:text-ac">お問い合わせ</a>
          </nav>
        </div>
        <p className="text-center text-sm text-muted mt-6">
          © 2026 内科ナビ. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
