'use client'
import UpdatedAt from '@/components/tools/UpdatedAt'

import Link from 'next/link'
import ErrorReportButton from '@/components/tools/ErrorReportButton'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'

/* ── 周術期ストレスカバー ── */
const STRESS_LEVELS = [
  {
    level: '軽度ストレス',
    examples: '鼠径ヘルニア修復、大腸内視鏡、軽度の発熱性疾患',
    dose: 'ヒドロコルチゾン（HC）25mg/日（通常の朝用量のみ）',
    duration: '当日のみ',
    note: '追加補充不要の場合も多い。通常用量を確実に内服させる。',
  },
  {
    level: '中等度ストレス',
    examples: '開腹胆摘、人工関節置換、血管手術、肺炎入院',
    dose: 'HC 50〜75mg/日（分2〜3）',
    duration: '1〜2日間 → 速やかに通常量へ漸減',
    note: '術当日朝にHC 50mg iv → 術後8時間ごとにHC 25mg iv × 24〜48h。',
  },
  {
    level: '重度ストレス',
    examples: '心臓手術、肝切除、Whipple手術',
    dose: 'HC 100mg iv → 50mg q8h（150mg/日）（参考情報）',
    duration: '2〜3日間 → 1/2ずつ48hで漸減',
    note: '※敗血症性ショックへのステロイドは別の適応（SSC 2021: ノルアドレナリン（NE）≧0.25μg/kg/minを含む昇圧薬依存性が持続する場合にHC 200mg/日を検討）。周術期ストレスカバーとは目的が異なる。',
  },
]

/* ── HPA抑制リスク基準 ── */
const HPA_CRITERIA = [
  { criteria: 'PSL ≥ 20mg/日を3週間以上', risk: '高リスク' },
  { criteria: 'PSL 5〜20mg/日を4週間以上', risk: '中リスク — 要ACTH負荷試験考慮' },
  { criteria: 'PSL < 5mg/日 or 使用3週間未満', risk: '低リスク — 追加補充は通常不要' },
  { criteria: 'クッシング徴候あり（任意の用量）', risk: '高リスク' },
  { criteria: '夕方以降の投与（デキサメタゾン含む）', risk: 'HPA抑制リスク上昇' },
]


export default function SteroidCoverPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/drugs" className="hover:text-ac">薬剤ガイド</Link><span className="mx-2">›</span>
        <span>ステロイドカバー & 副作用管理</span>
      </nav>

      <header className="mb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">💊 薬剤ガイド</span>
            <h1 className="text-2xl font-bold text-tx mb-1">周術期ステロイドカバー</h1>
            <p className="text-sm text-muted">ストレスレベル別ヒドロコルチゾン補充量（文献転記）</p>
          </div>
          <ProPulseHint>
            <FavoriteButton slug="drugs-steroid-cover" title="ステロイドカバー & 副作用管理" href="/tools/drugs/steroid-cover" type="drugs" />
          </ProPulseHint>
        </div>
        <UpdatedAt />
      </header>

      {/* ── 周術期ストレスカバー ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-tx mb-4">周術期ストレスカバー</h2>

        {/* HPA抑制リスク */}
        <div className="bg-s0 border border-br rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold text-tx mb-3">HPA軸抑制リスク評価</h3>
          <div className="space-y-2">
            {HPA_CRITERIA.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 px-1.5 py-0.5 rounded font-bold shrink-0 ${
                  c.risk.startsWith('高') ? 'bg-dnl text-dn' :
                  c.risk.startsWith('中') ? 'bg-wnl text-wn' :
                  c.risk.startsWith('低') ? 'bg-acl text-ac' : 'bg-s1 text-muted'
                }`}>{c.risk.split('—')[0].trim()}</span>
                <span className="text-tx">{c.criteria}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ストレスレベル別 */}
        <div className="space-y-3">
          {STRESS_LEVELS.map((s, i) => (
            <div key={i} className="bg-s0 border border-ac/15 rounded-xl p-4">
              <h3 className="text-sm font-bold text-ac mb-2">{s.level}</h3>
              <p className="text-xs text-muted mb-2">例: {s.examples}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-acl rounded-lg p-2">
                  <span className="font-bold text-ac block mb-0.5">用量</span>
                  <span className="text-tx">{s.dose}</span>
                </div>
                <div className="bg-acl rounded-lg p-2">
                  <span className="font-bold text-ac block mb-0.5">期間</span>
                  <span className="text-tx">{s.duration}</span>
                </div>
              </div>
              <p className="text-[11px] text-muted mt-2">💡 {s.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-3 mb-8 text-sm text-wn">
        ⚠️ 掲載情報は下記文献の転記であり、正確性は保証しません。必ず原典をご確認ください。
        <div className="mt-2 pt-2 border-t border-wnb/30"><ErrorReportButton toolName="ステロイドカバー" /></div>
      </div>

      {/* 出典 */}
      <section className="text-xs text-muted space-y-1 mb-8">
        <h3 className="font-bold text-tx text-sm mb-2">参考文献</h3>
        <p>• Liu MM, et al. Corticosteroid perioperative stress dosing. Med Clin North Am. 2022.</p>
        <p>• Hahner S, et al. Adrenal insufficiency. Lancet. 2021.</p>
        <p>• 日本内分泌学会「副腎クリーゼ含む副腎皮質機能低下症の診断と治療に関する指針」2021.</p>
        <p>• ACR/EULAR ステロイド性骨粗鬆症ガイドライン 2022.</p>
        <p>• 日本呼吸器学会「ニューモシスチス肺炎の予防に関する指針」</p>
      </section>
    </main>
  )
}
