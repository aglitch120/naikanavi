'use client'

import Link from 'next/link'
import { useState } from 'react'

// ── セグメント別訴求 ──
const segments = [
  {
    id: 'student',
    icon: '🎓',
    label: '医学生',
    sublabel: '5-6年生',
    color: 'bg-[#4338CA]/10 border-[#4338CA]/20 text-[#4338CA]',
    features: [
      { title: 'マッチング対策ツール', desc: 'プロフィール→履歴書自動生成→おすすめ病院→AI面接練習', coming: true },
      { title: '専門科診断 詳細結果', desc: '20問の質問から、重み付けアルゴリズムで最適な診療科を分析', coming: true },
      { title: '臨床ツール解釈', desc: '計算結果の臨床的意味と次のアクションを学べる', coming: false },
      { title: '論文フィード', desc: '最新論文の日本語要約を毎週配信', coming: true },
    ],
  },
  {
    id: 'resident',
    icon: '🏥',
    label: '初期研修医',
    sublabel: '1-2年目',
    color: 'bg-[#1B4F3A]/10 border-[#1B4F3A]/20 text-[#1B4F3A]',
    features: [
      { title: '病棟stat tracker', desc: '疾患をポチポチ記録→経験症例グラフ→EPOC連携用エクスポート', coming: true },
      { title: '臨床ツール解釈 + アクションプラン', desc: 'スコアの臨床的意味と具体的な対応を確認', coming: false },
      { title: '論文フィード全アーカイブ', desc: '過去の全論文要約にアクセス＋ブックマーク', coming: true },
      { title: 'お気に入りツール保存', desc: 'よく使うツールをワンタップでアクセス', coming: false },
    ],
  },
  {
    id: 'fellow',
    icon: '📋',
    label: '専攻医',
    sublabel: '内科専門医',
    color: 'bg-[#92400E]/10 border-[#92400E]/20 text-[#92400E]',
    features: [
      { title: 'J-OSLER進捗管理', desc: '症例カウント・提出状況・残りタスクを一元管理', coming: true },
      { title: '病棟stat tracker', desc: '経験疾患の分布→J-OSLER提出時にそのまま使える実績データ', coming: true },
      { title: '論文フィード + ブックマーク', desc: '専門分野の論文を効率的にキャッチアップ', coming: true },
      { title: '臨床ツール全機能', desc: '解釈・アクションプラン・お気に入り保存', coming: false },
    ],
  },
  {
    id: 'attending',
    icon: '⚕️',
    label: 'すべての医師',
    sublabel: '',
    color: 'bg-[#1E3A5F]/10 border-[#1E3A5F]/20 text-[#1E3A5F]',
    features: [
      { title: '病棟stat tracker', desc: '担当症例をサクッと記録。疾患別・月別の統計データを自動生成', coming: true },
      { title: '論文フィード', desc: '分野横断の最新論文要約＋ブックマーク', coming: true },
      { title: '臨床ツール全機能', desc: '120+ツールの深い解釈とアクションプラン', coming: false },
      { title: 'お気に入り + 計算履歴', desc: 'よく使うツールを即座にアクセス', coming: false },
    ],
  },
]

// ── 料金プラン ──
const plans = [
  {
    id: '1y',
    label: '1年パス',
    price: 9800,
    priceDisplay: '¥9,800',
    monthly: '約817円',
    period: '/ 年',
    discount: null,
    popular: false,
  },
  {
    id: '2y',
    label: '2年パス',
    price: 15800,
    priceDisplay: '¥15,800',
    monthly: '約658円',
    period: '/ 2年',
    discount: '19%OFF',
    popular: true,
  },
  {
    id: '3y',
    label: '3年パス',
    price: 19800,
    priceDisplay: '¥19,800',
    monthly: '約550円',
    period: '/ 3年',
    discount: '33%OFF',
    popular: false,
  },
]

// ── FREE vs PRO 比較 ──
const comparison = [
  { feature: '臨床計算ツール（79種）', free: '✓ 計算・結果表示', pro: '✓ + 解釈・アクションプラン' },
  { feature: 'ER対応ツリー（6本）', free: '✓ 全公開', pro: '✓ 全公開' },
  { feature: 'ACLS/BLS フロー（4本）', free: '✓ 全公開', pro: '✓ 全公開' },
  { feature: 'ICU管理ツール（4本）', free: '✓ 全公開', pro: '✓ 全公開' },
  { feature: '検査読影（5本）', free: '✓ フロー操作', pro: '✓ + 総合解釈・鑑別' },
  { feature: '薬剤比較（25カテゴリ）', free: '✓ 全公開', pro: '✓ 全公開' },
  { feature: '生活習慣病 総合管理', free: '✓ 判定結果', pro: '✓ + アクションプラン' },
  { feature: 'お気に入りツール保存', free: '—', pro: '✓ 無制限' },
  { feature: '病棟stat tracker', free: '直近7日間', pro: '✓ 全期間 + グラフ + エクスポート' },
  { feature: '論文フィード', free: '最新3件', pro: '✓ 全アーカイブ + ブックマーク' },
  { feature: 'J-OSLER進捗管理', free: '—', pro: '✓ 全機能' },
  { feature: 'マッチング対策ツール', free: '一部体験', pro: '✓ 履歴書生成・AI面接' },
  { feature: '専門科診断 結果', free: '途中まで', pro: '✓ 詳細レポート' },
]

// ── FAQ ──
const faqs = [
  {
    q: '無料で使える機能はありますか？',
    a: '臨床計算ツール79種の入力・計算・結果表示、ER対応ツリー、ACLS/BLSフロー、ICU管理ツール、薬剤比較表は完全無料です。緊急時に使うツールは一切制限しません。',
  },
  {
    q: 'PROにするメリットは何ですか？',
    a: '計算結果の臨床的解釈、推奨アクション、お気に入り保存、病棟stat tracker、論文フィード全アーカイブなどが使い放題になります。特に解釈セクションは「この結果をどう臨床に活かすか」がわかるため、学習効果が大きいです。',
  },
  {
    q: '患者データは保存されますか？',
    a: 'いいえ。iworは患者データを一切保存しません。保存されるのはあなた自身のキャリアデータ（経験疾患数、お気に入り、論文ブックマーク等）のみです。',
  },
  {
    q: '途中解約はできますか？',
    a: 'パス期間中はいつでも解約申請できます。解約後30日間の猶予期間があり、その間に再開すればデータは保持されます。猶予期間後にデータは完全削除されます。',
  },
  {
    q: '支払い方法は？',
    a: '現在はBOOTH経由でのお支払いです。クレジットカード・PayPay・コンビニ払いに対応。将来的にStripe直接決済を導入予定です。',
  },
  {
    q: '医学生でも使えますか？',
    a: 'もちろんです。臨床実習やCBT準備に使える臨床計算ツール、マッチング対策ツール（開発中）、専門科診断など、医学生向けの機能を充実させています。',
  },
]

export default function ProPage() {
  const [activeSegment, setActiveSegment] = useState('resident')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const currentSegment = segments.find(s => s.id === activeSegment)!

  return (
    <div className="max-w-4xl mx-auto -mt-2">
      {/* パンくず */}
      <nav className="text-sm text-muted mb-8">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <span>iwor PRO</span>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="text-center mb-16">
        <div className="inline-block mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-ac/10 border border-ac/20 text-ac text-xs font-bold rounded-full tracking-wide">
            ✦ iwor PRO
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-tx leading-tight mb-4">
          臨床ツールの<span className="text-ac">深い解釈</span>と<br className="md:hidden" />
          <span className="text-ac">キャリアデータ</span>を、あなたに。
        </h1>
        <p className="text-base text-muted max-w-xl mx-auto leading-relaxed mb-6">
          計算結果の意味、次にすべきアクション、経験症例の記録。
          <br className="hidden sm:inline" />
          使うほど価値が積み上がる、医師のためのプロツール。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 bg-ac text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors shadow-lg shadow-ac/20"
          >
            プランを選ぶ
          </a>
          <a
            href="#compare"
            className="inline-flex items-center justify-center gap-2 bg-s0 text-tx border border-br px-8 py-3.5 rounded-xl font-medium text-sm hover:border-ac/40 hover:bg-acl transition-colors"
          >
            無料との違いを見る
          </a>
        </div>
      </section>

      {/* ═══ 数字 ═══ */}
      <section className="grid grid-cols-3 gap-4 mb-16">
        {[
          { num: '120+', label: '臨床ツール', sub: '計算・ER・ACLS・ICU・読影・薬剤比較' },
          { num: '¥817', label: '月額換算', sub: '1年パス ¥9,800' },
          { num: '0', label: '患者データ保存', sub: 'キャリアデータのみ' },
        ].map((s) => (
          <div key={s.label} className="text-center p-4 bg-s0 border border-br rounded-xl">
            <p className="text-2xl md:text-3xl font-bold text-ac">{s.num}</p>
            <p className="text-sm font-medium text-tx mt-1">{s.label}</p>
            <p className="text-[11px] text-muted mt-0.5">{s.sub}</p>
          </div>
        ))}
      </section>

      {/* ═══ セグメント別訴求 ═══ */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-tx text-center mb-2">あなたに合った使い方</h2>
        <p className="text-sm text-muted text-center mb-6">ステージごとに、PROが活きるポイントが違います</p>

        {/* タブ */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {segments.map(seg => (
            <button
              key={seg.id}
              onClick={() => setActiveSegment(seg.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${
                activeSegment === seg.id
                  ? 'bg-ac text-white border-ac shadow-md shadow-ac/20'
                  : 'bg-s0 text-muted border-br hover:border-ac/30'
              }`}
            >
              <span>{seg.icon}</span>
              <span>{seg.label}</span>
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className={`rounded-2xl border p-6 ${currentSegment.color.split(' ').slice(0, 2).join(' ')}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{currentSegment.icon}</span>
            <div>
              <h3 className="font-bold text-tx">{currentSegment.label}</h3>
              {currentSegment.sublabel && <p className="text-xs text-muted">{currentSegment.sublabel}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentSegment.features.map((f, i) => (
              <div key={i} className="bg-s0/80 backdrop-blur-sm rounded-xl p-4 border border-br/50">
                <div className="flex items-start gap-2">
                  <span className="text-ac text-sm mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-bold text-tx">
                      {f.title}
                      {f.coming && <span className="ml-1.5 text-[10px] font-normal bg-wnl text-wn px-1.5 py-0.5 rounded">開発中</span>}
                    </p>
                    <p className="text-xs text-muted mt-0.5">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 料金プラン ═══ */}
      <section id="pricing" className="mb-16 scroll-mt-20">
        <h2 className="text-xl font-bold text-tx text-center mb-2">料金プラン</h2>
        <p className="text-sm text-muted text-center mb-8">全機能が使い放題の1プラン。期間だけ選べます。</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 text-center transition-all ${
                plan.popular
                  ? 'bg-ac text-white border-ac shadow-xl shadow-ac/20 scale-[1.02]'
                  : 'bg-s0 border-br hover:border-ac/30'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-ac text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  おすすめ
                </span>
              )}
              {plan.discount && !plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-wnl text-wn text-xs font-bold px-3 py-1 rounded-full">
                  {plan.discount}
                </span>
              )}
              {plan.discount && plan.popular && (
                <span className="absolute -top-3 right-4 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {plan.discount}
                </span>
              )}

              <p className={`text-sm font-bold mb-3 ${plan.popular ? 'text-white/80' : 'text-muted'}`}>
                {plan.label}
              </p>
              <p className="text-3xl font-bold mb-1">{plan.priceDisplay}</p>
              <p className={`text-xs mb-4 ${plan.popular ? 'text-white/60' : 'text-muted'}`}>
                月額換算 {plan.monthly}
              </p>
              <a
                href="https://iwor.booth.pm/"
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                  plan.popular
                    ? 'bg-white text-ac hover:bg-white/90'
                    : 'bg-ac text-white hover:bg-ac2'
                }`}
              >
                {plan.label}を購入
              </a>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted text-center mt-4">
          ※ BOOTH経由でお支払い。クレジットカード・PayPay・コンビニ払い対応。
        </p>
        <p className="text-center mt-2">
          <a
            href="/pro/activate"
            className="text-xs text-ac hover:underline"
          >
            購入済みの方はこちら（注文番号で有効化）→
          </a>
        </p>
      </section>

      {/* ═══ FREE vs PRO 比較表 ═══ */}
      <section id="compare" className="mb-16 scroll-mt-20">
        <h2 className="text-xl font-bold text-tx text-center mb-2">無料 vs PRO</h2>
        <p className="text-sm text-muted text-center mb-6">緊急ツールは永久無料。PROは解釈・保存・蓄積が使い放題。</p>

        <div className="bg-s0 border border-br rounded-2xl overflow-hidden">
          {/* ヘッダー */}
          <div className="grid grid-cols-[1fr,1fr,1fr] bg-s1 border-b border-br">
            <div className="p-3 text-xs font-bold text-muted">機能</div>
            <div className="p-3 text-xs font-bold text-muted text-center border-l border-br">FREE</div>
            <div className="p-3 text-xs font-bold text-ac text-center border-l border-br bg-acl/30">PRO</div>
          </div>
          {/* 行 */}
          {comparison.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-[1fr,1fr,1fr] ${i < comparison.length - 1 ? 'border-b border-br' : ''}`}
            >
              <div className="p-3 text-xs text-tx font-medium">{row.feature}</div>
              <div className="p-3 text-xs text-muted text-center border-l border-br">{row.free}</div>
              <div className="p-3 text-xs text-ac font-medium text-center border-l border-br bg-acl/10">{row.pro}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 安全性の約束 ═══ */}
      <section className="mb-16">
        <div className="bg-acl border border-ac/20 rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-bold text-tx mb-4 text-center">iworの約束</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '🛡️', title: '患者データゼロ', desc: '患者の個人情報・検査値は一切保存しません。キャリアデータ（経験疾患数等）のみ。' },
              { icon: '🚨', title: '緊急ツール永久無料', desc: 'ER対応・ACLS・ICU管理は完全公開。患者安全に関わる情報は絶対に有料化しません。' },
              { icon: '📖', title: '出典明記・E-E-A-T準拠', desc: '全ツールに根拠論文・ガイドラインを明記。医師が監修。' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <span className="text-2xl block mb-2">{item.icon}</span>
                <p className="text-sm font-bold text-tx mb-1">{item.title}</p>
                <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-tx text-center mb-6">よくある質問</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-s0 border border-br rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-s1/50 transition-colors"
              >
                <span className="text-sm font-medium text-tx pr-4">{faq.q}</span>
                <span className={`text-muted transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 最終CTA ═══ */}
      <section className="mb-8">
        <div className="bg-ac rounded-2xl p-8 md:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <svg className="absolute top-0 right-0 w-64 h-64 text-white/[0.03]" viewBox="0 0 200 200">
              {[30, 55, 80, 105].map((r) => (
                <circle key={r} cx="170" cy="30" r={r} fill="none" stroke="currentColor" strokeWidth="0.8" />
              ))}
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-white/60 text-sm mb-2">iwor PRO</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              今日から、臨床をもっと深く。
            </h2>
            <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
              120+の臨床ツール、解釈、アクションプラン。月額約817円で全機能アクセス。
            </p>
            <a
              href="https://iwor.booth.pm/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-ac px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors shadow-lg"
            >
              BOOTHで購入する
            </a>
            <p className="text-white/40 text-xs mt-3">¥9,800/年〜 ・ クレジットカード・PayPay・コンビニ払い</p>
          </div>
        </div>
      </section>
    </div>
  )
}
