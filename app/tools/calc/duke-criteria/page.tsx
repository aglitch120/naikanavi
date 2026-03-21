'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('duke-criteria')!
const major=[
  {id:'bc2',label:'大基準1: 典型的微生物が2セット以上の血培から検出（S.viridans/S.bovis/HACEK/S.aureus/腸球菌で市中感染かつ原発巣なし）'},
  {id:'bc_persist',label:'大基準1b: 持続性の菌血症（12h以上間隔の2セット陽性 or 3セット中3セット陽性 or 4セット以上中過半数陽性）'},
  {id:'echo_veg',label:'大基準2: 心エコーで疣贅 or 弁膿瘍 or 人工弁の新規弁周囲逆流'},
]
const minor=[
  {id:'predispose',label:'素因: 基礎心疾患 or IVDU'},{id:'fever',label:'発熱 ≧38°C'},
  {id:'vascular',label:'血管現象: 動脈塞栓・感染性肺梗塞・真菌性動脈瘤・結膜出血・Janeway病変'},
  {id:'immune',label:'免疫学的現象: 糸球体腎炎・Osler結節・Roth斑・リウマトイド因子'},
  {id:'micro',label:'微生物学的証拠: 大基準を満たさない血培陽性 or IEに合致する血清学的証拠'},
]
export default function DukeCriteriaPage(){
  const [mChecks,setM]=useState<Record<string,boolean>>(Object.fromEntries(major.map(i=>[i.id,false])))
  const [nChecks,setN]=useState<Record<string,boolean>>(Object.fromEntries(minor.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const mj=major.filter(i=>mChecks[i.id]).length
    const mn=minor.filter(i=>nChecks[i.id]).length
    if(mj>=2||(mj>=1&&mn>=3)||(mn>=5)) return {severity:'dn' as const,label:'確定(Definite IE): 大基準2 or 大基準1+小基準3 or 小基準5'}
    if((mj>=1&&mn>=1)||(mn>=3)) return {severity:'wn' as const,label:'疑い(Possible IE): 大基準1+小基準1 or 小基準3'}
    return {severity:'ok' as const,label:'否定的(Rejected): 基準を満たさない or 別の確定診断あり'}
  },[mChecks,nChecks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Modified Duke基準" value={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">Duke診断基準とは</h2><p>感染性心内膜炎(IE)の臨床診断基準。大基準（血培・心エコー）と小基準（素因・発熱・血管/免疫現象・微生物）の組み合わせで確定/疑い/否定に分類。2023年にDuke-ISCVID基準として改訂。</p></section>}
      relatedTools={[]} references={[{text:'Li JS et al. Proposed modifications to the Duke criteria for the diagnosis of infective endocarditis. Clin Infect Dis 2000;30:633-638'}]}
    >
      <div className="space-y-4">
        <div><p className="text-xs font-bold text-ac mb-2">大基準</p><div className="space-y-1">{major.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={mChecks[i.id]} onChange={v=>setM(p=>({...p,[i.id]:v}))} />)}</div></div>
        <div><p className="text-xs font-bold text-muted mb-2">小基準</p><div className="space-y-1">{minor.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={nChecks[i.id]} onChange={v=>setN(p=>({...p,[i.id]:v}))} />)}</div></div>
      </div>
    </CalculatorLayout>
  )
}
