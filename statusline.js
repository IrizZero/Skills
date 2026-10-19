#!/usr/bin/env node
// Status line: caveman badge (ported from the caveman plugin's caveman-statusline.ps1, same
// hardening) plus context-window usage. Wired as statusLine.command in ~/.claude/settings.json.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const ESC = '\x1b';
const ORANGE = (s) => `${ESC}[38;5;172m${s}${ESC}[0m`;
const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');

// Read a small flag file: refuse symlinks/junctions and anything over 64 bytes, so a planted
// link can't make the status line render another file's bytes on every keystroke.
function readSmall(file) {
  try {
    const st = fs.lstatSync(file);
    if (st.isSymbolicLink() || !st.isFile() || st.size > 64) return null;
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function caveman() {
  const raw = readSmall(path.join(claudeDir, '.caveman-active'));
  if (raw === null) return '';
  const mode = raw.split(/\r?\n/)[0].trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const valid = ['off', 'lite', 'full', 'ultra', 'wenyan-lite', 'wenyan', 'wenyan-full', 'wenyan-ultra', 'commit', 'review', 'compress'];
  if (!valid.includes(mode)) return '';
  let out = ORANGE(mode === 'full' ? '[CAVEMAN]' : `[CAVEMAN:${mode.toUpperCase()}]`);
  if (process.env.CAVEMAN_STATUSLINE_SAVINGS !== '0') {
    const s = readSmall(path.join(claudeDir, '.caveman-statusline-suffix'));
    const clean = s === null ? '' : s.trimEnd().replace(/[\x00-\x1f]/g, '');
    if (clean) out += ' ' + ORANGE(clean);
  }
  return out;
}

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
  try { input = JSON.parse(raw || '{}'); } catch { /* render badge only */ }
  process.stdout.write([caveman(), context(input)].filter(Boolean).join(' '));
});
