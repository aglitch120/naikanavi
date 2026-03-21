'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('isth-dic')!

export default function IsthDicPage() {
  const [plt, setPlt] = useState('0')
  const [fdp, setFdp] = useState('0')
  const [pt, setPt] = useState('0')
  const [fib, setFib] = useState('0')

  const result = useMemo(() => {
    const score = [plt, fdp, pt, fib].reduce((a, b) => a + parseInt(b), 0)
    const overt = score >= 5
    const severity: 'ok'|'wn'|'dn' = overt ? 'dn' : score >= 3 ? 'wn' : 'ok'
    const label = overt ? 'Overt DIC（≥5点）— 基礎疾患の治療 + 補充療法' : score >= 3 ? 'DIC疑い（3-4点）— 1-2日後に再評価' : 'DICの可能性低い（<3点）'
    return { score, severity, label, overt }
  }, [plt, fdp, pt, fib])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="ISTH DIC Score" value={result.score} unit="/ 8点" interpretation={result.label} severity={result.severity}
        details={[{ label: '判定', value: result.overt ? 'Overt DIC' : 'Non-overt' }]} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">ISTH DIC スコアとは</h2>
          <p>国際血栓止血学会（ISTH）の播種性血管内凝固（DIC）診断スコアです。基礎疾患の存在を前提に、血小板数・FDP/Dダイマー・PT延長・フィブリノゲンの4項目で評価します。</p>
          <h3 className="font-bold text-tx">前提条件</h3>
          <p>DICの基礎疾患（敗血症、外傷、悪性腫瘍、産科合併症等）が存在する患者にのみ適用。基礎疾患がなければ本スコアは使用しません。</p>
          <h3 className="font-bold text-tx">判定</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>≥5点: Overt DIC → 治療開始・連日再評価</li>
            <li>3-4点: DIC疑い → 1-2日後に再評価</li>
            <li>&lt;3点: DICの可能性低い</li>
          </ul>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Taylor FB Jr, et al. Thromb Haemost 2001;86:1327-1330' }]}
    >
      <div className="space-y-4">
        <SelectInput id="plt" label="血小板数" value={plt} onChange={setPlt} options={[
          { value: '0', label: '0 — ≥ 100,000/μL' },
          { value: '1', label: '1 — 50,000-100,000/μL' },
          { value: '2', label: '2 — < 50,000/μL' },
        ]} />
        <SelectInput id="fdp" label="FDP / D-dimer 上昇" value={fdp} onChange={setFdp} options={[
          { value: '0', label: '0 — 正常範囲' },
          { value: '2', label: '2 — 中等度上昇' },
          { value: '3', label: '3 — 著明上昇' },
        ]} />
        <SelectInput id="pt" label="PT延長" value={pt} onChange={setPt} options={[
          { value: '0', label: '0 — < 3秒延長' },
          { value: '1', label: '1 — 3-6秒延長' },
          { value: '2', label: '2 — > 6秒延長' },
        ]} />
        <SelectInput id="fib" label="フィブリノゲン" value={fib} onChange={setFib} options={[
          { value: '0', label: '0 — ≥ 100 mg/dL' },
          { value: '1', label: '1 — < 100 mg/dL' },
        ]} />
      </div>
    </CalculatorLayout>
  )
}
