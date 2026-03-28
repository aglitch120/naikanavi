'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('hisayama')!
export default function HisayamaPage() {
  const [age, setAge] = useState('60')
  const [sex, setSex] = useState<'male'|'female'>('male')
  const [sbp, setSbp] = useState('140')
  const [dm, setDm] = useState(false)
  const [smoke, setSmoke] = useState(false)
  const [af, setAf] = useState(false)
  const [lv, setLv] = useState(false)
  const result = useMemo(() => {
    const a = parseInt(age), s = parseInt(sbp)
    if (!a || !s) return null
    // 簡易推算（久山町スコアの概略。正確な係数はガイドライン参照）
    let score = 0
    if (a >= 75) score += 10; else if (a >= 65) score += 7; else if (a >= 55) score += 4
    if (s >= 160) score += 6; else if (s >= 140) score += 3; else if (s >= 130) score += 1
    if (dm) score += 3
    if (smoke) score += 2
    if (af) score += 4
    if (lv) score += 3
    if (sex === 'male') score += 2
    let severity: 'ok'|'wn'|'dn' = 'ok', risk = ''
    if (score >= 15) { risk = '高リスク（10年発症率 >10%）'; severity = 'dn' }
    else if (score >= 8) { risk = '中リスク'; severity = 'wn' }
    else { risk = '低リスク' }
    return { score, risk, severity }
  }, [age, sex, sbp, dm, smoke, af, lv])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result ? <ResultCard severity={result.severity} value={`スコア = ${result.score}点`}
        interpretation={`${result.risk}\n\n※非公式の簡易計算です。正確な評価にはガイドラインのリスクチャートを参照してください。\n※ これは簡易推算版です。正確な久山町スコアは動脈硬化性疾患予防ガイドライン2022年版のリスクチャートを参照してください。`} /> : null}
      explanation={<div className="text-sm text-muted"><p>日本人コホート（久山町研究）に基づく脳卒中・冠動脈疾患の10年リスク評価。吹田スコアと並ぶ日本人向け指標。</p></div>}
      relatedTools={[{slug:'suita-score',name:'吹田スコア'},{slug:'ascvd',name:'10年ASCVD'},{slug:'framingham',name:'フラミンガム'}]}
      references={toolDef.sources||[]}
    >
      <div className="flex gap-2 mb-3">
        <button onClick={()=>setSex('male')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${sex==='male'?'bg-ac text-white':'bg-s1 text-muted'}`}>男性</button>
        <button onClick={()=>setSex('female')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${sex==='female'?'bg-ac text-white':'bg-s1 text-muted'}`}>女性</button>
      </div>
      <NumberInput label="年齢" value={age} onChange={setAge} />
      <NumberInput label="収縮期血圧 (mmHg)" value={sbp} onChange={setSbp} />
      <div className="space-y-2 mt-2">
        {[{v:dm,s:setDm,l:'糖尿病'},{v:smoke,s:setSmoke,l:'喫煙'},{v:af,s:setAf,l:'心房細動'},{v:lv,s:setLv,l:'左室肥大'}].map(({v,s,l})=>(
          <label key={l} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer ${v?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
            <input type="checkbox" checked={v} onChange={()=>s(!v)} className="accent-[var(--ac)]"/>
            <span className="text-sm text-tx">{l}</span>
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
