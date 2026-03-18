// ── Journal database with Impact Factors (2024 JCR) ──

export interface Journal {
  id: string
  name: string
  shortName: string
  issn: string         // for PubMed search
  impactFactor: number // 2024 JCR
  category: 'top4' | 'general' | 'specialty'
  specialty?: string
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
