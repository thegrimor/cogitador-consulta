#!/usr/bin/env node
// Renders a PDF page range to PNG (poppler's pdftoppm) and OCRs each page (tesseract),
// writing one combined .txt with page markers. Built for reading Games Workshop codex/faction
// pack PDFs whose datasheet pages have a corrupted embedded font -- pdftotext produces garbage
// there (confirmed on the 11th-ed Orks codex; wrong output identical across -layout/-raw/plain
// modes) because the font's own glyph-to-Unicode mapping is broken, not because of a layout
// quirk pdftotext gets wrong. OCR reads the *rendered pixels* instead, so it doesn't care that
// the text layer is broken.
//
// Usage:
//   node render-and-ocr.mjs "path/to/book.pdf" <firstPage> <lastPage> [outDir]
//
// Output: <outDir>/ocr-<first>-<last>.txt, plus the intermediate page-NNN.png files (kept,
// so you can re-run OCR with different settings, or view a page directly, without re-rendering).
//
// Read scripts/pdf-codex-tools/README.md before using this on a new book -- it explains what
// OCR is (and is not) reliable for, and the recommended workflow.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const [, , pdfPath, firstArg, lastArg, outDirArg] = process.argv
if (!pdfPath || !firstArg || !lastArg) {
  console.error('Usage: node render-and-ocr.mjs <pdf> <firstPage> <lastPage> [outDir]')
  process.exit(1)
}
const first = Number(firstArg), last = Number(lastArg)
const outDir = outDirArg || path.join(path.dirname(pdfPath), 'ocr-out')
fs.mkdirSync(outDir, { recursive: true })

// Prefer PATH; fall back to the well-known winget install locations (as of writing) so this
// works right after `winget install` in the same session, before a shell restart puts them on
// PATH for real.
function findExe(exeName, wingetParentGlob) {
  try { execFileSync('where', [exeName], { stdio: 'ignore' }); return exeName } catch {}
  const local = process.env.LOCALAPPDATA || ''
  const parentDir = path.join(local, path.dirname(wingetParentGlob))
  const globPrefix = path.basename(wingetParentGlob) // e.g. "poppler-*"
  if (fs.existsSync(parentDir)) {
    const match = fs.readdirSync(parentDir).find(f => globPrefix.includes('*')
      ? f.startsWith(globPrefix.split('*')[0]) : f === globPrefix)
    if (match) {
      const candidate = path.join(parentDir, match, 'Library', 'bin', exeName)
      if (fs.existsSync(candidate)) return candidate
    }
  }
  throw new Error(`${exeName} not found on PATH and no fallback matched -- install it (see README) and/or fix findExe()'s guess for your machine.`)
}
const pdftoppm = findExe('pdftoppm.exe', 'Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-*')
const tesseract = (() => {
  try { execFileSync('where', ['tesseract.exe'], { stdio: 'ignore' }); return 'tesseract.exe' } catch {}
  const guess = path.join(process.env.LOCALAPPDATA || '', 'Tesseract-OCR', 'tesseract.exe')
  if (fs.existsSync(guess)) return guess
  throw new Error('tesseract.exe not found on PATH or at the default winget install path -- install it (see README).')
})()

console.log('pdftoppm:', pdftoppm)
console.log('tesseract:', tesseract)

const prefix = path.join(outDir, 'page')
console.log(`Rendering pages ${first}-${last} at 200dpi...`)
execFileSync(pdftoppm, ['-png', '-r', '200', '-f', String(first), '-l', String(last), pdfPath, prefix])

let combined = ''
for (let p = first; p <= last; p++) {
  // pdftoppm zero-pads to the width of the largest page number in the range.
  const width = String(last).length
  const png = `${prefix}-${String(p).padStart(width, '0')}.png`
  if (!fs.existsSync(png)) { console.warn('missing render for page', p, '-- skipping'); continue }
  process.stdout.write(`OCR page ${p}... `)
  const txtBase = png.replace(/\.png$/, '')
  execFileSync(tesseract, [png, txtBase])
  const text = fs.readFileSync(txtBase + '.txt', 'utf8')
  combined += `\n\n===== PAGE ${p} (${path.basename(png)}) =====\n\n${text}`
  console.log('done')
}

const outFile = path.join(outDir, `ocr-${first}-${last}.txt`)
fs.writeFileSync(outFile, combined)
console.log('\nWrote', outFile)
console.log('Read it with the Read tool / grep before trusting it -- OCR misreads numbers and')
console.log('mangles table alignment on dense pages. See README for the recommended workflow.')
