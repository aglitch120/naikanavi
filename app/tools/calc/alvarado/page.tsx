'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('alvarado')!

const criteria = [
  { id: 'migration', label: '心窩部→右下腹部への疼痛移動', points: 1 },
  { id: 'anorexia', label: '食欲不振', points: 1 },
  { id: 'nausea', label: '悪心・嘔吐', points: 1 },
  { id: 'rlq', label: '右下腹部圧痛', points: 2 },
  { id: 'rebound', label: '反跳痛', points: 1 },
  { id: 'fever', label: '体温 ≥ 37.3°C', points: 1 },
  { id: 'leuko', label: '白血球 > 10,000/μL', points: 2 },
  { id: 'shift', label: '好中球左方移動（桿状核 > 75%）', points: 1 },
]

export default function AlvaradoPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(criteria.map(c => [c.id, false]))
  )
  const result = useMemo(() => {
    const score = criteria.filter(c => checks[c.id]).reduce((s, c) => s + c.points, 0)
    const severity: 'ok'|'wn'|'dn' = score <= 4 ? 'ok' : score <= 6 ? 'wn' : 'dn'
    const label = score <= 4 ? '虫垂炎の可能性低い — 経過観察' : score <= 6 ? '虫垂炎の可能性あり — CT検査を検討' : '虫垂炎の可能性高い — 外科コンサルト'
    return { score, severity, label }
  }, [checks])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Alvarado (MANTRELS)" value={result.score} unit="/ 10点" interpretation={result.label} severity={result.severity} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Alvarado スコアとは</h2>
          <p>急性虫垂炎の臨床的確率を評価する10点満点のスコアで、MANTRELS（Migration, Anorexia, Nausea, Tenderness, Rebound, Elevation, Leukocytosis, Shift）の頭文字から構成されます。</p>
          <h3 className="font-bold text-tx">判定目安</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>0-4点: 虫垂炎の可能性低い</li>
            <li>5-6点: 虫垂炎の可能性あり → CT検討</li>
            <li>7-10点: 虫垂炎の可能性高い → 外科コンサルト</li>
          </ul>
        </section>
      }
      relatedTools={[]} references={[{ text: 'Alvarado A. Ann Emerg Med 1986;15:557-564' }]}
    >
      <div className="space-y-2">
        {criteria.map(c => <CheckItem key={c.id} id={c.id} label={c.label} points={c.points} checked={checks[c.id]} onChange={v => setChecks(p => ({...p,[c.id]:v}))} />)}
      </div>
    </CalculatorLayout>
  )
}
