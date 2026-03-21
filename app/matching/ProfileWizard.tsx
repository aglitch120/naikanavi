'use client'
import { useState, useCallback, useEffect } from 'react'

import { loadProfile, saveProfile } from '@/lib/matching-profile-storage'

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
  clubPeriod: string            // 部活期間
  clubActivity: string          // 部活内容詳細
  partTimeJob: string
  partTimeLearning: string
  partTimePeriod: string        // バイト期間
  partTimeDetail: string        // バイト業務内容詳細
  volunteer: string
  volunteerDetail: string       // ボランティア詳細
  // Step 5: 資格・研究
  qualifications: string
  languageSkills: string[]
  research: string
  researchResults: string
  studyAbroad: string
  labName: string               // 研究室名
  researchPeriod: string        // 研究期間
  researchTheme: string         // 研究テーマ
  itSkills: string              // ITスキル
  hobbies: string               // 趣味・特技
  medicalApplication: string    // スキルの医療応用
  // Step 6: 自己分析
  personalityTraits: string[]   // max 5
  strengthsList: string[]       // max 3
  strengthsEpisode: string
  weakness: string
  weaknessStrategy: string
  hospitalContribution: string  // 病院への貢献
  futureVision: string          // 5年後のビジョン
  motivation: string
  doctorTrigger: string
  strengths: string             // 旧互換
  // Step 7: 将来ビジョン
  doctorType: string[]          // スペシャリスト/ジェネラリスト/研究/教育/管理/地域/グローバル/革新
  goal5y: string                // 5年後の目標
  goal10y: string               // 10年後の目標
  otherFields: string[]         // 医学教育/基礎研究/医療政策/病院経営/医療IT/国際医療/メディア/起業/製薬
  // Step 8: ライフスタイル
  workStyle: string[]           // 規則的/フレックス/当直含む/残業少ない/土日休み
  incomeGoal: string            // 1000万未満/1000-1500/1500-2000/2000以上/働き方重視
  wlBalance: string             // 8:2/7:3/6:4/5:5/4:6/3:7
  privateValues: string[]       // 家族/友人/趣味/自己啓発/スポーツ/旅行/社会貢献
  // Step 9: 理想の職場
  workplaceAtmosphere: string[] // 活気/落ち着き/フランク/伝統的/協調性/個人裁量
  idealMentor: string[]         // 技術指導/キャリア支援/距離感/プライベート親身/厳しい/裁量/最新知識
  workplaceRole: string[]       // リーダーシップ/専門家/チーム貢献/後進育成/新規推進
}

export const EMPTY_WIZARD_PROFILE: WizardProfile = {
  name: '', university: '', graduationYear: '', retentionYear: 'なし',
  gpaRange: '', cbtScore: '', clinicalEval: '', strongSubjects: [], weakSubjects: [],
  preferredSpecialty: '', preferredRegions: [], careerTypes: [], medicalInterests: [],
  clubs: '', clubRole: '', clubLearning: '', clubPeriod: '', clubActivity: '',
  partTimeJob: '', partTimeLearning: '', partTimePeriod: '', partTimeDetail: '',
  volunteer: '', volunteerDetail: '',
  qualifications: '', languageSkills: [], research: '', researchResults: '', studyAbroad: '',
  labName: '', researchPeriod: '', researchTheme: '', itSkills: '', hobbies: '', medicalApplication: '',
  personalityTraits: [], strengthsList: [], strengthsEpisode: '', weakness: '', weaknessStrategy: '',
  hospitalContribution: '', futureVision: '',
  motivation: '', doctorTrigger: '', strengths: '',
  doctorType: [], goal5y: '', goal10y: '', otherFields: [],
  workStyle: [], incomeGoal: '', wlBalance: '', privateValues: [],
  workplaceAtmosphere: [], idealMentor: [], workplaceRole: [],
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

const DOCTOR_TYPES = ['スペシャリスト型','ジェネラリスト型','研究者型','教育者型','管理職型','地域医療型','グローバル型','革新者型']
const OTHER_FIELDS = ['医学教育','基礎研究','医療政策','病院経営','医療IT','国際医療','メディア','起業','製薬']
const WORK_STYLES = ['規則的な勤務','フレックス制','当直含む','残業少ない','土日休み']
const INCOME_GOALS = ['1000万未満','1000〜1500万','1500〜2000万','2000万以上','働き方を重視']
const WL_BALANCE_OPTIONS = ['仕事8:生活2','仕事7:生活3','仕事6:生活4','仕事5:生活5','仕事4:生活6','仕事3:生活7']
const PRIVATE_VALUES = ['家族との時間','友人関係','趣味・娯楽','自己啓発','スポーツ','旅行','社会貢献']
const WORKPLACE_ATMOSPHERE = ['活気がある','落ち着いている','フランクな雰囲気','伝統的・格式ある','協調性が高い','個人裁量が大きい']
const IDEAL_MENTOR = ['技術・手技指導','キャリア支援','適度な距離感','プライベートも親身','厳しく鍛えてくれる','裁量を与えてくれる','最新知識をもつ']
const WORKPLACE_ROLES = ['リーダーシップを発揮','専門家として深める','チームに貢献','後進を育てる','新規事業・改革推進']

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
  { num: 7, title: '将来ビジョン', icon: '🔮', desc: '医師像・キャリア目標' },
  { num: 8, title: 'ライフスタイル', icon: '⚖️', desc: '勤務・収入・WLB' },
  { num: 9, title: '理想の職場', icon: '🏥', desc: '雰囲気・メンター・役割' },
]

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
  const [step, setStep] = useState(0) // 0 = overview, 1-9 = steps
  const [profile, setProfile] = useState<WizardProfile>(EMPTY_WIZARD_PROFILE)
  const [saved, setSaved] = useState(false)

  // ── 読み込み（クラウド優先 → localStorage fallback） ──
  useEffect(() => {
    (async () => {
      try {
        const data = await loadProfile()
        if (data) setProfile(prev => ({ ...prev, ...data }))
      } catch {}
    })()
  }, [])

  // ── 自動保存（localStorage即時 + クラウド3秒debounce） ──
  const autoSave = useCallback((p: WizardProfile) => {
    const compat = {
      ...p,
      strengths: p.strengthsList.length > 0
        ? p.strengthsList.join('、') + (p.strengthsEpisode ? `。${p.strengthsEpisode}` : '')
        : p.strengths,
      // Step 4 detail fields
      clubPeriod: p.clubPeriod,
      clubActivity: p.clubActivity,
      partTimePeriod: p.partTimePeriod,
      partTimeDetail: p.partTimeDetail,
      volunteerDetail: p.volunteerDetail,
      // Step 5 detail fields
      labName: p.labName,
      researchPeriod: p.researchPeriod,
      researchTheme: p.researchTheme,
      itSkills: p.itSkills,
      hobbies: p.hobbies,
      medicalApplication: p.medicalApplication,
      // Step 6 detail fields
      hospitalContribution: p.hospitalContribution,
      futureVision: p.futureVision,
    }
    saveProfile(compat)
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
      <div className="pb-20">
        {/* 完成度プログレスバー */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 bg-s1 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completion}%`, background: MC }} />
          </div>
          <p className="text-xs font-bold flex-shrink-0" style={{ color: MC }}>{completion}%</p>
        </div>

        {/* ステップカード — 3列コンパクト */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {STEPS.map(s => {
            const filled = getStepFilled(s.num, profile)
            return (
              <button key={s.num} onClick={() => goStep(s.num)}
                className="p-2 rounded-xl border text-center transition-all hover:border-ac/30"
                style={{ borderColor: filled ? MC + '40' : 'var(--br)', background: filled ? MCL : 'var(--s0)' }}>
                <span className="text-lg block">{s.icon}</span>
                <p className="text-[10px] font-bold mt-1" style={{ color: filled ? MC : 'var(--m)' }}>{s.title}</p>
                <p className="text-[8px]" style={{ color: filled ? MC : 'var(--m)' }}>{filled ? '✓' : '未入力'}</p>
              </button>
            )
          })}
        </div>

        {/* 履歴書プレビュー — 常時表示 */}
        <ResumePreview profile={profile} isPro={isPro} />

        {/* 保存ボタン — sticky */}
        <div className="fixed bottom-16 left-0 right-0 px-4 z-10">
          <button onClick={handleSave}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2"
            style={{ background: MC, boxShadow: `0 4px 14px ${MC}33` }}>
            {saved ? (
              <><CheckIcon />保存しました</>
            ) : (
              <><SaveIcon />{isPro ? 'プロフィールを保存' : 'プロフィールを保存（PRO）'}</>
            )}
          </button>
        </div>
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
      {step === 7 && <Step7 profile={profile} updateField={updateField} toggleArrayField={toggleArrayField} />}
      {step === 8 && <Step8 profile={profile} updateField={updateField} toggleArrayField={toggleArrayField} />}
      {step === 9 && <Step9 profile={profile} updateField={updateField} toggleArrayField={toggleArrayField} />}

      {/* ナビゲーション */}
      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button onClick={() => goStep(step - 1)}
            className="flex-1 py-3 rounded-xl text-sm font-medium border border-br text-muted hover:text-tx transition-colors">
            ← 前へ
          </button>
        )}
        {step < 9 ? (
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
  const [showClubDetail, setShowClubDetail] = useState(false)
  const [showPartTimeDetail, setShowPartTimeDetail] = useState(false)
  const [showVolunteerDetail, setShowVolunteerDetail] = useState(false)

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
        <button
          onClick={() => setShowClubDetail(v => !v)}
          className="text-[11px] font-medium mt-1 transition-colors"
          style={{ color: MC }}
        >
          詳しく {showClubDetail ? '▴' : '▾'}
        </button>
        {showClubDetail && (
          <div className="space-y-3 pt-1 border-t border-br mt-1">
            <InputField label="部活期間" value={profile.clubPeriod} onChange={v => updateField('clubPeriod', v)}
              placeholder="例: 1年次〜4年次" />
            <TextAreaField label="部活内容詳細" value={profile.clubActivity}
              onChange={v => updateField('clubActivity', v)}
              placeholder="例: 週3回の練習、大会運営、合宿の企画・実施など" rows={2} />
          </div>
        )}
      </StepCard>
      <StepCard title="アルバイト">
        <InputField label="業種・期間" value={profile.partTimeJob} onChange={v => updateField('partTimeJob', v)}
          placeholder="例: 塾講師（2年間）" />
        <TextAreaField label="学んだこと" value={profile.partTimeLearning}
          onChange={v => updateField('partTimeLearning', v)}
          placeholder="例: わかりやすく説明する力、相手の理解度に合わせた対応力" rows={2} />
        <button
          onClick={() => setShowPartTimeDetail(v => !v)}
          className="text-[11px] font-medium mt-1 transition-colors"
          style={{ color: MC }}
        >
          詳しく {showPartTimeDetail ? '▴' : '▾'}
        </button>
        {showPartTimeDetail && (
          <div className="space-y-3 pt-1 border-t border-br mt-1">
            <InputField label="バイト期間" value={profile.partTimePeriod} onChange={v => updateField('partTimePeriod', v)}
              placeholder="例: 2年次〜4年次" />
            <TextAreaField label="バイト業務内容詳細" value={profile.partTimeDetail}
              onChange={v => updateField('partTimeDetail', v)}
              placeholder="例: 高校生の数学・理科の個別指導、年間30名担当" rows={2} />
          </div>
        )}
      </StepCard>
      <StepCard title="ボランティア・その他">
        <TextAreaField label="活動内容" value={profile.volunteer}
          onChange={v => updateField('volunteer', v)}
          placeholder="例: 国際医療ボランティア（カンボジア、2週間）" rows={2} />
        <button
          onClick={() => setShowVolunteerDetail(v => !v)}
          className="text-[11px] font-medium mt-1 transition-colors"
          style={{ color: MC }}
        >
          詳しく {showVolunteerDetail ? '▴' : '▾'}
        </button>
        {showVolunteerDetail && (
          <div className="space-y-3 pt-1 border-t border-br mt-1">
            <TextAreaField label="ボランティア詳細" value={profile.volunteerDetail}
              onChange={v => updateField('volunteerDetail', v)}
              placeholder="例: 現地での医療補助、診療サポート、健康教育の実施など" rows={2} />
          </div>
        )}
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
        <InputField label="ITスキル" value={profile.itSkills} onChange={v => updateField('itSkills', v)}
          placeholder="例: Python, Excel, 統計解析（R）" />
        <InputField label="趣味・特技" value={profile.hobbies} onChange={v => updateField('hobbies', v)}
          placeholder="例: 山岳部、囲碁（二段）、写真" />
        <TextAreaField label="スキルの医療応用" value={profile.medicalApplication}
          onChange={v => updateField('medicalApplication', v)}
          placeholder="例: Pythonで臨床データを可視化し、退院調整の効率化に役立てたい" rows={2} />
      </StepCard>
      <StepCard title="研究経験">
        <TextAreaField label="研究室・テーマ" value={profile.research} onChange={v => updateField('research', v)}
          placeholder="例: 循環器内科学教室で心不全に関する基礎研究" rows={2} />
        <InputField label="成果（論文・学会発表）" value={profile.researchResults}
          onChange={v => updateField('researchResults', v)} placeholder="例: 日本循環器学会でポスター発表" />
        <InputField label="研究室名" value={profile.labName} onChange={v => updateField('labName', v)}
          placeholder="例: 循環器内科学教室（○○教授）" />
        <InputField label="研究期間" value={profile.researchPeriod} onChange={v => updateField('researchPeriod', v)}
          placeholder="例: 2024年4月〜2025年3月" />
        <InputField label="研究テーマ" value={profile.researchTheme} onChange={v => updateField('researchTheme', v)}
          placeholder="例: 心不全患者における予後因子の解析" />
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
        <TextAreaField label="研修医として病院に貢献できること" value={profile.hospitalContribution}
          onChange={v => updateField('hospitalContribution', v)}
          placeholder="例: チームの潤滑油として連携を支え、患者への丁寧な説明で満足度向上に貢献できる" rows={2} />
        <TextAreaField label="5年後の医師像" value={profile.futureVision}
          onChange={v => updateField('futureVision', v)}
          placeholder="例: 総合診療専門医を取得し、地域医療の最前線で活躍しながら後輩指導にも携わりたい" rows={2} />
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
//  Step 7: 将来ビジョン
// ═══════════════════════════════════════
function Step7({ profile, updateField, toggleArrayField }: StepProps & { toggleArrayField: ToggleFn }) {
  return (
    <div className="space-y-4">
      <StepCard title="目指す医師像">
        <ChipSelect label="どんな医師になりたい？（複数可）" options={DOCTOR_TYPES}
          selected={profile.doctorType} onToggle={v => toggleArrayField('doctorType', v)} multi />
        <ChipSelect label="医療以外で関心のある領域（複数可）" options={OTHER_FIELDS}
          selected={profile.otherFields} onToggle={v => toggleArrayField('otherFields', v)} multi />
      </StepCard>
      <StepCard title="キャリア目標">
        <TextAreaField label="5年後の目標" value={profile.goal5y}
          onChange={v => updateField('goal5y', v)}
          placeholder="例: 消化器内科専門医を取得し、内視鏡技術を磨きながら地域病院で活躍したい" rows={2} />
        <TextAreaField label="10年後の目標" value={profile.goal10y}
          onChange={v => updateField('goal10y', v)}
          placeholder="例: 消化器病専門医も取得し、指導医として後進を育てながら地域医療に貢献したい" rows={2} />
      </StepCard>
    </div>
  )
}

// ═══════════════════════════════════════
//  Step 8: ライフスタイル
// ═══════════════════════════════════════
function Step8({ profile, updateField, toggleArrayField }: StepProps & { toggleArrayField: ToggleFn }) {
  return (
    <div className="space-y-4">
      <StepCard title="勤務スタイル">
        <ChipSelect label="希望する働き方（複数可）" options={WORK_STYLES}
          selected={profile.workStyle} onToggle={v => toggleArrayField('workStyle', v)} multi />
        <ChipSelect label="収入目標" options={INCOME_GOALS}
          selected={profile.incomeGoal ? [profile.incomeGoal] : []}
          onToggle={v => updateField('incomeGoal', v === profile.incomeGoal ? '' : v)} />
      </StepCard>
      <StepCard title="ワークライフバランス">
        <ChipSelect label="仕事と生活のバランス感" options={WL_BALANCE_OPTIONS}
          selected={profile.wlBalance ? [profile.wlBalance] : []}
          onToggle={v => updateField('wlBalance', v === profile.wlBalance ? '' : v)} />
        <ChipSelect label="私生活で大切にしたいこと（複数可）" options={PRIVATE_VALUES}
          selected={profile.privateValues} onToggle={v => toggleArrayField('privateValues', v)} multi />
      </StepCard>
    </div>
  )
}

// ═══════════════════════════════════════
//  Step 9: 理想の職場
// ═══════════════════════════════════════
function Step9({ profile, updateField, toggleArrayField }: StepProps & { toggleArrayField: ToggleFn }) {
  const [copied, setCopied] = useState(false)

  const generatePrompt = () => {
    const lines: string[] = ['以下は私（医学生）のプロフィールです。このデータをもとに、自己分析をさらに深めるための質問・ワークシートを生成してください。']
    lines.push('')
    lines.push('【目指す医師像】' + (profile.doctorType.length > 0 ? profile.doctorType.join('、') : '未回答'))
    lines.push('【5年後の目標】' + (profile.goal5y || '未回答'))
    lines.push('【10年後の目標】' + (profile.goal10y || '未回答'))
    lines.push('【関心領域（医療以外）】' + (profile.otherFields.length > 0 ? profile.otherFields.join('、') : '未回答'))
    lines.push('【希望勤務スタイル】' + (profile.workStyle.length > 0 ? profile.workStyle.join('、') : '未回答'))
    lines.push('【収入目標】' + (profile.incomeGoal || '未回答'))
    lines.push('【WLBの希望】' + (profile.wlBalance || '未回答'))
    lines.push('【私生活の価値観】' + (profile.privateValues.length > 0 ? profile.privateValues.join('、') : '未回答'))
    lines.push('【理想の職場雰囲気】' + (profile.workplaceAtmosphere.length > 0 ? profile.workplaceAtmosphere.join('、') : '未回答'))
    lines.push('【理想のメンター像】' + (profile.idealMentor.length > 0 ? profile.idealMentor.join('、') : '未回答'))
    lines.push('【職場での役割希望】' + (profile.workplaceRole.length > 0 ? profile.workplaceRole.join('、') : '未回答'))
    if (profile.strengthsList.length > 0) lines.push('【強み】' + profile.strengthsList.join('、'))
    if (profile.weakness) lines.push('【弱み・課題】' + profile.weakness)
    if (profile.motivation) lines.push('【志望動機】' + profile.motivation)
    lines.push('')
    lines.push('上記を踏まえ、以下を作成してください：')
    lines.push('1. このプロフィールから見える「価値観の核心」の言語化')
    lines.push('2. 志望科・研修病院選びに関する深堀り質問（5問）')
    lines.push('3. 面接で想定される「軸のブレ」の指摘と対策')
    lines.push('4. さらに自己理解を深めるためのワーク（具体的なアクション）')
    return lines.join('\n')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatePrompt())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <StepCard title="職場の雰囲気">
        <ChipSelect label="理想の職場雰囲気（複数可）" options={WORKPLACE_ATMOSPHERE}
          selected={profile.workplaceAtmosphere} onToggle={v => toggleArrayField('workplaceAtmosphere', v)} multi />
      </StepCard>
      <StepCard title="メンター・役割">
        <ChipSelect label="理想の指導医・メンター像（複数可）" options={IDEAL_MENTOR}
          selected={profile.idealMentor} onToggle={v => toggleArrayField('idealMentor', v)} multi />
        <ChipSelect label="職場での希望役割（複数可）" options={WORKPLACE_ROLES}
          selected={profile.workplaceRole} onToggle={v => toggleArrayField('workplaceRole', v)} multi />
      </StepCard>

      {/* AI自己分析深化プロンプト生成 */}
      <div className="bg-s0 border border-br rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E8F0EC' }}>
            <span className="text-base">🤖</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-tx">AIで自己分析を深める</p>
            <p className="text-[11px] text-muted mt-0.5">入力内容からChatGPT / Claude / Gemini用のプロンプトを生成。コピーしてAIに貼り付けるだけ。</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
          style={{ background: copied ? '#2E7D52' : MC, boxShadow: `0 4px 14px ${MC}33` }}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              コピーしました！
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              自己分析プロンプトをコピー
            </>
          )}
        </button>
        <p className="text-[10px] text-muted text-center">プロフィールの入力が多いほど、AIの回答が具体的になります</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
//  履歴書プレビュー
// ═══════════════════════════════════════
function ResumePreview({ profile, isPro }: {
  profile: WizardProfile; isPro: boolean
}) {
  const hasData = profile.name && profile.university

  const handlePrintPDF = () => {
    const w = window.open('', '_blank', 'width=900,height=1200')
    if (!w) return

    // 今日の日付（令和換算）
    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth() + 1
    const d = today.getDate()
    const reiwaYear = y - 2018 // 令和元年 = 2019年
    const dateStr = `令和${reiwaYear}年${m}月${d}日現在`

    // 学歴・職歴テーブル行
    const eduRows: string[] = []
    if (profile.university) {
      eduRows.push(`<tr><td class="year-col">${profile.graduationYear ? profile.graduationYear + '年　3月' : '　　年　　月'}</td><td>${profile.university}　卒業見込み</td></tr>`)
    }
    if (profile.retentionYear) {
      eduRows.push(`<tr><td class="year-col">${profile.retentionYear}年　　月</td><td>留年（1年）</td></tr>`)
    }
    while (eduRows.length < 6) {
      eduRows.push('<tr><td class="year-col">&nbsp;</td><td>&nbsp;</td></tr>')
    }

    // 資格・免許テーブル行
    const licenseRows: string[] = []
    if (profile.qualifications) {
      profile.qualifications.split(/[、,，\n]/).filter(Boolean).forEach(q => {
        licenseRows.push(`<tr><td class="year-col">　　年　　月</td><td>${q.trim()}</td></tr>`)
      })
    }
    if (profile.languageSkills.length > 0) {
      profile.languageSkills.forEach(l => {
        licenseRows.push(`<tr><td class="year-col">　　年　　月</td><td>${l}</td></tr>`)
      })
    }
    while (licenseRows.length < 4) {
      licenseRows.push('<tr><td class="year-col">&nbsp;</td><td>&nbsp;</td></tr>')
    }

    // 自己PR本文
    const prText = profile.strengthsList.length > 0
      ? profile.strengthsList.join('、') + (profile.strengthsEpisode ? '\n' + profile.strengthsEpisode : '')
      : (profile.strengths || '')

    // 趣味・特技
    const hobbyText = [profile.hobbies, profile.clubs ? `（部活）${profile.clubs}` : ''].filter(Boolean).join('　')

    // 本人希望欄
    const hopeLines: string[] = []
    if (profile.preferredSpecialty) hopeLines.push(`志望科：${profile.preferredSpecialty}`)
    if (profile.preferredRegions.length > 0) hopeLines.push(`希望研修地域：${profile.preferredRegions.join('・')}`)

    w.document.write(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>履歴書 — ${profile.name || ''}</title>
<style>
@page { size: A4; margin: 15mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: "Yu Mincho", "YuMincho", "Hiragino Mincho ProN", "HiraMinProN-W3", serif;
  color: #111;
  font-size: 10pt;
  line-height: 1.6;
  background: #fff;
}
.page { width: 100%; }
.page-break { page-break-after: always; }

/* タイトル */
.doc-title {
  text-align: center;
  font-size: 20pt;
  font-weight: bold;
  letter-spacing: 1em;
  margin-bottom: 4pt;
  padding-top: 4pt;
}
.doc-date { text-align: right; font-size: 9pt; margin-bottom: 8pt; }

/* テーブル共通 */
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
td, th { border: 1px solid #333; padding: 3pt 5pt; vertical-align: top; }

/* 氏名・写真ブロック */
.name-photo-row { display: flex; border: 1px solid #333; margin-bottom: -1px; }
.name-block { flex: 1; border-right: 1px solid #333; }
.furigana-cell { border-bottom: 1px solid #333; padding: 3pt 5pt; font-size: 8pt; min-height: 18pt; }
.name-cell { padding: 4pt 5pt; font-size: 16pt; font-weight: bold; min-height: 28pt; }
.photo-block {
  width: 90pt; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-size: 8pt; color: #666; text-align: center; padding: 4pt;
}
.photo-frame {
  width: 85pt; height: 113pt; border: 1px solid #aaa;
  display: flex; align-items: center; justify-content: center;
  font-size: 7.5pt; color: #888; background: #f8f8f8;
  text-align: center; line-height: 1.8;
}

/* ラベルセル */
.label { background: #f2f2f2; font-weight: bold; width: 60pt; font-size: 8.5pt; }

/* セクション見出し */
.section-header td {
  background: #e8e8e8; font-weight: bold; font-size: 9pt;
  text-align: center; padding: 2pt 5pt;
}

/* 年月列 */
.year-col { width: 70pt; text-align: center; white-space: nowrap; font-size: 9pt; }

/* 大テキストボックス */
.box-xl td { min-height: 110pt; height: 110pt; vertical-align: top; padding: 5pt; font-size: 9.5pt; white-space: pre-wrap; }
.box-lg td { min-height: 80pt;  height: 80pt;  vertical-align: top; padding: 5pt; font-size: 9.5pt; white-space: pre-wrap; }
.box-sm td { min-height: 45pt;  height: 45pt;  vertical-align: top; padding: 5pt; font-size: 9.5pt; white-space: pre-wrap; }
.box-hope td { min-height: 50pt; height: 50pt; vertical-align: top; padding: 5pt; font-size: 9.5pt; white-space: pre-wrap; }

/* フッター */
.doc-footer { margin-top: 6pt; font-size: 7pt; color: #aaa; text-align: right; }

@media print { .page-break { page-break-after: always; } }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page page-break">
  <div class="doc-title">履　歴　書</div>
  <div class="doc-date">${dateStr}</div>

  <!-- 氏名 + 写真 -->
  <div class="name-photo-row">
    <div class="name-block">
      <div class="furigana-cell">ふりがな　　</div>
      <div class="name-cell">${profile.name || '　'}</div>
    </div>
    <div class="photo-block">
      <div class="photo-frame">写真貼付<br>30mm×40mm</div>
    </div>
  </div>

  <!-- 基本情報 -->
  <table style="margin-top:-1px">
    <tr>
      <td class="label">生年月日</td>
      <td>　　　年　　月　　日生（満　　歳）</td>
      <td class="label" style="width:40pt">性別</td>
      <td style="width:50pt">&nbsp;</td>
    </tr>
    <tr>
      <td class="label">現住所<br>〒</td>
      <td colspan="3" style="min-height:32pt;height:32pt">&nbsp;</td>
    </tr>
    <tr>
      <td class="label">連絡先<br>〒</td>
      <td colspan="3" style="min-height:28pt;height:28pt;font-size:8pt;color:#888">（現住所と異なる場合のみ記入）</td>
    </tr>
  </table>

  <!-- 学歴・職歴 -->
  <table style="margin-top:-1px">
    <tr class="section-header"><td colspan="2">学　歴　・　職　歴</td></tr>
    <tr>
      <td class="year-col" style="background:#f2f2f2;font-weight:bold;font-size:8.5pt;text-align:center">年　　月</td>
      <td style="background:#f2f2f2;font-weight:bold;font-size:8.5pt">事　　項</td>
    </tr>
    <tr><td class="year-col" colspan="2" style="text-align:center;font-size:8.5pt">学　歴</td></tr>
    ${eduRows.join('\n    ')}
    <tr><td class="year-col" colspan="2" style="text-align:center;font-size:8.5pt">職　歴</td></tr>
    <tr><td class="year-col">&nbsp;</td><td>なし</td></tr>
    <tr><td class="year-col">&nbsp;</td><td style="text-align:right">以　上</td></tr>
  </table>

  <!-- 資格・免許 -->
  <table style="margin-top:-1px">
    <tr class="section-header"><td colspan="2">資　格　・　免　許</td></tr>
    ${licenseRows.join('\n    ')}
  </table>

  <div class="doc-footer">iwor.jp — プロフィールウィザードより自動生成</div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="doc-title" style="font-size:15pt;letter-spacing:0.3em;margin-bottom:6pt">履　歴　書（続き）</div>

  <!-- 志望動機 -->
  <table class="box-xl" style="margin-bottom:-1px">
    <tr class="section-header"><td>志　望　動　機</td></tr>
    <tr><td>${(profile.motivation || '').replace(/\n/g, '<br>')}</td></tr>
  </table>

  <!-- 自己PR -->
  <table class="box-lg" style="margin-bottom:-1px">
    <tr class="section-header"><td>自　己　Ｐ　Ｒ　・　強　み</td></tr>
    <tr><td>${prText.replace(/\n/g, '<br>')}</td></tr>
  </table>

  <!-- 趣味・特技 -->
  <table class="box-sm" style="margin-bottom:-1px">
    <tr class="section-header"><td>趣　味　・　特　技</td></tr>
    <tr><td>${hobbyText ? hobbyText.replace(/\n/g, '<br>') : '&nbsp;'}</td></tr>
  </table>

  <!-- 本人希望欄 -->
  <table class="box-hope">
    <tr class="section-header"><td>本　人　希　望　欄（志望科・希望地域など）</td></tr>
    <tr><td>${hopeLines.length > 0 ? hopeLines.join('<br>') : '&nbsp;'}</td></tr>
  </table>

  <div class="doc-footer">iwor.jp — プロフィールウィザードより自動生成</div>
</div>

<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`)
    w.document.close()
  }

  return (
    <div className="bg-s0 border border-br rounded-xl overflow-hidden">
      {/* ヘッダー（トグルなし） */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-br">
        <span className="text-sm font-bold text-tx flex items-center gap-2">
          <svg className="w-4 h-4" style={{ stroke: MC }} fill="none" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          履歴書プレビュー
          {!isPro && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: MCL, color: MC }}>PRO</span>}
        </span>
      </div>
      {!hasData ? (
        <div className="p-6 text-center"><p className="text-xs text-muted">STEP 1で氏名と大学を入力すると表示されます</p></div>
      ) : (
        <div className="p-4 relative">
          {/* PDF出力ボタン (PRO only) */}
          {isPro && (
            <div className="flex justify-end mb-3">
              <button onClick={handlePrintPDF}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                style={{ background: MC }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                PDF出力
              </button>
            </div>
          )}
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
    case 7: return !!(p.doctorType.length > 0 || p.goal5y)
    case 8: return !!(p.workStyle.length > 0 || p.incomeGoal || p.wlBalance)
    case 9: return !!(p.workplaceAtmosphere.length > 0 || p.idealMentor.length > 0 || p.workplaceRole.length > 0)
    default: return false
  }
}
