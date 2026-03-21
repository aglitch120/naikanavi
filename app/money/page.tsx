'use client'

import { useState } from 'react'
import Link from 'next/link'
import FurusatoRanking from '@/components/FurusatoRanking'
import AppHeader from '@/components/AppHeader'

// ─── ふるさと納税上限概算 ───
function FurusatoCalc() {
  const [income, setIncome] = useState('')
  const [family, setFamily] = useState('single')
  const result = (() => {
    const y = Number(income)
    if (!y || y <= 0) return null
    // 簡易概算: 住民税所得割額 × 20% + 2000 の簡略版
    // 独身: 年収の約2.8%〜3.3%, 配偶者あり: やや低い, 子ありでさらに低い
    let rate = 0.028
    if (y > 5000000) rate = 0.030
    if (y > 7000000) rate = 0.032
    if (y > 10000000) rate = 0.033
    if (family === 'spouse') rate *= 0.90
    if (family === 'spouse_child') rate *= 0.82
    return Math.floor(y * rate / 1000) * 1000
  })()

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-tx block mb-1.5">年収（税込み）</label>
        <div className="relative">
          <input
            type="number"
            value={income}
            onChange={e => setIncome(e.target.value)}
            placeholder="例: 8000000"
            className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">円</span>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-tx block mb-1.5">家族構成</label>
        <select
          value={family}
          onChange={e => setFamily(e.target.value)}
          className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors"
        >
          <option value="single">独身 / 共働き</option>
          <option value="spouse">配偶者あり（専業主婦/夫）</option>
          <option value="spouse_child">配偶者+子（16歳以上）あり</option>
        </select>
      </div>
      {result !== null && (
        <div className="bg-acl border border-ac/15 rounded-xl p-4 text-center">
          <p className="text-xs text-muted mb-1">ふるさと納税 控除上限額（概算）</p>
          <p className="text-2xl font-bold text-ac">
            ¥{result.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted mt-2">※ 住宅ローン控除・医療費控除等がある場合は上限額が変わります</p>
        </div>
      )}
    </div>
  )
}

// ─── 手取り概算シミュレーター ───
function TedoriCalc() {
  const [income, setIncome] = useState('')
  const [age, setAge] = useState('under40')
  const result = (() => {
    const y = Number(income)
    if (!y || y <= 0) return null
    // 社会保険料概算（約15%）
    const shakaihokenRate = age === 'over40' ? 0.155 : 0.148
    const shakaihoken = y * shakaihokenRate
    // 所得税+住民税 概算
    const shotoku = y - shakaihoken - 480000 // 基礎控除48万
    let tax = 0
    if (shotoku > 0) {
      // 簡易累進税率（所得税+住民税≒15〜33%帯）
      if (shotoku <= 1950000) tax = shotoku * 0.15
      else if (shotoku <= 3300000) tax = 1950000 * 0.15 + (shotoku - 1950000) * 0.20
      else if (shotoku <= 6950000) tax = 1950000 * 0.15 + 1350000 * 0.20 + (shotoku - 3300000) * 0.30
      else if (shotoku <= 9000000) tax = 1950000 * 0.15 + 1350000 * 0.20 + 3650000 * 0.30 + (shotoku - 6950000) * 0.33
      else tax = 1950000 * 0.15 + 1350000 * 0.20 + 3650000 * 0.30 + 2050000 * 0.33 + (shotoku - 9000000) * 0.43
    }
    const tedori = y - shakaihoken - tax
    return {
      tedori: Math.round(tedori),
      shakaihoken: Math.round(shakaihoken),
      tax: Math.round(tax),
      monthly: Math.round(tedori / 12),
    }
  })()

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-tx block mb-1.5">年収（税込み）</label>
        <div className="relative">
          <input
            type="number"
            value={income}
            onChange={e => setIncome(e.target.value)}
            placeholder="例: 8000000"
            className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">円</span>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-tx block mb-1.5">年齢区分</label>
        <select
          value={age}
          onChange={e => setAge(e.target.value)}
          className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors"
        >
          <option value="under40">39歳以下</option>
          <option value="over40">40歳以上（介護保険料あり）</option>
        </select>
      </div>
      {result && (
        <div className="bg-acl border border-ac/15 rounded-xl p-4 space-y-2">
          <div className="text-center mb-3">
            <p className="text-xs text-muted mb-1">年間手取り（概算）</p>
            <p className="text-2xl font-bold text-ac">¥{result.tedori.toLocaleString()}</p>
            <p className="text-sm text-ac/70">月額 約¥{result.monthly.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-s0 rounded-lg p-2">
              <p className="text-[10px] text-muted">社会保険料</p>
              <p className="text-xs font-bold text-tx">¥{result.shakaihoken.toLocaleString()}</p>
            </div>
            <div className="bg-s0 rounded-lg p-2">
              <p className="text-[10px] text-muted">所得税+住民税</p>
              <p className="text-xs font-bold text-tx">¥{result.tax.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── NISA運用シミュレーター ───
function NisaCalc() {
  const [monthly, setMonthly] = useState('')
  const [years, setYears] = useState('20')
  const [rate, setRate] = useState('5')
  const result = (() => {
    const m = Number(monthly)
    const y = Number(years)
    const r = Number(rate) / 100 / 12
    if (!m || !y || m <= 0 || y <= 0) return null
    const months = y * 12
    const total = m * months
    // 複利計算: FV = PMT × ((1+r)^n - 1) / r
    const fv = r > 0
      ? m * ((Math.pow(1 + r, months) - 1) / r)
      : total
    return {
      total: Math.round(total),
      fv: Math.round(fv),
      profit: Math.round(fv - total),
    }
  })()

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-tx block mb-1.5">毎月の積立額</label>
        <div className="relative">
          <input
            type="number"
            value={monthly}
            onChange={e => setMonthly(e.target.value)}
            placeholder="例: 50000"
            className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">円/月</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-tx block mb-1.5">運用期間</label>
          <select value={years} onChange={e => setYears(e.target.value)} className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors">
            {[5, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n}年</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-tx block mb-1.5">想定利回り（年率）</label>
          <select value={rate} onChange={e => setRate(e.target.value)} className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors">
            {[3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}%</option>)}
          </select>
        </div>
      </div>
      {result && (
        <div className="bg-acl border border-ac/15 rounded-xl p-4 space-y-2">
          <div className="text-center mb-3">
            <p className="text-xs text-muted mb-1">運用結果（概算）</p>
            <p className="text-2xl font-bold text-ac">¥{result.fv.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-s0 rounded-lg p-2">
              <p className="text-[10px] text-muted">元本合計</p>
              <p className="text-xs font-bold text-tx">¥{result.total.toLocaleString()}</p>
            </div>
            <div className="bg-s0 rounded-lg p-2">
              <p className="text-[10px] text-muted">運用益（非課税）</p>
              <p className="text-xs font-bold text-ac">+¥{result.profit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 確定申告要否チェッカー ───
function KakuteiCheck() {
  const [mainJob, setMainJob] = useState('employee')
  const [sideIncome, setSideIncome] = useState('')
  const result = (() => {
    const side = Number(sideIncome)
    if (mainJob === 'employee' && !sideIncome) return null
    if (mainJob === 'freelance') return { needed: true, reason: 'フリーランス・開業医は原則として確定申告が必要です。' }
    if (mainJob === 'employee') {
      if (side > 200000) return { needed: true, reason: `給与以外の所得が20万円を超えている（${side.toLocaleString()}円）ため、確定申告が必要です。` }
      if (side > 0) return { needed: false, reason: `給与以外の所得が20万円以下（${side.toLocaleString()}円）のため、所得税の確定申告は不要です。ただし住民税の申告は必要な場合があります。` }
      return { needed: false, reason: '給与所得のみの場合、年末調整で完結するため原則不要です。ただし2箇所以上から給与を受けている場合は必要です。' }
    }
    return null
  })()

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-tx block mb-1.5">主な収入</label>
        <select
          value={mainJob}
          onChange={e => setMainJob(e.target.value)}
          className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors"
        >
          <option value="employee">勤務医（給与所得のみ）</option>
          <option value="freelance">フリーランス / 開業医</option>
        </select>
      </div>
      {mainJob === 'employee' && (
        <div>
          <label className="text-xs font-medium text-tx block mb-1.5">バイト等の副収入（年間所得）</label>
          <div className="relative">
            <input
              type="number"
              value={sideIncome}
              onChange={e => setSideIncome(e.target.value)}
              placeholder="例: 300000"
              className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">円</span>
          </div>
          <p className="text-[10px] text-muted mt-1">※ 収入ではなく所得（収入−経費）を入力</p>
        </div>
      )}
      {result && (
        <div className={`border rounded-xl p-4 ${result.needed ? 'bg-wnl border-wnb' : 'bg-okl border-okb'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-sm font-bold ${result.needed ? 'text-wn' : 'text-ok'}`}>
              {result.needed ? '→ 確定申告が必要' : '→ 原則不要'}
            </span>
          </div>
          <p className="text-xs text-tx leading-relaxed">{result.reason}</p>
        </div>
      )}
    </div>
  )
}

// ─── 関連記事 ───
const relatedArticles = [
  { href: '/blog/m02-isha-furusato-nozei', title: '医師・専攻医のふるさと納税ガイド', tag: 'ふるさと納税' },
  { href: '/blog/m07-senkoui-shisan-unyo', title: '内科専攻医の資産運用入門｜NISAとiDeCo', tag: 'NISA' },
  { href: '/blog/m01-isha-kakutei-shinkoku-nyumon', title: '専攻医・研修医の確定申告入門', tag: '確定申告' },
  { href: '/blog/m06-isha-setsuzei-road-map', title: '専攻医の節税ロードマップ', tag: '節税' },
  { href: '/blog/m04-isha-keihi-setsuzei', title: '医師が使える経費・控除まとめ', tag: '控除' },
  { href: '/blog/l04-senkoui-kyuuryo-tedori', title: '内科専攻医の給与・手取りの実態', tag: '給与' },
  { href: '/blog/l06-baito-kakutei-shinkoku', title: '専攻医バイトの確定申告ガイド', tag: 'バイト' },
  { href: '/blog/money-guide', title: '内科専攻医のお金完全ガイド', tag: '総合' },
]

// ─── メインページ ───
type ToolKey = 'furusato' | 'tedori' | 'nisa' | 'kakutei'

const tools: { key: ToolKey; label: string; icon: string }[] = [
  { key: 'furusato', label: 'ふるさと納税', icon: '🏠' },
  { key: 'tedori', label: '手取り概算', icon: '💴' },
  { key: 'nisa', label: 'NISA運用', icon: '📈' },
  { key: 'kakutei', label: '確定申告', icon: '📋' },
]

export default function MoneyPage() {
  const [activeTool, setActiveTool] = useState<ToolKey>('furusato')

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <AppHeader
        title="マネー"
        subtitle="ふるさと納税・手取り・NISA・確定申告の概算ツール"
        badge="NEW"
        favoriteSlug="app-money"
        favoriteHref="/money"
      />

      {/* Tool Tabs */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {tools.map(tool => (
          <button
            key={tool.key}
            onClick={() => setActiveTool(tool.key)}
            className={`flex flex-col items-center gap-1 rounded-xl p-3 border transition-all ${
              activeTool === tool.key
                ? 'border-ac/30 bg-acl shadow-sm'
                : 'border-br bg-s0 hover:border-ac/20'
            }`}
          >
            <span className="text-lg">{tool.icon}</span>
            <span className={`text-[10px] font-bold ${activeTool === tool.key ? 'text-ac' : 'text-muted'}`}>
              {tool.label}
            </span>
          </button>
        ))}
      </div>

      {/* Active Calculator */}
      <div className="bg-s0 border border-br rounded-2xl p-5 md:p-6 mb-6">
        <h2 className="text-base font-bold text-tx mb-4">
          {tools.find(t => t.key === activeTool)?.icon}{' '}
          {tools.find(t => t.key === activeTool)?.label}
          <span className="text-xs font-normal text-muted ml-2">概算ツール</span>
        </h2>

        {activeTool === 'furusato' && <FurusatoCalc />}
        {activeTool === 'tedori' && <TedoriCalc />}
        {activeTool === 'nisa' && <NisaCalc />}
        {activeTool === 'kakutei' && <KakuteiCheck />}
      </div>

      {/* Disclaimer */}
      <div className="bg-wnl border border-wnb rounded-xl p-3 mb-8 text-[11px] text-wn leading-relaxed">
        ⚠️ 計算結果はあくまで概算・目安です。正確な金額は税理士・所轄税務署にご確認ください。
        本ツールは税務相談・助言を行うものではありません。
      </div>

      {/* おすすめ返礼品ランキング */}
      <FurusatoRanking />

      {/* 関連記事 */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-0.5 bg-muted rounded-full" />
          <h2 className="text-lg font-bold text-tx">お金の記事</h2>
        </div>
        <div className="space-y-2">
          {relatedArticles.map(article => (
            <Link
              key={article.href}
              href={article.href}
              className="group flex items-center gap-3 bg-s0 border border-br rounded-xl p-3 hover:border-ac/30 hover:shadow-sm transition-all"
            >
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-s1 border border-br text-muted flex-shrink-0">
                {article.tag}
              </span>
              <span className="text-sm text-tx group-hover:text-ac transition-colors line-clamp-1">
                {article.title}
              </span>
              <span className="text-xs text-ac ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
