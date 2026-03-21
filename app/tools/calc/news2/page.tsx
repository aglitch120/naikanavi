'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('news2')!

function rrScore(v: number) { if (v<=8) return 3; if (v<=11) return 1; if (v<=20) return 0; if (v<=24) return 2; return 3 }
function spo2Score(v: number, scale2: boolean) {
  if (!scale2) { if (v<=91) return 3; if (v<=93) return 2; if (v<=95) return 1; return 0 }
  else { if (v<=83) return 3; if (v<=85) return 2; if (v<=87) return 1; if (v<=92) return 0; if (v<=94) return 1; if (v<=96) return 2; return 3 }
}
function o2Score(onO2: boolean) { return onO2 ? 2 : 0 }
function tempScore(v: number) { if (v<=35) return 3; if (v<=36) return 1; if (v<=38) return 0; if (v<=39) return 1; return 2 }
function sbpScore(v: number) { if (v<=90) return 3; if (v<=100) return 2; if (v<=110) return 1; if (v<=219) return 0; return 3 }
function hrScore(v: number) { if (v<=40) return 3; if (v<=50) return 1; if (v<=90) return 0; if (v<=110) return 1; if (v<=130) return 2; return 3 }
function consScore(v: string) { return v === 'alert' ? 0 : 3 }

export default function News2Page() {
  const [rr, setRr] = useState('16')
  const [spo2, setSpo2] = useState('96')
  const [scale2, setScale2] = useState('1')
  const [onO2, setOnO2] = useState('no')
  const [temp, setTemp] = useState('37.0')
  const [sbp, setSbp] = useState('120')
  const [hr, setHr] = useState('75')
  const [consciousness, setConsciousness] = useState('alert')

  const result = useMemo(() => {
    const isScale2 = scale2 === '2'
    const total = rrScore(parseFloat(rr)||16) + spo2Score(parseFloat(spo2)||96, isScale2) + o2Score(onO2==='yes')
      + tempScore(parseFloat(temp)||37) + sbpScore(parseInt(sbp)||120) + hrScore(parseInt(hr)||75) + consScore(consciousness)
    const severity: 'ok'|'wn'|'dn' = total<=4 ? 'ok' : total<=6 ? 'wn' : 'dn'
    const label = total<=4 ? '低リスク — 通常モニタリング' : total<=6 ? '中リスク — 頻回観察・医師報告' : '高リスク — 緊急対応・RRT/MET起動を検討'
    const hasAny3 = [rrScore(parseFloat(rr)||16), spo2Score(parseFloat(spo2)||96, isScale2), o2Score(onO2==='yes'),
      tempScore(parseFloat(temp)||37), sbpScore(parseInt(sbp)||120), hrScore(parseInt(hr)||75), consScore(consciousness)].some(s => s === 3)
    return { total, severity, label, hasAny3 }
  }, [rr, spo2, scale2, onO2, temp, sbp, hr, consciousness])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="NEWS2" value={result.total} unit="/ 20点" interpretation={result.label} severity={result.severity}
        details={result.hasAny3 ? [{ label: '⚠ 注意', value: '個別パラメータ3点あり — 緊急対応を検討' }] : []} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">NEWS2とは</h2>
          <p>National Early Warning Score 2は入院患者の急性増悪を早期に検出するためのスクリーニングツールです。バイタル6項目＋酸素投与で0-20点を算出。英国NHSで標準採用されています。</p>
          <h3 className="font-bold text-tx">対応レベル</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>0-4点: 低リスク（4-6時間ごと観察）</li>
            <li>個別3点: 緊急対応を検討</li>
            <li>5-6点: 中リスク（1時間ごと観察、医師報告）</li>
            <li>≥7点: 高リスク（RRT/MET起動、持続モニタリング）</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Royal College of Physicians. NEWS2, 2017' }]}
    >
      <div className="space-y-4">
        <NumberInput id="rr" label="呼吸数" unit="/min" value={rr} onChange={setRr} step={1} />
        <NumberInput id="spo2" label="SpO₂" unit="%" value={spo2} onChange={setSpo2} step={1} />
        <SelectInput id="scale2" label="SpO₂スケール" value={scale2} onChange={setScale2}
          options={[{ value: '1', label: 'スケール1（通常）' }, { value: '2', label: 'スケール2（COPD等、目標88-92%）' }]} />
        <SelectInput id="onO2" label="酸素投与" value={onO2} onChange={setOnO2}
          options={[{ value: 'no', label: 'なし（室内気）' }, { value: 'yes', label: 'あり' }]} />
        <NumberInput id="temp" label="体温" unit="°C" value={temp} onChange={setTemp} step={0.1} />
        <NumberInput id="sbp" label="収縮期血圧" unit="mmHg" value={sbp} onChange={setSbp} step={1} />
        <NumberInput id="hr" label="心拍数" unit="/min" value={hr} onChange={setHr} step={1} />
        <SelectInput id="consciousness" label="意識レベル" value={consciousness} onChange={setConsciousness}
          options={[{ value: 'alert', label: 'Alert（清明）' }, { value: 'cvpu', label: 'C/V/P/U（意識障害あり）' }]} />
      </div>
    </CalculatorLayout>
  )
}
