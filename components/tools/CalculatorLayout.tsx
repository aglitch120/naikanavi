'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ErrorReportButton, { FeedbackRow } from '@/components/tools/ErrorReportButton'
import ProPulseHint from '@/components/pro/ProPulseHint'
import { trackToolUsage, getTotalToolUsage, useProStatus } from '@/components/pro/useProStatus'
import PersonaCTA from '@/components/PersonaCTA'
import { getToolBySlug } from '@/lib/tools-config'
import { generateToolJsonLd } from '@/lib/tools-metadata'

interface CalculatorLayoutProps {
  slug?: string
  title: string
  titleEn: string
  description: string
  category: string
  categoryIcon: string
  children: ReactNode
  result?: ReactNode
  /** @deprecated 非表示化済み — propsは受け付けるがレンダリングしない */
  explanation?: ReactNode
  /** @deprecated 非表示化済み */
  relatedTools?: { slug: string; name: string }[]
  references?: { text: string; url?: string }[]
}

/** 最終検証日時（verify-sources.mjs の結果を表示） */
function VerifyStatus() {
  const [label, setLabel] = useState<string>('')
  useEffect(() => {
    fetch('/verify-status.json')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.lastVerified) {
          const d = new Date(data.lastVerified)
          setLabel(`検証: ${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`)
        }
      })
      .catch(() => {})
  }, [])
  if (!label) return null
  return <span className="text-[10px] text-muted/60">{label}</span>
}

/** PLG: 3回目利用バナー（1回限り） */
function ThirdUseBanner() {
  const { isPro } = useProStatus()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isPro) return
    const total = getTotalToolUsage()
    const shown = localStorage.getItem('iwor_third_use_banner_shown') === 'true'
    if (total >= 3 && !shown) {
      setShow(true)
      localStorage.setItem('iwor_third_use_banner_shown', 'true')
    }
  }, [isPro])

  if (!show) return null

  return (
    <div className="mb-6 p-4 bg-acl border border-ac/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <span className="text-lg flex-shrink-0">⭐</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-tx mb-0.5">よく使うツールをお気に入りに保存できます</p>
        <p className="text-xs text-muted">PRO会員ならお気に入り保存が使い放題</p>
      </div>
      <Link
        href="/pro"
        className="flex-shrink-0 text-xs font-bold text-ac hover:text-ac/80 transition-colors"
      >
        詳しく →
      </Link>
    </div>
  )
}

/** PRO CTA（ページ末尾） */
function ProCTA() {
  return (
    <div className="pro-cta-glow relative bg-ac rounded-2xl p-6 md:p-8 my-8 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <svg className="absolute top-0 right-0 w-64 h-64 text-white/[0.03]" viewBox="0 0 200 200">
          {[30, 55, 80, 105].map((r) => (
            <circle key={r} cx="170" cy="30" r={r} fill="none" stroke="currentColor" strokeWidth="0.8" />
          ))}
        </svg>
      </div>
      <div className="relative z-10 text-center">
        <span className="inline-block bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
          iwor PRO
        </span>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2 leading-snug">
          お気に入り保存・クラウド同期が使い放題
        </h3>
        <p className="text-white/70 text-sm mb-4 max-w-md mx-auto">
          よく使うツールをお気に入りに保存。月額換算 約817円で全機能アクセス。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pro"
            className="inline-flex items-center justify-center gap-2 bg-white text-ac px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors shadow-lg shadow-black/10"
          >
            PRO会員について詳しく見る
          </Link>
        </div>
        <p className="text-white/40 text-xs mt-3">¥9,800/年 〜</p>
      </div>
    </div>
  )
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
  explanation: _explanation,
  relatedTools: _relatedTools,
  references,
}: CalculatorLayoutProps) {
  // PLG: ツール利用回数トラッキング
  useEffect(() => {
    if (slug) trackToolUsage(slug)
  }, [slug])

  // 管理者チェック: ログイン済みユーザーのメールアドレスで判定
  const ADMIN_EMAIL = 'tellmedu.info@gmail.com'
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    try {
      const email = localStorage.getItem('iwor_pro_email')
      if (email === ADMIN_EMAIL) setIsAdmin(true)
    } catch {}
  }, [])

  const jsonLd = slug ? generateToolJsonLd(slug) : null

  return (
    <div className="max-w-2xl mx-auto overflow-hidden">
      {/* 構造化データ（MedicalWebPage） */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

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
              <FavoriteButton slug={slug} title={title} href={`/tools/calc/${slug}`} type="calc" />
            </ProPulseHint>
          )}
        </div>
        <p className="text-sm text-muted mt-2">{description}</p>
        {slug && (() => {
          const tool = getToolBySlug(slug)
          return tool?.updatedAt ? (
            <p className="text-xs text-muted/60 mt-1">最終確認: {tool.updatedAt.replace('-', '年')}月</p>
          ) : null
        })()}
      </header>

      {/* PLG: 3回目利用バナー */}
      <ThirdUseBanner />

      {/* 計算フォーム + 結果 */}
      {isAdmin ? (
        <>
          <section className="bg-s0 border border-br rounded-xl p-5 sm:p-6 mb-6">
            <h2 className="sr-only">入力</h2>
            {children}
          </section>
          {result && (
            <section className="mb-6" aria-live="polite">
              {result}
            </section>
          )}
        </>
      ) : (
        <div className="relative mb-6">
          {/* モザイク: 実際のコンテンツをぼかして表示 */}
          <div className="pointer-events-none select-none" aria-hidden="true">
            <section className="bg-s0 border border-br rounded-xl p-5 sm:p-6 mb-4 blur-[6px] opacity-50">
              {children}
            </section>
            {result && (
              <section className="blur-[6px] opacity-50">
                {result}
              </section>
            )}
          </div>
          {/* オーバーレイ */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/60 backdrop-blur-[2px] rounded-xl">
            <div className="text-center p-6">
              <p className="text-4xl mb-3">🔒</p>
              <p className="text-lg font-bold text-tx mb-1">準備中</p>
              <p className="text-sm text-muted mb-4">本ツールは現在検証作業中です。<br />正式公開までしばらくお待ちください。</p>
            </div>
          </div>
        </div>
      )}

      {/* ペルソナCTA */}
      <PersonaCTA context="calc" />

      {/* 免責表示 */}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn">
        <p className="font-semibold mb-1">⚠️ 医療上の免責事項</p>
        <ul className="space-y-1 text-xs leading-relaxed">
          <li>本ツールは公式文献の計算式・情報を転記したものであり、<strong>正確性は保証しません</strong>。</li>
          <li>計算結果は<strong>参考値</strong>であり、<strong>臨床判断の代替にはなりません</strong>。</li>
          <li>本ツールは<strong>医療機器（SaMD）ではありません</strong>。診断・治療方針の決定には必ず原典と臨床判断を優先してください。</li>
          <li>本ツールの利用により生じた損害について、運営者は<strong>一切の責任を負いません</strong>。</li>
        </ul>
        <div className="mt-2 pt-2 border-t border-wnb/30 flex items-center justify-between">
          <ErrorReportButton toolName={title} />
          <button
            onClick={() => { const s = encodeURIComponent(`[改善提案] ${title}`); const b = encodeURIComponent(`ページ: ${typeof window !== 'undefined' ? window.location.href : ''}\n\n改善案:\n\n`); window.open(`mailto:tellmedu.info@gmail.com?subject=${s}&body=${b}`, '_blank') }}
            className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ac transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            改善提案
          </button>
          <VerifyStatus />
        </div>
      </div>

      {/* 参考文献（明示的propsまたはtoolDef.sourcesから自動表示） */}
      {(() => {
        const toolSources = slug ? getToolBySlug(slug)?.sources : undefined
        const refs = references && references.length > 0
          ? references
          : toolSources?.map(s => ({ text: s.text, url: s.url }))
        if (!refs || refs.length === 0) return null
        return (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3">参考文献</h2>
            <ol className="list-decimal list-inside text-sm text-muted space-y-2">
              {refs.map((ref, i) => (
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
        )
      })()}

      {/* PRO CTA */}
      <ProCTA />
    </div>
  )
}
