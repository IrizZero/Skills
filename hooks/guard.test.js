#!/usr/bin/env node
// Fixture runner for guard.js: pipes sample tool calls into it, as the harness does, and checks
// the decision (deny / ask / allow). Run: node ~/.claude/hooks/guard.test.js  (exit 1 on any failure).
// The busy-loop samples are assembled from pieces, so this file never holds one literally:
// guard.js also scans content written with Edit/Write.
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const GUARD = path.join(__dirname, 'guard.js');

function decisionFor(tool, input) {
  const r = spawnSync(process.execPath, [GUARD], {
    input: JSON.stringify({ tool_name: tool, tool_input: input, cwd: __dirname }),
    encoding: 'utf8',
  });
  const out = (r.stdout || '').trim();
  if (!out) return 'allow';
  return JSON.parse(out).hookSpecificOutput.permissionDecision;
}

// A commit message file that names an agent, for the -F case.
const NAMED_MSG_FILE = path.join(require('os').tmpdir(), 'guard-test-commit-msg.txt').replace(/\\/g, '/');
require('fs').writeFileSync(NAMED_MSG_FILE, 'feat: z\n\nPlanned by Fable, built by Opus.\n');

const T = '$' + 'true';
const EMPTY = '{' + '}';
const PS_SPIN = 'while(' + T + ')' + EMPTY;
const FOREVER = 'for(;' + ';)' + EMPTY;
const WHILE = 'while';
const PY_SPIN = WHILE + ' True: pass';

const cases = [
  // ---- deliberate load: denied ----
  ['ps empty while-true', 'PowerShell', { command: PS_SPIN }, 'deny'],
  ['ps empty while-true, spaced', 'PowerShell', { command: 'while (' + T + ') { }' }, 'deny'],
  ['ps while(1) empty', 'PowerShell', { command: 'while (1) ' + EMPTY }, 'deny'],
  ['burn.ps1 style spinner via Start-Process', 'PowerShell',
    { command: "Start-Process powershell -ArgumentList '-NoProfile','-Command','" + PS_SPIN + "' -WindowStyle Hidden -PassThru" }, 'deny'],
  ['backtick-escaped io churner, body without exit', 'PowerShell',
    { command: '$cmd = "`$b = New-Object byte[] 1048576; while(`' + T + '){ for(`$k=0;`$k -lt 40;`$k++){ [IO.File]::WriteAllBytes(\'d\\f\' + `$k, `$b) }; Get-ChildItem d | Remove-Item -Force }"' }, 'deny'],
  ['ps while-true with a trivial body', 'PowerShell', { command: 'while (' + T + ') { $i++ }' }, 'deny'],
  ['node -e for-ever', 'Bash', { command: 'node -e "' + FOREVER + '"' }, 'deny'],
  ['bash while true', 'Bash', { command: WHILE + ' true; do :; done' }, 'deny'],
  ['bash while colon', 'Bash', { command: WHILE + ' :; do :; done' }, 'deny'],
  ['bash while true, body without wait', 'Bash', { command: WHILE + ' true; do curl -s localhost:5030 >/dev/null; done' }, 'deny'],
  ['stress-ng', 'Bash', { command: 'stress-ng --cpu 4 --timeout 60s' }, 'deny'],
  ['stress after a separator', 'Bash', { command: 'cd /tmp && stress --cpu 8' }, 'deny'],
  ['run burn.ps1 by path', 'PowerShell', { command: '& "C:\\x\\rv29\\burn.ps1" -Action start -Count 12' }, 'deny'],
  ['run burn.ps1 with -File', 'PowerShell', { command: 'powershell -NoProfile -File .\\burn.ps1 -Action start' }, 'deny'],
  ['dot-source a burn script', 'PowerShell', { command: '. .\\burn-cpu.ps1' }, 'deny'],
  ['write a burn*.ps1 file', 'Write', { file_path: 'C:\\x\\burn.ps1', content: 'param()' }, 'deny'],
  ['write a .ps1 holding an empty while-true', 'Write', { file_path: 'C:\\x\\load.ps1', content: 'param()\n' + PS_SPIN + '\n' }, 'deny'],
  ['write a .ps1 with while-true and no exit', 'Write', { file_path: 'C:\\x\\load.ps1', content: 'while (' + T + ') {\n  $n++\n}\n' }, 'deny'],
  ['edit adds an empty while-true', 'Edit', { file_path: 'C:\\x\\a.ps1', old_string: 'x', new_string: PS_SPIN }, 'deny'],
  ['multiedit adds a for-ever in C#', 'MultiEdit', { file_path: 'C:\\x\\a.cs', edits: [{ old_string: 'x', new_string: FOREVER }] }, 'deny'],
  ['python forever loop that only passes', 'Write', { file_path: 'C:\\x\\spin.py', content: WHILE + ' True:\n    pass\n' }, 'deny'],
  ['notebook cell spinning', 'NotebookEdit', { notebook_path: 'C:\\x\\n.ipynb', new_source: PY_SPIN }, 'deny'],
  ['box-load then a spinner in one command', 'PowerShell',
    { command: 'powershell -File scripts\\box-load.ps1 -Cpu 2; ' + PS_SPIN }, 'deny'],
  // Review 2026-11-03: do-while bodies, inline Python, and exit words that are only comments or strings.
  ['ps do-while-true with a trivial body', 'PowerShell', { command: 'do { $i++ } ' + WHILE + ' (' + T + ')' }, 'deny'],
  ['ps do-until-false with a trivial body', 'PowerShell', { command: 'do { $i++ } until ($' + 'false)' }, 'deny'],
  ['inline python forever loop', 'Bash', { command: 'python -c "' + WHILE + ' True: x += 1"' }, 'deny'],
  ['inline python while 1', 'PowerShell', { command: "py -c '" + WHILE + " 1: n = n + 1'" }, 'deny'],
  ['exit word only in a comment', 'PowerShell', { command: WHILE + ' (' + T + ') { $i++; # break later\n}' }, 'deny'],
  ['exit word only in a string', 'PowerShell', { command: WHILE + ' (' + T + ') { $i++; Write-Host "break" }' }, 'deny'],
  ['a search, then a spinner', 'Bash', { command: 'rg -n foo scripts; ' + PS_SPIN }, 'deny'],
  // Review round 2: the Python body is its quoted -c argument, and a // comment needs no space before it.
  ['inline python forever loop, an exit after the quote', 'Bash', { command: 'python -c "' + WHILE + ' True: x += 1"; exit' }, 'deny'],
  ['js for-ever whose break is a comment after an operator', 'Bash', { command: 'node -e "for (;' + ';) { i++// break\n}"' }, 'deny'],
  // Review round 3: a heredoc body ends at its terminator, and // after a word is a comment too.
  ['python heredoc spinner, an exit after the terminator', 'Bash', { command: "python - <<'PY'\n" + WHILE + ' True: x += 1\nPY\nexit 0' }, 'deny'],
  ['js for-ever whose break is a comment after a word', 'Bash', { command: 'node -e "for (;' + ';) { i// break\n}"' }, 'deny'],

  // ---- allowed ----
  ['box-load start', 'PowerShell', { command: 'powershell -NoProfile -ExecutionPolicy Bypass -File scripts\\box-load.ps1 -Cpu 2 -Minutes 0.5' }, 'allow'],
  ['box-load disk', 'PowerShell', { command: 'powershell -NoProfile -ExecutionPolicy Bypass -File C:\\git\\ODS\\scripts\\box-load.ps1 -Disk -Minutes 5' }, 'allow'],
  ['box-load stop', 'Bash', { command: 'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/box-load.ps1 -Stop' }, 'allow'],
  ['box-load self-test', 'PowerShell', { command: 'pwsh -NoProfile -File scripts\\tests\\box-load.tests.ps1' }, 'allow'],
  ['C# while(true) with a body', 'Write',
    { file_path: 'C:\\x\\Worker.cs', content: 'while (true)\n{\n    var job = await queue.ReadAsync(ct);\n    Handle(job);\n}\n' }, 'allow'],
  ['C# while(true) with a body and no exit word', 'Write', { file_path: 'C:\\x\\Worker.cs', content: 'while (true) { Handle(queue.Take()); }' }, 'allow'],
  ['js for-ever with a body', 'Write', { file_path: 'C:\\x\\a.js', content: 'for (;;) { const x = next(); if (!x) break; }' }, 'allow'],
  ['ps polling loop with sleep and break', 'PowerShell',
    { command: 'while (' + T + ') { if (Test-Path x) { break }; Start-Sleep -Seconds 1 }' }, 'allow'],
  ['ps script loop with a return', 'Write',
    { file_path: 'C:\\x\\poll.ps1', content: 'while (' + T + ') {\n  $r = Get-Thing\n  if ($r) { return $r }\n}\n' }, 'allow'],
  ['bash watch loop with sleep', 'Bash', { command: WHILE + ' true; do git status; sleep 5; done' }, 'allow'],
  // Found by the false-positive sweep of past tool calls: a quoted regex alternative is not a command.
  ['process filter regex naming stress', 'PowerShell',
    { command: "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'burn|loaded|run4|stress' } | Select-Object ProcessId" }, 'allow'],
  ['Select-String pattern naming stress', 'PowerShell', { command: "Select-String -Path x.md -Pattern 'load|burn|spin|stress|cpu'" }, 'allow'],
  ['ps do-while-true polling a job', 'PowerShell',
    { command: 'do { $r = Get-Job 1; if ($r.State -eq "Completed") { break } } ' + WHILE + ' (' + T + ')' }, 'allow'],
  ['inline python loop that sleeps', 'Bash', { command: 'python -c "import time\n' + WHILE + ' True:\n    time.sleep(1); print(1)"' }, 'allow'],
  ['inline python loop that breaks', 'Bash', { command: 'python -c "' + WHILE + ' True:\n    if done(): break"' }, 'allow'],
  ['bash loop with a URL and a sleep', 'Bash', { command: WHILE + ' true; do curl -s http://localhost:5030/health; sleep 5; done' }, 'allow'],
  ['inline python with floor division and a sleep', 'Bash', { command: 'python -c "import time\n' + WHILE + ' True: n = n//2; time.sleep(1)"' }, 'allow'],
  ['python heredoc whose break is on a later line', 'Bash', { command: "python - <<'EOF'\n" + WHILE + ' True:\n    if done(): break\nEOF' }, 'allow'],
  ['a real break beside a comment', 'PowerShell', { command: WHILE + ' (' + T + ') { # poll\n if (Test-Path x) { break }; Start-Sleep 1 }' }, 'allow'],
  // Review 2026-11-03 (minor): a search whose quoted pattern is a loop runs no loop.
  ['rg for a spinner pattern', 'Bash', { command: "rg -n '" + WHILE + ' (' + T + ") { $i++ }' scripts" }, 'allow'],
  ['grep for an empty for-ever', 'Bash', { command: 'grep -rn "' + FOREVER + '" src' }, 'allow'],
  ['Select-String for a spinner', 'PowerShell', { command: "Select-String -Path *.ps1 -SimpleMatch -Pattern '" + PS_SPIN + "'" }, 'allow'],
  ['deadline-bounded spin', 'PowerShell', { command: 'while ([DateTime]::UtcNow -lt $deadline) { $n++ }' }, 'allow'],
  ['commit message naming burn.ps1', 'Bash', { command: 'git commit -m "docs: retire burn.ps1"' }, 'allow'],
  ['reading the disabled burner', 'PowerShell', { command: 'Get-Content C:\\x\\burn.ps1.disabled-pending-guard-rail' }, 'allow'],
  ['grep for burn.ps1', 'Bash', { command: 'git grep -n "burn.ps1" -- docs' }, 'allow'],
  ['stress-test.ps1 is not stress', 'PowerShell', { command: '.\\stress-test.ps1 -Quick' }, 'allow'],
  ['grep for stress', 'Bash', { command: 'grep -rn "stress" docs' }, 'allow'],
  ['markdown describing a spinner with an ellipsis', 'Write',
    { file_path: 'C:\\x\\notes.md', content: 'Never start `while (' + T + ') {...}` spinners.' }, 'allow'],
  ['writing burndown notes in markdown', 'Write', { file_path: 'C:\\x\\burn-notes.md', content: 'x' }, 'allow'],

  // ---- the older rules still fire ----
  ['codex non-GPT-6 model', 'Bash', { command: 'codex exec -m gpt-5.5 "hi"' }, 'deny'],
  ['commit with a co-author trailer', 'Bash', { command: 'git commit -m "x\n\nCo-Authored-By: Claude <noreply@anthropic.com>"' }, 'deny'],
  // ---- agent or model names in a commit message: ask ----
  ['commit message naming a model', 'Bash', { command: 'git commit -m "feat: rule debated with gpt-6-sol at high in two rounds" -- a.py' }, 'ask'],
  ['commit message naming an agent', 'Bash', { command: "git commit -qm 'fix: as Claude suggested' -- a.py" }, 'ask'],
  ['commit heredoc body naming a model', 'Bash',
    { command: 'git commit -m "$(cat <<\'EOF\'\nfeat: x\n\nReviewed by Opus 5.5 before the gate.\nEOF\n)"' }, 'ask'],
  ['ps here-string message naming a model', 'PowerShell', { command: "git commit -m @'\ndocs: y\n\nDrafted with Sonnet.\n'@" }, 'ask'],
  ['commit -F file naming an agent', 'Bash', { command: 'git commit -F "' + NAMED_MSG_FILE + '"' }, 'ask'],
  ['trailer still wins over the name check', 'Bash', { command: 'git commit -m "x by codex\n\nCo-Authored-By: Codex <a@b>"' }, 'deny'],
  ['commit about CLAUDE.md', 'Bash', { command: 'git commit -m "docs: update CLAUDE.md and the .claude/rules gate" -- CLAUDE.md' }, 'allow'],
  ['commit about the codex-exec skill', 'Bash', { command: 'git commit -m "docs(skills): codex-exec stdin note, claude-in-chrome pairing" -- x.md' }, 'allow'],
  ['commit with a path that names an agent', 'Bash', { command: 'git commit -m "chore: hooks" -- .claude/hooks/a.js docs/codex/notes.md' }, 'allow'],
  ['plain commit', 'Bash', { command: 'git commit -m "fix(river): zone mask off by one" -- a.cs' }, 'allow'],
  ['git log grep for a model name is not a commit', 'Bash', { command: 'git log --grep "gpt-6-sol" --oneline' }, 'allow'],
  ['iisreset', 'PowerShell', { command: 'iisreset /restart' }, 'deny'],
  ['env dump', 'Bash', { command: 'printenv' }, 'deny'],
  ['changelog edit', 'Edit', { file_path: 'C:\\x\\CHANGELOG.md', old_string: 'a', new_string: 'b' }, 'deny'],
  ['plain build', 'PowerShell', { command: 'dotnet build ODSPortal/ODSPortal.sln' }, 'allow'],
];

let failed = 0;
for (const [name, tool, input, expected] of cases) {
  const got = decisionFor(tool, input);
  if (got === expected) {
    console.log(`PASS ${name}`);
  } else {
    failed++;
    console.log(`FAIL ${name}: expected ${expected}, got ${got}`);
  }
}
console.log(failed ? `${failed} of ${cases.length} FAILED` : `ALL ${cases.length} PASSED`);
process.exit(failed ? 1 : 0);
