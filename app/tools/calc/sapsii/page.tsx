'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('sapsii')!
const chronicItems = [
  {id:'metastatic',label:'転移性悪性腫瘍',points:9},{id:'heme',label:'血液悪性腫瘍',points:10},{id:'aids',label:'AIDS',points:17},
]
const admissionType = [{label:'予定手術',value:'0'},{label:'内科',value:'6'},{label:'緊急手術',value:'8'}]
export default function SAPSIIPage(){
  const [age,setAge]=useState('65')
  const [hr,setHR]=useState('80')
  const [sbp,setSBP]=useState('120')
  const [temp,setTemp]=useState('37')
  const [pao2,setPaO2]=useState('200')
  const [uo,setUO]=useState('1000')
  const [bun,setBUN]=useState('15')
  const [wbc,setWBC]=useState('8')
  const [k,setK]=useState('4')
  const [na,setNa]=useState('140')
  const [hco3,setHCO3]=useState('24')
  const [bili,setBili]=useState('0.8')
  const [gcsVal,setGCS]=useState('15')
  const [admType,setAdmType]=useState('6')
  const [checks,setChecks]=useState<Record<string,boolean>>(Object.fromEntries(chronicItems.map(i=>[i.id,false])))
  const result=useMemo(()=>{
    // Simplified SAPS II scoring
    const a=Number(age)||0;const ageP=a<40?0:a<60?7:a<70?12:a<75?15:a<80?16:18
    const h=Number(hr)||80;const hrP=h<40?11:h<70?2:h<120?0:h<160?4:7
    const s=Number(sbp)||120;const sbpP=s<70?13:s<100?5:s<200?0:2
    const t=Number(temp)||37;const tempP=t>=39?3:0
    const p=Number(pao2)||200;const pao2P=p<100?11:p<200?9:6
    const u=Number(uo)||1000;const uoP=u<500?11:u<1000?4:0
    const b=Number(bun)||15;const bunP=b<28?0:b<84?6:10
    const w=Number(wbc)||8;const wbcP=w<1?12:w>=20?3:0
    const kv=Number(k)||4;const kP=kv<3?3:kv>=5?3:0
    const n=Number(na)||140;const naP=n<125?5:n>=145?1:0
    const hc=Number(hco3)||24;const hco3P=hc<15?6:hc<20?3:0
    const bl=Number(bili)||0.8;const biliP=bl<4?0:bl<6?4:9
    const g=Number(gcsVal)||15;const gcsP=g<6?26:g<9?13:g<11?7:g<14?5:0
    const admP=Number(admType)
    const chronicP=chronicItems.filter(i=>checks[i.id]).reduce((s,i)=>s+i.points,0)
    const score=ageP+hrP+sbpP+tempP+pao2P+uoP+bunP+wbcP+kP+naP+hco3P+biliP+gcsP+admP+chronicP
    const mortality=Math.round(100*Math.exp(-7.7631+0.0737*score+0.9971*Math.log(score+1))/(1+Math.exp(-7.7631+0.0737*score+0.9971*Math.log(score+1))))
    const sev=score<=29?'ok' as const:score<=40?'wn' as const:'dn' as const
    return {score,mortality,severity:sev,label:`推定院内死亡率: 約${mortality}%`}
  },[age,hr,sbp,temp,pao2,uo,bun,wbc,k,na,hco3,bili,gcsVal,admType,checks])
  return(
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="SAPS II" value={result.score} unit="点" interpretation={result.label} severity={result.severity} />}
      explanation={<section className="space-y-4 text-sm text-muted"><h2 className="text-base font-bold text-tx">SAPS IIとは</h2><p>Simplified Acute Physiology Score II。ICU入室後24時間以内の最悪値を使用。17項目で院内死亡率を予測。APACHE IIに比べ項目数が少なく算出しやすい。</p></section>}
      relatedTools={[]} references={[{text:'Le Gall JR et al. A new Simplified Acute Physiology Score (SAPS II) based on a European/North American multicenter study. JAMA 1993;270:2957-2963'}]}
    >
      <div className="space-y-3">
        <NumberInput id="age" label="年齢" value={age} onChange={setAge} unit="歳" />
        <NumberInput id="hr" label="心拍数" value={hr} onChange={setHR} unit="bpm" />
        <NumberInput id="sbp" label="収縮期血圧" value={sbp} onChange={setSBP} unit="mmHg" />
        <NumberInput id="temp" label="体温" value={temp} onChange={setTemp} unit="°C" />
        <NumberInput id="gcs" label="GCS" value={gcsVal} onChange={setGCS} unit="/15" />
        <NumberInput id="pao2" label="PaO₂/FiO₂ 比" value={pao2} onChange={setPaO2} unit="" />
        <NumberInput id="uo" label="尿量(24h)" value={uo} onChange={setUO} unit="mL/日" />
        <NumberInput id="bun" label="BUN" value={bun} onChange={setBUN} unit="mg/dL" />
        <NumberInput id="wbc" label="WBC" value={wbc} onChange={setWBC} unit="×10³/μL" />
        <NumberInput id="k" label="K" value={k} onChange={setK} unit="mEq/L" />
        <NumberInput id="na" label="Na" value={na} onChange={setNa} unit="mEq/L" />
        <NumberInput id="hco3" label="HCO₃⁻" value={hco3} onChange={setHCO3} unit="mEq/L" />
        <NumberInput id="bili" label="ビリルビン" value={bili} onChange={setBili} unit="mg/dL" />
        <RadioGroup id="adm" label="入室経路" options={admissionType} value={admType} onChange={setAdmType} />
        <div><p className="text-xs font-bold text-tx mb-2">慢性疾患</p><div className="space-y-1">{chronicItems.map(i=><CheckItem key={i.id} id={i.id} label={`${i.label} (+${i.points})`} checked={checks[i.id]} onChange={v=>setChecks(p=>({...p,[i.id]:v}))} />)}</div></div>
      </div>
    </CalculatorLayout>
  )
}
