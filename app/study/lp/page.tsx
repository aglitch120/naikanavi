import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'iwor Study — 医師・医学生のためのフラッシュカード | Anki日本語対応',
  description: '忘却曲線に基づく間隔反復で効率的に暗記。CBT・国試・専門医試験対策。Ankiデッキ(.apkg)インポート対応。日本語ネイティブUI。無料。',
  alternates: { canonical: 'https://iwor.jp/study/lp' },
  openGraph: {
    title: 'iwor Study — 医師・医学生のためのフラッシュカード',
    description: '忘却曲線に基づく間隔反復。CBT・国試・専門医試験対策。Ankiデッキ互換。無料。',
    url: 'https://iwor.jp/study/lp',
  },
}

const studyLpJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'iwor Study',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
  description: '医師・医学生のための間隔反復フラッシュカードアプリ。CBT・国試・専門医試験対策。',
}

const features = [
  {
    title: '忘却曲線に基づく科学的復習',
    desc: 'Anki同様の間隔反復アルゴリズム。あなたの回答パターンを学習し、忘れかけるタイミングで自動的に再出題。効率よく記憶を定着させます。',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
    ),
  },
  {
    title: 'Ankiデッキ(.apkg)インポート',
    desc: '手持ちのAnkiデッキをそのままインポート。今までの学習資産を捨てる必要はありません。',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
    ),
  },
  {
    title: '日本語ネイティブUI',
    desc: 'Ankiの英語UIに苦労する必要はもうありません。日本の医学教育に特化した、直感的なインターフェース。',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" /></svg>
    ),
  },
  {
    title: 'デフォルトデッキ3種 — すぐに始められる',
    desc: 'CBT基礎・国試必修・内科基礎の3デッキ計150枚を標準搭載。インストール不要、ブラウザで今すぐ学習開始。',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
    ),
  },
  {
    title: '自作デッキ — 無制限',
    desc: '自分だけのデッキを何個でも作成可能。授業ノートや実習メモをカード化して、自分専用の問題集に。',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
    ),
  },
  {
    title: 'ストリーク & ランキング',
    desc: '連続学習日数を記録。全国ランキングで同期と競い合い、学習のモチベーションを維持。',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>
    ),
  },
]

const comparisons = [
  { feature: 'アルゴリズム', anki: 'SM-2（1987年）', iwor: '最新の間隔反復（2023年）' },
  { feature: '日本語UI', anki: '英語のみ', iwor: '完全日本語' },
  { feature: 'セットアップ', anki: 'アプリDL + 設定', iwor: 'ブラウザで即開始' },
  { feature: '.apkgインポート', anki: '○', iwor: '○（互換）' },
  { feature: 'コミュニティデッキ', anki: '分散（Reddit等）', iwor: '統合ランキング（予定）' },
  { feature: 'ストリークランキング', anki: 'なし', iwor: '全国ランキング' },
  { feature: '価格', anki: '無料（iOS ¥3,500）', iwor: '無料' },
  { feature: '他ツール連携', anki: 'なし', iwor: '臨床ツール166種+J-OSLER+マッチング' },
]

const targetExams = [
  { name: 'CBT（共用試験）', year: '医学部4年', color: 'var(--ac)' },
  { name: 'OSCE', year: '医学部4年', color: '#4338CA' },
  { name: '医師国家試験', year: '医学部6年', color: '#991B1B' },
  { name: '内科専門医試験', year: '専攻医3年', color: '#92400E' },
  { name: '総合内科専門医', year: '勤務医', color: '#6D28D9' },
]

export default function StudyLPPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(studyLpJsonLd) }}
      />

      {/* ═══ Hero ═══ */}
      <section className="text-center py-12 md:py-20 px-4">
        <p className="text-xs tracking-widest uppercase font-mono mb-3" style={{ color: 'var(--m)' }}>iwor Study</p>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4" style={{ color: 'var(--tx)' }}>
          医師・医学生のための<br className="hidden sm:inline" />フラッシュカード
        </h1>
        <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-8" style={{ color: 'var(--m)' }}>
          忘却曲線に基づく間隔反復。Ankiデッキ互換。日本語ネイティブUI。<br />
          CBT・国試・専門医試験を、科学的に効率よく。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/study"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg hover:opacity-90 transition-opacity"
            style={{ background: 'var(--ac)' }}
          >
            無料で始める
          </Link>
          <a
            href="#comparison"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-medium text-sm border transition-colors"
            style={{ color: 'var(--ac)', borderColor: 'var(--br)' }}
          >
            Ankiとの比較を見る
          </a>
        </div>
      </section>

      {/* ═══ 対応試験 ═══ */}
      <section className="px-4 mb-16">
        <div className="flex flex-wrap gap-2 justify-center">
          {targetExams.map(exam => (
            <div
              key={exam.name}
              className="px-4 py-2 rounded-full text-xs font-medium border"
              style={{ borderColor: exam.color, color: exam.color }}
            >
              {exam.name}
              <span className="ml-1.5 opacity-60">({exam.year})</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section className="px-4 mb-20">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ color: 'var(--tx)' }}>
          なぜ iwor Study なのか
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {features.map(f => (
            <div
              key={f.title}
              className="rounded-xl p-6 transition-all hover:shadow-md"
              style={{ background: 'var(--s0)', border: '1px solid var(--br)' }}
            >
              <div className="mb-3" style={{ color: 'var(--ac)' }}>{f.icon}</div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--tx)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--m)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Anki Comparison ═══ */}
      <section id="comparison" className="px-4 mb-20 scroll-mt-8">
        <h2 className="text-2xl font-bold text-center mb-3" style={{ color: 'var(--tx)' }}>
          Anki との比較
        </h2>
        <p className="text-sm text-center mb-8" style={{ color: 'var(--m)' }}>
          Ankiの資産を活かしながら、より快適な学習体験を。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: 'var(--s1)' }}>
                <th className="px-4 py-3 text-left font-semibold text-xs" style={{ color: 'var(--m)', borderBottom: '1px solid var(--br)' }}>機能</th>
                <th className="px-4 py-3 text-left font-semibold text-xs" style={{ color: 'var(--m)', borderBottom: '1px solid var(--br)' }}>Anki</th>
                <th className="px-4 py-3 text-left font-semibold text-xs" style={{ color: 'var(--ac)', borderBottom: '1px solid var(--br)' }}>iwor Study</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map(row => (
                <tr key={row.feature}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--tx)', borderBottom: '1px solid var(--br)' }}>{row.feature}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--m)', borderBottom: '1px solid var(--br)' }}>{row.anki}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ac)', borderBottom: '1px solid var(--br)' }}>{row.iwor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section className="px-4 mb-20">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ color: 'var(--tx)' }}>
          3ステップで学習開始
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'デッキを選ぶ', desc: 'CBT・国試・内科から選択。または自作デッキを作成。Ankiの.apkgファイルもインポート可能。' },
            { step: '2', title: 'カードをめくる', desc: 'タップでカードをフリップ。4段階（もう一度・難しい・普通・簡単）で自己評価。' },
            { step: '3', title: '忘却曲線が最適化', desc: 'あなたの回答パターンを学習し、忘れかけたタイミングで自動的にカードを再出題。' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4"
                style={{ background: 'var(--acl)', color: 'var(--ac)' }}
              >
                {s.step}
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--tx)' }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--m)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Free vs PRO ═══ */}
      <section className="px-4 mb-20">
        <h2 className="text-2xl font-bold text-center mb-3" style={{ color: 'var(--tx)' }}>
          無料で十分。PROでもっと便利に。
        </h2>
        <p className="text-sm text-center mb-8" style={{ color: 'var(--m)' }}>
          一人で学ぶ機能はすべて無料。PROはコミュニティ・AI・詳細統計を追加。
        </p>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-xl p-6" style={{ background: 'var(--s0)', border: '1px solid var(--br)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--tx)' }}>FREE</h3>
            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--m)' }}>
              {[
                'カード作成・編集 無制限',
                '間隔反復 無制限',
                '自作デッキ 無制限',
                'デフォルト3デッキ（150枚）',
                '.apkgインポート',
                'ストリーク記録',
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <span style={{ color: 'var(--ok)' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl p-6 relative overflow-hidden" style={{ background: 'var(--ac)', border: '1px solid var(--ac)' }}>
            <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
              PRO
            </div>
            <h3 className="text-lg font-bold mb-4 text-white">PRO — ¥980/月</h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              {[
                'FREE の全機能 +',
                'コミュニティデッキ購読（予定）',
                'AIカード自動生成（予定）',
                '詳細統計・弱点分析（予定）',
                '全国ストリークランキング',
                'Study以外の全サービスも利用可能',
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-white">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="px-4 mb-20">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--tx)' }}>
          よくある質問
        </h2>
        <div className="space-y-4 max-w-2xl mx-auto">
          {[
            { q: 'Ankiのデッキはそのまま使えますか？', a: 'はい。.apkgファイルをインポートするだけで、カードがそのままiwor Studyに取り込まれます。画像やHTML装飾にも対応しています。' },
            { q: '間隔反復とは何ですか？', a: '忘却曲線（エビングハウス）に基づき、忘れかけるタイミングで復習するアルゴリズムです。Ankiと同様の仕組みで、従来のSM-2より効率が高い最新アルゴリズムを搭載しています。' },
            { q: 'データはどこに保存されますか？', a: '学習データはブラウザのlocalStorageに保存されます。サーバーには送信されません。PRO会員はクラウド同期が利用可能になる予定です。' },
            { q: 'スマホでも使えますか？', a: 'はい。WebアプリなのでiPhone/Android/PC全てのブラウザで利用できます。ホーム画面に追加すればアプリのように使えます。' },
            { q: '無料で使い続けられますか？', a: 'はい。カード作成・間隔反復学習・自作デッキ・.apkgインポートはすべて永久無料です。PROは将来のコミュニティ機能やAI機能を追加するオプションです。' },
          ].map(faq => (
            <details
              key={faq.q}
              className="group rounded-xl overflow-hidden"
              style={{ background: 'var(--s0)', border: '1px solid var(--br)' }}
            >
              <summary className="px-5 py-4 cursor-pointer text-sm font-medium flex items-center justify-between" style={{ color: 'var(--tx)' }}>
                {faq.q}
                <svg className="w-4 h-4 flex-shrink-0 transition-transform group-open:rotate-180" style={{ color: 'var(--m)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--m)' }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="px-4 mb-12">
        <div className="rounded-2xl p-8 md:p-12 text-center" style={{ background: 'var(--ac)' }}>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            今すぐ、最初のカードをめくろう。
          </h2>
          <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
            アカウント登録不要。ブラウザで即開始。
          </p>
          <Link
            href="/study"
            className="inline-flex items-center justify-center bg-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:bg-white/90 transition-colors"
            style={{ color: 'var(--ac)' }}
          >
            無料で始める →
          </Link>
        </div>
      </section>
    </div>
  )
}
