'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('apache2')!

function tempScore(v: number): number {
  if (v >= 41) return 4
  if (v >= 39) return 3
  if (v >= 38.5) return 1
  if (v >= 36) return 0
  if (v >= 34) return 1
  if (v >= 32) return 2
  if (v >= 30) return 3
  return 4
}
function mapScore(v: number): number {
  if (v >= 160) return 4
  if (v >= 130) return 3
  if (v >= 110) return 2
  if (v >= 70) return 0
  if (v >= 50) return 2
  return 4
}
function hrScore(v: number): number {
  if (v >= 180) return 4
  if (v >= 140) return 3
  if (v >= 110) return 2
  if (v >= 70) return 0
  if (v >= 55) return 2
  if (v >= 40) return 3
  return 4
}
function rrScore(v: number): number {
  if (v >= 50) return 4
  if (v >= 35) return 3
  if (v >= 25) return 1
  if (v >= 12) return 0
  if (v >= 10) return 1
  if (v >= 6) return 2
  return 4
}
function oxyScore(fio2: number, pao2: number, aado2: number): number {
  if (fio2 >= 0.5) {
    if (aado2 >= 500) return 4
    if (aado2 >= 350) return 3
    if (aado2 >= 200) return 2
    return 0
  } else {
    if (pao2 > 70) return 0
    if (pao2 >= 61) return 1
    if (pao2 >= 55) return 3
    return 4
  }
}
function phScore(v: number): number {
  if (v >= 7.7) return 4
  if (v >= 7.6) return 3
  if (v >= 7.5) return 1
  if (v >= 7.33) return 0
  if (v >= 7.25) return 2
  if (v >= 7.15) return 3
  return 4
}
function naScore(v: number): number {
  if (v >= 180) return 4
  if (v >= 160) return 3
  if (v >= 155) return 2
  if (v >= 150) return 1
  if (v >= 130) return 0
  if (v >= 120) return 2
  if (v >= 111) return 3
  return 4
}
function kScore(v: number): number {
  if (v >= 7) return 4
  if (v >= 6) return 3
  if (v >= 5.5) return 1
  if (v >= 3.5) return 0
  if (v >= 3) return 1
  if (v >= 2.5) return 2
  return 4
}
function crScore(v: number, arf: boolean): number {
  const base = (() => {
    if (v >= 3.5) return 4
    if (v >= 2) return 3
    if (v >= 1.5) return 2
    if (v >= 0.6) return 0
    return 2
  })()
  return arf ? base * 2 : base
}
function htScore(v: number): number {
  if (v >= 60) return 4
  if (v >= 50) return 2
  if (v >= 46) return 1
  if (v >= 30) return 0
  if (v >= 20) return 2
  return 4
}
function wbcScore(v: number): number {
  if (v >= 40) return 4
  if (v >= 20) return 2
  if (v >= 15) return 1
  if (v >= 3) return 0
  if (v >= 1) return 2
  return 4
}
function ageScore(age: number): number {
  if (age <= 44) return 0
  if (age <= 54) return 2
  if (age <= 64) return 3
  if (age <= 74) return 5
  return 6
}

const mortalityTable: Record<string, string> = {
  '0-4': '約4%',
  '5-9': '約8%',
  '10-14': '約15%',
  '15-19': '約25%',
  '20-24': '約40%',
  '25-29': '約55%',
  '30-34': '約75%',
  '35+': '約85%',
}
function getMortality(score: number): string {
  if (score <= 4) return mortalityTable['0-4']
  if (score <= 9) return mortalityTable['5-9']
  if (score <= 14) return mortalityTable['10-14']
  if (score <= 19) return mortalityTable['15-19']
  if (score <= 24) return mortalityTable['20-24']
  if (score <= 29) return mortalityTable['25-29']
  if (score <= 34) return mortalityTable['30-34']
  return mortalityTable['35+']
}

export default function Apache2Page() {
  const [temp, setTemp] = useState('37.0')
  const [map, setMap] = useState('80')
  const [hr, setHr] = useState('80')
  const [rr, setRr] = useState('16')
  const [fio2, setFio2] = useState('0.21')
  const [pao2, setPao2] = useState('80')
  const [aado2, setAado2] = useState('0')
  const [ph, setPh] = useState('7.40')
  const [na, setNa] = useState('140')
  const [k, setK] = useState('4.0')
  const [cr, setCr] = useState('1.0')
  const [arf, setArf] = useState(false)
  const [ht, setHt] = useState('40')
  const [wbc, setWbc] = useState('10')
  const [gcs, setGcs] = useState('15')
  const [age, setAge] = useState('50')
  const [chronic, setChronic] = useState('0')

  const result = useMemo(() => {
    const t = parseFloat(temp) || 37
    const m = parseFloat(map) || 80
    const h = parseFloat(hr) || 80
    const r = parseFloat(rr) || 16
    const f = parseFloat(fio2) || 0.21
    const p = parseFloat(pao2) || 80
    const a = parseFloat(aado2) || 0
    const pH = parseFloat(ph) || 7.4
    const Na = parseFloat(na) || 140
    const K = parseFloat(k) || 4.0
    const Cr = parseFloat(cr) || 1.0
    const Ht = parseFloat(ht) || 40
    const Wbc = parseFloat(wbc) || 10
    const G = parseInt(gcs) || 15
    const Age = parseInt(age) || 50
    const Ch = parseInt(chronic) || 0

    const aps =
      tempScore(t) + mapScore(m) + hrScore(h) + rrScore(r) +
      oxyScore(f, p, a) + phScore(pH) + naScore(Na) + kScore(K) +
      crScore(Cr, arf) + htScore(Ht) + wbcScore(Wbc) + (15 - G)

    const total = aps + ageScore(Age) + Ch
    const severity: 'ok' | 'wn' | 'dn' = total <= 14 ? 'ok' : total <= 24 ? 'wn' : 'dn'

    return { total, aps, agePoints: ageScore(Age), chronicPoints: Ch, severity, mortality: getMortality(total) }
  }, [temp, map, hr, rr, fio2, pao2, aado2, ph, na, k, cr, arf, ht, wbc, gcs, age, chronic])

  return (
    <CalculatorLayout
      slug={toolDef.slug}
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard
          label="APACHE II"
          value={result.total}
          unit="/ 71点"
          interpretation={`予測院内死亡率: ${result.mortality}`}
          severity={result.severity}
          details={[
            { label: '急性生理学スコア（APS）', value: `${result.aps}点` },
            { label: '年齢スコア', value: `${result.agePoints}点` },
            { label: '慢性疾患スコア', value: `${result.chronicPoints}点` },
          ]}
        />
      }
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Knaus WA, et al. Crit Care Med 1985;13:818-829' },
      ]}
    >
      <div className="space-y-6">
        <div className="text-xs font-medium text-muted uppercase tracking-wider">急性生理学パラメータ</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput id="temp" label="体温" unit="°C" value={temp} onChange={setTemp} step={0.1} />
          <NumberInput id="map" label="平均動脈圧（MAP）" unit="mmHg" value={map} onChange={setMap} step={1} />
          <NumberInput id="hr" label="心拍数" unit="/min" value={hr} onChange={setHr} step={1} />
          <NumberInput id="rr" label="呼吸数" unit="/min" value={rr} onChange={setRr} step={1} />
        </div>

        <div className="text-xs font-medium text-muted uppercase tracking-wider">酸素化</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput id="fio2" label="FiO₂" unit="" hint="0.21〜1.0" value={fio2} onChange={setFio2} step={0.01} />
          {parseFloat(fio2) >= 0.5 ? (
            <NumberInput id="aado2" label="A-aDO₂" unit="mmHg" value={aado2} onChange={setAado2} step={1} />
          ) : (
            <NumberInput id="pao2" label="PaO₂" unit="mmHg" value={pao2} onChange={setPao2} step={1} />
          )}
        </div>

        <div className="text-xs font-medium text-muted uppercase tracking-wider">血液検査</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput id="ph" label="動脈血pH" value={ph} onChange={setPh} step={0.01} />
          <NumberInput id="na" label="Na" unit="mEq/L" value={na} onChange={setNa} step={1} />
          <NumberInput id="k" label="K" unit="mEq/L" value={k} onChange={setK} step={0.1} />
          <div>
            <NumberInput id="cr" label="Cr" unit="mg/dL" value={cr} onChange={setCr} step={0.1} />
            <label className="flex items-center gap-2 mt-2 text-sm text-tx">
              <input type="checkbox" checked={arf} onChange={e => setArf(e.target.checked)}
                className="w-4 h-4 rounded border-br text-ac focus:ring-ac/30" />
              急性腎不全（Cr倍点）
            </label>
          </div>
          <NumberInput id="ht" label="Ht（ヘマトクリット）" unit="%" value={ht} onChange={setHt} step={1} />
          <NumberInput id="wbc" label="WBC" unit="×10³/μL" value={wbc} onChange={setWbc} step={0.1} />
        </div>

        <div className="text-xs font-medium text-muted uppercase tracking-wider">GCS・年齢・慢性疾患</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput id="gcs" label="GCS合計" unit="3〜15" value={gcs} onChange={setGcs} step={1} min={3} max={15} />
          <NumberInput id="age" label="年齢" unit="歳" value={age} onChange={setAge} step={1} />
        </div>
        <SelectInput
          id="chronic"
          label="慢性疾患（臓器不全・免疫不全の既往）"
          value={chronic}
          onChange={setChronic}
          options={[
            { value: '0', label: '0点 — なし' },
            { value: '2', label: '2点 — 予定手術後' },
            { value: '5', label: '5点 — 非手術 or 緊急手術後' },
          ]}
        />
        <p className="text-xs text-muted">※臓器不全の定義: 肝(生検確認の肝硬変+門脈圧亢進), 心(NYHA IV), 腎(慢性透析), 肺(慢性呼吸不全), 免疫不全</p>
      </div>
    </CalculatorLayout>
  )
}
