// ═══════════════════════════════════════
//  マッチング確率計算 — 志望リストからの推定
// ═══════════════════════════════════════
//
//  アルゴリズム:
//    マッチング倍率 r = 志願者数 / 定員数
//    各病院でマッチする確率 P_i ≈ 1 / r_i
//    すべて不合格の確率 = Π(1 - P_i)
//    少なくとも1つマッチする確率 = 1 - Π(1 - P_i)
//
//  補正:
//    - 第1希望は通常より高い確率（志望理由の準備度が高い想定）
//    - 穴場病院（isAnaba）は+10%ボーナス
//    - 同地域複数志望はやや有利（面接慣れ効果 +5%）
//
//  注意: あくまで目安であり、個人の能力・面接力により大きく異なります
// ═══════════════════════════════════════

import { Hospital } from './hospitals-data'

export interface MatchProbabilityResult {
  totalProbability: number          // 少なくとも1つマッチする確率 (0-100)
  perHospital: {
    id: number
    name: string
    probability: number             // その病院にマッチする推定確率 (0-100)
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

  // 地域の重複チェック（同地域が2つ以上あれば面接慣れボーナス）
  const regionCounts: Record<string, number> = {}
  wishlist.forEach(h => {
    regionCounts[h.prefecture] = (regionCounts[h.prefecture] || 0) + 1
  })

  const perHospital = wishlist.map((h, index) => {
    // 基本確率: 1/倍率
    let prob = 1 / h.popularity

    // 第1希望ボーナス（+15%相対）: 志望理由の深さで有利
    if (index === 0) prob *= 1.15

    // 穴場ボーナス（+10%相対）
    if (h.vacancy && h.vacancy > 0) prob *= 1.10  // 空席ありの病院はマッチ確率UP

    // 同地域複数志望ボーナス（+5%相対）
    if (regionCounts[h.prefecture] >= 2) prob *= 1.05

    // 上限100%
    const probability = Math.min(prob * 100, 95)

    return {
      id: h.id,
      name: h.name,
      probability: Math.round(probability * 10) / 10,
    }
  })

  // 全不合格確率
  const allFailProb = perHospital.reduce(
    (acc, h) => acc * (1 - h.probability / 100),
    1
  )
  const totalProbability = Math.round((1 - allFailProb) * 1000) / 10

  // 安全度判定
  let safetyLevel: MatchProbabilityResult['safetyLevel']
  let recommendation: string

  if (totalProbability >= 95) {
    safetyLevel = 'excellent'
    recommendation = `マッチング成功確率${totalProbability}%。非常に安全な志望リストです。自信を持って面接対策に集中しましょう。`
  } else if (totalProbability >= 85) {
    safetyLevel = 'good'
    recommendation = `マッチング成功確率${totalProbability}%。良いバランスです。あと1〜2院追加するとさらに安心です。`
  } else if (totalProbability >= 70) {
    safetyLevel = 'warning'
    const needed = estimateHospitalsNeeded(totalProbability, wishlist)
    recommendation = `マッチング成功確率${totalProbability}%。倍率2倍以下の病院をあと${needed}院追加すると95%に近づきます。`
  } else {
    safetyLevel = 'danger'
    const avgRate = wishlist.reduce((s, h) => s + h.popularity, 0) / wishlist.length
    if (avgRate > 3.5) {
      recommendation = `マッチング成功確率${totalProbability}%。人気病院に偏っています。倍率2倍以下の「滑り止め」を追加しましょう。`
    } else {
      recommendation = `マッチング成功確率${totalProbability}%。志望先を増やすことを検討してください。3〜5院の志望で95%を目指しましょう。`
    }
  }

  return { totalProbability, perHospital, recommendation, safetyLevel }
}

// 95%に到達するために必要な追加病院数（倍率2.0想定）を推定
function estimateHospitalsNeeded(currentProb: number, currentList: Hospital[]): number {
  const allFailProb = 1 - currentProb / 100
  // 倍率2.0の病院を追加した場合: P_new = 0.5
  let remaining = allFailProb
  let count = 0
  while ((1 - remaining) < 0.95 && count < 10) {
    remaining *= (1 - 0.5) // 倍率2.0 → 50%
    count++
  }
  return Math.max(1, count)
}
