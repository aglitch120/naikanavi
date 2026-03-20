'use client'

import { useState, useEffect } from 'react'

// ─── 返礼品データ ───
// affiliateUrl は楽天ふるさと納税の検索URL（アフィリエイトID差し替え可能）
// 将来: 個別商品リンクに置き換え + 楽天アフィリエイトID付与

type Category = 'meat' | 'seafood' | 'fruit' | 'rice' | 'daily' | 'appliance'

interface RewardItem {
  id: string
  name: string
  area: string       // 自治体
  price: string      // 寄附額
  description: string
  category: Category
  affiliateUrl: string
}

const categories: { key: Category; label: string; emoji: string }[] = [
  { key: 'meat', label: '肉', emoji: '🥩' },
  { key: 'seafood', label: '海鮮', emoji: '🦐' },
  { key: 'fruit', label: 'フルーツ', emoji: '🍑' },
  { key: 'rice', label: '米', emoji: '🍚' },
  { key: 'daily', label: '日用品', emoji: '🧴' },
  { key: 'appliance', label: '家電', emoji: '📱' },
]

const rewards: RewardItem[] = [
  // 肉
  { id: 'meat-1', name: '宮崎牛 切り落とし 1.5kg', area: '宮崎県都城市', price: '¥15,000', description: 'A5等級の宮崎牛を大容量で。小分け冷凍で使いやすい。', category: 'meat', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E5%AE%AE%E5%B4%8E%E7%89%9B+%E5%88%87%E3%82%8A%E8%90%BD%E3%81%A8%E3%81%97/?f=13&l-id=furusato' },
  { id: 'meat-2', name: '飛騨牛 ステーキ 300g×2', area: '岐阜県飛騨市', price: '¥20,000', description: 'A5等級サーロイン。当直明けのご褒美に。', category: 'meat', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E9%A3%9B%E9%A8%A8%E7%89%9B+%E3%82%B9%E3%83%86%E3%83%BC%E3%82%AD/?f=13' },
  { id: 'meat-3', name: '博多和牛 もつ鍋セット 4人前', area: '福岡県福智町', price: '¥10,000', description: '国産牛もつ+スープ+麺。冬の当直後に。', category: 'meat', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%82%E3%81%A4%E9%8D%8B+%E5%8D%9A%E5%A4%9A/?f=13' },
  { id: 'meat-4', name: '鹿児島黒豚 しゃぶしゃぶ 1kg', area: '鹿児島県鹿屋市', price: '¥12,000', description: '甘みのある脂身が絶品。', category: 'meat', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E9%B9%BF%E5%85%90%E5%B3%B6%E9%BB%92%E8%B1%9A/?f=13' },
  { id: 'meat-5', name: '米沢牛 すき焼き用 500g', area: '山形県米沢市', price: '¥25,000', description: '三大和牛のひとつ。きめ細かいサシが特徴。', category: 'meat', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E7%B1%B3%E6%B2%A2%E7%89%9B+%E3%81%99%E3%81%8D%E7%84%BC%E3%81%8D/?f=13' },

  // 海鮮
  { id: 'sea-1', name: 'ホタテ貝柱 1kg（冷凍）', area: '北海道紋別市', price: '¥14,000', description: '刺身でもバター焼きでも。大粒で食べ応え抜群。', category: 'seafood', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%9B%E3%82%BF%E3%83%86+%E8%B2%9D%E6%9F%B1/?f=13' },
  { id: 'sea-2', name: 'いくら醤油漬 500g', area: '北海道白糠町', price: '¥15,000', description: '北海道産鮭卵100%。粒が大きくプチプチ。', category: 'seafood', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%84%E3%81%8F%E3%82%89+%E9%86%A4%E6%B2%B9%E6%BC%AC/?f=13' },
  { id: 'sea-3', name: 'うなぎ蒲焼 4尾', area: '鹿児島県志布志市', price: '¥20,000', description: '国産うなぎ。真空パックで好きな時に。', category: 'seafood', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%86%E3%81%AA%E3%81%8E+%E8%92%B2%E7%84%BC/?f=13' },
  { id: 'sea-4', name: 'カニしゃぶ ズワイガニ 1kg', area: '北海道根室市', price: '¥25,000', description: '殻剥き済みで調理不要。忙しい医師向け。', category: 'seafood', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%BA%E3%83%AF%E3%82%A4%E3%82%AC%E3%83%8B+%E3%81%97%E3%82%83%E3%81%B6/?f=13' },
  { id: 'sea-5', name: '明太子 無着色 1kg', area: '福岡県飯塚市', price: '¥10,000', description: '大容量でコスパ最強。ご飯のお供に。', category: 'seafood', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E6%98%8E%E5%A4%AA%E5%AD%90+%E7%84%A1%E7%9D%80%E8%89%B2/?f=13' },

  // フルーツ
  { id: 'fruit-1', name: 'シャインマスカット 2房', area: '山梨県笛吹市', price: '¥12,000', description: '皮ごと食べられる高級ぶどう。甘さが段違い。', category: 'fruit', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%B7%E3%83%A3%E3%82%A4%E3%83%B3%E3%83%9E%E3%82%B9%E3%82%AB%E3%83%83%E3%83%88/?f=13' },
  { id: 'fruit-2', name: '桃 5kg（白桃）', area: '山梨県山梨市', price: '¥15,000', description: '夏の贅沢。ジューシーで香り豊か。', category: 'fruit', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E6%A1%83+%E7%99%BD%E6%A1%83/?f=13' },
  { id: 'fruit-3', name: 'みかん 10kg', area: '和歌山県有田市', price: '¥10,000', description: '医局の差し入れに最適な大容量。', category: 'fruit', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%BF%E3%81%8B%E3%82%93+%E6%9C%89%E7%94%B0/?f=13' },
  { id: 'fruit-4', name: 'いちご あまおう 4パック', area: '福岡県久留米市', price: '¥13,000', description: '大粒で甘い博多のブランドいちご。', category: 'fruit', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%82%E3%81%BE%E3%81%8A%E3%81%86/?f=13' },
  { id: 'fruit-5', name: 'マンゴー 2玉', area: '宮崎県西都市', price: '¥15,000', description: '完熟マンゴー。とろける甘さ。', category: 'fruit', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E5%AE%AE%E5%B4%8E+%E3%83%9E%E3%83%B3%E3%82%B4%E3%83%BC/?f=13' },

  // 米
  { id: 'rice-1', name: '新潟コシヒカリ 20kg', area: '新潟県南魚沼市', price: '¥20,000', description: '日本一のブランド米。5kg×4袋で保存しやすい。', category: 'rice', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%B3%E3%82%B7%E3%83%92%E3%82%AB%E3%83%AA+%E5%8D%97%E9%AD%9A%E6%B2%BC/?f=13' },
  { id: 'rice-2', name: 'つや姫 10kg', area: '山形県天童市', price: '¥12,000', description: 'もっちり食感。冷めても美味しいのでお弁当にも。', category: 'rice', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%A4%E3%82%84%E5%A7%AB/?f=13' },
  { id: 'rice-3', name: 'ゆめぴりか 10kg', area: '北海道当別町', price: '¥13,000', description: '北海道の最高峰。粘りと甘みのバランスが絶妙。', category: 'rice', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%86%E3%82%81%E3%81%B4%E3%82%8A%E3%81%8B/?f=13' },
  { id: 'rice-4', name: 'ひとめぼれ 15kg', area: '宮城県大崎市', price: '¥14,000', description: 'あっさり系で飽きない。日常使いに最適。', category: 'rice', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%B2%E3%81%A8%E3%82%81%E3%81%BC%E3%82%8C/?f=13' },
  { id: 'rice-5', name: 'ななつぼし 20kg', area: '北海道旭川市', price: '¥16,000', description: 'コスパ最強の北海道米。バランスの良い味わい。', category: 'rice', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%81%AA%E3%81%AA%E3%81%A4%E3%81%BC%E3%81%97/?f=13' },

  // 日用品
  { id: 'daily-1', name: 'トイレットペーパー 96ロール', area: '静岡県富士宮市', price: '¥12,000', description: '日用品の定番。買い忘れがなくなる大容量。', category: 'daily', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%88%E3%82%A4%E3%83%AC%E3%83%83%E3%83%88%E3%83%9A%E3%83%BC%E3%83%91%E3%83%BC/?f=13' },
  { id: 'daily-2', name: 'ティッシュペーパー 60箱', area: '静岡県富士市', price: '¥14,000', description: '1年分まとめて届く。ストック管理不要に。', category: 'daily', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%86%E3%82%A3%E3%83%83%E3%82%B7%E3%83%A5/?f=13' },
  { id: 'daily-3', name: '洗濯洗剤 アタックZERO 詰替 6個', area: '和歌山県和歌山市', price: '¥10,000', description: '実用的な返礼品の王道。', category: 'daily', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%A2%E3%82%BF%E3%83%83%E3%82%AF+%E6%B4%97%E5%89%A4/?f=13' },
  { id: 'daily-4', name: 'ハンドソープ キレイキレイ 大容量セット', area: '大阪府大阪市', price: '¥8,000', description: '病院勤務なら手洗いは必須。ストックに。', category: 'daily', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%AD%E3%83%AC%E3%82%A4%E3%82%AD%E3%83%AC%E3%82%A4/?f=13' },
  { id: 'daily-5', name: 'エリエール 消臭+ トイレットペーパー 72ロール', area: '愛媛県四国中央市', price: '¥11,000', description: '消臭機能付き。当直室に置いておきたい。', category: 'daily', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%A8%E3%83%AA%E3%82%A8%E3%83%BC%E3%83%AB+%E6%B6%88%E8%87%AD/?f=13' },

  // 家電
  { id: 'app-1', name: 'バルミューダ トースター', area: '群馬県昭和村', price: '¥40,000', description: 'スチームでパンがふわもち。朝食のQOL爆上がり。', category: 'appliance', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%90%E3%83%AB%E3%83%9F%E3%83%A5%E3%83%BC%E3%83%80+%E3%83%88%E3%83%BC%E3%82%B9%E3%82%BF%E3%83%BC/?f=13' },
  { id: 'app-2', name: 'ルンバ i2', area: '大阪府大東市', price: '¥50,000', description: '忙しい医師の味方。掃除を自動化。', category: 'appliance', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%83%AB%E3%83%B3%E3%83%90/?f=13' },
  { id: 'app-3', name: 'アラジン グラファイトグリラー', area: '兵庫県加西市', price: '¥35,000', description: '煙が出にくいので賃貸でも焼肉できる。', category: 'appliance', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%A2%E3%83%A9%E3%82%B8%E3%83%B3+%E3%82%B0%E3%83%A9%E3%83%95%E3%82%A1%E3%82%A4%E3%83%88/?f=13' },
  { id: 'app-4', name: 'タイガー 炊飯器 5.5合', area: '大阪府門真市', price: '¥60,000', description: '土鍋圧力IH。お米の味が変わる。', category: 'appliance', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/%E3%82%BF%E3%82%A4%E3%82%AC%E3%83%BC+%E7%82%8A%E9%A3%AF%E5%99%A8/?f=13' },
  { id: 'app-5', name: 'SodaStream 炭酸水メーカー', area: '宮城県多賀城市', price: '¥20,000', description: 'ペットボトルを買わなくなる。当直室にも。', category: 'appliance', affiliateUrl: 'https://search.rakuten.co.jp/search/mall/SodaStream/?f=13' },
]

// ─── Vote storage helpers ───
const STORAGE_KEY = 'iwor-furusato-votes'

function getVotes(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function getMyVotes(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY + '-my') || '[]'))
  } catch {
    return new Set()
  }
}

function saveVote(id: string) {
  const votes = getVotes()
  votes[id] = (votes[id] || 0) + 1
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))

  const myVotes = getMyVotes()
  myVotes.add(id)
  localStorage.setItem(STORAGE_KEY + '-my', JSON.stringify(Array.from(myVotes)))

  return votes
}

// ─── Component ───
export default function FurusatoRanking() {
  const [activeCategory, setActiveCategory] = useState<Category>('meat')
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    setVotes(getVotes())
    setMyVotes(getMyVotes())
  }, [])

  const handleVote = (id: string) => {
    if (myVotes.has(id)) return
    const updated = saveVote(id)
    setVotes({ ...updated })
    setMyVotes(new Set(Array.from(myVotes).concat(id)))
  }

  const items = rewards
    .filter(r => r.category === activeCategory)
    .sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0))

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-0.5 bg-ac rounded-full" />
        <h2 className="text-lg font-bold text-tx">おすすめ返礼品ランキング</h2>
      </div>
      <p className="text-xs text-muted mb-4 leading-relaxed">
        医師コミュニティの投票で決まるランキング。気になる返礼品に 👍 を押してみてください。
      </p>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat.key
                ? 'bg-ac text-white shadow-sm'
                : 'bg-s0 border border-br text-muted hover:border-ac/20'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Ranking list */}
      <div className="space-y-3">
        {items.map((item, i) => {
          const voteCount = votes[item.id] || 0
          const hasVoted = myVotes.has(item.id)

          return (
            <div
              key={item.id}
              className="bg-s0 border border-br rounded-xl p-4 hover:border-ac/20 transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Rank badge */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                  i === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  : i === 1 ? 'bg-gray-100 text-gray-500 border border-gray-200'
                  : i === 2 ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'bg-s1 text-muted border border-br'
                }`}>
                  {i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-tx leading-snug">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted bg-s1 px-1.5 py-0.5 rounded">{item.area}</span>
                    <span className="text-xs font-bold text-ac">{item.price}</span>
                  </div>
                  <p className="text-[11px] text-muted mt-1.5 leading-relaxed">{item.description}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleVote(item.id)}
                      disabled={hasVoted}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        hasVoted
                          ? 'bg-acl text-ac border border-ac/15 cursor-default'
                          : 'bg-s1 border border-br text-muted hover:border-ac/30 hover:text-ac active:scale-95'
                      }`}
                    >
                      <span>{hasVoted ? '✓' : '👍'}</span>
                      <span>{voteCount}</span>
                    </button>

                    <a
                      href={item.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-ac text-white hover:bg-ac2 transition-colors"
                    >
                      楽天で探す
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <path d="M15 3h6v6" />
                        <path d="M10 14L21 3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Affiliate disclosure */}
      <p className="text-[10px] text-muted mt-3 leading-relaxed">
        ※ 「楽天で探す」リンクはアフィリエイトリンクを含む場合があります。リンク経由での購入により、サイト運営費の一部が還元されます。
        ランキングはユーザー投票に基づいており、広告主による順位操作は行っていません。
      </p>
    </section>
  )
}
