/**
 * Verifica el JSON generado por generate-faction-data.ts sin fiarse de la misma pasada:
 *  1. Regenera todo en un directorio temporal y compara byte a byte contra lo ya escrito
 *     en public/data — confirma que la generación es determinista.
 *  2. Reconstruye cada Weapon completo a partir de los campos base + `rules` recortados
 *     del JSON y lo compara contra parseWeapon() aplicado a la fila CSV original — confirma
 *     que recortar los valores por defecto de `rules` no pierde ningún dato real.
 *  3. Comprueba que las 78 reglas de modifiers.ts con factionId=AC quedaron todas contabilizadas
 *     (fusionadas en algún sitio o en la lista de fallback — ninguna se pierde en silencio).
 *
 * Usage: npm run verify:faction-data
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsvRaw, parseWeapon } from '../src/infrastructure/data/csvParsers'
import type { RawDatasheetWargear, Weapon } from '../src/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'public', 'data')

const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), 'faction-data-verify-'))
process.env.FACTION_DATA_OUT_DIR = tmpOut
process.env.FACTION_DATA_REPORT_DIR = path.join(tmpOut, 'reports')

const errors: string[] = []

async function main() {
  const generated = await import('./generate-faction-data.ts')
  const { acSlug, acDatasheets, datasheetSlugByOldId, report } = generated

  // 1. Regeneración determinista: comparar árbol regenerado contra el ya commiteado.
  const committedFactionPath = path.join(DATA_DIR, 'factions', `${acSlug}.json`)
  const freshFactionPath = path.join(tmpOut, 'factions', `${acSlug}.json`)
  const committed = JSON.parse(fs.readFileSync(committedFactionPath, 'utf-8'))
  const fresh = JSON.parse(fs.readFileSync(freshFactionPath, 'utf-8'))
  if (JSON.stringify(committed) !== JSON.stringify(fresh)) {
    errors.push('El JSON de facción regenerado difiere del que hay en public/data/factions — la generación no es determinista.')
  } else {
    console.log('✓ Regeneración determinista: el JSON coincide byte a byte.')
  }

  for (const catalogFile of ['factions.json', 'core-rules.json']) {
    const a = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'catalog', catalogFile), 'utf-8'))
    const b = JSON.parse(fs.readFileSync(path.join(tmpOut, 'catalog', catalogFile), 'utf-8'))
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      errors.push(`catalog/${catalogFile} difiere entre la versión commiteada y la regenerada.`)
    }
  }

  // 2. Round-trip de reglas de arma: reconstruir Weapon completo desde el JSON y comparar
  //    contra parseWeapon() aplicado directamente a la fila CSV original.
  const wargearRows = parseCsvRaw(
    fs.readFileSync(path.join(DATA_DIR, 'Datasheets_wargear.csv'), 'utf-8'),
  ) as unknown as RawDatasheetWargear[]

  const WEAPON_RULE_DEFAULTS: Omit<Weapon, 'line' | 'name' | 'description' | 'range' | 'type' | 'A' | 'bsWs' | 'S' | 'AP' | 'D'> = {
    isTorrent: false, isBlast: false, isDevastatingWounds: false, isLethalHits: false, isHeavy: false,
    isTwinLinked: false, isMelta: false, meltaValue: 0, cleaveValue: 0, sustainedHitsValue: 0, antiEntries: [],
    isIgnoresCover: false, isHazardous: false, isAssault: false, isPistol: false, isPsychic: false,
    isPrecision: false, isOneShot: false, isIndirectFire: false, isExtraAttacks: false, isLance: false,
    isConversion: false, rapidFireValue: '',
  }

  let weaponsChecked = 0
  for (const ds of acDatasheets) {
    const slug = datasheetSlugByOldId.get(ds.id)
    const jsonDs = committed.datasheets.find((d: { id: string }) => d.id === slug)
    if (!jsonDs) { errors.push(`Datasheet "${ds.name}" (${ds.id}) no aparece en el JSON con slug "${slug}".`); continue }

    const rawRows = wargearRows.filter(r => r.datasheet_id === ds.id).sort((a, b) => parseInt(a.line) - parseInt(b.line))
    if (rawRows.length !== jsonDs.weapons.length) {
      errors.push(`"${ds.name}": ${rawRows.length} armas en CSV vs ${jsonDs.weapons.length} en JSON.`)
      continue
    }
    rawRows.forEach((raw, i) => {
      const expected = parseWeapon(raw)
      const jsonWeapon = jsonDs.weapons[i]
      const reconstructed: Weapon = {
        line: jsonWeapon.line, name: jsonWeapon.name, description: jsonWeapon.description,
        range: jsonWeapon.range, type: jsonWeapon.type, A: jsonWeapon.A, bsWs: jsonWeapon.bsWs,
        S: jsonWeapon.S, AP: jsonWeapon.AP, D: jsonWeapon.D,
        ...WEAPON_RULE_DEFAULTS,
        ...jsonWeapon.rules,
      }
      weaponsChecked++
      const expectedKeys = Object.keys(expected) as (keyof Weapon)[]
      for (const key of expectedKeys) {
        const a = JSON.stringify(expected[key])
        const b = JSON.stringify(reconstructed[key])
        if (a !== b) errors.push(`"${ds.name}" arma "${raw.name}" (línea ${raw.line}): campo "${key}" esperado ${a}, reconstruido ${b}.`)
      }
    })
  }
  console.log(`✓ Armas comprobadas (reconstrucción rules -> Weapon completo): ${weaponsChecked}`)

  // 3. Invariante de conteo de modifiers.ts: cada regla con factionId=AC debe quedar fusionada
  //    en algún sitio o registrada como fallback — ninguna desaparece en silencio.
  const merged = report.mergedIntoAbility.length + report.mergedIntoDetachmentAbility.length
    + report.mergedIntoStratagem.length + report.mergedIntoEnhancement.length + report.mergedIntoArmyRule.length
  const accountedFor = merged + report.fallback.length + report.excludedGameMode.length
  if (accountedFor !== report.totalConsidered) {
    errors.push(`Invariante de conteo roto: ${report.totalConsidered} reglas de modifiers.ts consideradas, pero solo ${accountedFor} contabilizadas (fusionadas + fallback + excluidas por modo de juego).`)
  } else {
    console.log(`✓ Invariante de conteo: ${report.totalConsidered} reglas de modifiers.ts (AC) todas contabilizadas (${merged} fusionadas, ${report.fallback.length} en fallback, ${report.excludedGameMode.length} excluidas por modo de juego).`)
  }

  fs.rmSync(tmpOut, { recursive: true, force: true })

  if (errors.length) {
    console.log(`\n✗ ${errors.length} discrepancia(s):`)
    errors.forEach(e => console.log(`  - ${e}`))
    process.exitCode = 1
  } else {
    console.log('\n✓ Sin discrepancias de datos entre el JSON generado y el pipeline CSV actual.')
  }
}

main()
