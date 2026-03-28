#!/usr/bin/env python3
"""
Parse JRMP 2021-2025 PDFs → multi-year hospital data with correct main-program matching.
"""
import fitz, json, re, sys
from collections import defaultdict

PREFECTURES = {'北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'}

def parse_chukan(pdf_path):
    doc = fitz.open(pdf_path)
    results = {}
    for page in doc:
        lines = [l.strip() for l in page.get_text().split('\n') if l.strip()]
        i = 0
        while i < len(lines):
            if re.match(r'^03\d{7}$', lines[i]):
                prog_id = lines[i]; j = i + 1
                hospital = ''
                if j < len(lines) and not re.match(r'^\d+$', lines[j]) and lines[j] not in PREFECTURES:
                    hospital = lines[j]; j += 1
                while j < len(lines) and not re.match(r'^\d+$', lines[j]) and not re.match(r'^03\d{7}$', lines[j]) and lines[j] not in PREFECTURES:
                    j += 1
                cap = int(lines[j]) if j < len(lines) and re.match(r'^\d+$', lines[j]) else None; j += (1 if cap else 0)
                fc = int(lines[j]) if j < len(lines) and re.match(r'^\d+$', lines[j]) else None; j += (1 if fc else 0)
                if fc is not None:
                    results[prog_id] = {'hospital': hospital, 'capacity': cap, 'first_choice': fc}
                i = j
            else:
                i += 1
    doc.close()
    return results

def parse_kekka(pdf_path):
    doc = fitz.open(pdf_path)
    results = {}
    for page in doc:
        lines = [l.strip() for l in page.get_text().split('\n') if l.strip()]
        i = 0
        while i < len(lines):
            prog_id = None; hospital = ''
            m = re.match(r'^(03\d{7})\s+(.+)$', lines[i])
            if m:
                prog_id = m.group(1); hospital = m.group(2)
            elif re.match(r'^03\d{7}$', lines[i]):
                prog_id = lines[i]
                if i+1 < len(lines) and not re.match(r'^\d', lines[i+1]) and lines[i+1] not in PREFECTURES:
                    hospital = lines[i+1]
            if prog_id:
                j = i + 1
                if not m and j < len(lines) and not re.match(r'^\d', lines[j]) and lines[j] not in PREFECTURES:
                    j += 1
                while j < len(lines) and not re.match(r'^\d', lines[j]) and not re.match(r'^03\d{7}', lines[j]) and lines[j] not in PREFECTURES:
                    j += 1
                numbers = []
                while j < len(lines):
                    nums = re.findall(r'\d+', lines[j])
                    if nums and not re.match(r'^03\d{7}', lines[j]) and lines[j] not in PREFECTURES:
                        numbers.extend([int(n) for n in nums]); j += 1
                    else:
                        break
                if len(numbers) >= 2:
                    results[prog_id] = {'hospital': hospital, 'capacity': numbers[0], 'matched': numbers[1], 'applicants': numbers[-1] if len(numbers) >= 3 else numbers[1]}
                i = j
            else:
                i += 1
    doc.close()
    return results

# Parse all years
yearly_programs = {}  # year -> {prog_id -> {hospital, capacity, matched, applicants, first_choice, honmeiIndex}}
for year in [2021, 2022, 2023, 2024, 2025]:
    if year == 2025:
        cp = '/Users/tasuku/.claude/projects/-Users-tasuku-Desktop-iwor/c03d09f7-f3bb-4c34-b95e-3def7861661b/tool-results/webfetch-1774671731060-92b4id.pdf'
        kp = '/Users/tasuku/.claude/projects/-Users-tasuku-Desktop-iwor/c03d09f7-f3bb-4c34-b95e-3def7861661b/tool-results/webfetch-1774671918030-6r1nsm.pdf'
    else:
        cp = f'/tmp/jrmp_{year}_chukan.pdf'; kp = f'/tmp/jrmp_{year}_kekka.pdf'
    print(f"Parsing {year}...", file=sys.stderr)
    chukan = parse_chukan(cp); kekka = parse_kekka(kp)
    merged = {}
    for pid, k in kekka.items():
        c = chukan.get(pid, {})
        fc = c.get('first_choice')
        app = k['applicants']
        honmei = round(fc / app, 2) if fc and app > 0 and fc / app <= 1.0 else None
        merged[pid] = {**k, 'first_choice': fc, 'honmeiIndex': honmei}
    yearly_programs[year] = merged
    print(f"  kekka={len(kekka)} honmei={sum(1 for v in merged.values() if v['honmeiIndex'])}", file=sys.stderr)

# Group ALL programs by hospital name, across all years
# Then for each hospital+year, pick the MAIN program (largest capacity)
hospital_all = defaultdict(lambda: defaultdict(list))  # hospital -> year -> [programs]
for year, programs in yearly_programs.items():
    for pid, info in programs.items():
        hospital_all[info['hospital']][year].append({**info, 'programId': pid})

# For each hospital, pick main program per year (max capacity)
summary = {}
for name, years in hospital_all.items():
    yearly = {}
    all_honmei = []
    for year in sorted(years.keys()):
        progs = years[year]
        main = max(progs, key=lambda p: p['capacity'])
        d = {
            'programId': main['programId'],
            'cap': main['capacity'],
            'matched': main['matched'],
            'app': main['applicants'],
            'fc': main.get('first_choice'),
            'honmei': main.get('honmeiIndex'),
            'bairitsu': round(main['applicants'] / main['capacity'], 1) if main['capacity'] > 0 else 0,
            'matchRate': round(main['matched'] / main['capacity'] * 100) if main['capacity'] > 0 else 0,
        }
        yearly[str(year)] = d
        if d['honmei'] is not None:
            all_honmei.append(d['honmei'])
    summary[name] = {
        'avgHonmeiIndex': round(sum(all_honmei) / len(all_honmei), 2) if all_honmei else None,
        'yearsWithData': len(all_honmei),
        'yearly': yearly
    }

# Verify key hospitals
targets = ['虎の門病院','聖路加国際病院','亀田総合病院','沖縄県立中部病院','倉敷中央病院','天理よろづ','武蔵野赤十字','三井記念','慶應義塾大学病院','手稲渓仁会','聖隷浜松','京都第二赤十字']
print("\n=== Key Hospitals (main program per year) ===", file=sys.stderr)
for t in targets:
    for name, s in summary.items():
        if t in name:
            print(f"\n{name}: avgHonmei={s['avgHonmeiIndex']} ({s['yearsWithData']}yr)", file=sys.stderr)
            for y, d in sorted(s['yearly'].items()):
                print(f"  {y}: cap={d['cap']} app={d['app']} fc={d['fc']} honmei={d['honmei']} bairitsu={d['bairitsu']}", file=sys.stderr)
            break

print(json.dumps(summary, ensure_ascii=False))
