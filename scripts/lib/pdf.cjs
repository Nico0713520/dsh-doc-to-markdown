'use strict';
/**
 * pdf.cjs — PDF → Markdown via PyMuPDF4LLM (Python subprocess).
 * - Detects Python + pymupdf4llm availability, graceful degradation.
 * - Detects scanned PDFs (no text layer) and reports an OCR suggestion.
 * - Paths are passed via a temp JSON file to avoid Windows argv encoding issues
 *   with Chinese/space characters.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PY = process.env.DOC2MD_PYTHON || 'python';

const PY_SCRIPT = String.raw`
import json, sys
data = json.load(open(sys.argv[1], encoding='utf-8'))
src, dst = data['src'], data['dst']
import pymupdf4llm, pymupdf
# quick text-layer check
doc = pymupdf.open(src)
text_pages = sum(1 for p in doc if p.get_text().strip())
total = len(doc)
doc.close()
if total > 0 and text_pages == 0:
    print(json.dumps({"ok": False, "scanned": True}, ensure_ascii=False)); sys.exit(0)
md = pymupdf4llm.to_markdown(src)
with open(dst, 'w', encoding='utf-8') as f:
    f.write(md)
print(json.dumps({"ok": True, "pages": total, "text_pages": text_pages}, ensure_ascii=False))
`;

function pythonAvailable() {
  const r = spawnSync(PY, ['-c', 'import sys; print(sys.version_info[0])'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  return r.status === 0;
}

function pymupdfAvailable() {
  const r = spawnSync(PY, ['-c', 'import pymupdf4llm'], { encoding: 'utf8', windowsHide: true });
  return r.status === 0;
}

/** Convert PDF to Markdown. Returns { markdown, warnings } or throws user-readable Error. */
function pdfToMarkdown(absPath, tmpDir) {
  if (!pythonAvailable()) {
    throw new Error(
      'PDF conversion requires Python 3.9+ but no Python was found. Install Python, or convert DOCX files which work without Python.'
    );
  }
  if (!pymupdfAvailable()) {
    throw new Error(
      'PDF conversion requires the pymupdf4llm package. Install it with: pip install pymupdf4llm'
    );
  }

  const argFile = path.join(tmpDir, 'doc2md-args.json');
  const outFile = path.join(tmpDir, 'doc2md-out.md');
  fs.writeFileSync(argFile, JSON.stringify({ src: absPath, dst: outFile }), 'utf8');
  fs.writeFileSync(path.join(tmpDir, 'doc2md-run.py'), PY_SCRIPT, 'utf8');

  const r = spawnSync(
    PY,
    [path.join(tmpDir, 'doc2md-run.py'), argFile],
    { encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 }
  );

  let payload = null;
  try {
    const outLine = (r.stdout || '').trim().split(/\r?\n/).pop();
    payload = JSON.parse(outLine);
  } catch (_) { /* fallthrough */ }

  if (payload && payload.scanned) {
    throw new Error(
      'This PDF appears to be a scanned document (no text layer). OCR is required before conversion; this tool does not OCR.'
    );
  }
  if (r.status !== 0 || !payload || !payload.ok) {
    const reason = (r.stderr || '').split(/\r?\n/).filter(Boolean).slice(-1)[0] || 'unknown Python error';
    throw new Error('PDF conversion failed in the Python engine: ' + reason.slice(0, 200));
  }

  const markdown = fs.readFileSync(outFile, 'utf8');
  const warnings = [];
  if (payload.pages > payload.text_pages) {
    warnings.push(`${payload.pages - payload.text_pages} of ${payload.pages} page(s) had no extractable text (possibly images).`);
  }
  return { markdown, warnings };
}

module.exports = { pdfToMarkdown, pythonAvailable, pymupdfAvailable };
