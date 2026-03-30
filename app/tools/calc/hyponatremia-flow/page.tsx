'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('hyponatremia-flow')!

type Step = 'osm' | 'uosm' | 'volume' | 'una'

const osmOptions = [
  { label: '<280 (低張性)', value: 'hypo' },
  { label: '280-295 (等張性)', value: 'iso' },
  { label: '>295 (高張性)', value: 'hyper' },
]
const uosmOptions = [
  { label: '≦100 (希釈尿)', value: 'dilute' },
  { label: '>100 (濃縮尿)', value: 'conc' },
]
const volOptions = [
  { label: '細胞外液量減少（脱水・ツルゴール低下・頻脈）', value: 'hypo' },
  { label: '細胞外液量ほぼ正常（浮腫なし・脱水なし）', value: 'eu' },
  { label: '細胞外液量増加（浮腫・腹水・頸静脈怒張）', value: 'hyper' },
]
const unaOptions = [
  { label: '<20 mEq/L', value: 'low' },
  { label: '≧20 mEq/L', value: 'high' },
]

interface Diagnosis {
  title: string
  detail: string
  severity: 'ok' | 'wn' | 'dn'
}

function getDiagnosis(osm: string, uosm: string, vol: string, una: string): Diagnosis | null {
  // 高張性・偽性
  if (osm === 'iso') return { title: '偽性低Na血症', detail: '脂質異常症・異常蛋白血症（Paraproteinemia）など。血漿浸透圧は正常→実際のNaは正常の可能性。', severity: 'ok' }
  if (osm === 'hyper') return { title: '高張性低Na血症', detail: '高血糖・グリセオール・マンニトール製剤使用など。高浸透圧物質により水が細胞内から移動しNaが希釈される。', severity: 'wn' }
  if (osm !== 'hypo') return null
  // 低張性 → 細胞外液量で分岐
  if (!vol) return null
  // 細胞外液量減少
  if (vol === 'hypo' && una === 'high') return { title: '腎性Na喪失（細胞外液量減少+尿中Na>20）', detail: '利尿薬・浸透圧利尿・RSWS（塩類喪失性腎症）・CSWS（中枢性塩類喪失症候群）・Addison病', severity: 'dn' }
  if (vol === 'hypo' && una === 'low') return { title: '腎外性Na喪失（細胞外液量減少+尿中Na<20）', detail: '嘔吐・下痢・膵炎・発汗過多・熱傷・低栄養', severity: 'wn' }
  // 細胞外液量ほぼ正常
  if (vol === 'eu' && uosm === 'conc' && una === 'high') return { title: 'SIADH / 甲状腺機能低下症 / 続発性副腎皮質機能低下症 / MRHE（尿浸透圧>100, 尿中Na>20）', detail: 'SIADH・甲状腺機能低下症・続発性副腎皮質機能低下症・MRHE（Mineralocorticoid-Responsive Hyponatremia of the Elderly）を鑑別', severity: 'dn' }
  if (vol === 'eu' && (uosm === 'dilute' || una === 'low')) return { title: '精神的多飲 / 溶質不足（尿浸透圧<100, 尿中Na<20）', detail: '精神的多飲症（心因性多飲）・溶質不足（ビール多飲 = beer potomania）。腎の希釈能は正常。', severity: 'wn' }
  // 細胞外液量増加
  if (vol === 'hyper' && una === 'high') return { title: '腎不全（細胞外液量増加+尿中Na>20）', detail: '腎不全による水・Na排泄障害', severity: 'dn' }
  if (vol === 'hyper' && una === 'low') return { title: '心不全 / 肝硬変 / ネフローゼ症候群（細胞外液量増加+尿中Na<20）', detail: '有効循環血液量低下 → RAA系活性化 → Na・水貯留。原疾患の評価が必要。', severity: 'dn' }
  return null
}

export default function HyponatremiaFlowPage() {
  const [osm, setOsm] = useState('')
  const [uosm, setUosm] = useState('')
  const [vol, setVol] = useState('')
  const [una, setUna] = useState('')

  const activeSteps = useMemo((): Step[] => {
    const steps: Step[] = ['osm']
    if (osm === 'hypo') {
      steps.push('volume')
      if (vol === 'eu') { steps.push('uosm'); steps.push('una') }
      else if (vol) { steps.push('una') }
    }
    return steps
  }, [osm, vol])

  const diagnosis = useMemo(() => getDiagnosis(osm, uosm, vol, una), [osm, uosm, vol, una])

  return (
    <CalculatorLayout
      slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={
        diagnosis
          ? <ResultCard label="鑑別診断" value={diagnosis.title} interpretation={diagnosis.detail} severity={diagnosis.severity} />
          : <ResultCard label="低Na血症フロー" value="選択中…" interpretation="上の項目を順に選択してください" severity={'neutral' as const} />
      }
      explanation={undefined}
      relatedTools={[]}
      references={[
        { text: '山口秀樹ほか. 日内会誌 2016;105(4):667-675' },
        { text: '柴垣有吾（監修/深川雅史）. 体液電解質異常と輸液 改訂3版. 中外医学社; 2019' },
        { text: 'Sterns RH. Disorders of plasma sodium. N Engl J Med 2015;372:55-65' },
        { text: 'Spasovski G, et al. Clinical practice guideline on diagnosis and treatment of hyponatraemia. Eur J Endocrinol 2014;170:G1-G47' },
      ]}
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-bold text-ac">Step 1</p>
          <RadioGroup name="osm" label="血漿浸透圧 (mOsm/kg)" options={osmOptions} value={osm} onChange={v => { setOsm(v); setUosm(''); setVol(''); setUna('') }} />
        </div>
        {activeSteps.includes('volume') && (
          <div className="space-y-1">
            <p className="text-xs font-bold text-ac">Step 2: 細胞外液量の評価</p>
            <RadioGroup name="vol" label="細胞外液量" options={volOptions} value={vol} onChange={v => { setVol(v); setUosm(''); setUna('') }} />
          </div>
        )}
        {activeSteps.includes('uosm') && (
          <div className="space-y-1">
            <p className="text-xs font-bold text-ac">Step 3: 尿浸透圧</p>
            <RadioGroup name="uosm" label="尿浸透圧 (mOsm/kg)" options={uosmOptions} value={uosm} onChange={v => { setUosm(v); setUna('') }} />
          </div>
        )}
        {activeSteps.includes('una') && (
          <div className="space-y-1">
            <p className="text-xs font-bold text-ac">Step {vol === 'eu' ? '4' : '3'}: 尿中Na濃度</p>
            <RadioGroup name="una" label="尿中Na濃度" options={unaOptions} value={una} onChange={setUna} />
          </div>
        )}
      </div>
    </CalculatorLayout>
  )
}
