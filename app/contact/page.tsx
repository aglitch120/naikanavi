import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'お問い合わせ',
  description: '内科ナビへのお問い合わせ。ご質問・ご要望はこちらからお寄せください。',
  alternates: {
    canonical: 'https://iwor.jp/contact',
  },
}

export default function ContactPage() {
  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-tx mb-2">お問い合わせ</h1>
      <p className="text-sm text-muted mb-10">ご質問・ご要望がありましたらお気軽にご連絡ください。</p>

      <div className="bg-s0 border border-br rounded-xl p-6 md:p-8 mb-8">
        <h2 className="text-lg font-bold text-tx mb-4">メールでのお問い合わせ</h2>
        <p className="text-sm text-tx/80 leading-relaxed mb-4">
          サービスに関するご質問、不具合のご報告、機能のご要望などは、以下のメールアドレスまでお送りください。
          原則として3営業日以内にご返信いたします。
        </p>
        <a
          href="mailto:naikanavi.info@gmail.com"
          className="inline-flex items-center gap-2 bg-ac text-white px-5 py-3 rounded-lg hover:bg-ac2 transition-colors font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          naikanavi.info@gmail.com
        </a>
      </div>

      <div className="bg-s0 border border-br rounded-xl p-6 md:p-8 mb-8">
        <h2 className="text-lg font-bold text-tx mb-4">よくあるお問い合わせ</h2>
        <div className="space-y-5">
          <FaqItem
            q="パスワードを忘れました"
            a="ログイン画面の「パスワードを忘れた方」からBOOTHの注文番号を使って再発行できます。"
          />
          <FaqItem
            q="アカウントが発行できません"
            a="購入直後の場合、注文番号の反映に数分かかることがあります。しばらくお待ちいただいてから再度お試しください。解決しない場合はメールでお問い合わせください。"
          />
          <FaqItem
            q="データのバックアップはできますか？"
            a="入力されたデータはクラウド上に自動保存されます。ただし、データのエクスポート機能は現在提供していないため、万一に備えて重要なデータは別途メモを取っていただくことをおすすめします。"
          />
          <FaqItem
            q="返金は可能ですか？"
            a="デジタルコンテンツの性質上、原則として返金は行っておりません。技術的な問題で全くご利用いただけない場合は個別に対応いたします。"
          />
        </div>
      </div>

      <div className="text-sm text-muted text-center">
        <p>
          購入に関するお問い合わせは
          <a
            href="https://naikanavi.booth.pm/items/8058590"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ac underline ml-1"
          >
            BOOTHの販売ページ
          </a>
          からもご連絡いただけます。
        </p>
      </div>
    </article>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-br pb-4 last:border-b-0 last:pb-0">
      <h3 className="text-sm font-semibold text-tx mb-1.5">Q. {q}</h3>
      <p className="text-sm text-tx/70 leading-relaxed">A. {a}</p>
    </div>
  )
}
