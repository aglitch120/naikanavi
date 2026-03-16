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

/* ────────── BLS 成人アルゴリズム ────────── */
const tree: Record<string, TreeNode> = {
  start: {
    id: 'start', title: 'Step 1: 安全確認・反応確認',
    desc: '周囲の安全を確認したうえで、傷病者の肩を叩きながら「大丈夫ですか？」と大声で呼びかける。',
    choices: [
      { label: '反応あり', value: 'responsive', icon: '✅' },
      { label: '反応なし / 判断に迷う', value: 'unresponsive', icon: '🚨', danger: true },
    ],
    next: v => v === 'responsive' ? 'responsive' : 'call119',
  },

  responsive: {
    id: 'responsive', title: '反応あり → 状態評価',
    result: {
      severity: 'moderate',
      title: '反応あり — 必要に応じた対応',
      actions: [
        '呼吸・循環の評価を継続',
        '訴えに応じた応急処置',
        '必要に応じ119番通報',
        '回復体位を検討（意識はあるが嘔吐リスクがある場合）',
        '状態が急変した場合はBLSを開始',
      ],
      pitfall: '反応があっても急変の可能性あり。継続的な観察が必要',
    },
  },

  call119: {
    id: 'call119', title: 'Step 2: 119番通報 + AED要請',
    desc: '大声で周囲の人に助けを求める。「あなた、119番通報してください」「あなた、AEDを持ってきてください」と具体的に指示。一人の場合はスピーカーフォンで119番しながらCPR。',
    choices: [
      { label: '通報・AED手配完了 → 呼吸確認へ', value: 'done', icon: '📞' },
    ],
    next: () => 'breathing',
  },

  breathing: {
    id: 'breathing', title: 'Step 3: 呼吸の確認（10秒以内）',
    desc: '胸と腹部の動きを見て、正常な呼吸の有無を10秒以内で判断する。死戦期呼吸（あえぎ呼吸）は「呼吸なし」と同じ扱い。',
    choices: [
      { label: '正常な呼吸あり', value: 'breathing', icon: '🫁' },
      { label: '呼吸なし / 死戦期呼吸 / 判断に迷う', value: 'no_breathing', icon: '🚨', danger: true },
    ],
    next: v => v === 'breathing' ? 'recovery' : 'cpr',
  },

  recovery: {
    id: 'recovery', title: '正常な呼吸あり → 回復体位・経過観察',
    result: {
      severity: 'moderate',
      title: '呼吸あり — 回復体位で経過観察',
      actions: [
        '回復体位（側臥位）にする',
        '救急隊到着まで呼吸・脈拍を継続観察',
        '状態が変化したら直ちにBLS開始',
        '119番通報していなければ通報',
      ],
      pitfall: '呼吸があっても急変する可能性あり。目を離さない。死戦期呼吸を正常呼吸と見誤らない',
    },
  },

  cpr: {
    id: 'cpr', title: 'Step 4: 胸骨圧迫 開始',
    desc: '直ちに胸骨圧迫を開始する。「強く・速く・絶え間なく」が原則。',
    choices: [
      { label: '胸骨圧迫開始 → 人工呼吸の確認へ', value: 'start_cpr', icon: '🫀' },
    ],
    next: () => 'ventilation_check',
  },

  ventilation_check: {
    id: 'ventilation_check', title: 'Step 5: 人工呼吸の可否確認',
    desc: '人工呼吸の技術があり、意思がある場合は30:2（胸骨圧迫30回 + 人工呼吸2回）で実施。',
    choices: [
      { label: '人工呼吸可能 → 30:2 CPR', value: 'with_ventilation', icon: '🫁' },
      { label: '人工呼吸できない/ためらう → 胸骨圧迫のみ', value: 'compression_only', icon: '🫀' },
    ],
    next: v => v === 'with_ventilation' ? 'cpr_30_2' : 'cpr_compression_only',
  },

  cpr_30_2: {
    id: 'cpr_30_2', title: 'CPR 30:2 実施中',
    desc: '胸骨圧迫30回 + 人工呼吸2回を繰り返す。圧迫の深さ約5cm（6cmを超えない）、テンポ100〜120回/分。圧迫の中断は最小限に（10秒以内）。',
    choices: [
      { label: 'AED到着', value: 'aed', icon: '⚡' },
      { label: '救急隊到着 / 明らかな生命徴候が出現', value: 'rosc', icon: '🚑' },
    ],
    next: v => v === 'aed' ? 'aed_on' : 'rosc',
  },

  cpr_compression_only: {
    id: 'cpr_compression_only', title: '胸骨圧迫のみ CPR 実施中',
    desc: '絶え間なく胸骨圧迫を続ける。深さ約5cm（6cmを超えない）、テンポ100〜120回/分。疲労したら交代（2分ごとを目安）。',
    choices: [
      { label: 'AED到着', value: 'aed', icon: '⚡' },
      { label: '救急隊到着 / 明らかな生命徴候が出現', value: 'rosc', icon: '🚑' },
    ],
    next: v => v === 'aed' ? 'aed_on' : 'rosc',
  },

  aed_on: {
    id: 'aed_on', title: 'Step 6: AED装着',
    desc: 'AEDの電源を入れ、電極パッドを貼り付ける。パッド位置: 右鎖骨下＋左側胸部（腋窩中線上）。AEDの音声指示に従う。心電図解析中は傷病者に触れない。',
    choices: [
      { label: 'ショック適応（AEDが「ショックが必要です」と指示）', value: 'shockable', icon: '⚡', danger: true },
      { label: 'ショック不要（AEDが「ショックは不要です」と指示）', value: 'no_shock', icon: '📋' },
    ],
    next: v => v === 'shockable' ? 'shock' : 'resume_cpr',
  },

  shock: {
    id: 'shock', title: 'Step 7: ショック実施',
    desc: '「離れてください！」と周囲に声をかけ、誰も傷病者に触れていないことを確認してからショックボタンを押す。',
    choices: [
      { label: 'ショック後 → 直ちにCPR再開（2分間）', value: 'resume', icon: '🫀' },
    ],
    next: () => 'post_shock_cpr',
  },

  resume_cpr: {
    id: 'resume_cpr', title: 'ショック不要 → 直ちにCPR再開',
    desc: 'ショック不要でも心停止は継続している可能性がある。直ちにCPRを再開し、2分間続ける。',
    choices: [
      { label: '2分経過 → AED再解析', value: 'reanalyze', icon: '🔄' },
      { label: '救急隊到着 / 明らかな生命徴候', value: 'rosc', icon: '🚑' },
    ],
    next: v => v === 'reanalyze' ? 'aed_on' : 'rosc',
  },

  post_shock_cpr: {
    id: 'post_shock_cpr', title: 'ショック後 → CPR 2分間',
    desc: 'ショック直後に脈拍確認はしない。直ちにCPRを再開し、2分間継続する。2分後にAEDが再解析を行う。',
    choices: [
      { label: '2分経過 → AED再解析', value: 'reanalyze', icon: '🔄' },
      { label: '救急隊到着 / 明らかな生命徴候', value: 'rosc', icon: '🚑' },
    ],
    next: v => v === 'reanalyze' ? 'aed_on' : 'rosc',
  },

  rosc: {
    id: 'rosc', title: '救急隊到着 / 自己心拍再開（ROSC）',
    result: {
      severity: 'urgent',
      title: 'CPR継続 → 救急隊引き継ぎ',
      actions: [
        '救急隊が到着するまでCPRを継続',
        '明らかな生命徴候（正常な呼吸・体動）が出現したら回復体位',
        'ROSC後も再心停止の可能性あり — 注意深く観察',
        '救急隊にこれまでの経過・AED使用回数・CPR時間を報告',
        'AEDの電極パッドは貼ったまま引き継ぎ',
      ],
      disposition: '救急隊に引き継ぎ → 医療機関搬送',
      pitfall: 'ROSC後も再心停止のリスクが高い。AEDパッドは剥がさない。呼吸が再開しても意識がなければ回復体位で観察',
    },
  },
}

/* ────────── 胸骨圧迫クイックリファレンス ────────── */
const cprReference = [
  { label: '圧迫位置', value: '胸骨の下半分（乳頭間線上）' },
  { label: '圧迫の深さ', value: '約5cm（6cmを超えない）' },
  { label: 'テンポ', value: '100〜120回/分' },
  { label: '圧迫:人工呼吸', value: '30:2（人工呼吸可能な場合）' },
  { label: '圧迫解除', value: '毎回完全に胸壁が元に戻るまで' },
  { label: '中断', value: '最小限（10秒以内）' },
  { label: '交代', value: '2分ごと（疲労による質低下を防ぐ）' },
]

/* ────────── 描画 ────────── */
const severityColors: Record<string, string> = {
  critical: 'bg-red-50 border-red-300 text-red-900',
  urgent: 'bg-orange-50 border-orange-300 text-orange-900',
  moderate: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  low: 'bg-green-50 border-green-300 text-green-900',
}

export default function BLSPage() {
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
        <span className="text-tx font-medium">成人BLS</span>
      </nav>

      <h1 className="text-2xl font-bold text-tx mb-2">成人BLS（一次救命処置）アルゴリズム</h1>
      <p className="text-muted mb-6">AHA BLS ガイドラインに基づく成人の一次救命処置フロー。反応確認 → 119番通報 → CPR → AEDの流れを系統的に実施。</p>

      <ERDisclaimerBanner />

      {/* 胸骨圧迫リファレンス */}
      <details className="mb-6 border border-br rounded-xl overflow-hidden">
        <summary className="px-4 py-3 bg-s1 cursor-pointer text-sm font-bold text-tx hover:bg-s2 transition-colors">
          📋 胸骨圧迫 クイックリファレンス
        </summary>
        <div className="px-4 py-3 space-y-1">
          {cprReference.map(r => (
            <div key={r.label} className="flex text-sm">
              <span className="w-36 shrink-0 font-medium text-tx">{r.label}</span>
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

        {/* 選択肢 */}
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

        {/* 結果 */}
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
                  <ul className="space-y-1">
                    {node.result.workup.map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
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
          <button onClick={back} className="px-4 py-2 rounded-lg border border-br text-sm text-muted hover:bg-s2 transition-colors">
            ← 戻る
          </button>
        )}
        {(history.length > 0 || node.result) && (
          <button onClick={reset} className="px-4 py-2 rounded-lg border border-br text-sm text-muted hover:bg-s2 transition-colors">
            最初から
          </button>
        )}
      </div>

      {/* 出典 */}
      <div className="mt-8 p-4 bg-s1 rounded-xl border border-br">
        <p className="text-xs font-bold text-tx mb-2">出典・参考文献</p>
        <ul className="text-xs text-muted space-y-1">
          <li>• AHA Guidelines for CPR and Emergency Cardiovascular Care (2020 update)</li>
          <li>• JRC 蘇生ガイドライン 2020</li>
          <li>• AHA BLS Provider Manual</li>
        </ul>
      </div>

      <ERDisclaimerFooter />
    </main>
  )
}
