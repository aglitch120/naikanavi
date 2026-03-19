'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

// ═══ 計算ロジック（クライアントサイド完結・サーバー送信なし） ═══

// 給与所得控除（2020年〜）
function salaryDeduction(income: number): number {
  if (income <= 1_625_000) return 550_000
  if (income <= 1_800_000) return income * 0.4 - 100_000
  if (income <= 3_600_000) return income * 0.3 + 80_000
  if (income <= 6_600_000) return income * 0.2 + 440_000
  if (income <= 8_500_000) return income * 0.1 + 1_100_000
  return 1_950_000
}

// 所得税率（累進課税）
function incomeTaxRate(taxableIncome: number): { rate: number; deduction: number } {
  if (taxableIncome <= 1_950_000) return { rate: 0.05, deduction: 0 }
  if (taxableIncome <= 3_300_000) return { rate: 0.10, deduction: 97_500 }
  if (taxableIncome <= 6_950_000) return { rate: 0.20, deduction: 427_500 }
  if (taxableIncome <= 9_000_000) return { rate: 0.23, deduction: 636_000 }
  if (taxableIncome <= 18_000_000) return { rate: 0.33, deduction: 1_536_000 }
  if (taxableIncome <= 40_000_000) return { rate: 0.40, deduction: 2_796_000 }
  return { rate: 0.45, deduction: 4_796_000 }
}

interface CalcResult {
  limit: number         // 控除上限目安
  limitLow: number      // 下限（安全圏）
  limitHigh: number     // 上限
  taxableIncome: number
  marginalRate: number
}

function calculateFurusato(
  totalIncome: number,   // 年収合計（万円→円）
  spouse: boolean,       // 配偶者控除あり
  dependents: number,    // 扶養人数
  ideco: number,         // iDeCo年額（円）
): CalcResult | null {
  if (totalIncome <= 0) return null

  const income = totalIncome

  // 給与所得
  const salaryIncome = income - salaryDeduction(income)

  // 所得控除
  const basicDeduction = 480_000       // 基礎控除
  const socialInsurance = income * 0.15 // 社会保険料概算（勤務医15%）
  const spouseDeduction = spouse ? 380_000 : 0
  const dependentDeduction = dependents * 380_000 // 一般扶養（16歳以上）概算
  const idecoDeduction = ideco

  const totalDeduction = basicDeduction + socialInsurance + spouseDeduction + dependentDeduction + idecoDeduction

  // 課税所得
  const taxableIncome = Math.max(salaryIncome - totalDeduction, 0)

  // 所得税率
  const { rate: marginalRate } = incomeTaxRate(taxableIncome)

  // 住民税所得割額（税率10%）
  // 住民税の課税所得 ≈ 所得税の課税所得 + 5万（人的控除差）として概算
  const residentTaxBase = Math.max(taxableIncome + 50_000, 0)
  const residentTaxAmount = residentTaxBase * 0.10

  // ふるさと納税の控除上限額
  // = 住民税所得割額 × 20% ÷ (100% - 所得税率 × 1.021 - 住民税率10%) + 2,000
  const denominator = 1 - marginalRate * 1.021 - 0.10
  const limit = denominator > 0
    ? Math.floor(residentTaxAmount * 0.20 / denominator) + 2_000
    : 0

  // 幅（±15%）— 各種控除の不確実性を反映
  const limitLow = Math.floor(limit * 0.85)
  const limitHigh = Math.floor(limit * 1.15)

  return { limit, limitLow, limitHigh, taxableIncome, marginalRate }
}

// ═══ 返礼品データ ═══

interface Gift {
  name: string
  price: string        // 寄附金額
  priceNum: number
  description: string
  emoji: string
  affiliateUrl: string // TODO: 実際のアフィリエイトリンクに差し替え
  category: string
}

const GIFTS: Gift[] = [
  // 〜5,000円
  { name: '山形県産 つや姫 5kg', price: '5,000円', priceNum: 5000, description: '特Aランク常連のブランド米。普段使いに最適。', emoji: '🍚', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E3%81%A4%E3%82%84%E5%A7%AB/', category: '〜5,000円' },
  { name: '有田みかん 5kg', price: '5,000円', priceNum: 5000, description: '冬の定番。当直のお供にも。', emoji: '🍊', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E6%9C%89%E7%94%B0%E3%81%BF%E3%81%8B%E3%82%93/', category: '〜5,000円' },
  // 5,001〜10,000円
  { name: '宮崎牛 切り落とし 1kg', price: '10,000円', priceNum: 10000, description: 'A4〜A5ランク。すき焼き・牛丼に。コスパ最強クラス。', emoji: '🥩', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E5%AE%AE%E5%B4%8E%E7%89%9B/', category: '5,001〜10,000円' },
  { name: 'いくら醤油漬け 250g', price: '10,000円', priceNum: 10000, description: '北海道産。年末年始の贅沢に。', emoji: '🐟', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E3%81%84%E3%81%8F%E3%82%89/', category: '5,001〜10,000円' },
  { name: 'シャインマスカット 2房', price: '10,000円', priceNum: 10000, description: '夏〜秋の人気No.1フルーツ。', emoji: '🍇', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E3%82%B7%E3%83%A3%E3%82%A4%E3%83%B3%E3%83%9E%E3%82%B9%E3%82%AB%E3%83%83%E3%83%88/', category: '5,001〜10,000円' },
  // 10,001〜30,000円
  { name: 'ズワイガニ 2kg', price: '20,000円', priceNum: 20000, description: 'ボイル済み。解凍するだけの手軽さ。', emoji: '🦀', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E3%82%BA%E3%83%AF%E3%82%A4%E3%82%AC%E3%83%8B/', category: '10,001〜30,000円' },
  { name: '松坂牛 ステーキ 400g', price: '30,000円', priceNum: 30000, description: '日本三大和牛。特別な日に。', emoji: '🥩', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E6%9D%BE%E5%9D%82%E7%89%9B+%E3%82%B9%E3%83%86%E3%83%BC%E3%82%AD/', category: '10,001〜30,000円' },
  { name: 'トイレットペーパー 96ロール', price: '12,000円', priceNum: 12000, description: '実用派の定番。買い物の手間が消える。', emoji: '🧻', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E3%83%88%E3%82%A4%E3%83%AC%E3%83%83%E3%83%88%E3%83%9A%E3%83%BC%E3%83%91%E3%83%BC/', category: '10,001〜30,000円' },
  // 30,001円〜
  { name: 'ダイソン ヘアドライヤー', price: '100,000円', priceNum: 100000, description: '自分へのご褒美に。実質2,000円。', emoji: '💨', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E3%83%80%E3%82%A4%E3%82%BD%E3%83%B3/', category: '30,001円〜' },
  { name: '旅行クーポン 30,000円分', price: '100,000円', priceNum: 100000, description: '学会出張と組み合わせても。', emoji: '✈️', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E+%E6%97%85%E8%A1%8C/', category: '30,001円〜' },
]

const PRICE_RANGES = ['〜5,000円', '5,001〜10,000円', '10,001〜30,000円', '30,001円〜'] as const

// ═══ コンポーネント ═══

function formatYen(n: number): string {
  return n.toLocaleString('ja-JP')
}

export default function FurusatoNozeiPage() {
  const [income, setIncome] = useState('')         // 年収（万円）
  const [sideIncome, setSideIncome] = useState('')  // バイト収入（万円）
  const [spouse, setSpouse] = useState(false)
  const [dependents, setDependents] = useState('0')
  const [ideco, setIdeco] = useState('')            // iDeCo年額（万円）
  const [activeRange, setActiveRange] = useState<string>('5,001〜10,000円')

  const result = useMemo(() => {
    const mainIncome = parseFloat(income) || 0
    const side = parseFloat(sideIncome) || 0
    const idecoAmount = (parseFloat(ideco) || 0) * 10_000
    const total = (mainIncome + side) * 10_000 // 万円→円
    if (total <= 0) return null
    return calculateFurusato(total, spouse, parseInt(dependents) || 0, idecoAmount)
  }, [income, sideIncome, spouse, dependents, ideco])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* パンくず */}
      <nav className="text-xs text-muted mb-4 flex items-center gap-1 flex-wrap">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-1">›</span>
        <span className="text-tx font-medium">ふるさと納税 控除上限シミュレーター</span>
      </nav>

      {/* ヘッダー */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-ac/10 border border-ac/20 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">🏡</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-tx">ふるさと納税 控除上限シミュレーター</h1>
            <p className="text-xs text-muted">医師・医学生のための超ざっくり計算</p>
          </div>
        </div>
      </header>

      {/* ⚠️ 免責 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">⚠️ これは概算です。</span> 
          実際の控除上限額は各種控除（住宅ローン・医療費・生命保険等）により異なります。
          正確な額は<span className="font-bold">税理士または確定申告書</span>でご確認ください。
          入力された情報は<span className="font-bold">サーバーに一切送信されません</span>（ブラウザ内で完結）。
        </p>
      </div>

      {/* ═══ 入力フォーム ═══ */}
      <section className="bg-s0 border border-br rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-bold text-tx mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-ac text-white rounded-lg flex items-center justify-center text-xs font-bold">1</span>
          年収を入力
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-tx block mb-1.5">本業の年収（額面・万円）</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={income}
                onChange={e => setIncome(e.target.value)}
                placeholder="例: 800"
                className="flex-1 px-4 py-3 bg-bg border border-br rounded-xl text-sm text-tx focus:outline-none focus:border-ac focus:ring-1 focus:ring-ac/30"
                style={{ fontSize: '16px' }}
              />
              <span className="text-sm text-muted font-medium whitespace-nowrap">万円</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-tx block mb-1.5">バイト・副収入（年間・万円）</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={sideIncome}
                onChange={e => setSideIncome(e.target.value)}
                placeholder="0"
                className="flex-1 px-4 py-3 bg-bg border border-br rounded-xl text-sm text-tx focus:outline-none focus:border-ac focus:ring-1 focus:ring-ac/30"
                style={{ fontSize: '16px' }}
              />
              <span className="text-sm text-muted font-medium whitespace-nowrap">万円</span>
            </div>
          </div>
        </div>

        <h2 className="text-sm font-bold text-tx mt-6 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-ac text-white rounded-lg flex items-center justify-center text-xs font-bold">2</span>
          家族構成
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-tx">配偶者（年収103万円以下）</span>
            <button 
              onClick={() => setSpouse(!spouse)}
              className={`w-12 h-7 rounded-full transition-colors relative ${spouse ? 'bg-ac' : 'bg-br'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${spouse ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-tx block mb-1.5">扶養家族の人数（16歳以上）</label>
            <select 
              value={dependents} 
              onChange={e => setDependents(e.target.value)}
              className="w-full px-4 py-3 bg-bg border border-br rounded-xl text-sm text-tx focus:outline-none focus:border-ac"
              style={{ fontSize: '16px' }}
            >
              {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}人</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-tx block mb-1.5">iDeCo 年間拠出額（万円・任意）</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={ideco}
                onChange={e => setIdeco(e.target.value)}
                placeholder="0"
                className="flex-1 px-4 py-3 bg-bg border border-br rounded-xl text-sm text-tx focus:outline-none focus:border-ac focus:ring-1 focus:ring-ac/30"
                style={{ fontSize: '16px' }}
              />
              <span className="text-sm text-muted font-medium whitespace-nowrap">万円</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 結果 ═══ */}
      {result && (
        <section className="mb-8">
          <div className="bg-ac/5 border-2 border-ac/30 rounded-2xl p-6 text-center">
            <p className="text-xs text-muted mb-2">ふるさと納税 控除上限の目安</p>
            <p className="text-4xl font-bold text-ac mb-1">
              約 {formatYen(Math.floor(result.limit / 1000) * 1000)} 円
            </p>
            <p className="text-sm text-muted mb-4">
              安全圏: <span className="font-bold text-tx">{formatYen(Math.floor(result.limitLow / 1000) * 1000)}</span>
              {' '}〜{' '}
              <span className="font-bold text-tx">{formatYen(Math.floor(result.limitHigh / 1000) * 1000)}</span> 円
            </p>
            <div className="bg-s0 rounded-xl p-3 text-left space-y-1">
              <p className="text-[11px] text-muted">課税所得の概算: {formatYen(result.taxableIncome)} 円</p>
              <p className="text-[11px] text-muted">所得税の限界税率: {(result.marginalRate * 100).toFixed(0)}%</p>
            </div>
          </div>
          <p className="text-[10px] text-muted mt-3 text-center leading-relaxed">
            ※ 住宅ローン控除・医療費控除・生命保険料控除等は計算に含まれていません。
            実際の上限額はこれより低くなる場合があります。安全圏を目安に寄附することを参照ください。
          </p>
        </section>
      )}

      {/* ═══ 価格帯別おすすめ返礼品 ═══ */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-tx mb-2 flex items-center gap-2">
          🎁 みんなのおすすめ返礼品
        </h2>
        <p className="text-xs text-muted mb-4">医師に人気の定番返礼品を価格帯別にピックアップ。</p>

        {/* 価格帯タブ */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {PRICE_RANGES.map(range => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeRange === range
                  ? 'bg-ac text-white'
                  : 'bg-s1 text-muted border border-br hover:bg-acl hover:text-ac'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* 返礼品カード */}
        <div className="space-y-3">
          {GIFTS.filter(g => g.category === activeRange).map((gift, i) => (
            <a
              key={i}
              href={gift.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group block bg-s0 border border-br rounded-xl p-4 hover:border-ac/30 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-acl rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{gift.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-tx group-hover:text-ac transition-colors">{gift.name}</h3>
                    <span className="text-[10px] font-bold text-ac bg-acl px-2 py-0.5 rounded-md whitespace-nowrap">{gift.price}</span>
                  </div>
                  <p className="text-xs text-muted">{gift.description}</p>
                </div>
                <svg className="w-4 h-4 text-muted flex-shrink-0 mt-1 group-hover:text-ac transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        <p className="text-[10px] text-muted mt-3 text-center">
          ※ 上記リンクはアフィリエイトリンクを含みます。返礼品の在庫・内容は変更される場合があります。
        </p>
      </section>

      {/* ═══ 医師向けTips ═══ */}
      <section className="bg-s1 rounded-2xl p-5 mb-8">
        <h2 className="text-sm font-bold text-tx mb-3">💡 医師のふるさと納税 ワンポイント</h2>
        <div className="space-y-3 text-xs text-tx leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="text-ac font-bold mt-0.5">1.</span>
            <p><span className="font-bold">バイト収入を忘れずに。</span>当直バイト・外勤の収入も年収に含めて計算しないと、控除上限を超えてしまうリスクがあります（超えた分は自己負担）。</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-ac font-bold mt-0.5">2.</span>
            <p><span className="font-bold">ワンストップ特例 vs 確定申告。</span>バイト先が2か所以上ある医師は確定申告が必要なケースが多いです。その場合ワンストップ特例は使えないので、確定申告でまとめて申告を。</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-ac font-bold mt-0.5">3.</span>
            <p><span className="font-bold">12月の駆け込みに注意。</span>年末に大量に寄附すると、決済日が翌年扱いになる場合があります。クレジットカード決済日を確認しましょう。</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-ac font-bold mt-0.5">4.</span>
            <p><span className="font-bold">安全圏で寄附。</span>この計算は概算です。迷ったら「安全圏」の金額以内で寄附するのが無難です。</p>
          </div>
        </div>
      </section>

      {/* ═══ 出典 ═══ */}
      <div className="text-[10px] text-muted border-t border-br pt-4 mb-4">
        <p className="font-bold mb-1">計算の根拠:</p>
        <p>総務省「ふるさと納税の仕組み」/ 所得税法・地方税法に基づく控除上限額の概算式を使用。社会保険料は年収の15%として概算。</p>
        <p className="mt-2">最終更新: 2026年3月</p>
      </div>
    </main>
  )
}
