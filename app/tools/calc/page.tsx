import { Metadata } from 'next'
import Link from 'next/link'
import { generateMetadata as genMeta, generateBreadcrumbJsonLd } from '@/lib/seo'
import ToolsList from '@/components/tools/ToolsList'

export const metadata: Metadata = genMeta({
  title: '臨床計算ツール（79種・診療科別）',
  description: '循環器・腎臓・呼吸器・消化器・神経・血液・感染症・電解質など診療科別に79種の臨床スコア・計算ツールを無料で。登録不要、スマホ対応。',
  path: '/tools/calc',
})

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: 'ホーム', url: 'https://iwor.jp' },
  { name: '臨床計算ツール', url: 'https://iwor.jp/tools' },
])

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'iworの臨床計算ツールは無料ですか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'はい、すべての臨床計算ツールは登録不要・完全無料でご利用いただけます。',
      },
    },
    {
      '@type': 'Question',
      name: 'スマートフォンでも使えますか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'はい、すべてのツールはスマートフォン・タブレットに最適化されています。病棟やベッドサイドでもご利用いただけます。',
      },
    },
  ],
}

export default function ToolsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-2">›</span>
        <span>計算ツール</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-tx mb-2">臨床計算ツール</h1>
        <p className="text-muted text-sm">
          診療科別に79種。登録不要、ベッドサイドですぐ使えます。
        </p>
      </header>

      <ToolsList />

      <section className="mt-12 mb-8">
        <h2 className="text-lg font-bold mb-3">iworの臨床計算ツールについて</h2>
        <p className="text-sm text-muted leading-relaxed mb-3">
          iworでは、内科専攻医・内科医が日常診療で頻繁に使用する臨床スコア・計算ツールを無料で提供しています。
          eGFR（CKD-EPI 2021）、CHA₂DS₂-VASc、Child-Pugh、CURB-65、Wells スコア、SOFA スコアなど、
          ガイドラインで示される主要な臨床スコアをカバー。
          さらに抗菌薬の腎機能別用量調整、輸液・電解質補正計算、ステロイド換算ツールなど、
          当直中やベッドサイドで必要になる実践的なツールも順次追加しています。
        </p>
        <p className="text-sm text-muted leading-relaxed">
          すべてのツールはスマートフォンに最適化されており、登録不要・完全無料です。
          計算ロジックの根拠となる原著論文（PubMed）へのリンクを各ツールに掲載しています。
        </p>
      </section>
    </div>
  )
}
