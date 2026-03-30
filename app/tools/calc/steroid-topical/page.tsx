'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'

// 日本皮膚科学会 5段階分類
const CLASSES = [
  { rank: 'I群（Strongest：最強）', drugs: [
    'クロベタゾールプロピオン酸エステル（デルモベート）',
    'ジフロラゾン酢酸エステル（ダイアコート/ジフラール）',
  ]},
  { rank: 'II群（Very Strong：非常に強い）', drugs: [
    'ベタメタゾン酪酸エステルプロピオン酸エステル（アンテベート）',
    'ベタメタゾンジプロピオン酸エステル（リンデロンDP）',
    'モメタゾンフランカルボン酸エステル（フルメタ）',
    'ジフルプレドナート（マイザー）',
    'フルオシノニド（トプシム）',
    'アムシノニド（ビスダーム）',
    'ジフルコルトロン吉草酸エステル（ネリゾナ/テクスメテン）',
    '酪酸プロピオン酸ヒドロコルチゾン（パンデル）',
  ]},
  { rank: 'III群（Strong：強い）', drugs: [
    'デキサメタゾン吉草酸エステル（ボアラ）',
    'ベタメタゾン吉草酸エステル（リンデロンV/ベトネベート）',
    'デキサメタゾンプロピオン酸エステル（メサデルム）',
    'デプロドンプロピオン酸エステル（エクラー）',
    'フルオシノロンアセトニド（フルコート）',
  ]},
  { rank: 'IV群（Medium：中程度）', drugs: [
    'プレドニゾロン吉草酸エステル酢酸エステル（リドメックス）',
    'アルクロメタゾンプロピオン酸エステル（アルメタ）',
    'クロベタゾン酪酸エステル（キンダベート）',
    'ヒドロコルチゾン酪酸エステル（ロコイド）',
    'トリアムシノロンアセトニド（レダコート）',
  ]},
  { rank: 'V群（Weak：弱い）', drugs: [
    'プレドニゾロン',
    'ヒドロコルチゾン',
  ]},
]

export default function SteroidTopicalPage() {
  const [openRank, setOpenRank] = useState<number | null>(null)
  return (
    <CalculatorLayout slug="steroid-topical" title="ステロイド外用薬力価一覧" titleEn="Topical Corticosteroid Potency"
      description="日本皮膚科学会の5段階分類（strongest〜weak）による外用ステロイドの力価ランク一覧。"
      category="general" categoryIcon="💊" result={null}
      references={[{text:'日本皮膚科学会 アトピー性皮膚炎診療ガイドライン 2021'}]}>
      <div className="space-y-2">
        {CLASSES.map((c, i) => (
          <div key={i} className="bg-s0 border border-br rounded-xl overflow-hidden">
            <button onClick={() => setOpenRank(openRank === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-s1 transition-colors">
              <span className="text-sm font-bold text-tx">{c.rank}</span>
              <span className="text-xs text-muted">{c.drugs.length}種 {openRank === i ? '▲' : '▼'}</span>
            </button>
            {openRank === i && (
              <div className="px-4 pb-3 space-y-1 border-t border-br pt-2">
                {c.drugs.map(d => <p key={d} className="text-xs text-tx leading-relaxed">- {d}</p>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </CalculatorLayout>
  )
}
