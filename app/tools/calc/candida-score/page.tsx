'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('candida-score')!

// León C, et al. Crit Care Med 2006 — 回帰係数と簡易整数スコア
const items = [
  { id: 'colonization', label: '複数部位のCandida定着（≧2箇所）', coef: 1.112, points: 1 },
  { id: 'surgery', label: '手術後', coef: 0.997, points: 1 },
  { id: 'sepsis', label: '重症敗血症', coef: 2.038, points: 2 },
  { id: 'tpn', label: '非経口栄養法（高カロリー輸液）', coef: 0.908, points: 1 },
]

export default function CandidaScorePage() {
  const [checks, setChecks] = useState<Record<string, boolean>>(Object.fromEntries(items.map(i => [i.id, false])))
  const result = useMemo(() => {
    const score = items.filter(i => checks[i.id]).reduce((s, i) => s + i.points, 0)
    // カットオフ >2.5（整数スコアでは≧3）
    if (score >= 3) return { score, severity: 'dn' as const, label: 'Candidaスコア ≧3（カットオフ >2.5）: 早期抗真菌薬治療の開始を検討' }
    return { score, severity: 'ok' as const, label: 'Candidaスコア <3: 侵襲性カンジダ症の発生率 <5%（ICU 1週間以上の場合）' }
  }, [checks])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="Candida Score" value={result.score} unit="/5点" interpretation={result.label} severity={result.severity}
        details={[{ label: '感度/特異度', value: 'カットオフ>2.5: 感度81%, 特異度74%' }]} />}
      explanation={
        <div className="space-y-2 text-sm text-muted">
          <div className="bg-wnl border border-wnb rounded-xl p-3 space-y-1">
            <p className="text-xs font-medium text-wn">適用対象・注意</p>
            <p className="text-xs text-wn">対象: 非好中球減少の重症ICU患者（7日以上入院）。好中球減少患者は対象外。</p>
            <p className="text-xs text-wn">中心静脈カテーテル使用はカンジダ感染の有意なリスク因子ではない。</p>
            <p className="text-xs text-wn">特異度を欠くため、β-Dグルカン等の血清診断や重症度を含めた総合判断が必要。</p>
          </div>
        </div>
      }
      relatedTools={[]} references={[{ text: 'León C, et al. A bedside scoring system (Candida score) for early antifungal treatment in nonneutropenic critically ill patients with Candida colonization. Crit Care Med 2006;34:730-737' }]}
    >
      <div className="space-y-2">{items.map(i => <CheckItem key={i.id} id={i.id} label={`${i.label} (+${i.points}点)`} sublabel={`回帰係数: ${i.coef}`} checked={checks[i.id]} onChange={v => setChecks(p => ({ ...p, [i.id]: v }))} />)}</div>
    </CalculatorLayout>
  )
}
