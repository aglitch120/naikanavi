'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('siadh')!

// バゾプレシン分泌過剰症（SIADH）の診断と治療の手引き（平成22年度改訂）
const clinicalItems = [
  { id: 'no_dehydration', label: 'I-1. 脱水の所見を認めない' },
]
const labItems = [
  { id: 'hyponatremia', label: 'II-1. 血清Na < 135 mEq/L' },
  { id: 'avp', label: 'II-2. 血清Na < 135 mEq/Lで血漿AVP(バゾプレシン)値が測定感度以上' },
  { id: 'low_osm', label: 'II-3. 血漿浸透圧 < 280 mOsm/kg' },
  { id: 'high_urine_osm', label: 'II-4. 尿浸透圧 > 300 mOsm/kg' },
  { id: 'urine_na', label: 'II-5. 尿中Na ≧ 20 mEq/L' },
  { id: 'renal_normal', label: 'II-6. 腎機能正常（血清Cr ≦ 1.2 mg/dL）' },
  { id: 'adrenal_normal', label: 'II-7. 副腎皮質機能正常（早朝空腹時コルチゾール ≧ 6 μg/dL）' },
]
const refItems = [
  { id: 'ref_disease', label: '参考1. 原疾患（肺疾患・中枢神経疾患・薬剤性等）の診断が確定' },
  { id: 'ref_renin', label: '参考2. 血漿レニン活性 ≦ 5 ng/mL/h' },
  { id: 'ref_ua', label: '参考3. 血清尿酸値 ≦ 5 mg/dL' },
  { id: 'ref_water', label: '参考4. 水分制限で脱水なく低Na血症が改善する' },
]

export default function Page() {
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries([...clinicalItems, ...labItems, ...refItems].map(i => [i.id, false]))
  )
  const result = useMemo(() => {
    const clinicalMet = clinicalItems.every(i => checks[i.id])
    const labMet = labItems.every(i => checks[i.id])
    const labCount = labItems.filter(i => checks[i.id]).length
    const refCount = refItems.filter(i => checks[i.id]).length
    const definite = clinicalMet && labMet

    if (definite) return {
      severity: 'wn' as const,
      label: '確実例: I-1 + II-1〜7 をすべて満たす',
      detail: `主症候1/1 + 検査所見7/7 + 参考所見${refCount}/4`,
    }
    return {
      severity: 'ok' as const,
      label: '診断基準を満たさない（全項目を満たす必要あり）',
      detail: `主症候${clinicalMet ? 1 : 0}/1 + 検査所見${labCount}/7`,
    }
  }, [checks])

  return (
    <CalculatorLayout slug={toolDef.slug} title="SIADH診断基準（H22年改訂）" titleEn="SIADH Diagnostic Criteria (Japan 2010)"
      description="バゾプレシン分泌過剰症（SIADH）の診断の手引き（平成22年度改訂）。主症候I-1 + 検査所見II-1〜7の全てを満たす場合に確実例。"
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="SIADH診断基準" value={result.label} severity={result.severity}
        details={[{ label: '判定内訳', value: result.detail }]} />}
      explanation={undefined}
      relatedTools={[
        { slug: 'hyponatremia-flow', name: '低Na血症フロー' },
        { slug: 'na-correction-rate', name: 'Na補正速度' },
        { slug: 'feua', name: 'FEUA' },
      ]}
      references={[
        { text: '厚生労働省. バゾプレシン分泌過剰症（SIADH）の診断と治療の手引き（平成22年度改訂）' },
        { text: 'Bartter FC, Schwartz WB. Am J Med 1967;42:790-806（原著）' },
      ]}
    >
      <div className="space-y-3">
        <p className="text-xs font-bold text-ac">I. 主症候（必須）</p>
        {clinicalItems.map(i => <CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v => setChecks(p => ({ ...p, [i.id]: v }))} />)}

        <p className="text-xs font-bold text-ac mt-3">II. 検査所見（全7項目必須）</p>
        {labItems.map(i => <CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v => setChecks(p => ({ ...p, [i.id]: v }))} />)}

        <p className="text-xs font-bold text-muted mt-3">III. 参考所見</p>
        {refItems.map(i => <CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v => setChecks(p => ({ ...p, [i.id]: v }))} />)}
      </div>
    </CalculatorLayout>
  )
}
