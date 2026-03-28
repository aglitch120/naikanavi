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
  { label: '脱水（皮膚ツルゴール低下・頻脈）', value: 'hypo' },
  { label: '正常（浮腫なし・脱水なし）', value: 'eu' },
  { label: '体液過剰（浮腫・腹水）', value: 'hyper' },
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
  if (osm === 'iso') return { title: '等張性低Na血症（偽性）', detail: '高脂血症・高蛋白血症 → 浸透圧ギャップ確認。実際のNaは正常の可能性。', severity: 'ok' }
  if (osm === 'hyper') return { title: '高張性低Na血症', detail: '高血糖（補正Na = 実測Na + 1.6×(血糖-100)/100。Hillier式では係数2.4。血糖>400ではHillier式推奨）、マンニトール投与 → 原因除去で改善。', severity: 'wn' }
  if (osm !== 'hypo') return null
  if (uosm === 'dilute') return { title: '水中毒 / 心因性多飲', detail: '腎の希釈能は正常。Beer potomania、低栄養も鑑別。治療は担当医が判断。', severity: 'wn' }
  if (!vol) return null
  if (vol === 'hypo' && una === 'low') return { title: '腎外性Na喪失', detail: '嘔吐・下痢・第三腔貯留・熱傷が原因として考えられる。治療は担当医が判断。', severity: 'wn' }
  if (vol === 'hypo' && una === 'high') return { title: '腎性Na喪失', detail: '利尿薬・塩類喪失性腎症・副腎不全・CSWが原因として考えられる。治療は担当医が判断。', severity: 'dn' }
  if (vol === 'eu' && una === 'low') return { title: '甲状腺機能低下症', detail: 'TSH・fT4等の検索を担当医が判断。', severity: 'wn' }
  if (vol === 'eu' && una === 'high') return { title: 'SIADH / 副腎不全', detail: 'SIADHまたは副腎不全が考えられる。治療は担当医が判断。', severity: 'dn' }
  if (vol === 'hyper' && una === 'low') return { title: '心不全 / 肝硬変 / ネフローゼ', detail: '有効循環血液量低下が考えられる。原疾患の治療は担当医が判断。', severity: 'dn' }
  if (vol === 'hyper' && una === 'high') return { title: '腎不全', detail: 'eGFR低下による水排泄障害が考えられる。治療は担当医が判断。', severity: 'dn' }
  return null
}

export default function HyponatremiaFlowPage() {
  const [osm, setOsm] = useState('')
  const [uosm, setUosm] = useState('')
  const [vol, setVol] = useState('')
  const [una, setUna] = useState('')

  const activeSteps = useMemo((): Step[] => {
    const steps: Step[] = ['osm']
    if (osm === 'hypo') { steps.push('uosm') }
    if (osm === 'hypo' && uosm === 'conc') { steps.push('volume'); steps.push('una') }
    return steps
  }, [osm, uosm])

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
        { text: 'Spasovski G et al. Clinical practice guideline on diagnosis and treatment of hyponatraemia. Eur J Endocrinol 2014;170:G1-G47' },
        { text: 'Hoorn EJ, Zietse R. Diagnosis and treatment of hyponatremia: compilation of existing guidelines. J Am Soc Nephrol 2017;28:1340-1349' },
        { text: 'Sterns RH. Disorders of plasma sodium. N Engl J Med 2015;372:55-65' },
        { text: 'Verbalis JG et al. Diagnosis, evaluation, and treatment of hyponatremia: expert panel recommendations. Am J Med 2013;126:S1-S42' },
      ]}
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-bold text-ac">Step 1</p>
          <RadioGroup name="osm" label="血漿浸透圧 (mOsm/kg)" options={osmOptions} value={osm} onChange={v => { setOsm(v); setUosm(''); setVol(''); setUna('') }} />
        </div>
        {activeSteps.includes('uosm') && (
          <div className="space-y-1">
            <p className="text-xs font-bold text-ac">Step 2</p>
            <RadioGroup name="uosm" label="尿浸透圧 (mOsm/kg)" options={uosmOptions} value={uosm} onChange={v => { setUosm(v); setVol(''); setUna('') }} />
          </div>
        )}
        {activeSteps.includes('volume') && (
          <div className="space-y-1">
            <p className="text-xs font-bold text-ac">Step 3</p>
            <RadioGroup name="vol" label="体液量の評価" options={volOptions} value={vol} onChange={setVol} />
          </div>
        )}
        {activeSteps.includes('una') && (
          <div className="space-y-1">
            <p className="text-xs font-bold text-ac">Step 4</p>
            <RadioGroup name="una" label="尿中Na濃度" options={unaOptions} value={una} onChange={setUna} />
          </div>
        )}
      </div>
    </CalculatorLayout>
  )
}
