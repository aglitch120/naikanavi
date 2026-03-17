'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import ProGate from '@/components/pro/ProGate'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'
import { trackToolUsage } from '@/components/pro/useProStatus'

interface BloodGasInput {
  ph: string; pco2: string; hco3: string
  na: string; cl: string; alb: string
  lactate: string; pao2: string; fio2: string; age: string
}

interface StepResult {
  step: number; title: string; finding: string
  severity: 'ok' | 'wn' | 'dn' | 'neutral'; detail: string; formula?: string
}

const defaults: BloodGasInput = {
  ph: '7.30', pco2: '30', hco3: '14',
  na: '140', cl: '105', alb: '4.0',
  lactate: '', pao2: '80', fio2: '0.21', age: '50',
}

function interpret(d: BloodGasInput): StepResult[] {
  const ph = parseFloat(d.ph); const pco2 = parseFloat(d.pco2); const hco3 = parseFloat(d.hco3)
  const na = parseFloat(d.na); const cl = parseFloat(d.cl); const alb = parseFloat(d.alb)
  const lactate = parseFloat(d.lactate); const pao2 = parseFloat(d.pao2)
  const fio2 = parseFloat(d.fio2); const age = parseFloat(d.age)
  if (!ph || !pco2 || !hco3) return []

  const steps: StepResult[] = []

  // Step 1: pH → アシデミア or アルカレミア
  let primaryDisorder = ''
  if (ph < 7.35) {
    primaryDisorder = 'acidemia'
    steps.push({ step: 1, title: 'pH 評価', finding: `pH ${ph.toFixed(2)} → アシデミア`, severity: 'dn',
      detail: 'pH < 7.35: 血液が酸性に傾いている状態。代謝性 or 呼吸性の原因を鑑別する。' })
  } else if (ph > 7.45) {
    primaryDisorder = 'alkalemia'
    steps.push({ step: 1, title: 'pH 評価', finding: `pH ${ph.toFixed(2)} → アルカレミア`, severity: 'wn',
      detail: 'pH > 7.45: 血液がアルカリ性に傾いている状態。代謝性 or 呼吸性の原因を鑑別する。' })
  } else {
    primaryDisorder = 'normal'
    steps.push({ step: 1, title: 'pH 評価', finding: `pH ${ph.toFixed(2)} → 正常範囲`, severity: 'ok',
      detail: 'pH 7.35〜7.45: 正常範囲だが、混合性障害の可能性は否定できない。HCO3とPCO2を確認。' })
  }

  // Step 2: 一次性障害の同定
  let primaryType = ''
  if (primaryDisorder === 'acidemia') {
    if (hco3 < 22) {
      primaryType = 'metabolic_acidosis'
      steps.push({ step: 2, title: '一次性障害', finding: `HCO₃⁻ ${hco3} → 代謝性アシドーシス`, severity: 'dn',
        detail: 'HCO₃⁻低下が主因。AG計算で原因を鑑別する。' })
    } else if (pco2 > 45) {
      primaryType = 'respiratory_acidosis'
      steps.push({ step: 2, title: '一次性障害', finding: `PaCO₂ ${pco2} → 呼吸性アシドーシス`, severity: 'dn',
        detail: 'CO₂貯留が主因。換気不全（COPD増悪・薬物・神経筋疾患等）を鑑別。' })
    } else {
      primaryType = 'metabolic_acidosis'
      steps.push({ step: 2, title: '一次性障害', finding: '代謝性アシドーシス（HCO₃⁻/PCO₂ともに低下）', severity: 'dn',
        detail: '代謝性アシドーシスに対する呼吸性代償が進行中。' })
    }
  } else if (primaryDisorder === 'alkalemia') {
    if (hco3 > 26) {
      primaryType = 'metabolic_alkalosis'
      steps.push({ step: 2, title: '一次性障害', finding: `HCO₃⁻ ${hco3} → 代謝性アルカローシス`, severity: 'wn',
        detail: 'HCO₃⁻上昇が主因。嘔吐・利尿薬・低K等を鑑別。尿中Cl < 20: Cl反応性。' })
    } else if (pco2 < 35) {
      primaryType = 'respiratory_alkalosis'
      steps.push({ step: 2, title: '一次性障害', finding: `PaCO₂ ${pco2} → 呼吸性アルカローシス`, severity: 'wn',
        detail: '過換気が主因。不安・疼痛・PE・敗血症・肝不全・CNS疾患等を鑑別。' })
    } else {
      primaryType = 'metabolic_alkalosis'
      steps.push({ step: 2, title: '一次性障害', finding: '代謝性アルカローシス', severity: 'wn', detail: '' })
    }
  } else {
    if (hco3 < 22 && pco2 < 35) {
      primaryType = 'mixed_normal'
      steps.push({ step: 2, title: '一次性障害', finding: 'pH正常だが HCO₃⁻↓ + PCO₂↓ — 混合性障害の可能性', severity: 'wn',
        detail: '代謝性アシドーシス＋呼吸性アルカローシスが相殺している可能性。AG計算が重要。' })
    } else if (hco3 > 26 && pco2 > 45) {
      primaryType = 'mixed_normal'
      steps.push({ step: 2, title: '一次性障害', finding: 'pH正常だが HCO₃⁻↑ + PCO₂↑ — 混合性障害の可能性', severity: 'wn',
        detail: '代謝性アルカローシス＋呼吸性アシドーシスが相殺している可能性。' })
    } else {
      steps.push({ step: 2, title: '一次性障害', finding: 'HCO₃⁻・PCO₂ともに正常範囲', severity: 'ok', detail: '明らかな酸塩基障害なし。' })
    }
  }

  // Step 3: AG（代謝性アシドーシスの場合）
  if (primaryType === 'metabolic_acidosis' || primaryType === 'mixed_normal') {
    if (na && cl) {
      const ag = na - cl - hco3
      const correctedAg = alb ? ag + 2.5 * (4.0 - alb) : null
      const effectiveAg = correctedAg ?? ag

      if (effectiveAg > 12) {
        steps.push({ step: 3, title: 'アニオンギャップ', finding: `AG ${ag.toFixed(1)}${correctedAg ? ` (補正AG ${correctedAg.toFixed(1)})` : ''} → AG開大型`, severity: 'dn',
          detail: 'AG > 12: 乳酸アシドーシス・DKA・腎不全・中毒（メタノール/エチレングリコール/サリチル酸）を鑑別。MUDPILES。',
          formula: `AG = Na(${na}) − Cl(${cl}) − HCO₃(${hco3}) = ${ag.toFixed(1)}` })

        // Step 3b: ΔAG/ΔHCO3
        const deltaAg = effectiveAg - 12
        const deltaHco3 = 24 - hco3
        if (deltaHco3 > 0) {
          const ratio = deltaAg / deltaHco3
          let ratioInterpretation = ''
          let ratioSeverity: StepResult['severity'] = 'ok'
          if (ratio < 1) { ratioInterpretation = 'ΔAG/ΔHCO₃ < 1 → 非AG開大型アシドーシスの合併'; ratioSeverity = 'wn' }
          else if (ratio > 2) { ratioInterpretation = 'ΔAG/ΔHCO₃ > 2 → 代謝性アルカローシスの合併'; ratioSeverity = 'wn' }
          else { ratioInterpretation = 'ΔAG/ΔHCO₃ 1〜2 → 単純なAG開大型'; ratioSeverity = 'ok' }

          steps.push({ step: 3.5, title: 'ΔAG / ΔHCO₃⁻ 比', finding: `${ratio.toFixed(2)} — ${ratioInterpretation}`, severity: ratioSeverity,
            detail: 'AG開大型アシドーシスに他の酸塩基障害が合併しているかを判定。',
            formula: `ΔAG(${deltaAg.toFixed(1)}) / ΔHCO₃(${deltaHco3.toFixed(1)}) = ${ratio.toFixed(2)}` })
        }

        // Lactate
        if (lactate) {
          if (lactate >= 2) {
            steps.push({ step: 3.7, title: '乳酸値', finding: `Lactate ${lactate} mmol/L → 乳酸アシドーシス`, severity: 'dn',
              detail: 'Lactate ≧ 2 mmol/L: Type A（低灌流: ショック/心停止） or Type B（肝不全/薬物/悪性腫瘍）を鑑別。' })
          } else {
            steps.push({ step: 3.7, title: '乳酸値', finding: `Lactate ${lactate} mmol/L → 正常`, severity: 'ok',
              detail: '乳酸アシドーシスは否定的。DKA・腎不全・中毒を検索。' })
          }
        }
      } else {
        steps.push({ step: 3, title: 'アニオンギャップ', finding: `AG ${ag.toFixed(1)}${correctedAg ? ` (補正AG ${correctedAg.toFixed(1)})` : ''} → 非AG開大型（正常AG型）`, severity: 'wn',
          detail: 'AG正常: 下痢・RTA（尿細管性アシドーシス）・生理食塩水大量投与・尿管吻合等。尿中AGで腎性 vs 腎外性を鑑別。',
          formula: `AG = Na(${na}) − Cl(${cl}) − HCO₃(${hco3}) = ${ag.toFixed(1)}` })
      }
    }
  }

  // Step 4: 代償の適切性
  if (primaryType === 'metabolic_acidosis') {
    const expectedPco2Low = 1.5 * hco3 + 8 - 2
    const expectedPco2High = 1.5 * hco3 + 8 + 2
    const expectedPco2Mid = 1.5 * hco3 + 8

    let compFinding = ''; let compSeverity: StepResult['severity'] = 'ok'
    if (pco2 < expectedPco2Low) {
      compFinding = `実測PCO₂(${pco2}) < 予測下限(${expectedPco2Low.toFixed(0)}) → 呼吸性アルカローシスの合併`
      compSeverity = 'wn'
    } else if (pco2 > expectedPco2High) {
      compFinding = `実測PCO₂(${pco2}) > 予測上限(${expectedPco2High.toFixed(0)}) → 呼吸性アシドーシスの合併`
      compSeverity = 'dn'
    } else {
      compFinding = `実測PCO₂(${pco2}) は予測範囲内(${expectedPco2Low.toFixed(0)}〜${expectedPco2High.toFixed(0)}) → 適切な呼吸性代償`
      compSeverity = 'ok'
    }

    steps.push({ step: 4, title: '代償の適切性（Winters式）', finding: compFinding, severity: compSeverity,
      detail: '代謝性アシドーシスに対する呼吸性代償が適切か判定。逸脱があれば混合性障害。',
      formula: `予測PCO₂ = 1.5 × HCO₃(${hco3}) + 8 ± 2 = ${expectedPco2Mid.toFixed(0)} ± 2` })
  } else if (primaryType === 'metabolic_alkalosis') {
    const expectedPco2 = 0.7 * hco3 + 21
    const diff = Math.abs(pco2 - expectedPco2)
    let compSeverity: StepResult['severity'] = diff > 5 ? 'wn' : 'ok'
    steps.push({ step: 4, title: '代償の適切性', finding: `予測PCO₂ ≈ ${expectedPco2.toFixed(0)} mmHg（実測 ${pco2}）${diff > 5 ? '→ 逸脱あり' : '→ 適切'}`, severity: compSeverity,
      detail: '代謝性アルカローシス: 予測PCO₂ = 0.7 × HCO₃ + 21（± 5）',
      formula: `予測PCO₂ = 0.7 × ${hco3} + 21 = ${expectedPco2.toFixed(0)}` })
  } else if (primaryType === 'respiratory_acidosis') {
    // 急性: ΔHCO3 = ΔPCO2/10, 慢性: ΔHCO3 = 3.5×ΔPCO2/10
    const deltaPco2 = pco2 - 40
    const acuteHco3 = 24 + deltaPco2 / 10
    const chronicHco3 = 24 + 3.5 * deltaPco2 / 10
    steps.push({ step: 4, title: '急性 vs 慢性', finding: `急性なら予測HCO₃ ≈ ${acuteHco3.toFixed(0)}、慢性なら ≈ ${chronicHco3.toFixed(0)}（実測 ${hco3}）`, severity: 'neutral',
      detail: '急性: HCO₃は1 mEq/L上昇 / PCO₂ 10mmHg上昇ごと。慢性: 3.5 mEq/L上昇 / 10mmHg。実測HCO₃から急性/慢性を推定。' })
  } else if (primaryType === 'respiratory_alkalosis') {
    const deltaPco2 = 40 - pco2
    const acuteHco3 = 24 - 2 * deltaPco2 / 10
    const chronicHco3 = 24 - 5 * deltaPco2 / 10
    steps.push({ step: 4, title: '急性 vs 慢性', finding: `急性なら予測HCO₃ ≈ ${acuteHco3.toFixed(0)}、慢性なら ≈ ${chronicHco3.toFixed(0)}（実測 ${hco3}）`, severity: 'neutral',
      detail: '急性: HCO₃は2 mEq/L低下 / PCO₂ 10mmHg低下ごと。慢性: 5 mEq/L低下 / 10mmHg。' })
  }

  // Step 5: A-aDO2（PaO2とFiO2が入力されている場合）
  if (pao2 && fio2 && age) {
    const pAtm = 760; const pH2O = 47
    const pao2Calc = fio2 * (pAtm - pH2O) - pco2 / 0.8
    const aaDo2 = pao2Calc - pao2
    const normalMax = age / 4 + 4

    let o2Finding = ''; let o2Severity: StepResult['severity'] = 'ok'
    if (aaDo2 > normalMax) {
      o2Finding = `A-aDO₂ = ${aaDo2.toFixed(1)} mmHg（正常上限 ${normalMax.toFixed(0)}）→ 開大。肺実質病変あり`
      o2Severity = 'dn'
    } else {
      o2Finding = `A-aDO₂ = ${aaDo2.toFixed(1)} mmHg（正常上限 ${normalMax.toFixed(0)}）→ 正常。肺外性の低酸素`
      o2Severity = 'ok'
    }

    steps.push({ step: 5, title: 'A-aDO₂（酸素化評価）', finding: o2Finding, severity: o2Severity,
      detail: 'A-aDO₂開大: 肺炎・ARDS・PE・シャント等。正常: 低換気（薬物・神経筋）・高地。',
      formula: `PAO₂ = ${fio2}×(760-47) − PCO₂/${0.8} = ${pao2Calc.toFixed(1)}` })

    // P/F ratio
    const pf = pao2 / fio2
    if (pf < 100) {
      steps.push({ step: 5.5, title: 'P/F比', finding: `P/F = ${pf.toFixed(0)} → 重症ARDS（< 100）`, severity: 'dn', detail: 'Berlin定義: P/F < 100 = 重症、100-200 = 中等症、200-300 = 軽症ARDS' })
    } else if (pf < 200) {
      steps.push({ step: 5.5, title: 'P/F比', finding: `P/F = ${pf.toFixed(0)} → 中等症ARDS（100-200）`, severity: 'dn', detail: '' })
    } else if (pf < 300) {
      steps.push({ step: 5.5, title: 'P/F比', finding: `P/F = ${pf.toFixed(0)} → 軽症ARDS（200-300）`, severity: 'wn', detail: '' })
    } else {
      steps.push({ step: 5.5, title: 'P/F比', finding: `P/F = ${pf.toFixed(0)} → 正常（≧ 300）`, severity: 'ok', detail: '' })
    }
  }

  return steps
}

// ── UI Components ──
const severityStyles = {
  ok: 'bg-[#E6F4EA] border-l-4 border-[#34A853]',
  wn: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]',
  dn: 'bg-[#FDECEA] border-l-4 border-[#D93025]',
  neutral: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]',
}
const severityTextColor = {
  ok: 'text-[#1B5E20]', wn: 'text-[#E65100]', dn: 'text-[#B71C1C]', neutral: 'text-[#1565C0]',
}

function Field({ id, label, unit, value, onChange, step = 0.01, hint }: {
  id: string; label: string; unit?: string; value: string; onChange: (v: string) => void; step?: number; hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-tx mb-0.5">
        {label}{unit && <span className="text-muted ml-1">({unit})</span>}
      </label>
      {hint && <p className="text-[10px] text-muted mb-0.5">{hint}</p>}
      <input type="number" id={id} inputMode="decimal" value={value} onChange={e => onChange(e.target.value)}
        step={step} className="w-full px-2 py-1.5 text-sm bg-bg border border-br rounded-lg text-tx focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac" />
    </div>
  )
}

export default function BloodGasPage() {
  // PLG: ツール利用トラッキング
  useEffect(() => { trackToolUsage('interpret-blood-gas') }, [])

  const [input, setInput] = useState<BloodGasInput>(defaults)
  const set = (key: keyof BloodGasInput) => (val: string) => setInput(prev => ({ ...prev, [key]: val }))

  const steps = useMemo(() => interpret(input), [input])
  const hasPrimary = steps.length > 0

  return (
    <div className="max-w-3xl mx-auto">
      {/* パンくず */}
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-2">›</span>
        <span>血液ガス分析 インタラクティブ解釈</span>
      </nav>

      {/* ヘッダー */}
      <header className="mb-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">🔬 検査読影</span>
        <h1 className="text-2xl font-bold text-tx mb-1">血液ガス分析 インタラクティブ解釈</h1>
        <p className="text-sm text-muted">
          pH・PCO₂・HCO₃⁻を入力 → 酸塩基障害をステップバイステップで自動解釈。AG・代償・A-aDO₂・P/F比まで一括評価。
        </p>
      </div><ProPulseHint><FavoriteButton slug="interpret-blood-gas" /></ProPulseHint></div></header>

      {/* 入力 */}
      <section className="bg-s0 border border-br rounded-xl p-5 mb-6">
        <h2 className="text-sm font-bold text-tx mb-3">血液ガスデータ入力</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Field id="ph" label="pH" value={input.ph} onChange={set('ph')} step={0.01} />
          <Field id="pco2" label="PaCO₂" unit="mmHg" value={input.pco2} onChange={set('pco2')} step={1} />
          <Field id="hco3" label="HCO₃⁻" unit="mEq/L" value={input.hco3} onChange={set('hco3')} step={0.1} />
        </div>

        <h2 className="text-sm font-bold text-tx mb-3 mt-4">AG計算用（任意）</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Field id="na" label="Na⁺" unit="mEq/L" value={input.na} onChange={set('na')} step={1} />
          <Field id="cl" label="Cl⁻" unit="mEq/L" value={input.cl} onChange={set('cl')} step={1} />
          <Field id="alb" label="Alb" unit="g/dL" hint="補正AG計算用" value={input.alb} onChange={set('alb')} step={0.1} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field id="lactate" label="乳酸" unit="mmol/L" hint="任意" value={input.lactate} onChange={set('lactate')} step={0.1} />
          <Field id="age" label="年齢" unit="歳" hint="A-aDO₂正常上限計算用" value={input.age} onChange={set('age')} step={1} />
        </div>

        <h2 className="text-sm font-bold text-tx mb-3 mt-4">酸素化評価用（任意）</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field id="pao2" label="PaO₂" unit="mmHg" value={input.pao2} onChange={set('pao2')} step={1} />
          <Field id="fio2" label="FiO₂" hint="室内気=0.21" value={input.fio2} onChange={set('fio2')} step={0.01} />
        </div>
      </section>

      {/* 結果（2タブ: 検査結果 / アクション） */}
      {hasPrimary && (
        <ProGate feature="interpretation" previewHeight={100}>
          <ResultTabs steps={steps} />
        </ProGate>
      )}

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn">
        <p className="font-semibold mb-1">⚠️ 医療上の免責事項</p>
        <p>本ツールは医療従事者の臨床判断を補助する目的で提供しています。診断・治療の最終判断は必ず担当医が行ってください。</p>
      </div>

      {/* 関連ツール */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">関連ツール</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { slug: 'anion-gap', name: 'アニオンギャップ' }, { slug: 'winters-formula', name: 'Winters式' },
            { slug: 'aa-gradient', name: 'A-aDO₂' }, { slug: 'osmolality-gap', name: '浸透圧ギャップ' },
            { slug: 'fio2-table', name: 'FiO2換算表' }, { slug: 'corrected-ca', name: '補正Ca' },
          ].map(t => (
            <Link key={t.slug} href={`/tools/calc/${t.slug}`}
              className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">
              {t.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 参考文献 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">参考文献</h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2">
          <li>Narins RG, Emmett M. Medicine 1980;59:161-187</li>
          <li>Albert MS, Dell RB, Winters RW. Ann Intern Med 1967;66:312-322</li>
          <li>Figge J et al. Crit Care Med 1998;26:1807-1810</li>
          <li>ARDS Definition Task Force. JAMA 2012;307:2526-2533 (Berlin定義)</li>
        </ol>
      </section>
    </div>
  )
}

function ResultTabs({ steps }: { steps: StepResult[] }) {
  const [activeTab, setActiveTab] = useState<'result' | 'action'>('result')
  return (
    <section className="mb-8">
      <div className="flex border border-br rounded-xl overflow-hidden mb-4">
        <button
          onClick={() => setActiveTab('result')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'result' ? 'bg-ac text-white' : 'bg-s1 text-muted hover:text-tx'
          }`}
        >
          検査結果
        </button>
        <button
          onClick={() => setActiveTab('action')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'action' ? 'bg-ac text-white' : 'bg-s1 text-muted hover:text-tx'
          }`}
        >
          アクション
        </button>
      </div>

      {activeTab === 'result' && (
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className={`rounded-xl p-4 ${severityStyles[s.severity]}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${severityTextColor[s.severity]} bg-white/60`}>
                  Step {Math.floor(s.step)}
                </span>
                <span className={`text-sm font-bold ${severityTextColor[s.severity]}`}>{s.title}</span>
              </div>
              <p className={`text-sm font-medium mb-1 ${severityTextColor[s.severity]}`}>{s.finding}</p>
              {s.formula && (
                <p className="text-xs font-mono bg-white/70 text-tx px-2 py-1 rounded mt-1 mb-1">{s.formula}</p>
              )}
              {s.detail && <p className="text-xs text-tx/80">{s.detail}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'action' && (
        <div className="space-y-4 text-sm text-muted">
          <h3 className="font-bold text-tx">血液ガス分析の系統的アプローチ</h3>
          <p>血液ガス（ABG）の解釈は5ステップで系統的に行います。本ツールはこの手順を自動化し、混合性障害の見落としを防ぎます。</p>
          <h3 className="font-bold text-tx">5ステップ</h3>
          <p>Step 1: pHでアシデミア/アルカレミアを判定 → Step 2: HCO₃⁻とPCO₂で一次性障害を同定 → Step 3: AGを計算 → Step 4: 代償の適切性を確認 → Step 5: A-aDO₂で酸素化を評価</p>
          <h3 className="font-bold text-tx">AG開大の鑑別（MUDPILES）</h3>
          <p>Methanol, Uremia, DKA, Propylene glycol, Isoniazid/Iron, Lactic acidosis, Ethylene glycol, Salicylates</p>
          <h3 className="font-bold text-tx">非AG開大型の鑑別</h3>
          <p>下痢、RTA（I型・II型・IV型）、生食大量投与、尿管S状結腸吻合、アセタゾラミド</p>
        </div>
      )}
    </section>
  )
}
