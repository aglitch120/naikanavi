'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('add-risk')!
const cats = [
  { title:'ハイリスク状態（1つ以上→+1点）', items:[
    {id:'marfan',label:'マルファン症候群/結合組織疾患'},{id:'family',label:'大動脈疾患の家族歴'},{id:'known_aortic',label:'既知の大動脈弁疾患'},{id:'known_aneurysm',label:'既知の胸部大動脈瘤'},{id:'prev_manipulation',label:'過去の大動脈手術/カテーテル治療'},
  ]},
  { title:'ハイリスクな痛みの特徴（1つ以上→+1点）', items:[
    {id:'sudden',label:'突然発症の胸部/背部/腹部痛'},{id:'severe',label:'激烈な痛み'},{id:'tearing',label:'引き裂かれるような痛み'},
  ]},
  { title:'ハイリスクな身体所見（1つ以上→+1点）', items:[
    {id:'perfusion',label:'灌流障害（脈拍欠損/収縮期血圧差/局所虚血）'},{id:'regurg',label:'新規大動脈弁閉鎖不全の雑音'},{id:'shock',label:'ショック/低血圧'},
  ]},
]
export default function ADDRiskPage(){
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(cats.flatMap(c=>c.items).map(i=>[i.id,false])))
  const result=useMemo(()=>{
    const catScores = cats.map(c=>c.items.some(i=>checks[i.id])?1:0) as number[]
    const score = catScores.reduce((a,b)=>a+b,0)
    if(score>=2) return {score,severity:'dn' as const,label:'高リスク（2-3点）: 大動脈解離の可能性高い → CT造影を強く検討（最終判断は担当医）'}
    if(score===1) return {score,severity:'wn' as const,label:'中リスク（1点）: ADvISED研究ではADD-RS 0-1点+D-dimer<0.5で除外検討。CT造影も考慮'}
    return {score,severity:'ok' as const,label:'低リスク（0点）: D-dimer<0.5μg/mLで除外を支持する（確定的ではない）'}
  },[checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="ADD-RS" value={result.score} unit="/3点" interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'Defined in the 2022 ACC/AHA Guideline for the Diagnosis and Management of Aortic Disease (Isselbacher EM, et al. JACC 2022)', url:'https://doi.org/10.1016/j.jacc.2022.10.004'},{text:'Rogers AM, et al. Circulation 2011;123:2213-2218'}]}
    >
      <div className="space-y-6">{cats.map((c,ci)=>(<div key={ci}><p className="text-xs font-bold text-tx mb-2">{c.title}</p><div className="space-y-1">{c.items.map(i=><CheckItem key={i.id} id={i.id} label={i.label} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></div>))}</div>
    </CalculatorLayout>
  )
}
