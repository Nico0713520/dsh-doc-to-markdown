# dsh-doc-to-markdown

[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Python (PDF only)](https://img.shields.io/badge/python-PDF%20only-3776AB?logo=python&logoColor=white)](https://pypi.org/project/pymupdf4llm/)
[![Platform](https://img.shields.io/badge/platform-Windows%20first-0078D6?logo=windows11&logoColor=white)](https://github.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-10%2F10-brightgreen)](#tests)

**Convert PDF & Word documents to clean, LLM-friendly Markdown. Deterministic rules — no AI calls, no tokens, no cost.**

中文用户请看 [下方速览](#中文速览)。

---

## Why this one

| | markitdown | raw pymupdf4llm | **dsh-doc-to-markdown** |
|---|---|---|---|
| Chinese PDF font glitches (`⼯`→`工`, `�`) | ❌ | ❌ | ✅ NFKC normalization + rescue |
| Windows Chinese/space paths | ⚠️ | ⚠️ argv encoding bugs | ✅ temp-file arg passing |
| Scanned PDF detection | ❌ silent garbage | ❌ | ✅ explicit "needs OCR" report |
| Path traversal safety | ❌ | n/a | ✅ built-in guard |
| Agent-friendly output | ❌ human text | ❌ | ✅ JSON stdout contract |
| DOCX without Python | ❌ needs Python | n/a | ✅ pure Node (mammoth) |

One-line pitch: **it's the converter that survives real-world Chinese PDFs and Windows paths, and speaks JSON to your agent.**

## Demo

Input: a real-world Chinese PDF (exported notes with tables)

```text
# 输入标题
## Cat Wu：AI 时代，产品经理的工作方式已被彻底重构
...
```

Output Markdown (actual conversion, see [examples/](examples/)):

```markdown
## 三个工具的分工架构：按职责层级划分

|工具|职责层级|权限范围|干什么|
|---|---|---|---|
|Claude.ai|大脑层（思维）|最小：纯对话|想策略、讨论棘手问题|
|Claude Code|执行层（动手）|中等：代码域|写原型、跑脚本|
|Cowork|管家层（系统操作）|最大：跨应用跨系统|清邮件、管待办、做PPT|

判断标准不是"这是什么任务"，而是 **"我要什么输出"**。
```

Headings, tables, bold, lists — all preserved. Zero garbled characters.

## Quick start

```bash
git clone https://github.com/Nico0713520/dsh-doc-to-markdown
cd dsh-doc-to-markdown
npm install

# DOCX works immediately (pure Node)
node scripts/convert.cjs "论文.docx" -o 论文.md

# PDF needs Python once:
pip install pymupdf4llm
node scripts/convert.cjs "报告.pdf" --stdout
```

JSON result contract (parse this in your agent):

```json
{
  "ok": true,
  "format": "pdf",
  "input": "E:\\docs\\报告.pdf",
  "output": "E:\\docs\\报告.md",
  "warnings": []
}
```

Failure is also structured — show `error` to the user, never retry blindly:

```json
{ "ok": false, "error": "This PDF appears to be a scanned document (no text layer). OCR is required." }
```

## Engine routing

| Format | Engine | Fallback |
|---|---|---|
| `.docx` | mammoth + turndown (pure Node) | — |
| `.pdf` (text layer) | PyMuPDF4LLM via Python subprocess | clear setup hint if Python missing |
| `.pdf` (scanned) | detected via text-layer probe | explicit "needs OCR" error |

## Install as a skill

**dsh / Claude Code / OpenClaw** — this repo is a standard SKILL.md package. Point your skill provider at this repo (or clone into your skills directory); `SKILL.md` frontmatter handles activation triggers:

- "convert this PDF/Word to Markdown"
- “把 PDF/Word 转 markdown”、“提取文档内容”

## 中文速览

把 PDF / Word 转成干净的 Markdown，纯规则转换，不调用 AI、零成本。

- **中文 PDF 专项优化**：NFKC 归一化解决 CID 字体的兼容字形（`⼯`→`工`）和乱码（`�`），这是 markitdown 等上游工具的盲区
- **Windows 一等公民**：中文路径、空格路径、子进程编码坑全部处理
- **表格友好**：DOCX 表格转 GitHub 风格管道表格，标题层级完整保留
- **Agent 契约**：stdout 输出结构化 JSON，成功失败都有明确字段
- **扫描件识别**：无文字层的扫描 PDF 会明确报告需要 OCR，不会静默输出垃圾

用法：`npm install` 后 `node scripts/convert.cjs 文件.pdf -o 输出.md`（PDF 需 `pip install pymupdf4llm`）

## Tests

```bash
npm test   # 10/10: happy paths, Chinese filenames, traversal guard, degradation
```

## Roadmap

- [ ] XLSX / PPTX via markitdown (optional dependency)
- [ ] Scanned-PDF OCR pipeline (vision API, opt-in)
- [ ] Two-column academic PDF layout heuristics

## License

[MIT](LICENSE)
