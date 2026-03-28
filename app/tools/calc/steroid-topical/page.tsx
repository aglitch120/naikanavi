'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'

const CLASSES = [
  { rank: 'I（最強）', drugs: ['クロベタゾールプロピオン酸エステル（デルモベート）', 'ジフロラゾン酢酸エステル（ジフラール/ダイアコート）'] },
  { rank: 'II（非常に強い）', drugs: ['モメタゾンフランカルボン酸エステル（フルメタ）', 'ベタメタゾン酪酸エステルプロピオン酸エステル（アンテベート）', 'フルオシノニド（トプシム）', 'ベタメタゾンジプロピオン酸エステル（リンデロンDP）', 'ジフルプレドナート（マイザー）', 'アムシノニド（ビスダーム）'] },
  { rank: 'III（強い）', drugs: ['デキサメタゾンプロピオン酸エステル（メサデルム）', 'デプロドンプロピオン酸エステル（エクラー）', 'ベタメタゾン吉草酸エステル（リンデロンV/ベトネベート）', 'フルオシノロンアセトニド（フルコート）'] },
  { rank: 'IV（中程度）', drugs: ['トリアムシノロンアセトニド（レダコート）', 'アルクロメタゾンプロピオン酸エステル（アルメタ）', 'ベクロメタゾンプロピオン酸エステル（プロパデルム）', 'ヒドロコルチゾン酪酸エステル（ロコイド）'] },
  { rank: 'V（弱い）', drugs: ['クロベタゾン酪酸エステル（キンダベート）', 'プレドニゾロン（プレドニゾロン軟膏）', 'ヒドロコルチゾン酢酸エステル（コルテス）'] },
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
