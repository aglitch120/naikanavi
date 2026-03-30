'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('tokyo-cholecystitis')!
const diagItems = [
  { cat: 'A. 局所の炎症所見', items: ['Murphy徴候陽性','右上腹部の腫瘤触知/圧痛/自発痛'] },
  { cat: 'B. 全身の炎症所見', items: ['発熱','CRP上昇','WBC上昇'] },
  { cat: 'C. 画像所見', items: ['急性胆嚢炎に合致する画像所見（壁肥厚・周囲液貯留・胆嚢腫大・sonographic Murphy等）'] },
]
const sevItems = [
  { label: '循環不全（DOA/NA使用）', g: 3 },
  { label: '意識障害', g: 3 },
  { label: '呼吸不全（P/F < 300）', g: 3 },
  { label: '腎障害（Cr > 2.0）', g: 3 },
  { label: '肝障害（PT-INR > 1.5）', g: 3 },
  { label: 'Plt < 10万', g: 3 },
  { label: 'WBC > 18,000', g: 2 },
  { label: '右上腹部の有痛性腫瘤', g: 2 },
  { label: '症状出現後72時間以上経過', g: 2 },
  { label: '局所の高度炎症所見（胆嚢周囲膿瘍・壊疽性・気腫性胆嚢炎）', g: 2 },
]
export default function TokyoCholecystitisPage() {
  const [diag, setDiag] = useState<boolean[]>(new Array(6).fill(false))
  const [sev, setSev] = useState<boolean[]>(sevItems.map(()=>false))
  const result = useMemo(() => {
    const aCount = (diag[0]?1:0)+(diag[1]?1:0)
    const bCount = (diag[2]?1:0)+(diag[3]?1:0)+(diag[4]?1:0)
    const cCount = diag[5]?1:0
    const a = aCount > 0, b = bCount > 0, c = cCount > 0
    let dx = '診断基準を満たさない'
    if (a && b && c) dx = '確診 (Definite)'
    else if (a && (b || c)) dx = '疑診 (Suspected)'
    const g3 = sev.some((v,i)=>v&&sevItems[i].g===3)
    const g2count = sev.filter((v,i)=>v&&sevItems[i].g===2).length
    let grade = 'Grade I（軽症）（参考: TG18基準。治療は担当医が判断）', severity: 'ok'|'wn'|'dn' = 'ok'
    if (g3) { grade = 'Grade III（重症）（参考: TG18基準。治療は担当医が判断）'; severity = 'dn' }
    else if (g2count >= 1) { grade = 'Grade II（中等症）（参考: TG18基準。治療は担当医が判断）'; severity = 'wn' }
    return { dx, grade, severity }
  }, [diag, sev])
  let diagIdx = 0
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={result.dx} interpretation={result.grade} />}
      explanation={<div className="text-sm text-muted space-y-1"><p>TG18: A(局所)+B(全身)+C(画像)で確診。A+BまたはA+Cで疑診。</p><p className="text-xs text-wn">注1: 肝硬変・慢性腎不全・抗凝固療法中は重症度判定に注意（別途参照）。注2: 診断後直ちに重症度判定を行い、非手術治療選択時は24時間以内に2回目の判定、以後適宜繰り返す。</p></div>}
      relatedTools={[{slug:'tokyo-cholangitis',name:'胆管炎 TG18'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-4">
        <div className="text-sm font-bold text-tx">診断基準</div>
        {diagItems.map(cat=>{
          return (<div key={cat.cat}>
            <p className="text-xs font-bold text-muted mb-1">{cat.cat}</p>
            {cat.items.map(item=>{
              const idx = diagIdx++
              return (
                <label key={idx} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer mb-1 ${diag[idx]?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
                  <input type="checkbox" checked={diag[idx]} onChange={()=>{const n=[...diag];n[idx]=!n[idx];setDiag(n)}} className="accent-[var(--ac)]"/>
                  <span className="text-xs text-tx">{item}</span>
                </label>
              )
            })}
          </div>)
        })}
        <div className="text-sm font-bold text-tx mt-4">重症度判定</div>
        {sevItems.map((item,i)=>(
          <label key={i} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer mb-1 ${sev[i]?'bg-wnl border border-wnb':'bg-s0 border border-br'}`}>
            <input type="checkbox" checked={sev[i]} onChange={()=>{const n=[...sev];n[i]=!n[i];setSev(n)}} className="accent-[var(--ac)]"/>
            <span className="text-xs text-tx">{item.label}</span>
            <span className="text-[10px] text-muted ml-auto">G{item.g}</span>
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
