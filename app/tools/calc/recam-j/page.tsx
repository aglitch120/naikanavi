'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('recam-j')!

export default function RecamjPage() {
  const [altVal, setAltVal] = useState('')
  const [altUln, setAltUln] = useState('40')
  const [alpVal, setAlpVal] = useState('')
  const [alpUln, setAlpUln] = useState('340')

  const classification = useMemo(() => {
    const alt = parseFloat(altVal), altU = parseFloat(altUln), alp = parseFloat(alpVal), alpU = parseFloat(alpUln)
    if (!alt || !altU || !alp || !alpU) return null
    const r = (alt / altU) / (alp / alpU)
    if (r >= 5) return { type: '肝細胞障害型', r: r.toFixed(1) }
    if (r <= 2) return { type: '胆汁うっ滞型', r: r.toFixed(1) }
    return { type: '混合型', r: r.toFixed(1) }
  }, [altVal, altUln, alpVal, alpUln])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={classification ? (
        <div className="space-y-2">
          <ResultCard severity="wn" value={`R ratio = ${classification.r}`} interpretation={classification.type} details={[
            { label: '分類基準', value: 'R≧5: 肝細胞障害型 / R≦2: 胆汁うっ滞型 / 2<R<5: 混合型' },
          ]} />
          <p className="text-xs text-muted px-1">R ratioで病型を判定後、病型別のRECAM-Jスコアリングシートで評価してください</p>
        </div>
      ) : null}
      explanation={<div className="space-y-3 text-sm text-muted">
        <p><strong className="text-tx">RECAM-J 2023</strong>: DDW-J 2004の後継。RUCAMの改良版（RECAM）を日本向けに修正。肝細胞障害型と胆汁うっ滞/混合型で別のスコアリングシートを使用。</p>
        <div className="bg-s0 p-3 rounded-lg border border-br">
          <p className="font-bold text-tx mb-1">スコアリング項目（共通）</p>
          <p>① 発症様式と時間経過 ② 中止後の経過 ③ 他原因の除外 ④ 薬剤情報 ⑤ 再投与の結果</p>
        </div>
        <div className="bg-s0 p-3 rounded-lg border border-br">
          <p className="font-bold text-tx mb-1">判定</p>
          <p>≧9: 極めて高い / 6-8: 高い / 3-5: あり得る / 1-2: 低い / ≦0: 除外的</p>
        </div>
        <p className="text-wn bg-wnl p-2 rounded-lg border border-wnb">※ 完全なスコアリングシートは日本肝臓学会のRECAM-J原著を参照してください。著作権に配慮し、ここではR ratio算出と構造の概要を記載しています。</p>
      </div>}
      relatedTools={[{slug:'r-ratio',name:'R ratio'},{slug:'ddw-j-dili',name:'DDW-J 2004'},{slug:'child-pugh',name:'Child-Pugh'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-4">
        <p className="text-xs font-bold text-tx">Step 1: R ratio算出（病型分類）</p>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="ALT実測値" value={altVal} onChange={setAltVal} unit="U/L" />
          <NumberInput label="ALT正常上限" value={altUln} onChange={setAltUln} unit="U/L" hint="施設の上限値" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="ALP実測値" value={alpVal} onChange={setAlpVal} unit="U/L" />
          <NumberInput label="ALP正常上限" value={alpUln} onChange={setAlpUln} unit="U/L" hint="施設の上限値" />
        </div>
      </div>
    </CalculatorLayout>
  )
}
