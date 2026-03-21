'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('murray')!
const items=[{id:'xray',label:'胸部X線',options:[{label:'浸潤影なし(0)',value:'0'},{label:'1象限(1)',value:'1'},{label:'2象限(2)',value:'2'},{label:'3象限(3)',value:'3'},{label:'4象限(4)',value:'4'}]},{id:'pf',label:'PaO2/FiO2',options:[{label:'≧300(0)',value:'0'},{label:'225-299(1)',value:'1'},{label:'175-224(2)',value:'2'},{label:'100-174(3)',value:'3'},{label:'<100(4)',value:'4'}]},{id:'peep',label:'PEEP(cmH2O)',options:[{label:'≦5(0)',value:'0'},{label:'6-8(1)',value:'1'},{label:'9-11(2)',value:'2'},{label:'12-14(3)',value:'3'},{label:'≧15(4)',value:'4'}]},{id:'comp',label:'コンプライアンス(mL/cmH2O)',options:[{label:'≧80(0)',value:'0'},{label:'60-79(1)',value:'1'},{label:'40-59(2)',value:'2'},{label:'20-39(3)',value:'3'},{label:'≦19(4)',value:'4'}]}]
export default function MurrayPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'0'])))
  const result=useMemo(()=>{
    const total=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    const score=total/4
    if(score>2.5) return {score:score.toFixed(1),severity:'dn' as const,label:'重症ARDS（>2.5）: ECMO考慮'}
    if(score>0.1) return {score:score.toFixed(1),severity:'wn' as const,label:'軽度〜中等度肺障害'}
    return {score:score.toFixed(1),severity:'ok' as const,label:'肺障害なし'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Murray LIS" value={result.score} unit="/4.0" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">Murrayスコアとは</h2><p>Lung Injury Score。4項目の平均値。{'>'}2.5でECMO考慮。ELSO基準で使用。</p></section>}
      relatedTools={[]} references={[{text:'Murray JF et al. Am Rev Respir Dis 1988;138:720-723'}]}
    ><div className="space-y-4">{items.map(i=><RadioGroup key={i.id} name={i.id} label={i.label} options={i.options} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}