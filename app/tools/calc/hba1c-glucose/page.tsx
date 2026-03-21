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
      // 早朝空腹時血糖の推算（日本のデータ: Rohlfing 2002 近似）
      const fasting = 17.4 * a1c - 30.0
      // 食後2時間血糖の推算（概算: eAG × 1.2〜1.3、日本臨床データ参考）
      const postprandial = eag * 1.25

      let interpretation = ''
      let severity: 'ok' | 'wn' | 'dn' = 'ok'
      if (a1c >= 10.0) {
        interpretation = 'コントロール極めて不良 — 治療の見直し・入院管理を検討'
        severity = 'dn'
      } else if (a1c >= 8.0) {
        interpretation = 'コントロール不良 — 治療強化が必要（合併症進行リスク高）'
        severity = 'dn'
      } else if (a1c >= 7.0) {
        interpretation = 'コントロール不十分 — 合併症予防にはHbA1c 7.0%未満が目標'
        severity = 'wn'
      } else if (a1c >= 6.5) {
        interpretation = '糖尿病の診断基準域 — 食事・運動療法の評価、薬物療法の検討'
        severity = 'wn'
      } else if (a1c >= 6.0) {
        interpretation = '境界域（糖尿病予備群） — 生活習慣の改善が示される'
        severity = 'wn'
      } else {
        interpretation = '正常範囲（4.6〜6.2%）'
      }

      return {
        label: '推定平均血糖値 (eAG)',
        value: Math.round(eag).toString(),
        unit: 'mg/dL',
        severity,
        interpretation,
        details: [
          { label: 'ADAG式 eAG', value: `${Math.round(eag)} mg/dL` },
          { label: '推定空腹時血糖', value: `約${Math.round(fasting)} mg/dL` },
          { label: '推定食後2h血糖', value: `約${Math.round(postprandial)} mg/dL` },
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
          method = 'ADAG式（随時血糖 ≈ eAG として推算）'
          break
        case 'postprandial':
          // 食後2h血糖 → eAG ≈ 食後2h / 1.25 → ADAG式
          const eag = glu / 1.25
          estimatedA1c = (eag + 46.7) / 28.7
          method = '食後2h血糖からの推算（eAG換算後ADAG式）'
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

      return {
        label: '推定HbA1c',
        value: estimatedA1c.toFixed(1),
        unit: '%',
        severity,
        interpretation,
        details: [
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
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">HbA1c ↔ 平均血糖値換算とは</h2>
          <p>HbA1c（NGSP値）は過去1〜2ヶ月の平均血糖を反映するマーカーです。ADAG研究（Nathan 2008）のデータに基づき、HbA1cと推定平均血糖値（eAG）を相互変換できます。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">eAG (mg/dL) = 28.7 × HbA1c − 46.7（ADAG式）</p>
          <p className="font-mono bg-bg p-2 rounded text-xs mt-1">HbA1c = (eAG + 46.7) ÷ 28.7</p>
          <h3 className="font-bold text-tx">各血糖値タイプの推算について</h3>
          <p>eAG（推定平均血糖）: ADAG研究に基づく標準的な変換。早朝空腹時血糖: Rohlfing 2002 の回帰式で近似。食後2時間血糖: eAG比で概算（eAG × 1.25）。随時血糖: eAGに近似として計算。</p>
          <h3 className="font-bold text-tx">注意点</h3>
          <p>これらは集団レベルの回帰式であり、個人差があります。貧血・異常Hb・透析・妊娠ではHbA1cと実際の血糖が乖離することがあります。グリコアルブミンや1,5-AGも合わせて評価してください。</p>
        </section>
      }
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
