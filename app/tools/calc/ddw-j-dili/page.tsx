'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ddw-j-dili')!

// 病型分類不要の共通項目（①③④⑤⑥⑦⑧）
const commonItems = [
  { name: '① 発症までの期間', options: [
    { l: '初回投与: 5-90日 / 再投与: 1-15日 (+2)', s: 2 },
    { l: '初回投与: <5日 or >90日 / 再投与: >15日 (+1)', s: 1 },
    { l: '判定不能 (0)', s: 0 },
  ]},
  { name: '③ 危険因子（飲酒・妊娠等）', options: [
    { l: 'あり (+1)', s: 1 },
    { l: 'なし (0)', s: 0 },
  ]},
  { name: '④ 薬物以外の原因の検索', options: [
    { l: '6因子すべて除外 (+2)', s: 2 },
    { l: '6因子中4-5因子除外 (+1)', s: 1 },
    { l: '6因子中3因子以下除外 (0)', s: 0 },
    { l: '薬物以外の原因が疑われる (-3)', s: -3 },
  ]},
  { name: '⑤ ��去の肝障害の報告', options: [
    { l: 'あり (+1)', s: 1 },
    { l: 'なし or 不明 (0)', s: 0 },
  ]},
  { name: '⑥ 好酸球増多（6%以上）', options: [
    { l: 'あり (+1)', s: 1 },
    { l: 'なし (0)', s: 0 },
  ]},
  { name: '⑦ DLST', options: [
    { l: '陽性 (+2)', s: 2 },
    { l: '擬陽性 (+1)', s: 1 },
    { l: '陰性 or 未施行 (0)', s: 0 },
  ]},
  { name: '⑧ 偶然の再投与で肝障害再発', options: [
    { l: 'あり (+3)', s: 3 },
    { l: 'なし or 不明 (0)', s: 0 },
  ]},
]

// 病型別の②薬物中止後の経過
const item2ByType: Record<string, { l: string; s: number }[]> = {
  hepatocellular: [
    { l: '8日以内にALT50%以上低下 (+3)', s: 3 },
    { l: '30日以内にALT50%以上低下 (+2)', s: 2 },
    { l: '判定不能 or 30日以降に低下 (+1)', s: 1 },
    { l: '低下しない or 上昇 (-2)', s: -2 },
  ],
  cholestatic: [
    { l: '180日以内にALP50%以上低下 (+3)', s: 3 },
    { l: '180日以内にALP50%未満の低下 (+2)', s: 2 },
    { l: '判定不能 or 変化なし (+1)', s: 1 },
    { l: '上昇 or 低下なし（180日超）(-2)', s: -2 },
  ],
  mixed: [
    { l: '180日以内にALP50%以上低下 (+3)', s: 3 },
    { l: '180日以内にALP50%未満の低下 (+2)', s: 2 },
    { l: '判定不能 or 変化なし (+1)', s: 1 },
    { l: '上昇 or 低下なし（180日超）(-2)', s: -2 },
  ],
}

export default function DdwjDiliPage() {
  const [altVal, setAltVal] = useState('')
  const [altUln, setAltUln] = useState('40')
  const [alpVal, setAlpVal] = useState('')
  const [alpUln, setAlpUln] = useState('340')
  const [commonScores, setCommonScores] = useState(commonItems.map(() => 0))
  const [item2Score, setItem2Score] = useState(0)

  // 病型分類: R = (ALT/ALT-ULN) / (ALP/ALP-ULN)
  const classification = useMemo(() => {
    const alt = parseFloat(altVal), altU = parseFloat(altUln), alp = parseFloat(alpVal), alpU = parseFloat(alpUln)
    if (!alt || !altU || !alp || !alpU) return null
    const r = (alt / altU) / (alp / alpU)
    if (r >= 5) return { type: 'hepatocellular' as const, label: '肝細胞障害型（R≧5）', r: r.toFixed(1) }
    if (r <= 2) return { type: 'cholestatic' as const, label: '胆汁うっ滞型（R≦2）', r: r.toFixed(1) }
    return { type: 'mixed' as const, label: '混合型（2<R<5）', r: r.toFixed(1) }
  }, [altVal, altUln, alpVal, alpUln])

  const result = useMemo(() => {
    if (!classification) return null
    const total = commonScores.reduce((a, b) => a + b, 0) + item2Score
    let severity: 'ok' | 'wn' | 'dn' = 'ok', interpretation = ''
    if (total >= 5) { interpretation = `${total}点 — 可能性が高い (highly probable)`; severity = 'dn' }
    else if (total >= 3) { interpretation = `${total}点 — 可能性あり (probable)`; severity = 'wn' }
    else { interpretation = `${total}点 — 可能性が低い (unlikely)` }
    return { total, severity, interpretation }
  }, [commonScores, item2Score, classification])

  const RadioItem = ({ name, options, value, onChange }: { name: string; options: { l: string; s: number }[]; value: number; onChange: (s: number) => void }) => (
    <div>
      <p className="text-sm font-bold text-tx mb-1.5">{name}</p>
      <div className="space-y-1">{options.map((opt, j) => (
        <label key={j} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all ${value === opt.s ? 'bg-acl border border-ac/30' : 'bg-s0 border border-br hover:border-ac/20'}`}>
          <input type="radio" name={name} checked={value === opt.s} onChange={() => onChange(opt.s)} className="mt-0.5 accent-[var(--ac)]" />
          <span className="text-xs text-tx">{opt.l}</span>
        </label>
      ))}</div>
    </div>
  )

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={
        <div className="space-y-2">
          {classification && <div className="bg-s0 border border-br rounded-xl p-3">
            <p className="text-xs text-muted">R ratio = {classification.r}</p>
            <p className="text-sm font-bold text-tx">{classification.label}</p>
          </div>}
          {result ? <ResultCard severity={result.severity} value={`DDW-J = ${result.total}点`} interpretation={result.interpretation}
            details={[{ label: '判定基準', value: '≧5: 可能性が高い / 3-4: 可能性あり / ≦2: 可能性が低い' }]} /> : null}
        </div>
      }
      explanation={<div className="text-sm text-muted space-y-1">
        <p>まずALT・ALP値からR ratioを算出し病型を分類。病型に応じて②薬物中止後の経過の評価基準が異なる。</p>
        <p>※慢性肝障害を背景肝とする症例は想定していない。DLSTは保険適用外で偽陽性/偽陰性あり（厚労省マニュアル）。</p>
        <p>※2023年にRECAM-Jが後継として公表。新規評価ではRECAM-Jも参照。</p>
      </div>}
      relatedTools={[{ slug: 'r-ratio', name: 'R ratio' }, { slug: 'recam-j', name: 'RECAM-J' }]}
      references={toolDef.sources || []}
    >
      <div className="space-y-4">
        <p className="text-xs font-bold text-tx">Step 1: 病型分類（R ratio）</p>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="ALT実測値" value={altVal} onChange={setAltVal} unit="U/L" />
          <NumberInput label="ALT正常上限" value={altUln} onChange={setAltUln} unit="U/L" hint="施設の上限値" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="ALP実測値" value={alpVal} onChange={setAlpVal} unit="U/L" />
          <NumberInput label="ALP正常上限" value={alpUln} onChange={setAlpUln} unit="U/L" hint="施設の上限値" />
        </div>

        {classification && <>
          <p className="text-xs font-bold text-tx mt-4">Step 2: スコアリング（{classification.label}）</p>
          <RadioItem name="q1" options={commonItems[0].options} value={commonScores[0]} onChange={s => { const n = [...commonScores]; n[0] = s; setCommonScores(n) }} />
          <RadioItem name="q2" options={item2ByType[classification.type]} value={item2Score} onChange={setItem2Score} />
          {commonItems.slice(1).map((item, idx) => (
            <RadioItem key={idx + 1} name={`q${idx + 3}`} options={item.options} value={commonScores[idx + 1]} onChange={s => { const n = [...commonScores]; n[idx + 1] = s; setCommonScores(n) }} />
          ))}
        </>}
      </div>
    </CalculatorLayout>
  )
}
