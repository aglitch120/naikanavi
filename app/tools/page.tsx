import { Metadata } from 'next'
import Link from 'next/link'
import { tools, implementedTools, categoryLabels, categoryIcons, type ToolCategory } from '@/lib/tools-config'
import { generateMetadata as genMeta, generateBreadcrumbJsonLd } from '@/lib/seo'

export const metadata: Metadata = genMeta({
  title: '臨床計算ツール',
  description: '内科で頻用する臨床スコア・計算ツールを無料で。eGFR、CHA₂DS₂-VASc、Child-Pugh、CURB-65、Wells、SOFA等。登録不要、スマホ対応。',
  path: '/tools',
})

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: 'ホーム', url: 'https://naikanavi.com' },
  { name: '臨床計算ツール', url: 'https://naikanavi.com/tools' },
])

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '内科ナビの臨床計算ツールは無料ですか？',
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
  const grouped = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = []
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<ToolCategory, typeof tools>)

  const categoryOrder: ToolCategory[] = [
    'nephrology', 'cardiology', 'hepatology', 'respiratory',
    'infectious', 'electrolyte', 'neurology', 'hematology', 'general',
  ]

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
        <span>臨床計算ツール</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-2xl font-bold text-tx mb-2">臨床計算ツール</h1>
        <p className="text-muted text-sm">
          内科で頻用する臨床スコア・計算ツールを無料で。登録不要、ベッドサイドですぐ使えます。
        </p>
      </header>

      {categoryOrder.map(cat => {
        const catTools = grouped[cat]
        if (!catTools || catTools.length === 0) return null
        return (
          <section key={cat} className="mb-8">
            <h2 className="text-lg font-bold text-tx mb-3 flex items-center gap-2">
              <span>{categoryIcons[cat]}</span>
              {categoryLabels[cat]}
            </h2>
            <div className="grid gap-2">
              {catTools.map(tool => {
                const isLive = implementedTools.has(tool.slug)
                return isLive ? (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="flex items-center justify-between gap-3 p-3 bg-s0 border border-br rounded-lg hover:border-ac/30 hover:bg-acl/30 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-tx group-hover:text-ac transition-colors">{tool.name}</p>
                      <p className="text-xs text-muted truncate">{tool.description}</p>
                    </div>
                    <span className="text-ac text-sm shrink-0">→</span>
                  </Link>
                ) : (
                  <div
                    key={tool.slug}
                    className="flex items-center justify-between gap-3 p-3 bg-s1/50 border border-br/50 rounded-lg opacity-60"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted">{tool.name}</p>
                      <p className="text-xs text-muted/70 truncate">{tool.description}</p>
                    </div>
                    <span className="text-xs text-muted bg-s2 px-2 py-0.5 rounded shrink-0">準備中</span>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <section className="mt-12 mb-8">
        <h2 className="text-lg font-bold mb-3">内科ナビの臨床計算ツールについて</h2>
        <p className="text-sm text-muted leading-relaxed mb-3">
          内科ナビでは、内科専攻医・内科医が日常診療で頻繁に使用する臨床スコア・計算ツールを無料で提供しています。
          eGFR（CKD-EPI 2021）、CHA₂DS₂-VASc、Child-Pugh、CURB-65、Wells スコア、SOFA スコアなど、
          ガイドラインで推奨される主要な臨床スコアをカバーしています。
        </p>
        <p className="text-sm text-muted leading-relaxed">
          すべてのツールはスマートフォンに最適化されており、病棟回診やベッドサイドでもすぐにご利用いただけます。
          登録不要・完全無料です。
        </p>
      </section>
    </div>
  )
}
