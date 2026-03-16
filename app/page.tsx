import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/mdx'
import ArticleCard from '@/components/blog/ArticleCard'
import { AppMockup } from '@/components/AppMockup'

export const metadata: Metadata = {
  title: 'iwor（イウォル）— 医学生から医師まで、ずっと臨床のそばに',
  description: '臨床計算ツール79種、ER対応、ACLS/BLS、ICU管理、検査読影、薬剤比較155種。病棟TODO、J-OSLER管理、マッチング対策、論文フィード。医学生から医師まで、すべてがここに。',
  alternates: { canonical: 'https://iwor.jp' },
}

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 4)

  return (
    <div className="max-w-5xl mx-auto">

      {/* ═══ Hero ═══ */}
      <section className="pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="flex flex-col md:flex-row md:items-center md:gap-12">
          {/* 左: テキスト */}
          <div className="flex-1 mb-10 md:mb-0">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-acl border border-ac/20 rounded-full text-xs font-medium text-ac mb-6">
              <span className="w-1.5 h-1.5 bg-ac rounded-full animate-pulse" />
              123個の臨床ツール + 173記事、すべて無料
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-tx leading-[1.15] tracking-tight mb-5">
              医学生から医師まで、
              <br />
              ずっと臨床のそばに。
            </h1>
            <p className="text-base text-muted leading-relaxed max-w-md mb-8">
              臨床ツール、病棟管理、学習、キャリア支援。
              必要なものが、すべてひとつの場所に。
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
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
                className="inline-flex items-center justify-center bg-s0 text-tx border border-br px-7 py-3.5 rounded-xl font-medium text-sm hover:border-ac/40 hover:bg-acl transition-colors"
              >
                PRO会員について
              </Link>
            </div>
          </div>

          {/* 右: モックアップ */}
          <div className="flex-1 relative max-w-[520px] mx-auto md:mx-0">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ═══ Numbers ═══ */}
      <section className="border-y border-br py-8 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            { num: '123', label: '臨床ツール', sub: 'すべて無料' },
            { num: '173', label: '記事', sub: 'ブログ' },
            { num: '155', label: '薬剤', sub: '比較データベース' },
            { num: '7', label: 'サービス', sub: 'ひとつのプラン' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-3xl md:text-4xl font-bold text-ac tracking-tight">{item.num}</p>
              <p className="text-sm font-medium text-tx mt-0.5">{item.label}</p>
              <p className="text-xs text-muted">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Services — Bento Grid ═══ */}
      <section className="mb-24">
        <div className="mb-10">
          <p className="text-xs tracking-[0.2em] uppercase text-muted font-mono mb-3">Services</p>
          <h2 className="text-2xl md:text-3xl font-bold text-tx tracking-tight">
            ひとつのプラットフォームで、すべてを。
          </h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-4">
          {/* ── 臨床ツール (2col × 2row) ── */}
          <Link
            href="/tools"
            className="group col-span-3 md:col-span-2 md:row-span-2 rounded-2xl border-2 border-ac/20 bg-gradient-to-br from-acl/60 via-s0 to-bg overflow-hidden hover:border-ac/40 transition-all"
          >
            <div className="p-6 md:p-8 h-full flex flex-col">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-tx group-hover:text-ac transition-colors mb-1">
                    臨床ツール
                  </h3>
                  <p className="text-sm text-muted">計算・ER対応・ACLS/BLS・ICU管理・検査読影・薬剤比較</p>
                </div>
                <span className="text-xs font-bold text-ac bg-acl px-2.5 py-1 rounded-lg flex-shrink-0">
                  FREE
                </span>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                {[
                  { name: '臨床計算', count: '79' },
                  { name: 'ER対応', count: '6' },
                  { name: 'ACLS/BLS', count: '4' },
                  { name: 'ICU管理', count: '4' },
                  { name: '検査読影', count: '5' },
                  { name: '薬剤比較', count: '25' },
                ].map(t => (
                  <div key={t.name} className="bg-white/60 border border-ac/10 rounded-lg p-2.5 text-center group-hover:bg-white/80 transition-colors">
                    <p className="text-xl font-bold text-ac leading-none mb-0.5">{t.count}</p>
                    <p className="text-[10px] text-muted font-medium">{t.name}</p>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-3 border-t border-ac/10 flex items-center justify-between">
                <p className="text-xs text-muted truncate mr-4">CHA₂DS₂-VASc, eGFR, SOFA, Wells PE, A-DROP, qSOFA ...</p>
                <span className="text-xs text-ac font-medium group-hover:translate-x-1 transition-transform whitespace-nowrap flex items-center gap-1">
                  使ってみる
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>

          {/* ── 病棟TODO ── */}
          <Link href="/dashboard" className="group col-span-3 sm:col-span-1 rounded-2xl border border-br bg-s0 overflow-hidden hover:border-[#185FA5]/30 hover:bg-[#f7fbff] transition-all">
            <div className="p-5 flex flex-col items-center text-center h-full">
              <div className="w-11 h-11 bg-[#E6F1FB] rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 stroke-[#185FA5]" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l2.5 2.5L16 9"/>
                </svg>
              </div>
              <h3 className="text-sm font-bold text-tx mb-1 group-hover:text-[#185FA5] transition-colors">病棟TODO</h3>
              <p className="text-[11px] text-muted leading-relaxed">タスク管理 & 症例ログ</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E6F1FB] text-[#0C447C] mt-auto pt-3">PRO</span>
            </div>
          </Link>

          {/* ── 学習 ── */}
          <Link href="/learning" className="group col-span-3 sm:col-span-1 rounded-2xl border border-br bg-s0 overflow-hidden hover:border-[#534AB7]/30 hover:bg-[#f9f8ff] transition-all">
            <div className="p-5 flex flex-col items-center text-center h-full">
              <div className="w-11 h-11 bg-[#EEEDFE] rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 stroke-[#534AB7]" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                </svg>
              </div>
              <h3 className="text-sm font-bold text-tx mb-1 group-hover:text-[#534AB7] transition-colors">学習</h3>
              <p className="text-[11px] text-muted leading-relaxed">専門医試験対策</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EEEDFE] text-[#3C3489] mt-auto pt-3">PRO</span>
            </div>
          </Link>

          {/* ── J-OSLER ── */}
          <Link href="/josler" className="group col-span-1 rounded-2xl border border-br bg-s0 overflow-hidden hover:border-[#854F0B]/30 hover:bg-[#fffcf5] transition-all">
            <div className="p-5 flex flex-col items-center text-center h-full">
              <div className="w-11 h-11 bg-[#FAEEDA] rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 stroke-[#854F0B]" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
                </svg>
              </div>
              <h3 className="text-sm font-bold text-tx mb-1 group-hover:text-[#854F0B] transition-colors">J-OSLER</h3>
              <p className="text-[11px] text-muted leading-relaxed">症例登録 & 進捗</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAEEDA] text-[#633806] mt-auto pt-3">PRO</span>
            </div>
          </Link>

          {/* ── マッチング ── */}
          <Link href="/matching" className="group col-span-1 rounded-2xl border border-br bg-s0 overflow-hidden hover:border-[#993556]/30 hover:bg-[#fff7fa] transition-all">
            <div className="p-5 flex flex-col items-center text-center h-full">
              <div className="w-11 h-11 bg-[#FBEAF0] rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 stroke-[#993556]" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
                </svg>
              </div>
              <h3 className="text-sm font-bold text-tx mb-1 group-hover:text-[#993556] transition-colors">マッチング</h3>
              <p className="text-[11px] text-muted leading-relaxed">履歴書 & AI面接</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FBEAF0] text-[#72243E] mt-auto pt-3">PRO</span>
            </div>
          </Link>

          {/* ── 論文フィード ── */}
          <Link href="/journal" className="group col-span-1 rounded-2xl border border-br bg-s0 overflow-hidden hover:border-[#0F6E56]/30 hover:bg-[#f5fdf9] transition-all">
            <div className="p-5 flex flex-col items-center text-center h-full">
              <div className="w-11 h-11 bg-[#E1F5EE] rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 stroke-[#0F6E56]" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/>
                </svg>
              </div>
              <h3 className="text-sm font-bold text-tx mb-1 group-hover:text-[#0F6E56] transition-colors">論文フィード</h3>
              <p className="text-[11px] text-muted leading-relaxed">日本語要約</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E1F5EE] text-[#085041] mt-auto pt-3">FREEMIUM</span>
            </div>
          </Link>

          {/* ── ブログ (2col) ── */}
          <Link href="/blog" className="group col-span-3 md:col-span-2 rounded-2xl border border-br bg-s0 overflow-hidden hover:border-br2 transition-all">
            <div className="p-5 md:p-6 flex items-center gap-5">
              <div className="w-11 h-11 bg-s1 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 stroke-muted" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-tx mb-0.5 group-hover:text-ac transition-colors">ブログ</h3>
                <p className="text-[11px] text-muted">J-OSLER攻略、キャリア、専門医試験、医師の生活。<span className="font-medium text-tx">173記事</span></p>
              </div>
              <span className="text-xs font-bold text-ac bg-acl px-2.5 py-1 rounded-lg flex-shrink-0">FREE</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ Blog ═══ */}
      <section className="mb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-muted font-mono mb-3">Content</p>
            <h2 className="text-2xl md:text-3xl font-bold text-tx tracking-tight">最新の記事</h2>
          </div>
          <Link
            href="/blog"
            className="text-sm text-ac font-medium hover:underline flex items-center gap-1"
          >
            すべて見る
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
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
      <section className="mb-12">
        <div className="bg-ac rounded-2xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <svg className="absolute top-0 right-0 w-64 h-64 text-white/[0.03]" viewBox="0 0 200 200">
              {[30, 55, 80, 105].map(r => (
                <circle key={r} cx="170" cy="30" r={r} fill="none" stroke="currentColor" strokeWidth="0.8" />
              ))}
            </svg>
          </div>
          <div className="relative z-10 max-w-lg">
            <p className="text-white/50 text-xs mb-2 tracking-widest uppercase font-mono">iwor PRO</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
              すべての機能を、<br />ひとつのプランで。
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-8">
              解釈・アクションプラン・病棟管理・学習・J-OSLER・マッチング・論文フィード。
              月額換算 約817円で、臨床とキャリアのすべてにアクセス。
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
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
