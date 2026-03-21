'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ErrorReportButton from '@/components/tools/ErrorReportButton'
import UpdatedAt from '@/components/tools/UpdatedAt'

export interface DrugEntry {
  generic: string       // 一般名
  brand: string         // 代表的商品名
  specs: string         // 規格
  indication: string    // 主な適応
  halfLife: string      // 半減期
  metabolism: string    // 代謝経路
  renalAdjust: string   // 腎機能別調整
  features: string      // 特徴・ポイント
  contraindication: string  // 主な禁忌
  evidence?: string     // 主要エビデンス
}

export interface CompareData {
  slug: string
  category: string     // カテゴリラベル（例: 降圧薬）
  title: string
  description: string
  drugs: DrugEntry[]
  columns: (keyof DrugEntry)[]  // 表示するカラム
  seoContent: { heading: string; text: string }[]
  references: string[]
  relatedTools: { href: string; name: string }[]
}

const columnLabels: Record<keyof DrugEntry, string> = {
  generic: '一般名',
  brand: '商品名',
  specs: '規格',
  indication: '主な適応',
  halfLife: '半減期',
  metabolism: '代謝',
  renalAdjust: '腎機能調整',
  features: '特徴',
  contraindication: '禁忌',
  evidence: 'エビデンス',
}

export default function DrugCompareLayout({ data }: { data: CompareData }) {
  const [sortCol, setSortCol] = useState<keyof DrugEntry | null>(null)
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null)

  const sortedDrugs = useMemo(() => {
    if (!sortCol) return data.drugs
    return [...data.drugs].sort((a, b) => (a[sortCol] || '').localeCompare(b[sortCol] || '', 'ja'))
  }, [data.drugs, sortCol])

  return (
    <div className="max-w-5xl mx-auto">
      {/* パンくず */}
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/compare" className="hover:text-ac">薬剤比較</Link>
        <span className="mx-2">›</span>
        <span>{data.title}</span>
      </nav>

      <header className="mb-6">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">💊 {data.category}</span>
        <h1 className="text-2xl font-bold text-tx mb-1">{data.title}</h1>
        <p className="text-sm text-muted">{data.description}</p>
        <UpdatedAt />
      </header>

      {/* 比較表 */}
      <section className="mb-8 overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-s1">
              {data.columns.map(col => (
                <th key={col}
                  onClick={() => setSortCol(prev => prev === col ? null : col)}
                  className="text-left p-2 border border-br font-bold text-tx cursor-pointer hover:bg-acl/50 select-none whitespace-nowrap">
                  {columnLabels[col]} {sortCol === col ? '▲' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedDrugs.map((drug, i) => (
              <tr key={i}
                onClick={() => setHighlightIdx(highlightIdx === i ? null : i)}
                className={`transition-colors cursor-pointer ${
                  highlightIdx === i ? 'bg-acl/50' : i % 2 === 0 ? 'bg-s0' : 'bg-bg'
                } hover:bg-acl/30`}>
                {data.columns.map(col => (
                  <td key={col} className={`p-2 border border-br align-top ${
                    col === 'generic' || col === 'brand' ? 'font-medium text-tx whitespace-nowrap' : 'text-tx/80'
                  }`}>
                    {drug[col] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-muted mt-2">※ タップで行をハイライト。列ヘッダーをタップでソート。</p>
      </section>

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn">
        <p className="font-semibold mb-1">⚠️ 医療上の免責事項</p>
        <p>本比較表は添付文書の公開情報に基づく概要であり、全ての適応・用法・注意事項を網羅するものではありません。処方の際は必ず最新の添付文書をご確認ください。用量の記載は意図的に省略しています。</p>
        <div className="mt-2 pt-2 border-t border-wnb/30">
          <ErrorReportButton toolName={data.title} />
        </div>
      </div>

      {/* SEO解説 */}
      <section className="space-y-4 text-sm text-muted mb-8">
        {data.seoContent.map((s, i) => (
          <div key={i}>
            <h2 className={i === 0 ? 'text-base font-bold text-tx' : 'font-bold text-tx'}>{s.heading}</h2>
            <p>{s.text}</p>
          </div>
        ))}
      </section>

      {/* 関連ツール */}
      {data.relatedTools.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">関連ツール</h2>
          <div className="flex flex-wrap gap-2">
            {data.relatedTools.map(t => (
              <Link key={t.href} href={t.href}
                className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 参考文献 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">参考文献・出典</h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2">
          {data.references.map((r, i) => <li key={i}>{r}</li>)}
        </ol>
      </section>
    </div>
  )
}
