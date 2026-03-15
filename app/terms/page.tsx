import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '利用規約',
  description: '内科ナビの利用規約。サービスの利用条件について説明します。',
  alternates: {
    canonical: 'https://iwor.jp/terms',
  },
}

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-tx mb-2">利用規約</h1>
      <p className="text-sm text-muted mb-10">最終更新日: 2026年3月6日</p>

      <Section title="第1条（適用）">
        <p>
          本利用規約（以下「本規約」）は、内科専門医 取得ナビ（以下「本サービス」）の利用条件を定めるものです。
          ユーザーは本規約に同意の上、本サービスを利用するものとします。
        </p>
      </Section>

      <Section title="第2条（サービス内容）">
        <p>
          本サービスは、内科専門医試験の修了要件（症例登録・疾患群・病歴要約）の進捗を管理するためのWebアプリケーションです。
          本サービスは学習支援ツールであり、試験の合格を保証するものではありません。
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
          <p className="text-amber-900 font-semibold text-sm mb-2">⚠ 患者情報に関する重要なお知らせ</p>
          <p className="text-amber-800 text-sm leading-relaxed">
            本サービスは進捗管理を目的とした個人利用のツールであり、電子カルテ・診療録の代替ではありません。
            患者の個人情報（氏名・患者ID・生年月日等）を入力・保存する目的で使用することはできません。
          </p>
        </div>
      </Section>

      <Section title="第3条（アカウント）">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>アカウントはBOOTHでの購入時に発行される注文番号1つにつき1つ発行されます。</li>
          <li>ユーザーはアカウント情報を自己の責任において管理するものとします。</li>
          <li>アカウントの譲渡・共有は禁止します。</li>
        </ol>
      </Section>

      <Section title="第4条（ユーザー情報の登録）">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>ユーザーは、本サービスの利用開始時にプロフィール情報（医師免許取得年、診療科、勤務先種別、都道府県等）の登録を求められます。</li>
          <li>登録する情報は正確かつ最新のものとし、虚偽の情報を登録してはなりません。</li>
          <li>収集した情報の取扱いについては<a href="/privacy" className="text-ac underline">プライバシーポリシー</a>に定めます。</li>
        </ol>
      </Section>

      <Section title="第5条（禁止事項）">
        <p className="mb-3">ユーザーは以下の行為を行ってはなりません。</p>
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>本サービスの不正利用、リバースエンジニアリング、スクレイピング</li>
          <li>他のユーザーのアカウントへの不正アクセス</li>
          <li>本サービスのコンテンツの無断複製・再配布</li>
          <li>サーバーに過度の負荷をかける行為</li>
          <li>法令に違反する行為、その他運営者が不適切と判断する行為</li>
          <li className="font-semibold text-amber-900">患者の個人情報（氏名、患者ID、生年月日、住所等、個人を特定しうる情報）を本サービスに入力する行為</li>
        </ol>
      </Section>

      <Section title="第6条（知的財産権）">
        <p>
          本サービスのコンテンツ（デザイン、コード、テキスト）に関する知的財産権は運営者に帰属します。
          ユーザーが本サービスに入力したデータの所有権はユーザーに帰属します。
        </p>
      </Section>

      <Section title="第7条（免責事項）">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>本サービスは「現状有姿」で提供され、特定の目的への適合性を保証しません。</li>
          <li>本サービスの利用により生じた損害について、運営者は一切の責任を負いません。</li>
          <li>運営者は事前通知なくサービスの変更・中断・終了を行うことがあります。</li>
          <li>本サービスに入力されたデータの保全・バックアップはユーザー自身の責任とします。ユーザーは必要に応じて自身でデータの記録・メモを行ってください。データの消失・破損について運営者は一切の責任を負いません。</li>
          <li className="font-semibold text-amber-900">万一、患者の個人情報が本サービスに入力された場合、それに起因するいかなる損害（個人情報の漏洩、法的責任等を含む）についても、運営者は一切の責任を負いません。</li>
        </ol>
      </Section>

      <Section title="第8条（返金）">
        <p>
          デジタルコンテンツの性質上、購入後の返金は原則として行いません。
          ただし、技術的な問題により本サービスが全く利用できない場合は個別に対応します。
        </p>
      </Section>

      <Section title="第9条（規約の変更）">
        <p>
          運営者は本規約を変更できるものとします。変更後の規約は本サービス上で公開した時点で効力を生じます。
        </p>
      </Section>

      <Section title="第10条（準拠法・管轄）">
        <p>
          本規約は日本法に準拠し、紛争が生じた場合は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
        </p>
      </Section>

      <Section title="第11条（特定商取引法に基づく表示）">
        <p>
          特定商取引法に基づく表示については、販売プラットフォームであるBOOTHの販売ページに記載しています。
        </p>
        <p className="mt-2">
          <a
            href="https://naikanavi.booth.pm/items/8058590"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ac underline"
          >
            BOOTH販売ページで確認する →
          </a>
        </p>
      </Section>

      <Section title="第12条（お問い合わせ）">
        <p>
          本規約に関するお問い合わせは、下記メールアドレスまでご連絡ください。
        </p>
        <p className="mt-2">
          メール：<a href="mailto:naikanavi.info@gmail.com" className="text-ac underline">naikanavi.info@gmail.com</a>
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-tx mb-3 pb-2 border-b border-br">{title}</h2>
      <div className="text-sm text-tx/80 leading-relaxed">{children}</div>
    </section>
  )
}
