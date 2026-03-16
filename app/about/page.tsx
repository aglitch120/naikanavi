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
      {/* ── Hero: iwor イラスト背景 ── */}
      <div className="relative -mx-4 px-4 pt-12 pb-16 mb-10 overflow-hidden">
        {/* 幾何学的な森・川・山のSVG背景 */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 300"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {/* 背景グラデーション */}
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B4F3A" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#1B4F3A" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <rect width="800" height="300" fill="url(#sky)" />

          {/* 遠景の山 */}
          <polygon points="0,220 120,120 240,220" fill="#1B4F3A" opacity="0.05" />
          <polygon points="160,220 320,90 480,220" fill="#1B4F3A" opacity="0.07" />
          <polygon points="400,220 560,100 720,220" fill="#1B4F3A" opacity="0.04" />
          <polygon points="600,220 740,130 800,180 800,220" fill="#1B4F3A" opacity="0.06" />

          {/* 幾何学的な木 — 三角形 */}
          {/* 左の森 */}
          <polygon points="60,220 80,160 100,220" fill="#1B4F3A" opacity="0.10" />
          <polygon points="90,220 115,150 140,220" fill="#1B4F3A" opacity="0.08" />
          <polygon points="30,220 50,170 70,220" fill="#1B4F3A" opacity="0.06" />
          <polygon points="120,220 140,175 160,220" fill="#1B4F3A" opacity="0.07" />

          {/* 中央の木 */}
          <polygon points="340,220 365,140 390,220" fill="#1B4F3A" opacity="0.09" />
          <polygon points="370,220 400,130 430,220" fill="#1B4F3A" opacity="0.07" />
          <polygon points="420,220 445,155 470,220" fill="#1B4F3A" opacity="0.10" />

          {/* 右の森 */}
          <polygon points="620,220 645,155 670,220" fill="#1B4F3A" opacity="0.08" />
          <polygon points="660,220 690,140 720,220" fill="#1B4F3A" opacity="0.10" />
          <polygon points="710,220 735,165 760,220" fill="#1B4F3A" opacity="0.06" />
          <polygon points="750,220 770,170 790,220" fill="#1B4F3A" opacity="0.08" />

          {/* 川 — 曲線 */}
          <path
            d="M0,240 Q100,230 200,245 Q350,260 500,238 Q650,215 800,240 L800,260 Q650,235 500,258 Q350,280 200,265 Q100,250 0,260Z"
            fill="#1B4F3A"
            opacity="0.05"
          />
          <path
            d="M0,255 Q150,248 300,258 Q500,270 700,250 L800,252 L800,258 Q700,256 500,276 Q300,264 150,254 L0,261Z"
            fill="#1B4F3A"
            opacity="0.03"
          />

          {/* 地面ライン */}
          <line x1="0" y1="220" x2="800" y2="220" stroke="#1B4F3A" strokeWidth="0.5" opacity="0.08" />
        </svg>

        {/* テキスト */}
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-tx text-center">iworとは</h1>
          <p className="text-sm text-muted text-center mt-3 max-w-md mx-auto">
            アイヌ語で「恵みの地」— 医師の臨床とキャリアを支える場所
          </p>
        </div>
      </div>

      <section className="space-y-8 text-sm leading-relaxed text-tx">
        {/* なぜiworなのか */}
        <div>
          <h2 className="text-base font-bold mb-3">なぜ「iwor」なのか</h2>
          <p>
            アイヌの世界観に、<span className="font-bold">iwor</span>（イウォル）という概念があります。
            人が自然とともに暮らし、山や川から恵みを受け取りながら、
            健やかに生きていくための場所。
          </p>
          <p className="mt-3">
            患者さんが長く健やかに暮らせること。
            それが、医師として私たちが最終的に目指していることだと思います。
          </p>
          <p className="mt-3">
            でも、その患者さんの「健やかな暮らし」を守っているのは、日々の臨床を支えている医師自身です。
            当直明けに病歴要約を書き、症例登録に追われ、試験勉強の時間を捻出し、
            それでも目の前の患者さんには最善の判断を求められる。
          </p>
          <p className="mt-3">
            医師を支えることは、その先にいる患者さんの暮らしを支えることにつながる。
          </p>
          <p className="mt-3 text-muted">
            研修医の頃から専門医を取得するまで、その先のキャリアまで。
            時期に応じて必要なものが変わっても、ずっと身近にある場所。
            そういう存在でありたいと思い、このサービスを<span className="font-bold text-tx">iwor</span>と名付けました。
          </p>
        </div>

        {/* 開発の経緯 */}
        <div>
          <h2 className="text-base font-bold mb-3">つくったきっかけ</h2>
          <p>
            iworは、内科専攻医として働く中で感じた小さな不満の積み重ねから生まれました。
          </p>
          <p className="mt-3">
            当直中、患者さんのeGFRを計算しようとしてアプリを開く。でも目当てのツールが見つからない。
            J-OSLERの症例登録が溜まっていく。病歴要約を書いたら指導医に差し戻される。
            試験対策の情報はブログやSNSに散らばっていて、どれが正しいかわからない。
          </p>
          <p className="mt-3">
            どれも個別には解決策がある。でも一箇所にまとまっていない。
            必要なときに必要なものがすぐ手に届く場所があれば、もっと楽になるのに。
          </p>
          <p className="mt-3 text-muted">
            ないなら作ろう。それがiworの始まりです。
          </p>
        </div>

        {/* 提供するもの */}
        <div>
          <h2 className="text-base font-bold mb-3">iworが提供するもの</h2>
          <p>
            「計算・判断・緊急はすべて無料」が原則です。
            一刻を争う場面で課金画面が出るようなサービスにはしたくない。
          </p>
          <ul className="mt-4 space-y-2.5 text-muted">
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
          <h2 className="text-base font-bold mb-3">運営</h2>
          <p>
            iworは現役の内科専攻医が個人で開発・運営しています。
            臨床の合間に少しずつ機能を追加しているため、至らない点もありますが、
            使ってくださる方の声を反映しながら改善を続けています。
          </p>
          <p className="mt-3 text-muted">
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
