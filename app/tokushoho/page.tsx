import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '特定商取引法に基づく表示',
  description: 'iworの特定商取引法に基づく表示。',
  alternates: {
    canonical: 'https://iwor.jp/tokushoho',
  },
}

export default function TokushohoPage() {
  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-tx mb-2">特定商取引法に基づく表示</h1>
      <p className="text-sm text-muted mb-10">最終更新日: 2026年3月20日</p>

      <div className="bg-s0 border border-br rounded-xl p-6 md:p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            現在、決済システムの移行準備中です。移行完了後に本ページを更新いたします。
          </p>
        </div>

        <table className="w-full text-sm">
          <tbody className="divide-y divide-br">
            <tr>
              <td className="py-3 pr-4 font-medium text-tx whitespace-nowrap align-top w-1/3">販売事業者</td>
              <td className="py-3 text-tx/80">（決済サービス移行後に表示）</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-tx whitespace-nowrap align-top">所在地</td>
              <td className="py-3 text-tx/80">請求があった場合に遅滞なく開示いたします</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-tx whitespace-nowrap align-top">連絡先</td>
              <td className="py-3 text-tx/80">
                メール：<a href="mailto:tellmedu.info@gmail.com" className="text-ac underline">tellmedu.info@gmail.com</a>
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-tx whitespace-nowrap align-top">販売価格</td>
              <td className="py-3 text-tx/80">1年パス ¥9,800 / 2年パス ¥15,800 / 3年パス ¥19,800（税込）</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-tx whitespace-nowrap align-top">支払方法</td>
              <td className="py-3 text-tx/80">（決済サービス移行後に表示）</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-tx whitespace-nowrap align-top">商品の引渡時期</td>
              <td className="py-3 text-tx/80">決済完了後、即時にサービスをご利用いただけます</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium text-tx whitespace-nowrap align-top">返品・キャンセル</td>
              <td className="py-3 text-tx/80">デジタルコンテンツの性質上、購入後の返品・返金はお受けしておりません</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-8 pt-6 border-t border-br">
          <h2 className="text-base font-bold text-tx mb-3">お問い合わせ先</h2>
          <p className="text-sm text-tx/80 leading-relaxed">
            サービスに関するお問い合わせは下記までご連絡ください。
          </p>
          <p className="text-sm mt-2">
            メール：<a href="mailto:tellmedu.info@gmail.com" className="text-ac underline">tellmedu.info@gmail.com</a>
          </p>
        </div>
      </div>
    </article>
  )
}
