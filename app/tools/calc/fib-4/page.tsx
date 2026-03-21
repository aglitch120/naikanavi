'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('fib-4')!

function calcFIB4(age: number, ast: number, alt: number, plt: number): number {
  // FIB-4 = (Age × AST) / (PLT × √ALT)
  return (age * ast) / (plt * Math.sqrt(alt))
}

function getInterpretation(fib4: number): { text: string; severity: 'ok' | 'wn' | 'dn'; fibrosis: string; recommendation: string } {
  if (fib4 < 1.3) return {
    text: '低リスク（F0-F1）',
    severity: 'ok',
    fibrosis: '進行した線維化の可能性は低い（NPV 90%以上）',
    recommendation: '経過観察。原因疾患の治療を継続し、1-3年後に再評価。',
  }
  if (fib4 <= 2.67) return {
    text: '中間リスク（判定保留）',
    severity: 'wn',
    fibrosis: '線維化の程度が不確定',
    recommendation: 'エラストグラフィ（FibroScan等）またはELFテストによる追加評価を検討。',
  }
  return {
    text: '高リスク（F3-F4）',
    severity: 'dn',
    fibrosis: '進行した線維化（F3-F4）の可能性が高い（PPV 65%以上）',
    recommendation: '肝臓専門医への紹介を検討。肝生検・エラストグラフィ・画像評価を検討。肝硬変合併症のスクリーニングも必要。',
  }
}

export default function FIB4Page() {
  const [age, setAge] = useState('55')
  const [ast, setAst] = useState('45')
  const [alt, setAlt] = useState('50')
  const [plt, setPlt] = useState('15')

  const result = useMemo(() => {
    const a = parseFloat(age)
    const s = parseFloat(ast)
    const l = parseFloat(alt)
    const p = parseFloat(plt)
    if (isNaN(a) || isNaN(s) || isNaN(l) || isNaN(p) || a <= 0 || s <= 0 || l <= 0 || p <= 0) return null
    const fib4 = calcFIB4(a, s, l, p)
    return { fib4: Math.round(fib4 * 100) / 100, ...getInterpretation(fib4) }
  }, [age, ast, alt, plt])

  const relatedTools = toolDef.relatedSlugs
    .map(slug => getToolBySlug(slug))
    .filter((t): t is NonNullable<typeof t> => t !== undefined && implementedTools.has(t.slug))
    .map(t => ({ slug: t.slug, name: t.name }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalWebPage',
            name: 'FIB-4 index 計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/fib-4',
            audience: { '@type': 'MedicalAudience', audienceType: 'Clinician' },
            lastReviewed: '2026-03-15',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://iwor.jp' },
              { '@type': 'ListItem', position: 2, name: '臨床計算ツール', item: 'https://iwor.jp/tools' },
              { '@type': 'ListItem', position: 3, name: 'FIB-4 index', item: 'https://iwor.jp/tools/fib-4' },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'FIB-4 indexとは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'FIB-4 indexは肝線維化の進行度を非侵襲的に評価するスコアです。年齢・AST・ALT・血小板数の4項目から計算し、肝生検なしで進行した線維化（F3-F4）をスクリーニングできます。NAFLD/MASLDやC型肝炎の評価に広く使用されています。',
                },
              },
              {
                '@type': 'Question',
                name: 'FIB-4のカットオフ値は？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '一般的に <1.3 は進行線維化の可能性が低く（低リスク）、>2.67 は進行線維化の可能性が高い（高リスク）とされます。1.3-2.67 は中間（グレーゾーン）で追加検査が示されます。65歳以上では >2.0 をカットオフとする提案もあります。',
                },
              },
              {
                '@type': 'Question',
                name: 'FIB-4とNAFLD fibrosis scoreの違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'FIB-4は4変数（年齢・AST・ALT・血小板）で簡便に計算でき、NAFLD fibrosis scoreは6変数（+ BMI・血糖/糖尿病・アルブミン）でより詳細な評価が可能です。FIB-4が第一段階のスクリーニング、NFS/エラストグラフィが追加評価として位置づけられています。',
                },
              },
            ],
          }),
        }}
      />

      <CalculatorLayout
        slug={toolDef.slug}
      title={toolDef.name}
        titleEn={toolDef.nameEn}
        description={toolDef.description}
        category={categoryLabels[toolDef.category]}
        categoryIcon={categoryIcons[toolDef.category]}
        relatedTools={relatedTools}
        references={[
          { text: 'Sterling RK, et al. Development of a simple noninvasive index to predict significant fibrosis in patients with HIV/HCV coinfection. Hepatology. 2006;43(6):1317-1325. PMID: 16729309', url: 'https://pubmed.ncbi.nlm.nih.gov/16729309/' },
          { text: 'Shah AG, et al. Comparison of noninvasive markers of fibrosis in patients with nonalcoholic fatty liver disease. Clin Gastroenterol Hepatol. 2009;7(10):1104-1112. PMID: 19523535', url: 'https://pubmed.ncbi.nlm.nih.gov/19523535/' },
          { text: 'McPherson S, et al. Age as a confounding factor for the accurate non-invasive diagnosis of advanced NAFLD fibrosis. Am J Gastroenterol. 2017;112(5):740-751. PMID: 27725647', url: 'https://pubmed.ncbi.nlm.nih.gov/27725647/' },
          { text: 'European Association for the Study of the Liver. EASL Clinical Practice Guidelines on non-invasive tests for evaluation of liver disease severity and prognosis — 2021 update. J Hepatol. 2021;75(3):659-689. PMID: 34166721', url: 'https://pubmed.ncbi.nlm.nih.gov/34166721/' },
        ]}
        result={
          result ? (
            <div className="space-y-3">
              <ResultCard
                label="FIB-4 index"
                value={result.fib4}
                unit=""
                interpretation={result.text}
                severity={result.severity}
              />
              <p className="text-[10px] text-muted px-1">カットオフ値: Sterling RK, et al. Hepatology 2006; PMID: 16729309 / Shah AG, et al. Clin Gastroenterol Hepatol 2009; PMID: 19523535</p>

              <div className="bg-s0 border border-br rounded-xl p-4">
                <p className="text-sm font-medium text-tx mb-1">線維化の評価</p>
                <p className="text-xs text-muted">{result.fibrosis}</p>
              </div>

              <div className={`${
                result.severity === 'dn' ? 'bg-dnl border-dnb' : result.severity === 'wn' ? 'bg-wnl border-wnb' : 'bg-s0 border-br'
              } border rounded-xl p-4`}>
                <p className={`text-sm font-medium ${
                  result.severity === 'dn' ? 'text-dn' : result.severity === 'wn' ? 'text-wn' : 'text-tx'
                }`}>
                  {result.severity === 'dn' ? '🏥' : result.severity === 'wn' ? '⚡' : '✅'} 参考アクション
                </p>
                <p className={`text-xs mt-1 ${
                  result.severity === 'dn' ? 'text-dn' : result.severity === 'wn' ? 'text-wn' : 'text-muted'
                }`}>
                  {result.recommendation}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-s0 border border-br rounded-xl p-4 text-center">
              <p className="text-sm text-muted">年齢・AST・ALT・血小板数を入力してください</p>
            </div>
          )
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">FIB-4 indexとは</h2>
              <p className="text-muted">
                FIB-4 indexは、肝線維化の進行度を年齢・AST・ALT・血小板数の4項目から非侵襲的に評価するスコアです。
                2006年にSterlingらがHIV/HCV共感染患者で開発し（Hepatology 2006; PMID: 16729309）、
                その後NAFLD/MASLDやアルコール性肝疾患でも広く検証されています。
                EASLガイドライン（2021）では、プライマリケアでの肝線維化スクリーニングの第一選択として示されています。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">計算式</h3>
              <div className="bg-s0 border border-br rounded-lg p-3">
                <p className="text-xs font-mono text-muted">
                  FIB-4 = (年齢 [歳] × AST [U/L]) / (血小板数 [10⁹/L] × √ALT [U/L])
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">カットオフ値と臨床的意義</h3>
              <div className="space-y-2 text-muted">
                <p><span className="font-medium text-tx">&lt;1.3（低リスク）：</span>進行線維化（F3-F4）の陰性的中率 90%以上。追加検査不要。原因疾患の治療を継続し、定期的に再評価。</p>
                <p><span className="font-medium text-tx">1.3-2.67（中間）：</span>グレーゾーン。エラストグラフィ（FibroScan: LSM）やELFテストで追加評価を検討。</p>
                <p><span className="font-medium text-tx">&gt;2.67（高リスク）：</span>進行線維化（F3-F4）の陽性的中率 65%以上。肝臓専門医への紹介を検討。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">年齢による注意</h3>
              <div className="bg-wnl border border-wnb rounded-lg p-3 text-sm text-wn">
                <p>
                  FIB-4は年齢が分子に含まれるため、高齢者（65歳以上）では偽陽性が増加します。
                  McPhersonら（Am J Gastroenterol 2017; PMID: 27725647）は、65歳以上では低リスクのカットオフを &lt;2.0 に引き上げることを提案しています。
                  35歳未満の若年者では感度が低下する可能性があります。
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. 血小板数の単位は？</p>
                  <p className="text-muted mt-1">
                    本ツールでは ×10⁹/L（= ×10³/μL = 万/μL × 10）で入力してください。
                    例：血小板 15万/μL = 150 × 10⁹/L → 「150」と入力。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. FIB-4はどの肝疾患に使えますか？</p>
                  <p className="text-muted mt-1">
                    NAFLD/MASLD、C型肝炎、B型肝炎、アルコール性肝疾患で広く検証されています。
                    ただし急性肝炎や肝外疾患による血小板低下（ITPなど）がある場合は信頼性が低下します。
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <NumberInput id="fib4-age" label="年齢" unit="歳" value={age} onChange={setAge} hint="例: 55" min={18} max={100} step={1} />
          <NumberInput id="fib4-ast" label="AST (GOT)" unit="U/L" value={ast} onChange={setAst} hint="例: 45" min={1} max={5000} step={1} />
          <NumberInput id="fib4-alt" label="ALT (GPT)" unit="U/L" value={alt} onChange={setAlt} hint="例: 38" min={1} max={5000} step={1} />
          <NumberInput id="fib4-plt" label="血小板数" unit="×10⁹/L" value={plt} onChange={setPlt} hint="例: 150（15万/μL = 150）" min={1} max={1000} step={1} />
        </div>
      </CalculatorLayout>
    </>
  )
}
