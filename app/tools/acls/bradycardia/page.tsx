'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner, ERDisclaimerFooter, ERResultCaution } from '@/components/tools/ERDisclaimer'

/* ────────── 型定義 ────────── */
interface Choice { label: string; value: string; icon?: string; danger?: boolean }
interface TreeNode {
  id: string; title: string; desc?: string
  choices?: Choice[]
  result?: { severity: 'critical' | 'urgent' | 'moderate' | 'low'; title: string; actions: string[]; workup?: string[]; disposition?: string; pitfall?: string }
  next?: (selected: string) => string
}

/* ────────── ACLS 徐脈アルゴリズム ────────── */
const tree: Record<string, TreeNode> = {
  start: {
    id: 'start', title: 'Step 1: 徐脈の確認',
    desc: 'HR < 50 bpm（または症候性の徐脈）。まず症状の有無を評価。',
    choices: [
      { label: '症候性（低血圧・意識障害・胸痛・呼吸困難・ショック徴候）', value: 'symptomatic', icon: '🚨', danger: true },
      { label: '無症候性 / 血行動態安定', value: 'asymptomatic', icon: '✅' },
    ],
    next: v => v === 'symptomatic' ? 'symptomatic' : 'asymptomatic',
  },

  /* ── 無症候性徐脈 ── */
  asymptomatic: {
    id: 'asymptomatic', title: '無症候性徐脈 → 経過観察',
    result: {
      severity: 'low',
      title: '無症候性徐脈 — モニタリング + 原因検索',
      actions: [
        'モニター監視',
        '12誘導心電図（ブロックの種類を評価）',
        '原因検索: 薬剤性（β遮断薬・Ca拮抗薬・ジゴキシン・抗不整脈薬）',
        '電解質（K, Ca, Mg）確認',
        '甲状腺機能評価',
        '生理的徐脈の可能性（アスリート・睡眠中）',
        '2度房室ブロック Mobitz II型 / 3度房室ブロック → 症状がなくても循環器コンサルト',
      ],
      pitfall: '無症候でもMobitz II型・3度AVBは急変リスクが高い。経皮ペーシングの準備は怠らない',
    },
  },

  /* ── 症候性徐脈 ── */
  symptomatic: {
    id: 'symptomatic', title: 'Step 2: 症候性徐脈 → アトロピン',
    desc: '第一選択はアトロピン（用量は施設プロトコル参照、3-5分ごと反復可）。最大投与量あり。',
    choices: [
      { label: 'アトロピン有効 → 心拍数改善', value: 'effective', icon: '✅' },
      { label: 'アトロピン無効 / 効果不十分', value: 'ineffective', icon: '🚨', danger: true },
    ],
    next: v => v === 'effective' ? 'atropine_effective' : 'atropine_ineffective',
  },

  atropine_effective: {
    id: 'atropine_effective', title: 'アトロピン有効 → 原因検索・モニタリング',
    result: {
      severity: 'moderate',
      title: 'アトロピン反応性の症候性徐脈',
      actions: [
        'モニター監視継続',
        '12誘導心電図（房室ブロックの程度・種類を評価）',
        '原因検索・除去（薬剤性が多い）',
        '原因薬剤の中止・減量',
        '電解質補正',
        '循環器コンサルト（ブロックの種類による）',
        '再増悪に備え経皮ペーシングを準備',
      ],
      disposition: 'モニター可能な病床（CCU/ICU or テレメトリー）',
      pitfall: 'アトロピンの効果は一時的。根本原因の是正なしには再発する。Mobitz II型・3度AVBではアトロピンは無効なことが多い',
    },
  },

  atropine_ineffective: {
    id: 'atropine_ineffective', title: 'Step 3: アトロピン無効 → 次の選択肢',
    desc: 'アトロピン無効の場合、経皮ペーシング・薬物的ブリッジ（ドパミン/アドレナリン持続点滴）を検討。',
    choices: [
      { label: '経皮ペーシング（TCP）', value: 'tcp', icon: '⚡', danger: true },
      { label: '薬物的ブリッジ（ドパミン or アドレナリン持続点滴）', value: 'drip', icon: '💊' },
      { label: 'ブロックの種類を確認 → 経静脈ペーシング適応評価', value: 'block_type', icon: '📊' },
    ],
    next: v => v === 'tcp' ? 'tcp' : v === 'drip' ? 'drug_bridge' : 'block_assessment',
  },

  tcp: {
    id: 'tcp', title: '⚡ 経皮ペーシング（TCP）',
    result: {
      severity: 'critical',
      title: '経皮ペーシング',
      actions: [
        '電極パッド: 前胸部（左前胸部）＋ 背部（左肩甲骨下）',
        'ペーシングレート: 60-80 bpm',
        '出力: 閾値から徐々に上げ、electrical capture を確認',
        'mechanical capture の確認: 脈拍触知 or SpO₂波形',
        '鎮静・鎮痛（可能であれば — 経皮ペーシングは痛い）',
        'capture 確認後、閾値の10%上に出力設定',
        '経静脈ペーシングへのブリッジとして使用',
        '循環器緊急コンサルト → 経静脈一時ペーシング/永久ペースメーカー検討',
      ],
      pitfall: 'electrical captureとmechanical captureを区別する。モニター上の波形だけでなく脈拍触知で確認。capture不良の場合はパッド位置の変更・出力増加・電極の貼り直しを試す',
    },
  },

  drug_bridge: {
    id: 'drug_bridge', title: '💊 薬物的ブリッジ',
    result: {
      severity: 'urgent',
      title: '薬物的ペーシングブリッジ',
      actions: [
        'ドパミン持続点滴（用量は施設プロトコル参照）',
        'or アドレナリン持続点滴（用量は施設プロトコル参照）',
        'イソプロテレノール（β刺激 — 特にTorsades合併時に有用）',
        'いずれも経皮/経静脈ペーシングまでのブリッジ',
        '循環器コンサルト',
      ],
      disposition: 'ICU / CCU',
      pitfall: '薬物療法は一時的なブリッジ。根本的解決にはペーシングが必要。冠動脈疾患患者ではイソプロテレノールの心筋酸素消費増大に注意',
    },
  },

  block_assessment: {
    id: 'block_assessment', title: '📊 房室ブロックの種類と永久ペースメーカー適応',
    desc: '12誘導心電図でブロックの種類を正確に診断。Mobitz II型と3度AVBは永久ペースメーカーの適応。',
    choices: [
      { label: '1度AVB / 2度Mobitz I型（Wenckebach）', value: 'benign', icon: '📊' },
      { label: '2度Mobitz II型', value: 'mobitz2', icon: '🚨', danger: true },
      { label: '3度AVB（完全房室ブロック）', value: 'complete', icon: '🚨', danger: true },
    ],
    next: v => v === 'benign' ? 'benign_block' : v === 'mobitz2' ? 'high_grade_block' : 'high_grade_block',
  },

  benign_block: {
    id: 'benign_block', title: '1度AVB / 2度Mobitz I型',
    result: {
      severity: 'moderate',
      title: '1度AVB / Mobitz I型 — 通常は良性',
      actions: [
        '原因薬剤の確認・中止検討（β遮断薬・Ca拮抗薬・ジゴキシン）',
        '電解質補正',
        'モニタリング継続',
        'Mobitz I型でも症候性なら循環器コンサルト',
        '高度のMobitz I型（2:1以上の伝導比）は要注意',
      ],
      pitfall: 'Mobitz I型でも高度房室ブロックに進展する可能性あり。特に広いQRS（His束下ブロック）を伴う場合',
    },
  },

  high_grade_block: {
    id: 'high_grade_block', title: '🚨 Mobitz II型 / 3度AVB → ペーシング適応',
    result: {
      severity: 'critical',
      title: 'Mobitz II型 / 完全房室ブロック — 永久ペースメーカー適応',
      actions: [
        '経皮ペーシング準備 → 実施',
        '循環器緊急コンサルト',
        '経静脈一時ペーシング（ブリッジ）',
        '永久ペースメーカー植込みの検討',
        '可逆的原因の除外: 薬剤性・電解質異常・急性心筋梗塞（下壁MI）・感染性心内膜炎',
        '急性心筋梗塞に伴う場合: 再灌流で回復する可能性あり → 数日経過観察後に永久PM適応判断',
        '心エコー（基礎心疾患の評価）',
      ],
      disposition: 'ICU / CCU → 循環器病棟',
      pitfall: '下壁MIに伴うAVBは一過性のことが多いが、前壁MIに伴うAVBは広範な心筋壊死を示唆し予後不良',
    },
  },
}

/* ────────── 描画 ────────── */
const severityColors: Record<string, string> = {
  critical: 'bg-red-50 border-red-300 text-red-900',
  urgent: 'bg-orange-50 border-orange-300 text-orange-900',
  moderate: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  low: 'bg-green-50 border-green-300 text-green-900',
}

export default function BradycardiaPage() {
  const [current, setCurrent] = useState('start')
  const [history, setHistory] = useState<string[]>([])

  const node = tree[current]
  if (!node) return null

  const go = (next: string) => { setHistory(h => [...h, current]); setCurrent(next) }
  const back = () => { const prev = history[history.length - 1]; if (prev) { setHistory(h => h.slice(0, -1)); setCurrent(prev) } }
  const reset = () => { setCurrent('start'); setHistory([]) }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-muted mb-6 flex-wrap">
        <Link href="/tools" className="hover:text-ac">ツール</Link>
        <span>/</span>
        <Link href="/tools/acls" className="hover:text-ac">ACLS / BLS</Link>
        <span>/</span>
        <span className="text-tx font-medium">徐脈</span>
      </nav>

      <h1 className="text-2xl font-bold text-tx mb-2">ACLS 徐脈アルゴリズム</h1>
      <p className="text-muted mb-6">症候性徐脈のアトロピン → 経皮ペーシング → 経静脈ペーシングの段階的対応。房室ブロックの種類別に永久ペースメーカー適応を判断。</p>

      <ERDisclaimerBanner />

      {history.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted">ステップ {history.length + 1}</span>
          <div className="flex-1 h-1 bg-s2 rounded-full overflow-hidden">
            <div className="h-full bg-ac rounded-full transition-all" style={{ width: `${Math.min(((history.length + 1) / 5) * 100, 100)}%` }} />
          </div>
        </div>
      )}

      <div className="border-2 border-ac/30 rounded-2xl p-6 bg-s1 mb-4">
        <h2 className="text-lg font-bold text-tx mb-2">{node.title}</h2>
        {node.desc && <p className="text-sm text-muted mb-4 leading-relaxed">{node.desc}</p>}

        {node.choices && (
          <div className="space-y-2">
            {node.choices.map(c => (
              <button
                key={c.value}
                onClick={() => node.next && go(node.next(c.value))}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  c.danger
                    ? 'border-red-200 bg-red-50 hover:border-red-400 hover:bg-red-100'
                    : 'border-br bg-bg hover:border-ac/40 hover:bg-acl'
                }`}
              >
                <span className="flex items-center gap-2">
                  {c.icon && <span>{c.icon}</span>}
                  <span className="text-sm font-medium text-tx">{c.label}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {node.result && (
          <div className={`rounded-xl border-2 p-5 ${severityColors[node.result.severity]}`}>
            <h3 className="font-bold text-base mb-3">{node.result.title}</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">対応</p>
                <ul className="space-y-1">{node.result.actions.map((a, i) => <li key={i}>• {a}</li>)}</ul>
              </div>
              {node.result.workup && node.result.workup.length > 0 && (
                <div><p className="font-semibold mb-1">検査</p><ul className="space-y-1">{node.result.workup.map((w, i) => <li key={i}>• {w}</li>)}</ul></div>
              )}
              {node.result.disposition && (
                <div><p className="font-semibold mb-1">搬送先</p><p>{node.result.disposition}</p></div>
              )}
              {node.result.pitfall && (
                <div className="mt-3 p-3 bg-white/50 rounded-lg border border-current/20">
                  <p className="font-semibold mb-1">⚠️ Pitfall</p>
                  <p>{node.result.pitfall}</p>
                </div>
              )}
            </div>
            <ERResultCaution />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {history.length > 0 && (
          <button onClick={back} className="px-4 py-2 rounded-lg border border-br text-sm text-muted hover:bg-s2 transition-colors">← 戻る</button>
        )}
        {(history.length > 0 || node.result) && (
          <button onClick={reset} className="px-4 py-2 rounded-lg border border-br text-sm text-muted hover:bg-s2 transition-colors">最初から</button>
        )}
      </div>

      <div className="mt-8 p-4 bg-s1 rounded-xl border border-br">
        <p className="text-xs font-bold text-tx mb-2">出典・参考文献</p>
        <ul className="text-xs text-muted space-y-1">
          <li>• AHA Guidelines for CPR and Emergency Cardiovascular Care (2020 update)</li>
          <li>• JRC 蘇生ガイドライン 2020</li>
          <li>• ACLS Provider Manual (AHA)</li>
          <li>• ESC Guidelines on Cardiac Pacing (2021)</li>
        </ul>
      </div>

      <ERDisclaimerFooter />
    </main>
  )
}
