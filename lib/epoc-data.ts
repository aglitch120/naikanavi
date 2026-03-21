/**
 * EPOC（初期臨床研修）到達目標データ
 *
 * Source: 厚生労働省 医師臨床研修指導ガイドライン（2020年度版〜）
 *         PG-EPOC (EPOC2) — https://epoc2.umin.ac.jp/
 *
 * 経験すべき症候: 29項目
 * 経験すべき疾病・病態: 26項目
 * 基本的臨床手技: 14項目（2020年改訂前の参考リスト）
 */

// ── 経験すべき症候（29項目）──
export const EPOC_SYMPTOMS = [
  { id: 's01', name: 'ショック', category: '全身' },
  { id: 's02', name: '体重減少・るい痩', category: '全身' },
  { id: 's03', name: '発疹', category: '全身' },
  { id: 's04', name: '黄疸', category: '全身' },
  { id: 's05', name: '発熱', category: '全身' },
  { id: 's06', name: 'もの忘れ', category: '神経・精神' },
  { id: 's07', name: '頭痛', category: '神経・精神' },
  { id: 's08', name: 'めまい', category: '神経・精神' },
  { id: 's09', name: '意識障害・失神', category: '神経・精神' },
  { id: 's10', name: 'けいれん発作', category: '神経・精神' },
  { id: 's11', name: '視力障害', category: '神経・精神' },
  { id: 's12', name: '胸痛', category: '胸部' },
  { id: 's13', name: '心停止', category: '胸部' },
  { id: 's14', name: '呼吸困難', category: '胸部' },
  { id: 's15', name: '吐血・喀血', category: '胸部' },
  { id: 's16', name: '下血・血便', category: '腹部' },
  { id: 's17', name: '嘔気・嘔吐', category: '腹部' },
  { id: 's18', name: '腹痛', category: '腹部' },
  { id: 's19', name: '便通異常（下痢・便秘）', category: '腹部' },
  { id: 's20', name: '熱傷・外傷', category: '外因' },
  { id: 's21', name: '腰・背部痛', category: '運動器' },
  { id: 's22', name: '関節痛', category: '運動器' },
  { id: 's23', name: '運動麻痺・筋力低下', category: '運動器' },
  { id: 's24', name: '排尿障害（尿失禁・排尿困難）', category: '泌尿器' },
  { id: 's25', name: '興奮・せん妄', category: '神経・精神' },
  { id: 's26', name: '抑うつ', category: '神経・精神' },
  { id: 's27', name: '成長・発達の障害', category: '小児' },
  { id: 's28', name: '妊娠・出産', category: '産婦人科' },
  { id: 's29', name: '終末期の症候', category: '全身' },
] as const

// ── 経験すべき疾病・病態（26項目）──
export const EPOC_DISEASES = [
  { id: 'd01', name: '脳血管障害', category: '神経' },
  { id: 'd02', name: '認知症', category: '神経' },
  { id: 'd03', name: '急性冠症候群', category: '循環器' },
  { id: 'd04', name: '心不全', category: '循環器' },
  { id: 'd05', name: '大動脈瘤', category: '循環器' },
  { id: 'd06', name: '高血圧', category: '循環器' },
  { id: 'd07', name: '肺癌', category: '呼吸器' },
  { id: 'd08', name: '肺炎', category: '呼吸器' },
  { id: 'd09', name: '急性上気道炎', category: '呼吸器' },
  { id: 'd10', name: '気管支喘息', category: '呼吸器' },
  { id: 'd11', name: '慢性閉塞性肺疾患（COPD）', category: '呼吸器' },
  { id: 'd12', name: '急性胃腸炎', category: '消化器' },
  { id: 'd13', name: '胃癌', category: '消化器' },
  { id: 'd14', name: '消化性潰瘍', category: '消化器' },
  { id: 'd15', name: '肝炎・肝硬変', category: '消化器' },
  { id: 'd16', name: '胆石症', category: '消化器' },
  { id: 'd17', name: '大腸癌', category: '消化器' },
  { id: 'd18', name: '腎盂腎炎', category: '腎・泌尿器' },
  { id: 'd19', name: '尿路結石', category: '腎・泌尿器' },
  { id: 'd20', name: '腎不全', category: '腎・泌尿器' },
  { id: 'd21', name: '高エネルギー外傷・骨折', category: '外科・整形' },
  { id: 'd22', name: '糖尿病', category: '代謝・内分泌' },
  { id: 'd23', name: '脂質異常症', category: '代謝・内分泌' },
  { id: 'd24', name: 'うつ病', category: '精神' },
  { id: 'd25', name: '統合失調症', category: '精神' },
  { id: 'd26', name: '依存症（ニコチン・アルコール・薬物・病的賭博）', category: '精神' },
] as const

// ── 基本的臨床手技（14項目）──
// 2020年改訂で個別リストは到達目標から外れたが、研修現場では引き続き経験が求められる
export const EPOC_PROCEDURES = [
  { id: 'p01', name: '気管挿管', category: '気道管理' },
  { id: 'p02', name: '心肺蘇生（BLS/ACLS）', category: '救急' },
  { id: 'p03', name: '動脈血採血', category: '採血・注射' },
  { id: 'p04', name: '静脈路確保', category: '採血・注射' },
  { id: 'p05', name: '中心静脈カテーテル挿入', category: '採血・注射' },
  { id: 'p06', name: '尿道カテーテル挿入', category: 'カテーテル' },
  { id: 'p07', name: '胃管挿入', category: 'カテーテル' },
  { id: 'p08', name: '腰椎穿刺', category: '穿刺' },
  { id: 'p09', name: '胸腔穿刺', category: '穿刺' },
  { id: 'p10', name: '腹腔穿刺', category: '穿刺' },
  { id: 'p11', name: '関節穿刺', category: '穿刺' },
  { id: 'p12', name: '創傷処置', category: '外科的手技' },
  { id: 'p13', name: '縫合', category: '外科的手技' },
  { id: 'p14', name: '局所麻酔', category: '外科的手技' },
] as const

// ── カテゴリ一覧（UI用）──
export const SYMPTOM_CATEGORIES = ['全身', '神経・精神', '胸部', '腹部', '外因', '運動器', '泌尿器', '小児', '産婦人科'] as const
export const DISEASE_CATEGORIES = ['神経', '循環器', '呼吸器', '消化器', '腎・泌尿器', '外科・整形', '代謝・内分泌', '精神'] as const
export const PROCEDURE_CATEGORIES = ['気道管理', '救急', '採血・注射', 'カテーテル', '穿刺', '外科的手技'] as const

// ── 型定義 ──
export type EpocItemId = typeof EPOC_SYMPTOMS[number]['id'] | typeof EPOC_DISEASES[number]['id'] | typeof EPOC_PROCEDURES[number]['id']

export interface EpocData {
  symptoms: Record<string, boolean>   // s01〜s29
  diseases: Record<string, boolean>   // d01〜d26
  procedures: Record<string, boolean> // p01〜p14
}

export function createDefaultEpocData(): EpocData {
  const symptoms: Record<string, boolean> = {}
  const diseases: Record<string, boolean> = {}
  const procedures: Record<string, boolean> = {}
  EPOC_SYMPTOMS.forEach(s => { symptoms[s.id] = false })
  EPOC_DISEASES.forEach(d => { diseases[d.id] = false })
  EPOC_PROCEDURES.forEach(p => { procedures[p.id] = false })
  return { symptoms, diseases, procedures }
}
