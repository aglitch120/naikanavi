'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('cfs')!

const levels = [
  { value: '1', title: '1 — 非常に元気', desc: '活動的、精力的、意欲的。定期的に運動している。同年齢の中で最も元気な部類。' },
  { value: '2', title: '2 — 元気', desc: '活動的だがレベル1ほどではない。時々または季節により活発に運動する。' },
  { value: '3', title: '3 — うまく対処している', desc: '医学的問題はよくコントロールされている。定期的な運動はしていないが、日常的に活動的。' },
  { value: '4', title: '4 — 脆弱（Vulnerable）', desc: '日常生活は自立しているが、活動が制限される。「動きが遅い」「日中に疲れる」などの訴え。' },
  { value: '5', title: '5 — 軽度フレイル', desc: 'IADLの一部（買い物・金銭管理・服薬管理・家事・交通手段等）に援助が必要。' },
  { value: '6', title: '6 — 中等度フレイル', desc: '外出や家事、金銭管理に援助が必要。階段の昇降、入浴にも介助を要することがある。' },
  { value: '7', title: '7 — 重度フレイル', desc: 'ADL全般に依存（身体的または認知的理由）。ただし状態は安定しており6ヶ月以内の死亡リスクは高くない。' },
  { value: '8', title: '8 — 非常に重度のフレイル', desc: '完全に依存状態。終末期に近づいている可能性がある。軽度の疾患でも回復しにくい。' },
  { value: '9', title: '9 — 終末期', desc: '余命6ヶ月未満と推定される。フレイルの程度に関わらず終末期の状態。' },
]

export default function CFSPage() {
  const [val, setVal] = useState('1')
  const v = Number(val)
  const sev = v <= 3 ? 'ok' as const : v <= 5 ? 'wn' as const : 'dn' as const
  const label = v <= 3 ? 'フレイルなし' : v === 4 ? '脆弱（Vulnerable）' : v === 5 ? '軽度フレイル' : v === 6 ? '中等度フレイル' : v <= 8 ? '重度〜非常に重度フレイル' : '終末期'

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="CFS" value={val} unit="/9" interpretation={label} severity={sev} />}
      explanation={<div className="text-sm text-muted"><p>CPC 1-3: フレイルなし / 4: 脆弱 / 5-9: フレイル。Frailty Indexとの相関 r=0.80。</p></div>}
      relatedTools={[{ slug: 'barthel-index', name: 'Barthel Index' }, { slug: 'sarc-f', name: 'SARC-F' }]}
      references={[{ text: 'Rockwood K, et al. A global clinical measure of fitness and frailty in elderly people. CMAJ 2005;173:489-495' }]}
    >
      <div className="space-y-2">
        {levels.map(level => (
          <button key={level.value} onClick={() => setVal(level.value)}
            className={`w-full text-left p-3 rounded-xl border transition-all ${val === level.value ? 'bg-acl border-ac/30' : 'bg-s0 border-br hover:border-ac/20'}`}>
            <p className={`text-sm font-bold ${val === level.value ? 'text-ac' : 'text-tx'}`}>{level.title}</p>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">{level.desc}</p>
          </button>
        ))}
      </div>
    </CalculatorLayout>
  )
}
