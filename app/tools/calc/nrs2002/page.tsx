'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('nrs2002')!
const nutrition=[
  {label:'正常 (0)',value:'0'},{label:'軽度: 3ヶ月で5%以上の体重減少 or 前週の食事摂取量が必要量の50-75% (1)',value:'1'},
  {label:'中等度: 2ヶ月で5%以上 or BMI 18.5-20.5 + 全身状態不良 or 前週の食事摂取量が25-50% (2)',value:'2'},
  {label:'重度: 1ヶ月で5%以上 or BMI<18.5 + 全身状態不良 or 前週の食事摂取量が0-25% (3)',value:'3'},
]
const disease=[
  {label:'なし (0)',value:'0'},{label:'軽度: 大腿骨骨折、慢性疾患（肝硬変、COPD、血液透析、糖尿病、一般がん）(1)',value:'1'},
  {label:'中等度: 大きな腹部手術、脳卒中、重症肺炎、血液悪性腫瘍 (2)',value:'2'},
  {label:'重度: 頭部外傷、骨髄移植、ICU患者(APACHE>10) (3)',value:'3'},
]
export default function NRS2002Page(){
  const [n,setN]=useState('0');const [d,setD]=useState('0');const [age70,setAge70]=useState(false)
  const result=useMemo(()=>{
    const score=Number(n)+Number(d)+(age70?1:0)
    return {score,severity:score>=3?'wn' as const:'ok' as const,label:score>=3?'栄養リスクあり（≧3）→ 栄養療法計画を開始':'栄養リスク低い（<3）→ 週1回再スクリーニング'}
  },[n,d,age70])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="NRS 2002" value={result.score} unit="/7点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">NRS 2002とは</h2><p>Nutritional Risk Screening 2002。入院患者の栄養リスクを評価。栄養状態(0-3)+疾患重症度(0-3)+年齢補正(70歳以上+1)=最大7点。≧3で栄養介入を検討。ESPENで示されるツール。</p></section>}
      relatedTools={[]} references={[{text:'Kondrup J et al. Nutritional risk screening (NRS 2002): a new method based on an analysis of controlled clinical trials. Clin Nutr 2003;22:321-336'}]}
    ><div className="space-y-4"><RadioGroup id="n" label="栄養状態の障害" options={nutrition} value={n} onChange={setN} /><RadioGroup id="d" label="疾患の重症度" options={disease} value={d} onChange={setD} /><CheckItem id="age70" label="70歳以上 (+1点)" checked={age70} onChange={setAge70} /></div></CalculatorLayout>
  )
}
