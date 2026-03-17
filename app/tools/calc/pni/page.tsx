'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('pni')!
export default function PNIPage(){
  const [alb,setAlb]=useState('3.5');const [lymph,setLymph]=useState('1500')
  const result=useMemo(()=>{
    const pni=10*Number(alb)+0.005*Number(lymph)
    const sev=pni>=45?'ok' as const:pni>=40?'wn' as const:'dn' as const
    return {pni:pni.toFixed(1),severity:sev,label:pni>=45?'正常（≧45）':pni>=40?'手術可能だが合併症リスクあり（40-45）':'高リスク（<40）: 周術期合併症・死亡率↑'}
  },[alb,lymph])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="PNI" value={result.pni} interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">PNIとは</h2><p>小野寺の予後推定栄養指数。PNI = 10 × Alb(g/dL) + 0.005 × リンパ球数(/μL)。消化器外科手術の術前栄養評価として開発。{'<'}40は手術リスク高。</p></section>}
      relatedTools={[]} references={[{text:'Onodera T et al. Prognostic nutritional index in gastrointestinal surgery of malnourished cancer patients. Nihon Geka Gakkai Zasshi 1984;85:1001-1005'}]}
    ><div className="space-y-3"><NumberInput id="alb" label="アルブミン" value={alb} onChange={setAlb} unit="g/dL" /><NumberInput id="lymph" label="リンパ球数" value={lymph} onChange={setLymph} unit="/μL" /></div></CalculatorLayout>
  )
}
