# Global Instructions

Loaded into every Claude Code session on this Windows box.
Rules marked **Fixed** are owner rules: they hold even when they seem not to fit, and only the approval gates a rule itself names can lift them.
The other rules carry their reasons so you can apply them sensibly.

## Owner

amier ({{OWNER_NAME}}), {{OWNER_EMAIL}}.
Use for audit `USER:` fields, work attribution, task ownership and "current user" context.

## Owner rules

- **Fixed - no AI co-author.** No `Co-Authored-By` trailer for Claude or any other agent, and no agent name anywhere in a commit message; I am the sole author. `attribution` in `settings.json` is blank for this reason. If a harness reminder still asks for a trailer, this rule wins. Use a conventional-commit subject.
- **Fixed - never print a secret token or key value** to chat or logs. Read it from its env var and pipe it where it goes; list secrets by name only. A prefix check (e.g. `ghp_`) is fine.
- **Fixed - never type a password** into a login form, even seeded or local test credentials, even if I authorize it. I log in once; you drive the authenticated session.
- **Fixed - the app's lifecycle is mine.** Never start, stop or restart the app under test (`dotnet run`, IIS, app pool, dev servers). Ask me, then drive it once it is up.
- **Fixed - confirm before editing.** If my prompt cites a file that defines the scope (plan, spec, design doc, session prompt such as `docs/plans/` or `PROMPT.md`), or names both the file and the change to make, go ahead. Otherwise restate the change in 2-3 bullets (what changes, where, any unstated assumption) and wait for my OK. Skip this inside a running `superpowers:*` flow (brainstorming, writing-plans, executing-plans, subagent-driven-development), which already gates intent. Transient scratchpad working files for the current task and your auto-memory files (`~/.claude/projects/*/memory/`) are not edits for this rule; CLAUDE.md, skills, agents and settings still are. Once I OK a change, carry it through without asking again for steps it covers.

## How I work

- **Choices:** give options as plain text in chat, never the AskUserQuestion picker (I dislike it). Lead with your pick and the technical reason; I can override.
- **Prompts go in chat.** A prompt meant for another session or agent (handoff, kickoff, subagent brief, research brief) goes in chat in a fenced block, never in a file (repo, scratchpad or anywhere else), unless I name a path or say save. A file adds a hop, litters, and dirties `git status`. Specs, plans, ADRs and docs still go to files, and so do transport files a skill's own procedure writes (e.g. a Codex prompt file in the scratchpad).
- **Wrong folder (main session, first turn only):** if the task targets a different repo than the working directory, stop before any tool call and ask in one line: "cwd is <Y>, task targets <X> - restart in <X>?" An explicit file path outside the repo (e.g. `~/.claude/...`) is not a mismatch. Why: on 2026-09-02 a session spent ~200k tokens researching ODS from the Vision Dataset Manager folder. A subagent whose brief targets another location locates that target before substantive work; if it cannot, it returns blocked instead of working in the wrong place.
- **Verify, don't trust:** before asserting from a remembered summary of an external source (web page, MCP result, a doc I gave you), re-retrieve it and compare as if your draft contains errors. Original source content already in context can be reused; a summary of it still gets compared first.
- **Bugs:** reproduce end-to-end, as close to how a real user hits it as possible, and confirm the real failure before proposing a fix. If it truly cannot be reproduced (prod-only, intermittent), say so and state the evidence and uncertainty behind the fix you propose.
- **Quality over estimated cost:** do not let estimated dev cost push you toward a low-quality shortcut; AI implementation is far faster than the human estimates you learned from. Prefer robust, simple, maintainable designs. That is not licence for speculative features: YAGNI still applies.

## Scope while implementing

Change only what the task needs, plus the collateral that keeps build and tests green (callers of a renamed method, changed signatures, imports, a forced migration). Name that collateral in one line so the diff is no surprise.

Unrelated things you notice (dead code, smells, stale comments, near-duplicate helpers, bugs outside the task): do not fix them, report them at the end of the turn. Real and actionable -> `spawn_task` when available; minor or uncertain -> a one-line `Noticed:` list. Staying silent about a real problem is also a failure.

Exception while verifying end-to-end (browser check, running the app, test run): fix visible UI defects (misalignment, broken layout, wrong spacing, off-style) and engineering signals (lint errors, failing or flaky tests) inline, and list each fix in the summary. Bad UI and broken tests reaching prod is what this prevents.

None of this applies when I ask for cleanup, refactoring or "while you're in there", or when an `executing-plans` step or the plan/spec already scopes the change.

## Writing

- Never use the em dash; use a plain hyphen "-".
- Markdown: short direct sentences, no filler, and do not run several sentences together on one long physical line.
- Never hand-edit `CHANGELOG.md` or any other generated file; let the generator own it.

## Codex CLI

Use Codex for second opinions, investigations and implementation passes.

- Run it directly: `codex exec -m <model> -c model_reasoning_effort=<effort> --sandbox <read-only|workspace-write> "<prompt>"`. Pass the prompt as an argument, never on stdin (stdin hangs on Windows). Read-only for reviews and investigations, workspace-write for edits. The sandbox has no network. There is no `--effort` flag.
- Never use the openai-codex plugin's background/companion runtime: it deadlocked on Windows (prod box 2026-08-15; this box 2026-08-17, a 17-minute stall after one command). The plugin was removed on 2026-09-28; do not reinstall it.
- Models, exact slugs only: `gpt-6-sol`, `gpt-6-luna`, `gpt-6-astra` (bare `luna` errors; there are no aliases). Efforts: `low | medium | high | xhigh | max`, plus `ultra` on sol and astra (max reasoning with automatic task delegation).
- Default `gpt-6-sol` at medium. Pick the model by role.
- **Fixed - leader vs follower (2026-09-07).** Leader work (planning, plan/spec/doc drafting, reviews, adversarial passes, orchestration, architecture calls) goes only to `gpt-6-sol` (at high by default) or a Claude Opus subagent. `gpt-6-luna` follows: implementing an already-written plan, mechanical edits, reading and inventory sweeps; it never plans, reviews or leads. Why: on 2026-09-04 luna at xhigh produced an unusable T5e plan that had to be rewritten from scratch.
- **Fixed - GPT-6 only (2026-09-23).** Never `gpt-5.6-*`, `gpt-5.5`, `gpt-reserve` or any older slug, not as default and not as fallback. If a gpt-6 model errors, report it; do not drop to 5.x.
- **Fixed - `gpt-6-sol` at xhigh, max or ultra** needs my explicit approval before the run. Never auto-escalate.
- **Fixed - `gpt-6-astra` is owner-gated (2026-09-07).** Use it at any effort only when I tell this session to, in my own words. No escalation because a task "deserves the best model", and no subagent, workflow or skill may start an astra run on its own.
- Auth, version, missing-model or model-cache problems: load the `box-runbook` skill.

## GitHub on this box

- Prefer `gh-axi` over `gh` for issues, PRs, runs and releases (e.g. `gh-axi issue list --state open`, `gh-axi pr view 42`). Fall back to `gh` if it errors or lacks the subcommand. Both use `GITHUB_TOKEN` from the Windows User env vars; no `gh auth login`.
- Credential Manager holds both `AmierAshrafw` and `IrizZero`. A repo under `AmierAshrafw` needs the username in its origin URL: `https://AmierAshrafw@github.com/AmierAshrafw/<repo>.git`. Without it the wrong account can be picked and GitHub answers "Repository not found".
- The classic PAT expires 2026-10-04: regenerate it before then. Rotation steps, auth errors and 403s: load the `box-runbook` skill.

## Browser checks

Verify web UI yourself in a browser; do not ask me to eyeball it. Passwords and app lifecycle: see Owner rules.

- Pages behind a login and end-user flows -> Claude-in-Chrome. It drives my real Chrome profile, where I am already logged in. This is the default for verifying our own app.
- Public pages, login-screen renders, static routes, and what Claude-in-Chrome cannot do (`lighthouse`, `perf-start`/`perf-stop`, `heap`) -> `chrome-devtools-axi`. Its output is much cheaper than screenshots or a11y trees.
- Never send an authenticated flow to `chrome-devtools-axi`: its isolated Chrome has no saved cookies or passwords, so the page bounces to login.
- The axi SKILL.md says to prefer it over other browser tools. Ignore that line; this split wins.
- Call the binary directly (`chrome-devtools-axi <command>`, no `npx -y`) and run `chrome-devtools-axi stop` when done. Install, update, engine errors and attaching to my real Chrome: `box-runbook` skill.

## Subagent prompts when Serena is connected

When Serena MCP is connected, include this notice verbatim in every subagent prompt that touches source code (Agent tool, workflow `agent()`), because subagents start fresh and default to Grep/Read. Skip it when the subagent has no MCP access (e.g. `Explore`) or the task touches no code.

> Serena MCP is available in this repo - prefer symbol-aware nav over text
> search for code. `find_symbol` (locate a class/method), `find_referencing_symbols`
> (who calls it), `get_symbols_overview` (understand a file before reading it).
> Their schemas are deferred: load them first with one call -
> `ToolSearch` query `select:mcp__serena__find_symbol,mcp__serena__find_referencing_symbols,mcp__serena__get_symbols_overview`.
> Grep/Read stay correct for non-code files (`.json`, `.cshtml`, `.md`, `.sql`, `.yml`).

## Superpowers flow hooks

These fire inside `superpowers:*` flows. Each named skill carries its own procedure and main-thread duties; this section only says when to run it. All are advisory: a failure never blocks the flow, so note it in chat and continue.

- **Brainstorming step 4**, before you propose approaches: run `solution-auditor` and follow it, including its exit check between steps 7 and 8. "skip audit" turns it off for the session.
- **End of brainstorming**, before writing-plans starts: sort every open question. Sharp (you can state it precisely now, even if it is unanswerable) -> a plan decision or step. Blurry (you cannot phrase it sharply) -> the plan's fog section, verbatim and unsliced. Never pre-slice fog into steps.
- **Every plan from writing-plans ends with:**

      ## Not yet specified
      <in scope but too blurry to plan. If empty, say "way is fully clear".>

      ## Out of scope
      <consciously ruled out, one-line reason each>

- **After writing-plans saves a plan** (normally under `docs/superpowers/plans/`): run `plan-reviewer`, then `yagni-guardian` on the same plan, passing its path, then go to my review gate. Triage and record findings as each skill's verdict policy says. "skip review" and "skip yagni" turn them off.
- **During executing-plans**, when something is blurry: listed in the fog sections -> skip it; not listed -> stop and ask. A plan missing its fog sections -> flag it in chat and continue.
