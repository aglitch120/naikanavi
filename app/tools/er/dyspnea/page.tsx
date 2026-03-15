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
    id: 'start', title: 'Step 1: ABCDEアプローチ — 気道・呼吸・循環の安定性',
    desc: 'まず気道確保の要否を判断。SpO₂・呼吸数・呼吸様式・意識レベルを確認。',
    choices: [
      { label: '気道緊急あり（吸気性喘鳴・努力呼吸・気道閉塞・発声不能）', value: 'airway', icon: '🚨', danger: true },
      { label: '呼吸不全（SpO₂<90% / RR>30 / 呼吸補助筋使用 / 会話困難）', value: 'resp_failure', icon: '⚠️', danger: true },
      { label: '酸素化・換気は保たれている（SpO₂≧94, RR<25, 会話可能）', value: 'stable', icon: '✅' },
    ],
    next: v => ({ airway: 'airway_result', resp_failure: 'resp_failure_node', stable: 'onset' }[v] || 'onset'),
  },

  airway_result: {
    id: 'airway_result', title: '🚨 気道緊急 → 即座に気道確保',
    result: {
      severity: 'critical',
      title: '気道緊急 — 気道確保が最優先',
      actions: [
        '気道確保（用手的気道確保 → 気管挿管準備）',
        '酸素投与（高流量 / BVM）',
        '上気道閉塞の原因評価:',
        '　- アナフィラキシー → アドレナリン筋注（施設プロトコル参照）',
        '　- 異物 → 背部叩打 / 腹部突き上げ / 喉頭鏡下異物除去',
        '　- 喉頭蓋炎/咽後膿瘍 → 気道確保を最優先（無理な咽頭観察で悪化リスク）',
        '　- 血管性浮腫 → アドレナリン + 気道確保準備',
        '挿管困難が予測される場合は外科的気道確保の準備',
        '耳鼻科/麻酔科/救急科コンサルト',
      ],
      workup: ['（気道確保後に）血液ガス', '頸部X線/CT（安定化後）', 'CBC', 'IgE・トリプターゼ（アナフィラキシー疑い）'],
      disposition: 'ICU',
      pitfall: 'アナフィラキシーの呼吸困難は急速に進行する。アドレナリン筋注を躊躇しない。喉頭蓋炎では無理な咽頭観察が気道閉塞を悪化させる',
    },
  },

  resp_failure_node: {
    id: 'resp_failure_node', title: 'Step 1b: 呼吸不全の緊急対応',
    desc: '酸素投与を開始しつつ、緊張性気胸など即座に対処すべき病態を除外。',
    choices: [
      { label: '片側の呼吸音消失 + 頸静脈怒張 + 気管偏位 → 緊張性気胸', value: 'tension_ptx', icon: '🫁', danger: true },
      { label: '両側の呼吸音聴取可能 → 原因検索へ', value: 'bilateral', icon: '🔍' },
    ],
    next: v => v === 'tension_ptx' ? 'tension_ptx_result' : 'resp_workup',
  },

  tension_ptx_result: {
    id: 'tension_ptx_result', title: '🫁 緊張性気胸 → 即座に脱気',
    result: {
      severity: 'critical',
      title: '緊張性気胸 — 臨床診断で即座に脱気（X線を待たない）',
      actions: [
        '針脱気（鎖骨中線第2肋間 or 中腋窩線第5肋間。施設プロトコル参照）',
        '胸腔ドレーン挿入',
        '酸素投与（高流量）',
        'バイタルサインモニタリング',
        '外科/救急科コンサルト',
      ],
      workup: ['（脱気後に）胸部X線', '血液ガス', 'CBC'],
      disposition: 'ICU（ドレーン管理）',
      pitfall: '緊張性気胸は臨床診断。X線撮影を待つ余裕はない。CPR中の急変でも常に鑑別に挙げる（PEA/心停止の可逆的原因4Ts）',
    },
  },

  resp_workup: {
    id: 'resp_workup', title: 'Step 1c: 呼吸不全の原因検索',
    desc: '酸素投与しつつ、胸部X線・血液ガス・心電図を同時進行。',
    choices: [
      { label: '胸部X線: 浸潤影/肺水腫パターン → 肺炎 or 心不全', value: 'infiltrate', icon: '📸' },
      { label: '胸部X線: ほぼ正常 + 低酸素 → PE・喘息・COPD', value: 'clear_cxr', icon: '📋' },
      { label: '胸部X線: 気胸/胸水/無気肺', value: 'other_cxr', icon: '🫁' },
    ],
    next: v => ({ infiltrate: 'infiltrate_node', clear_cxr: 'clear_cxr_node', other_cxr: 'other_cxr_result' }[v] || 'infiltrate_node'),
  },

  infiltrate_node: {
    id: 'infiltrate_node', title: 'Step 2: 浸潤影 — 肺炎 vs 心原性肺水腫 vs ARDS',
    desc: 'BNP/NT-proBNP、心エコー、病歴で鑑別。両側蝶形陰影は心不全を示唆。',
    choices: [
      { label: '心不全を示唆（起座呼吸・発作性夜間呼吸困難・下腿浮腫・BNP高値・両側蝶形影）', value: 'hf', icon: '❤️' },
      { label: '肺炎を示唆（発熱・咳・痰・片側浸潤影）', value: 'pneumonia', icon: '🌡️' },
      { label: 'ARDS疑い（両側浸潤影+P/F比<300+心不全否定）', value: 'ards', icon: '🚨', danger: true },
    ],
    next: v => ({ hf: 'hf_result', pneumonia: 'pneumonia_result', ards: 'ards_result' }[v] || 'hf_result'),
  },

  hf_result: {
    id: 'hf_result', title: '❤️ 急性心不全 / 肺水腫',
    result: {
      severity: 'urgent',
      title: '急性心不全 — 酸素化改善 + 利尿 + 原因検索',
      actions: [
        '座位（起座位）にする',
        '酸素投与（NPPV/CPAPを積極的に考慮。SpO₂≧94%目標）',
        '利尿薬静注（薬剤・用量は施設プロトコル参照）',
        '硝酸薬（sBP>110の場合に考慮。施設プロトコル参照）',
        '増悪因子の検索（ACS・不整脈・弁膜症悪化・感染・アドヒアランス不良・腎不全）',
        'STEMI合併 → 緊急PCI',
        'NPPV不応の呼吸不全 → 気管挿管',
        '循環器コンサルト',
      ],
      workup: ['BNP/NT-proBNP', 'トロポニン', '12誘導心電図', '心エコー', '胸部X線', '血液ガス', 'CBC', '電解質・腎機能'],
      disposition: 'CCU/ICU（重症）。軽症は一般病棟',
      pitfall: 'NPPVは急性肺水腫に最も有効。sBP<90の心原性ショックには利尿薬・硝酸薬は禁忌（昇圧が先）。ACS合併の心不全は循環器緊急',
    },
  },

  pneumonia_result: {
    id: 'pneumonia_result', title: '🌡️ 肺炎+呼吸不全',
    result: {
      severity: 'urgent',
      title: '重症肺炎 — 酸素管理 + 抗菌薬',
      actions: [
        '酸素投与（HFNC/NPPVを考慮）',
        '抗菌薬投与（重症市中肺炎: 施設プロトコル参照）',
        '喀痰グラム染色・培養提出',
        '重症度評価（A-DROP/CURB-65）',
        'インフルエンザ・COVID-19迅速検査',
        '人工呼吸器管理が必要な場合はICU入室',
      ],
      workup: ['胸部X線/CT', '喀痰グラム染色・培養', '血液培養2セット', '血液ガス', 'CBC・CRP・PCT', '尿中抗原（肺炎球菌・レジオネラ）'],
      disposition: '入院（重症度によりICU or 一般病棟）',
      pitfall: '誤嚥性肺炎は右下葉に多い。免疫不全者ではPCP（ニューモシスチス肺炎）を鑑別に。COVID-19は胸部X線正常でもCTでGGOを認めることがある',
    },
  },

  ards_result: {
    id: 'ards_result', title: '🚨 ARDS疑い',
    result: {
      severity: 'critical',
      title: 'ARDS — 肺保護換気 + 原因治療',
      actions: [
        '気管挿管・人工呼吸器管理',
        '肺保護換気戦略（TV 6mL/kg IBW、プラトー圧<30cmH₂O。施設プロトコル参照）',
        'PEEP設定（FiO₂-PEEPテーブルまたはEIT/食道内圧ガイド。施設プロトコル参照）',
        '腹臥位療法（P/F<150の場合に考慮）',
        '原因の治療（肺炎・敗血症・誤嚥・膵炎・外傷等）',
        '過剰輸液を避ける（Conservative fluid strategy）',
        '集中治療医コンサルト',
      ],
      workup: ['血液ガス（P/F比計算）', '心エコー（心不全除外）', '胸部CT', 'CBC・CRP・PCT', '乳酸', '原因に応じた検査'],
      disposition: 'ICU',
      pitfall: 'Berlinの定義: 急性発症+両側浸潤影+心不全で説明できない+P/F比<300。軽症(200-300)・中等症(100-200)・重症(<100)に分類',
    },
  },

  clear_cxr_node: {
    id: 'clear_cxr_node', title: 'Step 2: 胸部X線ほぼ正常 + 呼吸困難',
    desc: 'X線正常なのに低酸素 → PE、喘息/COPD増悪、代謝性アシドーシスの代償を鑑別。',
    choices: [
      { label: 'PE疑い（突然発症・胸痛・頻脈・DVTリスク・D-dimer高値）', value: 'pe', icon: '🫁', danger: true },
      { label: '喘息/COPD増悪（喘鳴・既往・呼気延長）', value: 'asthma_copd', icon: '💨' },
      { label: '代謝性アシドーシス（Kussmaul呼吸・DKA・腎不全・中毒）', value: 'metabolic', icon: '⚗️' },
    ],
    next: v => ({ pe: 'pe_result', asthma_copd: 'asthma_copd_node', metabolic: 'metabolic_result' }[v] || 'pe_result'),
  },

  pe_result: {
    id: 'pe_result', title: '🫁 肺塞栓症（PE）疑い',
    result: {
      severity: 'critical',
      title: 'PE疑い — Wells/GenevaでPretest probability評価',
      actions: [
        'Wells scoreまたはGeneva scoreで検査前確率を評価',
        '低リスク → D-dimer（年齢調整カットオフ: 50歳以上は年齢×10 μg/L）',
        '中〜高リスク or D-dimer陽性 → 造影CT（CTPA）',
        '確定 → 抗凝固療法開始（施設プロトコル参照）',
        '大量PE（ショック）→ 血栓溶解療法/カテーテル治療を検討',
        'sBP<90の不安定PE → 急速輸液（過剰は右心不全悪化）+ 昇圧剤 + 血栓溶解療法',
      ],
      workup: ['D-dimer（低リスク時）', '造影CT（CTPA）', '12誘導心電図（S1Q3T3・右心負荷）', 'トロポニン', 'BNP/NT-proBNP', '心エコー（右室拡大・壁運動異常）', '下肢静脈エコー'],
      disposition: '入院。大量PEはICU',
      pitfall: 'CTPA禁忌（造影剤アレルギー・重度腎障害・妊娠）では下肢静脈エコー+心エコーで間接評価。妊婦のPEはV/Q scanを考慮。PERCルールで低リスクを拾い上げ',
    },
  },

  asthma_copd_node: {
    id: 'asthma_copd_node', title: 'Step 3: 喘息 / COPD増悪の重症度',
    choices: [
      { label: '重症（会話困難・silent chest・意識変容・PEF<25%）', value: 'severe', icon: '🚨', danger: true },
      { label: '中等症〜軽症（会話可能・喘鳴あり・SpO₂>90%）', value: 'moderate', icon: '⚠️' },
    ],
    next: v => v === 'severe' ? 'severe_asthma_result' : 'moderate_asthma_result',
  },

  severe_asthma_result: {
    id: 'severe_asthma_result', title: '🚨 重症喘息発作 / COPD増悪',
    result: {
      severity: 'critical',
      title: '重症喘息/COPD増悪 — 気管挿管の準備をしつつ治療',
      actions: [
        '酸素投与（喘息: SpO₂ 93-95%目標。COPD: SpO₂ 88-92%目標）',
        'SABA連続ネブライザー吸入',
        'イプラトロピウム併用吸入',
        '全身性ステロイド投与（施設プロトコル参照）',
        '硫酸マグネシウム静注（重症喘息。施設プロトコル参照）',
        'NPPV（特にCOPD増悪で有効）',
        '改善不良 → 気管挿管（ケタミンで導入を考慮）',
        'COPD: 抗菌薬投与（感染契機の場合）',
      ],
      workup: ['血液ガス', '胸部X線（気胸・肺炎の合併除外）', 'CBC', '電解質', 'PEF（可能なら）'],
      disposition: 'ICU',
      pitfall: 'Silent chestは最重症のサイン（気流がないため喘鳴が聞こえない）。COPD患者へのO₂過剰投与はCO₂ナルコーシスのリスク。喘息でも気胸合併を見逃さない',
    },
  },

  moderate_asthma_result: {
    id: 'moderate_asthma_result', title: '⚠️ 中等症喘息/COPD増悪',
    result: {
      severity: 'moderate',
      title: '中等症喘息/COPD増悪 — 気管支拡張薬+ステロイド',
      actions: [
        '酸素投与（目標SpO₂は上記参照）',
        'SABA吸入（20分ごとに反復、最大3回）',
        '全身性ステロイド投与（施設プロトコル参照）',
        '1時間後に再評価（PEF・SpO₂・呼吸困難の改善）',
        '改善あり → 帰宅（ステロイド短期処方 + 吸入薬確認 + かかりつけ受診）',
        '改善不良 → 入院',
        'COPD: 増悪の原因検索（感染・心不全合併・PE）',
      ],
      workup: ['PEF（治療前後）', '胸部X線', 'SpO₂モニタリング', '血液ガス（改善不良時）'],
      disposition: '改善 → 帰宅（外来フォロー）。改善不良 → 入院',
      pitfall: '帰宅時にaction plan（増悪時の対応）を確認。吸入手技の確認。ステロイド全身投与は5-7日間を目安（漸減不要の短期コース）',
    },
  },

  metabolic_result: {
    id: 'metabolic_result', title: '⚗️ 代謝性アシドーシスによる過換気',
    result: {
      severity: 'urgent',
      title: '代謝性アシドーシス — 原因検索と治療',
      actions: [
        '血液ガスでpH・HCO₃⁻確認',
        'AG計算（AG = Na - Cl - HCO₃）',
        'AG上昇 → MUDPILES: メタノール、尿毒症、DKA、プロピレングリコール、INH/鉄、乳酸アシドーシス、エチレングリコール、サリチル酸',
        'AG正常 → 尿AG・下痢・RTA',
        'DKA → インスリン+補液（施設プロトコル参照）',
        '乳酸アシドーシス → 原因治療（敗血症・ショック・組織低灌流）',
        '中毒 → 中毒センター相談 + 必要に応じて血液透析',
      ],
      workup: ['血液ガス', '電解質（AG計算）', '血糖', '乳酸', '浸透圧Gap', 'BUN/Cr', 'ケトン体', '必要に応じて中毒スクリーニング'],
      disposition: 'DKA・重度アシドーシス・中毒 → ICU。軽度 → 一般病棟',
      pitfall: 'Kussmaul呼吸（深く速い呼吸）は代謝性アシドーシスの代償。「呼吸困難」と誤認しやすい。まず血ガスを確認',
    },
  },

  other_cxr_result: {
    id: 'other_cxr_result', title: '🫁 気胸 / 胸水 / 無気肺',
    result: {
      severity: 'urgent',
      title: '気胸・胸水・無気肺 — 原因に応じた対応',
      actions: [
        '気胸（非緊張性）:',
        '　- 小さな気胸（<2cm）+安定 → 酸素投与+経過観察',
        '　- 大きな気胸 / 症状あり → 胸腔ドレーン',
        '胸水:',
        '　- 大量胸水+呼吸不全 → 胸腔穿刺（診断+治療的）',
        '　- 穿刺液のLight基準で滲出液/漏出液の鑑別',
        '無気肺:',
        '　- 痰貯留 → 吸引・体位ドレナージ',
        '　- 腫瘍閉塞 → CT・気管支鏡',
        '原因に応じた専門科コンサルト',
      ],
      workup: ['胸部X線/CT', '血液ガス', '胸水穿刺（Light基準: LDH・蛋白・glucose・細胞数）', 'CBC', '必要に応じてCT（腫瘍・PE除外）'],
      disposition: '原因・重症度に応じて外来〜入院',
      pitfall: 'COPD患者の気胸はbullaeとの鑑別が必要（CT推奨）。悪性胸水は再貯留する → 胸膜癒着術やドレーン留置を考慮',
    },
  },

  onset: {
    id: 'onset', title: 'Step 2: 呼吸困難の発症様式',
    desc: 'バイタル安定の呼吸困難。発症様式で鑑別を絞る。',
    choices: [
      { label: '超急性（秒〜分）: 突然発症の呼吸困難', value: 'hyperacute', icon: '⚡' },
      { label: '急性（時間〜日）: 数時間から数日で増悪', value: 'acute', icon: '📈' },
      { label: '慢性（週〜月）: 徐々に増悪する労作時呼吸困難', value: 'chronic', icon: '📅' },
    ],
    next: v => ({ hyperacute: 'hyperacute_node', acute: 'acute_node', chronic: 'chronic_result' }[v] || 'acute_node'),
  },

  hyperacute_node: {
    id: 'hyperacute_node', title: 'Step 3: 超急性発症 — Killer diseaseの除外',
    desc: '突然発症の呼吸困難は生命を脅かす原因を必ず鑑別。',
    choices: [
      { label: 'PE疑い（胸痛・頻脈・DVTリスク・長期臥床・術後・悪性腫瘍）', value: 'pe', icon: '🫁', danger: true },
      { label: '気胸疑い（若年瘦身男性・片側胸痛・呼吸音低下）', value: 'ptx', icon: '💨' },
      { label: 'アナフィラキシー（蕁麻疹・血圧低下・曝露歴）', value: 'anaphy', icon: '🚨', danger: true },
      { label: '上記に該当しない', value: 'other', icon: '❓' },
    ],
    next: v => ({ pe: 'pe_result', ptx: 'ptx_stable_result', anaphy: 'anaphy_result', other: 'acute_node' }[v] || 'acute_node'),
  },

  ptx_stable_result: {
    id: 'ptx_stable_result', title: '💨 気胸（バイタル安定）',
    result: {
      severity: 'moderate',
      title: '非緊張性気胸 — サイズと症状で治療方針決定',
      actions: [
        '胸部X線で気胸のサイズ評価',
        '小さな気胸（肺尖から鎖骨中線で<2cm）+ 症状軽微 → 酸素投与+経過観察（6時間後X線再検）',
        '大きな気胸 or 症状あり → 胸腔ドレーン挿入',
        '続発性気胸（COPD等の基礎疾患あり）→ 原則入院+ドレーン',
        '初発の原発性気胸（若年）で小さければ外来経過観察も可',
      ],
      workup: ['胸部X線（吸気立位）', '血液ガス（SpO₂低下時）', '必要に応じてCT（bullae評価・COPDとの鑑別）'],
      disposition: 'ドレーン挿入 → 入院。保存的 → 外来（翌日X線再検）',
      pitfall: '月経随伴性気胸（カタメニアル気胸）は若年女性の右側気胸で月経期に反復。再発率が高い気胸（2回目以降）は胸腔鏡手術を考慮',
    },
  },

  anaphy_result: {
    id: 'anaphy_result', title: '🚨 アナフィラキシー',
    result: {
      severity: 'critical',
      title: 'アナフィラキシー — アドレナリン筋注が最優先',
      actions: [
        'アドレナリン筋注（大腿外側。用量は施設プロトコル参照。効果不十分なら5-15分ごとに反復）',
        '仰臥位・下肢挙上（呼吸困難なら半座位）',
        '酸素投与（高流量）',
        '大口径末梢ルート確保・急速輸液',
        '気道浮腫 → 気管挿管準備（遅延すると挿管不能に）',
        '抗ヒスタミン薬・ステロイド（二次治療。施設プロトコル参照）',
        '原因物質の除去（可能であれば）',
      ],
      workup: ['バイタルサイン持続モニタリング', 'トリプターゼ（急性期+24時間後。後日の確定診断用）', 'CBC'],
      disposition: '最低4-6時間経過観察（二相性反応のリスク）。重症 → 入院',
      pitfall: '二相性反応は最初の反応から1-72時間後に起こりうる。呼吸・循環症状があった場合は少なくとも24時間経過観察を推奨。アドレナリンを遅らせないこと',
    },
  },

  acute_node: {
    id: 'acute_node', title: 'Step 3: 急性呼吸困難の鑑別',
    desc: '胸部X線・心電図・BNPの結果を統合して鑑別を絞る。',
    choices: [
      { label: '心不全を示唆（起座呼吸・浮腫・BNP高値・胸部X線で肺うっ血）', value: 'hf', icon: '❤️' },
      { label: '肺炎を示唆（発熱・咳・痰・浸潤影）', value: 'pneumonia', icon: '🌡️' },
      { label: '喘息/COPD増悪（喘鳴・既往・呼気延長）', value: 'asthma', icon: '💨' },
      { label: '上記に該当しない / 複合的', value: 'mixed', icon: '🔍' },
    ],
    next: v => ({ hf: 'hf_result', pneumonia: 'pneumonia_result', asthma: 'asthma_copd_node', mixed: 'mixed_result' }[v] || 'mixed_result'),
  },

  mixed_result: {
    id: 'mixed_result', title: '🔍 鑑別が困難な急性呼吸困難',
    result: {
      severity: 'moderate',
      title: '鑑別困難 — 系統的アプローチで原因検索',
      actions: [
        '追加検査で鑑別を絞り込む',
        'BNP/NT-proBNP → 心不全の除外/示唆',
        'D-dimer + Wells score → PE評価',
        '血液ガス → 低酸素血症の程度、代謝性アシドーシスの有無',
        '心エコー → 壁運動異常・弁膜症・心嚢液・右室負荷',
        'CT（造影）→ PE・肺炎・間質性肺疾患の評価',
        '貧血（Hb<7）→ 高拍出性心不全として呼吸困難の原因に',
        '心因性過換気の診断は除外診断（器質的疾患を全て除外した後）',
      ],
      workup: ['血液ガス', 'BNP/NT-proBNP', 'D-dimer', 'トロポニン', '12誘導心電図', '心エコー', '胸部CT', 'CBC（Hb確認）'],
      disposition: '原因に応じて判断。不明の場合は入院精査を考慮',
      pitfall: '心因性過換気を安易に診断しない。PE・ACS・代謝性アシドーシスを除外した後にのみ診断。若年女性でも器質的疾患は起こりうる',
    },
  },

  chronic_result: {
    id: 'chronic_result', title: '📅 慢性呼吸困難 — 外来精査への橋渡し',
    result: {
      severity: 'low',
      title: '慢性労作時呼吸困難 — 緊急性の除外 + 外来精査',
      actions: [
        'まず急性増悪の除外（心不全増悪・PE・貧血進行）',
        'バイタル安定・急性増悪なし → 外来精査',
        '外来精査の方向性:',
        '　- 心臓: BNP・心エコー・負荷心電図',
        '　- 肺: スパイロメトリー・胸部CT・6分間歩行試験',
        '　- 貧血: CBC',
        '　- 甲状腺: TSH',
        'かかりつけ医/専門医紹介',
      ],
      workup: ['胸部X線', '12誘導心電図', 'BNP', 'CBC', 'SpO₂'],
      disposition: '帰宅（外来精査予約）。急性増悪要素があれば入院',
      pitfall: '慢性呼吸困難の急性増悪として受診した場合は、急性の原因（PE・ACS・肺炎）を必ず除外。「いつもの息切れ」で片付けない',
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

export default function DyspneaERPage() {
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
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-2">›</span>
        <Link href="/tools/er" className="hover:text-ac">ER対応</Link>
        <span className="mx-2">›</span>
        <span>呼吸困難</span>
      </nav>

      <header className="mb-6">
        <span className="inline-block text-sm bg-dnl text-dn px-2.5 py-0.5 rounded-full font-medium mb-2">🚨 ER対応</span>
        <h1 className="text-2xl font-bold text-tx mb-1">呼吸困難 ER対応ツリー</h1>
        <p className="text-sm text-muted">
          気道緊急の評価 → 呼吸不全の原因検索 → 発症様式別の鑑別フロー。PE・心不全・喘息/COPD・ARDS・アナフィラキシーを系統的に評価。
        </p>
      </header>

      <ERDisclaimerBanner />

      {path.length > 1 && (
        <button onClick={reset} className="text-sm text-ac hover:underline mb-4 flex items-center gap-1">
          ↺ 最初からやり直す
        </button>
      )}

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
            { slug: 'wells-pe', name: 'Wells PE' },
            { slug: 'perc', name: 'PERC Rule' },
            { slug: 'aa-gradient', name: 'A-aDO₂' },
            { slug: 'curb-65', name: 'CURB-65' },
            { slug: 'a-drop', name: 'A-DROP' },
            { slug: 'news2', name: 'NEWS2' },
            { slug: 'anion-gap', name: 'AG' },
            { slug: 'osmolality-gap', name: '浸透圧Gap' },
          ].map(t => (
            <Link key={t.slug} href={`/tools/calc/${t.slug}`}
              className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">
              {t.name}
            </Link>
          ))}
          <Link href="/tools/interpret/blood-gas"
            className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">
            血ガス解釈
          </Link>
        </div>
      </section>

      <ERDisclaimerFooter />

      {/* SEO解説 */}
      <section className="space-y-4 text-sm text-muted mb-8">
        <h2 className="text-base font-bold text-tx">呼吸困難の救急対応について</h2>
        <p>
          呼吸困難は救急外来で最も緊急性の高い主訴の一つです。まず気道緊急（上気道閉塞）の有無を評価し、
          次に酸素化・換気の状態を把握します。緊張性気胸やアナフィラキシーは身体所見のみで治療を開始すべき超緊急疾患です。
        </p>
        <p>
          胸部X線は呼吸困難の鑑別で最初に行う画像検査です。浸潤影があれば肺炎と心不全を鑑別し、
          X線がほぼ正常なのに低酸素血症があればPEを積極的に疑います。喘息・COPD増悪は聴診所見と既往で診断しますが、
          重症喘息のsilent chest（喘鳴が聞こえない）は気流がほとんどないことを示す危険なサインです。
        </p>
        <h3 className="font-bold text-tx">発症様式による鑑別</h3>
        <p>
          超急性（秒〜分）: PE、気胸、アナフィラキシー、異物誤嚥。急性（時間〜日）: 心不全、肺炎、喘息/COPD増悪。
          慢性（週〜月）: 間質性肺疾患、COPD進行、慢性心不全、貧血。発症様式は鑑別を絞る最も重要な情報の一つです。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">参考文献</h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2">
          <li>Konstantinides SV et al. 2019 ESC Guidelines for PE. Eur Heart J 2020;41:543-603</li>
          <li>GINA 2024 Report. Global Strategy for Asthma Management and Prevention</li>
          <li>GOLD 2024 Report. Global Strategy for COPD</li>
          <li>McDonagh TA et al. 2021 ESC Guidelines for Heart Failure. Eur Heart J 2021;42:3599-3726</li>
          <li>ARDS Definition Task Force. Acute Respiratory Distress Syndrome: The Berlin Definition. JAMA 2012;307:2526-2533</li>
          <li>Cardona V et al. World Allergy Organization Anaphylaxis Guidance 2020. World Allergy Organ J 2020;13:100472</li>
        </ol>
      </section>
    </div>
  )
}
