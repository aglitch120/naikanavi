import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '利用規約',
  description: 'iwor（イウォール）の利用規約。サービスの利用条件について説明します。',
  alternates: {
    canonical: 'https://iwor.jp/terms',
  },
}

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-tx mb-2">利用規約</h1>
      <p className="text-sm text-muted mb-10">最終更新日: 2026年3月18日</p>

      <Section title="第1条（適用）">
        <p>
          本利用規約（以下「本規約」）は、iwor（イウォール、以下「本サービス」）の利用条件を定めるものです。
          ユーザーは本規約に同意の上、本サービスを利用するものとします。
        </p>
      </Section>

      <Section title="第2条（サービス内容）">
        <p>本サービスは、医師の臨床とキャリアを支える総合プラットフォームであり、以下の機能を提供します。</p>
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed mt-3">
          <li><strong>臨床計算ツール</strong>：スコアリング・薬剤用量計算・電解質補正計算等</li>
          <li><strong>医学コンテンツ</strong>：ブログ記事・検査読影・ACLS/BLSフロー・ER対応ツリー等</li>
          <li><strong>PRO機能（有料）</strong>：J-OSLER症例管理・病棟ダッシュボード・論文フィード・専門科診断等</li>
        </ol>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
          <p className="text-amber-900 font-semibold text-sm mb-2">⚠ 医療情報に関する重要なお知らせ</p>
          <p className="text-amber-800 text-sm leading-relaxed">
            本サービスは医療従事者の臨床判断を支援する目的で提供されており、診断・治療の代替とはなりません。
            臨床計算ツール・薬剤情報等の結果は参考値であり、個別の患者への適用は各医師の責任において行ってください。
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
          <p className="text-amber-900 font-semibold text-sm mb-2">⚠ 患者情報に関する重要なお知らせ</p>
          <p className="text-amber-800 text-sm leading-relaxed">
            本サービスは電子カルテ・診療録の代替ではありません。
            患者の個人情報（氏名・患者ID・生年月日等）を入力・保存する目的で使用することはできません。
          </p>
        </div>
      </Section>

      <Section title="第3条（アカウント）">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>PRO機能のご利用にはアカウント登録が必要です。無料機能（臨床計算ツール・ブログ閲覧等）はアカウント不要で利用できます。</li>
          <li>ユーザーはアカウント情報を自己の責任において管理するものとします。</li>
          <li>アカウントの譲渡・共有は禁止します。</li>
        </ol>
      </Section>

      <Section title="第4条（有料サービス）">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>PRO機能は年額制の有料サービスです。料金・支払方法はPRO紹介ページに記載します。</li>
          <li>デジタルコンテンツの性質上、購入後の返金は原則として行いません。ただし、技術的な問題により本サービスが全く利用できない場合は個別に対応します。</li>
          <li>運営者は料金を変更する場合、30日前までに通知します。</li>
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
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>本サービスのコンテンツ（デザイン、コード、テキスト、ツールのロジック）に関する知的財産権は運営者に帰属します。</li>
          <li>ユーザーが本サービスに入力したデータの所有権はユーザーに帰属します。</li>
        </ol>
      </Section>

      <Section title="第7条（データの利用）">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>運営者は、ユーザーの利用データ（ツールの使用状況、検索クエリ、閲覧履歴等）を、個人を特定できない形で統計処理し、サービスの改善・新機能の開発・コンテンツの最適化に利用することがあります。</li>
          <li>前項の統計データ（利用者数、人気ツールランキング、診療科別利用傾向等）は、本サービスの事業価値を構成する資産として、運営者が保有・活用します。</li>
          <li>個人を特定できない統計データを、提携先・広告主・潜在的事業承継者に対して提供することがあります。</li>
        </ol>
      </Section>

      <Section title="第8条（事業譲渡）">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>運営者が本サービスの事業を第三者に譲渡（事業譲渡、合併、会社分割等を含む）する場合、ユーザーのアカウント情報、利用データ、その他本サービスに関連する情報を当該第三者に移転することがあります。</li>
          <li>前項の場合、運営者は事前にユーザーに通知します。ユーザーが移転に同意しない場合は、通知後30日以内にアカウントを削除することで、データの移転を拒否できます。</li>
          <li>事業譲渡先は、本規約およびプライバシーポリシーに定める条件と同等以上のデータ保護義務を負うものとします。</li>
        </ol>
      </Section>

      <Section title="第9条（免責事項）">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>本サービスは「現状有姿」で提供され、特定の目的への適合性を保証しません。</li>
          <li>本サービスが提供する臨床計算ツール・薬剤情報・診療フローの結果は参考値であり、臨床判断の代替とはなりません。これらの情報に基づく臨床行為により生じた結果について、運営者は一切の責任を負いません。</li>
          <li>運営者は事前通知なくサービスの変更・中断・終了を行うことがあります。</li>
          <li>本サービスに入力されたデータの保全・バックアップはユーザー自身の責任とします。データの消失・破損について運営者は一切の責任を負いません。</li>
          <li className="font-semibold text-amber-900">万一、患者の個人情報が本サービスに入力された場合、それに起因するいかなる損害（個人情報の漏洩、法的責任等を含む）についても、運営者は一切の責任を負いません。</li>
        </ol>
      </Section>

      <Section title="第10条（規約の変更）">
        <p>
          運営者は本規約を変更できるものとします。変更後の規約は本サービス上で公開した時点で効力を生じます。
          重要な変更がある場合は、事前にサービス上で通知します。
        </p>
      </Section>

      <Section title="第11条（準拠法・管轄）">
        <p>
          本規約は日本法に準拠し、紛争が生じた場合は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
        </p>
      </Section>

      <Section title="第12条（お問い合わせ）">
        <p>
          本規約に関するお問い合わせは、<a href="/contact" className="text-ac underline">お問い合わせページ</a>よりご連絡ください。
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
