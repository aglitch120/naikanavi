'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'

export default function SarcopeniaAWGSPage() {
  const [sex, setSex] = useState<'male'|'female'>('male')
  const [gripStrength, setGripStrength] = useState('25')
  const [gaitSpeed, setGaitSpeed] = useState('1.2')
  const [smi, setSmi] = useState('6.5')

  const result = useMemo(() => {
    const grip = parseFloat(gripStrength), speed = parseFloat(gaitSpeed), s = parseFloat(smi)
    if (isNaN(grip) || isNaN(speed) || isNaN(s)) return null

    const lowGrip = sex === 'male' ? grip < 28 : grip < 18
    const lowSpeed = speed < 1.0
    const lowSMI = sex === 'male' ? s < 7.0 : s < 5.7

    let diagnosis = ''
    let severity: 'ok'|'wn'|'dn' = 'ok'
    if (!lowSMI) { diagnosis = 'サルコペニアなし'; severity = 'ok' }
    else if (lowSMI && lowGrip && lowSpeed) { diagnosis = '重症サルコペニアの可能性（参考。臨床医が総合的に判断）'; severity = 'dn' }
    else if (lowSMI && (lowGrip || lowSpeed)) { diagnosis = 'サルコペニアの可能性（参考。臨床医が総合的に判断）'; severity = 'wn' }
    else { diagnosis = '低筋肉量のみ（サルコペニア診断には筋力または身体機能低下が必要）'; severity = 'wn' }

    return { diagnosis, severity, lowGrip, lowSpeed, lowSMI }
  }, [sex, gripStrength, gaitSpeed, smi])

  return (
    <CalculatorLayout slug="sarcopenia-awgs" title="サルコペニア診断基準 (AWGS 2019)" titleEn="AWGS 2019 Sarcopenia Criteria"
      description="AWGS 2019基準によるサルコペニア診断。握力+歩行速度+骨格筋量指数(SMI)で評価。"
      category="general" categoryIcon="💪"
      result={result && <ResultCard label="AWGS 2019" value={result.diagnosis} severity={result.severity}
        details={[
          {label:'握力',value:`${gripStrength} kg（${result.lowGrip?'低下':'正常'}）`},
          {label:'歩行速度',value:`${gaitSpeed} m/s（${result.lowSpeed?'低下':'正常'}）`},
          {label:'SMI',value:`${smi} kg/m2（${result.lowSMI?'低下':'正常'}）`},
        ]} />}
      references={[{text:'Chen LK, et al. Asian Working Group for Sarcopenia: 2019 Consensus Update. J Am Med Dir Assoc 2020;21:300-7', url:'https://pubmed.ncbi.nlm.nih.gov/32033882/'}]}>
      <div><label className="block text-sm font-medium text-tx mb-1">性別</label><div className="flex gap-2">{(['male','female'] as const).map(s=><button key={s} onClick={()=>setSex(s)} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${sex===s?'bg-acl border-ac/30 text-ac':'border-br text-muted'}`}>{s==='male'?'男性':'女性'}</button>)}</div></div>
      <NumberInput label="握力" value={gripStrength} onChange={setGripStrength} unit="kg" step={0.1} />
      <NumberInput label="歩行速度" value={gaitSpeed} onChange={setGaitSpeed} unit="m/s" step={0.1} />
      <NumberInput label="SMI（骨格筋量指数）" value={smi} onChange={setSmi} unit="kg/m2" step={0.1} />
      <p className="text-[10px] text-muted">カットオフ: 男性 握力&lt;28kg / SMI&lt;7.0, 女性 握力&lt;18kg / SMI&lt;5.7, 歩行速度&lt;1.0m/s</p>
    </CalculatorLayout>
  )
}
