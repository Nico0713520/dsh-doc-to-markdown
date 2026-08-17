'use strict';
/** run-tests.cjs — end-to-end tests. Run: npm test */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'scripts', 'convert.cjs');
const FX = path.join(__dirname, 'fixtures');

let passed = 0, failed = 0;

function run(args) {
  const r = spawnSync('node', [CLI, ...args], { cwd: ROOT, encoding: 'utf8', windowsHide: true });
  try { return JSON.parse((r.stdout || '').trim().split(/\r?\n/).pop()); }
  catch (_) { return { ok: false, error: 'unparseable output: ' + r.stdout + r.stderr }; }
}

function check(name, cond, extra) {
  if (cond) { passed++; console.log('PASS', name); }
  else { failed++; console.log('FAIL', name, extra || ''); }
}

// 1. DOCX happy path (Chinese)
{
  const out = path.join(FX, '中文论文样本.test.md');
  const res = run([path.join(FX, '中文论文样本.docx'), '-o', out]);
  check('docx ok', res.ok === true, JSON.stringify(res));
  const md = res.ok ? fs.readFileSync(out, 'utf8') : '';
  check('docx heading', md.includes('# 基于深度学习的结构健康监测研究'));
  check('docx table', md.includes('| 工况 | 精度 | 召回率 |') && md.includes('| B | 95.3% | 91.7% |'));
}

// 2. PDF happy path
{
  const res = run([path.join(FX, 'sample-text.pdf'), '--stdout']);
  check('pdf ok', res.ok === true, JSON.stringify(res));
  check('pdf content', res.ok && /Structural Health Monitoring/.test(res.content || ''));
}

// 3. Missing file
check('missing file rejected', run(['no-such-file.pdf']).ok === false);

// 4. Unsupported extension
fs.writeFileSync(path.join(FX, 'bad.txt'), 'x');
check('unsupported ext rejected', run([path.join(FX, 'bad.txt')]).ok === false);

// 5. Path traversal rejected
check('traversal rejected', run([path.join(FX, '..', '..', '..', 'etc', 'passwd.pdf')].map(p => p)).ok === false);

// 6. Empty arg
check('no arg rejected', run([]).ok === false);

// 7. Chinese + spaces in filename
{
  const src = path.join(FX, '中文 论文 样本.docx');
  fs.copyFileSync(path.join(FX, '中文论文样本.docx'), src);
  const res = run([src]);
  check('chinese+space filename ok', res.ok === true, JSON.stringify(res));
  if (res.ok) fs.rmSync(res.output, { force: true });
  fs.rmSync(src, { force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
