'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('iadl')!
const items = [
  { name: '電話の使用', options: ['自分で電話できる (1)','決まった番号なら可 (1)','電話に出るが自分からかけられない (1)','電話が使えない (0)'] },
  { name: '買い物', options: ['自分で買い物できる (1)','少額の買い物は可 (0)','買い物に付き添いが必要 (0)','全く買い物不可 (0)'] },
  { name: '食事の準備', options: ['自分で計画・準備できる (1)','材料があれば調理できる (0)','温めのみ可 (0)','全くできない (0)'] },
  { name: '家事', options: ['自分でできる (1)','軽い家事のみ (1)','軽い家事もできない (1)','家事は全くできない (0)'] },
  { name: '洗濯', options: ['自分でできる (1)','小物のみ (1)','全くできない (0)','—'] },
  { name: '移動', options: ['公共交通/車を使える (1)','タクシーは使える (1)','付き添いがあれば外出可 (1)','外出不可 (0)'] },
  { name: '服薬管理', options: ['自分で管理できる (1)','1回分準備されれば可 (0)','自分では管理不可 (0)','—'] },
  { name: '金銭管理', options: ['自分で管理できる (1)','日常の買い物は可 (1)','金銭管理不可 (0)','—'] },
]
export default function IadlPage() {
  const [scores, setScores] = useState(items.map(()=>0))
  const result = useMemo(() => {
    const vals = items.map((_,i) => {
      const opts = items[i].options.filter(o=>o!=='—')
      const match = opts[scores[i]]
      return match?.includes('(1)') ? 1 : 0
    })
    const total = vals.reduce((a,b)=>a+b,0)
    let severity: 'ok'|'wn'|'dn' = 'ok'
    if (total <= 3) severity = 'dn'
    else if (total <= 5) severity = 'wn'
    return { total, severity }
  }, [scores])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`IADL = ${result.total}/8`}
        interpretation={`8: 完全自立 / 0: 完全依存\n高齢者の在宅生活能力・介護度判定に使用。`} />}
      explanation={<div className="text-sm text-muted"><p>Lawton IADL。基本的ADL(Barthel Index)より高次の日常活動を評価。認知機能低下の早期発見に有用。</p></div>}
      relatedTools={[{slug:'barthel-index',name:'Barthel Index'},{slug:'mmse',name:'MMSE'},{slug:'sarc-f',name:'SARC-F'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-4">{items.map((item,i)=>(
        <div key={i}>
          <p className="text-sm font-bold text-tx mb-1.5">{item.name}</p>
          <div className="space-y-1">{item.options.filter(o=>o!=='—').map((opt,j)=>(
            <label key={j} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer ${scores[i]===j?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
              <input type="radio" name={`q-${i}`} checked={scores[i]===j} onChange={()=>{const n=[...scores];n[i]=j;setScores(n)}} className="mt-0.5 accent-[var(--ac)]"/>
              <span className="text-xs text-tx">{opt}</span>
            </label>
          ))}</div>
        </div>
      ))}</div>
    </CalculatorLayout>
  )
}
