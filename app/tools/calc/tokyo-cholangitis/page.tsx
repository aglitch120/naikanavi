'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('tokyo-cholangitis')!
const items = [
  { cat: 'A. 全身性の炎症', items: [{ id: 'fever', label: '発熱(>38℃)・悪寒' }, { id: 'lab', label: '炎症所見(WBC異常/CRP上昇)' }] },
  { cat: 'B. 胆汁うっ滞', items: [{ id: 'jaundice', label: '黄疸' }, { id: 'biliary-lab', label: '肝機能異常(ALP/γGTP/AST/ALT上昇)' }] },
  { cat: 'C. 胆管病変', items: [{ id: 'dilatation', label: '胆管拡張' }, { id: 'etiology', label: '胆管の成因(結石・狭窄・ステントなど)の画像所見' }] },
]
const severityItems = [
  { label: '意識障害', grade: 3 },
  { label: '循環不全(DOA/NA使用)', grade: 3 },
  { label: '黄疸(T-Bil ≧ 5mg/dL)', grade: 2 },
  { label: '高熱(≧ 39℃)', grade: 2 },
  { label: 'WBC < 4,000 or > 12,000', grade: 2 },
  { label: 'Plt < 10万', grade: 2 },
  { label: 'Alb < 3.0', grade: 2 },
  { label: '腎機能障害(BUN/Cr上昇)', grade: 2 },
  { label: 'PT-INR > 1.5', grade: 2 },
]
export default function TokyoCholangitisPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [sevChecked, setSevChecked] = useState<boolean[]>(severityItems.map(()=>false))
  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }))
  const result = useMemo(() => {
    const a = checked.fever || checked.lab
    const b = checked.jaundice || checked['biliary-lab']
    const c = checked.dilatation || checked.etiology
    let dx = ''
    if (a && b && c) dx = '確診 (Definite)'
    else if ((a && b) || (a && c) || (b && c)) dx = '疑診 (Suspected)'
    else dx = '診断基準を満たさない'
    const g3 = sevChecked.filter((v, i) => v && severityItems[i].grade === 3).length > 0
    const g2count = sevChecked.filter((v, i) => v && severityItems[i].grade === 2).length
    let grade = 'Grade I（軽症）', severity: 'ok'|'wn'|'dn' = 'ok'
    if (g3) { grade = 'Grade III（重症）— 臓器不全あり。緊急胆道ドレナージ+ICU'; severity = 'dn' }
    else if (g2count >= 1) { grade = 'Grade II（中等症）— 24-48h以内の胆道ドレナージ推奨（参考: TG18基準）'; severity = 'wn' }
    return { dx, grade, severity }
  }, [checked, sevChecked])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={result.dx} interpretation={result.grade} />}
      explanation={<div className="text-sm text-muted"><p>Charcot三徴(発熱+黄疸+腹痛)→Reynolds五徴(+意識障害+ショック)。TG18はA+B+Cで確診。</p></div>}
      relatedTools={[{slug:'tokyo-cholecystitis',name:'胆嚢炎 TG18'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-4">
        <div className="text-sm font-bold text-tx">診断基準</div>
        {items.map(cat=>(
          <div key={cat.cat}>
            <p className="text-xs font-bold text-muted mb-1">{cat.cat}</p>
            {cat.items.map(item=>(
              <label key={item.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer mb-1 ${checked[item.id]?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
                <input type="checkbox" checked={!!checked[item.id]} onChange={()=>toggle(item.id)} className="accent-[var(--ac)]"/>
                <span className="text-xs text-tx">{item.label}</span>
              </label>
            ))}
          </div>
        ))}
        <div className="text-sm font-bold text-tx mt-4">重症度判定</div>
        {severityItems.map((item,i)=>(
          <label key={i} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer mb-1 ${sevChecked[i]?'bg-wnl border border-wnb':'bg-s0 border border-br'}`}>
            <input type="checkbox" checked={sevChecked[i]} onChange={()=>{const n=[...sevChecked];n[i]=!n[i];setSevChecked(n)}} className="accent-[var(--ac)]"/>
            <span className="text-xs text-tx">{item.label}</span>
            <span className="text-[10px] text-muted ml-auto">G{item.grade}項目</span>
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
