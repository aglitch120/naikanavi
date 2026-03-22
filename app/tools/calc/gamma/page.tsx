'use client'

import { useState, useMemo, useEffect } from 'react'
import UpdatedAt from '@/components/tools/UpdatedAt'
import Link from 'next/link'
import ErrorReportButton from '@/components/tools/ErrorReportButton'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'
import { trackToolUsage } from '@/components/pro/useProStatus'

// ── 薬剤データ ──
interface DrugDilution { label: string; drugMg: number; totalMl: number }
interface Drug {
  id: string; name: string; nameEn: string
  category: 'vasopressor' | 'inotrope' | 'sedative' | 'opioid' | 'antihypertensive'
  unit: string; weightBased: boolean
  gammaMin: number; gammaMax: number; gammaUnit: string
  unitLabel: string // U or mg for vasopressin
  dilutions: DrugDilution[]; notes: string
}

const DRUGS: Drug[] = [
  // 昇圧剤
  { id:'ne', name:'ノルアドレナリン', nameEn:'Norepinephrine', category:'vasopressor',
    unit:'μg/kg/min', weightBased:true, gammaMin:0.01, gammaMax:0.5, gammaUnit:'μg/kg/min', unitLabel:'mg',
    dilutions:[{label:'3mg/50mL 生食',drugMg:3,totalMl:50},{label:'5mg/50mL 生食',drugMg:5,totalMl:50},{label:'5mg/100mL 生食',drugMg:5,totalMl:100}],
    notes:'SSCGで敗血症性ショック第一選択。MAP≧65目標。通常0.05-0.3μg/kg/min。末梢ルートでも短時間は可。'},
  { id:'vasopressin', name:'バソプレシン', nameEn:'Vasopressin', category:'vasopressor',
    unit:'U/min', weightBased:false, gammaMin:0.01, gammaMax:0.04, gammaUnit:'U/min', unitLabel:'U',
    dilutions:[{label:'20U/100mL 生食',drugMg:20,totalMl:100},{label:'40U/100mL 生食',drugMg:40,totalMl:100}],
    notes:'NE併用で0.03-0.04 U/min固定。用量調節しない。腸管虚血に注意。'},
  { id:'adrenaline', name:'アドレナリン', nameEn:'Epinephrine', category:'vasopressor',
    unit:'μg/kg/min', weightBased:true, gammaMin:0.01, gammaMax:0.5, gammaUnit:'μg/kg/min', unitLabel:'mg',
    dilutions:[{label:'3mg/50mL 生食',drugMg:3,totalMl:50},{label:'5mg/50mL 生食',drugMg:5,totalMl:50}],
    notes:'アナフィラキシー・心停止・NE不応性ショック。β刺激による頻脈・乳酸上昇に注意。'},
  { id:'dopamine', name:'ドパミン', nameEn:'Dopamine', category:'vasopressor',
    unit:'μg/kg/min', weightBased:true, gammaMin:1, gammaMax:20, gammaUnit:'μg/kg/min', unitLabel:'mg',
    dilutions:[{label:'200mg/200mL（原液）',drugMg:200,totalMl:200},{label:'600mg/50mL 生食',drugMg:600,totalMl:50}],
    notes:'低用量(1-3):腎血流↑、中用量(3-10):心拍出↑、高用量(10-20):血管収縮。renal doseの有効性は否定的。'},
  { id:'phenylephrine', name:'フェニレフリン', nameEn:'Phenylephrine', category:'vasopressor',
    unit:'μg/kg/min', weightBased:true, gammaMin:0.1, gammaMax:5, gammaUnit:'μg/kg/min', unitLabel:'mg',
    dilutions:[{label:'5mg/50mL 生食',drugMg:5,totalMl:50}],
    notes:'α1純粋作動薬。SVTで頻脈を悪化させたくない場合。後負荷↑で心拍出量↓のリスク。'},
  // 強心薬
  { id:'dobutamine', name:'ドブタミン', nameEn:'Dobutamine', category:'inotrope',
    unit:'μg/kg/min', weightBased:true, gammaMin:1, gammaMax:20, gammaUnit:'μg/kg/min', unitLabel:'mg',
    dilutions:[{label:'250mg/50mL 生食',drugMg:250,totalMl:50},{label:'250mg/250mL（原液）',drugMg:250,totalMl:250}],
    notes:'心原性ショック第一選択（EF低下時）。通常2-10μg/kg/min。血管拡張で血圧低下に注意。'},
  { id:'milrinone', name:'ミルリノン', nameEn:'Milrinone', category:'inotrope',
    unit:'μg/kg/min', weightBased:true, gammaMin:0.125, gammaMax:0.75, gammaUnit:'μg/kg/min', unitLabel:'mg',
    dilutions:[{label:'10mg/50mL 生食',drugMg:10,totalMl:50}],
    notes:'PDE3阻害。右心不全・肺高血圧に有効。血管拡張で低血圧。腎排泄→腎障害時減量。'},
  // 鎮静剤
  { id:'propofol', name:'プロポフォール', nameEn:'Propofol', category:'sedative',
    unit:'mg/kg/h', weightBased:true, gammaMin:0.3, gammaMax:4, gammaUnit:'mg/kg/h', unitLabel:'mg',
    dilutions:[{label:'1%（10mg/mL）50mL',drugMg:500,totalMl:50},{label:'2%（20mg/mL）50mL',drugMg:1000,totalMl:50}],
    notes:'ICU鎮静の標準。RASS 0〜-2目標。PRIS注意：4mg/kg/h超 or 48h超で乳酸↑・CK↑。'},
  { id:'midazolam', name:'ミダゾラム', nameEn:'Midazolam', category:'sedative',
    unit:'mg/kg/h', weightBased:true, gammaMin:0.02, gammaMax:0.2, gammaUnit:'mg/kg/h', unitLabel:'mg',
    dilutions:[{label:'50mg/50mL 生食',drugMg:50,totalMl:50},{label:'100mg/50mL 生食',drugMg:100,totalMl:50}],
    notes:'BZD系。蓄積しやすい（特に肝・腎障害・高齢者）。せん妄リスク↑→プロポフォール or DEXが一般的。'},
  { id:'dex', name:'デクスメデトミジン', nameEn:'Dexmedetomidine', category:'sedative',
    unit:'μg/kg/h', weightBased:true, gammaMin:0.2, gammaMax:0.7, gammaUnit:'μg/kg/h', unitLabel:'mg',
    dilutions:[{label:'200μg/50mL 生食',drugMg:0.2,totalMl:50},{label:'400μg/100mL 生食',drugMg:0.4,totalMl:100}],
    notes:'α2作動薬。せん妄予防効果。呼吸抑制少ない。徐脈・低血圧に注意。深い鎮静には不向き。'},
  // 麻薬
  { id:'fentanyl', name:'フェンタニル', nameEn:'Fentanyl', category:'opioid',
    unit:'μg/kg/h', weightBased:true, gammaMin:0.5, gammaMax:3, gammaUnit:'μg/kg/h', unitLabel:'mg',
    dilutions:[{label:'500μg/50mL 生食',drugMg:0.5,totalMl:50},{label:'1000μg/50mL 生食',drugMg:1,totalMl:50}],
    notes:'ICU鎮痛の標準。血行動態への影響少ない。蓄積あり（肝代謝）。腎障害でも使用可。'},
  { id:'remifentanil', name:'レミフェンタニル', nameEn:'Remifentanil', category:'opioid',
    unit:'μg/kg/min', weightBased:true, gammaMin:0.05, gammaMax:0.3, gammaUnit:'μg/kg/min', unitLabel:'mg',
    dilutions:[{label:'2mg/40mL 生食',drugMg:2,totalMl:40},{label:'5mg/50mL 生食',drugMg:5,totalMl:50}],
    notes:'超短時間作用。エステラーゼ代謝で蓄積なし。中止後すぐ覚醒。抜管前に他オピオイドへ切替が必要。'},
  // 降圧剤
  { id:'nicardipine', name:'ニカルジピン', nameEn:'Nicardipine', category:'antihypertensive',
    unit:'μg/kg/min', weightBased:true, gammaMin:0.5, gammaMax:6, gammaUnit:'μg/kg/min', unitLabel:'mg',
    dilutions:[{label:'10mg/50mL 生食',drugMg:10,totalMl:50},{label:'25mg/50mL 生食',drugMg:25,totalMl:50}],
    notes:'Ca拮抗薬。高血圧緊急症の第一選択。脳出血・大動脈解離に。5分毎に0.5-1μg/kg/min増量。'},
  { id:'nitroglycerin', name:'ニトログリセリン', nameEn:'Nitroglycerin', category:'antihypertensive',
    unit:'μg/min', weightBased:false, gammaMin:5, gammaMax:200, gammaUnit:'μg/min', unitLabel:'mg',
    dilutions:[{label:'25mg/50mL 生食',drugMg:25,totalMl:50},{label:'50mg/100mL 生食',drugMg:50,totalMl:100}],
    notes:'静脈拡張→前負荷↓。急性心不全・ACS・高血圧緊急症。高用量で動脈も拡張。頭痛・メトHb症に注意。'},
  { id:'nitroprusside', name:'ニトロプルシド', nameEn:'Nitroprusside', category:'antihypertensive',
    unit:'μg/kg/min', weightBased:true, gammaMin:0.3, gammaMax:5, gammaUnit:'μg/kg/min', unitLabel:'mg',
    dilutions:[{label:'50mg/250mL 5%Glu',drugMg:50,totalMl:250}],
    notes:'動脈＋静脈拡張。大動脈解離（β遮断薬と併用）。遮光必須。シアン中毒リスク（48h以上・腎障害で↑）。'},
]

const CATEGORIES = [
  { id:'vasopressor', label:'昇圧剤', icon:'💉' },
  { id:'inotrope', label:'強心薬', icon:'🫀' },
  { id:'sedative', label:'鎮静剤', icon:'😴' },
  { id:'opioid', label:'麻薬', icon:'💊' },
  { id:'antihypertensive', label:'降圧剤', icon:'🩸' },
  { id:'custom', label:'その他薬剤', icon:'✏️' },
] as const

const UNIT_OPTIONS = [
  { value:'μg/kg/min', label:'μg/kg/min', weightBased:true },
  { value:'μg/kg/h', label:'μg/kg/h', weightBased:true },
  { value:'mg/kg/h', label:'mg/kg/h', weightBased:true },
  { value:'μg/min', label:'μg/min', weightBased:false },
  { value:'U/min', label:'U/min', weightBased:false },
  { value:'mg/h', label:'mg/h（体重非依存）', weightBased:false },
] as const

function calcRate(d:Drug,gamma:number,w:number,conc:number):number{
  if(!conc)return 0
  if(d.unit==='μg/kg/min')return(gamma*w*60)/(conc*1000)
  if(d.unit==='μg/kg/h')return(gamma*w)/(conc*1000)
  if(d.unit==='mg/kg/h')return(gamma*w)/conc
  if(d.unit==='μg/min')return(gamma*60)/(conc*1000)
  if(d.unit==='U/min')return(gamma*60)/conc
  if(d.unit==='mg/h')return gamma/conc
  return 0
}
function calcGamma(d:Drug,rate:number,w:number,conc:number):number{
  if(!w&&d.weightBased)return 0
  if(!conc)return 0
  if(d.unit==='μg/kg/min')return(rate*conc*1000)/(w*60)
  if(d.unit==='μg/kg/h')return(rate*conc*1000)/w
  if(d.unit==='mg/kg/h')return(rate*conc)/w
  if(d.unit==='μg/min')return(rate*conc*1000)/60
  if(d.unit==='U/min')return(rate*conc)/60
  if(d.unit==='mg/h')return rate*conc
  return 0
}

export default function GammaCalcPage(){
  useEffect(()=>{trackToolUsage('icu-gamma-calc')},[])
  const[selectedCat,setSelectedCat]=useState<string>('vasopressor')
  const[selectedDrugId,setSelectedDrugId]=useState<string>('ne')
  const[weight,setWeight]=useState('60')
  const[usePreset,setUsePreset]=useState(true)
  const[presetIdx,setPresetIdx]=useState(0)
  const[customDrugMg,setCustomDrugMg]=useState('')
  const[customTotalMl,setCustomTotalMl]=useState('')
  const[gammaInput,setGammaInput]=useState('')
  const[rateInput,setRateInput]=useState('')
  const[calcMode,setCalcMode]=useState<'g2r'|'r2g'>('g2r')
  // カスタム薬剤
  const[customName,setCustomName]=useState('')
  const[customUnit,setCustomUnit]=useState('μg/kg/min')
  const isCustom=selectedCat==='custom'

  const customDrug=useMemo<Drug>(()=>{
    const unitOpt=UNIT_OPTIONS.find(u=>u.value===customUnit)
    return {
      id:'__custom__', name:customName||'カスタム薬剤', nameEn:'Custom',
      category:'vasopressor', unit:customUnit, weightBased:unitOpt?.weightBased??true,
      gammaMin:0, gammaMax:0, gammaUnit:customUnit, unitLabel:'mg',
      dilutions:[], notes:'ユーザー定義の薬剤です。'
    }
  },[customName,customUnit])

  const drug=useMemo(()=>isCustom?customDrug:DRUGS.find(d=>d.id===selectedDrugId)!,[isCustom,customDrug,selectedDrugId])
  const catDrugs=useMemo(()=>DRUGS.filter(d=>d.category===selectedCat),[selectedCat])

  const conc=useMemo(()=>{
    if(!isCustom&&usePreset&&drug.dilutions[presetIdx]){const d=drug.dilutions[presetIdx];return d.drugMg/d.totalMl}
    const dm=parseFloat(customDrugMg),tm=parseFloat(customTotalMl)
    return(dm>0&&tm>0)?dm/tm:0
  },[isCustom,usePreset,presetIdx,customDrugMg,customTotalMl,drug])

  const w=parseFloat(weight)||0

  const result=useMemo(()=>{
    if(calcMode==='g2r'){
      const g=parseFloat(gammaInput)
      if(!g||!conc||(drug.weightBased&&!w))return null
      return{gamma:g,rate:calcRate(drug,g,w,conc),type:'g2r' as const}
    }else{
      const r=parseFloat(rateInput)
      if(!r||!conc||(drug.weightBased&&!w))return null
      return{gamma:calcGamma(drug,r,w,conc),rate:r,type:'r2g' as const}
    }
  },[calcMode,gammaInput,rateInput,w,conc,drug])

  const rangeRates=useMemo(()=>{
    if((drug.weightBased&&!w)||!conc)return null
    return{min:calcRate(drug,drug.gammaMin,w,conc),max:calcRate(drug,drug.gammaMax,w,conc)}
  },[drug,w,conc])

  const handleCat=(catId:string)=>{setSelectedCat(catId);if(catId==='custom'){setUsePreset(false);setGammaInput('');setRateInput('')}else{const f=DRUGS.find(d=>d.category===catId);if(f){setSelectedDrugId(f.id);setPresetIdx(0);setGammaInput('');setRateInput('')}}}
  const handleDrug=(id:string)=>{setSelectedDrugId(id);setPresetIdx(0);setUsePreset(true);setGammaInput('');setRateInput('')}

  return(
    <div className="max-w-3xl mx-auto">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <span>γ計算</span>
      </nav>

      <header className="mb-6"><div className="flex items-start justify-between gap-3"><div>
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">💉 ICU</span>
        <h1 className="text-2xl font-bold text-tx mb-1">ICU薬剤 γ計算</h1>
        <p className="text-sm text-muted">昇圧剤・強心薬・鎮静剤・麻薬・降圧剤 + その他薬剤のγ⇔mL/h変換。</p>
      </div><ProPulseHint><FavoriteButton slug="icu-gamma-calc" title="γ計算（昇圧薬・鎮静薬）" href="/tools/icu/gamma" type="icu" /></ProPulseHint></div></header>
      <UpdatedAt />

      {/* カテゴリ */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
        {CATEGORIES.map(c=>(
          <button key={c.id} onClick={()=>handleCat(c.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${selectedCat===c.id?'bg-ac text-white border-ac':'bg-s0 text-muted border-br hover:border-ac/30'}`}>
            <span>{c.icon}</span>{c.label}
          </button>
        ))}
      </div>

      {/* 薬剤 */}
      {isCustom?(
        <div className="bg-s0 border border-br rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-tx mb-3">✏️ 自由入力 — 任意の薬剤でγ⇔mL/h変換</p>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-muted mb-1 block">薬剤名（任意）</label>
              <input type="text" value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="例: オクトレオチド"
                className="w-full h-10 px-3 text-sm bg-bg border border-br rounded-lg focus:border-ac outline-none"/>
            </div>
            <div>
              <label className="text-[10px] text-muted mb-1 block">投与単位</label>
              <select value={customUnit} onChange={e=>setCustomUnit(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-bg border border-br rounded-lg focus:border-ac outline-none">
                {UNIT_OPTIONS.map(u=><option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      ):(
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6">
          {catDrugs.map(d=>(
            <button key={d.id} onClick={()=>handleDrug(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${selectedDrugId===d.id?'border-ac bg-acl text-ac':'border-br bg-s0 text-muted hover:text-tx'}`}>
              {d.name}
            </button>
          ))}
        </div>
      )}

      {/* 体重 */}
      {drug.weightBased&&(
        <div className="bg-s0 border border-br rounded-xl p-4 mb-4">
          <label className="text-xs font-bold text-tx mb-2 block">体重 (kg)</label>
          <input type="number" inputMode="decimal" value={weight} onChange={e=>setWeight(e.target.value)}
            className="w-full h-11 px-4 text-base font-mono bg-bg border-2 border-br rounded-xl text-center focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none"/>
        </div>
      )}

      {/* 希釈 */}
      <div className="bg-s0 border border-br rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-tx">希釈濃度</label>
          {!isCustom&&(
            <div className="flex gap-1">
              <button onClick={()=>setUsePreset(true)} className={`text-[10px] px-2.5 py-1 rounded-lg border ${usePreset?'bg-ac text-white border-ac':'bg-bg text-muted border-br'}`}>プリセット</button>
              <button onClick={()=>setUsePreset(false)} className={`text-[10px] px-2.5 py-1 rounded-lg border ${!usePreset?'bg-ac text-white border-ac':'bg-bg text-muted border-br'}`}>手動入力</button>
            </div>
          )}
        </div>
        {!isCustom&&usePreset?(
          <div className="grid gap-2">
            {drug.dilutions.map((d,i)=>(
              <button key={i} onClick={()=>setPresetIdx(i)}
                className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${presetIdx===i?'border-ac bg-acl':'border-br hover:border-ac/30'}`}>
                <span className="font-bold text-tx">{d.label}</span>
                <span className="text-xs text-muted ml-2">({(d.drugMg/d.totalMl).toFixed(3)} {drug.unitLabel}/mL)</span>
              </button>
            ))}
          </div>
        ):(
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted mb-1 block">薬剤量 ({drug.unitLabel})</label>
              <input type="number" inputMode="decimal" value={customDrugMg} onChange={e=>setCustomDrugMg(e.target.value)}
                className="w-full h-10 px-3 text-sm font-mono bg-bg border border-br rounded-lg focus:border-ac outline-none"/>
            </div>
            <div>
              <label className="text-[10px] text-muted mb-1 block">希釈総量 (mL)</label>
              <input type="number" inputMode="decimal" value={customTotalMl} onChange={e=>setCustomTotalMl(e.target.value)}
                className="w-full h-10 px-3 text-sm font-mono bg-bg border border-br rounded-lg focus:border-ac outline-none"/>
            </div>
          </div>
        )}
        {conc>0&&<p className="text-xs text-ac font-medium mt-2">濃度: {conc>=0.01?conc.toFixed(3):conc.toFixed(4)} {drug.unitLabel}/mL</p>}
      </div>

      {/* γ範囲（プリセット薬剤のみ） */}
      {!isCustom&&(
      <div className="bg-acl border border-ac/20 rounded-xl p-4 mb-4">
        <p className="text-xs font-bold text-ac mb-1">{drug.name} — 参考γ範囲</p>
        <p className="text-lg font-bold text-tx">{drug.gammaMin} ～ {drug.gammaMax} <span className="text-sm font-normal text-muted">{drug.gammaUnit}</span></p>
        {rangeRates&&<p className="text-xs text-muted mt-1">→ {rangeRates.min.toFixed(1)} ～ {rangeRates.max.toFixed(1)} mL/h{drug.weightBased?`（体重${weight}kg時）`:''}</p>}
      </div>
      )}

      {/* 計算 */}
      <div className="bg-s0 border border-br rounded-xl p-4 mb-4">
        <div className="flex border border-br rounded-xl overflow-hidden mb-4">
          <button onClick={()=>setCalcMode('g2r')} className={`flex-1 py-2.5 text-xs font-medium transition-colors ${calcMode==='g2r'?'bg-ac text-white':'bg-s1 text-muted hover:text-tx'}`}>γ → mL/h</button>
          <button onClick={()=>setCalcMode('r2g')} className={`flex-1 py-2.5 text-xs font-medium transition-colors ${calcMode==='r2g'?'bg-ac text-white':'bg-s1 text-muted hover:text-tx'}`}>mL/h → γ</button>
        </div>
        {calcMode==='g2r'?(
          <div>
            <label className="text-xs font-medium text-tx mb-1 block">γ値 ({drug.gammaUnit})</label>
            <input type="number" inputMode="decimal" value={gammaInput} onChange={e=>setGammaInput(e.target.value)}
              placeholder={isCustom?'γ値を入力':`例: ${((drug.gammaMin+drug.gammaMax)/2).toFixed(2)}`}
              className="w-full h-12 px-4 text-lg font-mono bg-bg border-2 border-br rounded-xl text-center focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none"/>
          </div>
        ):(
          <div>
            <label className="text-xs font-medium text-tx mb-1 block">投与速度 (mL/h)</label>
            <input type="number" inputMode="decimal" value={rateInput} onChange={e=>setRateInput(e.target.value)} placeholder="例: 5"
              className="w-full h-12 px-4 text-lg font-mono bg-bg border-2 border-br rounded-xl text-center focus:border-ac focus:ring-1 focus:ring-ac/30 outline-none"/>
          </div>
        )}
        {result&&(
          <div className="mt-4 p-4 rounded-xl bg-acl border border-ac/20 text-center">
            {result.type==='g2r'?(
              <><p className="text-xs text-muted mb-1">{drug.gammaUnit} = {result.gamma}</p>
              <p className="text-3xl font-bold text-ac">{result.rate.toFixed(1)} <span className="text-base font-normal">mL/h</span></p>
              <p className="text-xs text-muted mt-1">= {(result.rate/60*20).toFixed(1)} 滴/分（20滴/mL時）</p></>
            ):(
              <><p className="text-xs text-muted mb-1">{result.rate} mL/h</p>
              <p className="text-3xl font-bold text-ac">{result.gamma.toFixed(3)} <span className="text-base font-normal">{drug.gammaUnit}</span></p>
              {!isCustom&&result.gamma<drug.gammaMin&&<p className="text-xs text-wn font-medium mt-1">⚠️ 参考範囲未満</p>}
              {!isCustom&&result.gamma>drug.gammaMax&&<p className="text-xs text-dn font-medium mt-1">⚠️ 参考範囲超過</p>}</>
            )}
          </div>
        )}
      </div>

      {/* メモ */}
      {!isCustom&&(
      <div className="bg-s0 border border-br rounded-xl p-4 mb-6">
        <p className="text-xs font-bold text-tx mb-1">📝 {drug.name}（{drug.nameEn}）</p>
        <p className="text-xs text-muted leading-relaxed">{drug.notes}</p>
      </div>
      )}

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn">
        <p className="font-semibold mb-1">⚠️ 医療上の免責事項</p>
        <p>本ツールは計算の補助です。薬剤の選択・用量は患者の状態に基づき担当医が決定してください。添付文書の最新版を確認してください。</p>
        <div className="mt-2 pt-2 border-t border-wnb/30"><ErrorReportButton toolName="γ計算" /></div>
      </div>

      <section className="mb-8">
        <div className="bg-s1 rounded-xl border border-br p-4">
          <p className="text-xs font-bold text-tx mb-2">参考</p>
          <ul className="text-xs text-muted space-y-1">
            <li>• 各薬剤の添付文書（PMDA）</li>
            <li>• Surviving Sepsis Campaign Guidelines 2021</li>
            <li>• PADIS Guidelines (Critical Care Medicine 2018)</li>
            <li>• 日本集中治療医学会 各種ガイドライン</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
