'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('hba1c-glucose')!

export default function HbA1cGlucosePage() {
  const [direction, setDirection] = useState<'a1cToGlucose' | 'glucoseToA1c'>('a1cToGlucose')
  const [hba1c, setHba1c] = useState('7.0')
  const [glucose, setGlucose] = useState('154')
  const [glucoseType, setGlucoseType] = useState<'eag' | 'fasting' | 'random' | 'postprandial'>('eag')

  const result = useMemo(() => {
    if (direction === 'a1cToGlucose') {
      const a1c = parseFloat(hba1c)
      if (!a1c || a1c < 3 || a1c > 20) return null

      // ADAG Study (Nathan 2008): eAG (mg/dL) = 28.7 × HbA1c - 46.7
      const eag = 28.7 * a1c - 46.7

      let interpretation = ''
      let severity: 'ok' | 'wn' | 'dn' = 'ok'
      if (a1c >= 10.0) {
        interpretation = 'コントロール極めて不良 — 治療方針は担当医が判断'
        severity = 'dn'
      } else if (a1c >= 8.0) {
        interpretation = 'コントロール不良（合併症進行リスク高）'
        severity = 'dn'
      } else if (a1c >= 7.0) {
        interpretation = 'コントロール不十分 — 合併症予防にはHbA1c 7.0%未満が目標'
        severity = 'wn'
      } else if (a1c >= 6.5) {
        interpretation = '糖尿病型の可能性（HbA1c ≧6.5%） — 確定診断には血糖検査との組み合わせまたは再検が必要'
        severity = 'wn'
      } else if (a1c >= 6.0) {
        interpretation = '境界域（糖尿病予備群に相当する値）'
        severity = 'wn'
      } else {
        interpretation = '正常範囲（4.6〜6.0%未満）'
      }

      return {
        label: '推定平均血糖値 (eAG)',
        value: Math.round(eag).toString(),
        unit: 'mg/dL',
        severity,
        interpretation,
        details: [
          { label: '計算式', value: 'eAG(mg/dL) = 28.7 × HbA1c − 46.7（ADAG Study, Nathan 2008）' },
          { label: 'ADAG式 eAG', value: `${Math.round(eag)} mg/dL` },
          { label: 'HbA1c目標（一般）', value: '< 7.0%' },
        ],
      }
    } else {
      const glu = parseFloat(glucose)
      if (!glu || glu < 30 || glu > 600) return null

      let estimatedA1c: number
      let method = ''

      switch (glucoseType) {
        case 'eag':
          // ADAG逆算: HbA1c = (eAG + 46.7) / 28.7
          estimatedA1c = (glu + 46.7) / 28.7
          method = 'ADAG式（eAG → HbA1c）'
          break
        case 'fasting':
          // Rohlfing近似逆算: HbA1c = (FPG + 30.0) / 17.4
          estimatedA1c = (glu + 30.0) / 17.4
          method = '空腹時血糖からの推算（Rohlfing近似）'
          break
        case 'random':
          // 随時血糖は eAG に近似として ADAG式で計算
          estimatedA1c = (glu + 46.7) / 28.7
          method = 'ADAG式（随時血糖 ≈ eAG として推算）※科学的根拠が限定的な近似計算。空腹時血糖での換算を推奨'
          break
        case 'postprandial':
          // 食後2h血糖 → eAG ≈ 食後2h / 1.25 → ADAG式
          const eag = glu / 1.25
          estimatedA1c = (eag + 46.7) / 28.7
          method = '食後2h血糖からの推算（eAG換算後ADAG式）※科学的根拠が限定的な近似計算。空腹時血糖での換算を推奨'
          break
        default:
          return null
      }

      let interpretation = ''
      let severity: 'ok' | 'wn' | 'dn' = 'ok'
      if (estimatedA1c >= 8.0) {
        interpretation = '推定HbA1c 8%以上 — コントロール不良域'
        severity = 'dn'
      } else if (estimatedA1c >= 7.0) {
        interpretation = '推定HbA1c 7%以上 — 合併症予防目標を超過'
        severity = 'wn'
      } else if (estimatedA1c >= 6.5) {
        interpretation = '推定HbA1c 6.5%以上 — 糖尿病診断基準域'
        severity = 'wn'
      } else {
        interpretation = '推定HbA1c 正常〜境界域'
      }

      // 計算式の説明文
      let formula = ''
      if (glucoseType === 'eag') formula = 'HbA1c = (eAG + 46.7) / 28.7（ADAG逆算）'
      else if (glucoseType === 'fasting') formula = 'HbA1c = (FPG + 30.0) / 17.4（Rohlfing 2002近似）'
      else if (glucoseType === 'random') formula = 'HbA1c = (随時血糖 + 46.7) / 28.7（随時≈eAG近似）'
      else formula = 'eAG = 食後2h血糖/1.25 → HbA1c = (eAG+46.7)/28.7'

      return {
        label: '推定HbA1c',
        value: estimatedA1c.toFixed(1),
        unit: '%',
        severity,
        interpretation,
        details: [
          { label: '計算式', value: formula },
          { label: '算出方法', value: method },
          { label: 'HbA1c目標（一般）', value: '< 7.0%' },
        ],
      }
    }
  }, [direction, hba1c, glucose, glucoseType])

  return (
    <CalculatorLayout
      slug={toolDef.slug}
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard
          label={result.label}
          value={result.value}
          unit={result.unit}
          interpretation={result.interpretation}
          severity={result.severity}
          details={result.details}
        />
      )}
      explanation={<div className="text-sm text-muted space-y-1">
        <p className="text-xs font-bold text-tx">使用している計算式:</p>
        <p className="text-xs">① eAG(mg/dL) = 28.7 × HbA1c − 46.7（ADAG Study: Nathan DM, Diabetes Care 2008）</p>
        <p className="text-xs">② HbA1c = (FPG + 30.0) / 17.4（空腹時血糖 近似: Rohlfing CL, Diabetes Care 2002）</p>
        <p className="text-xs text-wn">③④ 随時血糖・食後血糖からの換算は科学的根拠が限定的。①②での換算を推奨。貧血・異常Hb・透析・妊娠ではHbA1cと実際の血糖が乖離する。</p>
      </div>}
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Nathan DM, et al. Translating the A1C assay into estimated average glucose values. Diabetes Care 2008;31:1473-1478' },
        { text: 'Rohlfing CL, et al. Defining the relationship between plasma glucose and HbA1c. Diabetes Care 2002;25:275-278' },
        { text: '日本糖尿病学会. 糖尿病治療ガイド 2022-2023' },
      ]}
    >
      <div className="space-y-4">
        {/* 変換方向の切り替え */}
        <div>
          <label className="block text-sm font-medium text-tx mb-1.5">変換方向</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection('a1cToGlucose')}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                direction === 'a1cToGlucose'
                  ? 'bg-primary text-white'
                  : 'bg-s0 border border-br text-tx hover:bg-bg'
              }`}
            >
              HbA1c → 血糖値
            </button>
            <button
              type="button"
              onClick={() => setDirection('glucoseToA1c')}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                direction === 'glucoseToA1c'
                  ? 'bg-primary text-white'
                  : 'bg-s0 border border-br text-tx hover:bg-bg'
              }`}
            >
              血糖値 → HbA1c
            </button>
          </div>
        </div>

        {direction === 'a1cToGlucose' ? (
          <NumberInput
            id="hba1c"
            label="HbA1c (NGSP)"
            unit="%"
            value={hba1c}
            onChange={setHba1c}
            min={3}
            max={20}
            step={0.1}
          />
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-tx mb-1.5">血糖値のタイプ</label>
              <select
                value={glucoseType}
                onChange={e => setGlucoseType(e.target.value as typeof glucoseType)}
                className="w-full rounded-lg border border-br bg-s0 px-3 py-2.5 text-sm text-tx focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="eag">平均血糖 (eAG)</option>
                <option value="fasting">早朝空腹時血糖</option>
                <option value="random">随時血糖</option>
                <option value="postprandial">食後2時間血糖</option>
              </select>
            </div>
            <NumberInput
              id="glucose"
              label="血糖値"
              unit="mg/dL"
              value={glucose}
              onChange={setGlucose}
              min={30}
              max={600}
              step={1}
            />
          </>
        )}
      </div>
    </CalculatorLayout>
  )
}
