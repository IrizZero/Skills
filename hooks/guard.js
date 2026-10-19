#!/usr/bin/env node
// PreToolUse guard for the owner's Fixed rules in ~/.claude/CLAUDE.md.
// Wired in ~/.claude/settings.json for Bash|PowerShell|Edit|Write|MultiEdit|NotebookEdit.
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
  const file = rest.match(/(?:^|\s)(?:-F|--file)(?:\s+|=)("[^"]+"|'[^']+'|\S+)/);
  if (!hit && file) {
    const p = file[1].replace(/^["']|["']$/g, '');
    try {
      hit = TRAILER.test(fs.readFileSync(path.resolve(cwd, p), 'utf8'));
    } catch { /* unreadable or stdin: nothing to check */ }
  }
  if (hit) {
    decide('deny', 'Fixed rule no AI co-author: remove the Co-Authored-By / Claude attribution lines. The owner is the sole author.');
  }
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
  } else if (tool === 'Edit' || tool === 'Write' || tool === 'MultiEdit' || tool === 'NotebookEdit') {
    checkGenerated(ti.file_path || ti.notebook_path);
  }
}

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
