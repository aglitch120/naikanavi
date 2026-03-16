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

/* ────────── ACLS 頻脈アルゴリズム ────────── */
const tree: Record<string, TreeNode> = {
  start: {
    id: 'start', title: 'Step 1: 頻脈の確認 + 血行動態評価',
    desc: 'HR > 150 bpm で症候性頻脈。まず血行動態の安定性を評価する。不安定の徴候: 低血圧・意識障害・胸痛・急性心不全。',
    choices: [
      { label: '血行動態不安定（低血圧・ショック・意識障害・胸痛・急性心不全）', value: 'unstable', icon: '🚨', danger: true },
      { label: '血行動態安定', value: 'stable', icon: '✅' },
    ],
    next: v => v === 'unstable' ? 'unstable' : 'stable_qrs',
  },

  /* ── 不安定な頻脈 ── */
  unstable: {
    id: 'unstable', title: '🚨 不安定な頻脈 → 同期電気的除細動',
    desc: '血行動態不安定な頻脈の第一選択は同期電気的除細動。鎮静下で実施（可能であれば）。',
    choices: [
      { label: 'QRS幅の確認へ（エネルギー選択のため）', value: 'check', icon: '📊' },
    ],
    next: () => 'unstable_qrs',
  },

  unstable_qrs: {
    id: 'unstable_qrs', title: '不安定頻脈: QRS幅の確認',
    desc: 'QRS幅でエネルギー量を選択。wide QRS（VTなど）は高エネルギー、narrow QRSは低エネルギーから開始。',
    choices: [
      { label: 'Narrow QRS（≦0.12秒）→ 50-100J から', value: 'narrow', icon: '📈' },
      { label: 'Wide QRS（>0.12秒）→ 100J から', value: 'wide', icon: '📈', danger: true },
    ],
    next: v => v === 'narrow' ? 'cardioversion_narrow' : 'cardioversion_wide',
  },

  cardioversion_narrow: {
    id: 'cardioversion_narrow', title: '⚡ 同期電気的除細動（Narrow QRS）',
    result: {
      severity: 'critical',
      title: '不安定な narrow QRS 頻脈 → 同期電気的除細動',
      actions: [
        '鎮静（可能であれば。状態が切迫していれば鎮静を待たない）',
        '同期モードを確認（R波同期がONであること）',
        '初回エネルギー: 50-100J（二相性）',
        '無効なら段階的にエネルギーを増加',
        'AF: 120-200J（二相性）/ AFl: 50-100J',
        '12誘導心電図（除細動前後で比較）',
        '電解質（K, Mg）確認・補正',
        '循環器コンサルト',
      ],
      pitfall: 'AF/AFl では抗凝固状態を確認（可能な範囲で）。ただし血行動態不安定なら抗凝固確認を待たず除細動を優先',
    },
  },

  cardioversion_wide: {
    id: 'cardioversion_wide', title: '⚡ 同期電気的除細動（Wide QRS）',
    result: {
      severity: 'critical',
      title: '不安定な wide QRS 頻脈 → 同期電気的除細動',
      actions: [
        '鎮静（可能であれば）',
        '同期モードを確認',
        '初回エネルギー: 100J（二相性）',
        '無効なら段階的にエネルギーを増加',
        '多形性VT（同期不能）の場合は非同期（除細動モード）で実施',
        '12誘導心電図（前後で比較）',
        '電解質確認・補正',
        '循環器コンサルト',
      ],
      pitfall: '多形性VTでは同期がうまくいかないことがある → 非同期除細動（除細動と同じ）に切り替え。Torsades de Pointes ならマグネシウム投与を検討',
    },
  },

  /* ── 安定な頻脈 → QRS幅で分岐 ── */
  stable_qrs: {
    id: 'stable_qrs', title: 'Step 2: QRS幅の評価',
    desc: '12誘導心電図でQRS幅を評価。Narrow（≦0.12秒）と Wide（>0.12秒）で対応が異なる。',
    choices: [
      { label: 'Narrow QRS（≦0.12秒）', value: 'narrow', icon: '📊' },
      { label: 'Wide QRS（>0.12秒）', value: 'wide', icon: '📊' },
    ],
    next: v => v === 'narrow' ? 'narrow_regular' : 'wide_regular',
  },

  /* ── Narrow QRS 頻脈 ── */
  narrow_regular: {
    id: 'narrow_regular', title: 'Narrow QRS 頻脈: リズムの整・不整',
    desc: 'P波の有無・RR間隔の整不整で鑑別を進める。',
    choices: [
      { label: '整（Regular）', value: 'regular', icon: '📈' },
      { label: '不整（Irregular）', value: 'irregular', icon: '📉' },
    ],
    next: v => v === 'regular' ? 'narrow_regular_svt' : 'narrow_irregular',
  },

  narrow_regular_svt: {
    id: 'narrow_regular_svt', title: 'Narrow QRS + Regular → SVT疑い',
    desc: '迷走神経刺激で反応を見る。無効ならアデノシン投与（用量は施設プロトコル参照）。',
    choices: [
      { label: '迷走神経刺激 → アデノシン投与', value: 'adenosine', icon: '💊' },
    ],
    next: () => 'svt_response',
  },

  svt_response: {
    id: 'svt_response', title: 'アデノシンへの反応',
    desc: '迷走神経刺激/アデノシンで頻脈が停止すればSVT（AVNRT/AVRT）。停止しなければ他の不整脈を検討。',
    choices: [
      { label: '頻脈停止 → SVT確定', value: 'stopped', icon: '✅' },
      { label: '停止せず → 鑑別再検討', value: 'no_response', icon: '🔍' },
    ],
    next: v => v === 'stopped' ? 'svt_resolved' : 'svt_refractory',
  },

  svt_resolved: {
    id: 'svt_resolved', title: '✅ SVT停止',
    result: {
      severity: 'moderate',
      title: 'SVT（AVNRT/AVRT） — アデノシンで停止',
      actions: [
        '12誘導心電図（洞調律時。WPW・デルタ波の有無を確認）',
        '再発予防の薬剤検討（β遮断薬・Ca拮抗薬など）',
        'WPW合併の場合: アブレーション適応を循環器に相談',
        '電解質確認（K, Mg）',
        '基礎疾患の検索（心エコー等）',
      ],
      disposition: '安定していれば外来フォロー（循環器紹介）',
      pitfall: 'WPW + AF ではアデノシン・Ca拮抗薬・ジゴキシンは禁忌（副伝導路を介したVFリスク）',
    },
  },

  svt_refractory: {
    id: 'svt_refractory', title: 'アデノシン無効 → 鑑別再検討',
    result: {
      severity: 'urgent',
      title: 'アデノシン無効の narrow regular tachycardia',
      actions: [
        '心房頻拍（AT）・心房粗動（AFl 2:1伝導）を検討',
        'レート/リズムコントロール: β遮断薬 or Ca拮抗薬（用量は施設プロトコル参照）',
        '12誘導心電図を再評価（鋸歯状波 → AFl）',
        '循環器コンサルト',
        '電気的除細動も選択肢',
      ],
      pitfall: 'AFl 2:1伝導は一見regular narrow tachycardiaに見える。HR≒150ならAFlを強く疑う',
    },
  },

  narrow_irregular: {
    id: 'narrow_irregular', title: 'Narrow QRS + Irregular → AF疑い',
    result: {
      severity: 'moderate',
      title: 'Narrow QRS 不整頻脈 — 心房細動（AF）/ 多源性心房頻拍（MAT）',
      actions: [
        '12誘導心電図で確認（f波 → AF、3種以上のP波形 → MAT）',
        '【AF レートコントロール】β遮断薬 or Ca拮抗薬（用量は施設プロトコル参照）',
        '心不全合併時: ジゴキシン or アミオダロンを検討',
        '抗凝固: CHA₂DS₂-VASc score で評価',
        '発症48時間以内 + 血行動態安定 → リズムコントロール（薬理的 or 電気的）を検討',
        '発症48時間超 or 不明 → 抗凝固3週間後に除細動 or 経食道エコーで左心耳血栓除外後に除細動',
        '【MAT】原疾患の治療（COPD・低酸素・電解質異常の補正）',
        '循環器コンサルト',
      ],
      pitfall: 'WPW + AF: RR不整の wide QRS（偽VT）に注意。β遮断薬・Ca拮抗薬・ジゴキシン禁忌。プロカインアミド or 電気的除細動',
    },
  },

  /* ── Wide QRS 頻脈 ── */
  wide_regular: {
    id: 'wide_regular', title: 'Wide QRS 頻脈: リズムの整・不整',
    desc: 'Wide QRS（>0.12秒）頻脈は原則VTとして扱う。SVT + 変行伝導/脚ブロックとの鑑別が必要。',
    choices: [
      { label: '整（Regular）', value: 'regular', icon: '📈' },
      { label: '不整（Irregular）', value: 'irregular', icon: '📉' },
    ],
    next: v => v === 'regular' ? 'wide_regular_vt' : 'wide_irregular',
  },

  wide_regular_vt: {
    id: 'wide_regular_vt', title: 'Wide QRS + Regular → VT vs SVT+変行伝導',
    desc: 'Wide regular tachycardia は診断に迷ったらVTとして扱う（safer approach）。VTの確定的所見: AV解離・capture beat・fusion beat。',
    choices: [
      { label: 'VT確定 or VTとして対応', value: 'vt', icon: '🚨', danger: true },
      { label: 'SVT+変行伝導が確実（既知の脚ブロック等）', value: 'svt', icon: '📊' },
    ],
    next: v => v === 'vt' ? 'vt_treatment' : 'svt_wide',
  },

  vt_treatment: {
    id: 'vt_treatment', title: '単形性VT（安定）の治療',
    result: {
      severity: 'urgent',
      title: '安定した単形性VT',
      actions: [
        '第一選択: アミオダロン（用量は施設プロトコル参照）',
        '代替: プロカインアミド',
        '薬剤無効 or 血行動態悪化 → 同期電気的除細動',
        '12誘導心電図（VT波形の記録 — アブレーション検討に重要）',
        '電解質確認・補正（K, Mg）',
        '心エコー（基礎心疾患の評価）',
        '循環器コンサルト（ICD適応の検討）',
      ],
      disposition: 'CCU / ICU',
      pitfall: 'Wide QRS tachycardiaで迷ったらVTとして対応するのが安全。SVTの薬剤（ベラパミル等）をVTに投与すると致死的になりうる',
    },
  },

  svt_wide: {
    id: 'svt_wide', title: 'SVT + 変行伝導（確実な場合のみ）',
    result: {
      severity: 'moderate',
      title: 'SVT + 脚ブロック/変行伝導',
      actions: [
        'narrow QRS頻脈と同じ治療アルゴリズムに従う',
        '迷走神経刺激 → アデノシン（用量は施設プロトコル参照）',
        '無効ならβ遮断薬 or Ca拮抗薬',
        '確信がなければVTとして対応する方が安全',
      ],
      pitfall: 'SVTの診断に確信がない場合は絶対にVTとして対応する。ベラパミルのVTへの投与は致死的',
    },
  },

  wide_irregular: {
    id: 'wide_irregular', title: 'Wide QRS + Irregular',
    desc: 'Wide irregular tachycardiaの鑑別: AF+変行伝導、WPW+AF、多形性VT（Torsades含む）。',
    choices: [
      { label: 'AF + 脚ブロック（既知のBBB）', value: 'af_bbb', icon: '📊' },
      { label: 'WPW + AF 疑い（極めてirregular + 波形変動大）', value: 'wpw_af', icon: '🚨', danger: true },
      { label: '多形性VT / Torsades de Pointes 疑い', value: 'torsades', icon: '🚨', danger: true },
    ],
    next: v => v === 'af_bbb' ? 'af_bbb_treatment' : v === 'wpw_af' ? 'wpw_af_treatment' : 'torsades_treatment',
  },

  af_bbb_treatment: {
    id: 'af_bbb_treatment', title: 'AF + 脚ブロック',
    result: {
      severity: 'moderate',
      title: 'AF + 既知の脚ブロック',
      actions: [
        'AFのレートコントロールに準ずる',
        'β遮断薬 or Ca拮抗薬（用量は施設プロトコル参照）',
        '抗凝固療法の評価（CHA₂DS₂-VASc score）',
      ],
      pitfall: 'WPW + AFとの鑑別が重要。既知のBBBがなければWPW+AFを疑って対応',
    },
  },

  wpw_af_treatment: {
    id: 'wpw_af_treatment', title: '🚨 WPW + AF',
    result: {
      severity: 'critical',
      title: 'WPW + AF — 副伝導路経由の頻脈',
      actions: [
        '❌ AV結節遮断薬は禁忌: アデノシン・ジゴキシン・β遮断薬・Ca拮抗薬',
        '第一選択: プロカインアミド or 電気的除細動',
        '不安定化したら直ちに同期電気的除細動',
        '循環器緊急コンサルト',
      ],
      pitfall: 'AV結節遮断薬の投与は副伝導路の伝導を促進し、VFに移行する危険がある。これが最も重要なpitfall',
    },
  },

  torsades_treatment: {
    id: 'torsades_treatment', title: '🚨 多形性VT / Torsades de Pointes',
    result: {
      severity: 'critical',
      title: '多形性VT / Torsades de Pointes',
      actions: [
        '無脈なら除細動（非同期 — 同期不能のため）',
        '【QT延長あり → Torsades】マグネシウム静注（用量は施設プロトコル参照）',
        'QT延長の原因薬剤を中止',
        '一時的ペーシング or イソプロテレノール（HR上げてQT短縮）',
        '【QT正常 → 多形性VT】虚血の検索（冠動脈造影）',
        'アミオダロン or リドカイン',
        '電解質補正（K > 4.0, Mg > 2.0 目標）',
        '循環器緊急コンサルト',
      ],
      pitfall: 'Torsadesにアミオダロン（QT延長作用あり）は禁忌。QT延長の有無で対応が真逆になる',
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

export default function TachycardiaPage() {
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
        <span className="text-tx font-medium">頻脈</span>
      </nav>

      <h1 className="text-2xl font-bold text-tx mb-2">ACLS 頻脈アルゴリズム</h1>
      <p className="text-muted mb-6">安定/不安定の評価 → QRS幅（Narrow/Wide）→ 整/不整で系統的に鑑別。SVT・AF・VT・WPW+AF・Torsadesの対応まで網羅。</p>

      <ERDisclaimerBanner />

      {history.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted">ステップ {history.length + 1}</span>
          <div className="flex-1 h-1 bg-s2 rounded-full overflow-hidden">
            <div className="h-full bg-ac rounded-full transition-all" style={{ width: `${Math.min(((history.length + 1) / 6) * 100, 100)}%` }} />
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
          <li>• ESC Guidelines on Supraventricular Tachycardia (2019)</li>
        </ul>
      </div>

      <ERDisclaimerFooter />
    </main>
  )
}
