#!/usr/bin/env python3
"""
Parse JRMP 2021-2025 中間公表 + 本番結果 PDFs.
Output: JSON with per-hospital, per-year data + multi-year average honmeiIndex.
"""
import fitz
import json
import re
import sys
from collections import defaultdict

PREFECTURES = {'北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'}

def parse_chukan(pdf_path):
    """Parse 中間公表: programId -> first_choice (same format all years)"""
    doc = fitz.open(pdf_path)
    results = {}
    for page in doc:
        lines = [l.strip() for l in page.get_text().split('\n') if l.strip()]
        i = 0
        while i < len(lines):
            if re.match(r'^03\d{7}$', lines[i]):
                prog_id = lines[i]
                j = i + 1
                while j < len(lines) and not re.match(r'^\d+$', lines[j]) and not re.match(r'^03\d{7}$', lines[j]) and lines[j] not in PREFECTURES:
                    j += 1
                cap = None
                if j < len(lines) and re.match(r'^\d+$', lines[j]):
                    cap = int(lines[j]); j += 1
                fc = None
                if j < len(lines) and re.match(r'^\d+$', lines[j]):
                    fc = int(lines[j]); j += 1
                if fc is not None:
                    results[prog_id] = fc
                i = j
            else:
                i += 1
    doc.close()
    return results

def parse_kekka(pdf_path):
    """Parse 本番結果: programId -> {hospital, capacity, matched, applicants}
    Handles both formats: ID on own line (2021) and ID+name on same line (2022+)"""
    doc = fitz.open(pdf_path)
    results = {}
    for page in doc:
        lines = [l.strip() for l in page.get_text().split('\n') if l.strip()]
        i = 0
        while i < len(lines):
            prog_id = None
            hospital = ''

            # Format 1: "030001801 市立函館病院" (2022+)
            m = re.match(r'^(03\d{7})\s+(.+)$', lines[i])
            if m:
                prog_id = m.group(1)
                hospital = m.group(2)
            # Format 2: "030001601" alone (2021)
            elif re.match(r'^03\d{7}$', lines[i]):
                prog_id = lines[i]
                # Next line is hospital name
                if i+1 < len(lines) and not re.match(r'^\d', lines[i+1]) and lines[i+1] not in PREFECTURES:
                    hospital = lines[i+1]

            if prog_id:
                j = i + 1
                # Skip hospital name if format 2
                if not m and j < len(lines) and not re.match(r'^\d', lines[j]) and lines[j] not in PREFECTURES:
                    j += 1
                # Skip program name
                while j < len(lines) and not re.match(r'^\d', lines[j]) and not re.match(r'^03\d{7}', lines[j]) and lines[j] not in PREFECTURES:
                    j += 1
                # Collect numbers
                numbers = []
                while j < len(lines):
                    nums = re.findall(r'\d+', lines[j])
                    if nums and not re.match(r'^03\d{7}', lines[j]) and lines[j] not in PREFECTURES:
                        numbers.extend([int(n) for n in nums])
                        j += 1
                    else:
                        break
                if len(numbers) >= 2:
                    results[prog_id] = {
                        'hospital': hospital,
                        'capacity': numbers[0],
                        'matched': numbers[1],
                        'applicants': numbers[-1] if len(numbers) >= 3 else numbers[1]
                    }
                i = j
            else:
                i += 1
    doc.close()
    return results

# Process all years
all_years = {}
for year in [2021, 2022, 2023, 2024, 2025]:
    if year == 2025:
        chukan_path = '/Users/tasuku/.claude/projects/-Users-tasuku-Desktop-iwor/c03d09f7-f3bb-4c34-b95e-3def7861661b/tool-results/webfetch-1774671731060-92b4id.pdf'
        kekka_path = '/Users/tasuku/.claude/projects/-Users-tasuku-Desktop-iwor/c03d09f7-f3bb-4c34-b95e-3def7861661b/tool-results/webfetch-1774671918030-6r1nsm.pdf'
    else:
        chukan_path = f'/tmp/jrmp_{year}_chukan.pdf'
        kekka_path = f'/tmp/jrmp_{year}_kekka.pdf'

    print(f"Parsing {year}...", file=sys.stderr)
    chukan = parse_chukan(chukan_path)
    kekka = parse_kekka(kekka_path)
    print(f"  chukan: {len(chukan)}, kekka: {len(kekka)}", file=sys.stderr)

    matched = 0
    for prog_id, k in kekka.items():
        fc = chukan.get(prog_id)
        app = k['applicants']
        honmei = round(fc / app, 2) if fc and app > 0 and fc / app <= 1.0 else None
        k['first_choice'] = fc
        k['honmeiIndex'] = honmei
        k['year'] = year
        if honmei is not None:
            matched += 1

    all_years[year] = kekka
    print(f"  honmeiIndex calculated: {matched}", file=sys.stderr)

# Group by hospital name for multi-year analysis
hospital_years = defaultdict(lambda: defaultdict(dict))
for year, programs in all_years.items():
    for prog_id, info in programs.items():
        name = info['hospital']
        hospital_years[name][year] = {
            'programId': prog_id,
            'capacity': info['capacity'],
            'matched': info['matched'],
            'applicants': info['applicants'],
            'first_choice': info.get('first_choice'),
            'honmeiIndex': info.get('honmeiIndex'),
        }

# Calculate multi-year average honmeiIndex per hospital (using max-capacity program)
summary = {}
for name, years_data in hospital_years.items():
    # Use the most recent year's max-capacity program as the "main" program
    all_honmei = []
    all_applicants = []
    all_capacity = []
    all_matched = []
    yearly = {}

    for year in sorted(years_data.keys()):
        d = years_data[year]
        yearly[year] = {
            'cap': d['capacity'],
            'app': d['applicants'],
            'matched': d['matched'],
            'fc': d['first_choice'],
            'honmei': d['honmeiIndex'],
            'bairitsu': round(d['applicants'] / d['capacity'], 1) if d['capacity'] > 0 else 0,
            'matchRate': round(d['matched'] / d['capacity'] * 100) if d['capacity'] > 0 else 0,
        }
        if d['honmeiIndex'] is not None:
            all_honmei.append(d['honmeiIndex'])
        all_applicants.append(d['applicants'])
        all_capacity.append(d['capacity'])
        all_matched.append(d['matched'])

    avg_honmei = round(sum(all_honmei) / len(all_honmei), 2) if all_honmei else None
    summary[name] = {
        'avgHonmeiIndex': avg_honmei,
        'yearsWithData': len(all_honmei),
        'yearly': yearly
    }

# Print summary for key hospitals
targets = ['倉敷中央','聖隷浜松','手稲渓仁会','京都第二赤十字','天理よろづ','聖路加','亀田','沖縄県立中部','虎の門病院','武蔵野赤十字','三井記念','慶應義塾大学病院','東京大学医学部附属']
print("\n=== Key Hospitals Multi-Year ===", file=sys.stderr)
for t in targets:
    for name, s in summary.items():
        if t in name:
            print(f"\n{name}: avgHonmei={s['avgHonmeiIndex']} ({s['yearsWithData']}yr)", file=sys.stderr)
            for y, d in sorted(s['yearly'].items()):
                print(f"  {y}: cap={d['cap']} app={d['app']} honmei={d['honmei']} bairitsu={d['bairitsu']} matchRate={d['matchRate']}%", file=sys.stderr)
            break

# Output full summary as JSON
print(json.dumps(summary, ensure_ascii=False))
