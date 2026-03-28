'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'

export default function NAFLDFibrosisPage() {
  const [age, setAge] = useState('55')
  const [bmi, setBmi] = useState('28')
  const [diabetes, setDiabetes] = useState(false)
  const [ast, setAst] = useState('45')
  const [alt, setAlt] = useState('60')
  const [plt, setPlt] = useState('18')
  const [albumin, setAlbumin] = useState('3.8')

  const result = useMemo(() => {
    const a = parseFloat(age)
    const b = parseFloat(bmi)
    const astV = parseFloat(ast)
    const altV = parseFloat(alt)
    const pltV = parseFloat(plt)
    const albV = parseFloat(albumin)
    if (!a || !b || !astV || !altV || !pltV || !albV) return null

    // NFS = -1.675 + 0.037 x age + 0.094 x BMI + 1.13 x IFG/diabetes + 0.99 x AST/ALT - 0.013 x PLT - 0.66 x Alb
    // 原著(Angulo 2007)はPLT ×10⁹/L単位。日本は万/μL入力のため×10で変換(18万/μL = 180×10⁹/L)
    const nfs = -1.675 + 0.037 * a + 0.094 * b + (diabetes ? 1.13 : 0) + 0.99 * (astV / altV) - 0.013 * (pltV * 10) - 0.66 * albV
    const rounded = Math.round(nfs * 1000) / 1000

    let category = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (rounded < -1.455) { category = '線維化なし〜軽度（F0-F2）'; severity = 'ok' }
    else if (rounded <= 0.676) { category = '判定不能（indeterminate）'; severity = 'wn' }
    else { category = '進行線維化（F3-F4）'; severity = 'dn' }

    return { nfs: rounded, category, severity }
  }, [age, bmi, diabetes, ast, alt, plt, albumin])

  return (
    <CalculatorLayout
      slug="nafld-fibrosis"
      title="MASLD線維化スコア (NFS)"
      titleEn="MASLD Fibrosis Score (formerly NAFLD)"
      description="代謝機能障害関連脂肪性肝疾患(MASLD、旧NAFLD)における肝線維化の進行度を非侵襲的に評価。肝生検の代替スクリーニング。"
      category="hepatology"
      categoryIcon="🔬"
      result={result && (
        <ResultCard
          label="MASLD線維化スコア"
          value={`${result.nfs}`}
          severity={result.severity}
          details={[
            { label: '判定', value: result.category },
            { label: 'カットオフ', value: '<-1.455: F0-F2（除外） / >0.676: F3-F4（進行線維化）' },
          ]}
        />
      )}
      references={[
        { text: 'Angulo P, et al. The NAFLD fibrosis score: a noninvasive system that identifies liver fibrosis in patients with NAFLD. Hepatology 2007;45:846-54', url: 'https://pubmed.ncbi.nlm.nih.gov/17393509/' },
      ]}
    >
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="年齢" value={age} onChange={setAge} unit="歳" />
        <NumberInput label="BMI" value={bmi} onChange={setBmi} unit="kg/m2" step={0.1} />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={diabetes} onChange={e => setDiabetes(e.target.checked)} className="rounded border-br" />
        <span className="text-tx">糖尿病 or 耐糖能異常</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="AST" value={ast} onChange={setAst} unit="U/L" />
        <NumberInput label="ALT" value={alt} onChange={setAlt} unit="U/L" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="血小板" value={plt} onChange={setPlt} unit="万/uL" step={0.1} />
        <NumberInput label="アルブミン" value={albumin} onChange={setAlbumin} unit="g/dL" step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
