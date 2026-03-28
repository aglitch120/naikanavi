// ═══════════════════════════════════════
//  マッチング確率計算 v2 — honmeiIndex加味
// ═══════════════════════════════════════
//
//  アルゴリズム:
//    本気競争者数 = 志願者数 × honmeiIndex
//    本気倍率 = 本気競争者数 / 定員
//    各病院でマッチする確率 P_i ≈ min(定員 / 本気競争者数, 0.95)
//    すべて不合格の確率 = Π(1 - P_i)
//    少なくとも1つマッチする確率 = 1 - Π(1 - P_i)
//
//  補正:
//    - 空席あり病院は+15%相対（過去実績から競争が緩い傾向）
//    - 同地域複数志望は+5%相対（面接慣れ効果の仮定）
//
//  重要: JRMPのGale-Shapleyアルゴリズムでは、志望順位を上げても
//  その病院にマッチする確率は変わりません（戦略耐性）。
//  確率は病院側の選考順位によってのみ決まります。
//
//  注意: あくまで統計的な目安です。個人の面接力・経歴により大きく異なります。
// ═══════════════════════════════════════

import { Hospital } from './hospitals-data'

export interface MatchProbabilityResult {
  totalProbability: number          // 少なくとも1つマッチする確率 (0-95)
  perHospital: {
    id: number
    name: string
    probability: number             // その病院にマッチする推定確率 (0-95)
    honkiBairitsu: number           // 本気倍率
  }[]
  recommendation: string            // アドバイステキスト
  safetyLevel: 'danger' | 'warning' | 'good' | 'excellent'
}

export function calculateMatchProbability(
  wishlist: Hospital[]
): MatchProbabilityResult {
  if (wishlist.length === 0) {
    return {
      totalProbability: 0,
      perHospital: [],
      recommendation: '志望リストに病院を追加してください。',
      safetyLevel: 'danger',
    }
  }

  // 地域の重複チェック
  const regionCounts: Record<string, number> = {}
  wishlist.forEach(h => {
    regionCounts[h.prefecture] = (regionCounts[h.prefecture] || 0) + 1
  })

  const perHospital = wishlist.map((h, index) => {
    const honmei = (h as any).honmeiIndex || 0.35 // フォールバック: 中央値
    const applicants = h.applicants || 1
    const capacity = h.capacity || 1

    // 本気競争者数 = 志願者数 × honmeiIndex
    const seriousApplicants = Math.max(applicants * honmei, 1)

    // 本気倍率
    const honkiBairitsu = seriousApplicants / capacity

    // 基本確率: 定員 / 本気競争者数
    let prob = capacity / seriousApplicants

    // カスケード補正: Gale-Shapleyでは上位病院から落ちた人がスライドしてくる
    // 充足率が高い（毎年埋まる）のに本気倍率が低い病院 = スライド組で埋まっている
    // → 確率を実態に合わせて下げる
    const avgMatchRate = (h as any).avgMatchRate3y || h.matchRate || 0
    if (honkiBairitsu < 1.0 && avgMatchRate >= 95) {
      // 本気倍率は低いが毎年埋まる → 見かけより競争がある
      // 実効倍率を最低1.5に引き上げ（スライド組の効果）
      const effectiveBairitsu = Math.max(honkiBairitsu, 1.5)
      prob = capacity / (capacity * effectiveBairitsu)
    }

    // 注: 志望順位による補正なし（Gale-Shapleyは戦略耐性を持つ）

    // 空席ボーナス（過去に空席が出ている = 競争が緩い傾向）
    if (h.vacancy && h.vacancy > 0) prob *= 1.15

    // 同地域複数志望ボーナス
    if (regionCounts[h.prefecture] >= 2) prob *= 1.05

    // 上限95%、下限1%
    const probability = Math.min(Math.max(prob * 100, 1), 95)

    return {
      id: h.id,
      name: h.name,
      probability: Math.round(probability * 10) / 10,
      honkiBairitsu: Math.round(honkiBairitsu * 10) / 10,
    }
  })

  // 全不合格確率
  const allFailProb = perHospital.reduce(
    (acc, h) => acc * (1 - h.probability / 100),
    1
  )
  const totalProbability = Math.min(Math.round((1 - allFailProb) * 1000) / 10, 95)

  // 安全度判定
  let safetyLevel: MatchProbabilityResult['safetyLevel']
  let recommendation: string

  if (totalProbability >= 95) {
    safetyLevel = 'excellent'
    recommendation = `競争度スコア${totalProbability}%。席の競争面では安全なリストです。あとは面接・筆記対策に集中しましょう。`
  } else if (totalProbability >= 85) {
    safetyLevel = 'good'
    recommendation = `競争度スコア${totalProbability}%。良いバランスです。あと1〜2院追加するとアンマッチリスクがさらに下がります。`
  } else if (totalProbability >= 70) {
    safetyLevel = 'warning'
    const needed = estimateHospitalsNeeded(totalProbability)
    recommendation = `競争度スコア${totalProbability}%。倍率の低い病院をあと${needed}院追加するとアンマッチリスクが下がります。`
  } else {
    safetyLevel = 'danger'
    const avgHonki = perHospital.reduce((s, h) => s + h.honkiBairitsu, 0) / perHospital.length
    if (avgHonki > 3) {
      recommendation = `競争度スコア${totalProbability}%。競争の激しい病院に偏っています。倍率の低い病院を追加してアンマッチを防ぎましょう。`
    } else {
      recommendation = `競争度スコア${totalProbability}%。志望先を増やしてアンマッチリスクを下げましょう。`
    }
  }

  return { totalProbability, perHospital, recommendation, safetyLevel }
}

function estimateHospitalsNeeded(currentProb: number): number {
  const allFailProb = 1 - currentProb / 100
  // 本気倍率2.0の病院を追加: P_new = 50%
  let remaining = allFailProb
  let count = 0
  while ((1 - remaining) < 0.95 && count < 10) {
    remaining *= 0.5
    count++
  }
  return Math.max(1, count)
}
