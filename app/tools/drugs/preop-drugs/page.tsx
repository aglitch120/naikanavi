'use client'

import { useState } from 'react'
import Link from 'next/link'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'

/* ── 休薬カテゴリ ── */
const CATEGORIES = [
  {
    id: 'anticoagulant',
    title: '抗凝固薬',
    icon: '🩸',
    drugs: [
      { name: 'ワルファリン', stop: '5日前', restart: '術後12〜24時間（止血確認後）', bridge: 'CHADS₂≥3 or 機械弁: ヘパリンブリッジ考慮', note: '術前PT-INR ≤ 1.5を確認。緊急時はVit.K / FFP' },
      { name: 'ダビガトラン（プラザキサ）', stop: 'CCr≥50: 2日前、CCr30-49: 3〜4日前', restart: '術後24〜48時間', bridge: '通常不要（半減期短い）', note: '出血高リスク手術: +1日延長。イダルシズマブ（プリズバインド®）で拮抗可' },
      { name: 'リバーロキサバン（イグザレルト）', stop: '2日前（出血高リスク: 3日前）', restart: '術後24〜48時間', bridge: '通常不要', note: '腎機能低下時は延長検討' },
      { name: 'アピキサバン（エリキュース）', stop: '2日前（出血高リスク: 3日前）', restart: '術後24〜48時間', bridge: '通常不要', note: '腎排泄率低い（25%）ため腎障害の影響比較的小' },
      { name: 'エドキサバン（リクシアナ）', stop: '2日前', restart: '術後24〜48時間', bridge: '通常不要', note: '' },
    ],
  },
  {
    id: 'antiplatelet',
    title: '抗血小板薬',
    icon: '🫀',
    drugs: [
      { name: 'アスピリン', stop: '7〜10日前', restart: '術後24時間（止血確認後）', bridge: '', note: '心血管高リスク（BMS後6週以内/DES後6ヶ月以内）: 継続考慮。循環器医と相談' },
      { name: 'クロピドグレル（プラビックス）', stop: '5〜7日前', restart: '術後24〜48時間', bridge: '', note: 'DES後: 12ヶ月以内は原則延期。やむを得ない場合アスピリン継続下で手術' },
      { name: 'プラスグレル（エフィエント）', stop: '7〜10日前', restart: '術後24〜48時間', bridge: '', note: '' },
      { name: 'チカグレロル（ブリリンタ）', stop: '5日前', restart: '術後24〜48時間', bridge: '', note: '' },
      { name: 'シロスタゾール（プレタール）', stop: '3日前', restart: '術後24時間', bridge: '', note: '半減期が短い。出血低リスク手術では継続可のことも' },
    ],
  },
  {
    id: 'diabetes',
    title: '糖尿病薬',
    icon: '💉',
    drugs: [
      { name: 'メトホルミン', stop: '手術当日朝（造影CTは48時間前）', restart: '術後48時間・腎機能正常確認後', bridge: '', note: '乳酸アシドーシスリスク。eGFR<30は禁忌' },
      { name: 'SU薬（グリメピリド等）', stop: '手術当日朝', restart: '経口摂取再開後', bridge: '', note: '低血糖リスク。長時間作用型は前日夕から休薬も検討' },
      { name: 'SGLT2阻害薬', stop: '3日前', restart: '経口摂取安定後', bridge: '', note: '正常血糖DKAリスク。術前ケトン体チェック' },
      { name: 'DPP-4阻害薬', stop: '手術当日朝', restart: '経口摂取再開後', bridge: '', note: '低血糖リスク低い' },
      { name: 'GLP-1受容体作動薬', stop: '週1回製剤: 1週前、毎日製剤: 当日朝', restart: '経口摂取安定後', bridge: '', note: '胃排泄遅延→誤嚥リスク。週1回製剤は注意' },
      { name: 'インスリン（持効型）', stop: '継続（用量2/3〜1/2に減量）', restart: '術後は血糖に応じてスライディングスケール', bridge: '', note: '絶食中の基礎インスリンは原則継続。低血糖に注意' },
    ],
  },
  {
    id: 'cardiovascular',
    title: '循環器系',
    icon: '❤️',
    drugs: [
      { name: 'β遮断薬', stop: '継続（中止禁忌）', restart: '—', bridge: '', note: '急な中止でリバウンド頻脈・虚血悪化。経口不可時はiv（ランジオロール等）' },
      { name: 'ACE-I / ARB', stop: '手術当日朝休薬', restart: '術後血圧安定後', bridge: '', note: '術中低血圧リスク。ただし心不全コントロール中は継続も考慮' },
      { name: 'Ca拮抗薬', stop: '継続', restart: '—', bridge: '', note: '中止不要' },
      { name: 'スタチン', stop: '継続', restart: '—', bridge: '', note: '周術期の心血管イベント抑制効果あり。継続推奨' },
      { name: '利尿薬', stop: '手術当日朝休薬', restart: '術後脱水・電解質確認後', bridge: '', note: '脱水・低K防止のため当日休薬が一般的' },
    ],
  },
  {
    id: 'other',
    title: 'その他',
    icon: '💊',
    drugs: [
      { name: 'ステロイド（長期使用）', stop: '継続 + ストレスカバー', restart: '—', bridge: '', note: 'HPA軸抑制時はHC補充必須 → ステロイドカバー参照' },
      { name: 'MTX（メトトレキサート）', stop: '休薬不要（低用量RA）or 1〜2週前（高用量）', restart: '創傷治癒後', bridge: '', note: 'RA用量(8〜16mg/週)は原則継続。施設プロトコル確認' },
      { name: '生物学的製剤', stop: '投与間隔の1〜2倍前', restart: '創傷治癒確認後', bridge: '', note: '感染リスク。半減期に応じて休薬期間を設定' },
      { name: 'ビスホスホネート', stop: '抜歯: 休薬（賛否あり）', restart: '創傷治癒後', bridge: '', note: '顎骨壊死リスク。口腔外科と相談' },
      { name: 'ホルモン補充療法（HRT/OC）', stop: '4週前', restart: '術後2〜4週、離床後', bridge: '', note: 'VTEリスク。長時間手術で特にリスク上昇' },
    ],
  },
]

export default function PreopDrugsPage() {
  const [openCat, setOpenCat] = useState<string | null>('anticoagulant')

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/drugs" className="hover:text-ac">薬剤ガイド</Link><span className="mx-2">›</span>
        <span>術前休薬リスト</span>
      </nav>

      <header className="mb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">💊 薬剤ガイド</span>
            <h1 className="text-2xl font-bold text-tx mb-1">術前休薬リスト</h1>
            <p className="text-sm text-muted">抗凝固薬・抗血小板薬・糖尿病薬等の周術期休薬・継続ガイド</p>
          </div>
          <ProPulseHint>
            <FavoriteButton slug="drugs-preop" title="術前休薬リスト" href="/tools/drugs/preop-drugs" type="drugs" />
          </ProPulseHint>
        </div>
      </header>

      {/* カテゴリ別 */}
      <div className="space-y-3">
        {CATEGORIES.map(cat => {
          const isOpen = openCat === cat.id
          return (
            <div key={cat.id} className="bg-s0 border border-br rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenCat(isOpen ? null : cat.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-acl/50 transition-colors"
              >
                <span className="text-lg">{cat.icon}</span>
                <h2 className="flex-1 text-sm font-bold text-tx">{cat.title}</h2>
                <span className="text-[11px] text-muted bg-s1 px-2 py-0.5 rounded-full">{cat.drugs.length}薬剤</span>
                <span className="text-muted text-xs">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="border-t border-br">
                  {cat.drugs.map((d, i) => (
                    <div key={i} className={`p-4 ${i > 0 ? 'border-t border-br/50' : ''}`}>
                      <h3 className="text-sm font-bold text-tx mb-2">{d.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div className="bg-dnl rounded-lg p-2">
                          <span className="font-bold text-dn block text-[10px]">休薬</span>
                          <span className="text-tx">{d.stop}</span>
                        </div>
                        <div className="bg-acl rounded-lg p-2">
                          <span className="font-bold text-ac block text-[10px]">再開</span>
                          <span className="text-tx">{d.restart}</span>
                        </div>
                      </div>
                      {d.bridge && (
                        <p className="text-[11px] text-wn bg-wnl rounded-lg p-2 mb-1">🔄 ブリッジ: {d.bridge}</p>
                      )}
                      {d.note && (
                        <p className="text-[11px] text-muted">💡 {d.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

        <div />

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-3 mt-8 mb-8 text-sm text-wn">
        ⚠️ 休薬期間は手術の出血リスク・患者の血栓リスクにより個別判断が必要です。担当医・麻酔科・処方医と事前に相談してください。
      </div>

      {/* 出典 */}
      <section className="text-xs text-muted space-y-1 mb-8">
        <h3 className="font-bold text-tx text-sm mb-2">参考文献</h3>
        <p>• 日本循環器学会「2020年 JCSガイドライン 抗血栓療法と外科手術」</p>
        <p>• ACC/AHA 2014 Guideline on Perioperative Cardiovascular Evaluation.</p>
        <p>• 日本糖尿病学会「周術期の血糖管理に関するステートメント」</p>
        <p>• ASA Practice Guidelines for Perioperative Management. 2023.</p>
      </section>
    </main>
  )
}
