'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import CTABanner from '@/components/blog/CTABanner'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'

const toolsCta = {
  title: '🚀 AIが病歴要約の下書きを30秒で生成',
  description: 'J-OSLER作業を10分の1に。症例登録テンプレ・検査値フォーマット変換・病歴要約AI下書きが全部入り。',
  buttonText: '無料で試してみる',
  url: 'https://naikanavi.booth.pm/items/8058590',
}

interface CalculatorLayoutProps {
  slug?: string
  title: string
  titleEn: string
  description: string
  category: string
  categoryIcon: string
  children: ReactNode
  result?: ReactNode
  explanation?: ReactNode
  relatedTools?: { slug: string; name: string }[]
  references?: { text: string; url?: string }[]
}

export default function CalculatorLayout({
  slug,
  title,
  titleEn,
  description,
  category,
  categoryIcon,
  children,
  result,
  explanation,
  relatedTools,
  references,
}: CalculatorLayoutProps) {
  return (
    <div className="max-w-2xl mx-auto overflow-hidden">
      {/* パンくず */}
      <nav className="text-sm text-muted mb-6 flex flex-wrap items-center gap-y-1">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-1.5">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-1.5">›</span>
        <Link href="/tools/calc" className="hover:text-ac">計算ツール</Link>
        <span className="mx-1.5">›</span>
        <span className="break-all">{title}</span>
      </nav>

      {/* ヘッダー */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">
              {categoryIcon} {category}
            </span>
            <h1 className="text-2xl font-bold text-tx mb-1">{title}</h1>
            <p className="text-sm text-muted">{titleEn}</p>
          </div>
          {slug && (
            <ProPulseHint>
              <FavoriteButton slug={slug} />
            </ProPulseHint>
          )}
        </div>
        <p className="text-sm text-muted mt-2">{description}</p>
      </header>

      {/* 計算フォーム */}
      <section className="bg-s0 border border-br rounded-xl p-5 sm:p-6 mb-6">
        <h2 className="sr-only">入力</h2>
        {children}
      </section>

      {/* 結果 */}
      {result && (
        <section className="mb-6" aria-live="polite">
          {result}
        </section>
      )}

      {/* 免責表示 */}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn">
        <p className="font-semibold mb-1">⚠️ 医療上の免責事項</p>
        <p>
          本ツールは医療従事者の臨床判断を補助する目的で提供しています。
          診断・治療の最終判断は必ず担当医が行ってください。
          計算結果の正確性について保証するものではありません。
        </p>
      </div>

      {/* SEO解説 */}
      {explanation && (
        <section className="mb-8">
          {explanation}
        </section>
      )}

      {/* 関連ツール */}
      {relatedTools && relatedTools.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">関連ツール</h2>
          <div className="flex flex-wrap gap-2">
            {relatedTools.map(tool => (
              <Link
                key={tool.slug}
                href={`/tools/calc/${tool.slug}`}
                className="inline-block text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors"
              >
                {tool.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 参考文献 */}
      {references && references.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">参考文献</h2>
          <ol className="list-decimal list-inside text-sm text-muted space-y-2">
            {references.map((ref, i) => (
              <li key={i} className="break-words">
                {ref.url ? (
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" className="hover:text-ac underline break-words">
                    {ref.text}
                  </a>
                ) : (
                  ref.text
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* CTA */}
      <CTABanner cta={toolsCta} variant="large" />
    </div>
  )
}
