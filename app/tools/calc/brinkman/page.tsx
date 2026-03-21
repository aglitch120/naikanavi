'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('brinkman')!
export default function BrinkmanPage(){
  const [cig,setCig]=useState('20');const [years,setYears]=useState('20')
  const result=useMemo(()=>{
    const bi=(Number(cig)||0)*(Number(years)||0)
    const packYears=bi/20
    const sev=bi>=600?'dn' as const:bi>=400?'wn' as const:'ok' as const
    return {bi,packYears:packYears.toFixed(1),severity:sev,label:bi>=600?'重喫煙（≧600）: 肺癌・COPD高リスク':bi>=400?'肺癌リスク上昇（≧400）':'低〜中リスク'}
  },[cig,years])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="ブリンクマン指数" value={result.bi} unit={`（${result.packYears} pack-years）`} interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">ブリンクマン指数とは</h2><p>1日の喫煙本数 × 喫煙年数。≧400で肺癌リスク上昇、≧600で重喫煙。Pack-years = BI / 20。</p></section>}
      relatedTools={[]} references={[{text:'Brinkman GL, Coates EO. Am Rev Respir Dis 1963;87:684-693'}]}
    ><div className="space-y-3"><NumberInput id="cig" label="1日の喫煙本数" value={cig} onChange={setCig} unit="本/日" /><NumberInput id="years" label="喫煙年数" value={years} onChange={setYears} unit="年" /></div></CalculatorLayout>
  )
}
