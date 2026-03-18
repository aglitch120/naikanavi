'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('burn-area')!

const regions = [
  { id: 'head', label: '頭部', adult: 9, child: 18 },
  { id: 'chest', label: '体幹前面（胸腹部）', adult: 18, child: 18 },
  { id: 'back', label: '体幹後面（背部）', adult: 18, child: 18 },
  { id: 'rArm', label: '右上肢', adult: 9, child: 9 },
  { id: 'lArm', label: '左上肢', adult: 9, child: 9 },
  { id: 'rLeg', label: '右下肢', adult: 18, child: 13.5 },
  { id: 'lLeg', label: '左下肢', adult: 18, child: 13.5 },
  { id: 'perineum', label: '会陰部', adult: 1, child: 1 },
]

export default function BurnAreaPage() {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(regions.map(r => [r.id, false]))
  )
  const [isChild, setIsChild] = useState(false)
  const [weight, setWeight] = useState('')

  const result = useMemo(() => {
    const tbsa = regions
      .filter(r => selected[r.id])
      .reduce((sum, r) => sum + (isChild ? r.child : r.adult), 0)
    const w = parseFloat(weight)
    const parkland = w > 0 ? 4 * w * tbsa : null
    const first8h = parkland ? parkland / 2 : null
    return { tbsa, parkland, first8h }
  }, [selected, isChild, weight])

  const severity = result.tbsa >= 30 ? 'dn' as const : result.tbsa >= 15 ? 'wn' as const : 'ok' as const
  const label = result.tbsa >= 30
    ? '重症熱傷（TBSA≧30%）→ 専門施設搬送'
    : result.tbsa >= 15
      ? '中等症熱傷（TBSA 15-29%）→ 大量輸液必要'
      : result.tbsa > 0
        ? '軽症熱傷'
        : '部位を選択してください'

  return (
    <CalculatorLayout
      slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={
        <>
          <ResultCard label="TBSA（9の法則）" value={result.tbsa + '%'} interpretation={label} severity={severity} />
          {result.parkland !== null && (
            <div className="mt-3 p-3 rounded-lg bg-bg border border-br text-sm space-y-1">
              <p className="font-medium text-tx">Parkland公式（初期24h輸液量）</p>
              <p className="text-muted">総量: <span className="font-bold text-tx">{Math.round(result.parkland!)} mL</span>（乳酸リンゲル液）</p>
              <p className="text-muted">最初8h: <span className="font-bold text-wn">{Math.round(result.first8h!)} mL</span>　残り16h: {Math.round(result.first8h!)} mL</p>
              <p className="text-xs text-muted mt-2">※ 尿量0.5-1 mL/kg/h（小児1 mL/kg/h）を目標に調整。受傷時刻から起算。</p>
            </div>
          )}
        </>
      }
      explanation={
        <div className="space-y-6 text-sm text-tx leading-relaxed">
          <div>
            <h2 className="text-lg font-bold mb-2">Wallaceの9の法則とは</h2>
            <p className="text-muted">
              成人の体表面積を9%の倍数で概算する方法です。頭頸部9%、上肢各9%、体幹前面18%、体幹後面18%、下肢各18%、会陰部1%で合計100%になります。
              迅速な初期評価に適していますが、小児や不均一な熱傷では精度が低下します。
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">小児の修正値とLund-Browder法</h3>
            <p className="text-muted">
              小児は頭部の比率が大きく下肢が相対的に小さいため、成人の9の法則をそのまま適用できません。
              本ツールでは頭部18%、下肢各13.5%の小児修正値を使用しています。
              より正確にはLund-Browder法（年齢ごとに体表面積比率を細分化した表）を使用しますが、救急初期評価では本修正値で十分です。
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">手掌法</h3>
            <p className="text-muted">
              患者自身の手掌（指を含む）の面積が体表面積の約1%に相当します。
              散在性や小範囲の熱傷の面積推定に有用です。広範囲熱傷では9の法則の方が実用的です。
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">Parkland（Baxter）公式</h3>
            <div className="bg-s1 rounded-lg p-4 space-y-2 text-muted">
              <p><span className="font-medium text-tx">初期24h輸液量</span> = 4 mL × 体重(kg) × TBSA(%)</p>
              <p><span className="font-medium text-wn">前半8h:</span> 総量の50%（受傷時刻から起算）</p>
              <p><span className="font-medium text-ok">残り16h:</span> 総量の50%</p>
            </div>
            <p className="text-muted mt-2">
              使用液は乳酸リンゲル液。尿量を指標に調整（成人0.5-1 mL/kg/h、小児1 mL/kg/h）。
              コロイドは受傷後24時間以降に考慮します。
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">専門施設搬送基準</h3>
            <div className="bg-s1 rounded-lg p-4 space-y-1 text-muted text-xs">
              <p>・成人 TBSA ≧15%、小児 TBSA ≧10%</p>
              <p>・気道熱傷（顔面熱傷・煤・嗄声・喘鳴）</p>
              <p>・顔面・手・足・会陰・関節部の深達性熱傷</p>
              <p>・Ⅲ度（全層性）熱傷 / 化学熱傷 / 電撃傷</p>
              <p>・基礎疾患を有する患者 / 小児虐待が疑われる場合</p>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">よくある質問</h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium">Q. Ⅰ度熱傷はTBSAに含めますか？</p>
                <p className="text-muted mt-1">
                  いいえ。Parkland公式のTBSAにはⅡ度以上（真皮以深）の熱傷のみを含めます。
                  Ⅰ度（表皮のみ・発赤）は輸液計算から除外します。
                </p>
              </div>
              <div>
                <p className="font-medium">Q. 計算量より多く輸液が必要になる場合は？</p>
                <p className="text-muted mt-1">
                  気道熱傷合併、蘇生遅延、電撃傷、深部組織損傷では必要量が増大します（fluid creep）。
                  尿量モニタリングに基づいて投与速度を30分ごとに調整してください。
                </p>
              </div>
              <div>
                <p className="font-medium">Q. 受傷後すでに数時間経過している場合は？</p>
                <p className="text-muted mt-1">
                  受傷時刻から24時間で計算します。最初の8時間分から既投与量を差し引いて残りを投与します。
                </p>
              </div>
            </div>
          </div>
        </div>
      }
      relatedTools={[]}
      references={[
        { text: 'Wallace AB. The exposure treatment of burns. Lancet 1951;1:501-504' },
        { text: 'Baxter CR, Shires T. Physiological response to crystalloid resuscitation of severe burns. Ann N Y Acad Sci 1968;150:874-894' },
        { text: 'Lund CC, Browder NC. The estimation of areas of burns. Surg Gynecol Obstet 1944;79:352-358' },
        { text: 'American Burn Association. Advanced Burn Life Support Course. 2018' },
        { text: '日本熱傷学会. 熱傷診療ガイドライン 2015' },
      ]}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-bg border border-br">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={isChild} onChange={e => setIsChild(e.target.checked)} className="accent-ac" />
            <span className="text-tx font-medium">小児（修正値を使用）</span>
          </label>
        </div>
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={300} hint="Parkland公式の計算に使用" />
        <p className="text-xs text-muted font-medium">受傷部位を選択（{isChild ? '小児' : '成人'}・9の法則）</p>
        {regions.map(r => (
          <CheckItem
            key={r.id}
            id={r.id}
            label={`${r.label}（${isChild ? r.child : r.adult}%）`}
            checked={selected[r.id]}
            onChange={v => setSelected(p => ({ ...p, [r.id]: v }))}
          />
        ))}
      </div>
    </CalculatorLayout>
  )
}
