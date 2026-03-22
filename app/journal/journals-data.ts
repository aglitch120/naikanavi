// ── Journal database with Impact Factors (2024 JCR) ──

export interface Journal {
  id: string
  name: string
  shortName: string
  issn: string         // for PubMed search
  impactFactor: number // 2024 JCR
  category: 'top4' | 'general' | 'specialty' | 'japanese'
  specialty?: string
  lang?: 'en' | 'ja'
}

// Top 4 + major medical journals
export const JOURNALS: Journal[] = [
  // ── Top 4 (Big 4 General Medical) ──
  { id: 'lancet', name: 'The Lancet', shortName: 'Lancet', issn: '0140-6736', impactFactor: 98.4, category: 'top4' },
  { id: 'nejm', name: 'New England Journal of Medicine', shortName: 'NEJM', issn: '0028-4793', impactFactor: 78.5, category: 'top4' },
  { id: 'jama', name: 'JAMA', shortName: 'JAMA', issn: '0098-7484', impactFactor: 55.0, category: 'top4' },
  { id: 'bmj', name: 'The BMJ', shortName: 'BMJ', issn: '0959-8138', impactFactor: 42.7, category: 'top4' },

  // ── General / Internal Medicine ──
  { id: 'nat-med', name: 'Nature Medicine', shortName: 'Nat Med', issn: '1078-8956', impactFactor: 82.9, category: 'general' },
  { id: 'ann-intern', name: 'Annals of Internal Medicine', shortName: 'Ann Intern Med', issn: '0003-4819', impactFactor: 39.2, category: 'general' },
  { id: 'lancet-dig', name: 'Lancet Digital Health', shortName: 'Lancet Dig Health', issn: '2589-7500', impactFactor: 23.8, category: 'general' },
  { id: 'jama-intern', name: 'JAMA Internal Medicine', shortName: 'JAMA Intern Med', issn: '2168-6106', impactFactor: 39.2, category: 'general' },
  { id: 'plos-med', name: 'PLOS Medicine', shortName: 'PLOS Med', issn: '1549-1676', impactFactor: 15.8, category: 'general' },

  // ── Cardiology ──
  { id: 'jacc', name: 'Journal of the American College of Cardiology', shortName: 'JACC', issn: '0735-1097', impactFactor: 21.7, category: 'specialty', specialty: '循環器' },
  { id: 'eur-heart', name: 'European Heart Journal', shortName: 'Eur Heart J', issn: '0195-668X', impactFactor: 37.6, category: 'specialty', specialty: '循環器' },
  { id: 'circulation', name: 'Circulation', shortName: 'Circulation', issn: '0009-7322', impactFactor: 35.5, category: 'specialty', specialty: '循環器' },

  // ── Oncology ──
  { id: 'jco', name: 'Journal of Clinical Oncology', shortName: 'JCO', issn: '0732-183X', impactFactor: 42.1, category: 'specialty', specialty: '腫瘍' },
  { id: 'lancet-onc', name: 'Lancet Oncology', shortName: 'Lancet Oncol', issn: '1470-2045', impactFactor: 41.3, category: 'specialty', specialty: '腫瘍' },

  // ── Respiratory ──
  { id: 'lancet-resp', name: 'Lancet Respiratory Medicine', shortName: 'Lancet Respir Med', issn: '2213-2600', impactFactor: 38.9, category: 'specialty', specialty: '呼吸器' },
  { id: 'ajrccm', name: 'American Journal of Respiratory and Critical Care Medicine', shortName: 'AJRCCM', issn: '1073-449X', impactFactor: 19.3, category: 'specialty', specialty: '呼吸器' },

  // ── Infectious Disease ──
  { id: 'lancet-id', name: 'Lancet Infectious Diseases', shortName: 'Lancet Infect Dis', issn: '1473-3099', impactFactor: 36.4, category: 'specialty', specialty: '感染症' },
  { id: 'cid', name: 'Clinical Infectious Diseases', shortName: 'CID', issn: '1058-4838', impactFactor: 11.8, category: 'specialty', specialty: '感染症' },

  // ── Gastroenterology ──
  { id: 'gastro', name: 'Gastroenterology', shortName: 'Gastroenterology', issn: '0016-5085', impactFactor: 25.7, category: 'specialty', specialty: '消化器' },
  { id: 'hepatology', name: 'Hepatology', shortName: 'Hepatology', issn: '0270-9139', impactFactor: 12.9, category: 'specialty', specialty: '消化器' },

  // ── Nephrology ──
  { id: 'jasn', name: 'Journal of the American Society of Nephrology', shortName: 'JASN', issn: '1046-6673', impactFactor: 10.3, category: 'specialty', specialty: '腎臓' },
  { id: 'kid-int', name: 'Kidney International', shortName: 'Kidney Int', issn: '0085-2538', impactFactor: 14.8, category: 'specialty', specialty: '腎臓' },

  // ── Neurology ──
  { id: 'lancet-neuro', name: 'Lancet Neurology', shortName: 'Lancet Neurol', issn: '1474-4422', impactFactor: 46.3, category: 'specialty', specialty: '神経' },
  { id: 'neurology', name: 'Neurology', shortName: 'Neurology', issn: '0028-3878', impactFactor: 8.8, category: 'specialty', specialty: '神経' },

  // ── Critical Care ──
  { id: 'ccm', name: 'Critical Care Medicine', shortName: 'Crit Care Med', issn: '0090-3493', impactFactor: 7.7, category: 'specialty', specialty: '集中治療' },
  { id: 'intensive-care', name: 'Intensive Care Medicine', shortName: 'Intensive Care Med', issn: '0342-4642', impactFactor: 27.1, category: 'specialty', specialty: '集中治療' },

  // ── Endocrinology ──
  { id: 'diabetes-care', name: 'Diabetes Care', shortName: 'Diabetes Care', issn: '0149-5992', impactFactor: 14.8, category: 'specialty', specialty: '内分泌' },

  // ── Hematology ──
  { id: 'blood', name: 'Blood', shortName: 'Blood', issn: '0006-4971', impactFactor: 20.3, category: 'specialty', specialty: '血液' },

  // ── Rheumatology ──
  { id: 'ard', name: 'Annals of the Rheumatic Diseases', shortName: 'Ann Rheum Dis', issn: '0003-4967', impactFactor: 20.3, category: 'specialty', specialty: '膠原病' },

  // ── Endocrinology/Metabolism（追加） ──
  { id: 'jcem', name: 'Journal of Clinical Endocrinology & Metabolism', shortName: 'JCEM', issn: '0021-972X', impactFactor: 5.8, category: 'specialty', specialty: '内分泌' },
  { id: 'thyroid', name: 'Thyroid', shortName: 'Thyroid', issn: '1050-7256', impactFactor: 5.2, category: 'specialty', specialty: '内分泌' },

  // ── Dermatology ──
  { id: 'jaad', name: 'Journal of the American Academy of Dermatology', shortName: 'JAAD', issn: '0190-9622', impactFactor: 11.5, category: 'specialty', specialty: '皮膚科' },
  { id: 'bjd', name: 'British Journal of Dermatology', shortName: 'Br J Dermatol', issn: '0007-0963', impactFactor: 8.1, category: 'specialty', specialty: '皮膚科' },

  // ── Psychiatry ──
  { id: 'ajp', name: 'American Journal of Psychiatry', shortName: 'Am J Psychiatry', issn: '0002-953X', impactFactor: 13.4, category: 'specialty', specialty: '精神科' },
  { id: 'lancet-psych', name: 'Lancet Psychiatry', shortName: 'Lancet Psychiatry', issn: '2215-0366', impactFactor: 64.3, category: 'specialty', specialty: '精神科' },

  // ── Pediatrics ──
  { id: 'pediatrics', name: 'Pediatrics', shortName: 'Pediatrics', issn: '0031-4005', impactFactor: 8.0, category: 'specialty', specialty: '小児科' },
  { id: 'jpeds', name: 'Journal of Pediatrics', shortName: 'J Pediatr', issn: '0022-3476', impactFactor: 3.7, category: 'specialty', specialty: '小児科' },

  // ── Urology ──
  { id: 'eur-urol', name: 'European Urology', shortName: 'Eur Urol', issn: '0302-2838', impactFactor: 25.3, category: 'specialty', specialty: '泌尿器' },

  // ── Radiology ──
  { id: 'radiology', name: 'Radiology', shortName: 'Radiology', issn: '0033-8419', impactFactor: 12.1, category: 'specialty', specialty: '放射線' },

  // ── Anesthesiology ──
  { id: 'anesthesiology', name: 'Anesthesiology', shortName: 'Anesthesiology', issn: '0003-3022', impactFactor: 8.0, category: 'specialty', specialty: '麻酔科' },

  // ── Emergency ──
  { id: 'ann-emerg', name: 'Annals of Emergency Medicine', shortName: 'Ann Emerg Med', issn: '0196-0644', impactFactor: 5.6, category: 'specialty', specialty: '救急' },

  // ── Geriatrics ──
  { id: 'jags', name: 'Journal of the American Geriatrics Society', shortName: 'JAGS', issn: '0002-8614', impactFactor: 6.3, category: 'specialty', specialty: '老年病' },

  // ── Orthopedics ──
  { id: 'jbjs', name: 'Journal of Bone and Joint Surgery', shortName: 'JBJS', issn: '0021-9355', impactFactor: 5.3, category: 'specialty', specialty: '整形外科' },

  // ── Ophthalmology ──
  { id: 'ophthalmology', name: 'Ophthalmology', shortName: 'Ophthalmology', issn: '0161-6420', impactFactor: 13.7, category: 'specialty', specialty: '眼科' },

  // ── Japanese Journals（Worker API H-5 対応済み） ──
  { id: 'naika', name: '日本内科学会雑誌', shortName: '日本内科学会雑誌', issn: '0021-5384', impactFactor: 0.3, category: 'japanese', lang: 'ja' },
  { id: 'igaku-zasshi', name: '日本医事新報', shortName: '日本医事新報', issn: '0385-9215', impactFactor: 0.2, category: 'japanese', lang: 'ja' },
  { id: 'rinsho', name: '臨床雑誌内科', shortName: '臨床雑誌内科', issn: '0022-1961', impactFactor: 0.2, category: 'japanese', lang: 'ja' },
  { id: 'jjsem', name: '日本救急医学会雑誌', shortName: '日本救急医学会雑誌', issn: '0915-924X', impactFactor: 0.3, category: 'japanese', specialty: '救急', lang: 'ja' },
  { id: 'jsim', name: '日本集中治療医学会雑誌', shortName: '日本集中治療医学会雑誌', issn: '1340-7988', impactFactor: 0.3, category: 'japanese', specialty: '集中治療', lang: 'ja' },
  { id: 'circ-j', name: 'Circulation Journal', shortName: 'Circ J', issn: '1346-9843', impactFactor: 3.2, category: 'japanese', specialty: '循環器', lang: 'ja' },
  { id: 'jjc', name: '日本循環器学会誌', shortName: '日本循環器学会誌', issn: '0047-1828', impactFactor: 0.5, category: 'japanese', specialty: '循環器', lang: 'ja' },
  { id: 'jga', name: '日本消化器病学会雑誌', shortName: '日本消化器病学会雑誌', issn: '0446-6586', impactFactor: 0.3, category: 'japanese', specialty: '消化器', lang: 'ja' },
  { id: 'jjca', name: '日本癌学会誌', shortName: '日本癌学会誌', issn: '0021-4922', impactFactor: 0.5, category: 'japanese', specialty: '腫瘍', lang: 'ja' },
  { id: 'jpn-j-surg', name: '日本外科学会雑誌', shortName: '日本外科学会雑誌', issn: '0301-4894', impactFactor: 0.3, category: 'japanese', specialty: '外科', lang: 'ja' },
]

export const TOP4_IDS = ['lancet', 'nejm', 'jama', 'bmj']

export const SPECIALTIES = Array.from(new Set(JOURNALS.filter(j => j.specialty).map(j => j.specialty!)))

export const IF_RANGES = [
  { label: 'IF ≧ 50', min: 50 },
  { label: 'IF ≧ 30', min: 30 },
  { label: 'IF ≧ 20', min: 20 },
  { label: 'IF ≧ 10', min: 10 },
  { label: 'すべて', min: 0 },
]

// ── Guideline sources (日本の学会ガイドライン) ──

export interface GuidelineSource {
  id: string
  name: string
  nameShort: string
  specialty: string
  searchTerms: string[] // PubMed search terms for guidelines from this org
}

export const GUIDELINE_SOURCES: GuidelineSource[] = [
  { id: 'jcs', name: '日本循環器学会', nameShort: '循環器学会', specialty: '循環器', searchTerms: ['Japanese Circulation Society[Affiliation] AND guideline'] },
  { id: 'jas', name: '日本動脈硬化学会', nameShort: '動脈硬化学会', specialty: '循環器', searchTerms: ['Japan Atherosclerosis Society[Affiliation] AND guideline'] },
  { id: 'jcvs', name: '日本心臓血管外科学会', nameShort: '心臓外科学会', specialty: '循環器', searchTerms: ['Japanese Association for Thoracic Surgery[Affiliation] AND guideline'] },
  { id: 'jrs', name: '日本呼吸器学会', nameShort: '呼吸器学会', specialty: '呼吸器', searchTerms: ['Japanese Respiratory Society[Affiliation] AND guideline'] },
  { id: 'jsge', name: '日本消化器病学会', nameShort: '消化器学会', specialty: '消化器', searchTerms: ['Japanese Society of Gastroenterology[Affiliation] AND guideline'] },
  { id: 'jsn', name: '日本腎臓学会', nameShort: '腎臓学会', specialty: '腎臓', searchTerms: ['Japanese Society of Nephrology[Affiliation] AND guideline'] },
  { id: 'jsnp', name: '日本神経学会', nameShort: '神経学会', specialty: '神経', searchTerms: ['Japanese Society of Neurology[Affiliation] AND guideline'] },
  { id: 'jsh', name: '日本血液学会', nameShort: '血液学会', specialty: '血液', searchTerms: ['Japanese Society of Hematology[Affiliation] AND guideline'] },
  { id: 'jaid', name: '日本感染症学会', nameShort: '感染症学会', specialty: '感染症', searchTerms: ['Japanese Association for Infectious Diseases[Affiliation] AND guideline'] },
  { id: 'jds', name: '日本糖尿病学会', nameShort: '糖尿病学会', specialty: '内分泌', searchTerms: ['Japan Diabetes Society[Affiliation] AND guideline'] },
]
