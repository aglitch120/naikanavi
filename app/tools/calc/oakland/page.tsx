'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('oakland')!
export default function OaklandPage() {
  const [age, setAge] = useState<string>('40-69')
  const [sex, setSex] = useState<string>('male')
  const [prevAdm, setPrevAdm] = useState<string>('no')
  const [dre, setDre] = useState<string>('no-blood')
  const [hr, setHr] = useState<string>('<70')
  const [sbp, setSbp] = useState<string>('>=130')
  const [hb, setHb] = useState<string>('130-159')
  const scoreMap: Record<string, Record<string, number>> = {
    age: { '<40': 0, '40-69': 1, '>=70': 2 },
    sex: { 'male': 1, 'female': 0 },
    prevAdm: { 'no': 0, 'yes': 1 },
    dre: { 'no-blood': 0, 'blood': 1 },
    hr: { '<70': 0, '70-89': 1, '90-109': 2, '>=110': 3 },
    sbp: { '>=130': 0, '120-129': 1, '110-119': 2, '100-109': 3, '<100': 5 },
    hb: { '>=160': 0, '130-159': 1, '110-129': 3, '90-109': 5, '70-89': 8, '<70': 10 },
  }
  const result = useMemo(() => {
    const total = (scoreMap.age[age] || 0) + (scoreMap.sex[sex] || 0) + (scoreMap.prevAdm[prevAdm] || 0) +
      (scoreMap.dre[dre] || 0) + (scoreMap.hr[hr] || 0) + (scoreMap.sbp[sbp] || 0) + (scoreMap.hb[hb] || 0)
    let severity: 'ok' | 'wn' | 'dn' = 'ok', interpretation = ''
    if (total <= 8) { interpretation = `${total}点 — 低リスク（外来管理を検討可能）。帰宅判断は臨床医による` }
    else if (total <= 12) { interpretation = `${total}点 — 入院観察を考慮`; severity = 'wn' }
    else { interpretation = `${total}点 — 入院加療が必要`; severity = 'dn' }
    return { total, severity, interpretation }
  }, [age, sex, prevAdm, dre, hr, sbp, hb])
  const Select = ({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: { v: string, l: string }[] }) => (
    <div>
      <label className="block text-sm font-bold text-tx mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 bg-s0 border border-br rounded-xl text-sm text-tx">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`Oakland = ${result.total}点`} interpretation={result.interpretation} />}
      explanation={<div className="text-sm text-muted"><p>≦8点で低リスクと判定。帰宅・外来管理の可否は臨床医が総合的に判断する。下部消化管出血の入院判断に使用。</p></div>}
      relatedTools={[{ slug: 'glasgow-blatchford', name: 'Glasgow-Blatchford' }, { slug: 'rockall', name: 'Rockall' }]}
      references={toolDef.sources || []}
    >
      <div className="space-y-3">
        <Select label="年齢" value={age} onChange={setAge} options={[{ v: '<40', l: '<40歳 (0点)' }, { v: '40-69', l: '40-69歳 (1点)' }, { v: '>=70', l: '≧70歳 (2点)' }]} />
        <Select label="性別" value={sex} onChange={setSex} options={[{ v: 'male', l: '男性 (1点)' }, { v: 'female', l: '女性 (0点)' }]} />
        <Select label="下部消化管出血での入院歴" value={prevAdm} onChange={setPrevAdm} options={[{ v: 'no', l: 'なし (0点)' }, { v: 'yes', l: 'あり (1点)' }]} />
        <Select label="直腸診 (DRE)" value={dre} onChange={setDre} options={[{ v: 'no-blood', l: '血液なし (0点)' }, { v: 'blood', l: '血液あり (1点)' }]} />
        <Select label="心拍数" value={hr} onChange={setHr} options={[{ v: '<70', l: '<70 (0点)' }, { v: '70-89', l: '70-89 (1点)' }, { v: '90-109', l: '90-109 (2点)' }, { v: '>=110', l: '≧110 (3点)' }]} />
        <Select label="収縮期血圧 (mmHg)" value={sbp} onChange={setSbp} options={[{ v: '>=130', l: '≧130 (0点)' }, { v: '120-129', l: '120-129 (1点)' }, { v: '110-119', l: '110-119 (2点)' }, { v: '100-109', l: '100-109 (3点)' }, { v: '<100', l: '<100 (5点)' }]} />
        <Select label="Hb (g/L) ※日本のg/dL×10で入力" value={hb} onChange={setHb} options={[{ v: '>=160', l: '≧16.0 g/dL [≧160 g/L] (0点)' }, { v: '130-159', l: '13.0-15.9 g/dL [130-159 g/L] (1点)' }, { v: '110-129', l: '11.0-12.9 g/dL [110-129 g/L] (3点)' }, { v: '90-109', l: '9.0-10.9 g/dL [90-109 g/L] (5点)' }, { v: '70-89', l: '7.0-8.9 g/dL [70-89 g/L] (8点)' }, { v: '<70', l: '<7.0 g/dL [<70 g/L] (10点)' }]} />
      </div>
    </CalculatorLayout>
  )
}
