#!/usr/bin/env node
// SubagentStart hook: injects the Serena notice from ~/.claude/CLAUDE.md into
// general-purpose, claude and Plan subagents (matcher in ~/.claude/settings.json).
// Fires only when the repo's main checkout lists Serena in its .mcp.json.
// In a linked worktree it adds the worktree caveat: Serena's project is the main checkout.
// Fail-open: any error injects nothing.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const NOTICE = [
  'Serena MCP is available in this repo - prefer symbol-aware nav over text',
  'search for code. `find_symbol` (locate a class/method), `find_referencing_symbols`',
  '(who calls it), `get_symbols_overview` (understand a file before reading it).',
  'Their schemas are deferred: load them first with one call -',
  '`ToolSearch` query `select:mcp__serena__find_symbol,mcp__serena__find_referencing_symbols,mcp__serena__get_symbols_overview`.',
  'Grep/Read stay correct for non-code files (`.json`, `.cshtml`, `.md`, `.sql`, `.yml`).',
].join('\n');

function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function same(a, b) {
  return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
}

function main(input) {
  const dir = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const top = git(dir, ['rev-parse', '--show-toplevel']);
  const common = git(dir, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
  const mainCheckout = path.dirname(common);
  const mcp = fs.readFileSync(path.join(mainCheckout, '.mcp.json'), 'utf8');
  if (!/serena/i.test(mcp)) return;

  let text = NOTICE;
  if (!same(top, mainCheckout)) {
    text += '\n\n' + [
      `Worktree caveat: this session works in a linked worktree (${top}).`,
      `Serena's project is the main checkout (${mainCheckout}), so its relative paths resolve to MAIN, not this worktree.`,
      'Use Serena only for read-only navigation of code unchanged on this branch.',
      'Read and edit worktree files by absolute path with Read/Edit/Write, never through Serena edit tools.',
    ].join('\n');
  }
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: text },
  }));
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    main(JSON.parse(raw || '{}'));
  } catch {
    // not a git repo, no .mcp.json, git missing: inject nothing
  }
  process.exit(0);
});
