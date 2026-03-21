'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('westley-croup')!
const items=[
  {id:'stridor',label:'吸気性喘鳴(stridor)',options:[{label:'なし(0)',value:'0'},{label:'安静時なし興奮時あり(1)',value:'1'},{label:'安静時あり(2)',value:'2'}]},
  {id:'retraction',label:'陥没呼吸',options:[{label:'なし(0)',value:'0'},{label:'軽度(1)',value:'1'},{label:'中等度(2)',value:'2'},{label:'重度(3)',value:'3'}]},
  {id:'air_entry',label:'空気の流入',options:[{label:'正常(0)',value:'0'},{label:'減弱(1)',value:'1'},{label:'著明に減弱(2)',value:'2'}]},
  {id:'cyanosis',label:'チアノーゼ',options:[{label:'なし(0)',value:'0'},{label:'興奮時(4)',value:'4'},{label:'安静時(5)',value:'5'}]},
  {id:'consciousness',label:'意識レベル',options:[{label:'正常(0)',value:'0'},{label:'見当識障害(5)',value:'5'}]},
]
export default function WestleyPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'0'])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    if(score>=8) return {score,severity:'dn' as const,label:'重症（≧8）: 気管挿管考慮 + アドレナリン吸入 + デキサメタゾン'}
    if(score>=3) return {score,severity:'wn' as const,label:'中等症（3-7）: デキサメタゾン0.6mg/kg + アドレナリン吸入'}
    return {score,severity:'ok' as const,label:'軽症（≦2）: デキサメタゾン0.6mg/kg単回'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Westley" value={result.score} unit="/17点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">Westleyクループスコアとは</h2><p>クループ症候群の重症度を5項目（stridor/陥没呼吸/空気流入/チアノーゼ/意識）で評価。≦2軽症、3-7中等症、≧8重症。デキサメタゾン0.6mg/kg経口/筋注が全例にが一般的。</p></section>}
      relatedTools={[]} references={[{text:'Westley CR et al. Nebulized racemic epinephrine by IPPB for the treatment of croup. Am J Dis Child 1978;132:484-487'}]}
    ><div className="space-y-4">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={i.options} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}