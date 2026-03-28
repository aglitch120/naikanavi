'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('iadl')!
// Lawton 1969原著: 各項目で最高機能選択肢(index 0)のみ1点、それ以外0点
// 男性は食事の準備・家事・洗濯を除く5項目で評価することが多い
const MALE_EXCLUDED = new Set([2, 3, 4]) // 食事の準備・家事・洗濯のインデックス
const items = [
  { name: '電話の使用', options: ['自分で電話できる','決まった番号なら可','電話に出るが自分からかけられない','電話が使えない'] },
  { name: '買い物', options: ['自分で買い物できる','少額の買い物は可','買い物に付き添いが必要','全く買い物不可'] },
  { name: '食事の準備', options: ['自分で計画・準備できる','材料があれば調理できる','温めのみ可','全くできない'] },
  { name: '家事', options: ['自分でできる','軽い家事のみ','軽い家事もできない','家事は全くできない'] },
  { name: '洗濯', options: ['自分でできる','小物のみ','全くできない','—'] },
  { name: '移動', options: ['公共交通/車を使える','タクシーは使える','付き添いがあれば外出可','外出不可'] },
  { name: '服薬管理', options: ['自分で管理できる','1回分準備されれば可','自分では管理不可','—'] },
  { name: '金銭管理', options: ['自分で管理できる','日常の買い物は可','金銭管理不可','—'] },
]
export default function IadlPage() {
  const [sex, setSex] = useState<'male'|'female'>('female')
  const [scores, setScores] = useState(items.map(()=>0))
  const activeItems = useMemo(() => {
    if (sex === 'male') return items.map((item, i) => ({ item, i, active: !MALE_EXCLUDED.has(i) }))
    return items.map((item, i) => ({ item, i, active: true }))
  }, [sex])
  const result = useMemo(() => {
    // 原著(Lawton 1969): 最高機能選択肢(index 0)のみ1点、それ以外0点
    const activeIndices = activeItems.filter(x => x.active).map(x => x.i)
    const total = activeIndices.reduce((a, i) => a + (scores[i] === 0 ? 1 : 0), 0)
    const maxScore = activeIndices.length // 男性5点、女性8点
    let severity: 'ok'|'wn'|'dn' = 'ok'
    const ratio = maxScore > 0 ? total / maxScore : 0
    if (ratio <= 0.375) severity = 'dn'
    else if (ratio <= 0.625) severity = 'wn'
    return { total, maxScore, severity }
  }, [scores, activeItems])
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard severity={result.severity} value={`IADL = ${result.total}/${result.maxScore}`}
        interpretation={`${result.total === result.maxScore ? '完全自立' : result.total <= Math.floor(result.maxScore * 0.375) ? '重度障害' : result.total <= Math.floor(result.maxScore * 0.625) ? '中等度障害' : '軽度障害'} — ${result.maxScore}: 完全自立 / 0: 完全依存`} />}
      explanation={<div className="text-sm text-muted"><p>Lawton IADL（1969）。基本的ADL(Barthel Index)より高次の日常活動を評価。認知機能低下の早期発見に有用。各項目で最高機能選択肢（第1選択肢）のみ1点、それ以外0点。原著では男性は5項目（電話・移動・買い物・服薬・金銭管理）で評価し最大5点、女性は8項目全て評価し最大8点。</p></div>}
      relatedTools={[{slug:'barthel-index',name:'Barthel Index'},{slug:'mmse',name:'MMSE'},{slug:'sarc-f',name:'SARC-F'}]}
      references={toolDef.sources||[]}
    >
      <div className="flex gap-2 mb-4">
        {([['female','女性（8項目）'],['male','男性（5項目）']] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setSex(v)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${sex===v?'bg-ac text-white':'bg-s1 text-muted'}`}>{l}</button>
        ))}
      </div>
      {sex === 'male' && (
        <p className="text-xs text-muted mb-3 p-2 bg-s1 rounded-lg">男性は食事の準備・家事・洗濯の3項目を除く5項目で評価（最大5点）</p>
      )}
      <div className="space-y-4">{activeItems.map(({ item, i, active }) => active && (
        <div key={i}>
          <p className="text-sm font-bold text-tx mb-1.5">{item.name}</p>
          <div className="space-y-1">{item.options.filter(o=>o!=='—').map((opt,j)=>(
            <label key={j} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer ${scores[i]===j?'bg-acl border border-ac/30':'bg-s0 border border-br'}`}>
              <input type="radio" name={`q-${i}`} checked={scores[i]===j} onChange={()=>{const n=[...scores];n[i]=j;setScores(n)}} className="mt-0.5 accent-[var(--ac)]"/>
              <span className="text-xs text-tx">{opt}</span>
            </label>
          ))}</div>
        </div>
      ))}</div>
    </CalculatorLayout>
  )
}
