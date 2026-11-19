#!/usr/bin/env node
// Overtime toggle for the ODS work-hours rule (project memory feedback_work_hours.md).
// Wired in ~/.claude/settings.json for UserPromptSubmit and SessionStart.
// UserPromptSubmit: when the owner's whole prompt in an ODS session is the /overtime command
// (skill ~/.claude/skills/overtime), it writes today's flag; "/overtime off" clears it.
// The word anywhere else never changes the flag (free-text matching misfired, 2026-10-31).
// Both events: while today's flag exists, every ODS session gets a notice that the rule is off.
// The flag expires by its date, so the rule comes back the next day without a reset.
// guard.js denies agents writing the flag file; only this hook writes it.
// Fail-open: any error prints nothing and never blocks the prompt.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = process.env.OVERTIME_STATE_DIR || path.join(os.homedir(), '.claude', 'state');
const FLAG = path.join(STATE_DIR, 'ods-overtime.json');

// ODS checkouts: C:\git\ODS, its .claude\worktrees, and sibling worktrees such as C:\git\ODS-river-RV19.
function isOds(cwd) {
  return /^c:[\\/]git[\\/]ods(?:[\\/-]|$)/i.test(path.resolve(cwd || ''));
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function clock(iso) {
  const d = new Date(iso);
  return isNaN(d) ? '?' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function readFlag() {
  try {
    const f = JSON.parse(fs.readFileSync(FLAG, 'utf8'));
    return f && f.date === today() ? f : null;
  } catch {
    return null;
  }
}

// Only the owner's own /overtime command counts. Harness reminders and pastes are cut out first (they
// are not the owner's words). A turn that still carries a peer, agent, task or harness wrapper was not
// typed by the owner, so it never changes the flag.
const CUT = /<system-reminder\b[^>]*>[\s\S]*?<\/system-reminder>|<pasted_content\b[^>]*>[\s\S]*?<\/pasted_content\b[^>]*>/gi;
const FOREIGN = /<cross-session-message\b|<agent-message\b|<task-notification>|<side-sessions-event>|<ci-monitor-event>|\[SYSTEM NOTIFICATION|\[Cross-session|\[Subagent hand-back\]/i;

// The command must be the whole prompt: raw as typed ("/overtime off"), or as the CLI wraps an
// expanded slash command (<command-name>/overtime</command-name> plus optional <command-args>).
const RAW_CMD = /^\/overtime(?:\s+(\S+))?$/i;
const WRAPPED_NAME = /<command-name>\s*\/?overtime\s*<\/command-name>/i;
const WRAPPED_ARGS = /<command-args>\s*([^<]*?)\s*<\/command-args>/i;

// The command's argument, lower-cased ('' when none), or null when the prompt is not the command.
function commandArg(prompt) {
  const p = prompt.trim();
  const raw = RAW_CMD.exec(p);
  if (raw) return (raw[1] || '').toLowerCase();
  if (/^<command-/i.test(p) && WRAPPED_NAME.test(p)) {
    const args = WRAPPED_ARGS.exec(p);
    return (args ? args[1] : '').toLowerCase();
  }
  return null;
}

function notice(flag) {
  return [
    `ODS overtime is ON today (${flag.date}): the owner turned it on at ${clock(flag.setAt)} in an ODS session.`,
    'The work-hours rule in feedback_work_hours.md is off in every ODS session until midnight:',
    'no 16:30 "start nothing new", no 16:40 soft stop, no 16:20 wind-down that stops sessions.',
    'It comes back on by itself tomorrow. Mention it when you brief or message other sessions today.',
    'Only the owner can turn it off, with the /overtime off command.',
  ].join(' ');
}

function out(event, text) {
  if (!text) return;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }));
}

function onPrompt(input) {
  const prompt = String(input.prompt || '').replace(CUT, ' ');
  let changed = '';
  const arg = FOREIGN.test(prompt) ? null : commandArg(prompt);
  if (arg !== null) {
    if (arg === 'off') {
      if (readFlag()) {
        fs.rmSync(FLAG, { force: true });
        changed = 'ODS overtime turned OFF by the owner: the work-hours rule in feedback_work_hours.md applies again today.';
      }
    } else if ((arg === '' || arg === 'on') && !readFlag()) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
      const flag = { date: today(), setAt: new Date().toISOString(), sessionId: input.session_id || null, cwd: input.cwd || null };
      fs.writeFileSync(FLAG, JSON.stringify(flag, null, 2) + '\n');
    }
  }
  const flag = readFlag();
  out('UserPromptSubmit', changed || (flag ? notice(flag) : ''));
}

function onStart() {
  const flag = readFlag();
  if (flag) out('SessionStart', notice(flag));
}

function main(input) {
  if (!isOds(input.cwd || process.cwd())) return;
  const event = input.hook_event_name || '';
  if (event === 'UserPromptSubmit') onPrompt(input);
  else if (event === 'SessionStart') onStart();
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    main(JSON.parse(raw || '{}'));
  } catch (e) {
    process.stderr.write(`overtime.js internal error, ignored: ${e && e.message}\n`);
  }
  process.exit(0);
});
