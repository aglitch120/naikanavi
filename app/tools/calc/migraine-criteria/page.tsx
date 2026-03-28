'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('migraine-criteria')!
const characteristics = ['片側性','拍動性','中等度〜重度の痛み','日常的な動作で悪化(歩行・階段昇降)']
const associated = ['悪心 and/or 嘔吐','光過敏 and 音過敏']
export default function MigraineCriteriaPage() {
  const [attacks, setAttacks] = useState(true)
  const [duration, setDuration] = useState(true)
  const [charChecked, setCharChecked] = useState([true,true,false,false])
  const [assocChecked, setAssocChecked] = useState([true,false])
  const result = useMemo(() => {
    const charCount = charChecked.filter(Boolean).length
    const assocCount = assocChecked.filter(Boolean).length
    const met = attacks && duration && charCount >= 2 && assocCount >= 1
    let severity: 'ok'|'wn'|'dn' = 'ok'
    if (met) severity = 'wn'
    return { met, charCount, assocCount, severity }
  }, [attacks, duration, charChecked, assocChecked])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity}
        value={result.met ? 'ICHD-3分類基準チェック: A〜D充足（確定診断には基準Eの臨床的除外が必要）' : '基準を満たさない'}
        interpretation={`ICHD-3 分類基準（前兆のない片頭痛 1.1）:\nA. ≧5回の発作: ${attacks?'✓':'✗'}\nB. 持続4-72時間: ${duration?'✓':'✗'}\nC. 頭痛の特徴 ≧2/4: ${result.charCount}/4\nD. 随伴症状 ≧1: ${result.assocCount}/2\nE. 他疾患の除外（臨床評価が必要）\n\n※本ツールはICHD-3分類基準のチェックリストです。確定診断は医師の臨床評価によります`} />}
      explanation={<div className="text-sm text-muted"><p>前兆のある片頭痛(1.2)は上記に加え、視覚/感覚/言語の前兆が5-60分持続。二次性頭痛の除外が前提。</p></div>}
      relatedTools={[{slug:'nihss',name:'NIHSS'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-4">
        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${attacks?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
          <input type="checkbox" checked={attacks} onChange={()=>setAttacks(!attacks)} className="accent-[var(--ac)]"/>
          <span className="text-sm text-tx">A. 5回以上の発作歴</span>
        </label>
        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${duration?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
          <input type="checkbox" checked={duration} onChange={()=>setDuration(!duration)} className="accent-[var(--ac)]"/>
          <span className="text-sm text-tx">B. 頭痛発作の持続時間 4〜72時間</span>
        </label>
        <div><p className="text-sm font-bold text-tx mb-1.5">C. 頭痛の特徴（≧2項目）</p>
          {characteristics.map((c,i)=>(
            <label key={i} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer mb-1 ${charChecked[i]?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
              <input type="checkbox" checked={charChecked[i]} onChange={()=>{const n=[...charChecked];n[i]=!n[i];setCharChecked(n)}} className="accent-[var(--ac)]"/>
              <span className="text-xs text-tx">{c}</span>
            </label>
          ))}
        </div>
        <div><p className="text-sm font-bold text-tx mb-1.5">D. 随伴症状（≧1項目）</p>
          {associated.map((a,i)=>(
            <label key={i} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer mb-1 ${assocChecked[i]?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
              <input type="checkbox" checked={assocChecked[i]} onChange={()=>{const n=[...assocChecked];n[i]=!n[i];setAssocChecked(n)}} className="accent-[var(--ac)]"/>
              <span className="text-xs text-tx">{a}</span>
            </label>
          ))}
        </div>
      </div>
    </CalculatorLayout>
  )
}
