'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('child-vital')!

const ageGroups = [
  { value: 'newborn', label: '新生児（0-28日）', hr: '120-160', sbp: '60-76', rr: '30-60', weight: '3-4 kg' },
  { value: 'infant1', label: '乳児（1-6ヶ月）', hr: '100-150', sbp: '70-90', rr: '30-50', weight: '4-8 kg' },
  { value: 'infant2', label: '乳児（6-12ヶ月）', hr: '90-130', sbp: '80-100', rr: '25-40', weight: '8-10 kg' },
  { value: 'toddler', label: '幼児（1-3歳）', hr: '80-120', sbp: '80-100', rr: '20-30', weight: '10-14 kg' },
  { value: 'preschool', label: '学童前期（4-5歳）', hr: '70-110', sbp: '85-110', rr: '20-25', weight: '16-20 kg' },
  { value: 'school', label: '学童（6-12歳）', hr: '65-110', sbp: '90-120', rr: '15-20', weight: '20-40 kg' },
  { value: 'adolescent', label: '思春期（13-17歳）', hr: '60-100', sbp: '100-130', rr: '12-20', weight: '40-70 kg' },
]

export default function ChildVitalPage() {
  const [age, setAge] = useState('newborn')
  const group = useMemo(() => ageGroups.find(g => g.value === age)!, [age])

  return (
    <CalculatorLayout
      slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard
          label={group.label}
          value="正常範囲"
          severity={'ok' as const}
          interpretation="下記の年齢別正常値を参照"
          details={[
            { label: '心拍数 (bpm)', value: group.hr },
            { label: '収縮期血圧 (mmHg)', value: group.sbp },
            { label: '呼吸数 (/min)', value: group.rr },
            { label: '体重目安', value: group.weight },
          ]}
        />
      }
      explanation={
        <div className="space-y-6 text-sm text-tx leading-relaxed">
          <div>
            <h2 className="text-lg font-bold mb-2">小児バイタルサインの評価</h2>
            <p className="text-muted">
              小児のバイタルサインは年齢により大きく異なります。成人の基準をそのまま当てはめると、頻脈や低血圧を見落とす危険があります。
              特にショックの早期認識では年齢別正常値の把握が不可欠です。
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">臨床で使える簡易推定式</h3>
            <div className="bg-s1 rounded-lg p-4 space-y-2 text-muted text-xs">
              <p><span className="font-medium text-tx">収縮期血圧下限</span> = 70 + (年齢 × 2) mmHg（1歳以上）</p>
              <p><span className="font-medium text-tx">体重推定</span> = (年齢 × 2) + 8 kg（1-8歳の概算）</p>
              <p><span className="font-medium text-tx">気管チューブ内径</span> = (年齢/4) + 3.5 mm（カフなし）、(年齢/4) + 3.0 mm（カフ付き）</p>
              <p><span className="font-medium text-tx">チューブ挿入長</span> = 内径 × 3 cm（経口）</p>
              <p><span className="font-medium text-tx">除細動エネルギー</span> = 2 J/kg（初回）→ 4 J/kg（2回目以降）</p>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">PALS（小児二次救命処置）での活用</h3>
            <p className="text-muted">
              小児のショックは成人と異なり、初期には血圧が維持される「代償性ショック」の段階があります。
              頻脈、CRT（毛細血管再充填時間）延長、意識レベル低下、末梢冷感が早期徴候です。
              低血圧は代償不全の遅発徴候であり、低血圧が出現した時点では既に重症です。
            </p>
            <div className="bg-s1 rounded-lg p-4 space-y-1 text-muted text-xs mt-2">
              <p><span className="font-medium text-wn">徐脈の定義:</span> 乳児 &lt;100 bpm、小児 &lt;60 bpm（症候性なら治療対象）</p>
              <p><span className="font-medium text-dn">低血圧の定義:</span> 乳児 SBP &lt;60、1-10歳 SBP &lt;70+(年齢×2)、10歳以上 SBP &lt;90</p>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">薬用量の体重ベース計算</h3>
            <p className="text-muted">
              小児の薬用量は体重(kg)ベースで計算します。体重が不明な場合はBroselow テープや上記推定式を使用します。
              アドレナリン 0.01 mg/kg IV/IO、アトロピン 0.02 mg/kg（最小0.1 mg）、アミオダロン 5 mg/kgが代表的な救急薬用量です。
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">発熱時のバイタル変動</h3>
            <p className="text-muted">
              体温が1℃上昇するごとに心拍数は約10 bpm増加します。発熱時の頻脈が「体温に見合った頻脈」か「不相応な頻脈（脱水・敗血症等）」かの判断が重要です。
              呼吸数も体温上昇で増加するため、解熱後の再評価が有用です。
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold mb-2">よくある質問</h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium">Q. 泣いている小児のバイタルは信頼できますか？</p>
                <p className="text-muted mt-1">
                  啼泣時は心拍数・呼吸数・血圧が全て上昇します。可能であれば安静時（保護者の抱っこ等）に再測定してください。
                  SpO2は啼泣時でも比較的信頼できます。
                </p>
              </div>
              <div>
                <p className="font-medium">Q. 新生児と乳児で最も注意すべきバイタルは？</p>
                <p className="text-muted mt-1">
                  新生児・乳児では呼吸数が最も早期に変化する指標です。多呼吸（&gt;60/min in新生児）は心不全・感染症・代謝性アシドーシスの早期徴候になります。
                </p>
              </div>
              <div>
                <p className="font-medium">Q. 血圧測定のカフサイズはどう選びますか？</p>
                <p className="text-muted mt-1">
                  カフ幅が上腕周囲の40%、長さが80%以上をカバーするサイズを選択します。
                  小さすぎるカフは血圧を過大評価、大きすぎるカフは過小評価します。
                </p>
              </div>
            </div>
          </div>
        </div>
      }
      relatedTools={[]}
      references={[
        { text: 'AHA PALS Provider Manual 2020' },
        { text: 'Fleming S et al. Normal ranges of heart rate and respiratory rate in children from birth to 18 years. Lancet 2011;377:1011-1018' },
        { text: 'Haque IU, Zaritsky AL. Analysis of the evidence for the lower limit of systolic and mean arterial pressure in children. Pediatr Crit Care Med 2007;8:138-144' },
        { text: '日本小児救急医学会. 小児救急診療ガイドライン 2023' },
      ]}
    >
      <div className="space-y-4">
        <SelectInput
          id="age"
          label="年齢区分を選択"
          value={age}
          onChange={setAge}
          options={ageGroups.map(g => ({ value: g.value, label: g.label }))}
        />
        <div className="bg-bg border border-br rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-br bg-s0">
                <th className="text-left p-2 text-tx font-medium">年齢</th>
                <th className="text-center p-2 text-tx font-medium">HR</th>
                <th className="text-center p-2 text-tx font-medium">SBP</th>
                <th className="text-center p-2 text-tx font-medium">RR</th>
              </tr>
            </thead>
            <tbody>
              {ageGroups.map(g => (
                <tr key={g.value} className={`border-b border-br last:border-0 ${g.value === age ? 'bg-acl' : ''}`}>
                  <td className="p-2 text-tx text-xs">{g.label}</td>
                  <td className="p-2 text-center text-muted text-xs">{g.hr}</td>
                  <td className="p-2 text-center text-muted text-xs">{g.sbp}</td>
                  <td className="p-2 text-center text-muted text-xs">{g.rr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CalculatorLayout>
  )
}
