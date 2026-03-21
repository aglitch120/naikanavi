'use client'
import UpdatedAt from '@/components/tools/UpdatedAt'

import { useState } from 'react'
import Link from 'next/link'

// ── サブツールカード ──
const subTools = [
  { href: '/tools/drugs/antibiotics', icon: '🦠', name: '抗菌薬スペクトラム', desc: '18薬剤のスペクトラム一覧' },
  { href: '/tools/calc/steroid-converter', icon: '💉', name: 'ステロイド力価換算', desc: 'プレドニゾロン基準の等力価換算。6薬剤対応' },
  { href: '/tools/drugs/steroid-cover', icon: '🛡️', name: '周術期ステロイドカバー', desc: 'ストレスレベル別のHC補充量（文献転記）' },
  { href: '/tools/calc/opioid-conversion', icon: '💊', name: 'オピオイド換算表', desc: 'モルヒネ経口30mg基準のオピオイド相互換算' },
  { href: '/tools/calc/renal-dose-abx', icon: '🧪', name: '抗菌薬 腎機能別用量', desc: 'eGFR/CCr別の参考用量。30薬剤対応' },
  { href: '/tools/drugs/combination', icon: '📋', name: '配合錠リスト', desc: '高血圧・脂質異常症・糖尿病の配合錠一覧。成分と含量を確認' },
  { href: '#', icon: '📋', name: 'DIデータベース', desc: '各薬剤の添付文書要約・相互作用・TDM情報', badge: '準備中' },
]

export default function DrugsHubPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <span>薬剤ガイド</span>
      </nav>

      <header className="mb-8">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">💊 薬剤ガイド</span>
        <h1 className="text-2xl font-bold text-tx mb-2">薬剤ガイド</h1>
        <p className="text-sm text-muted">抗菌薬・ステロイド・オピオイド・腎機能別用量。臨床で頻用する薬剤情報をまとめて。</p>
        <UpdatedAt />
      </header>

      <div className="grid gap-3">
        {subTools.map(t => {
          const inner = (
            <div className={`bg-s0 border rounded-xl p-4 transition-all ${t.badge ? 'border-br opacity-60' : 'border-ac/15 hover:border-ac/40 hover:bg-acl'}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-ac/10 border border-ac/20 rounded-xl flex items-center justify-center text-lg shrink-0">{t.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-tx">{t.name}</h2>
                    {t.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-s2 text-muted">{t.badge}</span>}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{t.desc}</p>
                </div>
                {!t.badge && <span className="text-muted text-sm">›</span>}
              </div>
            </div>
          )
          return t.badge ? <div key={t.name}>{inner}</div> : <Link key={t.name} href={t.href}>{inner}</Link>
        })}
      </div>

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-3 mt-8 mb-8 text-sm text-wn">
        ⚠️ 掲載情報は公式文献の転記であり、正確性は保証しません。必ず原典・添付文書をご確認ください。
      </div>
    </div>
  )
}
