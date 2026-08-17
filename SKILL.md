---
name: doc-to-markdown
description: Convert PDF and Word (DOCX) documents to clean Markdown. Use when the user asks to convert PDF/Word to Markdown, extract document text/structure, 提取 PDF/Word 内容, 转 Markdown, or prepare documents for editing/RAG. Handles Chinese documents and Windows paths well.
version: 0.1.0
---

# doc-to-markdown

Convert `.pdf` and `.docx` files to Markdown via deterministic rules (no LLM calls).

## When to activate

User says: convert this PDF/Word to Markdown, 提取文档内容, 转 md, extract text for RAG/notes.

## How to run

Run from this skill directory:

```bash
node scripts/convert.cjs <input> [-o output.md] [--stdout]
```

- `<input>`: absolute or relative path to a `.pdf` or `.docx` file
- `-o`: optional output path; default is `<input-basename>.md` next to the input
- `--stdout`: print Markdown content to stdout instead of/in addition to writing the file

Parse the JSON result on stdout:

```json
{ "ok": true, "format": "pdf", "input": "...", "output": "...", "warnings": ["..."] }
```

On failure: `{ "ok": false, "error": "human-readable reason" }` — show the error to the user, do not retry blindly.

## Engine routing

- `.docx` → mammoth (DOCX→HTML) + turndown (HTML→MD). Pure Node, no extra deps.
- `.pdf` → Python subprocess running PyMuPDF4LLM. Requires `pip install pymupdf4llm`; if missing, the tool returns a clear setup hint — report it to the user.
- Scanned PDFs (no text layer) are detected and reported with an OCR suggestion.

## Notes for the agent

- Output file defaults next to the input file; use `-o` if the user wants a specific location.
- Chinese document support is a first-class goal; report any garbled output as a bug.
- Never bypass the path-safety checks; they reject suspicious paths on purpose.
