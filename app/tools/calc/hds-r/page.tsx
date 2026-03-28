'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('hds-r')!
const items=[
  {id:'age',label:'1. 年齢（2年までの誤差は正解）',max:1,options:[{label:'不正解',value:'0'},{label:'正解',value:'1'}]},
  {id:'date',label:'2. 今日の日付（年月日曜日、各1点）',max:4,options:[{label:'0点',value:'0'},{label:'1点',value:'1'},{label:'2点',value:'2'},{label:'3点',value:'3'},{label:'4点',value:'4'}]},
  {id:'place',label:'3. 今いる場所（自発2点、5秒後ヒントで正解1点）',max:2,options:[{label:'0点',value:'0'},{label:'1点',value:'1'},{label:'2点',value:'2'}]},
  {id:'words',label:'4. 3つの言葉の復唱',max:3,options:[{label:'0点',value:'0'},{label:'1点',value:'1'},{label:'2点',value:'2'},{label:'3点',value:'3'}]},
  {id:'calc',label:'5. 100-7を2回（93→86、各1点）',max:2,options:[{label:'0点',value:'0'},{label:'1点',value:'1'},{label:'2点',value:'2'}]},
  {id:'digits',label:'6. 数字の逆唱（6-8-2→2-8-6、3-5-2-9→9-2-5-3）',max:2,options:[{label:'0点',value:'0'},{label:'1点',value:'1'},{label:'2点',value:'2'}]},
  {id:'recall',label:'7. 3つの言葉の遅延再生（自発2点/ヒント1点、各）',max:6,options:[{label:'0点',value:'0'},{label:'1点',value:'1'},{label:'2点',value:'2'},{label:'3点',value:'3'},{label:'4点',value:'4'},{label:'5点',value:'5'},{label:'6点',value:'6'}]},
  {id:'objects',label:'8. 5つの物品記銘（提示→隠す→回答、各1点）',max:5,options:[{label:'0点',value:'0'},{label:'1点',value:'1'},{label:'2点',value:'2'},{label:'3点',value:'3'},{label:'4点',value:'4'},{label:'5点',value:'5'}]},
  {id:'verbal',label:'9. 野菜の名前（60秒間、0-4個=0点、5個=1点、6個=2点、7個=3点、8個=4点、9個以上=5点）',max:5,options:[{label:'0点（0-4個）',value:'0'},{label:'1点（5個）',value:'1'},{label:'2点（6個）',value:'2'},{label:'3点（7個）',value:'3'},{label:'4点（8個）',value:'4'},{label:'5点（9個以上）',value:'5'}]},
]
export default function HDSRPage(){
  const [vals,setVals]=useState<Record<string,string>>(Object.fromEntries(items.map(i=>[i.id,'0'])))
  const result=useMemo(()=>{
    const score=Object.values(vals).reduce((s,v)=>s+Number(v),0)
    if(score>=21) return {score,severity:'ok' as const,label:'正常域（21-30点）'}
    return {score,severity:'wn' as const,label:'認知症の疑い（≦20点）— 専門医による詳細評価を推奨'}
  },[vals])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="HDS-R" value={result.score} unit="/30点" interpretation={result.label} severity={result.severity} />}
      explanation={undefined}
      relatedTools={[]} references={[{text:'加藤伸司ら. 改訂長谷川式簡易知能評価スケール(HDS-R)の作成. 老年精神医学雑誌 1991;2:1339-1347'}]}
    ><div className="space-y-4">{items.map(i=><RadioGroup key={i.id} id={i.id} label={i.label} options={i.options} value={vals[i.id]} onChange={v=>setVals(p=>({...p,[i.id]:v}))} />)}</div></CalculatorLayout>
  )
}
