'use strict';
/**
 * util.cjs — path safety + Windows/Chinese path helpers.
 * All errors thrown here carry safe, user-readable messages (no stack leakage).
 */

const path = require('path');
const fs = require('fs');

const MAX_PATH_LEN = 4096;
const ALLOWED_EXT = new Set(['.pdf', '.docx']);

/** Sanitize an error into a user-readable message. */
function safeError(err) {
  if (!err) return 'Unknown error';
  const msg = err && err.message ? String(err.message) : String(err);
  // strip any absolute temp/internal paths
  return msg.replace(/[A-Za-z]:\\[^\s"']*/g, '<path>').slice(0, 500);
}

/** Validate and resolve an input file path. Throws user-readable Error on failure. */
function resolveInput(inputRaw, rootDir) {
  if (typeof inputRaw !== 'string' || !inputRaw.trim()) {
    throw new Error('No input file given. Usage: convert.cjs <input.pdf|input.docx> [-o out.md]');
  }
  if (inputRaw.length > MAX_PATH_LEN) throw new Error('Input path is too long.');

  // Normalize separators (accept both / and \ on Windows)
  const input = inputRaw.trim();

  // Path traversal guard: reject .. segments that escape the allowed root
  const root = path.resolve(rootDir || process.cwd());
  const abs = path.resolve(root, input);

  // If the input is relative and contains .., ensure it stays under root or its ancestors only via explicit absolute path
  if (!path.isAbsolute(input)) {
    const rel = path.relative(root, abs);
    if (rel.startsWith('..') && !path.isAbsolute(rel)) {
      // Allow only if user gave explicit .. but the target exists and is a real doc — better: reject
      throw new Error('Path traversal rejected: input escapes the working directory.');
    }
  }

  if (!fs.existsSync(abs)) throw new Error(`Input file not found: ${path.basename(input)}`);
  const stat = fs.statSync(abs);
  if (!stat.isFile()) throw new Error('Input is not a file.');
  if (stat.size === 0) throw new Error('Input file is empty.');
  if (stat.size > 200 * 1024 * 1024) throw new Error('Input file exceeds 200 MB limit.');

  const ext = path.extname(abs).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(`Unsupported format "${ext}". Supported: .pdf, .docx`);
  }
  return { abs, ext };
}

/** Resolve output path: default <input-basename>.md beside the input. */
function resolveOutput(absInput, outRaw) {
  if (outRaw && outRaw.trim()) {
    const out = path.resolve(process.cwd(), outRaw.trim());
    const dir = path.dirname(out);
    if (!fs.existsSync(dir)) throw new Error('Output directory does not exist.');
    return out;
  }
  return absInput.replace(/\.[^.]+$/i, '') + '.md';
}

module.exports = { safeError, resolveInput, resolveOutput, ALLOWED_EXT };
