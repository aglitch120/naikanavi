'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('dic-comprehensive')!

// ====== 1. 急性期DIC診断基準（日本救急医学会 2005） ======
function AcuteDIC() {
  const [sirs, setSirs] = useState('0')
  const [plt, setPlt] = useState('0')
  const [pt, setPt] = useState('0')
  const [fdp, setFdp] = useState('0')
  const score = Number(sirs) + Number(plt) + Number(pt) + Number(fdp)
  const sev = score >= 4 ? 'dn' as const : 'ok' as const
  const label = score >= 4 ? `${score}点 — DIC（≧4点で診断）` : `${score}点 — DIC基準を満たさない`
  return (<div className="space-y-3">
    <RadioGroup name="ac-sirs" label="SIRS（項目数）" value={sirs} onChange={setSirs} options={[
      { value: '0', label: '0〜2項目（0点）' }, { value: '1', label: '≧3項目（1点）' }]} />
    <p className="text-[10px] text-muted px-1">SIRS: ①体温&gt;38℃ or &lt;36℃ ②HR&gt;90 ③RR&gt;20 or PaCO₂&lt;32 ④WBC&gt;12000 or &lt;4000 or bands&gt;10%</p>
    <RadioGroup name="ac-plt" label="血小板数" value={plt} onChange={setPlt} options={[
      { value: '0', label: '≧12万 or 24h内30%未満の減少（0点）' },
      { value: '1', label: '≧8万〜<12万 or 24h内30%以上の減少（1点）' },
      { value: '3', label: '<8万 or 24h内50%以上の減少（3点）' }]} />
    <RadioGroup name="ac-pt" label="PT比（秒数延長・%低下でも可）" value={pt} onChange={setPt} options={[
      { value: '0', label: '<1.2（0点）' }, { value: '1', label: '≧1.2（1点）' }]} />
    <RadioGroup name="ac-fdp" label="FDP (μg/mL)" value={fdp} onChange={setFdp} options={[
      { value: '0', label: '<10（0点）' }, { value: '1', label: '≧10〜<25（1点）' }, { value: '3', label: '≧25（3点）' }]} />
    <p className="text-[10px] text-muted px-1">※FDPの代替としてD-ダイマーを使用可。各施設の測定キットにより換算表を使用。</p>
    <ResultCard label="急性期DIC" value={`${score}/8点`} interpretation={label} severity={sev} />
  </div>)
}

// ====== 2. 日本血栓止血学会 DIC診断基準 2017 ======
function JSTH2017() {
  const [subtype, setSubtype] = useState('basic')
  const [plt, setPlt] = useState('0')
  const [pltDrop, setPltDrop] = useState(false)
  const [fdp, setFdp] = useState('0')
  const [fib, setFib] = useState('0')
  const [pt, setPt] = useState('0')
  const [at, setAt] = useState('0')
  const [tat, setTat] = useState('0')
  const [liver, setLiver] = useState('0')

  const result = useMemo(() => {
    let pltScore = Number(plt)
    // 血小板>5万では経時的低下条件を満たせば加点。≦5万では加点しない。最高3点。
    if (pltDrop && Number(plt) < 3) pltScore = Math.min(pltScore + 1, 3)
    const fdpScore = Number(fdp)
    const fibScore = (subtype === 'infection') ? 0 : Number(fib) // 感染型ではフィブリノゲンは評価しない
    const ptScore = Number(pt)
    const atScore = Number(at)
    const tatScore = Number(tat)
    const liverScore = Number(liver)
    const total = pltScore + fdpScore + fibScore + ptScore + atScore + tatScore + liverScore
    const cutoff = subtype === 'basic' ? 6 : subtype === 'hematologic' ? 4 : 5
    const subtypeName = subtype === 'basic' ? '基本型' : subtype === 'hematologic' ? '造血障害型' : '感染型'
    return {
      total,
      met: total >= cutoff,
      label: total >= cutoff ? `${total}点 — DIC（${subtypeName}: ≧${cutoff}点）` : `${total}点 — DIC基準を満たさない（${subtypeName}: ≧${cutoff}点で診断）`,
      severity: (total >= cutoff ? 'dn' : 'ok') as 'ok' | 'dn',
    }
  }, [subtype, plt, pltDrop, fdp, fib, pt, at, tat, liver])

  // 造血障害型では血小板・フィブリノゲンを評価しない
  const isHeme = subtype === 'hematologic'
  const isInfection = subtype === 'infection'

  return (<div className="space-y-3">
    <RadioGroup name="jsth-sub" label="病型（アルゴリズムで判定）" value={subtype} onChange={v => { setSubtype(v); setPlt('0'); setPltDrop(false) }} options={[
      { value: 'basic', label: '基本型（造血障害なし＋感染症なし）' },
      { value: 'hematologic', label: '造血障害型（骨髄抑制・骨髄不全等）' },
      { value: 'infection', label: '感染型（感染症あり＋造血障害なし）' }]} />
    <p className="text-[10px] text-muted px-1">産科・新生児領域は本基準適用外。基礎病態が特定できない/複数ある場合は基本型を使用。</p>

    {!isHeme && <RadioGroup name="jsth-plt" label="血小板数（万/μL）" value={plt} onChange={setPlt} options={[
      { value: '0', label: '>12万（0点）' }, { value: '1', label: '>8万〜≦12万（1点）' },
      { value: '2', label: '>5万〜≦8万（2点）' }, { value: '3', label: '≦5万（3点）' }]} />}
    {!isHeme && <CheckItem id="jsth-pltdrop" label="24時間以内に30%以上の血小板減少あり（+1点）" sublabel="血小板>5万の場合のみ加点。≦5万では加点しない。最高3点。" checked={pltDrop} onChange={setPltDrop} />}

    <RadioGroup name="jsth-fdp" label="FDP (μg/mL)" value={fdp} onChange={setFdp} options={[
      { value: '0', label: '<10（0点）' }, { value: '1', label: '≧10〜<20（1点）' },
      { value: '2', label: '≧20〜<40（2点）' }, { value: '3', label: '≧40（3点）' }]} />

    {!isInfection && !isHeme && <RadioGroup name="jsth-fib" label="フィブリノゲン (mg/dL)" value={fib} onChange={setFib} options={[
      { value: '0', label: '>150（0点）' }, { value: '1', label: '>100〜≦150（1点）' }, { value: '2', label: '≦100（2点）' }]} />}
    {isHeme && <RadioGroup name="jsth-fib-h" label="フィブリノゲン (mg/dL)" value={fib} onChange={setFib} options={[
      { value: '0', label: '>150（0点）' }, { value: '1', label: '>100〜≦150（1点）' }, { value: '2', label: '≦100（2点）' }]} />}

    <RadioGroup name="jsth-pt" label="プロトロンビン時間比" value={pt} onChange={setPt} options={[
      { value: '0', label: '<1.25（0点）' }, { value: '1', label: '≧1.25〜<1.67（1点）' }, { value: '2', label: '≧1.67（2点）' }]} />

    <RadioGroup name="jsth-at" label="アンチトロンビン (%)" value={at} onChange={setAt} options={[
      { value: '0', label: '>70%（0点）' }, { value: '1', label: '≦70%（1点）' }]} />

    <RadioGroup name="jsth-tat" label="TAT・SF・F1+2" value={tat} onChange={setTat} options={[
      { value: '0', label: '基準範囲上限の2倍未満（0点）' }, { value: '1', label: '基準範囲上限の2倍以上（1点）' }]} />

    <RadioGroup name="jsth-liver" label="肝不全" value={liver} onChange={setLiver} options={[
      { value: '0', label: 'なし（0点）' }, { value: '-3', label: 'あり（-3点）' }]} />
    <p className="text-[10px] text-muted px-1">*肝不全: 急性肝不全(PT活性40%以下/INR1.5以上)、慢性肝不全(Child-Pugh B以上)</p>

    <ResultCard label="日本血栓止血学会 DIC 2017" value={`${result.total}点`} interpretation={result.label} severity={result.severity} />
  </div>)
}

// ====== 3. ISTH overt DIC ======
function ISTHDIC() {
  const [plt, setPlt] = useState('0')
  const [fdp, setFdp] = useState('0')
  const [pt, setPt] = useState('0')
  const [fib, setFib] = useState('0')
  const score = Number(plt) + Number(fdp) + Number(pt) + Number(fib)
  const sev = score >= 5 ? 'dn' as const : 'ok' as const
  const label = score >= 5 ? `${score}点 — Overt DIC（≧5点）` : `${score}点 — Overt DIC基準を満たさない`
  return (<div className="space-y-3">
    <p className="text-xs text-muted">DICの基礎疾患が存在することが前提。</p>
    <RadioGroup name="isth-plt" label="血小板数 (万/μL)" value={plt} onChange={setPlt} options={[
      { value: '0', label: '≧10万（0点）' }, { value: '1', label: '≧5万〜<10万（1点）' }, { value: '2', label: '<5万（2点）' }]} />
    <RadioGroup name="isth-fdp" label="FDP / D-dimer上昇" value={fdp} onChange={setFdp} options={[
      { value: '0', label: '上昇なし（0点）' }, { value: '2', label: '中等度上昇（2点）' }, { value: '3', label: '著明上昇（3点）' }]} />
    <RadioGroup name="isth-pt" label="PT延長（秒）" value={pt} onChange={setPt} options={[
      { value: '0', label: '<3秒延長（0点）' }, { value: '1', label: '3-6秒延長（1点）' }, { value: '2', label: '>6秒延長（2点）' }]} />
    <RadioGroup name="isth-fib" label="フィブリノゲン (mg/dL)" value={fib} onChange={setFib} options={[
      { value: '0', label: '≧100（0点）' }, { value: '1', label: '<100（1点）' }]} />
    <ResultCard label="ISTH Overt DIC" value={`${score}/8点`} interpretation={label} severity={sev} />
  </div>)
}

export default function DicComprehensivePage() {
  const [tab, setTab] = useState(0)
  const tabs = ['急性期DIC', 'JSTH 2017', 'ISTH']
  return (
    <CalculatorLayout slug={toolDef.slug} title="DIC診断基準（3基準統合）" titleEn="DIC Diagnostic Criteria"
      description="DICの3つの主要診断基準を統合。タブ切り替えで急性期DIC（日本救急医学会2005）・日本血栓止血学会2017・ISTH overt DICを計算。"
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted"><p>急性期DIC基準は救急領域で早期診断に有用。JSTH 2017は基本型/造血障害型/感染型の3病型に対応。ISTHは国際標準。状況に応じて使い分ける。</p></div>}
      relatedTools={[{ slug: '4t-score', name: '4T\'s(HIT)' }, { slug: 'sirs', name: 'SIRS' }]}
      references={[
        { text: '丸藤哲ほか. 急性期DIC診断基準. 日救急医会誌 2005;16:188-202' },
        { text: 'DIC診断基準作成委員会. 日本血栓止血学会DIC診断基準 2017年版. 血栓止血誌 2017;28(3):369-391' },
        { text: 'Taylor FB Jr, et al. Towards definition, clinical and laboratory criteria, and a scoring system for DIC. Thromb Haemost 2001;86:1327-1330' },
      ]}
    >
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${tab === i ? 'bg-ac text-white' : 'bg-s0 border border-br text-muted'}`}>{t}</button>
        ))}
      </div>
      {tab === 0 && <AcuteDIC />}
      {tab === 1 && <JSTH2017 />}
      {tab === 2 && <ISTHDIC />}
    </CalculatorLayout>
  )
}
