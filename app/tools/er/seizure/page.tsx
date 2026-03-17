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
    id: 'start', title: 'Step 1: 来院時の状態を確認',
    desc: 'けいれんの対応はまず「今けいれんしているか」の判断から。5分以上持続 or 意識回復なく反復はてんかん重積状態（SE）。',
    choices: [
      { label: '今まさにけいれん中（活動性発作）', value: 'active', icon: '🚨', danger: true },
      { label: 'けいれんは止まった（発作後/post-ictal）', value: 'postictal', icon: '⚠️' },
      { label: 'けいれん様だが非てんかん性の可能性', value: 'non_epileptic', icon: '🔍' },
    ],
    next: v => v,
  },

  active: {
    id: 'active', title: 'Step 2: てんかん重積状態（SE）プロトコル',
    desc: '5分以上持続 or 意識回復なく反復するけいれんはSE。生命に関わる緊急事態。ABCと同時に薬物治療を開始。',
    result: {
      severity: 'critical',
      title: 'てんかん重積状態 — 段階的薬物治療',
      actions: [
        '【0-5分】ABC確保: 側臥位、吸引、酸素投与、ルート確保',
        '【即座】血糖チェック → 低血糖ならブドウ糖50%液 40mL iv',
        '【即座】ビタミンB1（チアミン）100mg iv（アルコール・栄養不良疑い時）',
        '【第1段階 0-5分】ジアゼパム 5-10mg iv（2mg/min）※施設により0.15mg/kgまで',
        '　or ミダゾラム 10mg 筋注（ルート確保困難時）',
        '　→ 5分で止まらなければ1回繰り返し可（最大2回）',
        '【第2段階 5-20分】ホスフェニトイン 22.5mgPE/kg iv（150mgPE/min以下）',
        '　or レベチラセタム 1000-3000mg iv（施設プロトコル参照）',
        '【第3段階 20-40分】難治性SE → ICU・麻酔科コンサルト',
        '　ミダゾラム持続 or プロポフォール or チオペンタール → 気管挿管+脳波モニタリング',
      ],
      workup: ['血糖（即座）', 'CBC・分画', '電解質（Na, Ca, Mg）', '腎機能・肝機能', '血液ガス', '抗てんかん薬濃度（既知のてんかん患者）', '毒物スクリーニング', '頭部CT（原因不明の初発時）', '脳波（SE制御後）', '腰椎穿刺（髄膜炎/脳炎疑い時 — CTで頭蓋内圧亢進否定後）'],
      disposition: 'ICU',
      pitfall: 'SE治療は「時間」が命。5分待ってから治療開始ではなく、来院時にけいれん中ならすぐ第1段階を開始。ホスフェニトイン投与中は心電図モニタリング必須（徐脈・QT延長）。プロポフォールは小児でPRISリスク',
    },
  },

  postictal: {
    id: 'postictal', title: 'Step 2: 発作後の評価 — 初発 or 既知てんかん',
    desc: '発作後状態（post-ictal）の持続時間は通常30分以内。それ以上の意識障害持続は別の原因を考慮。',
    choices: [
      { label: '初めてのけいれん（初発発作）', value: 'first', icon: '⚡' },
      { label: '既知のてんかん患者（breakthrough seizure）', value: 'known', icon: '💊' },
      { label: '明らかな誘因あり（発熱/低血糖/電解質/薬物）', value: 'provoked', icon: '🔬' },
    ],
    next: v => v,
  },

  first: {
    id: 'first', title: 'Step 3: 初発けいれん — 原因検索',
    desc: '初発全身性けいれんでは器質的原因の除外が最優先。頭蓋内病変・代謝異常・中枢神経感染症を検索。',
    result: {
      severity: 'urgent',
      title: '初発けいれん — 系統的原因検索',
      actions: [
        'バイタルサイン再評価（発熱の有無、血圧、SpO2）',
        '血糖チェック（低血糖は最も迅速に治療可能な原因）',
        '詳細な病歴聴取: 発作の様式（全身性 vs 焦点性 → 二次性全般化）、持続時間、目撃者情報',
        '神経学的診察: 麻痺・失語・瞳孔不同（Todd麻痺は24h以内に回復。持続するなら脳卒中を疑う）',
        '頭部CT（造影なし）→ 腫瘍・出血・脳卒中除外',
        '採血: 電解質（Na, Ca, Mg）、腎機能、肝機能、CBC、血糖、CRP',
        '髄膜刺激徴候がある場合 → CTで頭蓋内圧亢進否定後に腰椎穿刺（髄膜炎・脳炎除外）',
        'MRI（外来フォロー or 入院で施行。てんかん原性病変の検索）',
        '脳波（外来フォロー可。初発発作後24-48h以内が検出率高い）',
        '抗てんかん薬開始は神経内科にコンサルト（初発1回のみなら必須ではない場合も）',
      ],
      workup: ['血糖', 'CBC', '電解質（Na, Ca, Mg）', '腎機能・肝機能', 'CRP', '血液ガス', '頭部CT', '脳波（可能なら入院中に）', '頭部MRI（外来可）', '腰椎穿刺（髄膜炎疑い時）', '毒物スクリーニング（若年者）'],
      disposition: '入院（原因不明の初発は原則入院精査。明らかな誘因がありバイタル安定なら外来フォロー検討）',
      pitfall: 'Todd麻痺（発作後の一過性麻痺）を脳卒中と誤診しないよう注意。通常24h以内に改善。妊娠可能年齢の女性では子癇を忘れない。高齢者の初発けいれんでは脳腫瘍・脳卒中の頻度が高い',
    },
  },

  known: {
    id: 'known', title: 'Step 3: 既知てんかん — Breakthrough Seizure',
    desc: '服薬コンプライアンス不良が最多原因。薬物濃度チェックと誘因検索を並行。',
    result: {
      severity: 'moderate',
      title: '既知てんかん — Breakthrough Seizure評価',
      actions: [
        '服薬状況確認（飲み忘れ・自己中断が最多原因）',
        '抗てんかん薬の血中濃度測定（フェニトイン・バルプロ酸・カルバマゼピン等）',
        '誘因の検索: 睡眠不足、アルコール、感染症、電解質異常、新規薬剤（相互作用）',
        '発作型の変化がないか確認（新しいタイプの発作は追加検索の適応）',
        '血中濃度が治療域以下 → 補充投与 + コンプライアンス指導',
        '血中濃度が治療域内 → 誘因除去 or 用量調整/薬剤変更を神経内科と相談',
        '発作が頻回 or 通常と異なるパターン → 頭部画像を検討',
      ],
      workup: ['抗てんかん薬濃度', '電解質', '腎機能・肝機能', 'CBC', '必要に応じて頭部CT'],
      disposition: '外来フォロー可（意識清明に回復、バイタル安定、信頼できる帰宅先あり）。頻回発作・SE後は入院。',
      pitfall: '長期服薬患者でも脳腫瘍などの新規病変が出現することがある。「いつものてんかん」と決めつけず、パターンの変化があれば画像精査を',
    },
  },

  provoked: {
    id: 'provoked', title: 'Step 3: 誘発性けいれん — 原因別対応',
    desc: '明確な誘因があるけいれん（provoked seizure）は原因の治療が主体。抗てんかん薬の長期投与は不要な場合が多い。',
    choices: [
      { label: '低血糖', value: 'hypoglycemia', icon: '🍬' },
      { label: '電解質異常（低Na/低Ca/低Mg）', value: 'electrolyte', icon: '💧' },
      { label: '薬物・アルコール離脱', value: 'withdrawal', icon: '🍺' },
      { label: '発熱性けいれん（小児）/ 熱性けいれん', value: 'febrile', icon: '🌡️' },
      { label: '子癇（妊娠高血圧）', value: 'eclampsia', icon: '🤰', danger: true },
    ],
    next: v => `provoked_${v}`,
  },

  provoked_hypoglycemia: {
    id: 'provoked_hypoglycemia', title: '低血糖によるけいれん',
    result: {
      severity: 'urgent',
      title: '低血糖性けいれん — 即座の血糖補正',
      actions: ['50%ブドウ糖液 40mL（=20gブドウ糖）iv → 血糖再検', '持続低血糖ならブドウ糖点滴維持', 'インスリン過量・SU剤・副腎不全など原因検索', 'SU剤の場合はオクトレオチド検討（持続性低血糖）', '意識回復後も6-12時間は血糖モニタリング'],
      workup: ['血糖（繰り返し）', 'インスリン・Cペプチド', 'コルチゾール（副腎不全疑い時）', '肝機能', '薬剤歴の詳細確認'],
      disposition: 'SU剤や原因不明の低血糖は入院観察。食事関連の軽度低血糖で意識清明なら外来フォロー可',
      pitfall: 'SU剤による低血糖は24-72時間持続することがある。短時間の経過観察で帰宅させない',
    },
  },

  provoked_electrolyte: {
    id: 'provoked_electrolyte', title: '電解質異常によるけいれん',
    result: {
      severity: 'urgent',
      title: '電解質異常性けいれん — 原因の同定と補正',
      actions: ['低Na血症: 3%NaCl 100-150mL iv 20分で投与（重症・けいれん時）。24h補正は8mEq/L以内', '低Ca血症: グルコン酸Ca 10% 10-20mL iv（10分で）→ 持続点滴', '低Mg血症: MgSO4 2g iv（15-30分）→ 持続点滴', '原因検索（利尿薬・嘔吐/下痢・SIADH・甲状腺/副甲状腺）', '心電図モニタリング（低Ca・低Mgは不整脈リスク）'],
      workup: ['電解質（Na, K, Ca, Mg, P）', '浸透圧（血清・尿）', '腎機能', 'TSH・副甲状腺ホルモン（低Ca時）', '尿中Na・Cr（低Na鑑別）', '心電図'],
      disposition: '入院（けいれんを伴う電解質異常は重症）',
      pitfall: '低Na血症の急速補正はODS（浸透圧性脱髄症候群）のリスク。24時間で8mEq/L以上補正しない。3%NaClは必ず中心静脈 or 太い末梢から',
    },
  },

  provoked_withdrawal: {
    id: 'provoked_withdrawal', title: 'アルコール/薬物離脱けいれん',
    result: {
      severity: 'urgent',
      title: 'アルコール離脱けいれん — BZD投与と振戦せん妄予防',
      actions: ['ジアゼパム 10-20mg iv or ロラゼパム 2-4mg iv', 'CIWA-Arスコアで離脱重症度を評価', '持続的けいれんリスク → ジアゼパム loading', '振戦せん妄（DT）への進展に注意（離脱後48-96hがピーク）', 'チアミン 100mg iv + 葉酸 + マグネシウム補充', 'ハロペリドール等の抗精神病薬はけいれん閾値を下げるため慎重に'],
      workup: ['血糖', '電解質・Mg', '肝機能', 'CBC', '血液ガス', 'アルコール濃度', 'アンモニア', '頭部CT（外傷・硬膜下血腫除外）'],
      disposition: '入院（離脱けいれんは振戦せん妄の前駆症状の可能性あり）',
      pitfall: 'アルコール依存患者は転倒による硬膜下血腫を合併していることがある。「アルコール離脱」で片付けず頭部CTを検討。BZD系薬の離脱でもけいれんが起こる',
    },
  },

  provoked_febrile: {
    id: 'provoked_febrile', title: '熱性けいれん',
    result: {
      severity: 'moderate',
      title: '熱性けいれん — 単純型 vs 複雑型',
      actions: ['発作が5分以上持続ならジアゼパム坐薬 or iv', '解熱（アセトアミノフェン。NSAIDsは小児で慎重に）', '単純型（<15分、全身性、24h以内に反復なし、6ヶ月-5歳）→ 基本的に良性', '複雑型（≧15分、焦点性、24h以内に反復、6ヶ月未満 or 5歳以上）→ 精査必要', '髄膜炎の除外（特に12ヶ月未満 or 髄膜刺激徴候あり → 腰椎穿刺検討）', '家族への説明：単純型は予後良好、再発率30%、てんかん移行率は低い（2-4%）'],
      workup: ['体温', '発熱の原因検索（尿路感染・中耳炎・咽頭炎等）', '複雑型: CBC、電解質、血液培養、必要に応じて腰椎穿刺', '脳波（複雑型 or 反復する場合に外来で検討）'],
      disposition: '単純型：帰宅可（解熱・全身状態良好なら）。複雑型：入院観察を検討',
      pitfall: '「熱性けいれん」と判断する前に髄膜炎を除外。12ヶ月未満の乳児では髄膜刺激徴候が不明瞭なことがある',
    },
  },

  provoked_eclampsia: {
    id: 'provoked_eclampsia', title: '🤰 子癇（Eclampsia）',
    result: {
      severity: 'critical',
      title: '子癇 — 母体安定化＋緊急分娩評価',
      actions: ['【即座】左側臥位（下大静脈圧迫解除）', '【第一選択】MgSO4 4g iv（15-20分）→ 1-2g/h持続', '深部腱反射・呼吸・尿量をモニタリング（Mg中毒回避）', '降圧: sBP≧160 or dBP≧110 → ニカルジピン or ヒドララジン iv', '産科医への緊急コンサルト → 分娩計画（根本治療は分娩）', '胎児心拍モニタリング', 'HELLP症候群の評価（CBC、LDH、AST、ハプトグロビン）'],
      workup: ['血圧（頻回測定）', 'CBC・血小板', 'LDH・AST・ALT', 'Cr・尿酸', '尿蛋白', '凝固（DIC評価）', 'Mg濃度（投与開始後）', '胎児心拍モニタリング'],
      disposition: '産科病棟 or ICU',
      pitfall: 'MgSO4過量で呼吸抑制→グルコン酸Ca 1g ivで拮抗。産後子癇は分娩後48時間以内に発症しうる。妊娠20週未満のけいれんは子癇以外の原因を考慮',
    },
  },

  non_epileptic: {
    id: 'non_epileptic', title: 'Step 2: 非てんかん性発作の鑑別',
    desc: '全てのけいれん様運動がてんかんではない。失神後の痙攣（convulsive syncope）やPNES（心因性非てんかん性発作）を鑑別。',
    result: {
      severity: 'moderate',
      title: '非てんかん性発作の鑑別',
      actions: [
        '【失神後痙攣（convulsive syncope）】失神の原因検索。数秒の強直/間代は失神でも起こる。post-ictal期なし・持続時間短い・状況因子ありなら失神を疑う',
        '【PNES（心因性非てんかん性発作）】目を閉じている、左右非対称の動き、持続時間のばらつき、誘因あり。ただし「PNESだから安全」とは限らない（てんかんとPNES合併は10-40%）',
        '【不随意運動】ミオクローヌス・ジストニア・振戦との鑑別',
        '診断確定にはビデオ脳波モニタリング（入院で）が標準',
        '失神の場合は循環器精査（心電図・心エコー）を検討',
      ],
      workup: ['心電図', '血糖', '電解質', '必要に応じて頭部CT', '脳波（外来フォロー）', '失神疑い: 起立試験・心エコー・ホルター'],
      disposition: '外来フォロー可（バイタル安定・意識清明）。神経内科へ紹介',
      pitfall: '「PNES」のラベルを安易につけない。てんかんとPNESの合併は稀ではなく、専門医のビデオ脳波による確定診断が望ましい',
    },
  },
}

/* ── severity色 ── */
const sevColor = {
  critical: { bg: 'bg-[#FDECEA]', border: 'border-[#D93025]', text: 'text-[#B71C1C]', badge: '🚨 緊急' },
  urgent: { bg: 'bg-[#FFF8E1]', border: 'border-[#F9A825]', text: 'text-[#E65100]', badge: '⚠️ 準緊急' },
  moderate: { bg: 'bg-[#E8F0FE]', border: 'border-[#4285F4]', text: 'text-[#1565C0]', badge: 'ℹ️ 中等度' },
  low: { bg: 'bg-[#E6F4EA]', border: 'border-[#34A853]', text: 'text-[#1B5E20]', badge: '✅ 低リスク' },
}

export default function SeizurePage() {
  const [path, setPath] = useState<string[]>(['start'])
  const current = tree[path[path.length - 1]]

  const handleChoice = (value: string) => {
    if (current?.next) {
      const nextId = current.next(value)
      if (tree[nextId]) setPath(prev => [...prev, nextId])
    }
  }
  const goBack = () => { if (path.length > 1) setPath(prev => prev.slice(0, -1)) }
  const reset = () => setPath(['start'])

  if (!current) return null
  const sc = current.result ? sevColor[current.result.severity] : null

  return (
    <div className="max-w-3xl mx-auto">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/er" className="hover:text-ac">ER対応</Link><span className="mx-2">›</span>
        <span>けいれん</span>
      </nav>

      <header className="mb-6">
        <span className="inline-block text-sm bg-dnl text-dn px-2.5 py-0.5 rounded-full font-medium mb-2">🚨 ER対応</span>
        <h1 className="text-2xl font-bold text-tx mb-1">けいれん・てんかん重積</h1>
        <p className="text-sm text-muted">活動性発作 vs post-ictal → 原因検索。初発/既知/誘発性で対応が異なる。</p>
      </header>

      <ERDisclaimerBanner />

      {/* ステップ表示 */}
      <div className="mb-4 flex items-center gap-2">
        {path.length > 1 && (
          <button onClick={goBack} className="text-xs text-ac px-2 py-1 rounded border border-ac/20 hover:bg-acl transition-colors">
            ← 戻る
          </button>
        )}
        {path.length > 1 && (
          <button onClick={reset} className="text-xs text-muted px-2 py-1 rounded border border-br hover:bg-s1 transition-colors">
            最初から
          </button>
        )}
        <span className="text-xs text-muted ml-auto">Step {path.length}/{Object.keys(tree).length > 10 ? '...' : Object.keys(tree).length}</span>
      </div>

      {/* ── 選択肢ノード ── */}
      {current.choices && !current.result && (
        <div className="bg-s0 border border-br rounded-xl p-5 mb-6">
          <h2 className="text-base font-bold text-tx mb-2">{current.title}</h2>
          {current.desc && <p className="text-sm text-muted mb-4">{current.desc}</p>}
          <div className="space-y-2">
            {current.choices.map(c => (
              <button key={c.value} onClick={() => handleChoice(c.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  c.danger ? 'border-[#D93025]/30 hover:border-[#D93025] hover:bg-[#FDECEA]' : 'border-br hover:border-ac/40 hover:bg-acl'
                }`}>
                <span className="text-sm font-medium text-tx">{c.icon && <span className="mr-2">{c.icon}</span>}{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 結果ノード ── */}
      {current.result && sc && (
        <div className={`${sc.bg} border-2 ${sc.border} rounded-xl p-5 mb-6`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.text} bg-white/70`}>{sc.badge}</span>
          </div>
          <h2 className={`text-lg font-bold mb-3 ${sc.text}`}>{current.result.title}</h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-tx mb-2">アクション</p>
              <div className="space-y-1.5">
                {current.result.actions.map((a, i) => (
                  <p key={i} className="text-sm text-tx leading-relaxed">{a}</p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-tx mb-2">検査オーダー</p>
              <div className="flex flex-wrap gap-1.5">
                {current.result.workup.map((w, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/60 text-tx">{w}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-tx">Disposition:</p>
              <p className="text-sm text-tx">{current.result.disposition}</p>
            </div>

            {current.result.pitfall && (
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs font-bold text-[#E65100] mb-1">⚠️ ピットフォール</p>
                <p className="text-xs text-tx leading-relaxed">{current.result.pitfall}</p>
              </div>
            )}
          </div>

          <ERResultCaution />

          {/* 選択肢もある結果ノード */}
          {current.choices && (
            <div className="mt-4 pt-4 border-t border-black/10">
              <div className="space-y-2">
                {current.choices.map(c => (
                  <button key={c.value} onClick={() => handleChoice(c.value)}
                    className="w-full text-left p-3 rounded-xl border-2 border-white/40 hover:border-white/80 hover:bg-white/30 transition-all">
                    <span className="text-sm font-medium text-tx">{c.icon && <span className="mr-2">{c.icon}</span>}{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={reset} className="mt-4 w-full py-2.5 bg-white/60 rounded-xl text-sm font-medium text-tx hover:bg-white/80 transition-colors">
            最初からやり直す
          </button>
        </div>
      )}

      {/* 関連ツール */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">関連ツール</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/tools/er/altered-consciousness', name: '意識障害' },
            { href: '/tools/er/fever', name: '発熱' },
            { href: '/tools/calc/gcs', name: 'GCS' },
            { href: '/tools/calc/na-correction-rate', name: 'Na補正速度' },
            { href: '/tools/icu/vasopressor', name: 'ICU γ計算' },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">
              {t.name}
            </Link>
          ))}
        </div>
      </section>

      <ERDisclaimerFooter />

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">参考文献</h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2">
          <li>Glauser T et al. Evidence-Based Guideline: Treatment of Convulsive Status Epilepticus. Epilepsy Curr 2016</li>
          <li>Huff JS et al. AAN Clinical Practice Guideline: Evaluation of an Apparent Unprovoked First Seizure in Adults. Neurology 2015</li>
          <li>日本神経学会. てんかん診療ガイドライン 2018</li>
          <li>Kapur J et al. RAMPART: Randomized Assessment of Rapid Midazolam vs IV Lorazepam for Status Epilepticus. NEJM 2012</li>
        </ol>
      </section>
    </div>
  )
}
