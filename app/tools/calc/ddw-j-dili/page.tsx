'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ddw-j-dili')!
const items = [
  { name: '① 発症までの期間', options: [
    { l: '初回投与: 5-90日 / 再投与: 1-15日', s: 2 },
    { l: '初回投与: <5日 or >90日 / 再投与: >15日', s: 1 },
    { l: '判定不能', s: 0 },
  ]},
  { name: '② 薬物中止後の経過', options: [
    { l: '8日以内にALT50%以上低下(肝細胞型) / 180日以内にALP50%低下(胆汁型)', s: 3 },
    { l: '30日以内にALT50%以上低下', s: 2 },
    { l: '判定不能 or 30日以降に低下', s: 1 },
    { l: '低下しない or 上昇', s: -2 },
  ]},
  { name: '③ 危険因子', options: [
    { l: 'あり（アルコール・妊娠など）', s: 1 },
    { l: 'なし', s: 0 },
  ]},
  { name: '④ 薬物以外の原因', options: [
    { l: 'すべて除外', s: 2 },
    { l: '6因子中4-5因子除外', s: 1 },
    { l: '6因子中3因子以下除外', s: 0 },
    { l: '薬物以外の原因が疑われる', s: -3 },
  ]},
  { name: '⑤ 過去の肝障害報告', options: [
    { l: 'あり', s: 1 },
    { l: 'なし or 不明', s: 0 },
  ]},
  { name: '⑥ 好酸球増多(6%以上)', options: [
    { l: 'あり', s: 1 },
    { l: 'なし', s: 0 },
  ]},
  { name: '⑦ DLST', options: [
    { l: '陽性', s: 2 },
    { l: '擬陽性', s: 1 },
    { l: '陰性 or 未施行', s: 0 },
  ]},
  { name: '⑧ 偶然の再投与で再発', options: [
    { l: 'あり', s: 3 },
    { l: 'なし or 不明', s: 0 },
  ]},
]
export default function DdwjDiliPage() {
  const [scores, setScores] = useState(items.map(()=>0))
  const result = useMemo(() => {
    const total = scores.reduce((a,b)=>a+b,0)
    let severity: 'ok'|'wn'|'dn' = 'ok', interpretation = ''
    if (total >= 6) { interpretation = `${total}点 — 可能性が高い (highly probable)`; severity = 'dn' }
    else if (total >= 4) { interpretation = `${total}点 — 可能性あり (probable)`; severity = 'wn' }
    else if (total >= 2) { interpretation = `${total}点 — 否定できない (possible)`; severity = 'wn' }
    else { interpretation = `${total}点 — 可能性が低い (unlikely)` }
    return { total, severity, interpretation }
  }, [scores])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`DDW-J = ${result.total}点`} interpretation={result.interpretation} />}
      explanation={<div className="text-sm text-muted"><p>まずR ratioで肝細胞障害型/胆汁うっ滞型/混合型を分類してからスコアリング。</p><p>※2023年にRECAM-Jが後継として公表。新規評価ではRECAM-Jも参照。</p></div>}
      relatedTools={[{slug:'r-ratio',name:'R ratio'},{slug:'recam-j',name:'RECAM-J'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-4">{items.map((item,i)=>(
        <div key={i}>
          <p className="text-sm font-bold text-tx mb-1.5">{item.name}</p>
          <div className="space-y-1">{item.options.map((opt,j)=>(
            <label key={j} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all ${scores[i]===opt.s?'bg-acl border border-ac/30':'bg-s0 border border-br hover:border-ac/20'}`}>
              <input type="radio" name={`q-${i}`} checked={scores[i]===opt.s} onChange={()=>{const ns=[...scores];ns[i]=opt.s;setScores(ns)}} className="mt-0.5 accent-[var(--ac)]"/>
              <span className="text-xs text-tx">{opt.l} <span className="text-muted">({opt.s>0?'+':''}{opt.s})</span></span>
            </label>
          ))}</div>
        </div>
      ))}</div>
    </CalculatorLayout>
  )
}
