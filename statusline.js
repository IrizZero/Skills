#!/usr/bin/env node
// Status line: context-window usage. Wired as statusLine.command in ~/.claude/settings.json.
// (The caveman badge from the Skills repo copy is removed on this box: caveman is not used.)
'use strict';

const ESC = '\x1b';

function context(input) {
  const cw = input.context_window || {};
  let pct = Number(cw.used_percentage);
  if (!Number.isFinite(pct) && cw.context_window_size) {
    pct = (100 * (Number(cw.total_input_tokens) || 0)) / Number(cw.context_window_size);
  }
  if (!Number.isFinite(pct)) return '';
  const color = pct >= 75 ? '31' : pct >= 50 ? '33' : '90';
  return `${ESC}[${color}mctx ${Math.round(pct)}%${ESC}[0m`;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch { /* render nothing */ }
  process.stdout.write(context(input));
});
