'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('pancreatitis-ct')!

// 日本の急性膵炎 造影CT Grade（厚労省重症度判定基準 2008改訂）
// 膵の造影不良域 + 炎症の膵外進展
const pancExtent = [
  { label: '造影不良域なし or 膵全体の1/3未満', score: 0 },
  { label: '膵全体の1/3以上1/2未満', score: 1 },
  { label: '膵全体の1/2以上、または膵全体に及ぶ', score: 2 },
]
const extraExtent = [
  { label: '前腎傍腔にとどまる', score: 0 },
  { label: '結腸間膜根部に達する', score: 1 },
  { label: '腎下極以遠に及ぶ', score: 2 },
]

export default function PancreatitisCTPage() {
  const [pIdx, setPIdx] = useState(0)
  const [eIdx, setEIdx] = useState(0)
  const result = useMemo(() => {
    const ctGrade = pancExtent[pIdx].score + extraExtent[eIdx].score
    let severity: 'ok'|'wn'|'dn' = 'ok', interpretation = ''
    if (ctGrade <= 1) { interpretation = `CT Grade ${ctGrade} — Grade 1（軽度）`; severity = 'ok' }
    else if (ctGrade === 2) { interpretation = `CT Grade ${ctGrade} — Grade 2（中等度）`; severity = 'wn' }
    else { interpretation = `CT Grade ${ctGrade} — Grade 3（重度） ※CT Grade 2以上で重症膵炎の予後因子`; severity = 'dn' }
    return { ctGrade, severity, interpretation }
  }, [pIdx, eIdx])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`CT Grade ${result.ctGrade}`} interpretation={result.interpretation} />}
      explanation={<div className="text-sm text-muted space-y-1">
        <p>日本の急性膵炎重症度判定基準（厚労省 2008改訂）における造影CT Grade。膵の造影不良域（壊死の範囲）と炎症の膵外進展の2軸で評価。</p>
        <p className="text-xs">CT Grade 2以上は予後因子陽性。造影CTは発症48-72時間以降の評価が推奨。</p>
      </div>}
      relatedTools={[{slug:'pancreatitis-prognostic',name:'膵炎予後因子'},{slug:'ranson',name:'Ranson'},{slug:'bisap',name:'BISAP'}]}
      references={[
        {text:'急性膵炎診療ガイドライン 2021（第5版）. 日本膵臓学会'},
        {text:'厚生労働省 急性膵炎重症度判定基準 2008改訂'},
      ]}
    >
      <div className="space-y-4">
        <div><p className="text-sm font-bold text-tx mb-2">膵の造影不良域（壊死の範囲）</p>
          {pancExtent.map((item,i)=>(
            <label key={i} className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer mb-1 ${pIdx===i?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
              <input type="radio" name="panc" checked={pIdx===i} onChange={()=>setPIdx(i)} className="accent-[var(--ac)]"/>
              <span className="text-xs text-tx">{item.label}</span>
            </label>))}
        </div>
        <div><p className="text-sm font-bold text-tx mb-2">炎症の膵外進展</p>
          {extraExtent.map((item,i)=>(
            <label key={i} className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer mb-1 ${eIdx===i?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
              <input type="radio" name="extra" checked={eIdx===i} onChange={()=>setEIdx(i)} className="accent-[var(--ac)]"/>
              <span className="text-xs text-tx">{item.label}</span>
            </label>))}
        </div>
      </div>
    </CalculatorLayout>
  )
}
