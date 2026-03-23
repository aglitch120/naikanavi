'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('mrc-scale')!
const grades = [
  { grade: 0, desc: '筋収縮なし（完全麻痺）', color: 'bg-dnl' },
  { grade: 1, desc: '筋収縮は触知できるが関節運動なし', color: 'bg-dnl' },
  { grade: 2, desc: '重力を除けば関節運動可能', color: 'bg-wnl' },
  { grade: 3, desc: '重力に抗して関節運動可能（抵抗には負ける）', color: 'bg-wnl' },
  { grade: 4, desc: '抵抗に抗して関節運動可能（正常より弱い）', color: 'bg-okl' },
  { grade: 5, desc: '正常筋力', color: 'bg-okl' },
]
export default function MrcScalePage() {
  const [selected, setSelected] = useState(5)
  const g = grades[selected]
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={selected>=4?'ok':selected>=2?'wn':'dn'}
        value={`MRC Grade ${g.grade}/5`} interpretation={g.desc} />}
      explanation={<div className="text-sm text-muted"><p>Grade 4は4-/4/4+と細分化する場合もある。記録は「右上肢 三角筋 4/5」のように部位・筋を明記。MRC sum score(12筋群合計0-60)はGBS等で使用。</p></div>}
      relatedTools={[{slug:'nihss',name:'NIHSS'},{slug:'gcs',name:'GCS'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-2">{grades.map((gr,i)=>(
        <button key={i} onClick={()=>setSelected(i)}
          className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${selected===i?'bg-acl border-2 border-ac/40':'bg-s0 border border-br hover:border-ac/20'}`}>
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${gr.color} text-tx`}>{gr.grade}</span>
          <span className="text-sm text-tx">{gr.desc}</span>
        </button>
      ))}</div>
    </CalculatorLayout>
  )
}
