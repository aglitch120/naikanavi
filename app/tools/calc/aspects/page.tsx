'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('aspects')!
const regions=[
  {id:'c',label:'C: 尾状核'},{id:'l',label:'L: レンズ核'},{id:'ic',label:'IC: 内包'},
  {id:'i',label:'I: 島皮質'},{id:'m1',label:'M1: 前方MCA皮質（島レベル）'},
  {id:'m2',label:'M2: 側方MCA皮質（島レベル）'},{id:'m3',label:'M3: 後方MCA皮質（島レベル）'},
  {id:'m4',label:'M4: 前方MCA皮質（基底核上レベル）'},
  {id:'m5',label:'M5: 側方MCA皮質（基底核上レベル）'},{id:'m6',label:'M6: 後方MCA皮質（基底核上レベル）'},
]
export default function ASPECTSPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(regions.map(r=>[r.id,false])))
  const result=useMemo(()=>{
    const involved=regions.filter(r=>checks[r.id]).length
    const score=10-involved
    const sev=score>=8?'ok' as const:score>=6?'wn' as const:'dn' as const
    const label=score>=8?'良好（≧8）: 血管内治療の適応あり':score>=6?'中間（6-7）: 血管内治療を個別に判断':`不良（≦5）: 広範梗塞。治療ベネフィットが限定的（スコア${score}点）`
    return {score,severity:sev,label}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="ASPECTS" value={result.score} unit="/10点" interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Barber PA et al. Validity and reliability of a quantitative computed tomography score in predicting outcome of hyperacute stroke. Lancet 2000;355:1670-1674'}]}
    >
      <div className="space-y-1"><p className="text-xs text-muted mb-2">CTで早期虚血変化がある領域にチェック（チェック=1点減点）:</p>{regions.map(r=><CheckItem key={r.id} id={r.id} label={r.label} checked={checks[r.id]} onChange={v=>setChecks(p=>({...p,[r.id]:v}))} />)}</div>
    </CalculatorLayout>
  )
}
