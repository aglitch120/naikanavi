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

    // 給与所得控除（2024年度〜）
    let kyuyoKojo: number
    if (y <= 1625000) kyuyoKojo = 550000
    else if (y <= 1800000) kyuyoKojo = y * 0.4 - 100000
    else if (y <= 3600000) kyuyoKojo = y * 0.3 + 80000
    else if (y <= 6600000) kyuyoKojo = y * 0.2 + 440000
    else if (y <= 8500000) kyuyoKojo = y * 0.1 + 1100000
    else kyuyoKojo = 1950000

    // 社会保険料概算（健保+厚生年金+雇用保険 ≒ 約15%）
    const shakaihokenRate = age === 'over40' ? 0.155 : 0.148
    const shakaihoken = y * shakaihokenRate

    // 課税所得 = 年収 - 給与所得控除 - 社会保険料 - 基礎控除48万
    const shotoku = Math.max(0, y - kyuyoKojo - shakaihoken - 480000)

    // 所得税（累進課税）
    let incomeTax: number
    if (shotoku <= 1950000) incomeTax = shotoku * 0.05
    else if (shotoku <= 3300000) incomeTax = shotoku * 0.10 - 97500
    else if (shotoku <= 6950000) incomeTax = shotoku * 0.20 - 427500
    else if (shotoku <= 9000000) incomeTax = shotoku * 0.23 - 636000
    else if (shotoku <= 18000000) incomeTax = shotoku * 0.33 - 1536000
    else if (shotoku <= 40000000) incomeTax = shotoku * 0.40 - 2796000
    else incomeTax = shotoku * 0.45 - 4796000
    incomeTax = Math.max(0, incomeTax)
    // 復興特別所得税 2.1%
    incomeTax = incomeTax * 1.021

    // 住民税（一律10% + 均等割5000円）
    const juminTax = shotoku * 0.10 + 5000

    const tax = incomeTax + juminTax
    const tedori = y - shakaihoken - tax

    // 1000円単位に丸める
    const round1k = (n: number) => Math.round(n / 1000) * 1000
    return {
      tedori: round1k(tedori),
      shakaihoken: round1k(shakaihoken),
      tax: round1k(tax),
      monthly: round1k(tedori / 12),
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

// ─── バイト確定申告 税額シミュレーター ───
function BaitoTaxCalc() {
  const [mainIncome, setMainIncome] = useState('')
  const [baitoIncome, setBaitoIncome] = useState('')
  const [family, setFamily] = useState('single')
  const [age, setAge] = useState('under40')
  const [inputMode, setInputMode] = useState<'annual' | 'monthly'>('monthly')
  const [mainIncomeType, setMainIncomeType] = useState<'tedori' | 'gakumen'>('tedori')
  const [baitoIncomeType, setBaitoIncomeType] = useState<'tedori' | 'gakumen'>('gakumen')

  const result = (() => {
    const mul = inputMode === 'monthly' ? 12 : 1
    let main = Number(mainIncome) * mul
    let baito = Number(baitoIncome) * mul
    // 手取り→額面の概算逆算（手取り≒額面×0.75〜0.80）
    if (mainIncomeType === 'tedori' && main > 0) main = Math.round(main / 0.78)
    if (baitoIncomeType === 'tedori' && baito > 0) baito = Math.round(baito / 0.90)
    if (!main || main <= 0) return null
    if (!baito || baito <= 0) return null

    const total = main + baito

    // ── 給与所得控除（2026年度） ──
    function kyuyoKojo(income: number): number {
      if (income <= 1625000) return 550000
      if (income <= 1800000) return income * 0.4 - 100000
      if (income <= 3600000) return income * 0.3 + 80000
      if (income <= 6600000) return income * 0.2 + 440000
      if (income <= 8500000) return income * 0.1 + 1100000
      return 1950000
    }

    // ── 所得計算 ──
    const mainKojo = kyuyoKojo(main)
    const totalKojo = kyuyoKojo(total)

    // 基礎控除48万 + 社会保険料控除（常勤のみ概算15%）
    const shakaihokenRate = age === 'over40' ? 0.155 : 0.148
    const shakaihoken = main * shakaihokenRate
    let jinteKojo = 480000 // 基礎控除
    if (family === 'spouse') jinteKojo += 380000 // 配偶者控除
    if (family === 'spouse_child') jinteKojo += 380000 + 630000 // 配偶者+特定扶養

    const mainShotoku = Math.max(0, main - mainKojo - shakaihoken - jinteKojo)
    const totalShotoku = Math.max(0, total - totalKojo - shakaihoken - jinteKojo)

    // ── 所得税（累進課税） ──
    function incomeTax(shotoku: number): number {
      const brackets = [
        { limit: 1950000, rate: 0.05, deduction: 0 },
        { limit: 3300000, rate: 0.10, deduction: 97500 },
        { limit: 6950000, rate: 0.20, deduction: 427500 },
        { limit: 9000000, rate: 0.23, deduction: 636000 },
        { limit: 18000000, rate: 0.33, deduction: 1536000 },
        { limit: 40000000, rate: 0.40, deduction: 2796000 },
        { limit: Infinity, rate: 0.45, deduction: 4796000 },
      ]
      for (const b of brackets) {
        if (shotoku <= b.limit) return shotoku * b.rate - b.deduction
      }
      return 0
    }

    const mainIncomeTax = Math.max(0, incomeTax(mainShotoku))
    const totalIncomeTax = Math.max(0, incomeTax(totalShotoku))

    // 復興特別所得税（2.1%）
    const mainTaxWithFukkou = Math.round(mainIncomeTax * 1.021)
    const totalTaxWithFukkou = Math.round(totalIncomeTax * 1.021)

    // ── 住民税（一律10%）──
    const mainJuminTax = Math.round(mainShotoku * 0.10 + 5000)
    const totalJuminTax = Math.round(totalShotoku * 0.10 + 5000)

    // ── 差額 = 確定申告で追加納付する金額 ──
    const additionalIncomeTax = totalTaxWithFukkou - mainTaxWithFukkou
    const additionalJuminTax = totalJuminTax - mainJuminTax
    const additionalTotal = additionalIncomeTax + additionalJuminTax

    // バイト分の実質手取り率
    const baitoTedori = baito - additionalTotal
    const baitoTedoriRate = Math.round((baitoTedori / baito) * 100)

    // 限界税率（バイト収入にかかる税率）
    const marginalRate = Math.round((additionalTotal / baito) * 100)

    const r1k = (n: number) => Math.round(n / 1000) * 1000
    return {
      total,
      baitoAnnual: baito,
      mainIncomeTax: r1k(mainTaxWithFukkou),
      totalIncomeTax: r1k(totalTaxWithFukkou),
      mainJuminTax: r1k(mainJuminTax),
      totalJuminTax: r1k(totalJuminTax),
      additionalIncomeTax: r1k(additionalIncomeTax),
      additionalJuminTax: r1k(additionalJuminTax),
      additionalTotal: r1k(additionalTotal),
      baitoTedori: r1k(baitoTedori),
      baitoTedoriRate,
      marginalRate,
      shakaihoken: r1k(shakaihoken),
    }
  })()

  return (
    <div className="space-y-4">
      {/* 年収/月収切り替え */}
      <div className="flex items-center gap-1 bg-s1 rounded-lg p-0.5 w-fit">
        {(['monthly', 'annual'] as const).map(mode => (
          <button key={mode} onClick={() => setInputMode(mode)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              inputMode === mode ? 'bg-s0 text-ac shadow-sm' : 'text-muted hover:text-tx'
            }`}>
            {mode === 'monthly' ? '月収で入力' : '年収で入力'}
          </button>
        ))}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-tx">
            常勤先の{inputMode === 'monthly' ? '月収' : '年収'}
          </label>
          <div className="flex items-center gap-0.5 bg-s1 rounded-md p-0.5">
            {(['tedori', 'gakumen'] as const).map(t => (
              <button key={t} onClick={() => setMainIncomeType(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${mainIncomeType === t ? 'bg-s0 text-ac shadow-sm' : 'text-muted'}`}>
                {t === 'tedori' ? '手取り' : '額面'}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <input type="number" value={mainIncome} onChange={e => setMainIncome(e.target.value)}
            placeholder={inputMode === 'monthly' ? '例: 500000' : '例: 6000000'}
            className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">円{inputMode === 'monthly' ? '/月' : '/年'}</span>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-tx">
            バイト{inputMode === 'monthly' ? '月収' : '年収'}合計
          </label>
          <div className="flex items-center gap-0.5 bg-s1 rounded-md p-0.5">
            {(['gakumen', 'tedori'] as const).map(t => (
              <button key={t} onClick={() => setBaitoIncomeType(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${baitoIncomeType === t ? 'bg-s0 text-ac shadow-sm' : 'text-muted'}`}>
                {t === 'tedori' ? '手取り' : '額面'}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <input type="number" value={baitoIncome} onChange={e => setBaitoIncome(e.target.value)}
            placeholder={inputMode === 'monthly' ? '例: 150000' : '例: 2000000'}
            className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">円{inputMode === 'monthly' ? '/月' : '/年'}</span>
        </div>
        <p className="text-[10px] text-muted mt-1">※ 当直バイト・外勤・スポットバイト等の{inputMode === 'monthly' ? '月平均' : '合計'}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-tx block mb-1.5">家族構成</label>
          <select value={family} onChange={e => setFamily(e.target.value)}
            className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors">
            <option value="single">独身 / 共働き</option>
            <option value="spouse">配偶者あり</option>
            <option value="spouse_child">配偶者+子あり</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-tx block mb-1.5">年齢区分</label>
          <select value={age} onChange={e => setAge(e.target.value)}
            className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40 transition-colors">
            <option value="under40">39歳以下</option>
            <option value="over40">40歳以上</option>
          </select>
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          {/* メイン結果: 追加納税額 */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-xs text-red-600 mb-1">確定申告で追加で払う税金（年額概算）</p>
            <p className="text-3xl font-bold text-red-600">¥{result.additionalTotal.toLocaleString()}</p>
            <p className="text-xs text-red-400 mt-0.5">月あたり約 ¥{Math.round(result.additionalTotal / 12).toLocaleString()}</p>
            <p className="text-[11px] text-red-500 mt-1">
              所得税 ¥{result.additionalIncomeTax.toLocaleString()} + 住民税 ¥{result.additionalJuminTax.toLocaleString()}
            </p>
          </div>

          {/* バイトの実質手取り */}
          <div className="bg-acl border border-ac/15 rounded-xl p-4 text-center">
            <p className="text-xs text-muted mb-1">バイト収入の実質手取り（年額）</p>
            <p className="text-2xl font-bold text-ac">¥{result.baitoTedori.toLocaleString()}</p>
            <p className="text-xs text-ac/60 mt-0.5">月あたり約 ¥{Math.round(result.baitoTedori / 12).toLocaleString()}</p>
            <p className="text-[11px] text-muted mt-1">
              バイト年収¥{result.baitoAnnual.toLocaleString()} → 手取り率 <span className="font-bold text-ac">{result.baitoTedoriRate}%</span>
            </p>
          </div>

          {/* 内訳 */}
          <div className="bg-s0 border border-br rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-tx mb-2">内訳</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-s1 rounded-lg p-2.5">
                <p className="text-[10px] text-muted">合算年収</p>
                <p className="font-bold text-tx">¥{result.total.toLocaleString()}</p>
              </div>
              <div className="bg-s1 rounded-lg p-2.5">
                <p className="text-[10px] text-muted">社会保険料</p>
                <p className="font-bold text-tx">¥{result.shakaihoken.toLocaleString()}</p>
              </div>
              <div className="bg-s1 rounded-lg p-2.5">
                <p className="text-[10px] text-muted">常勤のみの税額</p>
                <p className="font-bold text-tx">¥{(result.mainIncomeTax + result.mainJuminTax).toLocaleString()}</p>
              </div>
              <div className="bg-s1 rounded-lg p-2.5">
                <p className="text-[10px] text-muted">合算後の税額</p>
                <p className="font-bold text-tx">¥{(result.totalIncomeTax + result.totalJuminTax).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2 p-2 bg-amber-50 rounded-lg">
              <p className="text-[10px] text-amber-700">
                💡 バイト収入に対する限界税率: <span className="font-bold">{result.marginalRate}%</span>
                {result.marginalRate >= 30 && '（高税率帯。ふるさと納税や経費計上で節税を検討）'}
                {result.marginalRate < 30 && result.marginalRate >= 20 && '（中程度。iDeCo等も活用しましょう）'}
                {result.marginalRate < 20 && '（低税率帯。効率よく稼げています）'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
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
type ToolKey = 'furusato' | 'tedori' | 'nisa' | 'creditcard' | 'baito'

const tools: { key: ToolKey; label: string; icon: string }[] = [
  { key: 'furusato', label: 'ふるさと納税', icon: '🏠' },
  { key: 'tedori', label: '手取り概算', icon: '💴' },
  { key: 'nisa', label: 'NISA運用', icon: '📈' },
  { key: 'creditcard', label: 'クレカ', icon: '💳' },
  { key: 'baito', label: 'バイト税金', icon: '🏥' },
]

// ── ランキングデータ ──
const NISA_PICKS = [
  { rank: 1, name: 'eMAXIS Slim 全世界株式（オール・カントリー）', reason: '低コスト・全世界分散。迷ったらこれ', fee: '0.05775%' },
  { rank: 2, name: 'eMAXIS Slim 米国株式（S&P500）', reason: '米国500社に分散。成長重視派に', fee: '0.09372%' },
  { rank: 3, name: 'eMAXIS Slim 先進国株式インデックス', reason: '日本を除く先進国。安定志向', fee: '0.09889%' },
  { rank: 4, name: '楽天・全世界株式インデックス・ファンド', reason: 'VT連動。楽天証券ユーザーに', fee: '0.192%' },
  { rank: 5, name: 'SBI・V・S&P500インデックス・ファンド', reason: 'SBI証券ユーザーに。VOO連動', fee: '0.0938%' },
]

const CREDIT_CARDS = [
  { rank: 1, name: 'アメックス・ゴールド', reason: '空港ラウンジ+高還元。学会出張に', fee: '31,900円/年' },
  { rank: 2, name: '三井住友カード ゴールド(NL)', reason: 'SBI証券積立1%還元。NISA連携に最適', fee: '5,500円/年(条件付無料)' },
  { rank: 3, name: '楽天プレミアムカード', reason: 'プライオリティパス付。楽天経済圏', fee: '11,000円/年' },
  { rank: 4, name: 'JCBゴールド', reason: '国内使いに強い。保険充実', fee: '11,000円/年(初年度無料)' },
  { rank: 5, name: 'エポスゴールドカード', reason: '年間50万利用で年会費永年無料', fee: '5,000円/年(条件付無料)' },
]

const BAITO_SITES = [
  { rank: 1, name: '民間医局', reason: '老舗。求人数・サポート充実', url: 'https://www.doctor-agent.com/' },
  { rank: 2, name: 'Dr.アルなび', reason: 'スポットバイトに強い。当日マッチング', url: 'https://www.dr-alnavi.com/' },
  { rank: 3, name: 'メディカルトリビューン', reason: '高単価案件多め。専門医向け', url: 'https://www.medical-tribune.co.jp/' },
  { rank: 4, name: 'm3.com CAREER', reason: '常勤・非常勤両対応。情報量多い', url: 'https://career.m3.com/' },
  { rank: 5, name: 'マイナビDOCTOR', reason: '大手の安心感。初めてのバイトに', url: 'https://doctor.mynavi.jp/' },
]

export default function MoneyPage() {
  const [activeTool, setActiveTool] = useState<ToolKey>('furusato')

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <AppHeader
        title="マネー"
        subtitle="ふるさと納税・手取り概算・NISA・クレカ・バイト会社"
        badge="NEW"
        favoriteSlug="app-money"
        favoriteHref="/money"
      />

      {/* Tool Tabs */}
      <div className="grid grid-cols-5 gap-1.5 mb-6">
        {tools.map(tool => (
          <button
            key={tool.key}
            onClick={() => setActiveTool(tool.key)}
            className={`flex flex-col items-center gap-1 rounded-xl p-2.5 border transition-all ${
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
      {(activeTool === 'furusato' || activeTool === 'tedori' || activeTool === 'nisa' || activeTool === 'baito') && (
        <div className="bg-s0 border border-br rounded-2xl p-5 md:p-6 mb-6">
          <h2 className="text-base font-bold text-tx mb-4">
            {tools.find(t => t.key === activeTool)?.icon}{' '}
            {activeTool === 'baito' ? 'バイト税金シミュレーター' : tools.find(t => t.key === activeTool)?.label}
            <span className="text-xs font-normal text-muted ml-2">概算ツール</span>
          </h2>
          {activeTool === 'furusato' && <FurusatoCalc />}
          {activeTool === 'tedori' && <TedoriCalc />}
          {activeTool === 'nisa' && <NisaCalc />}
          {activeTool === 'baito' && <BaitoTaxCalc />}
        </div>
      )}

      {/* Disclaimer（計算ツールタブのみ） */}
      {(activeTool === 'furusato' || activeTool === 'tedori' || activeTool === 'nisa' || activeTool === 'baito') && (
        <div className="bg-wnl border border-wnb rounded-xl p-3 mb-6 text-[11px] text-wn leading-relaxed">
          ⚠️ 計算結果はあくまで概算・目安です。正確な金額は税理士・所轄税務署にご確認ください。
        </div>
      )}

      {/* ── タブ別ランキング ── */}
      {activeTool === 'furusato' && <FurusatoRanking />}

      {activeTool === 'nisa' && (
        <RankingSection title="医師におすすめのNISA銘柄" icon="📈" items={NISA_PICKS.map(p => ({
          rank: p.rank, name: p.name, sub: p.reason, badge: `信託報酬 ${p.fee}`,
        }))} />
      )}

      {activeTool === 'creditcard' && (
        <RankingSection title="医師に人気のクレジットカード" icon="💳" items={CREDIT_CARDS.map(c => ({
          rank: c.rank, name: c.name, sub: c.reason, badge: c.fee,
        }))} />
      )}

      {activeTool === 'baito' && (
        <RankingSection title="医師バイトサイト比較" icon="🏥" items={BAITO_SITES.map(b => ({
          rank: b.rank, name: b.name, sub: b.reason, badge: '', url: b.url,
        }))} />
      )}


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

// ── 汎用ランキングセクション ──
function RankingSection({ title, icon, items }: {
  title: string; icon: string
  items: { rank: number; name: string; sub: string; badge: string; url?: string }[]
}) {
  const MEDAL = ['', '🥇', '🥈', '🥉']
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-0.5 bg-ac rounded-full" />
        <h2 className="text-lg font-bold text-tx">{icon} {title}</h2>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.rank} className="bg-s0 border border-br rounded-xl p-4 flex items-start gap-3">
            <span className="text-lg font-bold flex-shrink-0 w-7 text-center">
              {MEDAL[item.rank] || item.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-tx">{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-ac">{item.name}</a> : item.name}</p>
              <p className="text-[11px] text-muted mt-0.5">{item.sub}</p>
            </div>
            {item.badge && (
              <span className="text-[10px] font-medium px-2 py-0.5 bg-s1 rounded text-muted flex-shrink-0">{item.badge}</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[9px] text-muted mt-2">※ ランキングは一般的な情報に基づく参考です。投資・契約の判断は自己責任で行ってください。</p>
    </section>
  )
}
