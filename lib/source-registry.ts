/**
 * source-registry.ts — 全ツールの出典情報の一元管理
 *
 * ルール:
 * 1. データは出典からの転記のみ。編集・解釈・レイアウト変更を一切しない
 * 2. 各データポイントに出典を紐づける
 * 3. 自動チェックスクリプト（scripts/verify-sources.mjs）がこのファイルと実装の一致を検証する
 */

import type { SourceInfo } from '@/components/tools/SourceCitation'

// ── 共通出典定義 ──

export const SOURCES = {
  // ガイドライン
  JAID_UTI_2019: {
    name: 'JAID/JSC感染症治療ガイド 2019',
    edition: '2019年版',
    url: 'https://www.kansensho.or.jp/modules/guidelines/',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  IDSA_CAP_2019: {
    name: 'ATS/IDSA Community-Acquired Pneumonia Guideline',
    edition: '2019',
    section: 'Am J Respir Crit Care Med 2019;200(7):e45-e67',
    url: 'https://doi.org/10.1164/rccm.201908-1581ST',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  SSCG_2021: {
    name: 'Surviving Sepsis Campaign Guidelines 2021',
    edition: '2021',
    section: 'Crit Care Med 2021;49(11):e1063-e1143',
    url: 'https://doi.org/10.1097/CCM.0000000000005337',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  SANFORD_2025: {
    name: 'サンフォード感染症治療ガイド',
    edition: '2025年版',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  PERIOP_GUIDELINE_2022: {
    name: '日本循環器学会 非心臓手術における合併心疾患の評価と管理に関するガイドライン',
    edition: '2022年改訂版',
    url: 'https://www.j-circ.or.jp/guideline/',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  ESC_PERIOP_2022: {
    name: 'ESC Guidelines on cardiovascular assessment and management of patients undergoing non-cardiac surgery',
    edition: '2022',
    url: 'https://doi.org/10.1093/eurheartj/ehac270',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  STEROID_COVER_BJA_2012: {
    name: 'Perioperative corticosteroid supplementation (BJA Education)',
    edition: '2012',
    section: 'Br J Anaesth 2012;12(3):101-106',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  OPIOID_EQUIV_UPTODATE: {
    name: 'UpToDate: Cancer pain management with opioids: Optimizing analgesia',
    edition: '2025年アクセス',
    section: 'Table: Opioid equianalgesic doses',
    url: 'https://www.uptodate.com/',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  NA_CORRECTION_AAFP: {
    name: 'Hyponatremia: Evaluation and Treatment (Am Fam Physician)',
    edition: '2014',
    section: 'Am Fam Physician 2014;89(4):299-307',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  NA_CORRECTION_NEJM_2015: {
    name: 'Diagnosis and Treatment of Hyponatremia (NEJM)',
    edition: '2015',
    section: 'N Engl J Med 2015;372:55-65',
    url: 'https://doi.org/10.1056/NEJMra1404489',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  FIO2_TABLE_STANDARD: {
    name: '酸素療法マニュアル（日本呼吸器学会）',
    edition: '2017年改訂版',
    url: 'https://www.jrs.or.jp/',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  PMDA_PACKAGE_INSERT: {
    name: '医薬品医療機器総合機構（PMDA）添付文書',
    url: 'https://www.pmda.go.jp/PmdaSearch/iyakuSearch/',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  GAMMA_HANDBOOK_ICU: {
    name: 'ICUブック 第4版（Marino)',
    edition: '日本語版 2015',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  RENAL_DOSE_SANFORD: {
    name: 'サンフォード感染症治療ガイド — 腎機能別用量調整表',
    edition: '2025年版',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  IDSA_FN_2010: {
    name: 'IDSA Clinical Practice Guideline for Febrile Neutropenia',
    edition: '2010',
    section: 'Clin Infect Dis 2011;52(4):e56-e93',
    url: 'https://doi.org/10.1093/cid/cir073',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
  IDSA_MENINGITIS_2004: {
    name: 'IDSA Practice Guidelines for Bacterial Meningitis',
    edition: '2004',
    section: 'Clin Infect Dis 2004;39(9):1267-1284',
    transcribedAt: '2026-03-20',
    lastVerifiedAt: '2026-03-20',
  },
} as const satisfies Record<string, SourceInfo>

// ── ツール別出典マッピング ──

export type ToolSourceMap = Record<string, SourceInfo[]>

export const TOOL_SOURCES: ToolSourceMap = {
  // γ計算
  'icu-gamma-calc': [
    SOURCES.GAMMA_HANDBOOK_ICU,
    SOURCES.SSCG_2021,
    SOURCES.PMDA_PACKAGE_INSERT,
  ],
  // 腎機能別抗菌薬用量
  'renal-dose-abx': [
    SOURCES.RENAL_DOSE_SANFORD,
    SOURCES.PMDA_PACKAGE_INSERT,
  ],
  // 抗菌薬スペクトラム＋エンピリック治療
  'antibiotics': [
    SOURCES.SANFORD_2025,
    SOURCES.JAID_UTI_2019,
    SOURCES.IDSA_CAP_2019,
    SOURCES.SSCG_2021,
    SOURCES.IDSA_FN_2010,
    SOURCES.IDSA_MENINGITIS_2004,
  ],
  // ステロイドカバー
  'steroid-cover': [
    SOURCES.STEROID_COVER_BJA_2012,
  ],
  // 術前休薬
  'preop-drugs': [
    SOURCES.PERIOP_GUIDELINE_2022,
    SOURCES.ESC_PERIOP_2022,
  ],
  // Na補正速度
  'na-correction-rate': [
    SOURCES.NA_CORRECTION_NEJM_2015,
    SOURCES.NA_CORRECTION_AAFP,
  ],
  // オピオイド換算
  'opioid-conversion': [
    SOURCES.OPIOID_EQUIV_UPTODATE,
    SOURCES.PMDA_PACKAGE_INSERT,
  ],
  // FiO2換算表
  'fio2-table': [
    SOURCES.FIO2_TABLE_STANDARD,
  ],
}
