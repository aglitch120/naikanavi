'use client'

import { useState } from 'react'
import Link from 'next/link'
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
    examples: '心臓手術、肝切除、Whipple手術、敗血症性ショック',
    dose: 'HC 100mg iv → 50mg q8h（150mg/日）',
    duration: '2〜3日間 → 1/2ずつ48hで漸減',
    note: '重症敗血症ではHC 200mg/日（50mg q6h）を最大7日間。',
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

/* ── ステロイド副作用と対策 ── */
const SIDE_EFFECTS = [
  {
    id: 'osteoporosis',
    title: '骨粗鬆症',
    icon: '🦴',
    threshold: 'PSL ≥ 5mg/日を3ヶ月以上使用予定',
    actions: [
      'ビスホスホネート（アレンドロネート等）開始',
      'Ca 1000〜1200mg/日 + ビタミンD 800IU/日',
      'DEXA（骨密度測定）ベースライン + 1年ごとフォロー',
      'FRAX®で骨折リスク評価',
      'テリパラチドは重症例・ビスホスホネート禁忌時に考慮',
    ],
  },
  {
    id: 'diabetes',
    title: '糖尿病・耐糖能異常',
    icon: '🩸',
    threshold: 'PSL開始後〜数日以内に血糖上昇（特に午後）',
    actions: [
      '空腹時・食後血糖モニタリング（特に昼〜夕食後）',
      'HbA1c 3ヶ月ごと',
      '軽度: メトホルミン or DPP-4阻害薬',
      '中等度〜: 中間型インスリン朝追加（ステロイドの薬物動態に合わせる）',
      '高用量ステロイドパルス: スライディングスケール or 持続点滴',
    ],
  },
  {
    id: 'dyslipidemia',
    title: '脂質異常症',
    icon: '🫀',
    threshold: '長期ステロイド使用時',
    actions: [
      '脂質プロファイル（TC/LDL/HDL/TG）ベースライン + 3〜6ヶ月ごと',
      'LDL高値: スタチン導入',
      '心血管リスク因子があれば積極的に管理',
    ],
  },
  {
    id: 'hypertension',
    title: '高血圧',
    icon: '💉',
    threshold: 'ミネラルコルチコイド作用のある薬剤で特にリスク上昇',
    actions: [
      '定期血圧モニタリング',
      '減塩指導',
      'ACE-I / ARB / Ca拮抗薬で管理（通常の降圧薬選択）',
      'フルドロコルチゾン併用時は特に注意',
    ],
  },
  {
    id: 'insomnia',
    title: '不眠・精神症状',
    icon: '😴',
    threshold: '中〜高用量で頻発（特に夕方以降投与時）',
    actions: [
      'ステロイドを朝1回投与にまとめる（可能であれば）',
      '不眠: 短期的にゾルピデム・エスゾピクロン等',
      '精神症状（躁状態・抑うつ・精神病）: 精神科コンサルト',
      'ステロイド精神病はPSL 40mg/日以上で5〜18%に発症',
    ],
  },
  {
    id: 'electrolyte',
    title: '電解質異常',
    icon: '⚗️',
    threshold: '特にミネラルコルチコイド作用が強い薬剤',
    actions: [
      'Na↑ / K↓ のモニタリング',
      '低K血症: KCl補充',
      '浮腫: 利尿薬考慮',
      'デキサメタゾン/ベタメタゾンはミネラルコルチコイド作用が弱い',
    ],
  },
  {
    id: 'infection',
    title: '感染症予防',
    icon: '🦠',
    threshold: 'PSL ≥ 20mg/日を4週間以上、または免疫抑制薬併用',
    actions: [
      'PCP予防: ST合剤（1錠/日 or 2錠×週3回）— PSL≥20mg×4週以上',
      'B型肝炎: HBs抗原/抗体/HBc抗体スクリーニング → 陽性時は肝臓内科コンサルト',
      'CMV: 臓器移植・高度免疫抑制時にモニタリング',
      '結核: IGRA/ツ反 → 潜在性結核感染症(LTBI)ならINH予防投与検討',
      'インフルエンザ・肺炎球菌ワクチン推奨（生ワクチンは禁忌）',
    ],
  },
  {
    id: 'eye',
    title: '眼科（緑内障・白内障）',
    icon: '👁️',
    threshold: 'ステロイド使用開始時 + 長期使用',
    actions: [
      'ベースライン眼科受診（眼圧測定・水晶体評価）',
      '3〜6ヶ月ごとの眼科フォロー',
      '緑内障: 眼圧上昇は数週間以内に出現可能',
      '後嚢下白内障: 長期使用で進行（不可逆）',
      '点眼ステロイドでも同様のリスクあり',
    ],
  },
  {
    id: 'ulcer',
    title: '消化性潰瘍',
    icon: '🫃',
    threshold: 'ステロイド単独リスクは低いが、NSAIDs/抗凝固薬併用でリスク上昇',
    actions: [
      'NSAIDs併用時: PPI予防投与',
      '抗凝固薬/抗血小板薬併用時: PPI予防投与',
      '消化性潰瘍の既往: PPI予防投与',
      'ステロイド単独（他リスクなし）: PPI予防は通常不要',
      '上腹部症状出現時は早期にEGD検討',
    ],
  },
]

export default function SteroidCoverPage() {
  const [openEffect, setOpenEffect] = useState<string | null>(null)

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
            <h1 className="text-2xl font-bold text-tx mb-1">ステロイドカバー & 副作用管理</h1>
            <p className="text-sm text-muted">周術期ストレスカバー + 長期使用時の副作用対策チェックリスト</p>
          </div>
          <ProPulseHint>
            <FavoriteButton slug="drugs-steroid-cover" title="ステロイドカバー & 副作用管理" href="/tools/drugs/steroid-cover" type="drugs" />
          </ProPulseHint>
        </div>
      </header>

      {/* ── 周術期ストレスカバー ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-tx mb-4">周術期ストレスカバー</h2>
        <p className="text-sm text-muted mb-4">
          長期ステロイド使用患者のHPA軸抑制を考慮し、手術・重症疾患時にヒドロコルチゾン（HC）補充を行う。
        </p>

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

      {/* ── ステロイド副作用チェックリスト ── */}

        <section className="mb-10">
          <h2 className="text-lg font-bold text-tx mb-4">ステロイド副作用 & 対策チェックリスト</h2>
          <p className="text-sm text-muted mb-4">
            長期使用時に対策が必要な副作用と、予防・モニタリング項目。
          </p>

          <div className="space-y-2">
            {SIDE_EFFECTS.map(se => {
              const isOpen = openEffect === se.id
              return (
                <div key={se.id} className="bg-s0 border border-br rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenEffect(isOpen ? null : se.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-acl/50 transition-colors"
                  >
                    <span className="text-lg">{se.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-tx">{se.title}</h3>
                      <p className="text-[11px] text-muted truncate">{se.threshold}</p>
                    </div>
                    <span className="text-muted text-xs">{isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-br/50">
                      <div className="bg-wnl rounded-lg p-2 mt-3 mb-3">
                        <p className="text-xs text-wn font-medium">⚠️ 対策開始基準: {se.threshold}</p>
                      </div>
                      <ul className="space-y-1.5">
                        {se.actions.map((a, i) => (
                          <li key={i} className="text-xs text-tx flex items-start gap-2">
                            <span className="text-ac mt-0.5">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>


      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-3 mb-8 text-sm text-wn">
        ⚠️ 用量・管理方針は患者の状態・施設プロトコルに基づき担当医が判断してください。
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
