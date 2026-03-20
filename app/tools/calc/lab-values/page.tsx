'use client'
import UpdatedAt from '@/components/tools/UpdatedAt'

import { useState } from 'react'
import Link from 'next/link'
import ErrorReportButton from '@/components/tools/ErrorReportButton'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'

type Sex = 'male' | 'female'

interface LabItem {
  name: string
  unit: string
  male: string
  female: string
  note?: string
  /** 年齢依存: [age_threshold, alt_male, alt_female] */
  ageAlt?: [number, string, string]
}

interface LabCategory {
  id: string
  title: string
  icon: string
  items: LabItem[]
}

const LAB_DATA: LabCategory[] = [
  {
    id: 'cbc', title: '血算（CBC）', icon: '🩸',
    items: [
      { name: 'WBC', unit: '/μL', male: '3,300〜8,600', female: '3,300〜8,600' },
      { name: 'RBC', unit: '×10⁴/μL', male: '435〜555', female: '386〜492' },
      { name: 'Hb', unit: 'g/dL', male: '13.7〜16.8', female: '11.6〜14.8' },
      { name: 'Ht', unit: '%', male: '40.7〜50.1', female: '35.1〜44.4' },
      { name: 'MCV', unit: 'fL', male: '83〜101', female: '83〜101' },
      { name: 'MCH', unit: 'pg', male: '28.0〜34.6', female: '28.0〜34.6' },
      { name: 'MCHC', unit: 'g/dL', male: '31.6〜36.6', female: '31.6〜36.6' },
      { name: 'Plt', unit: '×10⁴/μL', male: '15.8〜34.8', female: '15.8〜34.8' },
      { name: '網赤血球', unit: '‰', male: '2〜27', female: '2〜27' },
    ],
  },
  {
    id: 'coag', title: '凝固系', icon: '🧬',
    items: [
      { name: 'PT-INR', unit: '', male: '0.85〜1.15', female: '0.85〜1.15' },
      { name: 'PT', unit: '秒', male: '10〜13', female: '10〜13' },
      { name: 'APTT', unit: '秒', male: '25〜40', female: '25〜40' },
      { name: 'フィブリノーゲン', unit: 'mg/dL', male: '200〜400', female: '200〜400' },
      { name: 'D-dimer', unit: 'μg/mL', male: '< 1.0', female: '< 1.0' },
      { name: 'FDP', unit: 'μg/mL', male: '< 5.0', female: '< 5.0' },
      { name: 'AT-III', unit: '%', male: '80〜130', female: '80〜130' },
    ],
  },
  {
    id: 'liver', title: '肝機能', icon: '🫁',
    items: [
      { name: 'AST (GOT)', unit: 'U/L', male: '13〜30', female: '13〜30' },
      { name: 'ALT (GPT)', unit: 'U/L', male: '10〜42', female: '7〜23' },
      { name: 'γ-GTP', unit: 'U/L', male: '13〜64', female: '9〜32' },
      { name: 'ALP', unit: 'U/L', male: '38〜113', female: '38〜113', note: 'IFCC法' },
      { name: 'LD (LDH)', unit: 'U/L', male: '124〜222', female: '124〜222' },
      { name: 'T-Bil', unit: 'mg/dL', male: '0.4〜1.5', female: '0.4〜1.5' },
      { name: 'D-Bil', unit: 'mg/dL', male: '0〜0.4', female: '0〜0.4' },
      { name: 'ChE', unit: 'U/L', male: '240〜486', female: '201〜421' },
      { name: 'NH₃', unit: 'μg/dL', male: '12〜66', female: '12〜66' },
    ],
  },
  {
    id: 'renal', title: '腎機能', icon: '🧪',
    items: [
      { name: 'BUN', unit: 'mg/dL', male: '8〜20', female: '8〜20' },
      { name: 'Cr', unit: 'mg/dL', male: '0.65〜1.07', female: '0.46〜0.79' },
      { name: 'eGFR', unit: 'mL/min/1.73m²', male: '≥ 90', female: '≥ 90', note: '年齢・性別・Crから算出' },
      { name: 'UA', unit: 'mg/dL', male: '3.7〜7.8', female: '2.6〜5.5' },
      { name: 'Cys-C', unit: 'mg/L', male: '0.63〜0.95', female: '0.56〜0.87' },
    ],
  },
  {
    id: 'electrolyte', title: '電解質', icon: '⚗️',
    items: [
      { name: 'Na', unit: 'mEq/L', male: '138〜145', female: '138〜145' },
      { name: 'K', unit: 'mEq/L', male: '3.6〜4.8', female: '3.6〜4.8' },
      { name: 'Cl', unit: 'mEq/L', male: '101〜108', female: '101〜108' },
      { name: 'Ca', unit: 'mg/dL', male: '8.8〜10.1', female: '8.8〜10.1' },
      { name: 'P', unit: 'mg/dL', male: '2.7〜4.6', female: '2.7〜4.6' },
      { name: 'Mg', unit: 'mg/dL', male: '1.8〜2.4', female: '1.8〜2.4' },
      { name: 'Fe', unit: 'μg/dL', male: '40〜188', female: '40〜188', note: '日内変動あり' },
      { name: 'フェリチン', unit: 'ng/mL', male: '20〜280', female: '5〜157' },
      { name: 'TIBC', unit: 'μg/dL', male: '253〜365', female: '253〜365' },
    ],
  },
  {
    id: 'lipid', title: '脂質', icon: '🫀',
    items: [
      { name: 'TC', unit: 'mg/dL', male: '142〜248', female: '142〜248' },
      { name: 'LDL-C', unit: 'mg/dL', male: '65〜163', female: '65〜163', note: '直接法' },
      { name: 'HDL-C', unit: 'mg/dL', male: '38〜90', female: '48〜103' },
      { name: 'TG', unit: 'mg/dL', male: '40〜234', female: '30〜117', note: '空腹時' },
    ],
  },
  {
    id: 'glucose', title: '糖代謝', icon: '🍬',
    items: [
      { name: '空腹時血糖', unit: 'mg/dL', male: '73〜109', female: '73〜109' },
      { name: 'HbA1c', unit: '%', male: '4.9〜6.0', female: '4.9〜6.0', note: 'NGSP値' },
      { name: 'GA', unit: '%', male: '11.0〜16.0', female: '11.0〜16.0' },
      { name: 'インスリン', unit: 'μU/mL', male: '1.84〜12.2', female: '1.84〜12.2', note: '空腹時' },
      { name: 'C-ペプチド', unit: 'ng/mL', male: '0.8〜2.5', female: '0.8〜2.5', note: '空腹時' },
    ],
  },
  {
    id: 'protein', title: '蛋白', icon: '🧫',
    items: [
      { name: 'TP', unit: 'g/dL', male: '6.6〜8.1', female: '6.6〜8.1' },
      { name: 'Alb', unit: 'g/dL', male: '4.1〜5.1', female: '4.1〜5.1' },
      { name: 'CRP', unit: 'mg/dL', male: '≤ 0.14', female: '≤ 0.14' },
      { name: 'PCT', unit: 'ng/mL', male: '< 0.05', female: '< 0.05', note: '細菌感染マーカー' },
    ],
  },
  {
    id: 'thyroid', title: '甲状腺', icon: '🦋',
    items: [
      { name: 'TSH', unit: 'μIU/mL', male: '0.5〜5.0', female: '0.5〜5.0' },
      { name: 'FT3', unit: 'pg/mL', male: '2.3〜4.0', female: '2.3〜4.0' },
      { name: 'FT4', unit: 'ng/dL', male: '0.9〜1.7', female: '0.9〜1.7' },
    ],
  },
  {
    id: 'cardiac', title: '心臓マーカー', icon: '❤️',
    items: [
      { name: 'Trop-T (hs)', unit: 'ng/mL', male: '< 0.014', female: '< 0.014', note: '高感度。99パーセンタイル値' },
      { name: 'Trop-I (hs)', unit: 'pg/mL', male: '< 26.2', female: '< 11.6', note: '高感度。男女で異なる' },
      { name: 'BNP', unit: 'pg/mL', male: '< 18.4', female: '< 18.4', note: '心不全スクリーニング' },
      { name: 'NT-proBNP', unit: 'pg/mL', male: '< 125', female: '< 125', note: '年齢で上昇。75歳以上は< 450', ageAlt: [75, '< 450', '< 450'] },
      { name: 'CK', unit: 'U/L', male: '59〜248', female: '41〜153' },
      { name: 'CK-MB', unit: 'ng/mL', male: '< 5.0', female: '< 5.0' },
    ],
  },
  {
    id: 'tumor', title: '腫瘍マーカー', icon: '🎗️',
    items: [
      { name: 'CEA', unit: 'ng/mL', male: '≤ 5.0', female: '≤ 5.0', note: '喫煙者はやや高値' },
      { name: 'CA19-9', unit: 'U/mL', male: '≤ 37', female: '≤ 37' },
      { name: 'AFP', unit: 'ng/mL', male: '≤ 10', female: '≤ 10' },
      { name: 'PSA', unit: 'ng/mL', male: '≤ 4.0', female: '—', note: '年齢別カットオフあり' },
      { name: 'CA125', unit: 'U/mL', male: '≤ 35', female: '≤ 35', note: '月経・妊娠で上昇' },
    ],
  },
]

export default function LabValuesPage() {
  const [sex, setSex] = useState<Sex>('male')
  const [age, setAge] = useState(50)
  const [search, setSearch] = useState('')
  const [openCat, setOpenCat] = useState<string | null>('cbc')

  const q = search.toLowerCase()

  const filtered = search.length >= 1
    ? LAB_DATA.map(c => ({
        ...c,
        items: c.items.filter(i => i.name.toLowerCase().includes(q) || c.title.includes(search))
      })).filter(c => c.items.length > 0)
    : LAB_DATA

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/interpret" className="hover:text-ac">検査読影</Link><span className="mx-2">›</span>
        <span>基準値早見表</span>
      </nav>

      <header className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">🔬 検査読影</span>
            <h1 className="text-2xl font-bold text-tx mb-1">基準値早見表</h1>
            <p className="text-sm text-muted">年齢・性別を入力 → カテゴリ別に基準値を一覧表示</p>
          </div>
          <ProPulseHint>
            <FavoriteButton slug="interpret-lab-values" title="基準値早見表" href="/tools/interpret/lab-values" type="calc" />
          </ProPulseHint>
        </div>
        <UpdatedAt />
      </header>

      {/* 入力 */}
      <div className="bg-s0 border border-br rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-muted block mb-1">性別</label>
            <div className="flex gap-1">
              {[{ v: 'male' as Sex, l: '♂ 男性' }, { v: 'female' as Sex, l: '♀ 女性' }].map(s => (
                <button key={s.v} onClick={() => setSex(s.v)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    sex === s.v ? 'bg-ac text-white' : 'bg-s1 text-muted border border-br hover:border-ac/30'
                  }`}>{s.l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted block mb-1">年齢</label>
            <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} min={0} max={120}
              className="w-20 px-3 py-2 bg-bg border border-br rounded-lg text-sm text-tx text-center focus:outline-none focus:border-ac/40" />
            <span className="text-xs text-muted ml-1">歳</span>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-bold text-muted block mb-1">検索</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="項目名で検索（例: Cr, BNP）"
              className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-sm text-tx placeholder:text-muted focus:outline-none focus:border-ac/40" />
          </div>
        </div>
      </div>

      {/* カテゴリ一覧 */}
      <div className="space-y-2">
        {filtered.map(cat => {
          const isOpen = openCat === cat.id || search.length >= 1
          return (
            <div key={cat.id} className="bg-s0 border border-br rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenCat(isOpen && !search ? null : cat.id)}
                className="w-full flex items-center gap-2 p-3 text-left hover:bg-acl/50 transition-colors"
              >
                <span>{cat.icon}</span>
                <h2 className="flex-1 text-sm font-bold text-tx">{cat.title}</h2>
                <span className="text-[11px] text-muted bg-s1 px-2 py-0.5 rounded-full">{cat.items.length}</span>
                <span className="text-muted text-xs">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="border-t border-br overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-acl/50">
                        <th className="text-left p-2 font-bold text-ac">項目</th>
                        <th className="text-left p-2 font-bold text-ac">基準値</th>
                        <th className="text-left p-2 font-bold text-ac">単位</th>
                        <th className="text-left p-2 font-bold text-muted">備考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.items.map((item, i) => {
                        let val = sex === 'male' ? item.male : item.female
                        // Age-dependent override
                        if (item.ageAlt && age >= item.ageAlt[0]) {
                          val = sex === 'male' ? item.ageAlt[1] : item.ageAlt[2]
                        }
                        const isSexDiff = item.male !== item.female
                        return (
                          <tr key={i} className="border-t border-br/50 hover:bg-acl/30 transition-colors">
                            <td className="p-2 font-bold text-tx whitespace-nowrap">{item.name}</td>
                            <td className="p-2 text-tx">{val}{isSexDiff && <span className="text-[10px] text-muted ml-1">({sex === 'male' ? '♂' : '♀'})</span>}</td>
                            <td className="p-2 text-muted whitespace-nowrap">{item.unit}</td>
                            <td className="p-2 text-muted">{item.note || ''}{item.ageAlt && age >= item.ageAlt[0] ? ` (${age}歳: 年齢補正値)` : ''}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-muted">該当する項目が見つかりません</div>
      )}

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-3 mt-8 mb-8 text-sm text-wn">
        ⚠️ 基準値は施設・測定法により異なります。実際の判断は施設の基準値を参照してください。
        <div className="mt-2 pt-2 border-t border-wnb/30"><ErrorReportButton toolName="基準値早見表" /></div>
      </div>

      <section className="text-xs text-muted space-y-1 mb-8">
        <h3 className="font-bold text-tx text-sm mb-2">参考文献</h3>
        <p>• 日本臨床検査医学会「臨床検査の共用基準範囲」2023年版.</p>
        <p>• 各検査項目の添付文書・ガイドライン.</p>
      </section>
    </main>
  )
}
