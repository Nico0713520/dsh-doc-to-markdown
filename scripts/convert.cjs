#!/usr/bin/env node
'use strict';
/**
 * convert.cjs — CLI entry. Usage:
 *   node convert.cjs <input.pdf|input.docx> [-o output.md] [--stdout]
 * Emits a single JSON object on stdout: { ok, format, input, output, content?, warnings, error? }
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { safeError, resolveInput, resolveOutput } = require('./lib/util.cjs');
const { docxToMarkdown } = require('./lib/docx.cjs');
const { pdfToMarkdown } = require('./lib/pdf.cjs');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o' || a === '--output') args.out = argv[++i];
    else if (a === '--stdout') args.stdout = true;
    else if (a === '-h' || a === '--help') args.help = true;
    else args._.push(a);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length === 0) {
    console.log(JSON.stringify({
      ok: false,
      error: 'Usage: convert.cjs <input.pdf|input.docx> [-o output.md] [--stdout]',
    }));
    process.exit(args.help ? 0 : 1);
  }

  let result;
  try {
    const { abs, ext } = resolveInput(args._[0], process.cwd());
    const output = resolveOutput(abs, args.out);
    let conv;
    if (ext === '.docx') {
      conv = await docxToMarkdown(abs);
    } else {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc2md-'));
      try {
        conv = pdfToMarkdown(abs, tmpDir);
      } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
      }
    }
    fs.writeFileSync(output, conv.markdown, 'utf8');
    result = {
      ok: true,
      format: ext.slice(1),
      input: abs,
      output,
      warnings: conv.warnings,
    };
    if (args.stdout) result.content = conv.markdown;
  } catch (err) {
    result = { ok: false, error: safeError(err) };
    if (process.env.NODE_ENV !== 'test') console.log(JSON.stringify(result));
    else console.log(JSON.stringify(result));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(result));
}

main().catch((err) => {
  console.log(JSON.stringify({ ok: false, error: safeError(err) }));
  process.exitCode = 1;
});
