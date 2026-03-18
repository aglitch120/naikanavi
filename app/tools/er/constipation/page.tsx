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
    id: 'start', title: 'Step 1: 緊急性の評価 — Red Flagの確認',
    desc: '便秘の多くは機能性だが、腸閉塞・中毒性巨大結腸・絞扼など緊急疾患の除外が最優先。腹部所見+バイタル+排ガスの有無を確認。',
    choices: [
      { label: '腹膜刺激徴候（筋性防御/反跳痛/板状硬）+ 発熱/頻脈', value: 'peritonitis', icon: '🔴', danger: true },
      { label: '腹部膨満著明 + 嘔吐 + 排ガス停止 → 腸閉塞疑い', value: 'obstruction', icon: '🟠', danger: true },
      { label: '高度腹部膨満 + IBD/CDI既往 → 中毒性巨大結腸疑い', value: 'toxic_megacolon', icon: '🔴', danger: true },
      { label: '血便 + 腹痛 + 高齢者 → 虚血性腸炎/大腸癌合併疑い', value: 'ischemic', icon: '🟠', danger: true },
      { label: 'Red Flag なし → 機能性/薬剤性便秘の評価', value: 'functional', icon: '🟢' },
    ],
    next: v => v,
  },

  peritonitis: {
    id: 'peritonitis', title: '🔴 腹膜炎徴候あり',
    desc: '穿孔/絞扼/膿瘍の可能性。',
    choices: [
      { label: '腸閉塞+絞扼徴候（持続痛/圧痛/WBC↑/乳酸↑）', value: 'strangulation', icon: '🔴', danger: true },
      { label: '大腸穿孔疑い（free air/高度腹膜刺激徴候）', value: 'perforation', icon: '🔴', danger: true },
      { label: '憩室炎/膿瘍疑い（限局性圧痛+発熱+CRP↑）', value: 'diverticulitis', icon: '🟠' },
    ],
    next: v => v,
  },

  strangulation: {
    id: 'strangulation', title: '🔴 絞扼性イレウス',
    result: { severity: 'critical', title: '絞扼性イレウス — 緊急手術',
      actions: [
        '絶食+NGチューブ留置（減圧）',
        '輸液路2本確保+急速補液',
        '外科コンサルト → 緊急手術',
        '抗菌薬: 広域（CFPM or TAZ/PIPC）— 腸管壊死+菌血症リスク',
        '乳酸値フォロー（腸管虚血の指標）',
        'バイタル頻回モニタリング',
      ],
      workup: ['腹部CT(造影)', 'CBC/CRP', '乳酸値', '電解質/腎機能', '腹部X線（ニボー/free air）', '血液型+クロスマッチ（術前）'],
      disposition: '緊急手術。術前はICU管理',
      pitfall: '絞扼の典型的3徴: 持続痛（間欠痛ではない）+圧痛+WBC↑。CT closed loop sign/whirl signを見逃さない。手術の遅れが壊死範囲を広げる',
    },
  },

  perforation: {
    id: 'perforation', title: '🔴 大腸穿孔',
    result: { severity: 'critical', title: '大腸穿孔 — 緊急手術',
      actions: [
        '外科コンサルト → 緊急手術（Hartmann手術が多い）',
        '輸液路+急速補液',
        '広域抗菌薬: MEPM or TAZ/PIPC + MNZ',
        'NGチューブ留置',
        '敗血症への進展を監視',
        '抗凝固薬の中止+拮抗',
      ],
      workup: ['腹部CT(造影)', '腹部X線（free air: 立位/左側臥位）', 'CBC/CRP/PCT', '乳酸値', '血液型+クロスマッチ'],
      disposition: '緊急手術 → ICU管理',
      pitfall: '高齢者の大腸穿孔はステロイド使用中/糞便性穿孔が多い。free airがなくても穿孔は否定できない（被覆穿孔）',
    },
  },

  diverticulitis: {
    id: 'diverticulitis', title: '🟠 憩室炎/膿瘍',
    result: { severity: 'moderate', title: '憩室炎',
      actions: [
        '軽症（Hinchey I: 限局性炎症）: 抗菌薬（LVFX + MNZ or ABPC/SBT）+ 絶食/低残渣食',
        '膿瘍形成（Hinchey II）: CTガイド下ドレナージ + 抗菌薬',
        '汎発性腹膜炎（Hinchey III-IV）: 緊急手術',
        '穿孔/出血の合併を監視',
        '改善後: 大腸内視鏡（6-8週後）で癌の除外',
      ],
      workup: ['腹部CT(造影)', 'CBC/CRP', '尿検査（膀胱近傍の炎症で膿尿あり）', '血液培養（発熱時）'],
      disposition: '軽症→外来 or 短期入院。膿瘍/穿孔→入院+外科コンサルト',
      pitfall: '右側憩室炎は虫垂炎との鑑別が必要（特にアジア人で右側多い）。初回の憩室炎は大腸癌の除外が必要',
    },
  },

  obstruction: {
    id: 'obstruction', title: 'Step 2: 腸閉塞の評価',
    desc: '小腸 vs 大腸、機械的 vs 機能的、絞扼の有無',
    choices: [
      { label: '術後/癒着の既往 → 癒着性小腸閉塞', value: 'adhesion', icon: '🟠' },
      { label: '大腸型閉塞（漸増する便秘→完全閉塞/鼠径部膨隆）', value: 'large_bowel', icon: '🟠' },
      { label: '腸捻転疑い（S状結腸: 高齢+著明腹部膨満/盲腸: 若年+右下腹部痛）', value: 'volvulus', icon: '🔴', danger: true },
      { label: '糞便塞栓（高齢/オピオイド/認知症+直腸指診で硬便充満）', value: 'fecal_impaction', icon: '🟡' },
    ],
    next: v => v,
  },

  adhesion: {
    id: 'adhesion', title: '🟠 癒着性小腸閉塞',
    result: { severity: 'urgent', title: '癒着性小腸閉塞',
      actions: [
        '絶食+NGチューブ/イレウス管（減圧）',
        '輸液: 嘔吐/3rd space lossの補正',
        '電解質補正（低K/低Na多い）',
        '保存的治療で48-72h経過観察',
        '水溶性造影剤（ガストログラフィン）: 治療的+予後予測（24h後に大腸到達→保存的治療成功の予測因子）',
        '絞扼徴候（持続痛/圧痛/WBC↑/乳酸↑）→緊急手術',
        '保存的治療で48-72h改善なし→手術適応を検討',
      ],
      workup: ['腹部CT(造影)', '腹部X線（ニボー/拡張腸管）', 'CBC/CRP', '電解質', '乳酸値', '水溶性造影剤（治療+診断目的）'],
      disposition: '入院+外科管理。絞扼→緊急手術',
      pitfall: '「単純性」と判断しても絞扼への移行を常に監視。乳酸値の経時的上昇は危険信号',
    },
  },

  large_bowel: {
    id: 'large_bowel', title: '🟠 大腸閉塞',
    result: { severity: 'urgent', title: '大腸閉塞 — 腫瘍性が多い',
      actions: [
        '大腸癌が最多原因（特に左側結腸/直腸）',
        '絶食+輸液+電解質補正',
        'CT: 閉塞部位+原因の同定',
        '大腸ステント留置（Bridge to surgery: 閉塞解除→待機手術）',
        '穿孔/腸管壊死→緊急手術',
        '鼠径ヘルニア嵌頓→用手還納 or 緊急手術',
        '外科+消化器内科コンサルト',
      ],
      workup: ['腹部CT(造影)', '腹部X線', 'CBC/CRP', '電解質', 'CEA/CA19-9', '乳酸値'],
      disposition: '入院。原因に応じて手術 or ステント',
      pitfall: '盲腸径>12cm or 結腸径>9cmは穿孔リスク高い。pseudo-obstruction(Ogilvie症候群)との鑑別: 器質的閉塞点の有無',
    },
  },

  volvulus: {
    id: 'volvulus', title: '🔴 腸捻転',
    result: { severity: 'critical', title: '腸捻転 — 内視鏡的整復 or 緊急手術',
      actions: [
        'S状結腸捻転（最多）: 内視鏡的整復（減圧+脱転）→再発予防に待機的S状結腸切除',
        '盲腸捻転: 内視鏡的整復は困難→多くは手術（右半結腸切除）',
        '壊死/穿孔徴候→緊急手術',
        'NGチューブ（減圧）',
        '輸液+電解質補正',
        '抗菌薬（壊死/穿孔疑い時）',
      ],
      workup: ['腹部X線（coffee bean sign/S状結腸捻転, comma sign/盲腸捻転）', '腹部CT', 'CBC/CRP', '乳酸値'],
      disposition: '入院。内視鏡的整復 or 手術',
      pitfall: 'S状結腸捻転はX線でcoffee bean signが特徴的だが、CTがより正確。整復後の再発率は高い（40-60%）→待機手術を検討',
    },
  },

  fecal_impaction: {
    id: 'fecal_impaction', title: '🟡 糞便塞栓',
    result: { severity: 'moderate', title: '糞便塞栓（fecal impaction）',
      actions: [
        '直腸指診: 硬便の用手摘便（mineral oil注入後が容易）',
        '高位の塞栓: 温水浣腸 + 緩下剤',
        '浸透圧性下剤: ラクツロース or マグネシウム製剤（腎機能注意）',
        '刺激性下剤: センノシド + ピコスルファート',
        'PEG溶液（モビプレップ等）経口 or NG経由での洗浄',
        '合併症: 糞便性潰瘍/穿孔/巨大結腸/尿閉/せん妄',
        '予防: 定期的な排便コントロール、オピオイド使用中はナルデメジン/ルビプロストン',
      ],
      workup: ['直腸指診', '腹部X線（便塊の範囲確認）', '電解質（低K/高Mg）', '腎機能（Mg製剤使用前）'],
      disposition: '用手摘便+緩下剤で改善→外来フォロー。合併症あり→入院',
      pitfall: '糞便塞栓は「overflow incontinence」として下痢と誤診されることがある。直腸指診は必須。高齢者のせん妄の原因にもなる',
    },
  },

  toxic_megacolon: {
    id: 'toxic_megacolon', title: '🔴 中毒性巨大結腸',
    result: { severity: 'critical', title: '中毒性巨大結腸',
      actions: [
        'ICU管理',
        '絶食+NGチューブ',
        '輸液+電解質補正',
        '原因治療: CDI→バンコマイシン経口(500mg qid) + MNZ iv、IBD→ステロイド iv',
        '止瀉薬/抗コリン薬/オピオイドは禁忌（腸管運動さらに抑制）',
        '24-72hで改善なし or 穿孔→緊急手術（亜全結腸切除）',
        '外科+消化器内科コンサルト',
        'シリアルX線で結腸径モニタリング（>6cmが基準、>12cmで穿孔リスク高い）',
      ],
      workup: ['腹部X線（結腸拡張>6cm）', '腹部CT', 'CBC/CRP/PCT', '電解質', '乳酸値', 'CDI toxin', '血液培養'],
      disposition: 'ICU管理。穿孔→緊急手術',
      pitfall: 'CDIの中毒性巨大結腸: 止瀉薬は禁忌。抗菌薬使用中の腹部膨満+白血球著増(>15,000)はCDIを疑う',
    },
  },

  ischemic: {
    id: 'ischemic', title: '🟠 虚血性腸炎 / 大腸癌閉塞',
    desc: '血便の性状と病歴で鑑別',
    choices: [
      { label: '突然の左下腹部痛+血性下痢+高齢 → 虚血性腸炎', value: 'ischemic_colitis', icon: '🩸' },
      { label: '徐々に増悪する便秘+血便+体重減少 → 大腸癌疑い', value: 'colorectal_ca', icon: '🟠' },
    ],
    next: v => v,
  },

  ischemic_colitis: {
    id: 'ischemic_colitis', title: '🩸 虚血性腸炎',
    result: { severity: 'urgent', title: '虚血性腸炎',
      actions: [
        '大部分は保存的治療で改善（一過性型が最多）',
        '絶食/低残渣食+輸液',
        '抗菌薬: 重症時（CFPM or MEPM — 壊疽型の菌血症予防）',
        '腹膜刺激徴候/腸管壊死 → 緊急手術',
        '大腸内視鏡（急性期）: 粘膜浮腫/発赤/潰瘍を確認',
        '原因: 低血圧イベント/動脈硬化/心房細動/薬剤（利尿薬/血管収縮薬）',
      ],
      workup: ['腹部CT(造影)', 'CBC/CRP', '乳酸値', '大腸内視鏡（急性期可能なら）', '便培養（感染性腸炎除外）', 'D-dimer'],
      disposition: '軽症→入院経過観察。壊疽型→緊急手術',
      pitfall: '上腸間膜動脈(SMA)閉塞による腸間膜虚血はより重症。持続痛+乳酸↑→CT angiography',
    },
  },

  colorectal_ca: {
    id: 'colorectal_ca', title: '🟠 大腸癌による閉塞/出血',
    result: { severity: 'urgent', title: '大腸癌 — 閉塞/出血対応',
      actions: [
        '閉塞あり: 大腸ステント留置（Bridge to surgery）or 緊急手術',
        '出血: 多くは自然止血。大量出血→内視鏡的止血/TAE',
        '造影CT: 腫瘍の位置・大きさ・転移評価',
        '外科+消化器内科コンサルト',
        '貧血: 輸血（Hb<7 or 症候性）',
        '全身状態の評価（手術耐術能）',
      ],
      workup: ['腹部CT(造影)', 'CBC（貧血評価）', 'CEA/CA19-9', '電解質/肝機能/腎機能', '大腸内視鏡+生検（閉塞が高度でなければ）'],
      disposition: '入院。閉塞→ステント or 手術。出血→内視鏡',
      pitfall: '高齢者の鉄欠乏性貧血は大腸癌の除外が必要。左側結腸癌は閉塞症状が多く、右側は貧血が多い',
    },
  },

  functional: {
    id: 'functional', title: 'Step 2: 機能性/薬剤性便秘の評価',
    desc: 'Red Flagなし → 原因検索+対症療法。Rome IV基準で機能性便秘を評価。',
    choices: [
      { label: '薬剤性が疑われる（オピオイド/抗コリン薬/Ca拮抗薬/Fe剤）', value: 'drug_induced', icon: '💊' },
      { label: '慢性便秘（3ヶ月以上）で受診', value: 'chronic', icon: '📅' },
      { label: '急性の便秘（数日）+ 腹部膨満/不快感', value: 'acute', icon: '🟡' },
    ],
    next: v => v,
  },

  drug_induced: {
    id: 'drug_induced', title: '💊 薬剤性便秘',
    result: { severity: 'low', title: '薬剤性便秘',
      actions: [
        '原因薬剤の同定と可能なら変更/中止',
        '高リスク薬剤: オピオイド（最多）/抗コリン薬/Ca拮抗薬/鉄剤/制酸薬(Al含有)/利尿薬',
        'オピオイド誘発性便秘(OIC): ナルデメジン 0.2mg/日（末梢性μ受容体拮抗薬）',
        'OIC代替: ルビプロストン 24μg bid',
        '並行して緩下剤: 酸化マグネシウム 330mg tid（腎機能注意）+ 必要時刺激性下剤',
        '生活指導: 水分摂取/食物繊維/運動',
      ],
      workup: ['薬剤リスト確認', '電解質(K/Ca/Mg)', '甲状腺機能（TSH）', '血糖（DM）'],
      disposition: '外来管理',
      pitfall: 'オピオイド使用開始時に緩下剤を同時処方するのがベストプラクティス。高Mg血症は腎機能低下で起こる→酸化Mg使用前にCr確認',
    },
  },

  chronic: {
    id: 'chronic', title: '📅 慢性機能性便秘',
    result: { severity: 'low', title: '慢性機能性便秘',
      actions: [
        '【第1段階】生活指導',
        '水分摂取 1.5-2L/日',
        '食物繊維 20-25g/日（野菜/果物/全粒穀物）',
        '適度な運動',
        '排便習慣: 朝食後のトイレ時間確保',
        '【第2段階】浸透圧性下剤',
        '酸化マグネシウム 330-660mg tid（第一選択。腎機能注意）',
        'ラクツロース 20-30mL/日',
        'PEG(ポリエチレングリコール: モビコール) 1-2包/日',
        '【第3段階】追加薬剤',
        'ルビプロストン 24μg bid（ClCチャネル活性化）',
        'リナクロチド 0.25mg/日（GC-C受容体作動薬）',
        'エロビキシバット 10mg/日（胆汁酸トランスポーター阻害薬）',
        '刺激性下剤（センノシド/ピコスルファート）は頓用で',
        '大腸通過時間検査/直腸肛門機能検査（難治性の場合）',
      ],
      workup: ['大腸内視鏡（50歳以上の初発/警告徴候あり）', 'CBC（貧血チェック）', 'TSH', '電解質(Ca/K)', '血糖'],
      disposition: '外来管理。段階的に薬剤を追加',
      pitfall: '50歳以上の新規便秘は大腸癌のスクリーニングを。刺激性下剤の連用は耐性と大腸メラノーシスの原因。浸透圧性下剤が基本',
    },
  },

  acute: {
    id: 'acute', title: '🟡 急性の便秘',
    result: { severity: 'low', title: '急性便秘 — 対症療法',
      actions: [
        '直腸指診: 直腸内硬便→グリセリン浣腸 60-120mL',
        '坐薬: ビサコジル坐薬（新レシカルボン坐剤）',
        '経口: 酸化マグネシウム 660mg-1980mg/日',
        '即効性: センノシド 12-24mg + ピコスルファート 10-15滴',
        '高度便秘: PEG溶液（モビプレップ等）少量ずつ',
        '原因検索: 薬剤変更/食事変化/活動量低下/旅行',
        '改善後: 予防（水分/繊維/運動/浸透圧性下剤定期）',
      ],
      workup: ['腹部X線（便塊の範囲/腸閉塞除外）', '直腸指診'],
      disposition: '浣腸/緩下剤で改善→帰宅。改善なし→腹部CTで器質的疾患除外',
      pitfall: '「ただの便秘」でも腹部X線で大腸拡張や腸閉塞がないか確認。高齢者の便秘は腸閉塞の初期症状のことがある',
    },
  },
}

const severityConfig = {
  critical: { bg: 'bg-[#FDE8E8]', border: 'border-[#C62828]', text: 'text-[#B71C1C]', badge: '🔴 緊急' },
  urgent: { bg: 'bg-[#FFF3E0]', border: 'border-[#E65100]', text: 'text-[#BF360C]', badge: '🟠 準緊急' },
  moderate: { bg: 'bg-[#FFF8E1]', border: 'border-[#F9A825]', text: 'text-[#F57F17]', badge: '🟡 中等度' },
  low: { bg: 'bg-[#E8F5E9]', border: 'border-[#2E7D32]', text: 'text-[#1B5E20]', badge: '🟢 低リスク' },
}

export default function ConstipationERPage() {
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
        <span>便秘</span>
      </nav>
      <header className="mb-6">
        <span className="inline-block text-sm bg-dnl text-dn px-2.5 py-0.5 rounded-full font-medium mb-2">🚨 ER対応</span>
        <h1 className="text-2xl font-bold text-tx mb-1">便秘 ER対応ツリー</h1>
        <p className="text-sm text-muted">Red Flag評価 → 腸閉塞/穿孔/中毒性巨大結腸の除外 → 機能性/薬剤性便秘の段階的治療。</p>
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
      <ERDisclaimerFooter />
    </div>
  )
}
