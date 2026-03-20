'use client'
import InteractiveTutorial, { TutorialStep } from '@/components/InteractiveTutorial'

const TUTORIALS: Record<string, TutorialStep[]> = {
  tools: [
    { emoji: '🧮', title: '臨床計算ツール', desc: '計算ツールを診療科別に検索。eGFR・CHADS₂・SOFAなど。' },
    { emoji: '💊', title: '薬剤ガイド', desc: '抗菌薬スペクトラム・ステロイド力価換算・オピオイド換算など。' },
    { emoji: '⭐', title: 'お気に入り登録', desc: 'よく使うツールは★ボタンでお気に入り登録。次回からすぐアクセスできます。' },
  ],
  procedures: [
    { emoji: '🎬', title: '手技動画リンク集', desc: '15手技のYouTube動画リンク。タップで動画検索結果が開きます。' },
  ],
  presenter: [
    { emoji: '🎤', title: 'プレゼン資料生成', desc: '発表タイプ・対象者・時間・形式を選ぶだけでテンプレートが生成されます。' },
    { emoji: '📋', title: 'コピーして使う', desc: '生成されたテンプレートは「全文コピー」ボタンでクリップボードにコピー。PowerPointなどに貼り付けて使えます。' },
  ],
  medicalEnglish: [
    { emoji: '🃏', title: 'フラッシュカード', desc: 'カードをタップすると日本語/英語が切り替わります。「覚えた」で進捗に反映。' },
    { emoji: '📝', title: '4択クイズ', desc: '英語を見て日本語の意味を4つの選択肢から回答。正答率がリアルタイムで表示されます。' },
    { emoji: '📂', title: 'カテゴリ別学習', desc: '問診・身体診察・検査・手技・プレゼン・略語の6カテゴリから選んで集中学習できます。' },
  ],
}

export function ToolsTutorial() {
  return <InteractiveTutorial storageKey="iwor_tools_tutorial" steps={TUTORIALS.tools} />
}
export function ProceduresTutorial() {
  return <InteractiveTutorial storageKey="iwor_procedures_tutorial" steps={TUTORIALS.procedures} />
}
export function PresenterTutorial() {
  return <InteractiveTutorial storageKey="iwor_presenter_tutorial" steps={TUTORIALS.presenter} />
}
export function MedicalEnglishTutorial() {
  return <InteractiveTutorial storageKey="iwor_medenglish_tutorial" steps={TUTORIALS.medicalEnglish} />
}
