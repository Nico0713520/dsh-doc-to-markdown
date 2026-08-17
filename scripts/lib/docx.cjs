'use strict';
/**
 * docx.cjs — DOCX → Markdown via mammoth (DOCX→HTML) + turndown (HTML→MD).
 * Pure Node. Tables and heading levels preserved.
 */

const mammoth = require('mammoth');
const TurndownService = require('turndown');

function makeTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });
  // GitHub-style pipe tables for mammoth's <table> output.
  td.addRule('tableToGfm', {
    filter: ['table'],
    replacement: (content, node) => {
      const rows = Array.from(node.querySelectorAll('tr'));
      if (!rows.length) return content;
      const lines = rows.map((tr, i) => {
        const cells = Array.from(tr.children).map((c) =>
          (c.textContent || '')
            .replace(/\|/g, '\\|')
            .replace(/\r?\n/g, ' ')
            .trim() || ' '
        );
        const line = '| ' + cells.join(' | ') + ' |';
        if (i === 0) return line + '\n' + '| ' + cells.map(() => '---').join(' | ') + ' |';
        return line;
      });
      return '\n\n' + lines.join('\n') + '\n\n';
    },
  });
  return td;
}

/** Convert a DOCX file to Markdown. Returns { markdown, warnings } */
async function docxToMarkdown(absPath) {
  const { value: html, messages } = await mammoth.convertToHtml({ path: absPath });
  const td = makeTurndown();
  const markdown = td.turndown(html || '');
  const warnings = (messages || [])
    .filter((m) => m.type === 'warning')
    .map((m) => `mammoth: ${m.message}`)
    .slice(0, 10);
  return { markdown, warnings };
}

module.exports = { docxToMarkdown, makeTurndown };
