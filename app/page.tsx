import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/mdx'
import ArticleCard from '@/components/blog/ArticleCard'

export const metadata: Metadata = {
  title: 'iwor（イウォル）— 医学生から医師まで、ずっと臨床のそばに',
  description: '臨床計算ツール79種、ER対応、ACLS/BLS、ICU管理、検査読影、薬剤比較155種。病棟TODO、J-OSLER管理、マッチング対策、論文フィード。医学生から医師まで、すべてがここに。',
  alternates: { canonical: 'https://iwor.jp' },
}

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 4)

  return (
    <div className="max-w-5xl mx-auto">
      {/* ═══ ヒーロー ═══ */}
      <section className="relative text-center py-12 md:py-20 overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.04]" viewBox="0 0 800 400">
            {[60, 100, 140, 180, 220, 260].map(r => (
              <circle key={r} cx="400" cy="200" r={r} fill="none" stroke="#1B4F3A" strokeWidth="0.8" />
            ))}
          </svg>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-acl border border-ac/20 rounded-full text-xs font-medium text-ac mb-6">
            <span className="w-1.5 h-1.5 bg-ac rounded-full animate-pulse" />
            123個の臨床ツール + 173記事、すべて無料
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-tx leading-tight mb-2 tracking-tight">
            医学生から医師まで、<br className="hidden sm:inline" />ずっと臨床のそばに。
          </h1>
          <p className="text-sm text-muted font-mono tracking-widest mb-4">iwor（イウォル）</p>
          <p className="text-muted max-w-xl mx-auto leading-relaxed mb-8">
            臨床ツール、病棟管理、学習、キャリア支援 — すべてひとつの場所で。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/tools"
              className="inline-flex items-center justify-center gap-2 bg-ac text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors shadow-lg shadow-ac/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              ツールを使ってみる
            </Link>
            <Link
              href="/pro"
              className="inline-flex items-center justify-center gap-2 bg-s0 text-tx border border-br px-7 py-3.5 rounded-xl font-medium text-sm hover:border-ac/40 hover:bg-acl transition-colors"
            >
              PRO会員について
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Clinical ═══ */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-0.5 bg-ac rounded-full" />
          <p className="text-xs font-bold text-ac tracking-widest uppercase">Clinical</p>
        </div>

        {/* 臨床ツール — メインカード */}
        <Link
          href="/tools"
          className="group block mb-4 rounded-2xl border-2 border-ac/20 bg-gradient-to-br from-acl/60 via-s0 to-bg overflow-hidden hover:border-ac/40 transition-all"
        >
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-ac rounded-xl flex items-center justify-center shadow-lg shadow-ac/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-tx group-hover:text-ac transition-colors">臨床ツール</h2>
                <p className="text-xs text-muted">計算と操作は完全無料 — ER/ICUを含む緊急系もすべて公開</p>
              </div>
            </div>

            {/* ミニツールグリッド（プレビュー） */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { name: '臨床計算', count: '79種', color: 'bg-ac/10 text-ac border-ac/20' },
                { name: 'ER対応', count: '6本', color: 'bg-red-50 text-red-700 border-red-200' },
                { name: 'ACLS/BLS', count: '4本', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                { name: 'ICU管理', count: '4本', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { name: '検査読影', count: '5本', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                { name: '薬剤比較', count: '25', color: 'bg-teal-50 text-teal-700 border-teal-200' },
              ].map(t => (
                <div key={t.name} className={`${t.color} border rounded-lg px-3 py-2.5 text-center`}>
                  <p className="text-lg font-bold leading-none mb-0.5">{t.count}</p>
                  <p className="text-[10px] font-medium">{t.name}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="px-6 md:px-8 py-3 bg-ac/5 border-t border-ac/10 flex items-center justify-between">
            <p className="text-xs text-muted">CHA₂DS₂-VASc, eGFR, SOFA, Wells PE, A-DROP, qSOFA, FIB-4 ...</p>
            <span className="text-xs text-ac font-medium group-hover:translate-x-1 transition-transform">使ってみる →</span>
          </div>
        </Link>

        {/* 病棟TODO + 学習 */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* 病棟TODO */}
          <Link
            href="/dashboard"
            className="group block rounded-2xl border border-br bg-s0 overflow-hidden hover:border-[#185FA5]/30 transition-all"
          >
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#E6F1FB] rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 stroke-[#185FA5]" viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l2.5 2.5L16 9"/>
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-tx group-hover:text-[#185FA5] transition-colors">病棟TODO & 症例ログ</h2>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-wnl text-wn">PRO</span>
              </div>

              {/* ミニTODOプレビュー */}
              <div className="bg-s1 rounded-xl p-3 space-y-2 mb-3" aria-hidden="true">
                {[
                  { done: true, text: '田中さん — 採血結果確認' },
                  { done: true, text: '佐藤さん — 退院サマリ' },
                  { done: false, text: '山田さん — 循環器コンサルト' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${item.done ? 'opacity-40' : ''}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-ac border-ac' : 'border-br2'}`}>
                      {item.done && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3}><path d="M2 5l3 3 5-5"/></svg>}
                    </div>
                    <span className={`${item.done ? 'line-through text-muted' : 'text-tx'}`}>{item.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted leading-relaxed">チェックで完了→症例ログに自動記録。退院でアーカイブ。Stat tracker付き。</p>
            </div>
          </Link>

          {/* 学習 */}
          <Link
            href="/learning"
            className="group block rounded-2xl border border-br bg-s0 overflow-hidden hover:border-[#534AB7]/30 transition-all"
          >
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#EEEDFE] rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 stroke-[#534AB7]" viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round">
                      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-tx group-hover:text-[#534AB7] transition-colors">学習</h2>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-wnl text-wn">PRO</span>
              </div>

              {/* ミニクイズプレビュー */}
              <div className="bg-s1 rounded-xl p-3 mb-3" aria-hidden="true">
                <p className="text-[10px] text-muted mb-2">内科専門医試験 · 問題演習</p>
                <p className="text-xs font-medium text-tx mb-2.5 leading-relaxed">IgA腎症の腎生検所見として正しいのはどれか？</p>
                <div className="space-y-1.5">
                  {['メサンギウム増殖', '半月体形成', '糸球体基底膜の二重化', '尿細管萎縮'].map((opt, i) => (
                    <div key={i} className={`text-[10px] px-2.5 py-1.5 rounded-md border ${i === 0 ? 'bg-okl border-okb text-ok font-medium' : 'bg-s0 border-br text-muted'}`}>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed">内科専門医試験から開始。エコー・輸液など講座を順次追加。</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ Career ═══ */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-0.5 bg-wn rounded-full" />
          <p className="text-xs font-bold text-wn tracking-widest uppercase">Career</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* J-OSLER */}
          <Link
            href="/josler"
            className="group block rounded-2xl border border-br bg-s0 overflow-hidden hover:border-[#854F0B]/30 transition-all"
          >
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-[#FAEEDA] rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 stroke-[#854F0B]" viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round">
                    <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-tx group-hover:text-[#854F0B] transition-colors">J-OSLER管理</h2>
              </div>

              {/* ミニ進捗プレビュー */}
              <div className="flex items-center gap-3 mb-3" aria-hidden="true">
                <div className="relative w-12 h-12">
                  <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#FAEEDA" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#854F0B" strokeWidth="3" strokeDasharray="66 88" strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#854F0B]">75%</span>
                </div>
                <div className="text-[10px] text-muted space-y-0.5">
                  <p>症例登録 <span className="font-medium text-tx">120/160</span></p>
                  <p>疾患群 <span className="font-medium text-tx">42/56</span></p>
                  <p>病歴要約 <span className="font-medium text-tx">22/29</span></p>
                </div>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">症例登録・進捗トラッカー・病歴要約AI生成</p>
            </div>
          </Link>

          {/* マッチング */}
          <Link
            href="/matching"
            className="group block rounded-2xl border border-br bg-s0 overflow-hidden hover:border-[#993556]/30 transition-all"
          >
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-[#FBEAF0] rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 stroke-[#993556]" viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-tx group-hover:text-[#993556] transition-colors">マッチング対策</h2>
              </div>

              {/* ミニ履歴書プレビュー */}
              <div className="bg-s1 rounded-xl p-3 mb-3 space-y-1.5" aria-hidden="true">
                <div className="h-2 w-20 bg-[#993556]/20 rounded" />
                <div className="h-1.5 w-full bg-br/60 rounded" />
                <div className="h-1.5 w-4/5 bg-br/60 rounded" />
                <div className="h-1.5 w-full bg-br/60 rounded" />
                <div className="mt-2 flex gap-1">
                  <span className="text-[8px] px-1.5 py-0.5 bg-[#FBEAF0] text-[#993556] rounded">AI面接</span>
                  <span className="text-[8px] px-1.5 py-0.5 bg-[#FBEAF0] text-[#993556] rounded">病院DB</span>
                </div>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">履歴書生成・病院DB・AI面接練習</p>
            </div>
          </Link>

          {/* 論文フィード */}
          <Link
            href="/journal"
            className="group block rounded-2xl border border-br bg-s0 overflow-hidden hover:border-[#0F6E56]/30 transition-all"
          >
            <div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-[#E1F5EE] rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 stroke-[#0F6E56]" viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/>
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-tx group-hover:text-[#0F6E56] transition-colors">論文フィード</h2>
              </div>

              {/* ミニ論文カードプレビュー */}
              <div className="space-y-2 mb-3" aria-hidden="true">
                {[
                  'SGLT2阻害薬の心不全における...',
                  'GLP-1RAの腎保護効果に関する...',
                ].map((t, i) => (
                  <div key={i} className="bg-s1 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-medium text-tx truncate">{t}</p>
                    <p className="text-[9px] text-muted mt-0.5">NEJM · 2026 · 日本語要約</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted leading-relaxed">最新論文の日本語要約・ブックマーク</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ Content — ブログ ═══ */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-0.5 bg-muted rounded-full" />
          <p className="text-xs font-bold text-muted tracking-widest uppercase">Content</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-tx">ブログ</h2>
            <span className="text-xs text-muted bg-s1 px-2.5 py-0.5 rounded-full">173記事</span>
          </div>
          <Link href="/blog" className="text-xs text-ac font-medium hover:underline">すべて見る →</Link>
        </div>

        {latestPosts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {latestPosts.map(post => (
              <ArticleCard key={post.slug} post={post} compact />
            ))}
          </div>
        )}
      </section>

      {/* ═══ PRO CTA ═══ */}
      <section className="mb-8">
        <div className="bg-ac rounded-2xl p-8 md:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <svg className="absolute top-0 right-0 w-64 h-64 text-white/[0.03]" viewBox="0 0 200 200">
              {[30, 55, 80, 105].map(r => (
                <circle key={r} cx="170" cy="30" r={r} fill="none" stroke="currentColor" strokeWidth="0.8" />
              ))}
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-white/50 text-xs mb-2 tracking-widest uppercase font-mono">iwor PRO</p>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
              すべての機能を、ひとつのプランで。
            </h2>
            <p className="text-white/60 text-sm mb-6 max-w-lg mx-auto leading-relaxed">
              解釈・アクションプラン・病棟管理・学習・J-OSLER・マッチング・論文フィード。
              月額換算 約817円で、臨床とキャリアのすべてにアクセス。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/pro"
                className="inline-flex items-center justify-center bg-white text-ac px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors shadow-lg"
              >
                プランを見る
              </Link>
              <Link
                href="/pro/activate"
                className="inline-flex items-center justify-center bg-white/10 text-white border border-white/20 px-7 py-3.5 rounded-xl font-medium text-sm hover:bg-white/20 transition-colors"
              >
                ログイン / 会員登録
              </Link>
            </div>
            <p className="text-white/30 text-xs mt-4">¥9,800/年〜 · クレジットカード・PayPay・コンビニ払い</p>
          </div>
        </div>
      </section>
    </div>
  )
}
