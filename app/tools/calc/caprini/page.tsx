'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('caprini')!

const items1 = [
  { id: 'age41', label: '年齢 41-60歳', points: 1 },
  { id: 'minor_surg', label: '予定小手術', points: 1 },
  { id: 'bmi25', label: 'BMI > 25', points: 1 },
  { id: 'edema', label: '下肢浮腫', points: 1 },
  { id: 'varicose', label: '下肢静脈瘤', points: 1 },
  { id: 'pregnant', label: '妊娠中 or 産後', points: 1 },
  { id: 'hx_abortion', label: '反復流産歴', points: 1 },
  { id: 'oc', label: '経口避妊薬/HRT', points: 1 },
  { id: 'sepsis', label: '敗血症（1ヶ月以内）', points: 1 },
  { id: 'lung', label: '重症肺疾患(含COPD)', points: 1 },
  { id: 'chf', label: '心不全（現在）', points: 1 },
  { id: 'bed', label: '床上安静中', points: 1 },
]
const items2 = [
  { id: 'age61', label: '年齢 61-74歳', points: 2 },
  { id: 'major_surg', label: '大手術（>45分）', points: 2 },
  { id: 'laparoscopy', label: '腹腔鏡手術（>45分）', points: 2 },
  { id: 'cancer', label: '悪性腫瘍（現在or既往）', points: 2 },
  { id: 'immobile', label: '72時間以上の不動', points: 2 },
  { id: 'cast', label: '下肢ギプス固定', points: 2 },
  { id: 'cvc', label: '中心静脈カテーテル', points: 2 },
]
const items3 = [
  { id: 'age75', label: '年齢 ≥ 75歳', points: 3 },
  { id: 'hx_vte', label: 'VTE既往', points: 3 },
  { id: 'fh_vte', label: 'VTE家族歴', points: 3 },
  { id: 'factor5', label: 'Factor V Leiden', points: 3 },
  { id: 'lupus', label: '抗リン脂質抗体', points: 3 },
  { id: 'heparin_hit', label: 'HIT既往', points: 3 },
]
const items5 = [
  { id: 'stroke', label: '脳卒中（1ヶ月以内）', points: 5 },
  { id: 'arthroplasty', label: '関節置換術', points: 5 },
  { id: 'fracture', label: '骨盤・下肢骨折', points: 5 },
  { id: 'sci', label: '脊髄損傷（1ヶ月以内）', points: 5 },
]

export default function CapriniPage() {
  const allItems = [...items1, ...items2, ...items3, ...items5]
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(allItems.map(c => [c.id, false]))
  )
  const result = useMemo(() => {
    const score = allItems.filter(c => checks[c.id]).reduce((s, c) => s + c.points, 0)
    const severity: 'ok'|'wn'|'dn' = score <= 1 ? 'ok' : score <= 4 ? 'wn' : 'dn'
    let label = '', prevention = ''
    if (score <= 0) { label = '最低リスク'; prevention = '早期離床' }
    else if (score <= 2) { label = '低リスク'; prevention = '弾性ストッキング or IPC' }
    else if (score <= 4) { label = '中リスク'; prevention = '薬物的予防（低分子ヘパリン等）' }
    else { label = '高リスク'; prevention = '薬物的予防 + 弾性ストッキング/IPC' }
    return { score, severity, label, prevention }
  }, [checks])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Caprini Score" value={result.score} unit="点" interpretation={result.label} severity={result.severity}
        details={[{ label: '参考予防策', value: result.prevention }]} />}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Caprini スコアとは</h2>
          <p>手術患者のVTE（静脈血栓塞栓症）リスクを多因子で評価するスコアです。リスクに応じた予防策（弾性ストッキング・IPC・薬物的予防）を選択する指針となります。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Caprini JA. Dis Mon 2005;51:70-78' }]}
    >
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted uppercase tracking-wider">1点項目</div>
        <div className="space-y-2">{items1.map(c => <CheckItem key={c.id} id={c.id} label={c.label} points={c.points} checked={checks[c.id]} onChange={v => setChecks(p => ({...p,[c.id]:v}))} />)}</div>
        <div className="text-xs font-medium text-muted uppercase tracking-wider">2点項目</div>
        <div className="space-y-2">{items2.map(c => <CheckItem key={c.id} id={c.id} label={c.label} points={c.points} checked={checks[c.id]} onChange={v => setChecks(p => ({...p,[c.id]:v}))} />)}</div>
        <div className="text-xs font-medium text-muted uppercase tracking-wider">3点項目</div>
        <div className="space-y-2">{items3.map(c => <CheckItem key={c.id} id={c.id} label={c.label} points={c.points} checked={checks[c.id]} onChange={v => setChecks(p => ({...p,[c.id]:v}))} />)}</div>
        <div className="text-xs font-medium text-muted uppercase tracking-wider">5点項目</div>
        <div className="space-y-2">{items5.map(c => <CheckItem key={c.id} id={c.id} label={c.label} points={c.points} checked={checks[c.id]} onChange={v => setChecks(p => ({...p,[c.id]:v}))} />)}</div>
      </div>
    </CalculatorLayout>
  )
}
