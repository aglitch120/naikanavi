'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('ciwa-ar')!

// CIWA-Ar 完全版（Sullivan 1989）— 画像の表5準拠
const items = [
  { id: 'nausea', label: '1. 悪心・嘔吐「胃の具合が悪いか」「吐きましたか」', max: 7, options: [
    { label: '0: 悪心・嘔吐なし', value: '0' }, { label: '1: 嘔気を伴わない軽度の悪心', value: '1' },
    { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '4: むかつきを伴った間欠的な悪心', value: '4' },
    { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '7: 持続的な悪心', value: '7' }]},
  { id: 'tremor', label: '2. 振戦（上肢を前方に伸展させ手指を開いた状態で観察）', max: 7, options: [
    { label: '0: 振戦なし', value: '0' }, { label: '1: 軽度（視診で確認できないが指先に触れるとわかる）', value: '1' },
    { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '4: 中等度（上肢伸展で確認できる）', value: '4' },
    { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '7: 高度（上肢を伸ばさなくても確認できる）', value: '7' }]},
  { id: 'sweat', label: '3. 発汗', max: 7, options: [
    { label: '0: 発汗なし', value: '0' }, { label: '1: わずかに発汗が確認できるか手掌が湿っている', value: '1' },
    { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '4: 前頭部に明らかな滴状発汗あり', value: '4' },
    { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '7: 全身の大量発汗', value: '7' }]},
  { id: 'anxiety', label: '4. 不安「不安を感じますか」', max: 7, options: [
    { label: '0: 不安なし、気楽にしている', value: '0' }, { label: '1: 軽い不安を感じている', value: '1' },
    { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '4: 中等度の不安、または警戒しており不安であると推測できる', value: '4' },
    { label: '5', value: '5' }, { label: '6', value: '6' },
    { label: '7: 重篤なせん妄や統合失調症の急性期にみられるようなパニック状態と同程度', value: '7' }]},
  { id: 'agitation', label: '5. 焦燥感', max: 7, options: [
    { label: '0: 行動量の増加なし', value: '0' }, { label: '1: 行動量は普段よりやや増加している', value: '1' },
    { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '4: やや落ち着かず、そわそわしている', value: '4' },
    { label: '5', value: '5' }, { label: '6', value: '6' },
    { label: '7: 面談の大部分でウロウロ歩くか、のたうち回っている', value: '7' }]},
  { id: 'tactile', label: '6. 触覚障害「かゆみ、ピンでつつかれるような感じ、やけつくような感じや感覚がマヒしたり、皮膚に虫が這っているような感じがしますか」', max: 7, options: [
    { label: '0: なし', value: '0' }, { label: '1: 掻痒感・ピンでつつかれる感じ・灼熱感・無感覚のいずれかが非常に軽度にある', value: '1' },
    { label: '2: 上記症状が軽度にある', value: '2' }, { label: '3: 上記症状が中等度にある', value: '3' },
    { label: '4: やや重い体感幻覚（虫這い様感覚）', value: '4' }, { label: '5: 重い体感幻覚', value: '5' },
    { label: '6: 非常に重い体感幻覚', value: '6' }, { label: '7: 持続性体感幻覚', value: '7' }]},
  { id: 'auditory', label: '7. 聴覚障害「まわりの音が気になりますか、それは耳触りですか。そのせいで怖くなることがありますか。不安にさせるような音が聞こえますか」', max: 7, options: [
    { label: '0: なし', value: '0' }, { label: '1: 物音が耳障りか、物音に驚くことがあるが軽度', value: '1' },
    { label: '2: 上記の症状が中等度にある', value: '2' }, { label: '3: 上記の症状が高度にある', value: '3' },
    { label: '4: 軽度の幻聴', value: '4' }, { label: '5: 中等度の幻聴', value: '5' },
    { label: '6: 高度の幻聴', value: '6' }, { label: '7: 持続性の幻聴', value: '7' }]},
  { id: 'visual', label: '8. 視覚障害「光がまぶしすぎますか。光の色が違って見えますか。不安にさせるようなものが見えますか。ここにないはずのものが見えますか」', max: 7, options: [
    { label: '0: なし', value: '0' }, { label: '1: 光に対し非常に軽度に過敏', value: '1' },
    { label: '2: 軽度に過敏', value: '2' }, { label: '3: 中等度に過敏', value: '3' },
    { label: '4: やや重度の幻視', value: '4' }, { label: '5: 重度の幻視', value: '5' },
    { label: '6: 非常に重度の幻視', value: '6' }, { label: '7: 持続性の幻視', value: '7' }]},
  { id: 'headache', label: '9. 頭痛・頭重感（めまい・ふらつきは評価しない）「頭に違和感はありますか。バンドで締め付けられるような感じがしますか」', max: 7, options: [
    { label: '0: なし', value: '0' }, { label: '1: ごく軽度', value: '1' },
    { label: '2: 軽度', value: '2' }, { label: '3: 中等度', value: '3' },
    { label: '4: やや高度', value: '4' }, { label: '5: 高度', value: '5' },
    { label: '6: 非常に高度', value: '6' }, { label: '7: 極めて高度', value: '7' }]},
  { id: 'orientation', label: '10. 見当識・意識障害「今日は何日ですか。ここはどこですか。私は誰ですか」', max: 4, options: [
    { label: '0: 見当識は保たれていて、3つを連続して言うことが出来る', value: '0' },
    { label: '1: 3つを連続して言うことが出来ない。日付があいまい', value: '1' },
    { label: '2: 日付の2日以内の間違い', value: '2' },
    { label: '3: 日付の2日以上の間違い', value: '3' },
    { label: '4: 場所か人に対する失見当識がある', value: '4' }]},
]

export default function CIWAArPage() {
  const [vals, setVals] = useState<Record<string, string>>(Object.fromEntries(items.map(i => [i.id, '0'])))
  const result = useMemo(() => {
    const score = Object.values(vals).reduce((s, v) => s + Number(v), 0)
    // 画像の判定基準: 8-10=薬物投与せず症状モニター / 10-15=BZD投与有効 / 15以上=十分な量のBZD
    if (score >= 20) return { score, severity: 'dn' as const, label: '重症（≧20）— 十分な量のベンゾジアゼピンの使用。振戦せん妄の高リスク' }
    if (score >= 15) return { score, severity: 'dn' as const, label: '中等症〜重症（15-19）— 症状を抑える十分な量のベンゾジアゼピンの使用' }
    if (score >= 10) return { score, severity: 'wn' as const, label: '中等症（10-14）— ベンゾジアゼピン投与が有効である' }
    if (score >= 8) return { score, severity: 'ok' as const, label: '軽症（8-9）— 薬物投与せずに症状をモニターする' }
    return { score, severity: 'ok' as const, label: '軽症（<8）' }
  }, [vals])

  return (
    <CalculatorLayout slug={toolDef.slug} title="CIWA-Ar（アルコール離脱症状重症度判定表）" titleEn="CIWA-Ar (Clinical Institute Withdrawal Assessment for Alcohol - Revised)"
      description="アルコール離脱症状の重症度を10項目で評価。合計最大67点。完全版。"
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="CIWA-Ar" value={result.score} unit="/67点" interpretation={result.label} severity={result.severity} />}
      explanation={<div className="text-sm text-muted"><p className="text-xs text-wn">離脱けいれんの既往のある患者は、離脱症状の重症度にかかわらずベンゾジアゼピンを使用する。</p></div>}
      relatedTools={[{ slug: 'audit', name: 'AUDIT' }, { slug: 'cage', name: 'CAGE' }]}
      references={[{ text: 'Sullivan JT, et al. Assessment of alcohol withdrawal: the revised clinical institute withdrawal assessment for alcohol scale (CIWA-Ar). Br J Addict 1989;84:1353-1357' }]}
    >
      <div className="space-y-4">{items.map(i => <RadioGroup key={i.id} id={i.id} label={i.label} options={i.options} value={vals[i.id]} onChange={v => setVals(p => ({ ...p, [i.id]: v }))} />)}</div>
    </CalculatorLayout>
  )
}
