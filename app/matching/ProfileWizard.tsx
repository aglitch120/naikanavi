'use client'
import { useState, useCallback, useEffect } from 'react'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── 拡張Profile型（旧フィールド + 新フィールド） ──
export interface WizardProfile {
  // Step 1: 基本情報
  name: string
  university: string
  graduationYear: string
  retentionYear: string         // なし / 1年次〜6年次
  // Step 2: 成績
  gpaRange: string              // 上位10%, 25%, 50%, 下位50%, 回答しない
  cbtScore: string              // 90%以上, 80-89%, ...
  clinicalEval: string          // 優秀, 良好, 普通, 回答しない
  strongSubjects: string[]
  weakSubjects: string[]
  // Step 3: 志望
  preferredSpecialty: string
  preferredRegions: string[]
  careerTypes: string[]         // スペシャリスト, ジェネラリスト, ...
  medicalInterests: string[]    // 急性期, 慢性期, ...
  // Step 4: 課外活動
  clubs: string
  clubRole: string
  clubLearning: string
  partTimeJob: string
  partTimeLearning: string
  volunteer: string
  // Step 5: 資格・研究
  qualifications: string
  languageSkills: string[]
  research: string
  researchResults: string
  studyAbroad: string
  // Step 6: 自己分析
  personalityTraits: string[]   // max 5
  strengthsList: string[]       // max 3
  strengthsEpisode: string
  weakness: string
  weaknessStrategy: string
  motivation: string
  doctorTrigger: string
  strengths: string             // 旧互換
}

export const EMPTY_WIZARD_PROFILE: WizardProfile = {
  name: '', university: '', graduationYear: '', retentionYear: 'なし',
  gpaRange: '', cbtScore: '', clinicalEval: '', strongSubjects: [], weakSubjects: [],
  preferredSpecialty: '', preferredRegions: [], careerTypes: [], medicalInterests: [],
  clubs: '', clubRole: '', clubLearning: '', partTimeJob: '', partTimeLearning: '', volunteer: '',
  qualifications: '', languageSkills: [], research: '', researchResults: '', studyAbroad: '',
  personalityTraits: [], strengthsList: [], strengthsEpisode: '', weakness: '', weaknessStrategy: '',
  motivation: '', doctorTrigger: '', strengths: '',
}

// ── 選択肢定数 ──
const SPECIALTIES = [
  '内科','外科','小児科','産婦人科','整形外科','脳神経外科',
  '皮膚科','眼科','耳鼻咽喉科','泌尿器科','精神科','放射線科',
  '麻酔科','救急科','形成外科','病理','リハビリテーション科',
  '総合診療科','未定',
]
const REGIONS = ['北海道','東北','関東','中部','近畿','中国','四国','九州・沖縄']
const SUBJECTS = ['内科','外科','小児科','産婦人科','整形外科','脳神経外科','精神科','皮膚科','眼科','耳鼻咽喉科','泌尿器科','放射線科','麻酔科','救急科','病理','公衆衛生','基礎医学']
const CAREER_TYPES = ['スペシャリスト型','ジェネラリスト型','研究・臨床両立型','教育・指導医型','地域医療型','グローバル型','医療×IT型']
const MEDICAL_INTERESTS = ['急性期','慢性期','予防医学','緩和医療','集中治療','手術・処置中心','診断中心']
const LANGUAGES = ['英語（日常会話）','英語（ビジネス）','英語（論文読解）','中国語','韓国語','その他']
const PERSONALITY_TRAITS = ['論理的思考','共感力','協調性','責任感','忍耐強さ','適応力','実行力','好奇心','リーダーシップ','冷静さ','コミュニケーション力','決断力','柔軟性','細部への注意','創造性']
const STRENGTHS_OPTIONS = ['チームワーク','リーダーシップ','粘り強さ','計画性','柔軟性','傾聴力','行動力','分析力','共感力','コミュニケーション力','探究心','誠実さ']

const GPA_OPTIONS = ['上位10%','上位25%','上位50%','下位50%','回答しない']
const CBT_OPTIONS = ['90%以上','80-89%','70-79%','60-69%','回答しない']
const CLINICAL_OPTIONS = ['優秀','良好','普通','回答しない']
const RETENTION_OPTIONS = ['なし','1年次','2年次','3年次','4年次','5年次','6年次']

// ── ステップ定義 ──
const STEPS = [
  { num: 1, title: '基本情報', icon: '👤', desc: '名前・大学・卒業年' },
  { num: 2, title: '成績', icon: '📊', desc: 'GPA・CBT・得意科目' },
  { num: 3, title: '志望', icon: '🎯', desc: '志望科・地域・キャリア' },
  { num: 4, title: '課外活動', icon: '🏃', desc: '部活・バイト・ボランティア' },
  { num: 5, title: '資格・研究', icon: '🔬', desc: '資格・語学・研究・留学' },
  { num: 6, title: '自己分析', icon: '💡', desc: '強み・動機・ビジョン' },
]

const STORAGE_KEY = "iwor_matching_profile"

// ═══════════════════════════════════════
//  メインウィザードコンポーネント
// ═══════════════════════════════════════
export default function ProfileWizard({
  isPro, onShowProModal, mode,
}: {
  isPro: boolean
  onShowProModal: () => void
  mode: 'matching' | 'career'
}) {
  const [step, setStep] = useState(0) // 0 = overview, 1-6 = steps
  const [profile, setProfile] = useState<WizardProfile>(EMPTY_WIZARD_PROFILE)
  const [saved, setSaved] = useState(false)
  const [showResume, setShowResume] = useState(false)

  // ── 読み込み ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const old = JSON.parse(raw)
        setProfile(prev => ({ ...prev, ...old }))
      }
    } catch {}
  }, [])

  // ── 自動保存（ステップ移動時） ──
  const autoSave = useCallback((p: WizardProfile) => {
    // strengths互換フィールドを自動生成
    const compat = {
      ...p,
      strengths: p.strengthsList.length > 0
        ? p.strengthsList.join('、') + (p.strengthsEpisode ? `。${p.strengthsEpisode}` : '')
        : p.strengths,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compat))
  }, [])

  const updateField = useCallback(<K extends keyof WizardProfile>(key: K, value: WizardProfile[K]) => {
    setProfile(prev => {
      const next = { ...prev, [key]: value }
      return next
    })
  }, [])

  const toggleArrayField = useCallback((key: keyof WizardProfile, value: string, max?: number) => {
    setProfile(prev => {
      const arr = (prev[key] as string[]) || []
      const next = arr.includes(value)
        ? arr.filter(v => v !== value)
        : max && arr.length >= max ? arr : [...arr, value]
      return { ...prev, [key]: next }
    })
  }, [])

  const goStep = useCallback((s: number) => {
    autoSave(profile)
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [profile, autoSave])

  const handleSave = useCallback(() => {
    if (!isPro) { onShowProModal(); return }
    autoSave(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [isPro, onShowProModal, profile, autoSave])

  // ── 完成度計算 ──
  const completion = (() => {
    const checks = [
      profile.name, profile.university, profile.graduationYear,
      profile.preferredSpecialty,
      profile.clubs || profile.partTimeJob || profile.volunteer,
      profile.strengthsList.length > 0 || profile.strengths,
      profile.motivation,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  })()

  // ── Overview（ステップ選択画面） ──
  if (step === 0) {
    return (
      <div className="space-y-4">
        {/* 案内 */}
        <div className="bg-s0 border border-br rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-tx">プロフィール完成度</p>
            <p className="text-sm font-bold" style={{ color: MC }}>{completion}%</p>
          </div>
          <div className="w-full h-2 bg-s1 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completion}%`, background: MC }} />
          </div>
          <p className="text-[11px] text-muted mt-2">各ステップをタップして入力。約10分で完成します。</p>
        </div>

        {/* ステップカード */}
        <div className="grid grid-cols-2 gap-3">
          {STEPS.map(s => {
            const filled = getStepFilled(s.num, profile)
            return (
              <button
                key={s.num}
                onClick={() => goStep(s.num)}
                className="bg-s0 border border-br rounded-xl p-4 text-left hover:border-ac/40 hover:shadow-sm transition-all group relative"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{s.icon}</span>
                  {filled && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: MC }}>
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-tx group-hover:text-ac transition-colors">
                  STEP {s.num}
                </p>
                <p className="text-xs font-medium text-tx mt-0.5">{s.title}</p>
                <p className="text-[10px] text-muted mt-1">{s.desc}</p>
              </button>
            )
          })}
        </div>

        {/* 保存ボタン */}
        <button onClick={handleSave}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2"
          style={{ background: MC, boxShadow: `0 4px 14px ${MC}33` }}>
          {saved ? (
            <><CheckIcon />保存しました</>
          ) : (
            <><SaveIcon />{isPro ? 'プロフィールを保存' : 'プロフィールを保存（PRO）'}</>
          )}
        </button>

        {/* 履歴書プレビュー */}
        <ResumePreview profile={profile} isPro={isPro} show={showResume} onToggle={() => setShowResume(!showResume)} />
      </div>
    )
  }

  // ── ステップ画面 ──
  const stepInfo = STEPS[step - 1]
  return (
    <div className="space-y-4">
      {/* ステップヘッダー */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => goStep(0)} className="text-muted hover:text-tx transition-colors p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-xs text-muted">STEP {stepInfo.num} / {STEPS.length}</p>
          <p className="text-base font-bold text-tx flex items-center gap-2">
            <span>{stepInfo.icon}</span>{stepInfo.title}
          </p>
        </div>
      </div>

      {/* プログレスバー */}
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
            style={{ background: i < step ? MC : i === step - 1 ? MC : '#E8E5DF' }} />
        ))}
      </div>

      {/* ステップコンテンツ */}
      {step === 1 && <Step1 profile={profile} updateField={updateField} />}
      {step === 2 && <Step2 profile={profile} updateField={updateField} toggleArrayField={toggleArrayField} />}
      {step === 3 && <Step3 profile={profile} updateField={updateField} toggleArrayField={toggleArrayField} mode={mode} />}
      {step === 4 && <Step4 profile={profile} updateField={updateField} />}
      {step === 5 && <Step5 profile={profile} updateField={updateField} toggleArrayField={toggleArrayField} />}
      {step === 6 && <Step6 profile={profile} updateField={updateField} toggleArrayField={toggleArrayField} />}

      {/* ナビゲーション */}
      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button onClick={() => goStep(step - 1)}
            className="flex-1 py-3 rounded-xl text-sm font-medium border border-br text-muted hover:text-tx transition-colors">
            ← 前へ
          </button>
        )}
        {step < 6 ? (
          <button onClick={() => goStep(step + 1)}
            className="flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: MC }}>
            次へ →
          </button>
        ) : (
          <button onClick={() => { autoSave(profile); goStep(0) }}
            className="flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: MC }}>
            完了 ✓
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
//  Step 1: 基本情報
// ═══════════════════════════════════════
function Step1({ profile, updateField }: StepProps) {
  return (
    <div className="space-y-4">
      <StepCard>
        <InputField label="氏名" value={profile.name} onChange={v => updateField('name', v)} placeholder="山田 太郎" />
        <InputField label="大学" value={profile.university} onChange={v => updateField('university', v)} placeholder="○○大学医学部" />
        <SelectField label="卒業年度" value={profile.graduationYear} onChange={v => updateField('graduationYear', v)}
          options={['',...[2026,2027,2028,2029,2030].map(String)]}
          labels={['選択してください','2026年3月卒業','2027年3月卒業','2028年3月卒業','2029年3月卒業','2030年3月卒業']} />
        <SelectField label="留年経験" value={profile.retentionYear} onChange={v => updateField('retentionYear', v)}
          options={RETENTION_OPTIONS} labels={RETENTION_OPTIONS} />
      </StepCard>
    </div>
  )
}

// ═══════════════════════════════════════
//  Step 2: 成績
// ═══════════════════════════════════════
function Step2({ profile, updateField, toggleArrayField }: StepProps & { toggleArrayField: ToggleFn }) {
  return (
    <div className="space-y-4">
      <StepCard title="成績概要">
        <ChipSelect label="GPA（大まかな位置）" options={GPA_OPTIONS}
          selected={profile.gpaRange ? [profile.gpaRange] : []}
          onToggle={v => updateField('gpaRange', v === profile.gpaRange ? '' : v)} />
        <ChipSelect label="CBT成績" options={CBT_OPTIONS}
          selected={profile.cbtScore ? [profile.cbtScore] : []}
          onToggle={v => updateField('cbtScore', v === profile.cbtScore ? '' : v)} />
        <ChipSelect label="臨床実習評価" options={CLINICAL_OPTIONS}
          selected={profile.clinicalEval ? [profile.clinicalEval] : []}
          onToggle={v => updateField('clinicalEval', v === profile.clinicalEval ? '' : v)} />
      </StepCard>
      <StepCard title="科目">
        <ChipSelect label="得意科目（複数可）" options={SUBJECTS}
          selected={profile.strongSubjects} onToggle={v => toggleArrayField('strongSubjects', v)} multi />
        <ChipSelect label="苦手科目（複数可）" options={SUBJECTS}
          selected={profile.weakSubjects} onToggle={v => toggleArrayField('weakSubjects', v)} multi />
      </StepCard>
    </div>
  )
}

// ═══════════════════════════════════════
//  Step 3: 志望
// ═══════════════════════════════════════
function Step3({ profile, updateField, toggleArrayField, mode }: StepProps & { toggleArrayField: ToggleFn; mode: string }) {
  return (
    <div className="space-y-4">
      <StepCard title="志望科・地域">
        <SelectField label="志望科" value={profile.preferredSpecialty}
          onChange={v => updateField('preferredSpecialty', v)}
          options={['', ...SPECIALTIES]} labels={['選択してください', ...SPECIALTIES]} />
        {mode === 'matching' && (
          <ChipSelect label="希望地域（複数可）" options={REGIONS}
            selected={profile.preferredRegions} onToggle={v => toggleArrayField('preferredRegions', v)} multi />
        )}
      </StepCard>
      <StepCard title="キャリアビジョン">
        <ChipSelect label="目指す医師像（複数可）" options={CAREER_TYPES}
          selected={profile.careerTypes} onToggle={v => toggleArrayField('careerTypes', v)} multi />
        <ChipSelect label="興味のある医療（複数可）" options={MEDICAL_INTERESTS}
          selected={profile.medicalInterests} onToggle={v => toggleArrayField('medicalInterests', v)} multi />
      </StepCard>
    </div>
  )
}

// ═══════════════════════════════════════
//  Step 4: 課外活動
// ═══════════════════════════════════════
function Step4({ profile, updateField }: StepProps) {
  return (
    <div className="space-y-4">
      <StepCard title="部活・サークル">
        <InputField label="活動名・期間" value={profile.clubs} onChange={v => updateField('clubs', v)}
          placeholder="例: バスケットボール部（4年間）" />
        <InputField label="役職" value={profile.clubRole} onChange={v => updateField('clubRole', v)}
          placeholder="例: 主将 / 副部長 / なし" />
        <TextAreaField label="学んだこと・アピールポイント" value={profile.clubLearning}
          onChange={v => updateField('clubLearning', v)}
          placeholder="例: チームをまとめる経験から、多様な意見を尊重しつつ目標に向かう力を養った" rows={2} />
      </StepCard>
      <StepCard title="アルバイト">
        <InputField label="業種・期間" value={profile.partTimeJob} onChange={v => updateField('partTimeJob', v)}
          placeholder="例: 塾講師（2年間）" />
        <TextAreaField label="学んだこと" value={profile.partTimeLearning}
          onChange={v => updateField('partTimeLearning', v)}
          placeholder="例: わかりやすく説明する力、相手の理解度に合わせた対応力" rows={2} />
      </StepCard>
      <StepCard title="ボランティア・その他">
        <TextAreaField label="活動内容" value={profile.volunteer}
          onChange={v => updateField('volunteer', v)}
          placeholder="例: 国際医療ボランティア（カンボジア、2週間）" rows={2} />
      </StepCard>
    </div>
  )
}

// ═══════════════════════════════════════
//  Step 5: 資格・研究
// ═══════════════════════════════════════
function Step5({ profile, updateField, toggleArrayField }: StepProps & { toggleArrayField: ToggleFn }) {
  return (
    <div className="space-y-4">
      <StepCard title="資格・語学">
        <InputField label="取得資格" value={profile.qualifications} onChange={v => updateField('qualifications', v)}
          placeholder="例: TOEIC 800点、漢検2級" />
        <ChipSelect label="語学スキル（複数可）" options={LANGUAGES}
          selected={profile.languageSkills} onToggle={v => toggleArrayField('languageSkills', v)} multi />
      </StepCard>
      <StepCard title="研究経験">
        <TextAreaField label="研究室・テーマ" value={profile.research} onChange={v => updateField('research', v)}
          placeholder="例: 循環器内科学教室で心不全に関する基礎研究" rows={2} />
        <InputField label="成果（論文・学会発表）" value={profile.researchResults}
          onChange={v => updateField('researchResults', v)} placeholder="例: 日本循環器学会でポスター発表" />
      </StepCard>
      <StepCard title="留学経験">
        <TextAreaField label="期間・場所・内容" value={profile.studyAbroad}
          onChange={v => updateField('studyAbroad', v)}
          placeholder="例: アメリカ・ジョンズホプキンス大学（1ヶ月、臨床実習）" rows={2} />
      </StepCard>
    </div>
  )
}

// ═══════════════════════════════════════
//  Step 6: 自己分析
// ═══════════════════════════════════════
function Step6({ profile, updateField, toggleArrayField }: StepProps & { toggleArrayField: ToggleFn }) {
  return (
    <div className="space-y-4">
      <StepCard title="性格・特性">
        <ChipSelect label="あなたの特性（最大5つ）" options={PERSONALITY_TRAITS}
          selected={profile.personalityTraits}
          onToggle={v => toggleArrayField('personalityTraits', v, 5)} multi max={5} />
      </StepCard>
      <StepCard title="強み・弱み">
        <ChipSelect label="強み（最大3つ）" options={STRENGTHS_OPTIONS}
          selected={profile.strengthsList}
          onToggle={v => toggleArrayField('strengthsList', v, 3)} multi max={3} />
        <TextAreaField label="強みのエピソード" value={profile.strengthsEpisode}
          onChange={v => updateField('strengthsEpisode', v)}
          placeholder="例: チーム医療の授業で意見が対立した際、全員の意見を聞いた上で合意点を見つけた" rows={3} />
        <InputField label="弱み・課題" value={profile.weakness} onChange={v => updateField('weakness', v)}
          placeholder="例: 完璧主義で時間がかかることがある" />
        <InputField label="克服の工夫" value={profile.weaknessStrategy}
          onChange={v => updateField('weaknessStrategy', v)}
          placeholder="例: 優先順位をつけて、80点で次に進む意識を持つようにしている" />
      </StepCard>
      <StepCard title="志望動機・ビジョン">
        <TextAreaField label="医師を目指したきっかけ" value={profile.doctorTrigger}
          onChange={v => updateField('doctorTrigger', v)}
          placeholder="例: 幼い頃に入院した経験から、患者に寄り添う医師になりたいと思った" rows={2} />
        <TextAreaField label="志望動機" value={profile.motivation}
          onChange={v => updateField('motivation', v)}
          placeholder="例: 幅広い症例を経験し、地域医療に貢献できる総合力のある医師になりたい" rows={3} />
      </StepCard>
    </div>
  )
}

// ═══════════════════════════════════════
//  履歴書プレビュー
// ═══════════════════════════════════════
function ResumePreview({ profile, isPro, show, onToggle }: {
  profile: WizardProfile; isPro: boolean; show: boolean; onToggle: () => void
}) {
  const hasData = profile.name && profile.university
  return (
    <div className="bg-s0 border border-br rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-s1/50 transition-colors">
        <span className="text-sm font-bold text-tx flex items-center gap-2">
          <svg className="w-4 h-4" style={{ stroke: MC }} fill="none" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          履歴書プレビュー
          {!isPro && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: MCL, color: MC }}>PRO</span>}
        </span>
        <span className={`text-muted transition-transform ${show ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {show && (
        <div className="border-t border-br">
          {!hasData ? (
            <div className="p-6 text-center"><p className="text-xs text-muted">STEP 1で氏名と大学を入力すると表示されます</p></div>
          ) : (
            <div className="p-5 relative">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-20 h-24 bg-s1 border border-br rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-[10px] text-muted">写真</span></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-tx mb-1">{profile.name}</p>
                    <div className="space-y-0.5 text-xs text-muted">
                      <p>{profile.university}</p>
                      {profile.graduationYear && <p>{profile.graduationYear}年3月卒業見込み</p>}
                      {profile.preferredSpecialty && <p>志望科: <span className="font-medium text-tx">{profile.preferredSpecialty}</span></p>}
                    </div>
                  </div>
                </div>
                <hr className="border-br" />
                <RSection title="志望動機" content={profile.motivation} />
                <RSection title="強み" content={
                  profile.strengthsList.length > 0
                    ? profile.strengthsList.join('、') + (profile.strengthsEpisode ? `\n${profile.strengthsEpisode}` : '')
                    : profile.strengths
                } />
                <RSection title="部活・課外活動" content={[profile.clubs, profile.clubRole ? `（${profile.clubRole}）` : '', profile.clubLearning].filter(Boolean).join(' ')} />
                <RSection title="研究経験" content={[profile.research, profile.researchResults].filter(Boolean).join('／')} />
                {profile.preferredRegions.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-tx mb-1">希望研修地域</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.preferredRegions.map(r => <span key={r} className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ background: MCL, color: MC }}>{r}</span>)}
                    </div>
                  </div>
                )}
              </div>
              {!isPro && (
                <div className="absolute inset-0 top-32">
                  <div className="w-full h-full backdrop-blur-md bg-s0/60 flex flex-col items-center justify-center px-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: MCL }}>
                      <svg className="w-6 h-6" style={{ stroke: MC }} fill="none" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </div>
                    <p className="text-sm font-bold text-tx mb-1">PRO会員で履歴書を完全生成</p>
                    <p className="text-xs text-muted text-center">PDF出力・AI添削が使えます</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════
//  共通UIパーツ
// ═══════════════════════════════════════
type StepProps = { profile: WizardProfile; updateField: <K extends keyof WizardProfile>(k: K, v: WizardProfile[K]) => void }
type ToggleFn = (key: keyof WizardProfile, value: string, max?: number) => void

function StepCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-s0 border border-br rounded-xl p-4 space-y-3">
      {title && <p className="text-xs font-bold text-tx">{title}</p>}
      {children}
    </div>
  )
}

function InputField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-tx mb-1 block">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all" />
    </div>
  )
}

function TextAreaField({ label, value, onChange, placeholder, rows = 2 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-tx mb-1 block">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all resize-none" />
    </div>
  )
}

function SelectField({ label, value, onChange, options, labels }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; labels: string[]
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-tx mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all">
        {options.map((opt, i) => <option key={opt} value={opt}>{labels[i]}</option>)}
      </select>
    </div>
  )
}

function ChipSelect({ label, options, selected, onToggle, multi, max }: {
  label: string; options: string[]; selected: string[]; onToggle: (v: string) => void; multi?: boolean; max?: number
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-tx mb-2 block">
        {label}
        {max && <span className="text-muted ml-1">({selected.length}/{max})</span>}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = selected.includes(opt)
          const disabled = !active && max ? selected.length >= max : false
          return (
            <button key={opt} onClick={() => !disabled && onToggle(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                active ? 'text-white border-transparent' : disabled ? 'border-br text-muted/40 bg-s0 cursor-not-allowed' : 'border-br text-muted hover:border-br2 bg-s0'
              }`}
              style={active ? { background: MC } : undefined}
              disabled={disabled}
            >{opt}</button>
          )
        })}
      </div>
    </div>
  )
}

function RSection({ title, content }: { title: string; content: string }) {
  if (!content) return null
  return <div><p className="text-xs font-bold text-tx mb-1">{title}</p><p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{content}</p></div>
}

function CheckIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
}
function SaveIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
}

// ── ステップ完了判定 ──
function getStepFilled(step: number, p: WizardProfile): boolean {
  switch (step) {
    case 1: return !!(p.name && p.university && p.graduationYear)
    case 2: return !!(p.gpaRange || p.strongSubjects.length > 0)
    case 3: return !!p.preferredSpecialty
    case 4: return !!(p.clubs || p.partTimeJob || p.volunteer)
    case 5: return !!(p.qualifications || p.research || p.studyAbroad)
    case 6: return !!(p.strengthsList.length > 0 || p.motivation)
    default: return false
  }
}
