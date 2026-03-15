import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'iworとは',
  description: 'iwor（イウォル）は医師の臨床とキャリアを支えるWebプラットフォーム。名前の由来、開発の経緯、提供する機能について。',
  alternates: {
    canonical: 'https://iwor.jp/about',
  },
}

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-tx mb-8">iworとは</h1>

      <section className="space-y-6 text-sm leading-relaxed text-tx">
        {/* 名前の由来 */}
        <div>
          <h2 className="text-base font-bold mb-2">名前の由来</h2>
          <p>
            <span className="font-bold">iwor</span>（イウォル）は、アイヌ語で「恵みの地」を意味する言葉です。
            神々が住む世界であり、人が生きるために必要なものを自然から受け取る場所。
          </p>
          <p className="mt-2 text-muted">
            臨床の現場で必要な知識やツールを、いつでも手の届く場所に。
            医師にとっての「恵みの地」でありたい、という思いを込めました。
          </p>
        </div>

        {/* 開発の経緯 */}
        <div>
          <h2 className="text-base font-bold mb-2">なぜ作ったのか</h2>
          <p>
            iworは、内科専攻医として働く中で感じた「あったらいいのに」から生まれました。
          </p>
          <p className="mt-2">
            J-OSLERの症例登録に追われる日々。病歴要約の書き方がわからず指導医に何度も差し戻される。
            当直中に計算ツールを探してアプリを開くが、検索では出てこない。
            論文を読む時間がない。試験対策の情報が散らばっている。
          </p>
          <p className="mt-2">
            どれも個別には解決策があるけれど、一箇所にまとまっていない。
            それなら自分で作ろう、と思ったのがきっかけです。
          </p>
        </div>

        {/* 提供するもの */}
        <div>
          <h2 className="text-base font-bold mb-2">iworが提供するもの</h2>
          <p>
            iworは「計算・判断・緊急はすべて無料」を原則としています。
          </p>
          <ul className="mt-3 space-y-2 text-muted">
            <li className="flex gap-2">
              <span>🧮</span>
              <span><span className="text-tx font-medium">臨床計算ツール</span> — eGFR、CHA₂DS₂-VASc、SOFA、A-aDO₂など。ブラウザだけで即使える</span>
            </li>
            <li className="flex gap-2">
              <span>🚨</span>
              <span><span className="text-tx font-medium">ACLS/BLS・ER対応・ICU管理</span> — 一刻も争う場面で迷わない</span>
            </li>
            <li className="flex gap-2">
              <span>📝</span>
              <span><span className="text-tx font-medium">J-OSLER管理</span> — 症例登録・病歴要約・進捗の一元管理</span>
            </li>
            <li className="flex gap-2">
              <span>📰</span>
              <span><span className="text-tx font-medium">論文フィード</span> — 最新論文の日本語要約</span>
            </li>
            <li className="flex gap-2">
              <span>📖</span>
              <span><span className="text-tx font-medium">臨床トレーニング</span> — 症例ベースの問題演習</span>
            </li>
          </ul>
        </div>

        {/* 運営者 */}
        <div>
          <h2 className="text-base font-bold mb-2">運営</h2>
          <p>
            iworは現役の内科専攻医が個人で開発・運営しています。
            臨床の合間に少しずつ機能を追加しているため、至らない点もありますが、
            使ってくださる方の声を反映しながら改善を続けています。
          </p>
          <p className="mt-2 text-muted">
            ご意見・ご要望は<Link href="/contact" className="text-ac underline">お問い合わせ</Link>からお気軽にどうぞ。
          </p>
        </div>
      </section>

      {/* ナビゲーション */}
      <div className="mt-12 pt-8 border-t border-br flex flex-wrap gap-4 text-sm">
        <Link href="/tools" className="text-ac hover:underline">臨床ツール →</Link>
        <Link href="/blog" className="text-ac hover:underline">ブログ →</Link>
        <Link href="/contact" className="text-ac hover:underline">お問い合わせ →</Link>
      </div>
    </main>
  )
}
