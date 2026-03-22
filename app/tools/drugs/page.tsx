'use client'
import UpdatedAt from '@/components/tools/UpdatedAt'

import Link from 'next/link'

// ── サブツールカード（抗菌薬系を上に固める） ──
const subTools = [
  { href: '/tools/drugs/antibiotics', icon: '🦠', name: '抗菌薬スペクトラム', desc: '18薬剤のスペクトラム一覧' },
  { href: '/tools/calc/renal-dose-abx', icon: '🧪', name: '抗菌薬 腎機能別用量', desc: 'eGFR/CCr別の参考用量。30薬剤対応' },
  { href: '/tools/calc/steroid-converter', icon: '💉', name: 'ステロイド力価換算', desc: 'プレドニゾロン基準の等力価換算。6薬剤対応' },
  { href: '/tools/drugs/steroid-cover', icon: '🛡️', name: '周術期ステロイドカバー', desc: 'ストレスレベル別のHC補充量（文献転記）' },
  { href: '/tools/calc/opioid-conversion', icon: '💊', name: 'オピオイド換算表', desc: 'モルヒネ経口30mg基準のオピオイド相互換算' },
  { href: '/tools/drugs/combination', icon: '📋', name: '配合錠リスト', desc: '高血圧・脂質異常症・糖尿病の配合錠一覧。成分と含量を確認' },
]

// ── 薬剤比較グループ ──
const compareGroups = [
  { group: '循環器', items: [
    { href: '/tools/drugs/compare/doac', name: 'DOAC' },
    { href: '/tools/drugs/compare/arb', name: 'ARB' },
    { href: '/tools/drugs/compare/statin', name: 'スタチン' },
    { href: '/tools/drugs/compare/ccb', name: 'Ca拮抗薬' },
    { href: '/tools/drugs/compare/beta-blocker', name: 'β遮断薬' },
    { href: '/tools/drugs/compare/diuretic', name: '利尿薬' },
    { href: '/tools/drugs/compare/antiplatelet', name: '抗血小板薬' },
  ]},
  { group: '代謝・内分泌', items: [
    { href: '/tools/drugs/compare/sglt2i', name: 'SGLT2阻害薬' },
    { href: '/tools/drugs/compare/dpp4i', name: 'DPP-4阻害薬' },
    { href: '/tools/drugs/compare/glp1ra', name: 'GLP-1受容体作動薬' },
    { href: '/tools/drugs/compare/urate', name: '尿酸降下薬' },
  ]},
  { group: '消化器', items: [
    { href: '/tools/drugs/compare/ppi', name: 'PPI' },
    { href: '/tools/drugs/compare/laxative', name: '便秘薬' },
  ]},
  { group: '感染症', items: [
    { href: '/tools/drugs/compare/cephalosporin', name: 'セフェム系' },
    { href: '/tools/drugs/compare/quinolone', name: 'キノロン系' },
  ]},
  { group: '精神・神経', items: [
    { href: '/tools/drugs/compare/ssri-snri', name: 'SSRI/SNRI' },
    { href: '/tools/drugs/compare/bzd', name: 'BZD系' },
    { href: '/tools/drugs/compare/hypnotic', name: '睡眠薬' },
    { href: '/tools/drugs/compare/aed', name: '抗てんかん薬' },
  ]},
  { group: 'その他', items: [
    { href: '/tools/drugs/compare/nsaids', name: 'NSAIDs' },
    { href: '/tools/drugs/compare/steroid', name: 'ステロイド' },
    { href: '/tools/drugs/compare/inhaler', name: '吸入薬' },
    { href: '/tools/drugs/compare/antihistamine', name: '抗ヒスタミン薬' },
    { href: '/tools/drugs/compare/iron', name: '鉄剤' },
  ]},
]

export default function DrugsHubPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">&rsaquo;</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">&rsaquo;</span>
        <span>薬剤ガイド</span>
      </nav>

      <header className="mb-8">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">薬剤ガイド</span>
        <h1 className="text-2xl font-bold text-tx mb-2">薬剤ガイド</h1>
        <p className="text-sm text-muted">抗菌薬・ステロイド・オピオイド・腎機能別用量・薬剤比較。臨床で頻用する薬剤情報をまとめて。</p>
        <UpdatedAt />
      </header>

      {/* 個別ツール */}
      <div className="grid gap-3 mb-6">
        {subTools.map(t => (
          <Link key={t.name} href={t.href}>
            <div className="bg-s0 border border-ac/15 rounded-xl p-4 hover:border-ac/40 hover:bg-acl transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-ac/10 border border-ac/20 rounded-xl flex items-center justify-center text-lg shrink-0">{t.icon}</div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-tx">{t.name}</h2>
                  <p className="text-xs text-muted mt-0.5">{t.desc}</p>
                </div>
                <span className="text-muted text-sm">&rsaquo;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 薬剤比較表（カード化） */}
      <Link href="#compare-section">
        <div className="bg-s0 border border-ac/15 rounded-xl p-4 hover:border-ac/40 hover:bg-acl transition-all mb-8">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-ac/10 border border-ac/20 rounded-xl flex items-center justify-center text-lg shrink-0">⚖️</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-tx">薬剤比較表</h2>
              <p className="text-xs text-muted mt-0.5">添付文書の公開情報に基づく薬剤一覧比較。25カテゴリ</p>
            </div>
            <span className="text-muted text-sm">&darr;</span>
          </div>
        </div>
      </Link>

      {/* 薬剤比較 詳細セクション */}
      <div id="compare-section" className="scroll-mt-20">
        <h2 className="text-lg font-bold text-tx mb-1">薬剤比較表</h2>
        <p className="text-xs text-muted mb-4">添付文書の公開情報に基づく薬剤一覧比較。25カテゴリ。</p>
        <div className="space-y-4">
          {compareGroups.map(g => (
            <div key={g.group}>
              <p className="text-xs font-bold text-muted mb-1.5">{g.group}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map(item => (
                  <Link key={item.href} href={item.href}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-s0 border border-br hover:border-ac/30 hover:bg-acl transition-all text-tx">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-3 mt-8 mb-8 text-sm text-wn">
        掲載情報は公式文献の転記であり、正確性は保証しません。必ず原典・添付文書をご確認ください。
      </div>
    </div>
  )
}
