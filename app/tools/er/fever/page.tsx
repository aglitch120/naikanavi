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
    id: 'start', title: 'Step 1: 敗血症スクリーニング — qSOFA・バイタル評価',
    desc: '発熱患者ではまず敗血症の可能性を評価。qSOFA≧2（sBP≦100 / RR≧22 / 意識変容）なら敗血症を強く疑う。',
    choices: [
      { label: 'ショック徴候あり（sBP<90 / 輸液抵抗性低血圧 / 乳酸≧4）', value: 'shock', icon: '🚨', danger: true },
      { label: 'qSOFA≧2（sBP≦100, RR≧22, 意識変容のうち2項目以上）', value: 'qsofa_pos', icon: '⚠️', danger: true },
      { label: 'バイタル安定（qSOFA<2, 血圧正常）', value: 'stable', icon: '✅' },
    ],
    next: v => ({ shock: 'septic_shock', qsofa_pos: 'sepsis_suspect', stable: 'immunocheck' }[v] || 'immunocheck'),
  },

  septic_shock: {
    id: 'septic_shock', title: '🚨 敗血症性ショック → Hour-1 Bundle',
    result: {
      severity: 'critical',
      title: '敗血症性ショック — Hour-1 Bundle開始',
      actions: [
        '大口径末梢ルート2本確保',
        '乳酸測定',
        '血液培養2セット採取（抗菌薬投与前に）',
        '急速晶質液投与（施設プロトコル参照、通常30mL/kg目安。心不全合併例は少量ずつ評価）',
        '広域抗菌薬投与（感染巣に応じて選択、1時間以内を目標。薬剤選択は施設プロトコル参照）',
        '輸液反応性不良なら昇圧剤開始（薬剤・用量は施設プロトコル参照）',
        '尿道カテーテル留置（尿量モニタリング）',
        'ICU/集中治療医コンサルト',
      ],
      workup: ['乳酸', '血液培養2セット', 'CBC・分画', 'CRP・PCT', '電解質・腎機能・肝機能', '凝固（DIC評価）', '尿検査・尿培養', '感染巣に応じて画像（胸部X線・CT等）', '血液ガス'],
      disposition: 'ICU',
      pitfall: '抗菌薬投与は培養採取後なるべく早く（1時間以内）。培養結果を待って抗菌薬を遅らせてはいけない。高齢者・免疫不全ではバイタルの変動が遅れることがある',
    },
  },

  sepsis_suspect: {
    id: 'sepsis_suspect', title: '⚠️ 敗血症疑い — 早期介入',
    result: {
      severity: 'urgent',
      title: '敗血症疑い（qSOFA≧2）— 感染巣検索と早期抗菌薬',
      actions: [
        '末梢ルート確保・輸液開始',
        '乳酸測定',
        '血液培養2セット採取',
        '感染巣の推定 → フォーカスに応じた検体提出',
        '広域抗菌薬投与（感染巣推定後、1時間以内目標。薬剤選択は施設プロトコル参照）',
        '頻回のバイタルサインモニタリング',
        '1-2時間後に再評価（輸液反応性・乳酸推移）',
      ],
      workup: ['乳酸', '血液培養2セット', 'CBC・分画', 'CRP・PCT', '電解質・腎機能・肝機能', '尿検査・尿培養', '胸部X線', '必要に応じてCT'],
      disposition: '入院（一般病棟〜ICU、重症度に応じて）',
      pitfall: 'qSOFA≧2の死亡率は約10%。入院後にSOFAスコアで臓器障害を評価。改善が乏しければICUエスカレーション',
    },
  },

  immunocheck: {
    id: 'immunocheck', title: 'Step 2: 免疫状態の確認',
    desc: '免疫不全患者の発熱はemergency。好中球減少・ステロイド・化学療法・HIV・臓器移植後・脾摘後は特別な対応が必要。',
    choices: [
      { label: '免疫不全あり（化学療法中・好中球減少・ステロイド長期・HIV・移植後・脾摘後）', value: 'immunocompromised', icon: '🛡️', danger: true },
      { label: '免疫正常', value: 'immunocompetent', icon: '✅' },
    ],
    next: v => v === 'immunocompromised' ? 'febrile_neutropenia_check' : 'source',
  },

  febrile_neutropenia_check: {
    id: 'febrile_neutropenia_check', title: 'Step 2b: 好中球減少の有無',
    desc: '化学療法後の発熱ではまず好中球数を確認。ANC<500/μLの発熱性好中球減少症（FN）は感染症emergency。',
    choices: [
      { label: 'ANC<500/μL（または48時間以内に<500に低下予測）', value: 'fn', icon: '🚨', danger: true },
      { label: 'ANC≧500だが免疫不全あり', value: 'other_immune', icon: '⚠️' },
    ],
    next: v => v === 'fn' ? 'fn_result' : 'immunocompromised_result',
  },

  fn_result: {
    id: 'fn_result', title: '🚨 発熱性好中球減少症（FN）— 30分以内に抗菌薬',
    result: {
      severity: 'critical',
      title: 'FN — 経験的抗菌薬を30分以内に開始',
      actions: [
        '血液培養2セット採取（末梢＋CVカテーテルがあれば両方から）',
        '感染巣の身体診察（口腔・肛門周囲・カテーテル刺入部・肺・皮膚）',
        '広域抗菌薬の経験的投与（施設のFNプロトコル参照。30分以内目標）',
        'MASCCスコアでリスク層別化（低リスク: ≧21点、高リスク: <21点）',
        '高リスクFN → 入院・広域抗菌薬静注',
        '48-72時間で再評価（培養結果・解熱の有無）',
      ],
      workup: ['血液培養2セット', 'CBC・分画（ANC確認）', 'CRP', '電解質・腎機能・肝機能', '尿検査・尿培養', '胸部X線', '必要に応じて副鼻腔CT・腹部CT'],
      disposition: '入院（高リスク）。MASCCスコア≧21の低リスクは外来治療を考慮（施設基準）',
      pitfall: 'FNでは感染徴候が乏しい（好中球が少ないため膿が作れない）。CRP上昇も遅れる。身体所見が軽微でも重症感染の可能性',
    },
  },

  immunocompromised_result: {
    id: 'immunocompromised_result', title: '🛡️ 免疫不全（非FN）の発熱',
    result: {
      severity: 'urgent',
      title: '免疫不全患者の発熱 — 通常より広い鑑別・早期抗菌薬',
      actions: [
        '血液培養2セット採取',
        '感染巣の積極的検索（通常の細菌に加え日和見感染を考慮）',
        '広域抗菌薬の早期投与（施設プロトコル参照）',
        'HIV → CD4数に応じた日和見感染の鑑別（PCP・CMV・MAC・クリプトコッカス等）',
        '臓器移植後 → 時期に応じた感染症（1ヶ月以内: 術後感染、1-6ヶ月: CMV等、6ヶ月以降: 市中感染+日和見）',
        '脾摘後 → 莢膜保有菌（肺炎球菌・髄膜炎菌・インフルエンザ桿菌）を最優先でカバー',
        '感染症科コンサルト',
      ],
      workup: ['血液培養2セット', 'CBC・分画', 'CRP・PCT', '電解質・腎機能・肝機能', '尿検査・尿培養', '胸部X線/CT', 'βDグルカン・アスペルギルスGM（真菌疑い時）', 'CMV抗原/PCR（移植後）'],
      disposition: '入院（閾値低めで判断）',
      pitfall: '免疫不全患者では複数の感染症が合併することがある。解熱しても安心せず、培養結果と臨床経過を慎重にフォロー',
    },
  },

  source: {
    id: 'source', title: 'Step 3: 感染巣の推定',
    desc: '病歴・身体所見から感染巣を絞り込む。フォーカスが不明な場合は系統的に検索。',
    choices: [
      { label: '呼吸器症状あり（咳・痰・呼吸困難・胸痛）', value: 'respiratory', icon: '🫁' },
      { label: '尿路症状あり（頻尿・排尿痛・背部痛・CVA叩打痛）', value: 'urinary', icon: '💧' },
      { label: '腹部症状あり（腹痛・下痢・嘔吐・黄疸）', value: 'abdominal', icon: '🩺' },
      { label: '皮膚軟部組織（発赤・腫脹・疼痛・創部）/ 髄膜刺激徴候', value: 'skin_cns', icon: '🧠' },
      { label: 'フォーカス不明', value: 'unknown', icon: '❓' },
    ],
    next: v => ({ respiratory: 'resp_result', urinary: 'uti_result', abdominal: 'abd_result', skin_cns: 'skin_cns_node', unknown: 'fuo_node' }[v] || 'fuo_node'),
  },

  resp_result: {
    id: 'resp_result', title: '🫁 呼吸器感染症（肺炎）',
    result: {
      severity: 'moderate',
      title: '肺炎 — 重症度評価（A-DROP/CURB-65）で治療方針決定',
      actions: [
        '重症度スコア評価（A-DROPまたはCURB-65）',
        '酸素投与（SpO₂≧94%目標）',
        '抗菌薬投与（市中肺炎/院内肺炎/誤嚥性肺炎で選択が異なる。施設プロトコル参照）',
        '喀痰グラム染色・培養提出',
        '重症（ICU適応）の判断基準: 昇圧剤が必要 / 人工呼吸器が必要',
        'レジオネラ: 渡航歴・温泉・冷却塔曝露→尿中抗原',
      ],
      workup: ['胸部X線', '喀痰グラム染色・培養', '血液培養2セット', 'CBC・CRP', '電解質・腎機能', '尿中肺炎球菌抗原・レジオネラ抗原', '血液ガス（呼吸不全時）'],
      disposition: '軽症: 外来。中等症: 一般病棟。重症: ICU',
      pitfall: '高齢者は典型的な呼吸器症状が乏しく、食欲低下・意識変容だけの場合がある。インフルエンザ・COVID-19の迅速検査も考慮',
    },
  },

  uti_result: {
    id: 'uti_result', title: '💧 尿路感染症',
    result: {
      severity: 'moderate',
      title: '尿路感染症 — 単純性 vs 複雑性の鑑別',
      actions: [
        '膀胱炎 vs 腎盂腎炎の鑑別（背部痛・CVA叩打痛・高熱→腎盂腎炎）',
        '複雑性UTIのリスク評価（男性・尿路異常・カテーテル・結石・DM・妊娠・腎移植後）',
        '抗菌薬投与（施設プロトコル参照。単純性膀胱炎/腎盂腎炎/複雑性UTIで異なる）',
        '閉塞性腎盂腎炎（水腎症+感染）が疑われれば泌尿器科に緊急コンサルト',
      ],
      workup: ['尿検査・尿培養', '血液培養2セット（腎盂腎炎）', 'CBC・CRP', '腎機能', '閉塞疑い→腎エコーまたはCT'],
      disposition: '単純性膀胱炎: 外来。腎盂腎炎（軽症）: 外来可。複雑性/重症: 入院',
      pitfall: '高齢者の無症候性細菌尿は治療対象ではない。尿路閉塞+感染は泌尿器科emergency（緊急ドレナージ）',
    },
  },

  abd_result: {
    id: 'abd_result', title: '🩺 腹腔内感染症',
    result: {
      severity: 'urgent',
      title: '腹腔内感染症 — 外科的介入の要否を判断',
      actions: [
        '腹部CT（造影）で感染巣同定',
        '外科的介入が必要な疾患の除外（虫垂炎・胆嚢炎・消化管穿孔・膿瘍）',
        '抗菌薬投与（嫌気性菌カバーを含む。施設プロトコル参照）',
        '胆管炎（Charcot三徴: 発熱+黄疸+右季肋部痛）→ ERCP/ドレナージ',
        '外科コンサルト（急性腹症の場合）',
      ],
      workup: ['腹部造影CT', 'CBC・CRP', '肝胆道系酵素（AST/ALT/ALP/γGT/T-Bil）', '膵酵素（アミラーゼ/リパーゼ）', '血液培養2セット', '腹部エコー（胆嚢・胆管）'],
      disposition: '入院（外科的介入の可能性あり）',
      pitfall: '高齢者の急性胆管炎は致死率が高い。黄疸がなくても胆管炎を否定できない。腹膜刺激徴候は高齢者やステロイド使用中に減弱',
    },
  },

  skin_cns_node: {
    id: 'skin_cns_node', title: 'Step 3b: 皮膚軟部組織 / 中枢神経の鑑別',
    desc: '発赤・腫脹・圧痛 → 皮膚軟部組織感染。項部硬直・頭痛・意識変容 → 髄膜炎を考慮。',
    choices: [
      { label: '皮膚軟部組織（蜂窩織炎・壊死性筋膜炎・褥瘡感染・関節炎）', value: 'ssti', icon: '🔴' },
      { label: '髄膜刺激徴候あり（項部硬直・Kernig・Brudzinski）/ 頭痛+発熱+意識変容', value: 'meningitis', icon: '🧠', danger: true },
    ],
    next: v => v === 'meningitis' ? 'meningitis_result' : 'ssti_result',
  },

  ssti_result: {
    id: 'ssti_result', title: '🔴 皮膚軟部組織感染症',
    result: {
      severity: 'moderate',
      title: '皮膚軟部組織感染 — 壊死性筋膜炎の除外が最優先',
      actions: [
        '壊死性筋膜炎の除外（激痛・所見と不釣り合いな疼痛・水疱・皮膚壊死・捻髪音→緊急手術）',
        '蜂窩織炎: 抗菌薬投与（施設プロトコル参照）、患肢挙上',
        '膿瘍: 切開排膿 + 培養提出',
        '壊死性筋膜炎が疑われれば外科に緊急コンサルト（画像で否定できなければ手術室へ）',
        '化膿性関節炎（単関節の腫脹・発赤・運動時痛）→ 関節穿刺 + 整形外科コンサルト',
      ],
      workup: ['CBC・CRP', '血液培養', '創部・膿培養', 'CK（壊死性筋膜炎疑い）', '造影CT/MRI（深部感染疑い）', '関節穿刺（関節炎疑い）'],
      disposition: '軽症蜂窩織炎: 外来。重症/壊死性筋膜炎疑い: 緊急入院+外科コンサルト',
      pitfall: '壊死性筋膜炎は初期に蜂窩織炎と区別困難。「所見に不釣り合いな激痛」が最重要のRed flag。CTで筋膜のガス像がなくても否定できない',
    },
  },

  meningitis_result: {
    id: 'meningitis_result', title: '🧠 髄膜炎疑い → 抗菌薬先行投与',
    result: {
      severity: 'critical',
      title: '細菌性髄膜炎疑い — 経験的抗菌薬を直ちに投与',
      actions: [
        '血液培養2セット採取',
        '腰椎穿刺の禁忌確認（頭蓋内圧亢進徴候 → 先に頭部CTを撮影）',
        '経験的抗菌薬+デキサメタゾン投与（施設プロトコル参照。CT/LP結果を待たない）',
        '腰椎穿刺（髄液検査: 細胞数・蛋白・糖・グラム染色・培養）',
        'HSV脳炎の可能性→アシクロビル併用を考慮',
        '感染症科・神経内科コンサルト',
      ],
      workup: ['血液培養2セット', '腰椎穿刺（髄液: 細胞数, 分画, 蛋白, 糖, グラム染色, 培養, 必要に応じてHSV-PCR・墨汁・抗酸菌）', '頭部CT（穿刺前に必要な場合）', 'CBC・CRP・PCT', '電解質・血糖'],
      disposition: 'ICU',
      pitfall: '腰椎穿刺が遅れる場合（CT撮影待ち等）でも抗菌薬投与を遅らせてはいけない。「先に抗菌薬、後でLP」が原則。Jolt accentuationも参考に',
    },
  },

  fuo_node: {
    id: 'fuo_node', title: 'Step 4: フォーカス不明の発熱 — 系統的検索',
    desc: '明らかな感染巣が見つからない場合。詳細な病歴聴取（渡航歴・動物接触・性交渉歴・薬剤歴）と全身の身体診察を再度行う。',
    choices: [
      { label: '入院中の発熱 / デバイス関連（CV・尿カテ・人工関節等）', value: 'nosocomial', icon: '🏥' },
      { label: '渡航歴あり（マラリア・デング・腸チフス等のリスク）', value: 'travel', icon: '✈️' },
      { label: '市中発症・デバイスなし・渡航歴なし', value: 'community', icon: '🏠' },
    ],
    next: v => ({ nosocomial: 'nosocomial_result', travel: 'travel_result', community: 'community_fuo_result' }[v] || 'community_fuo_result'),
  },

  nosocomial_result: {
    id: 'nosocomial_result', title: '🏥 院内発熱 / デバイス関連感染',
    result: {
      severity: 'urgent',
      title: '院内発熱 — デバイス関連感染・CDIを考慮',
      actions: [
        'デバイスの評価（CVカテーテル刺入部・尿道カテーテル・人工関節・VP shunt）',
        'CVカテーテル関連血流感染（CRBSI）疑い → カテーテル先端・末梢血培養同時採取',
        'C. difficile感染（CDI）の評価（抗菌薬使用後の下痢）→ CD toxin検査',
        '薬剤熱の可能性（抗菌薬・抗てんかん薬等。比較的元気、好酸球増加）',
        'DVT/PEの除外',
        '不要なデバイスの抜去',
      ],
      workup: ['血液培養2セット（末梢+カテーテルから）', 'CBC・CRP', '尿検査・尿培養', 'CD toxin（下痢時）', '胸部X線', '必要に応じて造影CT（膿瘍・DVT）'],
      disposition: '入院継続・治療方針変更',
      pitfall: '院内発熱の4大原因: カテーテル（血管・尿路）、CDI、手術部位感染、薬剤熱。「発熱=抗菌薬変更」ではなく、まず原因検索',
    },
  },

  travel_result: {
    id: 'travel_result', title: '✈️ 渡航関連発熱',
    result: {
      severity: 'urgent',
      title: '渡航歴のある発熱 — マラリアの除外が最優先',
      actions: [
        'マラリア流行地からの帰国 → マラリア迅速検査+末梢血塗抹（厚層・薄層）を直ちに',
        'マラリア陽性 → 種に応じた治療（P. falciparumは重症化リスク高。熱帯医学専門医コンサルト）',
        'デング熱: 発熱+発疹+血小板減少。NS1抗原・IgM',
        '腸チフス: 徐脈を伴う発熱・比較的徐脈、血液培養',
        '感染症科・渡航医学外来にコンサルト',
      ],
      workup: ['マラリア迅速検査+血液塗抹', '血液培養', 'CBC（血小板）', '肝機能', 'デング抗原/抗体', '便培養（下痢時）', '必要に応じてリケッチア・レプトスピラ'],
      disposition: 'マラリア陽性: 入院。それ以外は重症度で判断',
      pitfall: 'マラリア流行地からの帰国後の発熱は、迅速検査陰性でも塗抹は3回繰り返す。P. falciparumの重症マラリアは致死的',
    },
  },

  community_fuo_result: {
    id: 'community_fuo_result', title: '🏠 市中発症・フォーカス不明の発熱',
    result: {
      severity: 'moderate',
      title: 'フォーカス不明の発熱 — 系統的アプローチ',
      actions: [
        '詳細な病歴再聴取（動物接触・Tick bite・性交渉歴・薬剤歴・歯科処置）',
        '全身の身体診察を丁寧に（心雑音→感染性心内膜炎、脾腫、リンパ節腫脹、皮疹、関節所見）',
        '感染性心内膜炎の除外（新規心雑音・塞栓症状・リスク因子あり→心エコー・血液培養3セット）',
        '悪性腫瘍・自己免疫疾患の可能性も考慮',
        '改善傾向なら対症療法で外来フォロー',
        '遷延（3週間以上）→ 不明熱（FUO）として系統的精査',
      ],
      workup: ['血液培養2-3セット', 'CBC・分画', 'CRP・ESR', '肝機能', 'LDH', 'フェリチン', '尿検査', '胸部X線', '必要に応じてHIV・EBV・CMV', '心エコー（心内膜炎疑い）'],
      disposition: '全身状態良好: 外来フォロー（48-72時間で再評価）。衰弱・経口摂取不良: 入院',
      pitfall: 'フォーカス不明の発熱で見逃しやすい疾患: 感染性心内膜炎、膿瘍（肝膿瘍・腸腰筋膿瘍）、成人Still病、悪性リンパ腫。安易に「風邪」と診断しない',
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

export default function FeverERPage() {
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
        <span>発熱</span>
      </nav>

      <header className="mb-6">
        <span className="inline-block text-sm bg-dnl text-dn px-2.5 py-0.5 rounded-full font-medium mb-2">🚨 ER対応</span>
        <h1 className="text-2xl font-bold text-tx mb-1">発熱 ER対応ツリー</h1>
        <p className="text-sm text-muted">
          敗血症スクリーニング → 免疫状態評価 → 感染巣推定のステップフロー。qSOFA・Hour-1 Bundle・FN対応を含む。
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
            { slug: 'qsofa', name: 'qSOFA' },
            { slug: 'sofa', name: 'SOFA' },
            { slug: 'news2', name: 'NEWS2' },
            { slug: 'mascc', name: 'MASCC' },
            { slug: 'curb-65', name: 'CURB-65' },
            { slug: 'a-drop', name: 'A-DROP' },
            { slug: 'anc', name: 'ANC' },
          ].map(t => (
            <Link key={t.slug} href={`/tools/calc/${t.slug}`}
              className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">
              {t.name}
            </Link>
          ))}
        </div>
      </section>

      <ERDisclaimerFooter />

      {/* SEO解説 */}
      <section className="space-y-4 text-sm text-muted mb-8">
        <h2 className="text-base font-bold text-tx">発熱の救急対応について</h2>
        <p>
          発熱は救急外来で最も多い主訴の一つです。多くは自己限定的なウイルス感染症ですが、
          敗血症・髄膜炎・壊死性筋膜炎・発熱性好中球減少症など致死的な感染症を見逃さないことが最重要です。
          qSOFAスコア（sBP≦100, RR≧22, 意識変容）で敗血症のスクリーニングを行い、
          該当すればHour-1 Bundleを開始します。
        </p>
        <p>
          免疫不全患者の発熱は通常と異なるアプローチが必要です。特に化学療法後の発熱性好中球減少症（FN）は
          経験的抗菌薬を30分以内に投与することが推奨されています。MASCCスコアでリスク層別化を行い、
          低リスク（≧21点）では外来治療も選択肢となります。
        </p>
        <h3 className="font-bold text-tx">Hour-1 Bundle（敗血症）</h3>
        <p>
          乳酸測定、血液培養採取、広域抗菌薬投与、低血圧・乳酸≧4の場合の急速輸液の4項目を
          1時間以内に開始することが推奨されています。抗菌薬投与が1時間遅れるごとに死亡率が上昇することが知られています。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">参考文献</h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2">
          <li>Evans L et al. Surviving Sepsis Campaign: International Guidelines 2021. Intensive Care Med 2021;47:1181-1247</li>
          <li>Singer M et al. The Third International Consensus Definitions for Sepsis (Sepsis-3). JAMA 2016;315:801-810</li>
          <li>Taplitz RA et al. Outpatient Management of Fever and Neutropenia in Adults. J Clin Oncol 2018;36:1443-1453</li>
          <li>Klastersky J et al. The MASCC risk index score. J Clin Oncol 2000;18:3038-3051</li>
          <li>日本感染症学会・日本化学療法学会. JAID/JSC感染症治療ガイド2023</li>
        </ol>
      </section>
    </div>
  )
}
