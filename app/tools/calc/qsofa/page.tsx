'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('qsofa')!

const criteria = [
  { id: 'mental', label: '意識変容（GCS <15）', sublabel: 'Altered mentation — GCS 14以下', points: 1 },
  { id: 'respiratory', label: '呼吸数 ≥22 回/分', sublabel: 'Respiratory rate', points: 1 },
  { id: 'bp', label: '収縮期血圧 ≤100 mmHg', sublabel: 'Systolic BP', points: 1 },
]

function getInterpretation(score: number): { text: string; severity: 'ok' | 'wn' | 'dn'; recommendation: string } {
  if (score < 2) return {
    text: 'qSOFA 陰性',
    severity: 'ok',
    recommendation: '敗血症の可能性は低いが、感染症が疑われる場合は引き続き経過観察。バイタルの継続モニタリングを検討。',
  }
  return {
    text: 'qSOFA 陽性（≥2点）— 敗血症を疑う',
    severity: 'dn',
    recommendation: 'SOFAスコアによる臓器障害評価を行い、敗血症（Sepsis-3）の診断を進めてください。血液培養採取・乳酸値測定・経験的抗菌薬投与を速やかに検討。',
  }
}

export default function QSOFAPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const result = useMemo(() => {
    const score = criteria.reduce((sum, c) => sum + (checked[c.id] ? c.points : 0), 0)
    return { score, ...getInterpretation(score) }
  }, [checked])

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
            name: 'qSOFA スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/qsofa',
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
              { '@type': 'ListItem', position: 3, name: 'qSOFA', item: 'https://iwor.jp/tools/qsofa' },
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
                name: 'qSOFAとは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'qSOFA（quick SOFA）は感染症が疑われる患者の敗血症スクリーニングツールです。意識変容・呼吸数・血圧の3項目をベッドサイドで迅速に評価し、2点以上で敗血症を疑います。Sepsis-3（2016年）で提唱されました。',
                },
              },
              {
                '@type': 'Question',
                name: 'qSOFAとSOFAの違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'qSOFAは3項目のスクリーニングツール（検査不要）で、SOFAは6臓器系の詳細な臓器障害評価スコア（検査値が必要）です。qSOFA陽性時にSOFAで臓器障害を定量評価する二段階アプローチが示されています。',
                },
              },
              {
                '@type': 'Question',
                name: 'qSOFAが陰性なら敗血症は否定できますか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'いいえ。qSOFAは感度が低い（約50-60%）ため、陰性でも敗血症を除外できません。臨床的に感染症が疑われる場合は、qSOFAに関わらず乳酸値やSOFAスコアで評価してください。qSOFAは「除外ツール」ではなく「警告ツール」です。',
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
          { text: 'Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-810. PMID: 26903338', url: 'https://pubmed.ncbi.nlm.nih.gov/26903338/' },
          { text: 'Seymour CW, et al. Assessment of clinical criteria for sepsis: for the Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):762-774. PMID: 26903335', url: 'https://pubmed.ncbi.nlm.nih.gov/26903335/' },
          { text: 'Freund Y, et al. Prognostic accuracy of sepsis-3 criteria for in-hospital mortality among patients with suspected infection presenting to the emergency department. JAMA. 2017;317(3):301-308. PMID: 28114554', url: 'https://pubmed.ncbi.nlm.nih.gov/28114554/' },
          { text: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock: 2021. Intensive Care Med. 2021;47(11):1181-1247. PMID: 34599691', url: 'https://pubmed.ncbi.nlm.nih.gov/34599691/' },
        ]}
        result={
          <div className="space-y-3">
            <ResultCard
              label="qSOFA スコア"
              value={result.score}
              unit="/ 3点"
              interpretation={result.text}
              severity={result.severity}
            />

            <div className={`${
              result.score >= 2 ? 'bg-dnl border-dnb' : 'bg-s0 border-br'
            } border rounded-xl p-4`}>
              <p className={`text-sm font-medium ${result.score >= 2 ? 'text-dn' : 'text-tx'}`}>
                {result.score >= 2 ? '🚨 次のアクション' : '✅ 参考'}
              </p>
              <p className={`text-xs mt-1 ${result.score >= 2 ? 'text-dn' : 'text-muted'}`}>
                {result.recommendation}
              </p>
            </div>

            {result.score >= 2 && (
              <div className="bg-dnl border border-dnb rounded-xl p-4">
                <p className="text-sm font-medium text-dn">⏱️ Hour-1 Bundle（SSC 2021）</p>
                <div className="text-xs text-dn mt-1 space-y-0.5">
                  <p>□ 乳酸値測定</p>
                  <p>□ 抗菌薬投与前に血液培養2セット採取</p>
                  <p>□ 広域抗菌薬の経験的投与</p>
                  <p>□ 低血圧 or 乳酸≥4 → 30mL/kg 晶質液投与開始</p>
                  <p>□ 輸液後も低血圧持続 → 昇圧剤（MAP≥65目標）</p>
                </div>
                <p className="text-[10px] text-dn/70 mt-2">出典: Surviving Sepsis Campaign 2021; PMID: 34599691</p>
              </div>
            )}
          </div>
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">qSOFAとは</h2>
              <p className="text-muted">
                qSOFA（quick Sequential Organ Failure Assessment）は、2016年のSepsis-3コンセンサスで提唱された
                敗血症のベッドサイドスクリーニングツールです。意識変容（GCS &lt;15）、呼吸数（≥22回/分）、
                収縮期血圧（≤100 mmHg）の3項目をチェックし、2点以上で敗血症を疑います。
                検査なしでバイタルサインのみで評価可能な点が特徴です。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">Sepsis-3の診断フロー</h3>
              <div className="bg-s0 border border-br rounded-lg p-3 text-xs text-muted space-y-1">
                <p>1. 感染症（疑い含む）の患者</p>
                <p>2. qSOFA ≥2点 → 敗血症の可能性あり</p>
                <p>3. SOFAスコアがベースラインから≥2点上昇 → <span className="font-medium text-tx">敗血症と診断</span></p>
                <p>4. 十分な輸液にも関わらず MAP &lt;65 かつ 乳酸 &gt;2 mmol/L → <span className="font-medium text-dn">敗血症性ショック</span></p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">qSOFAの限界と注意点</h3>
              <div className="bg-wnl border border-wnb rounded-lg p-3 text-sm text-wn">
                <p className="font-medium mb-1">⚠️ qSOFA陰性 ≠ 敗血症除外</p>
                <p className="text-xs">
                  qSOFAの感度は約50-60%と報告されており（Freund Y, et al. JAMA 2017; PMID: 28114554）、
                  陰性でも敗血症を除外できません。ICU外でのスクリーニングとして有用ですが、
                  臨床的に敗血症が疑われる場合はqSOFAスコアに関わらずSOFA評価・乳酸値測定を行ってください。
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">SIRSとqSOFAの違い</h3>
              <p className="text-muted">
                従来のSIRS基準（体温、心拍数、呼吸数、白血球数）は感度が高い一方で特異度が低く、
                感染のない患者でも陽性になることが多い点が問題でした。Sepsis-3ではSIRSに代わり
                qSOFA/SOFAが示されていますが、SIRSが完全に不要になったわけではなく、
                施設やガイドラインによってはSIRSも併用されています。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. ICU患者にもqSOFAを使いますか？</p>
                  <p className="text-muted mt-1">
                    qSOFAはICU外（一般病棟・救急外来）でのスクリーニングを想定しています。
                    ICU患者では直接SOFAスコアを用いて臓器障害を評価してください。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. 呼吸数の閾値が22回/分なのはなぜですか？</p>
                  <p className="text-muted mt-1">
                    Sepsis-3のデータ解析（Seymour CW, et al. JAMA 2016; PMID: 26903335）で
                    院内死亡の予測に最も有用なカットオフ値として22回/分が選定されました。
                    SIRSの20回/分より高い閾値が設定されています。
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-2">
          {criteria.map(c => (
            <CheckItem
              key={c.id}
              id={`qsofa-${c.id}`}
              label={c.label}
              sublabel={c.sublabel}
              points={c.points}
              checked={!!checked[c.id]}
              onChange={v => setChecked(prev => ({ ...prev, [c.id]: v }))}
            />
          ))}
        </div>
      </CalculatorLayout>
    </>
  )
}
