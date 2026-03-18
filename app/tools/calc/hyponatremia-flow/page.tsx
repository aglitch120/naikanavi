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
  if (osm === 'hyper') return { title: '高張性低Na血症', detail: '高血糖（補正Na = 実測Na + 1.6×(血糖-100)/100）、マンニトール投与 → 原因除去で改善。', severity: 'wn' }
  if (osm !== 'hypo') return null
  if (uosm === 'dilute') return { title: '水中毒 / 心因性多飲', detail: '腎の希釈能は正常。水制限が基本治療。Beer potomania、低栄養も鑑別。', severity: 'wn' }
  if (!vol) return null
  if (vol === 'hypo' && una === 'low') return { title: '腎外性Na喪失', detail: '嘔吐・下痢・第三腔貯留・熱傷 → 生食輸液で補正。原因の治療。', severity: 'wn' }
  if (vol === 'hypo' && una === 'high') return { title: '腎性Na喪失', detail: '利尿薬・塩類喪失性腎症・副腎不全・CSW → 利尿薬中止、必要に応じフルドロコルチゾン。', severity: 'dn' }
  if (vol === 'eu' && una === 'low') return { title: '甲状腺機能低下症', detail: 'TSH・fT4確認 → レボチロキシン補充。', severity: 'wn' }
  if (vol === 'eu' && una === 'high') return { title: 'SIADH / 副腎不全', detail: 'SIADH: 水制限800-1000mL/日。副腎不全: コルチゾール測定→ヒドロコルチゾン補充。', severity: 'dn' }
  if (vol === 'hyper' && una === 'low') return { title: '心不全 / 肝硬変 / ネフローゼ', detail: '有効循環血液量低下 → 水・Na制限+利尿薬。原疾患の治療。', severity: 'dn' }
  if (vol === 'hyper' && una === 'high') return { title: '腎不全', detail: 'eGFR低下による水排泄障害 → 透析考慮。', severity: 'dn' }
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
      explanation={
        <div className="space-y-6 text-sm text-tx leading-relaxed">
          <div>
            <h2 className="text-lg font-bold mb-2">低Na血症の診断アルゴリズム</h2>
            <p className="text-muted">
              低Na血症（Na &lt;135 mEq/L）は入院患者で最も頻度の高い電解質異常です。
              Step 1で血漿浸透圧により高張・等張・低張に分類し、Step 2で低張性なら尿浸透圧で腎の希釈能を評価、
              Step 3で体液量と尿中Na濃度を組み合わせて原因を絞り込みます。
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">重症度分類と緊急対応</h3>
            <div className="bg-s1 rounded-lg p-4 space-y-2 text-muted text-xs">
              <p><span className="font-medium text-dn">重症（けいれん・意識障害）:</span> 3% NaCl 100-150 mL を10-20分でボーラス投与。1-2 mEq/L上昇を目標。改善なければ繰り返し可（最大3回）</p>
              <p><span className="font-medium text-wn">中等症（嘔気・頭痛・見当識障害）:</span> 3% NaCl を持続投与。1-2 mEq/L/hの上昇を目標</p>
              <p><span className="font-medium text-ok">軽症・無症候性:</span> 原因治療が優先。急速補正は不要</p>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">補正速度の上限（ODS予防）</h3>
            <p className="text-muted">
              浸透圧性脱髄症候群（ODS）予防のため、Na補正速度は24時間で8 mEq/L以内（高リスク群では6 mEq/L以内）に制限します。
              高リスク群は、慢性低Na（48時間以上）、Na ≦105 mEq/L、低K血症合併、アルコール使用障害、肝硬変、低栄養です。
            </p>
            <p className="text-muted mt-2">
              過補正した場合はデスモプレシン（DDAVP）2μg IV + 5%ブドウ糖液でNaを再低下させます（re-lowering therapy）。
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">SIADHの診断ポイント</h3>
            <p className="text-muted">
              低張性・正常循環血液量・尿浸透圧 &gt;100・尿Na &gt;30-40 mEq/LでSIADHを疑います。
              甲状腺機能低下症・副腎不全を除外した上で診断します。治療は水制限（800-1000 mL/日）が基本で、
              効果不十分ならトルバプタン（V2受容体拮抗薬）を考慮します。
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">よくある質問</h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium">Q. 高血糖による偽性低Naの補正式は？</p>
                <p className="text-muted mt-1">
                  補正Na = 実測Na + 1.6 × (血糖 - 100) / 100。血糖が400以上の場合は係数2.4を使用する報告もあります。
                  補正Naが正常であれば、真の低Na血症ではありません。
                </p>
              </div>
              <div>
                <p className="font-medium">Q. 利尿薬が原因の低Naはどう対応しますか？</p>
                <p className="text-muted mt-1">
                  サイアザイド系利尿薬が最も多い原因です（ループ利尿薬は稀）。原因薬を中止し、Naと水分を補充します。
                  中止後に急速な水利尿が生じてNaが過補正されるリスクがあるため、頻回なNaモニタリングが必要です。
                </p>
              </div>
              <div>
                <p className="font-medium">Q. 急性か慢性かの判断はどうしますか？</p>
                <p className="text-muted mt-1">
                  発症から48時間以内を急性、48時間以上または不明を慢性と定義します。
                  急性低Naは脳浮腫リスクが高いため比較的速い補正が許容されますが、慢性低NaはODSリスクのため緩徐な補正が必要です。
                </p>
              </div>
            </div>
          </div>
        </div>
      }
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
