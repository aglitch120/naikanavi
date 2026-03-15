import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/mdx'
import { categories } from '@/lib/blog-config'
import ArticleCard from '@/components/blog/ArticleCard'
import { AppMockup, GeometricDecoration, FeatureBadges } from '@/components/AppMockup'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://iwor.jp',
  },
}

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 6)
  
  return (
    <div>
      {/* ═══ ヒーローセクション ═══ */}
      <section className="relative py-12 md:py-16 -mx-4 px-4 overflow-hidden">
        <GeometricDecoration />

        <div className="relative z-10 text-center mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight">
            内科専攻医の悩みを<br />
            すべて解決する
          </h1>
          <p className="text-muted mb-1 max-w-lg mx-auto leading-relaxed">
            J-OSLER進捗管理、病歴要約、専門医試験対策から、キャリア・お金の情報まで。
          </p>
          <p className="text-sm text-muted mt-2 tracking-widest uppercase font-mono">
            iwor.jp — 内科ナビ
          </p>
        </div>

        {/* 機能バッジ */}
        <div className="relative z-10 mb-2">
          <FeatureBadges />
        </div>

        {/* クラウド同期バッジ */}
        <div className="relative z-10 flex justify-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted bg-s1 border border-br rounded-full px-4 py-1.5 mt-3">
            <svg className="w-3.5 h-3.5 text-ac" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            クラウド同期 — リアルタイム保存
          </span>
        </div>

        {/* アプリモックアップ */}
        <div className="relative z-10 max-w-xl mx-auto mb-10 px-4">
          <AppMockup />
        </div>

        {/* CTA ボタン */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
          <a
            href="https://naikanavi.booth.pm/items/8058590"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ac text-white px-6 py-3 rounded-lg font-medium hover:bg-ac2 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-ac/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            アプリを購入する
          </a>
          <a
            href="/app"
            className="bg-s0 text-ac border border-br px-6 py-3 rounded-lg font-medium hover:bg-acl hover:border-ac transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            ログイン
          </a>
        </div>
        <p className="relative z-10 text-center text-sm text-muted mt-4">
          <a href="/blog" className="text-ac hover:underline">ブログ記事を読む →</a>
        </p>
      </section>

      {/* ═══ 特長セクション ═══ */}
      <section className="py-12 md:py-16">
        <h2 className="text-xl font-bold text-center mb-2">なぜ内科ナビ？</h2>
        <p className="text-sm text-muted text-center mb-10 max-w-md mx-auto">
          J-OSLERの複雑な修了要件を、シンプルに見える化。
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-1.5L12 12m0 0l3-1.5M12 12l-3-1.5" />
                </svg>
              ),
              title: 'ダッシュボードで一目瞭然',
              desc: '120症例・56疾患群・29病歴要約の進捗をリアルタイムで把握。「あと何が足りないか」が3秒でわかる。',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              ),
              title: 'AI病歴要約テンプレート',
              desc: '370疾患に対応したAIテンプレートで、病歴要約の下書きを自動生成。差し戻しリスクを大幅軽減。',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
              ),
              title: '筆記試験の問題演習',
              desc: '370疾患×5パターンの問題を自動生成。苦手分野を特定して効率的に対策。',
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="bg-s0 border border-br rounded-xl p-6 hover:border-ac/30 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-acl flex items-center justify-center text-ac mb-4">
                {feat.icon}
              </div>
              <h3 className="font-bold text-tx mb-2">{feat.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 臨床計算ツールセクション ═══ */}
      <section className="py-12 md:py-16">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">臨床計算ツール</h2>
          <Link href="/tools" className="text-ac text-sm hover:underline">
            すべて見る →
          </Link>
        </div>
        <p className="text-sm text-muted mb-6">
          ベッドサイドですぐ使える。登録不要・無料の臨床スコア計算。
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'eGFR計算', slug: 'egfr', icon: '💧', desc: 'CKD-EPI 2021' },
            { name: 'CHA₂DS₂-VASc', slug: 'cha2ds2-vasc', icon: '❤️', desc: '心房細動の脳卒中リスク' },
            { name: 'CHADS₂', slug: 'chads2', icon: '❤️', desc: '脳卒中リスク簡易評価' },
            { name: 'Child-Pugh', slug: 'child-pugh', icon: '🫁', desc: '肝硬変の重症度', comingSoon: true },
            { name: 'CURB-65', slug: 'curb-65', icon: '🌬️', desc: '市中肺炎の重症度', comingSoon: true },
            { name: 'qSOFA', slug: 'qsofa', icon: '🦠', desc: '敗血症スクリーニング', comingSoon: true },
            { name: 'Wells PE', slug: 'wells-pe', icon: '🌬️', desc: '肺塞栓の確率評価', comingSoon: true },
            { name: 'SOFA', slug: 'sofa', icon: '🦠', desc: '臓器障害の定量評価', comingSoon: true },
          ].map(tool => (
            tool.comingSoon ? (
              <div
                key={tool.slug}
                className="bg-s1/50 border border-br/50 rounded-xl p-4 opacity-60"
              >
                <span className="text-lg">{tool.icon}</span>
                <p className="text-sm font-medium text-muted mt-1.5">{tool.name}</p>
                <p className="text-xs text-muted/70 mt-0.5">{tool.desc}</p>
                <span className="inline-block text-[10px] text-muted bg-s2 px-1.5 py-0.5 rounded mt-2">準備中</span>
              </div>
            ) : (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="bg-s0 border border-br rounded-xl p-4 hover:border-ac/30 hover:bg-acl/30 transition-colors group"
              >
                <span className="text-lg">{tool.icon}</span>
                <p className="text-sm font-medium text-tx group-hover:text-ac mt-1.5 transition-colors">{tool.name}</p>
                <p className="text-xs text-muted mt-0.5">{tool.desc}</p>
              </Link>
            )
          ))}
        </div>
      </section>

      {/* ═══ カテゴリセクション ═══ */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">カテゴリ</h2>
          <Link href="/blog" className="text-ac text-sm hover:underline">
            すべて見る →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(categories).slice(0, 8).map(([slug, category]) => (
            <Link
              key={slug}
              href={`/blog/category/${slug}`}
              className="bg-s0 border border-br rounded-lg p-4 text-center hover:border-ac hover:bg-acl transition-colors"
            >
              <span className="text-sm font-medium">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ 最新記事セクション ═══ */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">最新記事</h2>
          <Link href="/blog" className="text-ac text-sm hover:underline">
            すべて見る →
          </Link>
        </div>
        
        {latestPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {latestPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="bg-s0 border border-br rounded-lg p-8 text-center text-muted">
            <p>まだ記事がありません。近日公開予定です！</p>
          </div>
        )}
      </section>

      {/* ═══ 大CTAセクション ═══ */}
      <section className="py-8">
        <div className="relative bg-ac rounded-2xl p-8 md:p-12 overflow-hidden">
          {/* 幾何学装飾（暗い背景に白の線） */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <svg className="absolute top-0 right-0 w-72 h-72 text-white/[0.04]" viewBox="0 0 200 200">
              {[30, 50, 70, 90].map((r) => (
                <circle key={r} cx="160" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
              ))}
            </svg>
            <svg className="absolute bottom-0 left-0 w-48 h-48 text-white/[0.05]" viewBox="0 0 200 200">
              {Array.from({ length: 6 }).map((_, row) =>
                Array.from({ length: 6 }).map((_, col) => (
                  <circle key={`${row}-${col}`} cx={15 + col * 35} cy={15 + row * 35} r="2" fill="currentColor" />
                ))
              )}
            </svg>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                内科ナビで専攻医生活を効率化しませんか？
              </h2>
              <p className="text-white/60 text-sm max-w-lg mx-auto">
                J-OSLER進捗管理、AI病歴要約テンプレート、試験対策クイズ。
                内科専攻医に必要なツールをすべて一箇所に。
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* 新規ユーザー向け */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5">
                <div className="text-xs font-medium text-white/60 mb-2">はじめての方</div>
                <h3 className="font-bold text-white mb-2">BOOTHで購入する</h3>
                <p className="text-sm text-white/50 mb-4">買い切り ¥9,800。一度の購入でずっと使えます。</p>
                <a
                  href="https://naikanavi.booth.pm/items/8058590"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full bg-white text-ac px-4 py-3 rounded-lg font-medium hover:bg-white/90 transition-colors"
                >
                  BOOTHで購入 →
                </a>
              </div>
              
              {/* 既存ユーザー向け */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5">
                <div className="text-xs font-medium text-white/60 mb-2">すでにお持ちの方</div>
                <h3 className="font-bold text-white mb-2">アプリにログイン</h3>
                <p className="text-sm text-white/50 mb-4">進捗を確認、病歴要約を作成できます。</p>
                <a
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 w-full bg-transparent text-white border border-white/40 px-4 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
                >
                  ログイン →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
