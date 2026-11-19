#!/usr/bin/env node
// PreToolUse guard for the owner's Fixed rules in ~/.claude/CLAUDE.md.
// Wired in ~/.claude/settings.json for Bash|PowerShell|Edit|Write|MultiEdit|NotebookEdit
// and the desktop app's archive_session and set_setting tools.
// Also keeps agents off the ODS overtime flag that hooks/overtime.js owns, and denies ad-hoc
// CPU/disk load (deliberate load goes through the ODS scripts\box-load.ps1).
// Fixture tests: node guard.test.js (beside this file).
// Prints a deny/ask decision as JSON, or nothing to let the call through.
// Fail-open: an internal error lets the call through, so a bug here never blocks every command.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// A command counts only at command position: start of input, after ; & | ( { or $( ,
// or as the -Command / -c / /c argument of a nested shell. Leading VAR=value
// assignments, wrapper commands (timeout 1200, nohup, nice, time, stdbuf), a quote
// and a directory prefix are allowed before the name.
const PREFIX =
  '(?:^|[;&|(\\n{}]|\\$\\(|\\b(?:powershell|pwsh|cmd|bash|sh)(?:\\.exe)?\\s+(?:[^;&|\\n]*?\\s)?(?:-Command|-c|/c)\\s+["\']?)' +
  '\\s*(?:\\w+=\\S*\\s+)*(?:(?:timeout|nohup|nice|time|stdbuf)\\s+(?:-\\S+\\s+)*(?:\\d+[smhd]?\\s+)?)*' +
  '["\']?(?:[^\\s"\';&|]*[\\\\/])?';

function atCmd(body) {
  return new RegExp(PREFIX + body, 'i');
}

function decide(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

// ---------- codex model gate ----------

function readCodexConfig() {
  const home = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const top = {};
  const profiles = {};
  let text;
  try {
    text = fs.readFileSync(path.join(home, 'config.toml'), 'utf8');
  } catch {
    return { top, profiles };
  }
  let section = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const sec = line.match(/^\[(.+)\]$/);
    if (sec) {
      const p = sec[1].trim().match(/^profiles\.["']?([^"'\]]+)["']?$/);
      section = p ? p[1] : '';
      if (p) profiles[section] = profiles[section] || {};
      continue;
    }
    const kv = line.match(/^(model|model_reasoning_effort)\s*=\s*["']?([^"'\s]+)["']?/);
    if (!kv) continue;
    if (section === null) top[kv[1]] = kv[2];
    else if (profiles[section]) profiles[section][kv[1]] = kv[2];
  }
  return { top, profiles };
}

// End of the shell segment starting at str[0]: the first ; newline | or & outside quotes.
function segment(str) {
  let q = null;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (q) {
      if (c === '\\' && q === '"') i++;
      else if (c === q) q = null;
    } else if (c === '"' || c === "'") q = c;
    else if (c === ';' || c === '\n' || c === '|' || c === '&') return str.slice(0, i);
  }
  return str;
}

function checkCodex(cmd) {
  const m = atCmd('codex(?:\\.exe|\\.cmd|\\.ps1)?["\']?\\s+(?:exec|e|review)\\b').exec(cmd);
  if (!m) return;
  // Skip the separator PREFIX may have consumed (e.g. the "&" of "& codex"), then cut at the segment end.
  const rest = segment(cmd.slice(m.index).replace(/^[;&|(\n{}\s]+/, ''));

  const flagModel = rest.match(/(?:^|\s)(?:-m|--model)(?:\s+|=)["']?([\w.\-]+)/);
  const cfgModel = rest.match(/(?:-c|--config)[\s=]+["']?model\s*=\s*["'\\]*([\w.\-]+)/);
  const cfgEffort = rest.match(/(?:-c|--config)[\s=]+["']?model_reasoning_effort\s*=\s*["'\\]*(\w+)/);
  const profile = rest.match(/(?:^|\s)(?:-p|--profile)(?:\s+|=)["']?([\w.\-]+)/);

  const conf = readCodexConfig();
  const prof = (profile && conf.profiles[profile[1]]) || {};
  let source = 'command line';
  let model = (flagModel && flagModel[1]) || (cfgModel && cfgModel[1]);
  if (!model && prof.model) { model = prof.model; source = `profile ${profile[1]} in config.toml`; }
  if (!model && conf.top.model) { model = conf.top.model; source = 'the default in ~/.codex/config.toml'; }
  const effort = ((cfgEffort && cfgEffort[1]) || prof.model_reasoning_effort || conf.top.model_reasoning_effort || '').toLowerCase();

  if (!model) {
    decide('ask', 'guard.js: cannot resolve the codex model (no -m, no config default). Approve only if the model is a GPT-6 slug the rules allow.');
  }
  if (!/^gpt-6-(sol|luna|astra)$/i.test(model)) {
    decide('deny', `Fixed rule GPT-6 only: codex model "${model}" (from ${source}) is not allowed. Use gpt-6-sol or gpt-6-luna; gpt-6-astra is owner-gated. Do not fall back to 5.x.`);
  }
  if (/astra/i.test(model)) {
    decide('ask', `Fixed rule: gpt-6-astra is owner-gated (model from ${source}). Approve only if the owner told this session to use astra in their own words.`);
  }
  if (/sol/i.test(model) && /^(xhigh|max|ultra)$/.test(effort)) {
    decide('ask', `Fixed rule: gpt-6-sol at ${effort} needs the owner's explicit approval before the run.`);
  }
}

// ---------- commit trailer ----------

const TRAILER = /co-authored-by\s*:|noreply@anthropic\.com|generated with \[?claude code/i;

function checkCommit(cmd, cwd) {
  const m = atCmd('git(?:\\.exe)?["\']?(?:\\s+(?:-[cC]\\s+\\S+|--[\\w-]+(?:=\\S+)?))*\\s+commit\\b').exec(cmd);
  if (!m) return;
  const rest = cmd.slice(m.index);
  let hit = TRAILER.test(rest);
  let fileText = '';
  const file = rest.match(/(?:^|\s)(?:-F|--file)(?:\s+|=)("[^"]+"|'[^']+'|\S+)/);
  if (file) {
    const p = file[1].replace(/^["']|["']$/g, '');
    try {
      fileText = fs.readFileSync(path.resolve(cwd, p), 'utf8');
    } catch { /* unreadable or stdin: nothing to check */ }
  }
  if (!hit && fileText) hit = TRAILER.test(fileText);
  if (hit) {
    decide('deny', 'Fixed rule no AI co-author: remove the Co-Authored-By / Claude attribution lines. The owner is the sole author.');
  }
  // Agent or model names in the message itself (added 2026-11-19). Only the message is read,
  // not the paths after it, and a name that is part of a file or tool name (CLAUDE.md,
  // .claude/, codex-exec) does not count. It asks instead of denying: some messages are
  // honestly about the tools.
  const named = AGENT_NAME.exec(commitMessageText(rest) + '\n' + fileText);
  if (named) {
    decide('ask', `Fixed rule no agent name in a commit message: this message names "${named[0]}". Approve only if the commit is about that tool itself, not credit for work it did; otherwise reword it.`);
  }
}

// A name counts only when it stands alone: not glued to a path, an extension or a longer identifier.
const AGENT_NAME = /(?<![\w.\/\\-])(?:claude|anthropic|codex|chatgpt|openai|copilot|gemini|fable|mythos|opus|sonnet|haiku)(?![\w\/\\-]|\.\w)|(?<![\w.\/\\-])gpt-?\d[\w.-]*/i;

// The text of the message arguments of a `git commit` command: -m / --message values
// (plain, quoted, PowerShell here-strings) and shell heredoc bodies.
function commitMessageText(rest) {
  const parts = [];
  const arg = /(?:^|\s)(?:-[a-zA-Z]*m|--message)(?:\s+|=)(@'[\s\S]*?'@|@"[\s\S]*?"@|"(?:[^"\\]|\\[\s\S])*"|'[^']*'|\S+)/g;
  let a;
  while ((a = arg.exec(rest))) parts.push(a[1]);
  const heredoc = /<<-?\s*['"]?(\w+)['"]?[^\n]*\n([\s\S]*?)\n\s*\1\b/g;
  while ((a = heredoc.exec(rest))) parts.push(a[2]);
  return parts.join('\n');
}

// ---------- IIS, app pools, Windows services ----------

const SERVICE_CMDS = [
  atCmd('(?:iisreset|appcmd)(?:\\.exe)?\\b'),
  atCmd('(?:start|stop|restart)-(?:webapppool|website|webitem|iissite)\\b'),
  atCmd('(?:start|stop|restart|set|suspend|resume|remove|new)-service\\b'),
  atCmd('sc(?:\\.exe)?\\s+(?:start|stop|config|delete|create|pause|continue|failure)\\b'),
  atCmd('net(?:\\.exe)?\\s+(?:start|stop)\\s+\\S'),
];

function checkServices(cmd) {
  if (SERVICE_CMDS.some((re) => re.test(cmd))) {
    decide('deny', 'Fixed rule app lifecycle: never touch IIS, app pools or Windows services on any box. That lifecycle stays with the owner.');
  }
}

// ---------- non-loopback bind ----------

const BIND_KEY = /--urls\b|--server\.urls\b|ASPNETCORE_URLS|DOTNET_URLS|Kestrel__Endpoints__\w+__Url/i;
const ALL_PORTS = /\b(?:ASPNETCORE|DOTNET)_HTTPS?_PORTS\s*=/i;

function isLoopback(host) {
  const h = host.toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || /^127\.\d+\.\d+\.\d+$/.test(h) || h === '[::1]';
}

function checkBind(cmd) {
  if (ALL_PORTS.test(cmd)) {
    decide('deny', 'Loopback only: ASPNETCORE_HTTP(S)_PORTS binds every interface. Bind to http://127.0.0.1:<port> or localhost instead.');
  }
  if (!BIND_KEY.test(cmd)) return;
  const hosts = [...cmd.matchAll(/\bhttps?:\/\/(\[[^\]]*\]|[^:\/\s;"',]+)/gi)].map((x) => x[1]);
  const bad = hosts.filter((h) => !isLoopback(h));
  if (bad.length) {
    decide('deny', `Loopback only: never bind a dev server to ${bad.join(', ')}. Use 127.0.0.1 or localhost.`);
  }
}

// ---------- secrets ----------

const SECRET_NAME = /TOKEN|SECRET|PASSW(?:OR)?D|API_?KEY|ACCESS_?KEY|PRIVATE_?KEY|CONN(?:ECTION)?_?STR|_KEY$/i;
const NAMES_ONLY = /\s-Name\b|select(?:-object)?\s+(?:-property\s+)?["']?name\b|\.Name\b|\.Keys\b|cut\s+-d\s*["']?=["']?\s*-f\s*1\b/i;
const DISPLAY_CMDS = /^(?:cat|tee|more|less|head|tail|out-host|out-string|write-host|write-output|format-\w+|ft|fl|echo)$/i;
const END = '(?=\\s*(?:$|[;&|)\\n}]))';

function secretRefs(segment) {
  const names = [];
  for (const x of segment.matchAll(/\$\{?(\w+)(?![\w:])/g)) names.push(x[1]);        // $X ${X} (not ${X:0:4})
  for (const x of segment.matchAll(/\$env:(\w+)(?!\w|\s*\.\s*(?:Substring|Length|StartsWith))/gi)) names.push(x[1]);
  for (const x of segment.matchAll(/%(\w+)%/g)) names.push(x[1]);                    // cmd %X% (not %X:~0,4%)
  return names.filter((n) => SECRET_NAME.test(n));
}

function checkSecrets(cmd) {
  if (/ConvertFrom-Json/i.test(cmd) && /appsettings/i.test(cmd)) {
    decide('deny', 'Never print a secret: a ConvertFrom-Json parse error on appsettings echoes the whole file, committed secrets included. Use Select-String on the key lines instead.');
  }

  const names = NAMES_ONLY.test(cmd);
  const dumps = [
    atCmd('(?:printenv|env|set)' + END),
    atCmd('(?:get-childitem|gci|ls|dir|get-item|gi)\\s+(?:-path\\s+)?["\']?env:(?:\\*["\']?)?' + END),
    /\[(?:System\.)?Environment\]::GetEnvironmentVariables\(/i,
  ];
  if (!names && dumps.some((re) => re.test(cmd))) {
    decide('deny', 'Never print a secret: this dumps every environment variable, tokens included. List names only (e.g. Get-ChildItem env: -Name) or read one non-secret variable.');
  }

  const printenvOne = atCmd('printenv\\s+(\\w+)').exec(cmd);
  if (printenvOne && SECRET_NAME.test(printenvOne[1])) {
    decide('deny', `Never print a secret: printenv ${printenvOne[1]} prints its value. Use a prefix check or pipe it where it goes.`);
  }

  const printRe = new RegExp(PREFIX + '(?:echo|printf|print|write-output|write-host|write-information|write)\\b', 'gi');
  for (const m of cmd.matchAll(printRe)) {
    const start = m.index + m[0].length;
    const tail = cmd.slice(start);
    const stop = tail.search(/;|\n|&&|\|\||\|/);
    const segment = stop === -1 ? tail : tail.slice(0, stop);
    const hits = secretRefs(segment);
    if (!hits.length) continue;
    // Piping the value into a consumer (gh auth login --with-token, docker login ...) is the sanctioned use.
    if (stop !== -1 && tail[stop] === '|' && tail[stop + 1] !== '|') {
      const next = tail.slice(stop + 1).trim().split(/\s+/)[0] || '';
      if (!DISPLAY_CMDS.test(next)) continue;
    }
    decide('deny', `Never print a secret: this prints the value of ${hits.join(', ')}. Use a prefix check (\${X:0:4}) or pipe it where it goes.`);
  }
}

// ---------- generated files ----------

function checkGenerated(filePath) {
  if (filePath && /^changelog\.md$/i.test(path.basename(filePath))) {
    decide('deny', 'Never hand-edit CHANGELOG.md or any other generated file: let the generator own it.');
  }
}

// ---------- overtime flag ----------
// ~/.claude/state/ods-overtime.json switches the ODS work-hours rule off for the day. Only
// hooks/overtime.js writes it, from the owner's own /overtime command; an agent never sets or clears it.

const OVERTIME_FLAG = path.join(os.homedir(), '.claude', 'state', 'ods-overtime.json');
const OVERTIME_DENY =
  'Owner rule: only the owner turns ODS overtime on or off, with the /overtime or /overtime off command; ' +
  'hooks/overtime.js writes the flag. An agent never writes, moves or deletes ods-overtime.json.';
const OVERTIME_IN_CMD = /\.claude[\\/]+state[\\/]+ods-overtime\.json|ods-overtime\.json/i;
const WRITE_VERB = /\b(?:Set-Content|Add-Content|Out-File|New-Item|Remove-Item|Clear-Content|Copy-Item|Move-Item|Rename-Item|WriteAll(?:Text|Lines|Bytes)|rm|del|erase|cp|mv|touch|tee|ni|ri|sc|ac)\b|>|\bsed\s+-i\b|\bnode\b|\bpython[\d.]*\b|\bpy\b/i;

function checkOvertimeCmd(cmd) {
  if (OVERTIME_IN_CMD.test(cmd) && WRITE_VERB.test(cmd)) decide('deny', OVERTIME_DENY);
}

function checkOvertimePath(filePath) {
  if (filePath && path.resolve(filePath).toLowerCase() === OVERTIME_FLAG.toLowerCase()) decide('deny', OVERTIME_DENY);
}

// ---------- deliberate load ----------
// Owner rule 2026-11-02: this PC is not a load rig. Twelve unbounded spinner processes plus a full
// test suite hung it until a hard restart. Deliberate load goes only through scripts\box-load.ps1
// (capped, time-boxed, supervised, never beside a test run); ad-hoc busy loops, stress tools and
// burn*.ps1 scripts are denied. A box-load command needs no exemption: it has none of these.

const LOAD_DENY =
  'Owner rule: no ad-hoc load on this PC. Deliberate CPU or disk load goes only through ' +
  'scripts\\box-load.ps1 (capped, time-boxed, stops beside test runs; see its -Status and -Stop). ';

// What counts as "forever": $true (also backtick-escaped inside a PowerShell string), true, 1.
const FOREVER = '(?:`?\\$true|true|1)';

// Infinite loops with an empty body: denied in any command or file.
const EMPTY_LOOPS = [
  new RegExp('\\bwhile\\s*\\(\\s*' + FOREVER + '\\s*\\)\\s*\\{\\s*\\}', 'i'),
  /\bfor\s*\(\s*;\s*;\s*\)\s*\{\s*\}/,
  new RegExp('\\bdo\\s*\\{\\s*\\}\\s*(?:while\\s*\\(\\s*' + FOREVER + '|until\\s*\\(\\s*`?\\$?false)\\s*\\)', 'i'),
  /\b(?:while\s+(?:true|:)|until\s+false)[\s;]+do[\s;]+(?:(?::|true)[\s;]+)?done\b/,
  /\bwhile\s+(?:True|1)\s*:\s*pass\b/,
];

// Infinite-loop heads whose body is then checked: in commands and shell scripts a forever loop with
// no way out and no wait in its body is a spinner. (Other languages keep their loops: a C# worker's
// while (true) with a body is fine.)
const LOOP_HEADS = [
  { re: new RegExp('\\bwhile\\s*\\(\\s*' + FOREVER + '\\s*\\)\\s*\\{', 'gi'), end: 'brace' },
  { re: /\bfor\s*\(\s*;\s*;\s*\)\s*\{/g, end: 'brace' },
  { re: /\b(?:while\s+(?:true|:)|until\s+false)[\s;]+do\b/g, end: 'done' },
  // PowerShell do-blocks: forever only when the tail is while-true or until-false.
  { re: /\bdo\s*\{/gi, end: 'brace', tail: new RegExp('^\\s*(?:while\\s*\\(\\s*' + FOREVER + '|until\\s*\\(\\s*`?\\$?false)\\s*\\)', 'i') },
  // Inline Python (python -c with a while-True loop): its body runs to the end of the quoted argument.
  { re: /\bwhile\s+(?:True|1)\s*:/g, end: 'python' },
];
const LOOP_WAY_OUT = /\b(?:break|return|exit|throw|raise|sleep|Start-Sleep|Wait-\w+|WaitOne|WaitAny|WaitAll|WaitForExit|Read-Host|Receive-\w+|read|wait|timeout|Delay)\b/i;
const SCRIPT_FILE = /\.(?:ps1|psm1|sh|bash|cmd|bat)$/i;

// The loop body from just after its opening and the index just past it, or null when it does not
// close inside this text.
function loopBody(text, start, end) {
  if (end === 'python') {
    // Inside a quoted -c argument the body ends at its closing quote; in a heredoc, at its
    // terminator line; otherwise at the end of the text.
    const q = openQuoteAt(text, start);
    if (q) {
      for (let i = start; i < text.length; i++) {
        if ((text[i] === '\\' || text[i] === '`') && q === '"') i++;
        else if (text[i] === q) return { body: text.slice(start, i), next: i };
      }
    } else {
      let terminator = null;
      for (const h of text.slice(0, start).matchAll(/<<-?\s*(['"]?)(\w+)\1/g)) terminator = h[2];
      if (terminator) {
        const stop = new RegExp('^\\s*' + terminator + '\\s*$', 'm').exec(text.slice(start));
        if (stop) return { body: text.slice(start, start + stop.index), next: start + stop.index };
      }
    }
    return { body: text.slice(start), next: text.length };
  }
  if (end === 'done') {
    const stop = text.slice(start).search(/\bdone\b/);
    return stop === -1 ? null : { body: text.slice(start, start + stop), next: start + stop };
  }
  let depth = 1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return { body: text.slice(start, i), next: i + 1 };
  }
  return null;
}

// The quote character open at pos (a backslash or backtick escapes inside double quotes), or null.
function openQuoteAt(text, pos) {
  let q = null;
  for (let i = 0; i < pos; i++) {
    const c = text[i];
    if (q) {
      if ((c === '\\' || c === '`') && q === '"') i++;
      else if (c === q) q = null;
    } else if (c === '"' || c === "'") q = c;
  }
  return q;
}

// Way-out words count only as code: a "break" in a comment or a string does not end a loop.
// Python comments start at any # (its // is floor division); elsewhere # starts one at a token start
// (PowerShell, bash) and // anywhere except in a URL.
function codeOnly(body, python) {
  if (python) return body.replace(/"(?:[^"\\\n]|\\.)*"|'[^'\n]*'/g, '""').replace(/#[^\n]*/g, '');
  return body
    .replace(/<#[\s\S]*?#>|\/\*[\s\S]*?\*\//g, ' ')
    .replace(/"(?:[^"\\`\n]|[\\`].)*"|'[^'\n]*'/g, '""')
    .replace(/(^|[\s;{}])#[^\n]*/g, '$1')
    .replace(/(?<![:/])\/\/[^\n]*/g, '');
}

function busyLoop(text, checkBodies) {
  if (EMPTY_LOOPS.some((re) => re.test(text))) return true;
  if (!checkBodies) return false;
  for (const head of LOOP_HEADS) {
    for (const m of text.matchAll(head.re)) {
      const loop = loopBody(text, m.index + m[0].length, head.end);
      if (loop === null) continue;
      if (head.tail && !head.tail.test(text.slice(loop.next))) continue;
      if (!LOOP_WAY_OUT.test(codeOnly(loop.body, head.end === 'python'))) return true;
    }
  }
  return false;
}

// A search runs no loop: blank the quoted patterns of rg / grep / Select-String / git grep / findstr
// (same length, so later matches keep their positions) before looking for loops in a command.
const SEARCH_CMD = new RegExp(PREFIX + '(?:(?:rg|grep|egrep|fgrep|findstr|ag|Select-String|sls)(?:\\.exe)?|git(?:\\.exe)?\\s+grep)\\b', 'gi');

function withoutSearchPatterns(cmd) {
  let out = cmd;
  for (const m of cmd.matchAll(SEARCH_CMD)) {
    const start = m.index + m[0].length;
    const seg = segment(cmd.slice(start));
    const blanked = seg.replace(/"(?:[^"\\`]|[\\`].)*"|'[^']*'/g, (s) => s[0] + ' '.repeat(s.length - 2) + s[0]);
    out = out.slice(0, start) + blanked + out.slice(start + seg.length);
  }
  return out;
}

// A real stress run takes options (stress --cpu 8); requiring one, or the end, keeps a quoted regex
// alternative such as 'burn|stress' (whose | looks like a pipe here) from counting.
const STRESS_CMD = atCmd('stress(?:-ng)?(?:\\.exe)?(?=\\s+--?\\w|\\s*$)');
const BURN = 'burn[\\w.-]*\\.ps1(?=$|[\\s"\';&|)])';
const BURN_CMDS = [
  atCmd('(?:\\.\\s+["\']?(?:[^\\s"\';&|]*[\\\\/])?)?' + BURN),
  new RegExp('-File(?:Path)?[\\s"\',=]+(?:[^\\s"\';&|]*[\\\\/])?' + BURN, 'i'),
];

function loadCmdReason(cmd) {
  if (STRESS_CMD.test(cmd)) return 'This runs a stress tool.';
  if (BURN_CMDS.some((re) => re.test(cmd))) return 'This runs a burn*.ps1 script.';
  if (busyLoop(withoutSearchPatterns(cmd), true)) return 'This has an unbounded busy loop.';
  return '';
}

function loadWriteReason(ti) {
  const file = String(ti.file_path || ti.notebook_path || '');
  if (/^burn.*\.ps1$/i.test(path.basename(file))) return 'This writes a burn*.ps1 script.';
  const edits = Array.isArray(ti.edits) ? ti.edits.map((e) => e && e.new_string) : [];
  const texts = [ti.content, ti.new_string, ti.new_source, ...edits].filter((t) => typeof t === 'string');
  const script = SCRIPT_FILE.test(file);
  if (texts.some((t) => busyLoop(t, script))) return 'This writes an unbounded busy loop.';
  return '';
}

function checkLoadCmd(cmd) {
  const why = loadCmdReason(cmd);
  if (why) decide('deny', LOAD_DENY + why);
}

function checkLoadWrite(ti) {
  const why = loadWriteReason(ti);
  if (why) decide('deny', LOAD_DENY + why);
}

// ---------- session archiving ----------

const ARCHIVE_DENY =
  'Owner rule: Claude never archives a session and never turns on auto-archive. ' +
  'Only the owner archives sessions; leave the session as it is.';

function checkArchiveSetting(ti) {
  const key = String(ti.key || '');
  const value = ti.value;
  const off = value === false || value === 0 || value === 'false' || value === '0';
  if (/^auto_archive_/.test(key) && !off) decide('deny', ARCHIVE_DENY);
}

// ---------- main ----------

function main(input) {
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  const cwd = input.cwd || process.cwd();
  if (tool === 'Bash' || tool === 'PowerShell') {
    const cmd = String(ti.command || '');
    checkCodex(cmd);
    checkCommit(cmd, cwd);
    checkServices(cmd);
    checkBind(cmd);
    checkSecrets(cmd);
    checkOvertimeCmd(cmd);
    checkLoadCmd(cmd);
  } else if (tool === 'Edit' || tool === 'Write' || tool === 'MultiEdit' || tool === 'NotebookEdit') {
    checkGenerated(ti.file_path || ti.notebook_path);
    checkOvertimePath(ti.file_path || ti.notebook_path);
    checkLoadWrite(ti);
  } else if (/__archive_session$/.test(tool)) {
    decide('deny', ARCHIVE_DENY);
  } else if (/__set_setting$/.test(tool)) {
    checkArchiveSetting(ti);
  }
}

// Required as a module (false-positive sweeps), it only exports the load predicates.
if (require.main !== module) {
  module.exports = { loadCmdReason, loadWriteReason };
} else {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => { raw += c; });
  process.stdin.on('end', () => {
    try {
      main(JSON.parse(raw || '{}'));
    } catch (e) {
      process.stderr.write(`guard.js internal error, call allowed: ${e && e.message}\n`);
    }
    process.exit(0);
  });
}
