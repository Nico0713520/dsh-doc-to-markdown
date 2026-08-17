# dsh-doc-to-markdown

Convert PDF and Word documents to clean Markdown.

A [dsh](https://github.com/liliMozi/openhanako) skill package (also compatible with Claude Code / OpenClaw SKILL.md format).

## When to use

Use this skill when the user asks to:
- Convert a PDF or Word document to Markdown
- 提取 PDF / Word 里的文字和结构（转 MD / 转 Markdown / 导出 Markdown）
- Extract document content for later editing, indexing, or RAG ingestion

## What it does

| Format | Engine | Notes |
|--------|--------|-------|
| DOCX | mammoth + turndown (pure Node) | Tables and heading levels preserved |
| PDF (text layer) | PyMuPDF4LLM (Python subprocess) | Paragraph/heading/table reconstruction |
| PDF (scanned) | detected & reported | Suggests OCR; does not silently fail |

Output: a Markdown file next to the input (or `-o` target), plus a JSON summary on stdout for agent parsing.

## Requirements

- Node.js >= 18
- For PDF conversion (optional, DOCX works without it): Python 3.9+ with `pymupdf4llm`:
  ```
  pip install pymupdf4llm
  ```

## Usage

```bash
node scripts/convert.cjs <input.pdf|input.docx> [-o output.md] [--stdout]
```

JSON result on stdout:

```json
{ "ok": true, "format": "docx", "input": "...", "output": "...", "warnings": [] }
```

## Chinese PDF optimization

Real-document battle tested. Chinese PDFs often use CID-embedded fonts whose incomplete mapping tables make extractors emit compatibility ideographs (`⼯` instead of `工`) or replacement characters (`�`). This tool applies Unicode NFKC normalization plus a targeted replacement-char rescue inside the PDF engine, so extracted text comes out clean and searchable — a gap in upstream tools like markitdown.

## Safety

- Rejects path traversal (`..` escaping the given root / hidden zip entries)
- Sanitized error messages: no internal stack traces leaked to the user
- Windows-first: Chinese characters, spaces, and UNC paths in filenames are handled correctly

## Install (dsh)

Place this folder in your skills directory, or reference the repo. See dsh docs for `skill` providers.
