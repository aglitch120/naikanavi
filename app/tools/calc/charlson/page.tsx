'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('charlson')!

const conditions = [
  { id: 'mi', label: '心筋梗塞', points: 1 },
  { id: 'chf', label: 'うっ血性心不全', points: 1 },
  { id: 'pvd', label: '末梢血管疾患', points: 1 },
  { id: 'cvd', label: '脳血管疾患', points: 1 },
  { id: 'dementia', label: '認知症', points: 1 },
  { id: 'copd', label: '慢性肺疾患', points: 1 },
  { id: 'ctd', label: '膠原病', points: 1 },
  { id: 'ulcer', label: '消化性潰瘍', points: 1 },
  { id: 'liver_mild', label: '軽度肝疾患', points: 1 },
  { id: 'dm', label: '糖尿病（合併症なし）', points: 1 },
  { id: 'hemi', label: '片麻痺', points: 2 },
  { id: 'ckd', label: '中等度〜重度腎疾患', points: 2 },
  { id: 'dm_comp', label: '糖尿病（臓器障害あり）', points: 2 },
  { id: 'tumor', label: '悪性腫瘍（固形がん）', points: 2 },
  { id: 'leukemia', label: '白血病', points: 2 },
  { id: 'lymphoma', label: '悪性リンパ腫', points: 2 },
  { id: 'liver_mod', label: '中等度〜重度肝疾患', points: 3 },
  { id: 'mets', label: '転移性固形がん', points: 6 },
  { id: 'aids', label: 'AIDS', points: 6 },
]

function ageScore(age: number) { if (age<50) return 0; if (age<60) return 1; if (age<70) return 2; if (age<80) return 3; return 4 }
function survival10y(score: number) {
  if (score===0) return '98%'; if (score===1) return '96%'; if (score===2) return '90%'
  if (score===3) return '77%'; if (score===4) return '53%'; if (score===5) return '21%'
  return '<2%'
}

export default function CharlsonPage() {
  const [age, setAge] = useState('50')
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(conditions.map(c => [c.id, false]))
  )
  const result = useMemo(() => {
    const comorbScore = conditions.filter(c => checks[c.id]).reduce((sum, c) => sum + c.points, 0)
    const total = comorbScore + ageScore(parseInt(age) || 50)
    const surv = survival10y(total)
    const severity: 'ok'|'wn'|'dn' = total <= 2 ? 'ok' : total <= 5 ? 'wn' : 'dn'
    return { total, comorbScore, agePoints: ageScore(parseInt(age)||50), surv, severity }
  }, [age, checks])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Charlson CCI" value={result.total} unit="点" interpretation={`推定10年生存率: ${result.surv}`} severity={result.severity}
        details={[{ label: '併存疾患スコア', value: `${result.comorbScore}点` }, { label: '年齢スコア', value: `${result.agePoints}点` }]} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">チャールソン併存疾患指数（CCI）とは</h2>
          <p>19の併存疾患に重み付けしたスコアで、10年生存率を予測します。臨床研究でのリスク調整や、治療方針決定時の予後評価に広く使用されています。年齢補正版では10歳ごとに1点加算します。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Charlson ME, et al. J Chronic Dis 1987;40:373-383' }]}
    >
      <div className="space-y-4">
        <NumberInput id="age" label="年齢" unit="歳" value={age} onChange={setAge} step={1} />
        <div className="text-xs font-medium text-muted uppercase tracking-wider mt-2">併存疾患</div>
        <div className="space-y-2">
          {conditions.map(c => (
            <CheckItem key={c.id} id={c.id} label={c.label} points={c.points}
              checked={checks[c.id]} onChange={v => setChecks(prev => ({ ...prev, [c.id]: v }))} />
          ))}
        </div>
      </div>
    </CalculatorLayout>
  )
}
