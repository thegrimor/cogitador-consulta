#!/usr/bin/env python3
"""Extracts a PDF page range's plain text layer to one combined .txt, page-marked.

For the pages where the PDF's real text layer isn't broken (rules prose: army rules,
detachments, stratagems, enhancements -- see README.md in this folder), this is the cheap path:
no rendering, no OCR, just reading the text layer directly. It's the Python equivalent of what
the README describes doing with `pdftotext` by hand, wired up here because neither `pdftotext`
nor any PDF-text python package was preinstalled in this environment (one-time
`pip install pymupdf` below -- pure-Python wheel, no poppler/tesseract system install needed).

Datasheet pages using GW's broken embedded font (confirmed on the 11th-ed Orks codex) will NOT
extract correctly here -- this script can't fix that, only detect it. For those, fall back to
render-and-ocr.mjs in this same folder. Read README.md before trusting this tool on a new book.

Usage:
  npm run extract-pdf:install   # one-time
  npm run extract-pdf -- "path/to/book.pdf" <firstPage> <lastPage> [outFile]
  # or directly: pip install -r requirements.txt && python3 extract-text.py "path/to/book.pdf" <firstPage> <lastPage> [outFile]

Output: one combined <outFile> (default: <pdf-dir>/text-<first>-<last>.txt) with a
"===== PAGE N =====" marker before each page's text, matching render-and-ocr.mjs's format.
"""
import re
import sys
from pathlib import Path

try:
    import pymupdf
except ImportError:
    print("PyMuPDF not installed. Run: pip install pymupdf", file=sys.stderr)
    sys.exit(1)

# Heuristic only -- flags pages worth spot-checking, doesn't prove anything by itself. A page
# with a real broken-font mapping tends to produce a wall of low-frequency-letter noise; this
# just counts what fraction of alphabetic characters fall outside common Spanish/English prose
# letters, weighted by page length so short pages don't trigger on one weird word.
def suspicious_ratio(text: str) -> float:
    letters = re.findall(r"[A-Za-zÀ-ÿ]", text)
    if len(letters) < 40:
        return 0.0
    common = re.findall(r"[A-Za-zÁÉÍÓÚáéíóúÑñÜü]", text)
    return 1 - (len(common) / len(letters))


def main() -> None:
    if len(sys.argv) < 4:
        print(
            "Usage: python3 extract-text.py <pdf> <firstPage> <lastPage> [outFile]",
            file=sys.stderr,
        )
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    first, last = int(sys.argv[2]), int(sys.argv[3])
    out_file = (
        Path(sys.argv[4])
        if len(sys.argv) > 4
        else pdf_path.parent / f"text-{first}-{last}.txt"
    )

    doc = pymupdf.open(pdf_path)
    chunks = []
    suspicious_pages = []
    for page_num in range(first, last + 1):
        if page_num < 1 or page_num > doc.page_count:
            print(f"page {page_num} out of range (doc has {doc.page_count}) -- skipping")
            continue
        text = doc[page_num - 1].get_text()
        if suspicious_ratio(text) > 0.15:
            suspicious_pages.append(page_num)
        chunks.append(f"\n\n===== PAGE {page_num} =====\n\n{text}")

    out_file.write_text("".join(chunks), encoding="utf-8")
    print(f"Wrote {out_file}")

    if suspicious_pages:
        print(
            f"\n{len(suspicious_pages)} page(s) look like they may have a broken text-layer "
            f"mapping (high ratio of non-standard letters): {suspicious_pages}"
        )
        print(
            "Spot-check those in the output, or a couple of the rendered PNGs, before trusting "
            "them -- if they're garbled, use render-and-ocr.mjs on that sub-range instead. "
            "See README.md."
        )


if __name__ == "__main__":
    main()
