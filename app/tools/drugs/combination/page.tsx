'use client'

import { useState } from 'react'
import Link from 'next/link'
import UpdatedAt from '@/components/tools/UpdatedAt'
import ErrorReportButton from '@/components/tools/ErrorReportButton'
import FavoriteButton from '@/components/tools/FavoriteButton'

/* ── カテゴリ定義 ── */
type CategoryId = 'hypertension' | 'lipid' | 'diabetes'

interface Drug {
  brand: string         // 商品名
  generic: string       // 一般名（成分）
  composition: string   // 配合内容
  note?: string
}

interface SubCategory {
  title: string
  drugs: Drug[]
}

interface Category {
  id: CategoryId
  title: string
  icon: string
  subcategories: SubCategory[]
}

const CATEGORIES: Category[] = [
  {
    id: 'hypertension',
    title: '高血圧',
    icon: '❤️',
    subcategories: [
      {
        title: 'ARB + CCB',
        drugs: [
          { brand: 'エックスフォージ配合錠', generic: 'バルサルタン/アムロジピン', composition: 'バルサルタン 80mg + アムロジピン 5mg', note: '最も処方頻度の高い配合錠の一つ' },
          { brand: 'ユニシア配合錠 LD/HD', generic: 'カンデサルタン/アムロジピン', composition: 'LD: カンデサルタン 8mg + アムロジピン 2.5mg / HD: 8mg + 5mg' },
          { brand: 'ザクラス配合錠 LD/HD', generic: 'アジルサルタン/アムロジピン', composition: 'LD: アジルサルタン 20mg + アムロジピン 2.5mg / HD: 20mg + 5mg' },
          { brand: 'アテディオ配合錠', generic: 'バルサルタン/シルニジピン', composition: 'バルサルタン 80mg + シルニジピン 10mg', note: 'N型Caチャネルも阻害 → 腎保護' },
          { brand: 'アイミクス配合錠 LD/HD', generic: 'イルベサルタン/アムロジピン', composition: 'LD: イルベサルタン 100mg + アムロジピン 5mg / HD: 100mg + 10mg' },
          { brand: 'レザルタス配合錠 LD/HD', generic: 'オルメサルタン/アゼルニジピン', composition: 'LD: オルメサルタン 10mg + アゼルニジピン 8mg / HD: 20mg + 16mg' },
          { brand: 'ミカムロ配合錠 AP/BP', generic: 'テルミサルタン/アムロジピン', composition: 'AP: テルミサルタン 40mg + アムロジピン 5mg / BP: 80mg + 5mg' },
        ],
      },
      {
        title: 'ARB + 利尿薬',
        drugs: [
          { brand: 'コディオ配合錠 MD/EX', generic: 'バルサルタン/ヒドロクロロチアジド', composition: 'MD: バルサルタン 80mg + HCTZ 6.25mg / EX: 80mg + 12.5mg' },
          { brand: 'プレミネント配合錠 LD/HD', generic: 'ロサルタン/ヒドロクロロチアジド', composition: 'LD: ロサルタン 50mg + HCTZ 12.5mg / HD: 100mg + 12.5mg', note: 'ロサルタンは尿酸低下作用あり' },
          { brand: 'エカード配合錠 LD/HD', generic: 'カンデサルタン/ヒドロクロロチアジド', composition: 'LD: カンデサルタン 4mg + HCTZ 6.25mg / HD: 8mg + 6.25mg' },
          { brand: 'ミコンビ配合錠 AP/BP', generic: 'テルミサルタン/ヒドロクロロチアジド', composition: 'AP: テルミサルタン 40mg + HCTZ 12.5mg / BP: 80mg + 12.5mg' },
          { brand: 'イルトラ配合錠 LD/HD', generic: 'イルベサルタン/トリクロルメチアジド', composition: 'LD: イルベサルタン 100mg + トリクロル 1mg / HD: 200mg + 1mg' },
        ],
      },
      {
        title: 'ARB + CCB + 利尿薬（3剤配合）',
        drugs: [
          { brand: 'ミカトリオ配合錠', generic: 'テルミサルタン/アムロジピン/ヒドロクロロチアジド', composition: 'テルミサルタン 80mg + アムロジピン 5mg + HCTZ 12.5mg', note: '国内初の3剤配合降圧薬' },
        ],
      },
      {
        title: 'CCB + スタチン',
        drugs: [
          { brand: 'カデュエット配合錠 1〜4番', generic: 'アムロジピン/アトルバスタチン', composition: '1番: 2.5mg+5mg / 2番: 2.5mg+10mg / 3番: 5mg+5mg / 4番: 5mg+10mg', note: '高血圧+脂質異常症の合併に' },
        ],
      },
    ],
  },
  {
    id: 'lipid',
    title: '脂質異常症',
    icon: '🩸',
    subcategories: [
      {
        title: 'スタチン + エゼチミブ',
        drugs: [
          { brand: 'アトーゼット配合錠 LD/HD', generic: 'エゼチミブ/アトルバスタチン', composition: 'LD: エゼチミブ 10mg + アトルバスタチン 10mg / HD: 10mg + 20mg' },
          { brand: 'リバゼブ配合錠 LD/HD', generic: 'エゼチミブ/ピタバスタチン', composition: 'LD: エゼチミブ 10mg + ピタバスタチン 2mg / HD: 10mg + 4mg' },
          { brand: 'ロスーゼット配合錠 LD/HD', generic: 'エゼチミブ/ロスバスタチン', composition: 'LD: エゼチミブ 10mg + ロスバスタチン 2.5mg / HD: 10mg + 5mg', note: '最も処方頻度の高い脂質配合錠' },
        ],
      },
      {
        title: 'スタチン + フィブラート',
        drugs: [
          { brand: '該当なし（2026年3月時点）', generic: '—', composition: '国内未承認。海外ではロスバスタチン+フェノフィブラートの配合錠あり', note: '横紋筋融解症リスクから配合は慎重' },
        ],
      },
    ],
  },
  {
    id: 'diabetes',
    title: '糖尿病',
    icon: '💉',
    subcategories: [
      {
        title: 'DPP-4阻害薬 + メトホルミン',
        drugs: [
          { brand: 'エクメット配合錠 LD/HD', generic: 'ビルダグリプチン/メトホルミン', composition: 'LD: ビルダグリプチン 50mg + メトホルミン 250mg / HD: 50mg + 500mg', note: '1日2回投与' },
          { brand: 'イニシンク配合錠', generic: 'アログリプチン/メトホルミン', composition: 'アログリプチン 25mg + メトホルミン 500mg', note: '1日1回投与' },
          { brand: 'メタクト配合錠 LD/HD', generic: 'ピオグリタゾン/メトホルミン', composition: 'LD: ピオグリタゾン 15mg + メトホルミン 500mg / HD: 30mg + 500mg', note: 'チアゾリジン+ビグアナイド' },
        ],
      },
      {
        title: 'DPP-4阻害薬 + SGLT2阻害薬',
        drugs: [
          { brand: 'カナリア配合錠', generic: 'テネリグリプチン/カナグリフロジン', composition: 'テネリグリプチン 20mg + カナグリフロジン 100mg', note: '1日1回。心腎保護の相乗効果' },
          { brand: 'スージャヌ配合錠', generic: 'シタグリプチン/イプラグリフロジン', composition: 'シタグリプチン 50mg + イプラグリフロジン 50mg' },
          { brand: 'トラディアンス配合錠 AP/BP', generic: 'リナグリプチン/エンパグリフロジン', composition: 'AP: リナグリプチン 5mg + エンパグリフロジン 10mg / BP: 5mg + 25mg', note: 'エンパグリフロジンはEMPA-REG OUTCOME試験で心血管アウトカム改善' },
        ],
      },
      {
        title: 'DPP-4阻害薬 + メトホルミン（追加）',
        drugs: [
          { brand: 'メトアナ配合錠 LD/HD', generic: 'アナグリプチン/メトホルミン', composition: 'LD: アナグリプチン 100mg + メトホルミン 250mg / HD: 100mg + 500mg', note: '1日2回投与' },
        ],
      },
      {
        title: 'SU薬 + チアゾリジン',
        drugs: [
          { brand: 'ソニアス配合錠 LD/HD', generic: 'ピオグリタゾン/グリメピリド', composition: 'LD: ピオグリタゾン 15mg + グリメピリド 1mg / HD: 30mg + 3mg', note: '低血糖・体重増加に注意' },
        ],
      },
      {
        title: 'DPP-4阻害薬 + チアゾリジン',
        drugs: [
          { brand: 'リオベル配合錠 LD/HD', generic: 'アログリプチン/ピオグリタゾン', composition: 'LD: アログリプチン 25mg + ピオグリタゾン 15mg / HD: 25mg + 30mg' },
        ],
      },
    ],
  },
]

/* ── 検索フィルタ ── */
function matchesDrug(drug: Drug, query: string): boolean {
  const q = query.toLowerCase()
  return (
    drug.brand.toLowerCase().includes(q) ||
    drug.generic.toLowerCase().includes(q) ||
    drug.composition.toLowerCase().includes(q)
  )
}

export default function CombinationDrugsPage() {
  const [activeTab, setActiveTab] = useState<CategoryId>('hypertension')
  const [search, setSearch] = useState('')

  const category = CATEGORIES.find(c => c.id === activeTab)!

  // Filter subcategories by search
  const filteredSubs = search.trim()
    ? category.subcategories
        .map(sub => ({
          ...sub,
          drugs: sub.drugs.filter(d => matchesDrug(d, search.trim())),
        }))
        .filter(sub => sub.drugs.length > 0)
    : category.subcategories

  // Total count
  const totalDrugs = CATEGORIES.reduce(
    (sum, cat) => sum + cat.subcategories.reduce((s, sub) => s + sub.drugs.length, 0),
    0
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/drugs" className="hover:text-ac">薬剤ガイド</Link><span className="mx-2">›</span>
        <span>配合錠リスト</span>
      </nav>

      <header className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-tx">配合錠リスト</h1>
          <FavoriteButton slug="tool-combination-tablets" title="配合錠リスト" href="/tools/drugs/combination" type="tool" size="sm" />
        </div>
        <p className="text-xs text-muted">{totalDrugs}品目 — 高血圧・脂質異常症・糖尿病</p>
      </header>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveTab(cat.id); setSearch('') }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === cat.id
                ? 'bg-ac text-white'
                : 'bg-s0 border border-br text-muted hover:border-ac/20'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.title}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 商品名・成分名で検索"
          className="w-full bg-s0 border border-br rounded-lg px-3 py-2 text-xs text-tx outline-none focus:border-ac/40 placeholder:text-muted/50"
        />
      </div>

      {/* Drug list — compact table */}
      {filteredSubs.length === 0 ? (
        <div className="bg-s0 border border-br rounded-xl p-8 text-center text-sm text-muted">
          「{search}」に一致する配合錠が見つかりません
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubs.map(sub => (
            <section key={sub.title} className="bg-s0 border border-br rounded-xl overflow-hidden">
              <h2 className="text-[11px] font-bold text-white px-3 py-1.5" style={{ background: 'var(--ac)' }}>
                {sub.title}
              </h2>
              <div className="divide-y divide-br">
                {sub.drugs.map(drug => (
                  <div key={drug.brand} className="px-3 py-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-tx">{drug.brand}</span>
                      <span className="text-[10px] text-ac">{drug.generic}</span>
                    </div>
                    <p className="text-[10px] text-muted mt-0.5">{drug.composition}</p>
                    {drug.note && <p className="text-[9px] text-muted/70 mt-0.5">💡 {drug.note}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Reference */}
      <div className="mt-8 bg-s1 rounded-xl p-4 text-[11px] text-muted leading-relaxed space-y-1">
        <p><strong className="text-tx">出典:</strong> 各薬剤添付文書（PMDA）、治療薬マニュアル 2025</p>
        <p>LD = Low Dose、HD = High Dose、AP/BP = 用量規格の違い</p>
        <p>配合錠の成分・含量は変更される場合があります。最新の添付文書を必ずご確認ください。</p>
      </div>

      {/* 免責 + Error report */}
      <div className="bg-wnl border border-wnb rounded-lg p-3 mt-4 mb-4 text-sm text-wn">
        ⚠️ 薬剤の選択・用量は施設のプロトコル・患者の状態に基づき担当医が決定してください。
      </div>
      <ErrorReportButton toolName="配合錠リスト" />
    </main>
  )
}
