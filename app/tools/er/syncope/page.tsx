'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner, ERDisclaimerFooter, ERResultCaution } from '@/components/tools/ERDisclaimer'

/* ────────── 型定義 ────────── */
interface Choice { label: string; value: string; icon?: string; danger?: boolean }
interface TreeNode {
  id: string; title: string; desc?: string
  choices?: Choice[]
  result?: { severity: 'critical' | 'urgent' | 'moderate' | 'low'; title: string; actions: string[]; workup: string[]; disposition: string; pitfall?: string }
  next?: (selected: string) => string
}

/* ────────── 意思決定ツリー定義 ────────── */
const tree: Record<string, TreeNode> = {
  start: {
    id: 'start', title: 'Step 1: 本当に失神か？ — 一過性意識消失の確認',
    desc: '失神（syncope）は一過性の全脳灌流低下による意識消失で、自然に完全回復する。てんかん・低血糖・過換気・心因性を除外。',
    choices: [
      { label: '典型的失神（前駆症状→意識消失→速やかに完全回復）', value: 'syncope', icon: '✅' },
      { label: '痙攣・舌咬傷・意識回復遅延あり → てんかんの可能性', value: 'seizure', icon: '⚡' },
      { label: '現在も意識障害が持続', value: 'persistent', icon: '🚨', danger: true },
    ],
    next: v => ({ syncope: 'vitals', seizure: 'seizure_result', persistent: 'persistent_result' }[v] || 'vitals'),
  },

  persistent_result: {
    id: 'persistent_result', title: '⚠️ 意識障害持続 → 失神ではなく意識障害として対応',
    result: {
      severity: 'critical',
      title: '持続する意識障害 → 意識障害対応フローへ',
      actions: [
        'ABCDEアプローチで安定化',
        '血糖即座に確認 → 低血糖なら補正',
        '意識障害対応ツリーに移行',
      ],
      workup: ['血糖', '血液ガス', 'CBC', '電解質', '頭部CT'],
      disposition: '意識障害として精査',
      pitfall: '「失神後の遷延する意識障害」はくも膜下出血・不整脈後の低灌流を考慮',
    },
  },

  seizure_result: {
    id: 'seizure_result', title: '⚡ てんかん発作疑い',
    result: {
      severity: 'urgent',
      title: 'てんかん発作疑い — 失神とは異なるアプローチ',
      actions: [
        'バイタルサイン・SpO₂モニタリング',
        '発作持続中なら抗てんかん薬投与（施設プロトコル参照）',
        '口腔内損傷・舌咬傷の確認',
        '既知のてんかんか初発か確認',
        '初発なら頭部画像検査を考慮',
        '神経内科コンサルト',
      ],
      workup: ['血糖', '電解質（Na, Ca, Mg）', 'CBC', '抗てんかん薬血中濃度（既知の場合）', '頭部CT/MRI', '脳波（退院前/外来で）'],
      disposition: '初発は入院精査。既知のてんかんで速やかに回復なら外来フォロー可',
      pitfall: '痙攣性失神（convulsive syncope）は失神時の短い四肢の不随意運動で、てんかんではない。持続時間が短く（<15秒）、完全に回復する点で鑑別',
    },
  },

  vitals: {
    id: 'vitals', title: 'Step 2: バイタルサイン・身体所見の評価',
    desc: 'バイタル異常は高リスク失神を示唆。起立性低血圧のチェック（臥位→立位3分後にsBP≧20mmHg低下）も忘れずに。',
    choices: [
      { label: 'バイタル異常あり（徐脈<40/頻脈>150/低血圧/低酸素）', value: 'abnormal', icon: '🚨', danger: true },
      { label: 'バイタル安定・起立性低血圧あり', value: 'orthostatic', icon: '📉' },
      { label: 'バイタル安定・起立性低血圧なし', value: 'stable', icon: '✅' },
    ],
    next: v => ({ abnormal: 'unstable_result', orthostatic: 'orthostatic_node', stable: 'ecg' }[v] || 'ecg'),
  },

  unstable_result: {
    id: 'unstable_result', title: '🚨 バイタル異常 → 心原性失神を最優先で評価',
    result: {
      severity: 'critical',
      title: 'バイタル異常を伴う失神 → 心原性の緊急評価',
      actions: [
        'モニター装着（心電図・SpO₂・血圧）',
        '末梢ルート確保',
        '12誘導心電図（即座に）',
        '徐脈（<40bpm）持続 → 経皮ペーシング準備',
        '頻脈性不整脈 → 不安定ならカルディオバージョン準備',
        '低血圧 → 輸液負荷 + 原因検索',
        '循環器コンサルト',
      ],
      workup: ['12誘導心電図', 'トロポニン', 'BNP/NT-proBNP', '心エコー', 'CBC', '電解質', '血液ガス'],
      disposition: 'CCU/ICU（不整脈モニタリング）',
      pitfall: '高度房室ブロック・QT延長・Brugadaパターンを見逃さない。失神時の心電図は正常でも間欠的不整脈の可能性あり',
    },
  },

  orthostatic_node: {
    id: 'orthostatic_node', title: 'Step 2b: 起立性低血圧の原因評価',
    desc: '起立3分後にsBP≧20mmHg低下または90mmHg未満。脱水・出血・薬剤性を鑑別。',
    choices: [
      { label: '脱水所見あり（口渇・皮膚ツルゴール低下・頻脈）', value: 'dehydration', icon: '💧' },
      { label: '消化管出血・貧血の徴候あり（黒色便・顔面蒼白・低Hb）', value: 'bleeding', icon: '🩸', danger: true },
      { label: '降圧薬・利尿薬・α遮断薬の使用あり', value: 'drug', icon: '💊' },
      { label: '上記に該当しない / 自律神経障害の疑い', value: 'autonomic', icon: '🧠' },
    ],
    next: v => ({ dehydration: 'dehydration_result', bleeding: 'bleeding_result', drug: 'drug_oh_result', autonomic: 'autonomic_result' }[v] || 'dehydration_result'),
  },

  bleeding_result: {
    id: 'bleeding_result', title: '🩸 消化管出血による起立性低血圧',
    result: {
      severity: 'critical',
      title: '出血による起立性低血圧 → 輸血準備・消化器コンサルト',
      actions: [
        '大口径末梢ルート2本確保',
        '急速輸液',
        '血液型・クロスマッチ提出',
        '直腸診（黒色便・血便確認）',
        '消化器内科コンサルト（緊急内視鏡の適応判断）',
        'Hb低値なら輸血（施設基準で判断）',
      ],
      workup: ['CBC（Hb/Hct）', '凝固（PT-INR）', 'BUN/Cr', '血液型・クロスマッチ', '乳酸'],
      disposition: '入院（出血量・バイタルにより一般病棟〜ICU）',
      pitfall: '急性出血初期ではHbが正常値を示すことがある。バイタルの変動と乳酸値で重症度を評価',
    },
  },

  dehydration_result: {
    id: 'dehydration_result', title: '💧 脱水による起立性低血圧',
    result: {
      severity: 'moderate',
      title: '脱水 → 補液・原因検索',
      actions: [
        '末梢ルート確保・補液',
        '脱水の原因検索（嘔吐・下痢・経口摂取不良・発熱）',
        '原因に対する治療',
        '補液後の起立性低血圧の改善を確認',
      ],
      workup: ['CBC', '電解質', 'BUN/Cr', '血糖', '尿検査'],
      disposition: '補液で改善 → 外来フォロー。改善不良 → 入院',
      pitfall: '高齢者の「脱水による失神」の裏に感染症や心不全が隠れていることがある',
    },
  },

  drug_oh_result: {
    id: 'drug_oh_result', title: '💊 薬剤性起立性低血圧',
    result: {
      severity: 'low',
      title: '薬剤性起立性低血圧 → 処方見直し',
      actions: [
        '原因薬剤の特定（降圧薬・利尿薬・α遮断薬・抗パーキンソン薬・三環系抗うつ薬）',
        '減量・変更・中止の検討（処方医と相談）',
        '生活指導（ゆっくり立ち上がる・弾性ストッキング・十分な水分摂取）',
        '受傷の有無を確認',
      ],
      workup: ['12誘導心電図（QT延長確認）', '基本血液検査'],
      disposition: '外来フォロー（処方調整後）',
      pitfall: '複数の降圧薬を使用している高齢者は特にリスクが高い。転倒による外傷の合併に注意',
    },
  },

  autonomic_result: {
    id: 'autonomic_result', title: '🧠 自律神経障害疑い',
    result: {
      severity: 'moderate',
      title: '自律神経障害 → 専門医紹介',
      actions: [
        '基礎疾患の確認（糖尿病・パーキンソン病・多系統萎縮症・アミロイドーシス）',
        '生活指導（ゆっくり立位・弾性ストッキング・塩分摂取増加・就寝時頭部挙上）',
        '神経内科紹介',
      ],
      workup: ['12誘導心電図', '基本血液検査', 'HbA1c', 'Head-up tilt test（外来で）'],
      disposition: '外来フォロー（神経内科）',
      pitfall: '純粋自律神経不全は稀。糖尿病性自律神経障害が最多の原因',
    },
  },

  ecg: {
    id: 'ecg', title: 'Step 3: 12誘導心電図の評価',
    desc: '失神患者の心電図は必須。高リスク所見の有無で方針が大きく変わる。',
    choices: [
      { label: '高リスク所見あり（下記参照）', value: 'highrisk', icon: '🚨', danger: true },
      { label: '正常 or 軽度非特異的変化', value: 'normal', icon: '📋' },
    ],
    next: v => v === 'highrisk' ? 'ecg_highrisk' : 'history',
  },

  ecg_highrisk: {
    id: 'ecg_highrisk', title: '🚨 心電図高リスク所見 → 心原性失神を疑う',
    result: {
      severity: 'urgent',
      title: '心電図異常を伴う失神 → 入院・循環器コンサルト',
      actions: [
        'テレメーターモニタリング開始',
        '循環器コンサルト',
        '心エコー（構造的心疾患の評価）',
        '高リスク所見に応じた対応：',
        '　- 2度以上の房室ブロック → ペーシング適応評価',
        '　- QTc延長（>500ms）→ 電解質補正・原因薬剤中止',
        '　- Brugadaパターン → 循環器緊急コンサルト',
        '　- 新規脚ブロック → 急性心筋梗塞の除外',
        '　- WPWパターン → 電気生理検査の適応評価',
      ],
      workup: ['トロポニン', 'BNP/NT-proBNP', '電解質（K, Mg, Ca）', '心エコー', '必要に応じてホルター心電図・EP study'],
      disposition: '入院（テレメーター付き）',
      pitfall: '心電図高リスク所見：Mobitz II型以上のAVB、洞停止>3秒、2束/3束ブロック、VT/SVT、QTc>500ms、Brugadaパターン、WPW、ペースメーカー不全',
    },
  },

  history: {
    id: 'history', title: 'Step 4: 病歴からリスク層別化',
    desc: '心電図正常の失神。病歴で心原性リスクの高い患者を拾い上げる。',
    choices: [
      { label: '労作時失神 / 動悸先行 / 仰臥位での失神 / 心疾患の既往', value: 'cardiac_hx', icon: '❤️', danger: true },
      { label: '長時間立位・痛み・恐怖・人混み・排尿/排便/咳嗽で誘発', value: 'reflex', icon: '🔄' },
      { label: '状況に合致しない / 判断に迷う', value: 'uncertain', icon: '❓' },
    ],
    next: v => ({ cardiac_hx: 'cardiac_suspect', reflex: 'reflex_result', uncertain: 'risk_score' }[v] || 'risk_score'),
  },

  cardiac_suspect: {
    id: 'cardiac_suspect', title: '❤️ 心原性失神の疑い → 精査入院',
    result: {
      severity: 'urgent',
      title: '心原性失神疑い — 構造的心疾患・不整脈の精査',
      actions: [
        'テレメーターモニタリング',
        '心エコー（弁膜症・肥大型心筋症・壁運動異常の評価）',
        '循環器コンサルト',
        '構造的心疾患あり → 不整脈精査（ホルター/EP study）',
        '大動脈弁狭窄症 → 弁置換の適応評価',
        '肥大型心筋症 → 突然死リスク評価',
      ],
      workup: ['トロポニン', 'BNP/NT-proBNP', '心エコー', 'ホルター心電図', '必要に応じて運動負荷心電図・心臓MRI'],
      disposition: '入院精査',
      pitfall: '労作時失神は大動脈弁狭窄症・肥大型心筋症を強く示唆。仰臥位の失神は不整脈を考慮。若年者の運動中失神は肥大型心筋症・冠動脈起始異常を除外',
    },
  },

  reflex_result: {
    id: 'reflex_result', title: '🔄 反射性（神経調節性）失神',
    result: {
      severity: 'low',
      title: '反射性失神（血管迷走神経性・状況性）— 一般的に予後良好',
      actions: [
        '受傷の有無を確認',
        '生活指導（前駆症状を認識して座る/しゃがむ・誘因回避・十分な水分摂取）',
        '物理的対抗圧手技（PCM）の指導（前駆症状時に手を握り合う/脚を交差）',
        '高齢初発・頻回再発 → 精査を考慮',
        '運転制限について説明（各地域の法規に従う）',
      ],
      workup: ['12誘導心電図（済み）', '基本血液検査（必要に応じて）'],
      disposition: '帰宅可（外来フォロー）',
      pitfall: '典型的な反射性失神でも、高齢初発・外傷合併・再発性の場合は入院精査を考慮。「反射性」と安易に診断する前に、心原性を除外すること',
    },
  },

  risk_score: {
    id: 'risk_score', title: 'Step 5: リスクスコアによる層別化',
    desc: 'San Francisco Syncope Rule（SFSR）やCanadian Syncope Risk Score等を参考に入院適応を判断。SFSR: CHF既往・Ht<30%・ECG異常・呼吸困難・sBP<90のいずれかで高リスク。',
    choices: [
      { label: 'SFSR 1項目以上該当（CHF既往/Ht<30%/ECG異常/呼吸困難/sBP<90）', value: 'highrisk', icon: '🚨', danger: true },
      { label: 'SFSR 全て非該当 + 65歳以上 or 心疾患リスク因子あり', value: 'intermediate', icon: '⚠️' },
      { label: 'SFSR 全て非該当 + 若年 + リスク因子なし', value: 'lowrisk', icon: '✅' },
    ],
    next: v => ({ highrisk: 'admit_result', intermediate: 'intermediate_result', lowrisk: 'discharge_result' }[v] || 'intermediate_result'),
  },

  admit_result: {
    id: 'admit_result', title: '🚨 高リスク失神 → 入院精査',
    result: {
      severity: 'urgent',
      title: 'SFSR高リスク — 入院の上、心原性失神の精査',
      actions: [
        'テレメーターモニタリング（24-48時間）',
        '心エコー',
        '循環器コンサルト',
        '原因検索（不整脈・構造的心疾患・PE・出血 等）',
      ],
      workup: ['トロポニン', 'BNP/NT-proBNP', 'CBC（Hb/Hct）', '心エコー', '必要に応じてD-dimer・造影CT'],
      disposition: '入院（テレメーター付き）',
      pitfall: 'SFSRは感度は高いが特異度は低い。臨床判断と組み合わせて使用する',
    },
  },

  intermediate_result: {
    id: 'intermediate_result', title: '⚠️ 中リスク失神 → 個別判断',
    result: {
      severity: 'moderate',
      title: '中リスク — 入院 or 短期観察 + 外来精査',
      actions: [
        'ER滞在中のテレメーターモニタリング（6-24時間）',
        '心エコー（可能なら）',
        '帰宅させる場合は循環器外来の早期受診を手配',
        'ホルター心電図の外来予約',
        '運転制限について説明',
      ],
      workup: ['トロポニン', 'BNP/NT-proBNP', 'CBC', '心エコー（可能なら）'],
      disposition: '短期観察後帰宅（外来フォロー確約）or 入院（臨床判断）',
      pitfall: '高齢者の「原因不明失神」の約半数に心原性が含まれる。帰宅させる場合は必ず外来フォローを手配',
    },
  },

  discharge_result: {
    id: 'discharge_result', title: '✅ 低リスク失神 → 帰宅可',
    result: {
      severity: 'low',
      title: '低リスク失神 — 帰宅・外来フォロー',
      actions: [
        '受傷の確認・処置',
        '生活指導（誘因回避・前駆症状時の対処法）',
        '再発時の受診目安を説明',
        '運転制限について説明（各地域の法規に従う）',
        'かかりつけ医へのフォロー依頼',
      ],
      workup: ['12誘導心電図（済み）', '基本血液検査（済み）'],
      disposition: '帰宅（1-2週間以内にかかりつけ医受診）',
      pitfall: '低リスクでも、失神が再発する場合は再評価が必要。帰宅指示書に「再発時は再受診」を明記',
    },
  },
}

/* ────────── 色設定 ────────── */
const severityConfig = {
  critical: { bg: 'bg-[#FDE8E8]', border: 'border-[#C62828]', text: 'text-[#B71C1C]', badge: '🔴 緊急' },
  urgent: { bg: 'bg-[#FFF3E0]', border: 'border-[#E65100]', text: 'text-[#BF360C]', badge: '🟠 準緊急' },
  moderate: { bg: 'bg-[#FFF8E1]', border: 'border-[#F9A825]', text: 'text-[#F57F17]', badge: '🟡 中等度' },
  low: { bg: 'bg-[#E8F5E9]', border: 'border-[#2E7D32]', text: 'text-[#1B5E20]', badge: '🟢 低リスク' },
}

export default function SyncopeERPage() {
  const [path, setPath] = useState<{ nodeId: string; selected?: string }[]>([{ nodeId: 'start' }])

  const handleChoice = (nodeId: string, value: string) => {
    const node = tree[nodeId]
    if (!node?.next) return
    const nextId = node.next(value)
    const idx = path.findIndex(p => p.nodeId === nodeId)
    const newPath = path.slice(0, idx + 1)
    newPath[idx] = { nodeId, selected: value }
    newPath.push({ nodeId: nextId })
    setPath(newPath)
  }

  const reset = () => setPath([{ nodeId: 'start' }])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* パンくず */}
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-2">›</span>
        <Link href="/tools/er" className="hover:text-ac">ER対応</Link>
        <span className="mx-2">›</span>
        <span>失神</span>
      </nav>

      {/* ヘッダー */}
      <header className="mb-6">
        <span className="inline-block text-sm bg-dnl text-dn px-2.5 py-0.5 rounded-full font-medium mb-2">🚨 ER対応</span>
        <h1 className="text-2xl font-bold text-tx mb-1">失神 ER対応ツリー</h1>
        <p className="text-sm text-muted">
          心原性 vs 非心原性の鑑別を系統的に。一過性意識消失の確認 → バイタル → 心電図 → 病歴 → リスク層別化（SFSR）のステップフロー。
        </p>
      </header>

      <ERDisclaimerBanner />

      {path.length > 1 && (
        <button onClick={reset} className="text-sm text-ac hover:underline mb-4 flex items-center gap-1">
          ↺ 最初からやり直す
        </button>
      )}

      {/* ツリー本体 */}
      <div className="space-y-4">
        {path.map((p, i) => {
          const node = tree[p.nodeId]
          if (!node) return null

          if (node.result) {
            const cfg = severityConfig[node.result.severity]
            return (
              <div key={i} className={`rounded-xl p-5 border-l-4 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm font-bold ${cfg.text}`}>{cfg.badge}</span>
                </div>
                <h3 className={`text-lg font-bold mb-3 ${cfg.text}`}>{node.result.title}</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-tx mb-1">考慮すべき対応（施設プロトコル優先）</h4>
                    <ol className="text-sm text-tx/90 space-y-1">
                      {node.result.actions.map((a, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="text-muted font-mono text-xs mt-0.5">{j + 1}.</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-tx mb-1">検査オーダー</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {node.result.workup.map((w, j) => (
                        <span key={j} className="text-xs bg-white/60 text-tx px-2 py-1 rounded-lg">{w}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-tx mb-1">Disposition</h4>
                    <p className="text-sm text-tx/90">{node.result.disposition}</p>
                  </div>
                  {node.result.pitfall && (
                    <div className="bg-wnl border border-wnb rounded-lg p-3 mt-2">
                      <p className="text-sm font-bold text-wn mb-1">⚠️ ピットフォール</p>
                      <p className="text-sm text-wn">{node.result.pitfall}</p>
                    </div>
                  )}
                  <ERResultCaution />
                </div>
              </div>
            )
          }

          const isCompleted = p.selected !== undefined
          return (
            <div key={i} className={`rounded-xl p-5 border ${isCompleted ? 'bg-s1/50 border-br/50' : 'bg-s0 border-br'}`}>
              <h3 className={`text-base font-bold mb-1 ${isCompleted ? 'text-muted' : 'text-tx'}`}>{node.title}</h3>
              {node.desc && <p className={`text-sm mb-3 ${isCompleted ? 'text-muted/70' : 'text-muted'}`}>{node.desc}</p>}
              <div className="space-y-2">
                {node.choices?.map(c => {
                  const isSelected = p.selected === c.value
                  const isOther = isCompleted && !isSelected
                  return (
                    <button key={c.value} onClick={() => !isCompleted && handleChoice(node.id, c.value)}
                      disabled={isCompleted && !isSelected}
                      className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-start gap-2
                        ${isSelected
                          ? 'bg-ac/10 border-2 border-ac text-ac font-medium'
                          : isOther
                            ? 'bg-s1/30 border border-br/30 text-muted/50 cursor-not-allowed'
                            : c.danger
                              ? 'bg-dnl/50 border border-dnb/50 text-tx hover:bg-dnl hover:border-dnb cursor-pointer'
                              : 'bg-s0 border border-br text-tx hover:bg-acl hover:border-ac/30 cursor-pointer'
                        }`}
                    >
                      {c.icon && <span className="mt-0.5">{c.icon}</span>}
                      <span>{c.label}</span>
                      {isSelected && <span className="ml-auto text-ac">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* 関連スコア */}
      <section className="mt-8 mb-8">
        <h2 className="text-lg font-bold mb-3">関連スコア・ツール</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { slug: 'qtc', name: 'QTc' },
            { slug: 'ecog', name: 'ECOG PS' },
            { slug: 'gcs', name: 'GCS' },
            { slug: 'map', name: '平均動脈圧' },
            { slug: 'egfr', name: 'eGFR' },
          ].map(t => (
            <Link key={t.slug} href={`/tools/calc/${t.slug}`}
              className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">
              {t.name}
            </Link>
          ))}
          <Link href="/tools/er/altered-consciousness"
            className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">
            意識障害ER対応
          </Link>
        </div>
      </section>

      <ERDisclaimerFooter />

      {/* SEO解説 */}
      <section className="space-y-4 text-sm text-muted mb-8">
        <h2 className="text-base font-bold text-tx">失神の救急対応について</h2>
        <p>
          失神は救急外来の受診理由の約3%を占めます。大部分は反射性（血管迷走神経性）失神で予後良好ですが、
          心原性失神は1年死亡率が高く、見逃しが許されません。まず「本当に失神か」を確認し、
          てんかんや低血糖などの一過性意識消失の他の原因を除外することが出発点です。
        </p>
        <p>
          12誘導心電図は全失神患者に必須です。高度房室ブロック、QT延長、Brugadaパターン、WPW、
          二束/三束ブロックなどの高リスク所見は入院適応となります。心電図が正常でも、
          労作時・仰臥位の失神や心疾患の既往がある場合は心原性の可能性が高く、精査が必要です。
        </p>
        <h3 className="font-bold text-tx">San Francisco Syncope Rule（SFSR）</h3>
        <p>
          CHF既往、Ht&lt;30%、ECG異常、呼吸困難の訴え、sBP&lt;90mmHgの5項目で評価。
          1項目以上該当で高リスクとし、入院精査を考慮します。感度は高いものの特異度は限定的であり、
          臨床判断との併用が重要です。
        </p>
      </section>

      {/* 参考文献 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">参考文献</h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2">
          <li>Brignole M et al. 2018 ESC Guidelines for the diagnosis and management of syncope. Eur Heart J 2018;39:1883-1948</li>
          <li>Quinn JV et al. Derivation of the San Francisco Syncope Rule. Ann Emerg Med 2004;43:224-232</li>
          <li>Shen WK et al. 2017 ACC/AHA/HRS Guideline for the Evaluation and Management of Patients With Syncope. JACC 2017;70:e39-e110</li>
          <li>Thiruganasambandamoorthy V et al. Canadian Syncope Risk Score. CMAJ 2016;188:E289-E298</li>
          <li>Sheldon RS et al. Diagnosis and management of reflex syncope. Heart 2015;101:974-980</li>
        </ol>
      </section>
    </div>
  )
}
