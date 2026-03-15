import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: 'iworのプライバシーポリシー。個人情報の取り扱いについて説明します。',
  alternates: {
    canonical: 'https://iwor.jp/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-tx mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-muted mb-10">最終更新日: 2026年3月6日</p>

      <Section title="1. はじめに">
        <p>
          本プライバシーポリシーは、内科専門医 取得ナビ（以下「本サービス」）におけるユーザーの個人情報の取扱いについて定めるものです。
          運営者は個人情報の保護に関する法律（個人情報保護法）を遵守し、適切な管理を行います。
        </p>
      </Section>

      <Section title="2. 収集する情報">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse my-4">
            <thead>
              <tr className="bg-s1">
                <th className="border border-br px-4 py-2 text-left font-semibold text-muted text-xs">情報の種類</th>
                <th className="border border-br px-4 py-2 text-left font-semibold text-muted text-xs">収集項目</th>
                <th className="border border-br px-4 py-2 text-left font-semibold text-muted text-xs">収集方法</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-br px-4 py-2">アカウント情報</td>
                <td className="border border-br px-4 py-2">メールアドレス、パスワード（ハッシュ化）、注文番号</td>
                <td className="border border-br px-4 py-2">アカウント発行時</td>
              </tr>
              <tr>
                <td className="border border-br px-4 py-2">プロフィール情報</td>
                <td className="border border-br px-4 py-2">氏名、医師免許取得年、診療科、勤務先種別、都道府県、性別、生年、卒業大学</td>
                <td className="border border-br px-4 py-2">初回利用時の入力</td>
              </tr>
              <tr>
                <td className="border border-br px-4 py-2">利用データ</td>
                <td className="border border-br px-4 py-2">症例登録データ、進捗情報</td>
                <td className="border border-br px-4 py-2">サービス利用中</td>
              </tr>
              <tr>
                <td className="border border-br px-4 py-2">技術情報</td>
                <td className="border border-br px-4 py-2">アクセスログ、IPアドレス</td>
                <td className="border border-br px-4 py-2">自動取得</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="3. 本サービスで取り扱わない情報">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
          <p className="text-amber-900 font-semibold text-sm mb-2">⚠ 患者情報に関する重要なお知らせ</p>
          <p className="text-amber-800 text-sm leading-relaxed">
            本サービスは進捗管理ツールであり、以下の情報を収集・保存する目的では設計されていません。
            ユーザーはこれらの情報を本サービスに入力しないでください。
          </p>
        </div>
        <ul className="list-disc pl-6 space-y-1.5 text-sm leading-relaxed">
          <li>患者の氏名、患者ID、生年月日、住所その他の個人を特定しうる情報</li>
          <li>診療録・カルテに該当する情報</li>
          <li>その他、第三者の個人情報</li>
        </ul>
        <p className="mt-3">
          万一これらの情報が入力された場合でも、運営者はその管理・保護について一切の責任を負いません。
          ユーザーは自身の責任において、患者の個人情報が含まれないよう管理してください。
        </p>
      </Section>

      <Section title="4. 利用目的">
        <p className="mb-3">収集した情報は以下の目的で利用します。</p>
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li><strong>サービスの提供・改善</strong>：アカウント管理、データ保存、機能改善</li>
          <li><strong>統計・分析</strong>：利用状況の分析、ユーザー属性の統計処理（個人を特定しない形式）</li>
          <li><strong>広告・マーケティング</strong>：ユーザー属性に基づく医療関連の情報提供、広告の最適化、提携先への統計データの提供</li>
          <li><strong>お知らせ</strong>：サービスの更新、新機能、関連サービスのご案内</li>
        </ol>
      </Section>

      <Section title="5. 第三者提供">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>個人を特定できる情報を、ユーザーの同意なく第三者に提供することはありません。</li>
          <li>
            ただし、以下の場合は除きます：
            <ul className="list-disc pl-6 mt-1.5 space-y-1">
              <li>法令に基づく場合</li>
              <li>人の生命・身体・財産の保護に必要な場合</li>
              <li>個人を特定できない統計データとして提供する場合</li>
            </ul>
          </li>
          <li>ユーザー属性の統計情報（診療科別・年次別・地域別のユーザー数等）は、個人を特定できない形で提携先・広告主に提供することがあります。</li>
        </ol>
      </Section>

      <Section title="6. データの保管">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>データはCloudflareのインフラストラクチャ上に保管されます。</li>
          <li>パスワードはハッシュ化して保存し、平文では保持しません。</li>
          <li>適切な技術的・組織的措置を講じてデータを保護します。</li>
        </ol>
      </Section>

      <Section title="7. ユーザーの権利">
        <p className="mb-3">ユーザーは以下の権利を有します。</p>
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li><strong>開示請求</strong>：自己の個人情報の開示を求めることができます。</li>
          <li><strong>訂正・削除</strong>：個人情報の訂正・削除を求めることができます。</li>
          <li><strong>利用停止</strong>：個人情報の利用停止を求めることができます。</li>
        </ol>
        <p className="mt-3">
          上記の請求は、<a href="mailto:naikanavi.info@gmail.com" className="text-ac underline">naikanavi.info@gmail.com</a> までご連絡ください。
        </p>
      </Section>

      <Section title="8. Cookieの使用">
        <p>
          本サービスではセッション管理のためにCookieを使用します。
          Cookieはログイン状態の維持にのみ使用し、トラッキング目的では使用しません。
        </p>
      </Section>

      <Section title="9. ポリシーの変更">
        <p>
          本ポリシーは必要に応じて改定します。重要な変更がある場合はサービス上で通知します。
        </p>
      </Section>

      <Section title="10. お問い合わせ">
        <p>
          個人情報の取扱いに関するお問い合わせは、下記メールアドレスまでご連絡ください。
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
