'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('itp-criteria')!
const exclusions = [
  '薬剤性血小板減少（ヘパリン・バルプロ酸・ST合剤等）',
  'DIC / TTP-HUS',
  '全身性エリテマトーデス (SLE)',
  '骨髄異形成症候群 (MDS)',
  '再生不良性貧血',
  '肝硬変 / 脾機能亢進症',
  'HIV / HCV感染',
  'CLL / リンパ腫',
  '先天性血小板減少症',
]
export default function ItpCriteriaPage() {
  const [plt, setPlt] = useState(true)
  const [excluded, setExcluded] = useState<boolean[]>(exclusions.map(()=>true))
  const allExcluded = excluded.every(Boolean)
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={plt && allExcluded ? 'wn' : 'ok'}
        value={plt && allExcluded ? 'ITPの診断基準を満たす' : '基準を満たさない'}
        interpretation={`ITPは除外診断:\n1. 血小板 < 10万/μL: ${plt?'✓':'✗'}\n2. 二次性の原因を除外: ${allExcluded?'✓':'✗'}\n\n確定的な検査はない。末梢血塗抹・骨髄検査・抗体検査等で総合判断。`} />}
      explanation={<div className="text-sm text-muted"><p>初発時は骨髄検査を考慮（特に60歳以上でMDS除外）。治療: PSL→IVIg（緊急時）→TPO-RA/リツキシマブ→脾摘。</p></div>}
      relatedTools={[{slug:'4t-score',name:'4T\'s(HIT)'},{slug:'plt-transfusion',name:'PLT輸血'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-4">
        <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${plt?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
          <input type="checkbox" checked={plt} onChange={()=>setPlt(!plt)} className="accent-[var(--ac)]"/>
          <span className="text-sm font-bold text-tx">血小板 &lt; 10万/μL</span>
        </label>
        <div><p className="text-sm font-bold text-tx mb-2">二次性の除外（すべてチェック = 除外済み）</p>
          {exclusions.map((ex,i)=>(
            <label key={i} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer mb-1 ${excluded[i]?'bg-okl border border-okb':'bg-s0 border border-br'}`}>
              <input type="checkbox" checked={excluded[i]} onChange={()=>{const n=[...excluded];n[i]=!n[i];setExcluded(n)}} className="accent-[var(--ac)]"/>
              <span className="text-xs text-tx">{ex}</span>
            </label>
          ))}
        </div>
      </div>
    </CalculatorLayout>
  )
}
