'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner, ERDisclaimerFooter, ERResultCaution } from '@/components/tools/ERDisclaimer'

interface Choice { label: string; value: string; icon?: string; danger?: boolean }
interface TreeNode {
  id: string; title: string; desc?: string
  choices?: Choice[]
  result?: { severity: 'critical' | 'urgent' | 'moderate' | 'low'; title: string; actions: string[]; workup: string[]; disposition: string; pitfall?: string }
  next?: (selected: string) => string
}

const tree: Record<string, TreeNode> = {
  start: {
    id: 'start', title: 'Step 1: ショックの初期評価 — ABCDE + 輸液路確保',
    desc: 'sBP<90 or MAP<65 or sBP≧30低下 + 末梢循環不全（頻脈/冷汗/意識変容/乏尿/mottled skin/乳酸≧2）。まず太い静脈路2本（18G以上）確保＋モニタリング＋酸素投与。',
    choices: [
      { label: '心停止/無脈 → CPR + ACLSアルゴリズム', value: 'arrest', icon: '🔴', danger: true },
      { label: '出血/体液喪失が明らか（外傷/消化管出血/下痢/嘔吐/3rd space）', value: 'hypovolemic', icon: '🩸', danger: true },
      { label: '胸痛/不整脈/心不全徴候（頸静脈怒張+肺ラ音）', value: 'cardiogenic', icon: '💔', danger: true },
      { label: '突然の呼吸困難+片側呼吸音↓ / 頸静脈怒張+肺ラ音なし', value: 'obstructive', icon: '🫁', danger: true },
      { label: '発熱+感染徴候 / 温かいショック', value: 'septic', icon: '🦠', danger: true },
      { label: '薬剤/食物曝露後 + 蕁麻疹/喘鳴/顔面浮腫', value: 'anaphylaxis', icon: '🚨', danger: true },
      { label: '分類がつかない → 系統的に評価', value: 'systematic', icon: '🔍' },
    ],
    next: v => v,
  },

  arrest: {
    id: 'arrest', title: '🔴 心停止 → ACLS',
    result: { severity: 'critical', title: '心停止 — CPR + ACLSアルゴリズム',
      actions: [
        'CPR開始（30:2 or 挿管後は連続圧迫100-120/min）',
        'モニター装着: VF/pVT → 除細動 200J → CPR 2min → 除細動反復',
        'Asystole/PEA → CPR + アドレナリン 1mg iv q3-5min',
        'VF/pVT持続 → アミオダロン 300mg → 150mg',
        '可逆的原因(5H5T)の検索・治療',
        '5H: 低酸素/低体温/低K or 高K/低血糖/Hypovolemia',
        '5T: 緊張性気胸/心タンポナーデ/Toxin/血栓(PE/AMI)/Trauma',
        'ROSC後: TTM(32-36℃, 24h) + 12誘導心電図 + 緊急冠動脈造影(STEMI時)',
      ],
      workup: ['12誘導心電図（ROSC後即座に）', 'ABG', '電解質(K)', 'エコー（PEA時: タンポナーデ/PE/Hypovolemia）', 'FAST（外傷時）'],
      disposition: 'ROSC後: ICU + TTM。心停止の原因治療',
      pitfall: 'PEAの原因検索が最重要。「心臓が動いているが脈がない」→ 可逆的原因を探し続ける。エコーをCPR中に活用',
    },
  },

  hypovolemic: {
    id: 'hypovolemic', title: 'Step 2: 出血/体液喪失 — 出血源は？',
    desc: 'Class III出血（30-40%喪失）以上でショックが顕在化。頻脈が初期サイン。',
    choices: [
      { label: '外傷性出血（外出血/腹腔内/後腹膜/骨盤/胸腔）', value: 'trauma_bleed', icon: '🚑', danger: true },
      { label: '消化管出血（吐血/下血/黒色便）', value: 'gi_bleed', icon: '🩸', danger: true },
      { label: '大動脈瘤破裂疑い（突然の腹痛/背部痛+低血圧+拍動性腫瘤）', value: 'aaa', icon: '🔴', danger: true },
      { label: '異所性妊娠破裂疑い（妊娠可能年齢女性+腹痛+低血圧）', value: 'ectopic', icon: '🔴', danger: true },
      { label: '非出血性（脱水/下痢/嘔吐/熱中症/DKA）', value: 'dehydration', icon: '💧' },
    ],
    next: v => v,
  },

  trauma_bleed: {
    id: 'trauma_bleed', title: '🚑 外傷性出血性ショック',
    result: { severity: 'critical', title: '外傷性出血 — 止血 + MTP',
      actions: [
        '太い末梢静脈路2本（18G以上）+ 骨髄路（iv困難時）',
        '大量輸血プロトコル(MTP)発動: RBC:FFP:PC = 1:1:1',
        '初期: O型RBC（クロスマッチ待たず）',
        'トラネキサム酸(TXA) 1g iv（受傷3h以内、CRASH-2）',
        'FAST: 腹腔内液体貯留→緊急開腹',
        '骨盤骨折→シーツラッピング/骨盤バインダー→TAE or preperitoneal packing',
        '胸腔出血>1500mL初回 or >200mL/h持続→緊急開胸',
        'Permissive hypotension: 穿通性外傷ではsBP 80-90を許容（大量輸液より止血優先）',
        '目標: Hb>7, Plt>50k, Fib>150, pH>7.2, Ca²⁺>1.0, 体温>35℃',
      ],
      workup: ['FAST', 'CBC/凝固/Fib/血液型', '乳酸値', 'ABG（BE）', '骨盤X線', '胸部X線', 'CT（安定化後）'],
      disposition: '手術室/IVR/ICU。止血が最優先',
      pitfall: 'Lethal triad（低体温+アシドーシス+凝固障害）を防ぐ。大量輸液より早期止血+バランス輸血。初期Hbは出血量を反映しない',
    },
  },

  gi_bleed: {
    id: 'gi_bleed', title: '🩸 消化管出血+ショック',
    result: { severity: 'critical', title: '消化管出血性ショック',
      actions: [
        '輸液路2本 + 輸血準備（T&S→O型RBC）',
        '上部消化管出血疑い: PPI iv（オメプラゾール 80mg bolus→8mg/h持続）',
        '緊急内視鏡（24h以内、ショック時は安定化後速やかに）',
        '静脈瘤破裂疑い: オクトレオチド 50μg bolus→50μg/h + 抗菌薬 + 内視鏡的結紮術',
        'Sengstaken-Blakemore tube（内視鏡止血困難時のbridge）',
        '下部消化管出血: 大量なら大腸内視鏡 or 血管造影（TAE）',
        '抗凝固薬→拮抗薬投与検討',
        'GBS(Glasgow-Blatchford Score)で入院/内視鏡の緊急度判断',
      ],
      workup: ['CBC（Hb経時的）', '凝固/血液型/クロスマッチ', '乳酸値', '肝機能', 'BUN/Cr', '上部消化管内視鏡'],
      disposition: 'ICU管理 + 緊急内視鏡',
      pitfall: '吐血なしでも上部消化管出血はありうる（黒色便/BUN/Cr比上昇）。NGチューブ留置は感度低い。安定するまで抗凝固薬再開しない',
    },
  },

  aaa: {
    id: 'aaa', title: '🔴 AAA破裂疑い',
    result: { severity: 'critical', title: 'AAA破裂 — 手術室へ',
      actions: [
        '腹部大動脈瘤破裂は3徴: 腹痛/背部痛+低血圧+拍動性腫瘤（全て揃うのは50%）',
        '安定: 造影CT→血管外科コンサルト',
        '不安定: CTなしで手術室直行（bedside echo→AAA確認で十分）',
        'Permissive hypotension（sBP 70-80）: 大量輸液は出血を増やす',
        '輸血準備（MTP発動）',
        '血管外科/救急外科に即コール',
      ],
      workup: ['FAST/bedside echo（AAA確認）', '造影CT（安定時のみ）', 'CBC/凝固/血液型', '乳酸値'],
      disposition: '緊急手術（EVAR or 開腹）',
      pitfall: '3徴揃わないことが多い。腰痛+低血圧の高齢男性→AAA破裂を必ず鑑別に。不安定ならCTに行かず手術室へ',
    },
  },

  ectopic: {
    id: 'ectopic', title: '🔴 異所性妊娠破裂',
    result: { severity: 'critical', title: '異所性妊娠破裂',
      actions: [
        '妊娠可能年齢の女性の腹痛+ショック→異所性妊娠を必ず疑う',
        '尿中hCG（即座に）→陽性ならエコー',
        '経腟エコー: 子宮内妊娠がない+Douglas窩液体貯留→破裂疑い',
        '産婦人科コンサルト→緊急手術（腹腔鏡 or 開腹）',
        '輸液+輸血準備',
        'Rh(-)→抗D免疫グロブリン投与',
      ],
      workup: ['尿中hCG', '経腟エコー', 'CBC/血液型/クロスマッチ', 'FAST'],
      disposition: '産婦人科→緊急手術',
      pitfall: '「最終月経が正常」でも異所性妊娠は否定できない（不正出血を月経と誤認）。全ての妊娠可能年齢女性にhCGを',
    },
  },

  dehydration: {
    id: 'dehydration', title: '💧 非出血性体液喪失',
    result: { severity: 'urgent', title: '脱水/体液喪失',
      actions: [
        '晶質液（生食 or 乳酸リンゲル）500-1000mL急速投与',
        '輸液反応性の評価（30mL/kg or PLR test）',
        '原因治療: 嘔吐→制吐薬、下痢→感染検索、DKA→インスリン',
        '電解質補正（K/Mg/Ca/PO4）',
        '経口補水が可能なら早期に開始',
        '目標: MAP≧65, 尿量≧0.5mL/kg/h',
      ],
      workup: ['電解質/BUN/Cr', '血糖', '乳酸値', '尿検査', 'CBC', 'ABG/VBG（アシドーシス疑い時）'],
      disposition: '原因に応じて入院 or 補液後帰宅',
      pitfall: '高齢者の脱水は口渇感が乏しく症状が非典型的。BUN/Cr比>20は脱水を示唆',
    },
  },

  cardiogenic: {
    id: 'cardiogenic', title: '💔 心原性ショック',
    result: { severity: 'critical', title: '心原性ショック',
      actions: [
        '12誘導心電図: STEMI→緊急PCI（door-to-balloon 90min）',
        '心エコー: 壁運動異常/弁膜症/心タンポナーデ/右室不全の評価',
        '輸液は慎重（肺うっ血なければ250mL試行）',
        '昇圧: ノルアドレナリン（低血圧主体）+ ドブタミン（低心拍出主体）',
        '肺うっ血→フロセミド 20-40mg iv + NPPV',
        '不整脈→ACLSアルゴリズムに従う',
        '重症→IABP/ECMO/Impellaの検討（循環器コンサルト）',
        '急性弁不全/心室中隔穿孔/乳頭筋断裂→緊急手術',
      ],
      workup: ['12誘導心電図', '心エコー', 'トロポニン', 'BNP/NT-proBNP', '乳酸値', '胸部X線', 'ABG'],
      disposition: 'CCU/ICU。STEMI→緊急カテ室',
      pitfall: '心原性に大量輸液は禁忌（肺水腫悪化）。右室梗塞（下壁STEMI+右側胸部誘導ST↑）は輸液で改善。ドパミンよりノルアドレナリン（SOAP II）',
    },
  },

  obstructive: {
    id: 'obstructive', title: '🫁 閉塞性ショック',
    desc: '頸静脈怒張+肺ラ音なし→PE/気胸/タンポナーデ',
    choices: [
      { label: '緊張性気胸（一側呼吸音消失+気管偏位+低血圧+頸静脈怒張）', value: 'tension_ptx', icon: '🔴', danger: true },
      { label: '心タンポナーデ（Beck 3徴: 頸静脈怒張+低血圧+心音減弱）', value: 'tamponade', icon: '🔴', danger: true },
      { label: '大量肺塞栓（突然の呼吸困難+頻脈+低血圧+右室拡大）', value: 'massive_pe', icon: '🔴', danger: true },
    ],
    next: v => v,
  },

  tension_ptx: {
    id: 'tension_ptx', title: '🔴 緊張性気胸',
    result: { severity: 'critical', title: '緊張性気胸 — 画像を待たず脱気',
      actions: [
        '臨床診断で即時脱気（画像確認不要）',
        '針脱気: 鎖骨中線第2肋間 or 中腋窩線第5肋間に14-16G針',
        'シューと空気が出れば確認',
        'その後胸腔ドレーン留置（28-32Fr）',
        '人工呼吸器管理中は急速に進行する',
      ],
      workup: ['臨床診断（画像を待たない）', '胸部X線（処置後確認用）'],
      disposition: 'ドレーン留置後ICU',
      pitfall: 'CTで確認してから…は致命的な遅れ。外傷+片側呼吸音消失+ショック→迷わず脱気',
    },
  },

  tamponade: {
    id: 'tamponade', title: '🔴 心タンポナーデ',
    result: { severity: 'critical', title: '心タンポナーデ — 心嚢穿刺',
      actions: [
        'bedside心エコーで心嚢液+右室拡張期虚脱を確認',
        '心嚢穿刺（エコーガイド下、剣状突起下アプローチ）',
        '外傷性→緊急開胸（ED thoracotomy）の適応検討',
        '輸液: 右室前負荷維持のため急速輸液',
        '昇圧: ノルアドレナリン',
        '陽圧換気は前負荷を下げるため可能なら避ける',
      ],
      workup: ['bedside心エコー', '心電図（low voltage/電気的交互脈）', '胸部X線（心拡大）'],
      disposition: 'ICU + 心臓外科/循環器コンサルト',
      pitfall: 'Beck 3徴が全て揃うのは稀。エコーが最も信頼できる。外傷性タンポナーデは穿刺より開胸が第一選択のことも',
    },
  },

  massive_pe: {
    id: 'massive_pe', title: '🔴 大量肺塞栓',
    result: { severity: 'critical', title: 'Massive PE — 血栓溶解 or カテーテル治療',
      actions: [
        'ヘパリン: 確定前でも臨床的に高確率なら開始（UFH 80U/kg bolus→18U/kg/h）',
        'CTPA（安定化できれば）or bedside心エコー（右室拡大/D-shape）で診断',
        'Massive PE(ショック/心停止): rt-PA 100mg iv 2h → 血栓溶解療法',
        '心停止中のPE: rt-PA 50mg iv bolus → CPR継続',
        '輸液: 500mL（右室前負荷維持。ただし過剰は禁忌）',
        '昇圧: ノルアドレナリン',
        'カテーテル血栓除去/外科的血栓除去（血栓溶解禁忌時）',
        'Submassive PE（右室不全あり/血圧正常）: 抗凝固+経過観察 or 血栓溶解検討',
      ],
      workup: ['CTPA', 'bedside心エコー（右室/D-shape）', '心電図（S1Q3T3/右軸偏位/V1-4のT波逆転）', 'トロポニン/BNP', 'D-dimer（除外目的のみ）', '下肢静脈エコー'],
      disposition: 'ICU。Massive→血栓溶解後も24-48h厳重管理',
      pitfall: '不安定なPEにCTPA搬送は危険。bedside心エコーで右室拡大を確認し治療開始。D-dimerは陰性なら除外に使えるが、ショック+PE疑いでは測定不要',
    },
  },

  septic: {
    id: 'septic', title: '🦠 敗血症性ショック',
    result: { severity: 'critical', title: '敗血症性ショック — Hour-1 Bundle',
      actions: [
        '血液培養2セット採取（抗菌薬前に）',
        '1時間以内に広域抗菌薬開始（培養結果を待たない）',
        '初期輸液: 晶質液 30mL/kg を3時間以内（理想は1時間以内に開始）',
        '乳酸値測定 → ≧4なら積極蘇生',
        'MAP<65持続→ノルアドレナリン開始（末梢静脈から開始可、中心静脈ルート並行確保）',
        '感染源検索+コントロール: 膿瘍ドレナージ/デバイス抜去/壊死組織デブリ',
        '輸液反応性の評価（PLR/SVV/エコー下IVC）',
        'ノルアド高用量(>0.25μg/kg/min)で不十分→バソプレシン 0.03U/min追加',
        '昇圧剤反応不良→ヒドロコルチゾン 200mg/日(50mg q6h)',
      ],
      workup: ['血液培養2セット', '乳酸値（初回+2-4h後再検）', 'CBC/CRP/PCT', '電解質/腎機能/肝機能', '凝固（DICスクリーニング）', '尿検査/尿培養', '胸部X線', '感染巣に応じたCT/エコー'],
      disposition: 'ICU管理。Hour-1 Bundle完遂が最優先',
      pitfall: '「培養結果を待って」は致命的。抗菌薬は1時間遅れるごとに死亡率7-8%上昇。輸液反応性がない患者への過剰輸液は肺水腫',
    },
  },

  anaphylaxis: {
    id: 'anaphylaxis', title: '🚨 アナフィラキシーショック',
    result: { severity: 'critical', title: 'アナフィラキシー — アドレナリン筋注',
      actions: [
        '① アドレナリン 0.3-0.5mg(1:1000)筋注（大腿外側中央）— 即座に、最重要',
        '② 原因薬剤/アレルゲンの投与中止・除去',
        '③ 仰臥位+下肢挙上（呼吸困難時は座位可）',
        '④ 生理食塩水 1-2L急速投与',
        '⑤ 酸素投与（高流量）',
        '⑥ 改善なし→アドレナリン追加（5-15分毎、最大3回）',
        '⑦ それでも改善なし→アドレナリン持続iv（1:10000で0.1μg/kg/min〜）',
        '⑧ 気道確保: 声門浮腫→早めの挿管判断（遅れると困難に）→輪状甲状靭帯切開準備',
        '⑨ mPSL 125mg iv（二相性反応予防）',
        '⑩ ジフェンヒドラミン 50mg iv + ファモチジン 20mg iv',
        '⑪ 気管支攣縮→サルブタモール吸入',
      ],
      workup: ['バイタル持続モニタリング', 'トリプターゼ（発症1-2h後に採血→確定診断用）', 'ABG（重症時）', '心電図（高齢者）'],
      disposition: '最低6-8h経過観察（二相性反応: 最大20%が1-12h後に再発）。重症→ICU',
      pitfall: 'アドレナリン筋注の躊躇が最大のリスク因子。iv投与は必ず1:10000に希釈。β遮断薬服用中はアドレナリン抵抗性→グルカゴン 1-2mg iv',
    },
  },

  systematic: {
    id: 'systematic', title: 'Step 2: 系統的ショック評価 — RUSH exam',
    desc: 'Rapid Ultrasound in Shock and Hypotension。Pump(心臓)/Tank(容量)/Pipe(大血管)の3ステップ。',
    choices: [
      { label: '心エコー: 壁運動低下/弁膜症 → 心原性', value: 'cardiogenic', icon: '💔' },
      { label: 'IVC虚脱 + 四肢冷たい → 循環血液量減少性', value: 'hypovolemic', icon: '🩸' },
      { label: 'IVC拡大 + 肺ラ音なし → 閉塞性（PE/タンポナーデ/気胸）', value: 'obstructive', icon: '🫁' },
      { label: 'IVC正常/軽度拡大 + 発熱/温かい四肢 → 分布異常性', value: 'septic', icon: '🦠' },
      { label: '大動脈にflap/拡大 → AAA/解離', value: 'aaa', icon: '🔴', danger: true },
    ],
    next: v => v,
  },
}

const severityConfig = {
  critical: { bg: 'bg-[#FDE8E8]', border: 'border-[#C62828]', text: 'text-[#B71C1C]', badge: '🔴 緊急' },
  urgent: { bg: 'bg-[#FFF3E0]', border: 'border-[#E65100]', text: 'text-[#BF360C]', badge: '🟠 準緊急' },
  moderate: { bg: 'bg-[#FFF8E1]', border: 'border-[#F9A825]', text: 'text-[#F57F17]', badge: '🟡 中等度' },
  low: { bg: 'bg-[#E8F5E9]', border: 'border-[#2E7D32]', text: 'text-[#1B5E20]', badge: '🟢 低リスク' },
}

export default function ShockERPage() {
  const [path, setPath] = useState<{ nodeId: string; selected?: string }[]>([{ nodeId: 'start' }])
  const handleChoice = (nodeId: string, value: string) => {
    const node = tree[nodeId]; if (!node?.next) return
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
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/er" className="hover:text-ac">ER対応</Link><span className="mx-2">›</span>
        <span>ショック</span>
      </nav>
      <header className="mb-6">
        <span className="inline-block text-sm bg-dnl text-dn px-2.5 py-0.5 rounded-full font-medium mb-2">🚨 ER対応</span>
        <h1 className="text-2xl font-bold text-tx mb-1">ショック（血圧低下）ER対応ツリー</h1>
        <p className="text-sm text-muted">4分類（出血性/心原性/閉塞性/分布異常性）の系統的鑑別。RUSH examベース。各分類の初期治療を含む。</p>
      </header>
      <ERDisclaimerBanner />
      {path.length > 1 && <button onClick={reset} className="text-sm text-ac hover:underline mb-4 flex items-center gap-1">↺ 最初からやり直す</button>}
      <div className="space-y-4">
        {path.map((p, i) => {
          const node = tree[p.nodeId]; if (!node) return null
          if (node.result) {
            const cfg = severityConfig[node.result.severity]
            return (
              <div key={i} className={`rounded-xl p-5 border-l-4 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-center gap-2 mb-3"><span className={`text-sm font-bold ${cfg.text}`}>{cfg.badge}</span></div>
                <h3 className={`text-lg font-bold mb-3 ${cfg.text}`}>{node.result.title}</h3>
                <div className="space-y-3">
                  <div><h4 className="text-sm font-bold text-tx mb-1">対応</h4><ol className="text-sm text-tx/90 space-y-1">{node.result.actions.map((a, j) => <li key={j} className="flex gap-2"><span className="text-muted font-mono text-xs mt-0.5">{j + 1}.</span><span>{a}</span></li>)}</ol></div>
                  <div><h4 className="text-sm font-bold text-tx mb-1">検査</h4><div className="flex flex-wrap gap-1.5">{node.result.workup.map((w, j) => <span key={j} className="text-xs bg-white/60 text-tx px-2 py-1 rounded-lg">{w}</span>)}</div></div>
                  <div><h4 className="text-sm font-bold text-tx mb-1">Disposition</h4><p className="text-sm text-tx/90">{node.result.disposition}</p></div>
                  {node.result.pitfall && <div className="bg-wnl border border-wnb rounded-lg p-3 mt-2"><p className="text-sm font-bold text-wn mb-1">⚠️ ピットフォール</p><p className="text-sm text-wn">{node.result.pitfall}</p></div>}
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
              <div className="space-y-2">{node.choices?.map(c => {
                const isSel = p.selected === c.value; const isOth = isCompleted && !isSel
                return <button key={c.value} onClick={() => !isCompleted && handleChoice(node.id, c.value)} disabled={isOth}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-start gap-2 ${isSel ? 'bg-ac/10 border-2 border-ac text-ac font-medium' : isOth ? 'bg-s1/30 border border-br/30 text-muted/50 cursor-not-allowed' : c.danger ? 'bg-dnl/50 border border-dnb/50 text-tx hover:bg-dnl hover:border-dnb cursor-pointer' : 'bg-s0 border border-br text-tx hover:bg-acl hover:border-ac/30 cursor-pointer'}`}>
                  {c.icon && <span className="mt-0.5">{c.icon}</span>}<span>{c.label}</span>{isSel && <span className="ml-auto text-ac">✓</span>}
                </button>
              })}</div>
            </div>
          )
        })}
      </div>
      <section className="mt-8 mb-8"><h2 className="text-lg font-bold mb-3">関連スコア・ツール</h2>
        <div className="flex flex-wrap gap-2">{[{slug:'qsofa',name:'qSOFA'},{slug:'sofa',name:'SOFA'},{slug:'shock-index',name:'Shock Index'},{slug:'map',name:'MAP計算'}].map(t => <Link key={t.slug} href={`/tools/calc/${t.slug}`} className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">{t.name}</Link>)}</div>
      </section>
      <ERDisclaimerFooter />
    </div>
  )
}
