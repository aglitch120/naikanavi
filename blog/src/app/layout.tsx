import type { Metadata } from 'next';
import '@/styles/globals.css';
import { siteConfig } from '@/lib/blog-config';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: siteConfig.url,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

// ヘッダーコンポーネント
function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--br)] bg-[var(--s0)]">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ac)] text-white font-bold">
            内
          </div>
          <span className="text-lg font-semibold text-[var(--tx)]">内科ナビ</span>
        </a>
        <nav className="flex items-center gap-6">
          <a href="/blog/" className="text-sm text-[var(--m)] hover:text-[var(--ac)]">
            ブログ
          </a>
          <a href="/" className="btn-primary px-4 py-2 text-sm">
            アプリを使う
          </a>
        </nav>
      </div>
    </header>
  );
}

// フッターコンポーネント
function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--br)] bg-[var(--s0)] py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid gap-8 md:grid-cols-4">
          {/* ロゴ・説明 */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ac)] text-white font-bold">
                内
              </div>
              <span className="text-lg font-semibold">内科ナビ</span>
            </div>
            <p className="text-sm text-[var(--m)]">
              内科専攻医の悩みをすべて解決する。<br />
              J-OSLER、試験対策、キャリアまで網羅。
            </p>
          </div>
          
          {/* リンク */}
          <div>
            <h3 className="font-semibold mb-4">コンテンツ</h3>
            <ul className="space-y-2 text-sm text-[var(--m)]">
              <li><a href="/blog/">ブログ</a></li>
              <li><a href="/blog/category/josler-basics/">J-OSLER基礎</a></li>
              <li><a href="/blog/category/medical-history/">病歴要約</a></li>
              <li><a href="/blog/category/specialist-exam/">試験対策</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">リンク</h3>
            <ul className="space-y-2 text-sm text-[var(--m)]">
              <li><a href="/">アプリ</a></li>
              <li><a href="https://naika.or.jp/nintei/j-osler/" target="_blank" rel="noopener noreferrer">J-OSLER公式</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-[var(--br)] pt-8 text-center text-sm text-[var(--m)]">
          © 2026 内科ナビ. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
