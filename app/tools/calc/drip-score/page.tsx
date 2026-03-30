'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('drip-score')!
// Webb BJ et al. Antimicrob Agents Chemother 2016;60(5):2652-63
const items = [
  // Major (2点)
  { id: 'abx', label: '60日以内の抗生物質の使用', points: 2 },
  { id: 'caregiver', label: '介護者の存在', sublabel: '長期急性期ケア・熟練看護・入院リハビリを含む（生活支援施設・グループホームは含まない）', points: 2 },
  { id: 'tube', label: '経管栄養', sublabel: '経鼻胃・経鼻空腸・経皮的胃瘻造設', points: 2 },
  { id: 'resistant', label: '1年以内の薬剤耐性肺炎の診断', points: 2 },
  // Minor (1点)
  { id: 'hosp', label: '60日以内の入院', points: 1 },
  { id: 'copd', label: '慢性肺疾患', points: 1 },
  { id: 'poor_func', label: 'Karnofsky PS <70 または歩行不能状態', points: 1 },
  { id: 'ppi', label: '14日以内のH2ブロッカーまたはPPI使用', points: 1 },
  { id: 'wound', label: '入院時の積極的な創傷ケア', points: 1 },
  { id: 'mrsa', label: '1年以内のMRSAコロニー形成', points: 1 },
]
export default function DRIPScorePage() {
  const [checks, setChecks] = useState<Record<string, boolean>>(Object.fromEntries(items.map(i => [i.id, false])))
  const result = useMemo(() => {
    const score = items.filter(i => checks[i.id]).reduce((s, i) => s + i.points, 0)
    if (score >= 4) return { score, severity: 'dn' as const, label: '高リスク群（≧4点）: 広域スペクトル抗菌薬が必要' }
    return { score, severity: 'ok' as const, label: '低リスク群（<4点）: 広域スペクトル抗菌薬なしでの治療を検討' }
  }, [checks])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="DRIP Score" value={result.score} unit="点" interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{ text: 'Webb BJ, et al. Derivation and Multicenter Validation of the Drug Resistance in Pneumonia Clinical Prediction Score. Antimicrob Agents Chemother 2016;60(5):2652-63' }]}
    ><div className="space-y-2">{items.map(i => <CheckItem key={i.id} id={i.id} label={`${i.label} (+${i.points}点)`} sublabel={'sublabel' in i ? (i as any).sublabel : undefined} checked={checks[i.id]} onChange={v => setChecks(p => ({ ...p, [i.id]: v }))} />)}</div></CalculatorLayout>
  )
}
