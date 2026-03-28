'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('extravasation')!
const categories = [
  { risk: '壊死性 (Vesicant)', color: 'bg-dnl border-dnb', drugs: [
    'ドキソルビシン','ダウノルビシン','エピルビシン','イダルビシン','マイトマイシンC',
    'ビンクリスチン','ビンブラスチン','ビノレルビン','ビンデシン',
    'パクリタキセル(高濃度)','ドセタキセル(高濃度)',
    'アクチノマイシンD','トラベクテジン','メクロレタミン',
  ], action: '即座に投与中止→残液吸引→冷却(アントラサイクリン)/温罨法(ビンカ)→デクスラゾキサン(アントラサイクリン)/ヒアルロニダーゼ(ビンカ)→皮膚科/形成外科コンサルト' },
  { risk: '炎症性 (Irritant)', color: 'bg-wnl border-wnb', drugs: [
    'シスプラチン','カルボプラチン','オキサリプラチン',
    'シクロホスファミド','イホスファミド','ダカルバジン','テモゾロミド(注)',
    'エトポシド','イリノテカン','ゲムシタビン',
    'フルオロウラシル(5-FU)','メトトレキサート','ブレオマイシン',
  ], action: '投与中止→残液吸引→冷却→経過観察。多くは自然軽快するが、大量漏出時は外科コンサルト考慮' },
  { risk: '非壊死性 (Non-vesicant)', color: 'bg-okl border-okb', drugs: [
    'リツキシマブ','トラスツズマブ','ベバシズマブ','ニボルマブ','ペムブロリズマブ',
    'ボルテゾミブ','レナリドミド(注)','アザシチジン',
    'L-アスパラギナーゼ','インターフェロン',
  ], action: '投与中止→経過観察。組織障害は稀。' },
]
export default function ExtravasationPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? categories : categories.filter(c => c.risk.startsWith(filter))
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted"><p>漏出を発見したら①即座に投与中止②可能な限り残液を吸引③リスク分類に応じた対応。写真記録を残す。</p></div>}
      relatedTools={[{slug:'ctcae',name:'CTCAE v5.0'}]}
      references={toolDef.sources||[]}
    >
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[{id:'all',l:'すべて'},{id:'壊死',l:'壊死性'},{id:'炎症',l:'炎症性'},{id:'非壊死',l:'非壊死性'}].map(f=>(
          <button key={f.id} onClick={()=>setFilter(f.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter===f.id?'bg-ac text-white':'bg-s0 border border-br text-muted'}`}>{f.l}</button>
        ))}
      </div>
      {filtered.map((cat,i)=>(
        <div key={i} className={`mb-4 p-4 rounded-xl border ${cat.color}`}>
          <h3 className="text-sm font-bold text-tx mb-2">{cat.risk}</h3>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {cat.drugs.map((d,j)=><span key={j} className="text-xs bg-white/60 px-2 py-0.5 rounded-full text-tx">{d}</span>)}
          </div>
          <p className="text-xs text-tx"><strong>対応:</strong> {cat.action}</p>
        </div>
      ))}
    </CalculatorLayout>
  )
}
