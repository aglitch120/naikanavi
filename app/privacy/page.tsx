import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: 'iwor（イウォール）のプライバシーポリシー。個人情報の取り扱いについて説明します。',
  alternates: {
    canonical: 'https://iwor.jp/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-tx mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-muted mb-10">最終更新日: 2026年3月21日</p>

      <Section title="1. はじめに">
        <p>
          本プライバシーポリシーは、iwor（イウォール、以下「本サービス」）におけるユーザーの個人情報の取扱いについて定めるものです。
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
                <td className="border border-br px-4 py-2">アカウント情報（PRO会員のみ）</td>
                <td className="border border-br px-4 py-2">メールアドレス、パスワード（ハッシュ化）</td>
                <td className="border border-br px-4 py-2">アカウント登録時</td>
              </tr>
              <tr>
                <td className="border border-br px-4 py-2">プロフィール情報（PRO会員のみ）</td>
                <td className="border border-br px-4 py-2">医師免許取得年、診療科、勤務先種別、都道府県</td>
                <td className="border border-br px-4 py-2">任意入力</td>
              </tr>
              <tr>
                <td className="border border-br px-4 py-2">利用データ</td>
                <td className="border border-br px-4 py-2">ツール使用履歴、ページ閲覧履歴、検索クエリ、症例登録データ（PRO）</td>
                <td className="border border-br px-4 py-2">サービス利用中</td>
              </tr>
              <tr>
                <td className="border border-br px-4 py-2">技術情報</td>
                <td className="border border-br px-4 py-2">アクセスログ、IPアドレス、ブラウザ情報、Cookie</td>
                <td className="border border-br px-4 py-2">自動取得</td>
              </tr>
              <tr>
                <td className="border border-br px-4 py-2">アクセス解析</td>
                <td className="border border-br px-4 py-2">Google Analytics 4 によるアクセスデータ</td>
                <td className="border border-br px-4 py-2">自動取得（Cookie）</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="3. 本サービスで取り扱わない情報">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
          <p className="text-amber-900 font-semibold text-sm mb-2">⚠ 患者情報に関する重要なお知らせ</p>
          <p className="text-amber-800 text-sm leading-relaxed">
            本サービスは臨床支援ツール・学習支援ツールであり、以下の情報を収集・保存する目的では設計されていません。
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
        </p>
      </Section>

      <Section title="4. 利用目的">
        <p className="mb-3">収集した情報は以下の目的で利用します。</p>
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li><strong>サービスの提供・改善</strong>：アカウント管理、データ保存、機能改善、新機能の開発</li>
          <li><strong>統計・分析</strong>：利用状況の分析、人気ツール・コンテンツの把握、ユーザー属性の統計処理（個人を特定しない形式）</li>
          <li><strong>広告・マーケティング</strong>：医療関連の情報提供、広告の最適化</li>
          <li><strong>お知らせ</strong>：サービスの更新、新機能、関連サービスのご案内</li>
          <li><strong>事業価値の評価</strong>：利用統計データの集計・保有（事業譲渡・資金調達時の評価資料として）</li>
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
              <li>事業譲渡に伴う場合（第6条参照）</li>
            </ul>
          </li>
          <li>ユーザー属性の統計情報（診療科別・年次別・地域別のユーザー数等）は、個人を特定できない形で提携先・広告主に提供することがあります。</li>
        </ol>
      </Section>

      <Section title="6. 事業譲渡時のデータ移転">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>運営者が本サービスの事業を第三者に譲渡（事業譲渡、合併、会社分割、株式譲渡等を含む）する場合、本サービスに蓄積された個人情報および利用データを、事業譲渡先に移転することがあります。</li>
          <li>移転の対象には、アカウント情報、プロフィール情報、利用データ、統計データが含まれます。</li>
          <li>事業譲渡先は、移転されたデータについて本ポリシーと同等以上の保護義務を負います。</li>
          <li>事業譲渡が行われる場合、運営者はユーザーに事前に通知し、データ移転を希望しないユーザーにはアカウント削除の機会を提供します。</li>
        </ol>
      </Section>

      <Section title="7. データの保管">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>データはCloudflare（CDN・Pages・Workers・KV）のインフラストラクチャ上に保管されます。</li>
          <li>パスワードはPBKDF2でハッシュ化・ソルト付きで保存し、平文では保持しません。</li>
          <li>適切な技術的・組織的措置を講じてデータを保護します。</li>
        </ol>
        <p className="mt-3 font-semibold">Cloudflare KVに保存されるデータ一覧（PRO会員）:</p>
        <ul className="list-disc pl-6 space-y-1 text-sm leading-relaxed mt-1">
          <li>アカウント情報（メールアドレス、パスワードハッシュ、プラン、有効期限）</li>
          <li>セッショントークン（有効期限90日、自動失効）</li>
          <li>プロフィール情報（診療科、勤務先種別、都道府県等）</li>
          <li>J-OSLER管理データ（症例・疾患群・病歴要約の進捗）</li>
          <li>EPOC管理データ（研修記録の進捗）</li>
          <li>専門医単位データ（自己入力型カウンター）</li>
          <li>マッチングプロフィール（志望情報）</li>
          <li>ダッシュボードデータ（症例ログ等）</li>
        </ul>
        <p className="mt-2 text-sm leading-relaxed">
          上記に加え、ブラウザのlocalStorageにStudy学習データ（FSRSスケジュール・デッキ・ストリーク）、お気に入り、オンボーディング状態等を保存します。
          localStorageのデータはサーバーには送信されません。
        </p>
      </Section>

      <Section title="8. Cookie・アクセス解析">
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li>本サービスではセッション管理のためにCookieを使用します。</li>
          <li>Google Analytics 4（GA4）を利用してアクセス状況を分析しています。GA4はCookieを使用してデータを収集しますが、個人を特定する情報は収集しません。</li>
          <li>GA4のデータ収集を無効にしたい場合は、<a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-ac underline">Googleアナリティクス オプトアウト アドオン</a>をご利用ください。</li>
        </ol>
      </Section>

      <Section title="9. ユーザーの権利">
        <p className="mb-3">ユーザーは以下の権利を有します。</p>
        <ol className="list-decimal pl-6 space-y-2 text-sm leading-relaxed">
          <li><strong>開示請求</strong>：自己の個人情報の開示を求めることができます。</li>
          <li><strong>訂正・削除</strong>：個人情報の訂正・削除を求めることができます。</li>
          <li><strong>利用停止</strong>：個人情報の利用停止を求めることができます。</li>
          <li><strong>データエクスポート</strong>：PRO会員はアカウントに紐づくデータのエクスポートを求めることができます。</li>
        </ol>
        <p className="mt-3">
          上記の請求は、<a href="/contact" className="text-ac underline">お問い合わせページ</a>よりご連絡ください。
        </p>
      </Section>

      <Section title="10. ポリシーの変更">
        <p>
          本ポリシーは必要に応じて改定します。重要な変更がある場合はサービス上で通知します。
        </p>
      </Section>

      <Section title="11. お問い合わせ">
        <p>
          個人情報の取扱いに関するお問い合わせは、<a href="/contact" className="text-ac underline">お問い合わせページ</a>よりご連絡ください。
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
