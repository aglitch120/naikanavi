'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'

export default function SuitaScorePage() {
  const [age, setAge] = useState('55')
  const [sex, setSex] = useState<'male'|'female'>('male')
  const [sbp, setSbp] = useState('140')
  const [dm, setDm] = useState(false)
  const [smoker, setSmoker] = useState(false)
  const [totalChol, setTotalChol] = useState('220')
  const [hdl, setHdl] = useState('50')
  const [ldl, setLdl] = useState('140')

  const result = useMemo(() => {
    const a = parseInt(age), s = parseInt(sbp), tc = parseFloat(totalChol), h = parseFloat(hdl), l = parseFloat(ldl)
    if (!a || !s || !tc || !h) return null
    // 吹田スコア簡易版（ポイント加算方式）
    let pts = 0
    // 年齢
    if (a >= 65) pts += 14; else if (a >= 55) pts += 9; else if (a >= 45) pts += 4
    // 収縮期血圧
    if (s >= 180) pts += 7; else if (s >= 160) pts += 5; else if (s >= 140) pts += 3; else if (s >= 120) pts += 1
    // 糖尿病
    if (dm) pts += 6
    // 喫煙
    if (smoker) pts += 4
    // LDL
    if (l >= 180) pts += 5; else if (l >= 160) pts += 4; else if (l >= 140) pts += 3; else if (l >= 120) pts += 2
    // HDL
    if (h < 40) pts += 3; else if (h < 50) pts += 2; else if (h < 60) pts += 1
    // 性別
    if (sex === 'male') pts += 3

    let risk = ''
    let severity: 'ok'|'wn'|'dn' = 'ok'
    if (pts >= 16) { risk = '高リスク'; severity = 'dn' }
    else if (pts >= 12) { risk = '中リスク'; severity = 'wn' }
    else { risk = '低リスク'; severity = 'ok' }

    return { pts, risk, severity }
  }, [age, sex, sbp, dm, smoker, totalChol, hdl, ldl])

  return (
    <CalculatorLayout slug="suita-score" title="吹田スコア" titleEn="Suita Score"
      description="日本人向け冠動脈疾患10年リスク評価。国立循環器病研究センター吹田研究に基づく簡易版（正確な評価にはガイドラインのリスクチャートを使用してください）。" category="cardiology" categoryIcon="&#10084;&#65039;"
      result={result && <ResultCard label="吹田スコア（簡易版）" value={`${result.pts}点`} severity={result.severity}
        interpretation="※簡易推算版です。正確な吹田スコアは動脈硬化性疾患予防ガイドラインのリスクチャートを参照してください。"
        details={[{label:'リスク区分',value:result.risk},{label:'注意',value:'原著はTC(総コレステロール)ベース。本ツールはLDL-C代替の簡易版'},{label:'⚠️ 非公式版',value:'本ツールは原著（TC基準）をLDL-C代替に簡易化した非公式版です。正式なリスク評価には動脈硬化性疾患予防ガイドライン2022のリスクチャートを使用してください'}]} />}
      references={[{text:'Nishimura K, et al. Predicting coronary heart disease using risk factor categories for a Japanese urban population. J Atheroscler Thromb 2014;21:784-98', url:'https://pubmed.ncbi.nlm.nih.gov/24671110/'}]}>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="年齢" value={age} onChange={setAge} unit="歳" />
        <div><label className="block text-sm font-medium text-tx mb-1">性別</label><div className="flex gap-2">{(['male','female'] as const).map(s=><button key={s} onClick={()=>setSex(s)} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${sex===s?'bg-acl border-ac/30 text-ac':'border-br text-muted'}`}>{s==='male'?'男性':'女性'}</button>)}</div></div>
      </div>
      <NumberInput label="収縮期血圧" value={sbp} onChange={setSbp} unit="mmHg" />
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="LDL-C" value={ldl} onChange={setLdl} unit="mg/dL" />
        <NumberInput label="HDL-C" value={hdl} onChange={setHdl} unit="mg/dL" />
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={dm} onChange={e=>setDm(e.target.checked)} className="rounded border-br" /><span className="text-tx">糖尿病あり</span></label>
        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={smoker} onChange={e=>setSmoker(e.target.checked)} className="rounded border-br" /><span className="text-tx">現在喫煙</span></label>
      </div>
    </CalculatorLayout>
  )
}
