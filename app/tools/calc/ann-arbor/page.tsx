'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ann-arbor')!
const stages=[{label:'Stage I: 単一リンパ節領域',value:'I'},{label:'Stage II: 横隔膜同側の2領域以上',value:'II'},{label:'Stage III: 横隔膜両側',value:'III'},{label:'Stage IV: 節外臓器びまん性浸潤',value:'IV'}]
export default function AnnArborPage(){
  const [stage,setStage]=useState('I');const [bSx,setBSx]=useState(false);const [bulky,setBulky]=useState(false)
  const suffix=(bSx?'B':'A')+(bulky?'X':'')
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Ann Arbor" value={'Stage '+stage+suffix} interpretation={bSx?'B症状あり':'A: B症状なし'} severity={stage==='IV'||bSx?'dn' as const:stage==='III'?'wn' as const:'ok' as const} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">Ann Arbor分類とは</h2><p>悪性リンパ腫の病期分類。Stage I-IV + A/B症状 + X(bulky)。治療方針決定の基本。</p></section>}
      relatedTools={[]} references={[{text:'Carbone PP et al. Cancer Res 1971;31:1860-1861'}]}
    ><div className="space-y-4"><RadioGroup id="stage" label="病期" options={stages} value={stage} onChange={setStage} /><CheckItem id="bsx" label="B症状（発熱>38°C/盗汗/体重減少>10%）" checked={bSx} onChange={setBSx} /><CheckItem id="bulky" label="Bulky disease (≧10cm)" checked={bulky} onChange={setBulky} /></div></CalculatorLayout>
  )
}