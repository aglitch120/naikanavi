'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { MedicalEnglishTutorial } from '@/components/tutorials'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── 型定義 ──
interface Card {
  en: string
  ja: string
  example?: string
  category: Category
}

type Category = 'history' | 'exam' | 'lab' | 'procedure' | 'presentation' | 'abbreviation'
type Mode = 'menu' | 'flashcard' | 'quiz'

const CATEGORIES: { id: Category; label: string; icon: string; desc: string }[] = [
  { id: 'history', label: '問診', icon: '🗣️', desc: '主訴・現病歴・既往歴の聴取表現' },
  { id: 'exam', label: '身体診察', icon: '🩺', desc: '視診・触診・聴診・神経学的所見' },
  { id: 'lab', label: '検査・画像', icon: '🔬', desc: '血液検査・画像所見・読影用語' },
  { id: 'procedure', label: '手技', icon: '💉', desc: '手技の説明・指示・合併症' },
  { id: 'presentation', label: 'プレゼン', icon: '🎤', desc: '症例報告・カンファ・学会発表' },
  { id: 'abbreviation', label: '略語', icon: '📝', desc: '臨床で頻出の英語略語' },
]

// ── 語彙データ（USMLE/臨床必須） ──
const VOCAB: Card[] = [
  // === 問診 (history) ===
  { en: 'chief complaint', ja: '主訴', category: 'history' },
  { en: 'history of present illness (HPI)', ja: '現病歴', category: 'history' },
  { en: 'past medical history (PMH)', ja: '既往歴', category: 'history' },
  { en: 'family history (FHx)', ja: '家族歴', category: 'history' },
  { en: 'social history (SHx)', ja: '社会歴', category: 'history' },
  { en: 'review of systems (ROS)', ja: '系統的レビュー（各臓器系の症状確認）', category: 'history' },
  { en: 'onset', ja: '発症（いつから）', example: 'When was the onset of your symptoms?', category: 'history' },
  { en: 'duration', ja: '持続期間', example: 'How long has this been going on?', category: 'history' },
  { en: 'character / quality', ja: '性状（痛みの質など）', example: 'Can you describe the character of the pain?', category: 'history' },
  { en: 'severity', ja: '重症度', example: 'On a scale of 1-10, how severe is the pain?', category: 'history' },
  { en: 'radiation', ja: '放散（痛みの広がり）', example: 'Does the pain radiate anywhere?', category: 'history' },
  { en: 'aggravating / alleviating factors', ja: '増悪因子 / 軽快因子', category: 'history' },
  { en: 'associated symptoms', ja: '随伴症状', example: 'Are there any associated symptoms?', category: 'history' },
  { en: 'OPQRST', ja: '疼痛評価: Onset/Provocation/Quality/Radiation/Severity/Time', category: 'history' },
  { en: 'SAMPLE', ja: '病歴聴取: Symptoms/Allergies/Medications/Past history/Last meal/Events', category: 'history' },
  { en: 'drug allergy', ja: '薬物アレルギー', example: 'Do you have any drug allergies?', category: 'history' },
  { en: 'medication list', ja: '内服薬一覧', example: "What medications are you currently taking?", category: 'history' },
  { en: 'over-the-counter (OTC)', ja: '市販薬', category: 'history' },
  { en: 'immunization history', ja: '予防接種歴', category: 'history' },
  { en: 'surgical history', ja: '手術歴', example: 'Have you had any surgeries before?', category: 'history' },
  { en: 'tobacco / alcohol / illicit drug use', ja: '喫煙/飲酒/違法薬物の使用歴', category: 'history' },
  { en: 'pack-years', ja: '喫煙量（1日箱数×年数）', example: '20 pack-years = 1 pack/day × 20 years', category: 'history' },
  { en: 'differential diagnosis (DDx)', ja: '鑑別診断', category: 'history' },
  { en: 'red flag', ja: '危険徴候（見逃してはいけないサイン）', category: 'history' },
  { en: 'informed consent', ja: 'インフォームドコンセント（説明と同意）', category: 'history' },

  // === 身体診察 (exam) ===
  { en: 'vital signs', ja: 'バイタルサイン', example: 'BP 120/80, HR 72, RR 16, SpO2 98%, T 36.5°C', category: 'exam' },
  { en: 'inspection', ja: '視診', category: 'exam' },
  { en: 'palpation', ja: '触診', category: 'exam' },
  { en: 'percussion', ja: '打診', category: 'exam' },
  { en: 'auscultation', ja: '聴診', category: 'exam' },
  { en: 'heart murmur', ja: '心雑音', example: 'Grade 3/6 systolic murmur at the apex', category: 'exam' },
  { en: 'crackles / rales', ja: '捻髪音（ラ音）', category: 'exam' },
  { en: 'wheezing', ja: '喘鳴（ウィーズ）', category: 'exam' },
  { en: 'rhonchi', ja: 'いびき様ラ音', category: 'exam' },
  { en: 'stridor', ja: '吸気性喘鳴（ストライダー）', category: 'exam' },
  { en: 'jugular venous distension (JVD)', ja: '頸静脈怒張', category: 'exam' },
  { en: 'hepatomegaly / splenomegaly', ja: '肝腫大 / 脾腫', category: 'exam' },
  { en: 'rebound tenderness', ja: '反跳痛（ブルンベルグ徴候）', category: 'exam' },
  { en: 'guarding / rigidity', ja: '筋性防御 / 板状硬', category: 'exam' },
  { en: 'shifting dullness', ja: '移動性濁音（腹水の徴候）', category: 'exam' },
  { en: 'digital rectal exam (DRE)', ja: '直腸指診', category: 'exam' },
  { en: 'deep tendon reflex (DTR)', ja: '深部腱反射', category: 'exam' },
  { en: 'Babinski sign', ja: 'バビンスキー徴候（上位運動ニューロン障害）', category: 'exam' },
  { en: 'pupil: PERRLA', ja: '瞳孔: 正円・同大・対光反射迅速・両側対光反射正常', category: 'exam' },
  { en: 'Glasgow Coma Scale (GCS)', ja: 'グラスゴー昏睡スケール（E+V+M）', category: 'exam' },
  { en: 'NIHSS', ja: 'NIH Stroke Scale（脳卒中重症度）', category: 'exam' },
  { en: 'periorbital edema', ja: '眼窩周囲浮腫', category: 'exam' },
  { en: 'pitting edema', ja: '圧痕性浮腫', example: '2+ pitting edema of bilateral lower extremities', category: 'exam' },
  { en: 'cyanosis', ja: 'チアノーゼ（中心性/末梢性）', category: 'exam' },
  { en: 'jaundice / icterus', ja: '黄疸（皮膚/眼球）', category: 'exam' },

  // === 検査・画像 (lab) ===
  { en: 'complete blood count (CBC)', ja: '全血球計算', category: 'lab' },
  { en: 'white blood cell (WBC)', ja: '白血球', category: 'lab' },
  { en: 'hemoglobin (Hb) / hematocrit (Hct)', ja: 'ヘモグロビン / ヘマトクリット', category: 'lab' },
  { en: 'platelet (Plt)', ja: '血小板', category: 'lab' },
  { en: 'basic metabolic panel (BMP)', ja: '基本代謝パネル（Na/K/Cl/CO2/BUN/Cr/Glu/Ca）', category: 'lab' },
  { en: 'comprehensive metabolic panel (CMP)', ja: '包括的代謝パネル（BMP+肝機能+蛋白+Alb）', category: 'lab' },
  { en: 'arterial blood gas (ABG)', ja: '動脈血液ガス分析', category: 'lab' },
  { en: 'coagulation panel (PT/INR, aPTT)', ja: '凝固検査', category: 'lab' },
  { en: 'troponin', ja: 'トロポニン（心筋障害マーカー）', category: 'lab' },
  { en: 'BNP / NT-proBNP', ja: '脳性ナトリウム利尿ペプチド（心不全マーカー）', category: 'lab' },
  { en: 'D-dimer', ja: 'D-ダイマー（血栓マーカー）', category: 'lab' },
  { en: 'lactate', ja: '乳酸値（組織低灌流/嫌気性代謝の指標）', category: 'lab' },
  { en: 'procalcitonin (PCT)', ja: 'プロカルシトニン（細菌感染マーカー）', category: 'lab' },
  { en: 'urinalysis (UA)', ja: '尿検査', category: 'lab' },
  { en: 'blood culture', ja: '血液培養', example: 'Two sets of blood cultures were drawn.', category: 'lab' },
  { en: 'sensitivity / susceptibility', ja: '感受性（抗菌薬の効きやすさ）', category: 'lab' },
  { en: 'consolidation', ja: '浸潤影（肺炎等の画像所見）', category: 'lab' },
  { en: 'ground-glass opacity (GGO)', ja: 'すりガラス影', category: 'lab' },
  { en: 'pleural effusion', ja: '胸水', category: 'lab' },
  { en: 'pneumothorax', ja: '気胸', category: 'lab' },
  { en: 'midline shift', ja: '正中偏位（脳の偏位）', category: 'lab' },
  { en: 'filling defect', ja: '充満欠損（血栓/腫瘍）', example: 'CT showed filling defect in the pulmonary artery.', category: 'lab' },
  { en: 'free air / pneumoperitoneum', ja: '遊離ガス（消化管穿孔を示唆）', category: 'lab' },
  { en: 'air-fluid level', ja: 'ニボー（腸閉塞の所見）', category: 'lab' },
  { en: 'echocardiography', ja: '心エコー検査', category: 'lab' },

  // === 手技 (procedure) ===
  { en: 'venipuncture', ja: '静脈穿刺（採血）', category: 'procedure' },
  { en: 'arterial blood gas sampling', ja: '動脈採血', category: 'procedure' },
  { en: 'peripheral IV access', ja: '末梢静脈路確保', category: 'procedure' },
  { en: 'central venous catheter (CVC)', ja: '中心静脈カテーテル', category: 'procedure' },
  { en: 'endotracheal intubation', ja: '気管内挿管', category: 'procedure' },
  { en: 'rapid sequence intubation (RSI)', ja: '迅速導入挿管', category: 'procedure' },
  { en: 'lumbar puncture (LP) / spinal tap', ja: '腰椎穿刺', category: 'procedure' },
  { en: 'thoracentesis', ja: '胸腔穿刺', category: 'procedure' },
  { en: 'paracentesis', ja: '腹腔穿刺', category: 'procedure' },
  { en: 'pericardiocentesis', ja: '心嚢穿刺', category: 'procedure' },
  { en: 'chest tube / tube thoracostomy', ja: '胸腔ドレーン', category: 'procedure' },
  { en: 'needle decompression', ja: '針脱気（緊張性気胸の緊急処置）', category: 'procedure' },
  { en: 'Foley catheter insertion', ja: '尿道カテーテル留置', category: 'procedure' },
  { en: 'nasogastric (NG) tube insertion', ja: '経鼻胃管挿入', category: 'procedure' },
  { en: 'Seldinger technique', ja: 'セルジンガー法（ガイドワイヤーを用いたカテーテル留置）', category: 'procedure' },
  { en: 'sterile technique / aseptic technique', ja: '無菌操作', category: 'procedure' },
  { en: 'local anesthesia / lidocaine infiltration', ja: '局所麻酔（リドカイン浸潤）', category: 'procedure' },
  { en: 'suturing / wound closure', ja: '縫合・創閉鎖', category: 'procedure' },
  { en: 'incision and drainage (I&D)', ja: '切開排膿', category: 'procedure' },
  { en: 'defibrillation / cardioversion', ja: '除細動 / 電気的カルディオバージョン', category: 'procedure' },
  { en: 'complication', ja: '合併症', example: 'Possible complications include bleeding and infection.', category: 'procedure' },
  { en: 'consent form', ja: '同意書', category: 'procedure' },
  { en: 'time-out (before procedure)', ja: 'タイムアウト（手技前の安全確認）', category: 'procedure' },
  { en: 'specimen', ja: '検体', example: 'Send the specimen to the lab for culture.', category: 'procedure' },
  { en: 'hemostasis', ja: '止血', category: 'procedure' },

  // === プレゼン (presentation) ===
  { en: 'This is a [age]-year-old [sex] who presents with...', ja: '○歳の[男性/女性]で、〜を主訴に来院しました', category: 'presentation' },
  { en: 'The patient has a past medical history significant for...', ja: '患者の既往歴として特筆すべきは〜', category: 'presentation' },
  { en: 'On physical examination, the patient was...', ja: '身体診察では、患者は〜', category: 'presentation' },
  { en: 'Laboratory findings were notable for...', ja: '検査所見で注目すべきは〜', category: 'presentation' },
  { en: 'Imaging revealed...', ja: '画像検査では〜が認められた', category: 'presentation' },
  { en: 'The working diagnosis is...', ja: '暫定診断は〜', category: 'presentation' },
  { en: 'The differential diagnosis includes...', ja: '鑑別診断として〜が挙げられる', category: 'presentation' },
  { en: 'The plan is to...', ja: '方針としては〜', category: 'presentation' },
  { en: 'We recommend...', ja: '〜を推奨します', category: 'presentation' },
  { en: 'The patient was admitted to...', ja: '患者は〜に入院となった', category: 'presentation' },
  { en: 'The patient was discharged on hospital day...', ja: '患者は入院○日目に退院した', category: 'presentation' },
  { en: 'In summary...', ja: '要約すると〜', category: 'presentation' },
  { en: 'The clinical significance of this case is...', ja: 'この症例の臨床的意義は〜', category: 'presentation' },
  { en: 'This case highlights the importance of...', ja: 'この症例は〜の重要性を示している', category: 'presentation' },
  { en: 'The take-home message is...', ja: 'この症例から学ぶべきは〜', category: 'presentation' },
  { en: 'Are there any questions?', ja: '質問はありますか？', category: 'presentation' },

  // === 略語 (abbreviation) ===
  { en: 'ACS', ja: '急性冠症候群 (Acute Coronary Syndrome)', category: 'abbreviation' },
  { en: 'ARDS', ja: '急性呼吸窮迫症候群 (Acute Respiratory Distress Syndrome)', category: 'abbreviation' },
  { en: 'CHF', ja: 'うっ血性心不全 (Congestive Heart Failure)', category: 'abbreviation' },
  { en: 'COPD', ja: '慢性閉塞性肺疾患 (Chronic Obstructive Pulmonary Disease)', category: 'abbreviation' },
  { en: 'DKA', ja: '糖尿病性ケトアシドーシス (Diabetic Ketoacidosis)', category: 'abbreviation' },
  { en: 'DVT', ja: '深部静脈血栓症 (Deep Vein Thrombosis)', category: 'abbreviation' },
  { en: 'PE', ja: '肺塞栓症 (Pulmonary Embolism)', category: 'abbreviation' },
  { en: 'TIA', ja: '一過性脳虚血発作 (Transient Ischemic Attack)', category: 'abbreviation' },
  { en: 'STEMI', ja: 'ST上昇型心筋梗塞 (ST-Elevation Myocardial Infarction)', category: 'abbreviation' },
  { en: 'NSTEMI', ja: '非ST上昇型心筋梗塞 (Non-ST-Elevation MI)', category: 'abbreviation' },
  { en: 'SBP', ja: '特発性細菌性腹膜炎 (Spontaneous Bacterial Peritonitis)', category: 'abbreviation' },
  { en: 'UTI', ja: '尿路感染症 (Urinary Tract Infection)', category: 'abbreviation' },
  { en: 'CAUTI', ja: 'カテーテル関連尿路感染 (Catheter-Associated UTI)', category: 'abbreviation' },
  { en: 'CLABSI', ja: 'カテーテル関連血流感染 (Central Line-Associated BSI)', category: 'abbreviation' },
  { en: 'VAP', ja: '人工呼吸器関連肺炎 (Ventilator-Associated Pneumonia)', category: 'abbreviation' },
  { en: 'CDI', ja: 'クロストリジオイデス・ディフィシル感染 (C. difficile Infection)', category: 'abbreviation' },
  { en: 'GBS', ja: 'ギラン・バレー症候群 (Guillain-Barré Syndrome)', category: 'abbreviation' },
  { en: 'SLE', ja: '全身性エリテマトーデス (Systemic Lupus Erythematosus)', category: 'abbreviation' },
  { en: 'DIC', ja: '播種性血管内凝固 (Disseminated Intravascular Coagulation)', category: 'abbreviation' },
  { en: 'ROSC', ja: '自己心拍再開 (Return of Spontaneous Circulation)', category: 'abbreviation' },
  { en: 'NPO', ja: '絶飲食 (Nil Per Os / Nothing by Mouth)', category: 'abbreviation' },
  { en: 'PRN', ja: '必要時 (Pro Re Nata / As Needed)', category: 'abbreviation' },
  { en: 'BID / TID / QID', ja: '1日2回 / 3回 / 4回', category: 'abbreviation' },
  { en: 'q.d. / q.h. / q4h', ja: '毎日 / 毎時 / 4時間毎', category: 'abbreviation' },
  { en: 'Dx / Tx / Rx / Hx / Sx', ja: '診断 / 治療 / 処方 / 病歴 / 症状', category: 'abbreviation' },
]

const STORAGE_KEY = 'iwor_medenglish_progress'

// ═══════════════════════════════════════
export default function MedicalEnglishApp() {
  const [mode, setMode] = useState<Mode>('menu')
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all')
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [known, setKnown] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { const r = localStorage.getItem(STORAGE_KEY); return r ? new Set(JSON.parse(r)) : new Set() } catch { return new Set() }
  })

  const cards = useMemo(() => {
    const filtered = filterCat === 'all' ? VOCAB : VOCAB.filter(c => c.category === filterCat)
    return filtered.sort(() => Math.random() - 0.5)
  }, [filterCat, mode]) // eslint-disable-line

  const currentCard = cards[cardIndex] || cards[0]

  const quizOptions = useMemo(() => {
    if (!currentCard) return []
    const correct = currentCard.ja
    const others = VOCAB.filter(c => c.ja !== correct && c.category === currentCard.category)
      .sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.ja)
    if (others.length < 3) {
      const more = VOCAB.filter(c => c.ja !== correct && !others.includes(c.ja))
        .sort(() => Math.random() - 0.5).slice(0, 3 - others.length).map(c => c.ja)
      others.push(...more)
    }
    const all = [correct, ...others].sort(() => Math.random() - 0.5)
    return all
  }, [currentCard]) // eslint-disable-line

  const saveKnown = useCallback((s: Set<string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s)))
  }, [])

  const markKnown = useCallback(() => {
    if (!currentCard) return
    setKnown(prev => { const n = new Set(prev); n.add(currentCard.en); saveKnown(n); return n })
  }, [currentCard, saveKnown])

  const nextCard = useCallback(() => {
    setFlipped(false)
    setQuizAnswer(null)
    setCardIndex(prev => (prev + 1) % cards.length)
  }, [cards.length])

  const handleQuizAnswer = useCallback((idx: number) => {
    if (quizAnswer !== null) return
    setQuizAnswer(idx)
    const isCorrect = quizOptions[idx] === currentCard.ja
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }))
    if (isCorrect) markKnown()
  }, [quizAnswer, quizOptions, currentCard, markKnown])

  const startMode = useCallback((m: Mode, cat: Category | 'all') => {
    setFilterCat(cat)
    setMode(m)
    setCardIndex(0)
    setFlipped(false)
    setQuizAnswer(null)
    setScore({ correct: 0, total: 0 })
  }, [])

  const progress = useMemo(() => {
    const total = VOCAB.length
    return { known: known.size, total, pct: Math.round((known.size / total) * 100) }
  }, [known])

  // ── メニュー画面 ──
  if (mode === 'menu') {
    return (
      <main className="px-4 py-8">
        <nav className="text-sm text-muted mb-6">
          <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
          <Link href="/learning" className="hover:text-ac">学習</Link><span className="mx-2">›</span>
          <span>医学英語</span>
        </nav>
        <header className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-tx mb-1">医学英語講座</h1>
              <p className="text-sm text-muted">臨床で使う医学英語をフラッシュカード＋4択クイズで学習。{VOCAB.length}語収録。</p>
            </div>
            <ProPulseHint><FavoriteButton slug="learning-medical-english" title="医学英語講座" href="/learning/medical-english" /></ProPulseHint>
          </div>
        </header>

        {/* 進捗 */}
        <div className="bg-s0 border border-br rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-tx">学習進捗</p>
            <p className="text-sm font-bold" style={{ color: MC }}>{progress.known}/{progress.total}語（{progress.pct}%）</p>
          </div>
          <div className="w-full h-2 bg-s1 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress.pct}%`, background: MC }} />
          </div>
          {progress.known > 0 && (
            <button onClick={() => { setKnown(new Set()); localStorage.removeItem(STORAGE_KEY) }}
              className="text-[10px] text-muted hover:text-tx underline mt-2">進捗リセット</button>
          )}
        </div>

        {/* モード選択 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => startMode('flashcard', 'all')}
            className="bg-s0 border border-br rounded-xl p-5 text-left hover:border-ac/40 hover:shadow-sm transition-all group">
            <span className="text-3xl block mb-2">🃏</span>
            <p className="text-sm font-bold text-tx group-hover:text-ac transition-colors">フラッシュカード</p>
            <p className="text-[11px] text-muted mt-1">タップで日本語/英語を切替</p>
          </button>
          <button onClick={() => startMode('quiz', 'all')}
            className="bg-s0 border border-br rounded-xl p-5 text-left hover:border-ac/40 hover:shadow-sm transition-all group">
            <span className="text-3xl block mb-2">📝</span>
            <p className="text-sm font-bold text-tx group-hover:text-ac transition-colors">4択クイズ</p>
            <p className="text-[11px] text-muted mt-1">英語→日本語の4択問題</p>
          </button>
        </div>

        {/* カテゴリ別 */}
        <h2 className="text-sm font-bold text-tx mb-3">カテゴリ別に学習</h2>
        <div className="space-y-2">
          {CATEGORIES.map(cat => {
            const catCards = VOCAB.filter(c => c.category === cat.id)
            const catKnown = catCards.filter(c => known.has(c.en)).length
            return (
              <div key={cat.id} className="bg-s0 border border-br rounded-xl p-4 flex items-center gap-3">
                <span className="text-xl flex-shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-tx">{cat.label}</p>
                  <p className="text-[10px] text-muted">{cat.desc} · {catCards.length}語 · {catKnown}語習得</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => startMode('flashcard', cat.id)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-medium border border-br text-muted hover:border-ac/30 hover:text-ac transition-all">
                    🃏 カード
                  </button>
                  <button onClick={() => startMode('quiz', cat.id)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-medium text-white transition-all"
                    style={{ background: MC }}>
                    📝 クイズ
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <MedicalEnglishTutorial />
      </main>
    )
  }

  // ── フラッシュカード ──
  if (mode === 'flashcard') {
    return (
      <main className="px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMode('menu')} className="flex items-center gap-1.5 text-xs text-muted hover:text-tx transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            メニュー
          </button>
          <p className="text-xs text-muted">{cardIndex + 1} / {cards.length}</p>
        </div>

        {/* カード */}
        <button onClick={() => setFlipped(!flipped)}
          className="w-full bg-s0 border border-br rounded-2xl p-8 min-h-[200px] flex flex-col items-center justify-center text-center hover:shadow-md transition-all mb-4"
          style={{ perspective: '1000px' }}>
          {!flipped ? (
            <>
              <p className="text-2xl font-bold text-tx mb-2">{currentCard?.en}</p>
              <p className="text-xs text-muted">タップで日本語を表示</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold" style={{ color: MC }}>{currentCard?.ja}</p>
              {currentCard?.example && (
                <p className="text-xs text-muted mt-3 italic">{currentCard.example}</p>
              )}
              <p className="text-[10px] text-muted mt-2 px-2 py-0.5 rounded-full bg-s1">
                {CATEGORIES.find(c => c.id === currentCard?.category)?.label}
              </p>
            </>
          )}
        </button>

        {/* アクション */}
        <div className="flex gap-3">
          <button onClick={nextCard}
            className="flex-1 py-3 rounded-xl text-sm font-medium border border-br text-muted hover:text-tx transition-colors">
            次へ →
          </button>
          <button onClick={() => { markKnown(); nextCard() }}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: MC }}>
            ✓ 覚えた
          </button>
        </div>
      </main>
    )
  }

  // ── クイズ ──
  return (
    <main className="px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMode('menu')} className="flex items-center gap-1.5 text-xs text-muted hover:text-tx transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          メニュー
        </button>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{cardIndex + 1}/{cards.length}</span>
          <span className="font-bold" style={{ color: MC }}>{score.correct}/{score.total}正解</span>
        </div>
      </div>

      {/* 問題 */}
      <div className="bg-s0 border border-br rounded-2xl p-6 mb-4">
        <p className="text-[10px] text-muted mb-2">この英語の意味は？</p>
        <p className="text-xl font-bold text-tx">{currentCard?.en}</p>
      </div>

      {/* 選択肢 */}
      <div className="space-y-2 mb-4">
        {quizOptions.map((opt, i) => {
          const isCorrect = opt === currentCard?.ja
          const isSelected = quizAnswer === i
          const answered = quizAnswer !== null
          let cls = 'border-br bg-s0 text-tx hover:border-ac/30'
          if (answered) {
            if (isCorrect) cls = 'border-green-500 bg-green-50 text-green-800'
            else if (isSelected) cls = 'border-red-400 bg-red-50 text-red-800'
            else cls = 'border-br/50 bg-s1/50 text-muted'
          }
          return (
            <button key={i} onClick={() => handleQuizAnswer(i)} disabled={answered}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${cls}`}>
              <span className="font-mono text-muted mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
              {opt}
              {answered && isCorrect && <span className="ml-2">✓</span>}
              {answered && isSelected && !isCorrect && <span className="ml-2">✗</span>}
            </button>
          )
        })}
      </div>

      {/* 解説（回答後） */}
      {quizAnswer !== null && currentCard?.example && (
        <div className="bg-s1 rounded-xl p-4 mb-4">
          <p className="text-[10px] text-muted mb-1">例文</p>
          <p className="text-xs text-tx italic">{currentCard.example}</p>
        </div>
      )}

      {/* 次へ */}
      {quizAnswer !== null && (
        <button onClick={nextCard}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: MC }}>
          次の問題 →
        </button>
      )}
    </main>
  )
}
