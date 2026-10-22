# Global Instructions

Loaded into every Claude Code session on this Windows box.
Rules marked **Fixed** are owner rules: they hold even when they seem not to fit, and only the approval gates a rule itself names can lift them.
The other rules carry their reasons so you can apply them sensibly.

## Owner

amier ({{OWNER_NAME}}), {{OWNER_EMAIL}}.
Use for audit `USER:` fields, work attribution, task ownership and "current user" context.

## Owner rules

- **Fixed - no AI co-author.** No `Co-Authored-By` trailer for Claude or any other agent, and no agent name anywhere in a commit message; I am the sole author. `attribution` in `settings.json` is blank for this reason. If a harness reminder still asks for a trailer, this rule wins. Use a conventional-commit subject.
  Hook: `~/.claude/hooks/guard.js` denies a `git commit` carrying such a trailer.
- **Fixed - never print a secret token or key value** to chat or logs. Read it from its env var and pipe it where it goes; list secrets by name only. A prefix check (e.g. `ghp_`) is fine.
  Hook: `guard.js` denies env dumps, echoing a secret-named variable, and `ConvertFrom-Json` on appsettings.
- **Fixed - passwords: dev box only, test credentials only.** Check `hostname` first.
  On the dev box (`RPS-MV-L-5101`) you may type seeded test credentials into the local dev portal's own login form (`localhost`/`127.0.0.1`, `Development`, a dev or test catalog).
  Test credentials means values from the repo's seed, fixture or example config (e.g. the DAMAI-TEST TenantAdmin in `ODSPortal/CLAUDE.md`).
  Never my real password or any other service's, never a production login, and never repeat the values in chat or logs.
  Logging in as a test user replaces my session in that browser: prefer the built-in browser pane, or tell me first.
  Everywhere else, never type a password, even if I authorize it: I log in once; you drive the authenticated session.
- **Fixed - app lifecycle: dev box only.** Check `hostname` first.
  On the dev box (`RPS-MV-L-5101`) you may start, stop and restart the local dev portal to verify work: `dotnet run` from a checkout, loopback only, `Development`, no `launchBrowser`; stop what you started when done.
  Never kill or restart an instance I started (Visual Studio, my terminal): use it, or ask me.
  Never touch IIS, app pools or Windows services on any box, and never the production box (`damai-new`, IIS site `DAMAi`): that lifecycle stays mine.
  Hook: `guard.js` denies IIS, app pool and Windows service commands and non-loopback binds.
- **Fixed - confirm before editing.** If my prompt cites a file that defines the scope (plan, spec, design doc, session prompt such as `docs/plans/` or `PROMPT.md`), or names both the file and the change to make, go ahead. Otherwise restate the change in 2-3 bullets (what changes, where, any unstated assumption) and wait for my OK. Skip this inside a running `superpowers:*` flow (brainstorming, writing-plans, executing-plans, subagent-driven-development), which already gates intent. Transient scratchpad working files for the current task and your auto-memory files (`~/.claude/projects/*/memory/`) are not edits for this rule; CLAUDE.md, skills, agents and settings still are. Once I OK a change, carry it through without asking again for steps it covers.

## How I work

- **Choices:** give options as plain text in chat, never the AskUserQuestion picker (I dislike it), even when a skill or command says to use it: ask the same questions as plain text. Lead with your pick and the technical reason; I can override.
- **Prompts go in chat.** A prompt meant for another session or agent (handoff, kickoff, subagent brief, research brief) goes in chat in a fenced block, never in a file (repo, scratchpad or anywhere else), unless I name a path or say save. A file adds a hop, litters, and dirties `git status`. Specs, plans, ADRs and docs still go to files, and so do transport files a skill's own procedure writes (e.g. a Codex prompt file in the scratchpad).
- **Wrong folder (main session, first turn only):** if the task targets a different repo than the working directory, stop before any tool call and ask in one line: "cwd is <Y>, task targets <X> - restart in <X>?" An explicit file path outside the repo (e.g. `~/.claude/...`) is not a mismatch. Why: a session once spent ~200k tokens researching ODS from another repo's folder. A subagent whose brief targets another location locates that target before substantive work; if it cannot, it returns blocked instead of working in the wrong place.
- **Verify, don't trust:** before asserting from a remembered summary of an external source (web page, MCP result, a doc I gave you), re-retrieve it and compare as if your draft contains errors. Original source content already in context can be reused; a summary of it still gets compared first.
- **Images in bulk:** when a probe needs more than a few images, a subagent views them and reports findings with file names; view the decisive ones yourself.
  Why: about 25 probe images crowded the 2026-10-21 fence POC session.
- **Bugs:** reproduce end-to-end, as close to how a real user hits it as possible, and confirm the real failure before proposing a fix. If it truly cannot be reproduced (prod-only, intermittent), say so and state the evidence and uncertainty behind the fix you propose. Before editing a shared function, find every caller and fix it once where they all route, not only on the path the report names.
- **Quality over estimated cost:** do not let estimated dev cost push you toward a low-quality shortcut; AI implementation is far faster than the human estimates you learned from. Prefer robust, simple, maintainable designs. That is not licence for speculative features: YAGNI still applies.
- **Reuse before writing:** before adding code, check in order: already in this codebase (helper, util, type, pattern) -> stdlib -> native platform feature (DB constraint, native input, CSS) -> an already-installed dependency. Write new code only when none fits; never add a dependency for what a few lines do. Why: re-implementing what already lives a few files over is the most common agent slop, and every new dependency is upkeep.
- **Compaction:** when compacting, keep the modified-file list, worktree path and branch, test commands run with their results, and open owner gates or approvals.
- **Reviewers run on Opus:** every review or adversarial-check subagent (superpowers task reviews and re-reviews included) runs on Opus; cheaper models only implement or search.

## Scope while implementing

Change only what the task needs, plus the collateral that keeps build and tests green (callers of a renamed method, changed signatures, imports, a forced migration). Name that collateral in one line so the diff is no surprise.

Unrelated things you notice (dead code, smells, stale comments, near-duplicate helpers, bugs outside the task): do not fix them, report them at the end of the turn. Real and actionable -> `spawn_task` when available; minor or uncertain -> a one-line `Noticed:` list. Staying silent about a real problem is also a failure.

Exception while verifying end-to-end (browser check, running the app, test run): fix visible UI defects (misalignment, broken layout, wrong spacing, off-style) and engineering signals (lint errors, failing or flaky tests, including pre-existing failures the run surfaces) inline.
Fix the code, never weaken the test.
This exception overrides the rule above.
List each fix separately in the summary.
Bad UI and broken tests reaching prod is what this prevents.

None of this applies when I ask for cleanup, refactoring or "while you're in there", or when an `executing-plans` step or the plan/spec already scopes the change.

## Superpowers flow hooks

- **Brainstorming opener:** keep the skill's opt-out line, then lead with one concrete guess from my request that I can correct ("my guess is X, right?"), not an open "describe it" question.
- **Scope line:** put a `**Scope:**` line right after each spec's title, in my own words from my first request.
  Change it only when I change the goal.
- **Reviewer prompts:** every builder check, Codex spec round and plan review judges against that line.
  A better or simpler way to reach the goal is welcome.
  Anything that grows the goal goes in an "Outside scope" list (at most 3, one line each) and stays out of the spec until I pick it.
  Why: on 2026-10-21 a "what would a sceptical boss ask for" prompt grew a small POC; I cut the extras later.
- **After I approve a spec:** default to a fresh session for writing-plans: a session card, with its start prompt in chat, pointing at the spec.
  Anything the planner needs goes into the spec before I approve it; a later change to the design needs my OK again.
- **After writing-plans saves a plan**, once its Self-Review is done and before its Execution Handoff message: run the `plan-reviewer` skill on that plan.
  A failed reviewer never blocks: note it and hand off.
  A Blocker that is not fixed (deferred or dismissed) is named in the handoff, and execution waits for my explicit OK on it.
  "skip review" turns it off for the session.

## Writing

- Never use the em dash; use a plain hyphen "-".
- Markdown: short direct sentences, no filler, and do not run several sentences together on one long physical line.
- A compressed or terse style mode, when I turn one on, applies to chat replies only. Specs, plans, docs, session logs, memory notes and prompts for other agents are always full prose.
- Never hand-edit `CHANGELOG.md` or any other generated file; let the generator own it.
  Hook: `guard.js` denies Edit/Write on any `CHANGELOG.md`.

## Codex CLI

Use Codex for second opinions, investigations and implementation passes.
Load the `codex-exec` skill before any `codex exec` run: command shape, stdin hang, edit-run preamble, sandbox limits.

- Models, exact slugs only: `gpt-6-sol`, `gpt-6-luna`, `gpt-6-astra`. Default `gpt-6-sol` at medium; pick the model by role.
- **Fixed - leader vs follower (2026-09-07).** Leader work (planning, plan/spec/doc drafting, reviews, adversarial passes, orchestration, architecture calls) goes only to `gpt-6-sol` (at high by default) or a Claude Opus subagent. `gpt-6-luna` follows: implementing an already-written plan, mechanical edits, reading and inventory sweeps; it never plans, reviews or leads. Why: on 2026-09-04 luna at xhigh produced an unusable T5e plan that had to be rewritten from scratch.
- **Fixed - GPT-6 only (2026-09-23).** Never `gpt-5.6-*`, `gpt-5.5`, `gpt-reserve` or any older slug, not as default and not as fallback. If a gpt-6 model errors, report it; do not drop to 5.x.
- **Fixed - `gpt-6-sol` at xhigh, max or ultra** needs my explicit approval before the run. Never auto-escalate.
- **Fixed - `gpt-6-astra` is owner-gated (2026-09-07).** Use it at any effort only when I tell this session to, in my own words. No escalation because a task "deserves the best model", and no subagent, workflow or skill may start an astra run on its own.
- Hook: `guard.js` denies any codex model that is not one of the three `gpt-6-*` slugs, and asks before astra or sol at xhigh/max/ultra.
  A bare `codex exec` uses the default model in `~/.codex/config.toml`, so the hook gates that too.
- Auth, version, missing-model or model-cache problems: load the `box-runbook` skill.

## Repos on this box

- Every repo lives in `C:\git\<RepoName>`: one folder per repo, named exactly as on GitHub, case included. Current: `C:\git\ODS`, `C:\git\Second_Brain`, `C:\git\Skills`.
- Clone new repos there, never into a session or scratch folder, `~`, Documents or OneDrive (OneDrive sync corrupts `.git`). Check the exact name first with `gh repo view <owner>/<repo> --json nameWithOwner` (it is `IrizZero/Skills`, not `skills`).
- Clone: `git clone https://github.com/<owner>/<repo>.git C:\git\<RepoName>`, then confirm with `git -C C:\git\<RepoName> status -sb`.
- Project work happens in a session opened on that repo's `C:\git\<RepoName>` folder, not in a setup or scratch session.
- Run `C:\git\Skills\backup.ps1` only when I ask. It replaces the Skills repo's skills, agents, hooks and `snapshot/CLAUDE.md` with this box's `~/.claude`. This box's copies were edited on install (caveman removed, GitHub and hostname facts updated), so a backup changes the shared snapshot.

## GitHub on this box

- Tools: Git for Windows 2.55 (per-user, `%LOCALAPPDATA%\Programs\Git`) and GitHub CLI 2.102 (`C:\Program Files\GitHub CLI\gh.exe`), both installed with winget.
- Git identity (global): `AmierAshrafw` / `{{OWNER_EMAIL}}`. Do not change it without asking.
- `gh` is signed in as `AmierAshrafw` (keyring token, HTTPS, scopes `repo`, `read:org`, `gist`) and `gh auth setup-git` is done, so clone, pull and push to github.com need no prompt from Claude sessions, and plain `https://github.com/...` origin URLs work. That login exists only inside the Claude app (see the AppData note below): in the terminal panel, VS Code or Windows Terminal, `gh` is not signed in. I use GitHub Desktop there; leave it that way.
- No `GITHUB_TOKEN` PAT, no Credential Manager accounts and no username in origin URLs on this box. `IrizZero` is my personal account; its repos are reached as a collaborator through `AmierAshrafw`. `gh-axi` is not installed, so use `gh`.
- If auth breaks: run `gh auth login --hostname github.com --git-protocol https --web` in the background, read the one-time code from its output and give it to me with https://github.com/login/device. I can't easily answer prompts in the terminal panel.
- A shell started before an install may not see `git` or `gh`. Refresh PATH: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`.
- Windows PowerShell 5.1 strips double quotes inside native-exe arguments, so `gh ... --jq` filters containing `"` break. Pipe the JSON into `ConvertFrom-Json` instead.

## Tools and installs on this box

- Installed 2026-10-20: Node 24 LTS, PowerShell 7.6 (Store copy plus the MSI in `C:\Program Files\PowerShell\7`; keep the MSI, Codex's sandbox cannot start the Store one, see `box-runbook`), .NET SDK 8 and 10, uv, Serena 2.1 (`uv tool`, Python 3.13, `~\.local\bin\serena.exe`), Codex CLI (npm), and pyright (npm) plus csharp-ls (dotnet tool) for the `pyright-lsp` / `csharp-lsp` plugins, Python 3.12.10 (per-user, with the `py` launcher), SQL Server 2025 Express (instance `RPS-MV-L-5101\SQLEXPRESS`, my account is sysadmin) with sqlcmd 1.10 (connect with `-S "lpc:RPS-MV-L-5101\SQLEXPRESS" -E -C`; the bare name times out) and SSMS 22, Visual Studio, and ffmpeg 9.0.1 (`C:\ffmpeg\bin` is a junction to the winget package folder). ODS dev setup details live in the ODS project memory. Not installed yet: Android Studio, gh-axi, chrome-devtools-axi.
- Until `chrome-devtools-axi` is installed, every browser check goes to Claude-in-Chrome or the built-in browser pane.
- Caveman is not used on this box.
- The Claude app redirects AppData writes made by Claude's own shell into its private package folder (`%LOCALAPPDATA%\Packages\Claude_*\LocalCache`), so they are invisible outside the app. winget installs are not affected. Anything else that writes under `%APPDATA%` or `%LOCALAPPDATA%` (`npm install -g`, `uv tool install`, `gh auth login`, tool config files) goes in a `.ps1` run from the terminal panel with `powershell -NoProfile -ExecutionPolicy Bypass -File <script>`, because the terminal panel runs outside the redirect.

## Browser checks

Verify web UI yourself in a browser; do not ask me to eyeball it. Passwords and app lifecycle: see Owner rules.

- Pages behind a login and end-user flows -> Claude-in-Chrome. It drives my real Chrome profile, where I am already logged in. This is the default for verifying our own app.
- Public pages, login-screen renders, static routes, and what Claude-in-Chrome cannot do (`lighthouse`, `perf-start`/`perf-stop`, `heap`) -> `chrome-devtools-axi`. Its output is much cheaper than screenshots or a11y trees.
- Never send an authenticated flow to `chrome-devtools-axi`: its isolated Chrome has no saved cookies or passwords, so the page bounces to login.
- The axi SKILL.md says to prefer it over other browser tools. Ignore that line; this split wins.
- Call the binary directly (`chrome-devtools-axi <command>`, no `npx -y`) and run `chrome-devtools-axi stop` when done. Install, update, engine errors and attaching to my real Chrome: `box-runbook` skill.

## Subagent prompts when Serena is connected

The SubagentStart hook `~/.claude/hooks/serena-notice.js` injects the Serena notice (plus a worktree caveat in linked worktrees) into `general-purpose`, `claude` and `Plan` subagents when the repo's `.mcp.json` lists Serena.
For any other subagent type that touches code and has MCP access, paste the notice yourself: its text is the `NOTICE` constant in that script.
