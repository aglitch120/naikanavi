import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import './globals.css'
import { siteConfig, categories } from '@/lib/blog-config'
import { websiteJsonLd, siteNavigationJsonLd } from '@/lib/seo'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import DisclaimerPopup from '@/components/DisclaimerPopup'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

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
  description: '医学生から医師まで、ずっと臨床のそばに。臨床計算ツール、ACLS/BLS、ER対応、J-OSLER管理、専門医試験対策まで。',
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
  // GSC認証はDNS（Cloudflare）で完了済み
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large' as const,
    'max-video-preview': -1,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: siteConfig.url,
    languages: {
      'ja': siteConfig.url,
      'x-default': siteConfig.url,
    },
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
      <body className="min-h-screen bg-bg text-tx antialiased">
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
        <Header />
        <main className="max-w-5xl mx-auto px-6 sm:px-8 py-8 pb-24 md:pb-8">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <DisclaimerPopup />
      </body>
    </html>
  )
}

// フッターカテゴリグループ（SEO内部リンク強化・blog-config.ts 全カテゴリ準拠）
const footerCategories = [
  {
    title: 'J-OSLER',
    links: [
      { name: 'J-OSLER基礎', href: '/blog/category/josler-basics' },
      { name: '症例登録', href: '/blog/category/case-registration' },
      { name: '病歴要約', href: '/blog/category/medical-history' },
      { name: '疾患別病歴要約', href: '/blog/category/disease-specific' },
      { name: '進捗管理', href: '/blog/category/progress-management' },
      { name: 'JMECC・講習', href: '/blog/category/jmecc-training' },
    ],
  },
  {
    title: '試験・キャリア',
    links: [
      { name: '内科専門医試験', href: '/blog/category/specialist-exam' },
      { name: '試験領域別', href: '/blog/category/exam-by-field' },
      { name: '総合内科専門医', href: '/blog/category/comprehensive-exam' },
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
      { name: 'サブスペJ-OSLER', href: '/blog/category/subspecialty' },
      { name: 'その他', href: '/blog/category/others' },
    ],
  },
]

// フッターコンポーネント
function Footer() {
  return (
    <footer className="bg-s0 border-t border-br mt-16 pb-14 md:pb-0">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
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

        {/* 医療情報免責表示 */}
        <div className="mb-8 p-4 bg-bg border border-br rounded-lg">
          <p className="text-xs text-muted leading-relaxed">
            <span className="font-semibold text-tx">医療情報に関する免責事項:</span>{' '}
            本サイトの情報は医療従事者の臨床判断を支援する目的で提供されており、診断・治療の代替とはなりません。
            臨床計算ツール・薬剤情報・診療フローの結果は参考値であり、個別の患者への適用は各医師の責任において行ってください。
            掲載情報の正確性には最大限注意を払っていますが、医学情報は常に更新されるため、最新の添付文書・ガイドラインを必ず確認してください。
            本サイトの利用により生じたいかなる損害についても、運営者は責任を負いかねます。
          </p>
        </div>

        <div className="border-t border-br pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/icon.png" 
                alt="" 
                width={32} 
                height={32} 
                className="rounded-lg"
              />
              <span className="font-semibold text-tx">iwor</span>
              <span className="text-xs text-muted ml-1">（イウォール）</span>
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
              <Link href="/blog" className="hover:text-ac">ブログ</Link>
              <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
              <Link href="/about" className="hover:text-ac">iworとは</Link>
              <Link href="/privacy" className="hover:text-ac">プライバシーポリシー</Link>
              <Link href="/terms" className="hover:text-ac">利用規約</Link>
              <Link href="/tokushoho" className="hover:text-ac">特商法表示</Link>
              <Link href="/contact" className="hover:text-ac">お問い合わせ</Link>
            </nav>
          </div>
          <p className="text-sm text-muted mt-6">
            © 2026 iwor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
