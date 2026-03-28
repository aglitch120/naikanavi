#!/usr/bin/env node
/**
 * Apply multi-year average honmeiIndex from jrmp_all_years_v2.json to hospitals-data.ts.
 * Also adds yearlyData for trend graphs.
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const JRMP_FILE = '/tmp/jrmp_all_years_v2.json'
const HOSPITALS_FILE = resolve(ROOT, 'app/matching/hospitals-data.ts')

const jrmp = JSON.parse(readFileSync(JRMP_FILE, 'utf-8'))
let content = readFileSync(HOSPITALS_FILE, 'utf-8')

// Build name-based lookup (handle name variations like 亀田)
// Merge entries with similar names
const nameMap = {} // normalized name -> {avgHonmei, yearly}
for (const [name, info] of Object.entries(jrmp)) {
  // Normalize: remove legal entity prefixes
  let norm = name
    .replace(/^医療法人[^\s　]+[\s　]+/, '')
    .replace(/^社会医療法人[^\s　]+[\s　]+/, '')
    .replace(/^独立行政法人[^\s　]+[\s　]+/, '')
    .replace(/^地方独立行政法人[^\s　]+[\s　]+/, '')
    .replace(/^地域医療機能推進機構/, '')
    .replace(/^国立病院機構/, '')
    .trim()

  if (nameMap[norm]) {
    // Merge: combine yearly data
    for (const [y, d] of Object.entries(info.yearly)) {
      if (!nameMap[norm].yearly[y] || d.cap > nameMap[norm].yearly[y].cap) {
        nameMap[norm].yearly[y] = d
      }
    }
    // Recalculate average
    const honmeis = Object.values(nameMap[norm].yearly).map(d => d.honmei).filter(h => h != null)
    nameMap[norm].avgHonmeiIndex = honmeis.length ? Math.round(honmeis.reduce((a,b) => a+b, 0) / honmeis.length * 100) / 100 : null
    nameMap[norm].yearsWithData = honmeis.length
  } else {
    nameMap[norm] = { ...info, originalName: name }
  }
  // Also keep original name as key
  nameMap[name] = nameMap[norm]
}

// Match hospitals in hospitals-data.ts by name
const nameRegex = /name: '([^']+)'/g
const hospitalNames = new Set()
let m
while ((m = nameRegex.exec(content)) !== null) {
  hospitalNames.add(m[1])
}

let updated = 0
let addedYearly = 0

for (const hospitalName of hospitalNames) {
  // Try exact match, then partial match
  let jrmpEntry = nameMap[hospitalName]
  if (!jrmpEntry) {
    // Try partial match
    for (const [jName, info] of Object.entries(nameMap)) {
      if (hospitalName.includes(jName) || jName.includes(hospitalName)) {
        jrmpEntry = info
        break
      }
    }
  }
  if (!jrmpEntry || !jrmpEntry.avgHonmeiIndex) continue

  // Update honmeiIndex for this hospital's main program (find by name + largest capacity)
  // We update ALL programs of this hospital with the same avgHonmeiIndex
  const escName = hospitalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(name: '${escName}'[^}]*?honmeiIndex: )([0-9.]+)`, 'g')

  let replaced = false
  content = content.replace(regex, (match, prefix, oldVal) => {
    replaced = true
    return prefix + jrmpEntry.avgHonmeiIndex
  })
  if (replaced) updated++
}

// Save
writeFileSync(HOSPITALS_FILE, content, 'utf-8')
console.log(`Updated honmeiIndex: ${updated} hospitals with multi-year average`)

// Also save the yearly data as a separate JSON for UI trend graphs
const yearlyForUI = {}
for (const [name, info] of Object.entries(jrmp)) {
  if (Object.keys(info.yearly).length >= 2) {
    yearlyForUI[name] = info.yearly
  }
}
writeFileSync(resolve(ROOT, 'lib/hospital-yearly-data.json'), JSON.stringify(yearlyForUI), 'utf-8')
console.log(`Saved yearly data for ${Object.keys(yearlyForUI).length} hospitals → lib/hospital-yearly-data.json`)
