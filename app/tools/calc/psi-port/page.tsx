'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, CheckItem, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('psi-port')!
const demos=[{id:'age',label:'年齢（そのまま加算）'},{id:'female',label:'女性 (-10)',points:-10},{id:'nursing',label:'介護施設入所中 (+10)',points:10}]
const comorbid=[{id:'neoplastic',label:'悪性腫瘍 (+30)',points:30},{id:'liver',label:'肝疾患 (+20)',points:20},{id:'chf',label:'うっ血性心不全 (+10)',points:10},{id:'cvd',label:'脳血管疾患 (+10)',points:10},{id:'renal',label:'腎疾患 (+10)',points:10}]
const pe=[{id:'altered',label:'意識変容 (+20)',points:20},{id:'rr30',label:'呼吸数≧30 (+20)',points:20},{id:'sbp90',label:'収縮期血圧<90 (+20)',points:20},{id:'temp',label:'体温<35°C or ≧40°C (+15)',points:15},{id:'hr125',label:'脈拍≧125 (+10)',points:10}]
const lab=[{id:'ph735',label:'pH<7.35 (+30)',points:30},{id:'bun30',label:'BUN≧30mg/dL (+20)',points:20},{id:'na130',label:'Na<130mEq/L (+20)',points:20},{id:'glu250',label:'血糖≧250mg/dL (+10)',points:10},{id:'hct30',label:'Hct<30% (+10)',points:10},{id:'po260',label:'PaO₂<60mmHg or SpO₂<90% (+10)',points:10},{id:'effusion',label:'胸水あり (+10)',points:10}]
export default function PSIPortPage(){
  const [age,setAge]=useState('65')
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries([...demos.slice(1),...comorbid,...pe,...lab].map(i=>[i.id,false])))
  const result=useMemo(()=>{
    let score=Number(age)||0
    ;[...demos.slice(1),...comorbid,...pe,...lab].forEach(i=>{if(checks[i.id])score+=(i.points??0)})
    let cls:'I'|'II'|'III'|'IV'|'V',label:string,sev:'ok'|'wn'|'dn'
    if(score<=50){cls='I';label='Class I (≦50): 死亡率0.1% → 外来治療';sev='ok'}
    else if(score<=70){cls='II';label='Class II (51-70): 死亡率0.6% → 外来治療';sev='ok'}
    else if(score<=90){cls='III';label='Class III (71-90): 死亡率2.8% → 短期入院 or 外来';sev='wn'}
    else if(score<=130){cls='IV';label='Class IV (91-130): 死亡率8.2% → 入院';sev='wn'}
    else{cls='V';label='Class V (>130): 死亡率29.2% → 入院（ICU検討）';sev='dn'}
    return {score,cls,label,severity:sev}
  },[age,checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="PSI/PORT" value={result.score} unit={`点 (Class ${result.cls})`} interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">PSI/PORTスコアとは</h2><p>Pneumonia Severity Index。市中肺炎の30日死亡率を予測し、入院の要否を判断。20項目で算出。Class I-IIは外来、III は短期入院or外来、IV-Vは入院。CURB-65より詳細だが項目が多い。</p></section>}
      relatedTools={[]} references={[{text:'Fine MJ et al. A prediction rule to identify low-risk patients with community-acquired pneumonia. NEJM 1997;336:243-250'}]}
    >
      <div className="space-y-4">
        <NumberInput id="age" label="年齢" value={age} onChange={setAge} unit="歳" />
        <div><p className="text-xs font-bold text-tx mb-2">人口統計</p><div className="space-y-1">{demos.slice(1).map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></div>
        <div><p className="text-xs font-bold text-tx mb-2">併存疾患</p><div className="space-y-1">{comorbid.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></div>
        <div><p className="text-xs font-bold text-tx mb-2">身体所見</p><div className="space-y-1">{pe.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></div>
        <div><p className="text-xs font-bold text-tx mb-2">検査所見</p><div className="space-y-1">{lab.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></div>
      </div>
    </CalculatorLayout>
  )
}
