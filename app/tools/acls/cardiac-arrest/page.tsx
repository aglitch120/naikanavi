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

/* ────────── ACLS 心停止アルゴリズム ────────── */
const tree: Record<string, TreeNode> = {
  start: {
    id: 'start', title: 'Step 1: 心停止の確認',
    desc: '反応なし + 呼吸なし（または死戦期呼吸）→ 心停止と判断。BLS開始・応援要請・モニター/除細動器装着。',
    choices: [
      { label: '心停止確認 → モニター波形へ', value: 'confirm', icon: '🚨', danger: true },
    ],
    next: () => 'rhythm_check',
  },

  rhythm_check: {
    id: 'rhythm_check', title: 'Step 2: 初期リズム確認',
    desc: 'モニター/除細動器で心電図波形を確認。ショック適応リズムか非適応リズムかで対応が分岐する。',
    choices: [
      { label: 'VF（心室細動）/ pVT（無脈性心室頻拍）', value: 'shockable', icon: '⚡', danger: true },
      { label: 'Asystole（心静止）/ PEA（無脈性電気活動）', value: 'non_shockable', icon: '📉', danger: true },
    ],
    next: v => v === 'shockable' ? 'vfpvt_shock1' : 'asystole_pea',
  },

  /* ── VF/pVT アルゴリズム ── */
  vfpvt_shock1: {
    id: 'vfpvt_shock1', title: '⚡ VF/pVT → 除細動（1回目）',
    desc: '二相性: 製造元推奨エネルギー（通常120-200J）。不明なら最大エネルギー。単相性: 360J。除細動後は直ちにCPR再開（2分間）。',
    choices: [
      { label: '除細動実施 → CPR 2分 → リズム再確認', value: 'post_shock1', icon: '🫀' },
    ],
    next: () => 'vfpvt_post1',
  },

  vfpvt_post1: {
    id: 'vfpvt_post1', title: 'CPR 2分間 → リズム再確認',
    desc: '除細動後は脈拍確認せず直ちにCPR再開。2分後にリズム確認。この間に血管確保（IO/IV）。',
    choices: [
      { label: 'VF/pVT持続 → 2回目除細動', value: 'persist', icon: '⚡', danger: true },
      { label: 'Asystole/PEA に変化', value: 'non_shockable', icon: '📉' },
      { label: 'ROSC（自己心拍再開）', value: 'rosc', icon: '✅' },
    ],
    next: v => v === 'persist' ? 'vfpvt_shock2' : v === 'rosc' ? 'rosc' : 'asystole_pea',
  },

  vfpvt_shock2: {
    id: 'vfpvt_shock2', title: '⚡ 2回目除細動 + アドレナリン',
    desc: '2回目除細動実施。除細動後CPR再開と同時にアドレナリン投与（用量は施設プロトコル参照、3-5分ごと反復）。',
    choices: [
      { label: 'CPR 2分 → リズム再確認', value: 'check', icon: '🫀' },
    ],
    next: () => 'vfpvt_post2',
  },

  vfpvt_post2: {
    id: 'vfpvt_post2', title: 'CPR 2分間 → リズム再確認（3サイクル目）',
    desc: 'VF/pVT持続なら3回目除細動 + アミオダロン投与を検討。',
    choices: [
      { label: 'VF/pVT持続 → 3回目除細動 + アミオダロン', value: 'persist', icon: '⚡', danger: true },
      { label: 'Asystole/PEA に変化', value: 'non_shockable', icon: '📉' },
      { label: 'ROSC', value: 'rosc', icon: '✅' },
    ],
    next: v => v === 'persist' ? 'vfpvt_shock3' : v === 'rosc' ? 'rosc' : 'asystole_pea',
  },

  vfpvt_shock3: {
    id: 'vfpvt_shock3', title: '⚡ 3回目除細動 + アミオダロン',
    desc: '3回目除細動実施。アミオダロン投与（用量は施設プロトコル参照）。難治性VF/pVTの可逆的原因（5H/5T）を再検索。',
    choices: [
      { label: 'CPR 2分 → リズム再確認（ループ継続）', value: 'loop', icon: '🔄' },
    ],
    next: () => 'vfpvt_loop',
  },

  vfpvt_loop: {
    id: 'vfpvt_loop', title: 'VF/pVT 継続ループ',
    desc: '除細動 → CPR 2分 → リズム確認 → のサイクルを継続。アドレナリンは3-5分ごと反復。難治性VF/pVTでは5H/5Tの検索が特に重要。',
    choices: [
      { label: 'VF/pVT持続 → 除細動+CPR継続', value: 'persist', icon: '⚡', danger: true },
      { label: 'Asystole/PEA に変化', value: 'non_shockable', icon: '📉' },
      { label: 'ROSC', value: 'rosc', icon: '✅' },
      { label: '5H/5T 可逆的原因を確認', value: 'causes', icon: '🔍' },
    ],
    next: v => v === 'persist' ? 'vfpvt_loop' : v === 'causes' ? 'reversible_causes' : v === 'rosc' ? 'rosc' : 'asystole_pea',
  },

  /* ── Asystole / PEA アルゴリズム ── */
  asystole_pea: {
    id: 'asystole_pea', title: '📉 Asystole / PEA → CPR + アドレナリン',
    desc: 'ショック非適応リズム。直ちに高品質CPRを継続。アドレナリン投与（用量は施設プロトコル参照）を速やかに開始し、3-5分ごと反復。可逆的原因（5H/5T）の検索が最重要。',
    choices: [
      { label: 'CPR 2分 → リズム再確認', value: 'check', icon: '🫀' },
      { label: '5H/5T 可逆的原因を確認', value: 'causes', icon: '🔍' },
    ],
    next: v => v === 'causes' ? 'reversible_causes' : 'asystole_pea_recheck',
  },

  asystole_pea_recheck: {
    id: 'asystole_pea_recheck', title: 'CPR 2分後 → リズム再確認',
    desc: '2分間のCPR後にリズムを確認。ショック適応リズムに変化していれば除細動へ。',
    choices: [
      { label: 'VF/pVT に変化 → 除細動', value: 'shockable', icon: '⚡', danger: true },
      { label: 'Asystole/PEA 持続 → CPR継続', value: 'persist', icon: '📉' },
      { label: 'ROSC', value: 'rosc', icon: '✅' },
    ],
    next: v => v === 'shockable' ? 'vfpvt_shock1' : v === 'rosc' ? 'rosc' : 'asystole_pea',
  },

  /* ── 可逆的原因 5H/5T ── */
  reversible_causes: {
    id: 'reversible_causes', title: '🔍 可逆的原因の検索（5H / 5T）',
    result: {
      severity: 'critical',
      title: '心停止の可逆的原因 — 5H / 5T',
      actions: [
        '【5H】',
        'Hypovolemia（循環血液量減少）→ 急速輸液・輸血',
        'Hypoxia（低酸素）→ 気管挿管・酸素投与',
        'Hydrogen ion（アシドーシス）→ 血ガス確認・重炭酸（適応あれば）',
        'Hypo-/Hyperkalemia（カリウム異常）→ 電解質確認・補正',
        'Hypothermia（低体温）→ 復温',
        '【5T】',
        'Tension pneumothorax（緊張性気胸）→ 脱気（針/チューブ）',
        'Tamponade, cardiac（心タンポナーデ）→ 心嚢穿刺・心エコー',
        'Toxins（中毒）→ 病歴聴取・拮抗薬',
        'Thrombosis, pulmonary（肺塞栓）→ t-PA・外科的血栓除去',
        'Thrombosis, coronary（冠動脈血栓）→ PCI',
      ],
      pitfall: '特にPEAでは可逆的原因の是正が唯一の救命手段。心エコー（ベッドサイド）が5Tの多くを鑑別可能。CPR中もエコーで評価可能（圧迫中断を最小限に）',
    },
  },

  /* ── ROSC後 ── */
  rosc: {
    id: 'rosc', title: '✅ ROSC（自己心拍再開）',
    result: {
      severity: 'urgent',
      title: 'ROSC後管理',
      actions: [
        '12誘導心電図（STEMI確認 → 該当すれば緊急PCI）',
        '気道管理（気管挿管されていなければ評価・確保）',
        '循環管理（sBP≧90 / MAP≧65 目標。昇圧剤・輸液）',
        'SpO₂ 92-98%目標（過剰酸素を避ける）',
        'ETCO₂モニタリング（35-45mmHg目標）',
        '体温管理療法（TTM）の適応評価 — 反応なしの場合は32-36℃',
        '血液検査: 血ガス・電解質・乳酸・トロポニン・凝固・CBC・腎肝機能',
        'CT（頭部・全身）の適応検討',
        '原因検索（5H/5T の振り返り）',
        'ICU入室',
      ],
      disposition: 'ICU / CCU',
      pitfall: '再心停止は頻繁に起こる。モニタリング継続と再蘇生への準備を。過換気・過剰酸素はROSC後の予後を悪化させる',
    },
  },
}

/* ────────── 高品質CPRリファレンス ────────── */
const aclsReference = [
  { label: '圧迫の深さ', value: '≧5cm（6cmを超えない）' },
  { label: 'テンポ', value: '100〜120回/分' },
  { label: '完全なリコイル', value: '毎回胸壁が完全に戻る' },
  { label: '圧迫中断', value: '最小限（リズムチェック・除細動時のみ）' },
  { label: '換気', value: '高度な気道確保後: 6秒に1回（10回/分）' },
  { label: 'ETCO₂', value: '圧迫の質のモニター（≧10 mmHg目標）' },
  { label: '交代', value: '2分ごと' },
]

/* ────────── 描画 ────────── */
const severityColors: Record<string, string> = {
  critical: 'bg-red-50 border-red-300 text-red-900',
  urgent: 'bg-orange-50 border-orange-300 text-orange-900',
  moderate: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  low: 'bg-green-50 border-green-300 text-green-900',
}

export default function CardiacArrestPage() {
  const [current, setCurrent] = useState('start')
  const [history, setHistory] = useState<string[]>([])

  const node = tree[current]
  if (!node) return null

  const go = (next: string) => { setHistory(h => [...h, current]); setCurrent(next) }
  const back = () => { const prev = history[history.length - 1]; if (prev) { setHistory(h => h.slice(0, -1)); setCurrent(prev) } }
  const reset = () => { setCurrent('start'); setHistory([]) }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* パンくず */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6 flex-wrap">
        <Link href="/tools" className="hover:text-ac">ツール</Link>
        <span>/</span>
        <Link href="/tools/acls" className="hover:text-ac">ACLS / BLS</Link>
        <span>/</span>
        <span className="text-tx font-medium">心停止</span>
      </nav>

      <h1 className="text-2xl font-bold text-tx mb-2">ACLS 心停止アルゴリズム</h1>
      <p className="text-muted mb-6">VF/pVT（ショック適応）とAsystole/PEA（ショック非適応）の分岐を含む成人心停止の包括的対応フロー。5H/5T可逆的原因検索・ROSC後管理まで。</p>

      <ERDisclaimerBanner />

      {/* ACLS クイックリファレンス */}
      <details className="mb-6 border border-br rounded-xl overflow-hidden">
        <summary className="px-4 py-3 bg-s1 cursor-pointer text-sm font-bold text-tx hover:bg-s2 transition-colors">
          📋 高品質CPR クイックリファレンス
        </summary>
        <div className="px-4 py-3 space-y-1">
          {aclsReference.map(r => (
            <div key={r.label} className="flex text-sm">
              <span className="w-40 shrink-0 font-medium text-tx">{r.label}</span>
              <span className="text-muted">{r.value}</span>
            </div>
          ))}
        </div>
      </details>

      {/* 進行状況 */}
      {history.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted">ステップ {history.length + 1}</span>
          <div className="flex-1 h-1 bg-s2 rounded-full overflow-hidden">
            <div className="h-full bg-ac rounded-full transition-all" style={{ width: `${Math.min(((history.length + 1) / 8) * 100, 100)}%` }} />
          </div>
        </div>
      )}

      {/* 現在ノード */}
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
                <ul className="space-y-1">
                  {node.result.actions.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
              {node.result.workup && node.result.workup.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">検査</p>
                  <ul className="space-y-1">{node.result.workup.map((w, i) => <li key={i}>• {w}</li>)}</ul>
                </div>
              )}
              {node.result.disposition && (
                <div>
                  <p className="font-semibold mb-1">搬送先</p>
                  <p>{node.result.disposition}</p>
                </div>
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

      {/* ナビ */}
      <div className="flex gap-3">
        {history.length > 0 && (
          <button onClick={back} className="px-4 py-2 rounded-lg border border-br text-sm text-muted hover:bg-s2 transition-colors">← 戻る</button>
        )}
        {(history.length > 0 || node.result) && (
          <button onClick={reset} className="px-4 py-2 rounded-lg border border-br text-sm text-muted hover:bg-s2 transition-colors">最初から</button>
        )}
      </div>

      {/* 出典 */}
      <div className="mt-8 p-4 bg-s1 rounded-xl border border-br">
        <p className="text-xs font-bold text-tx mb-2">出典・参考文献</p>
        <ul className="text-xs text-muted space-y-1">
          <li>• AHA Guidelines for CPR and Emergency Cardiovascular Care (2020 update)</li>
          <li>• JRC 蘇生ガイドライン 2020</li>
          <li>• ACLS Provider Manual (AHA)</li>
        </ul>
      </div>

      <ERDisclaimerFooter />
    </main>
  )
}
