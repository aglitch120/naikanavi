'use client'
import UpdatedAt from '@/components/tools/UpdatedAt'
import { useState } from 'react'
import Link from 'next/link'
import ErrorReportButton from '@/components/tools/ErrorReportButton'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'

interface Procedure {
  id: string
  name: string
  icon: string
  category: string
  youtubeQuery: string
}

const PROCEDURES: Procedure[] = [
  { id: 'venipuncture', name: '採血（静脈採血）', icon: '💉', category: '基本手技', youtubeQuery: '採血 手技 手順 看護' },
  { id: 'abg', name: '動脈採血（ABG）', icon: '🔴', category: '基本手技', youtubeQuery: '動脈採血 手技 ABG' },
  { id: 'injection', name: '注射（皮下・筋注・静注）', icon: '💊', category: '基本手技', youtubeQuery: '筋肉注射 手技 三角筋' },
  { id: 'intubation', name: '気道確保・気管内挿管', icon: '🫁', category: '救急・ICU', youtubeQuery: '気管挿管 手技 RSI 喉頭鏡' },
  { id: 'cvc', name: '中心静脈カテーテル（CVC）', icon: '🔵', category: '救急・ICU', youtubeQuery: '中心静脈カテーテル 内頸静脈 エコーガイド' },
  { id: 'arterial-line', name: '動脈ライン（Aライン）', icon: '📈', category: '救急・ICU', youtubeQuery: '動脈ライン Aライン 橈骨動脈 留置' },
  { id: 'bone-marrow', name: '骨髄穿刺', icon: '🦴', category: '検査手技', youtubeQuery: '骨髄穿刺 手技 後腸骨稜' },
  { id: 'lumbar-puncture', name: '腰椎穿刺', icon: '💧', category: '検査手技', youtubeQuery: '腰椎穿刺 手技 ルンバール' },
  { id: 'ng-tube', name: '胃管挿入（NGチューブ）', icon: '🟡', category: '消化器手技', youtubeQuery: '胃管挿入 NGチューブ 手技' },
  { id: 'gastric-lavage', name: '胃洗浄', icon: '🟢', category: '消化器手技', youtubeQuery: '胃洗浄 手技 中毒' },
  { id: 'urinary-catheter', name: '尿道カテーテル', icon: '🚿', category: '基本手技', youtubeQuery: '尿道カテーテル 留置 手技' },
  { id: 'enema', name: '浣腸', icon: '💧', category: '消化器手技', youtubeQuery: '浣腸 手技 看護' },
  { id: 'chest-drain', name: '胸腔ドレーン', icon: '🫁', category: '救急・ICU', youtubeQuery: '胸腔ドレーン 挿入 手技' },
  { id: 'abdominal-drain', name: '腹腔穿刺', icon: '🩺', category: '消化器手技', youtubeQuery: '腹腔穿刺 腹水 手技 エコーガイド' },
  { id: 'pericardiocentesis', name: '心嚢穿刺', icon: '❤️', category: '救急・ICU', youtubeQuery: '心嚢穿刺 心タンポナーデ ドレナージ' },
]

const CATEGORIES = ['基本手技', '救急・ICU', '検査手技', '消化器手技']

export default function ProceduresPage() {
  const [filterCat, setFilterCat] = useState<string>('')

  const filtered = filterCat ? PROCEDURES.filter(p => p.category === filterCat) : PROCEDURES

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link>
        <span className="mx-2">›</span>
        <span>手技動画リンク集</span>
      </nav>

      <header className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-tx mb-1">手技動画リンク集</h1>
            <p className="text-sm text-muted">15手技のYouTube動画リンク。タップで検索結果を開きます。</p>
          </div>
          <ProPulseHint><FavoriteButton slug="app-procedures" title="手技動画リンク集" href="/tools/procedures" type="app" /></ProPulseHint>
        </div>
        <UpdatedAt />
      </header>

      {/* カテゴリフィルタ */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${!filterCat ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'}`}>
          すべて ({PROCEDURES.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = PROCEDURES.filter(p => p.category === cat).length
          return (
            <button key={cat} onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${filterCat === cat ? 'bg-ac text-white border-ac' : 'border-br text-muted hover:border-ac/30'}`}>
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* 手技リスト */}
      <div className="space-y-2">
        {filtered.map(proc => (
          <a key={proc.id}
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(proc.youtubeQuery)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3.5 bg-s0 border border-br rounded-xl hover:border-ac/30 hover:bg-acl/30 transition-all group">
            <span className="text-lg flex-shrink-0">{proc.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-tx group-hover:text-ac transition-colors">{proc.name}</p>
              <p className="text-[10px] text-muted">{proc.category}</p>
            </div>
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        ))}
      </div>

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-3 mt-8 text-sm text-wn">
        ⚠️ 外部動画へのリンク集です。動画の内容についてiworは責任を負いません。実際の手技は必ず指導医の監督下で行ってください。
        <div className="mt-2 pt-2 border-t border-wnb/30"><ErrorReportButton toolName="手技動画リンク集" /></div>
      </div>
    </main>
  )
}
