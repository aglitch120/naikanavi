'use client'

import Link from 'next/link'
import { useState } from 'react'
import UpdatedAt from '@/components/tools/UpdatedAt'
import FavoriteButton from '@/components/tools/FavoriteButton'

// ── 型定義 ──
interface Fluid {
  name: string         // 商品名
  generic?: string     // 一般名
  brand?: string       // メーカー・別名
  volume: string       // 容量 (mL)
  na: number | string
  k: number | string
  ca: number | string
  mg: number | string
  cl: number | string
  lactate: number | string
  acetate: number | string
  phosphate: number | string
  glucose: number | string // 糖質 (%)
  note?: string
}

interface FluidGroup {
  id: string
  title: string
  description: string
  color: string       // tailwind bg class
  fluids: Fluid[]
  footnotes?: string[]
}

// ── データ ──
const fluidGroups: FluidGroup[] = [
  {
    id: 'extracellular',
    title: '細胞外液補充液',
    description: '血漿に近い電解質組成。出血・脱水・ショックの初期輸液に使用。',
    color: 'bg-blue-50',
    fluids: [
      { name: '大塚生食注', generic: '生理食塩液', brand: '大塚製薬', volume: '20-500', na: 154, k: '-', ca: '-', mg: '-', cl: 154, lactate: '-', acetate: '-', phosphate: '-', glucose: '-' },
      { name: 'オーツカリンゲル注', generic: 'リンゲル液', brand: '大塚製薬', volume: '500', na: 147, k: 4, ca: 4.5, mg: '-', cl: 155.5, lactate: '-', acetate: '-', phosphate: '-', glucose: '-' },
      { name: 'ソルラクト輸液', generic: '乳酸リンゲル液', brand: 'テルモ', volume: '250/500/1000', na: 131, k: 4, ca: 3, mg: '-', cl: 110, lactate: 28, acetate: '-', phosphate: '-', glucose: '-' },
      { name: 'ラクテックD輸液', generic: '乳酸リンゲル液(ブドウ糖)', brand: '大塚製薬', volume: '500', na: 130, k: 4, ca: 3, mg: '-', cl: 109, lactate: 28, acetate: '-', phosphate: '-', glucose: 5 },
      { name: 'ソルラクトS輸液', generic: '乳酸リンゲル液(ブドウ糖)', brand: 'テルモ', volume: '250/500', na: 131, k: 4, ca: 3, mg: '-', cl: 110, lactate: 28, acetate: '-', phosphate: '-', glucose: 5 },
      { name: 'ソルアセトF輸液', generic: '酢酸リンゲル液', brand: 'テルモ', volume: '500/1000', na: 131, k: 4, ca: 3, mg: '-', cl: 109, lactate: '-', acetate: 28, phosphate: '-', glucose: '-' },
      { name: 'フィジオ140輸液', generic: '酢酸リンゲル液', brand: '大塚製薬', volume: '250/500', na: 140, k: 4, ca: 3, mg: 2, cl: 115, lactate: '-', acetate: '25※1', phosphate: '-', glucose: 1 },
      { name: 'ヴィーンD輸液', generic: '酢酸リンゲル液(ブドウ糖)', brand: '興和', volume: '200/500', na: 130, k: 4, ca: 3, mg: '-', cl: 109, lactate: '-', acetate: 28, phosphate: '-', glucose: 5 },
      { name: 'ビカネイト輸液', generic: '重炭酸リンゲル液', brand: '大塚製薬', volume: '500/1000', na: 130, k: 4, ca: 3, mg: 2, cl: 109, lactate: '-', acetate: '-※2', phosphate: '-', glucose: '-' },
    ],
    footnotes: [
      '※1 グルコン酸 3mEq/L、クエン酸 6mEq/L、添加物に塩酸を含有',
      '※2 重炭酸 28mEq/L、クエン酸 4mEq/L',
    ],
  },
  {
    id: 'no1',
    title: '1号液（開始液）',
    description: 'K非含有。腎機能不明の初期輸液。細胞外液と維持液の中間組成。',
    color: 'bg-green-50',
    fluids: [
      { name: 'ソリタ-T1号輸液', generic: '開始液', brand: 'AY/陽進堂', volume: '200/500', na: 90, k: '-', ca: '-', mg: '-', cl: 70, lactate: 20, acetate: '-', phosphate: '-', glucose: 2.6 },
      { name: 'ソルデム1輸液', generic: '開始液', brand: 'テルモ', volume: '200/500', na: 90, k: '-', ca: '-', mg: '-', cl: 70, lactate: 20, acetate: '-', phosphate: '-', glucose: 2.6 },
      { name: 'リプラス1号輸液', generic: '開始液', brand: '扶桑薬品', volume: '200/500', na: 90.8, k: '-', ca: '-', mg: '-', cl: 70.8, lactate: 20, acetate: '-', phosphate: '-', glucose: 2.6 },
      { name: 'KN1号輸液', generic: '開始液', brand: '大塚製薬', volume: '200/500', na: 77, k: '-', ca: '-', mg: '-', cl: 77, lactate: '-', acetate: '-', phosphate: '-', glucose: 2.5 },
    ],
  },
  {
    id: 'no2',
    title: '2号液（脱水補給液）',
    description: 'K含有。脱水補正に使用。腎機能を確認してから投与。',
    color: 'bg-yellow-50',
    fluids: [
      { name: 'ソリタ-T2号輸液', generic: '脱水補給液', brand: 'AY/陽進堂', volume: '200/500', na: 84, k: 20, ca: '-', mg: '-', cl: 66, lactate: '20※1', acetate: '-', phosphate: '※2', glucose: 3.2 },
      { name: 'ソルデム2輸液', generic: '脱水補給液', brand: 'テルモ', volume: '200/500', na: 77.5, k: 30, ca: '-', mg: '-', cl: 59, lactate: 48.5, acetate: '-', phosphate: '-', glucose: 1.45 },
      { name: 'KN2号輸液', generic: '脱水補給液', brand: '大塚製薬', volume: '500', na: 60, k: 25, ca: '-', mg: 2, cl: 49, lactate: 25, acetate: '-※3', phosphate: '-', glucose: 2.35 },
    ],
    footnotes: [
      '※1 添加物にL-乳酸 8mEq/Lを含むので乳酸濃度は28mEq/L',
      '※2 P 10mmol/L',
      '※3 P 6.5mmol/L',
    ],
  },
  {
    id: 'no3',
    title: '3号液（維持液）',
    description: '1日の水分・電解質維持に使用。Na少量+K含有+糖質。最も汎用される維持輸液。',
    color: 'bg-orange-50',
    fluids: [
      { name: 'ソリタ-T3号輸液', generic: '維持液', brand: 'AY/陽進堂', volume: '200/500', na: 35, k: 20, ca: '-', mg: '-', cl: 35, lactate: 20, acetate: '-', phosphate: '-', glucose: 4.3, note: '後発: ヒシナルク3号' },
      { name: 'KN3号輸液', generic: '維持液', brand: '大塚製薬', volume: '200/500', na: 50, k: 20, ca: '-', mg: '-', cl: 50, lactate: 20, acetate: '-', phosphate: '-', glucose: 2.7 },
      { name: 'EL-3号輸液', generic: '維持液', brand: 'AY', volume: '500', na: 40, k: 35, ca: '-', mg: '-', cl: 40, lactate: 20, acetate: '-※1', phosphate: '-', glucose: 5 },
      { name: 'ヴィーン3G輸液', generic: '維持液(酢酸)', brand: '興和', volume: '200/500', na: 45, k: 17, ca: '-', mg: 5, cl: 37, lactate: '-', acetate: 20, phosphate: 10, glucose: 5 },
      { name: 'リプラス3号輸液', generic: '維持液', brand: '扶桑薬品', volume: '200/500', na: 40, k: 20, ca: '-', mg: '-', cl: 40, lactate: 20, acetate: '-', phosphate: '-', glucose: 5 },
      { name: 'フィジオゾール3号輸液', generic: '維持液', brand: '大塚製薬', volume: '500', na: 35, k: 20, ca: '-', mg: 3, cl: 38, lactate: '20※2', acetate: '-', phosphate: '-', glucose: 10 },
      { name: 'ソリタ-T3号G輸液', generic: '維持液(高糖)', brand: 'AY/陽進堂', volume: '200/500', na: 35, k: 20, ca: '-', mg: '-', cl: 35, lactate: 20, acetate: '-', phosphate: '-', glucose: 7.5 },
      { name: 'KNMG3号輸液', generic: '維持液(高糖)', brand: '大塚製薬', volume: '500', na: 50, k: 20, ca: '-', mg: '-', cl: 50, lactate: 20, acetate: '-', phosphate: '-', glucose: 10 },
      { name: 'フィジオ35輸液', generic: '維持液(酢酸)', brand: '大塚製薬', volume: '250/500', na: 35, k: 20, ca: 5, mg: 3, cl: 28, lactate: '-', acetate: '20※3', phosphate: '-', glucose: 10, note: 'GE: グルアセト35' },
      { name: 'トリフリード輸液', generic: '維持液(微量元素)', brand: '大塚製薬', volume: '500/1000', na: 35, k: 20, ca: 5, mg: 5, cl: 35, lactate: '-', acetate: '6※4', phosphate: '-', glucose: 10.5 },
    ],
    footnotes: [
      '※1 P 8mmol/L',
      '※2 添加物としてL-乳酸を含有',
      '※3 グルコン酸 5mEq/L、P 10mmol/L、添加物にクエン酸水和物含有',
      '※4 クエン酸 14mEq/L、P 10mmol/L、Zn 5μmol/L',
    ],
  },
]

// ── コンポーネント ──
function FluidTable({ group }: { group: FluidGroup }) {
  const cols = ['Na', 'K', 'Ca', 'Mg', 'Cl', '乳酸', '酢酸', 'リン酸', '糖質']

  return (
    <section id={group.id} className="mb-8">
      <div className="mb-3">
        <h2 className="text-base font-bold text-tx">{group.title}</h2>
        <p className="text-xs text-muted mt-0.5">{group.description}</p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className={group.color}>
              <th className="p-2 font-bold text-tx border-b border-br text-left min-w-[130px]">製品名</th>
              <th className="p-1.5 font-bold text-tx border-b border-br text-center w-14">容量<br/><span className="font-normal text-muted">(mL)</span></th>
              {cols.map(h => (
                <th key={h} className="p-1.5 font-bold text-tx border-b border-br text-center w-10">
                  {h === '糖質' ? <>{h}<br/><span className="font-normal text-muted">(%)</span></> : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.fluids.map((f, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-s0' : 'bg-bg'}>
                <td className="p-2 border-b border-br">
                  <span className="font-bold text-tx text-xs">{f.name}</span>
                  {f.generic && <span className="block text-[10px] text-muted">{f.generic}</span>}
                  {f.brand && <span className="block text-[10px] text-muted/70">{f.brand}</span>}
                  {f.note && <span className="block text-[10px] text-ac/80">{f.note}</span>}
                </td>
                <td className="p-1.5 text-center border-b border-br text-muted">{f.volume}</td>
                {[f.na, f.k, f.ca, f.mg, f.cl, f.lactate, f.acetate, f.phosphate, f.glucose].map((v, j) => (
                  <td key={j} className={`p-1.5 text-center border-b border-br ${v === '-' ? 'text-muted' : 'text-tx font-medium'}`}>
                    {v === '-' ? '-' : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {group.footnotes && (
        <div className="mt-2 space-y-0.5">
          {group.footnotes.map((fn, i) => (
            <p key={i} className="text-[10px] text-muted">{fn}</p>
          ))}
        </div>
      )}
    </section>
  )
}

export default function IVFluidsPage() {
  const [filter, setFilter] = useState<string>('all')

  const groups = filter === 'all'
    ? fluidGroups
    : fluidGroups.filter(g => g.id === filter)

  return (
    <div className="max-w-3xl mx-auto">
      {/* パンくず */}
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">&rsaquo;</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">&rsaquo;</span>
        <Link href="/tools/drugs" className="hover:text-ac">薬剤ガイド</Link><span className="mx-2">&rsaquo;</span>
        <span>輸液一覧</span>
      </nav>

      {/* ヘッダー */}
      <header className="mb-6">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">薬剤ガイド</span>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-tx mb-1 flex-1">輸液製剤 一覧</h1>
          <FavoriteButton slug="iv-fluids" title="輸液製剤 一覧" href="/tools/drugs/iv-fluids" type="drugs" />
        </div>
        <p className="text-sm text-muted">細胞外液補充液・1号液（開始液）・2号液（脱水補給液）・3号液（維持液）の電解質組成と糖質濃度。電解質はmEq/L表記。</p>
        <UpdatedAt />
      </header>

      {/* フィルター */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[{ id: 'all', label: 'すべて' }, ...fluidGroups.map(g => ({ id: g.id, label: g.title }))].map(item => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === item.id
                ? 'bg-ac text-white'
                : 'bg-s0 border border-br text-muted hover:border-ac/40'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 臨床メモ */}
      <div className="bg-acl border border-ac/20 rounded-xl p-4 mb-6 text-sm text-tx">
        <p className="font-bold text-ac mb-1">💡 輸液選択の基本</p>
        <ul className="space-y-1 text-xs text-muted">
          <li><strong className="text-tx">細胞外液補充液:</strong> 出血・脱水・ショック。血漿に近い組成。</li>
          <li><strong className="text-tx">1号液（開始液）:</strong> K非含有。腎機能不明時の初期輸液。</li>
          <li><strong className="text-tx">2号液（脱水補給液）:</strong> K含有。脱水の補正。腎機能確認後。</li>
          <li><strong className="text-tx">3号液（維持液）:</strong> 1日の水分・電解質維持。最も汎用。</li>
        </ul>
      </div>

      {/* テーブル群 */}
      {groups.map(g => (
        <FluidTable key={g.id} group={g} />
      ))}

      {/* 関連ツール */}
      <div className="mt-8 mb-4">
        <h2 className="text-sm font-bold text-tx mb-2">関連ツール</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { href: '/tools/calc/maintenance-fluid', name: '維持輸液量' },
            { href: '/tools/calc/drip-rate', name: '点滴速度計算' },
            { href: '/tools/calc/na-deficit', name: 'Na欠乏量' },
            { href: '/tools/calc/free-water-deficit', name: '自由水欠乏量' },
            { href: '/tools/calc/parkland', name: 'Parkland式' },
            { href: '/tools/calc/holiday-segar', name: 'Holiday-Segar式' },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className="bg-s0 border border-ac/15 rounded-xl p-3 text-center hover:border-ac/40 hover:bg-acl transition-all">
              <span className="text-xs font-bold text-tx">{t.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-3 mt-6 mb-8 text-sm text-wn">
        掲載情報は各製剤の添付文書・インタビューフォームに基づく転記です。正確性は保証しません。必ず原典をご確認ください。
      </div>
    </div>
  )
}
