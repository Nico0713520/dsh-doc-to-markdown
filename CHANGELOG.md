# Changelog

## 0.1.0 — 2026-08-17

Initial release.

- DOCX → Markdown via mammoth + turndown (pure Node, GFM pipe tables, heading levels)
- PDF → Markdown via PyMuPDF4LLM with environment detection & graceful degradation
- Chinese PDF optimization: NFKC normalization + replacement-char rescue (CID font fix)
- Scanned-PDF detection with explicit "needs OCR" report
- Path traversal guard, sanitized errors, Windows Chinese/space path support
- JSON stdout contract for agent consumption
- 10/10 end-to-end tests, battle-tested on real Chinese documents
