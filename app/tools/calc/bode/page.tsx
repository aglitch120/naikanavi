'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('bode')!
const items=[
  {id:'fev1',label:'FEV1 (%predicted)',options:[{label:'≧65 (0)',value:'0'},{label:'50-64 (1)',value:'1'},{label:'36-49 (2)',value:'2'},{label:'≦35 (3)',value:'3'}]},
  {id:'walk',label:'6分間歩行距離',options:[{label:'≧350m (0)',value:'0'},{label:'250-349m (1)',value:'1'},{label:'150-249m (2)',value:'2'},{label:'≦149m (3)',value:'3'}]},
  {id:'mmrc',label:'mMRC息切れスケール',options:[{label:'0-1 (0)',value:'0'},{label:'2 (1)',value:'1'},{label:'3 (2)',value:'2'},{label:'4 (3)',value:'3'}]},
  {id:'bmi',label:'BMI',options:[{label:'>21 (0)',value:'0'},{label:'≦21 (1)',value:'1'}]},
]
export default function BODEPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'0'])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    const sev=score<=2?'ok' as const:score<=4?'wn' as const:'dn' as const
    const surv=score<=2?'4年生存率 約80%':score<=4?'4年生存率 約67%':score<=6?'4年生存率 約57%':'4年生存率 約18%'
    return {score,severity:sev,label:surv}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="BODE" value={result.score} unit="/10点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">BODE指数とは</h2><p>BMI/airflow Obstruction/Dyspnea/Exercise capacityの4因子でCOPDの予後を予測。0-10点。FEV1単独より生存予測精度が高い。肺移植・肺容量減少術の適応判断にも使用。</p></section>}
      relatedTools={[]} references={[{text:'Celli BR et al. The body-mass index, airflow obstruction, dyspnea, and exercise capacity index in chronic obstructive pulmonary disease. NEJM 2004;350:1005-1012'}]}
    ><div className="space-y-4">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={i.options} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}
