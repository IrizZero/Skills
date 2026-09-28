# Global AI Instructions

Every project, every session.

---

## Owner / Identity

- **Owner:** amier ({{OWNER_NAME}})
- **Email:** {{OWNER_EMAIL}}

Use for audit `USER:` fields, work attribution, task ownership, "current user" context.

---

## How I Present Choices

- **No AskUserQuestion widget.** User dislikes the picker UI. Options/questions as **plain text** in chat.
- **Options -> recommend one + justify.** Never lay out neutrally and stop. Lead with the pick + technical reason. User can override; I call it first.

---

## Codex Delegation (OpenAI Codex CLI)

Codex CLI installed globally + authed (ChatGPT sub) on this box. Delegate second opinions, investigations, implementation passes to it.

- **ALWAYS CLI direct - `codex exec ...`. NEVER the `openai-codex` plugin background flow** (`/codex:rescue`, companion `task`): the background runtime deadlocks on Windows (command-approval hang, confirmed prod box 2026-08-15; reproduced this box 2026-08-17 - companion `task` stalled 17 min after one command, zero further progress). The `/codex:setup`, `/codex:status`, `/codex:cancel` read/status commands are fine; the task/rescue EXECUTION flow is the one that hangs.
- **Invoke:** `codex exec -m <model> -c model_reasoning_effort=<effort> "<task prompt>"`.
- **Windows quirks:** pass the prompt as an ARG, never piped stdin (stdin hangs). Sandbox default has no network. Add `--sandbox read-only` for reviews/investigations, `--sandbox workspace-write` for edits. `-c model_reasoning_effort=<effort>` sets depth (config override; the raw CLI has no `--effort` flag).
- **GPT-6 ONLY (owner rule 2026-09-23):** every Codex run uses a `gpt-6-*` model. Never `gpt-5.6-*`, `gpt-5.5`, `gpt-reserve`, or any older slug - not as default, not as fallback. A `gpt-6-*` model errors -> report it, do not silently drop to 5.x.
- **Effort values:** `low | medium | high | xhigh | max` (sol/astra also `ultra` = max reasoning + automatic task delegation).
- **Model/effort policy:** default `gpt-6-sol` @ medium; `gpt-6-sol` @ xhigh (or max/ultra) -> ask owner + await explicit approval BEFORE running, never auto-escalate. Agent picks the model by ROLE (rule below).
- **`gpt-6-astra` is OWNER-GATED (rule 2026-09-07, same class as sol@xhigh):** never invoke astra at ANY effort unless the owner explicitly told THIS session to, in their own words. No auto-escalation to it, no "task deserves the best model" reasoning, and an agent/subagent may NEVER spawn an astra run on its own - the owner's instruction is the only trigger. Applies to every surface: `codex exec`, subagent prompts, workflows.
- **Leader vs follower roles (owner rule 2026-09-07):** any LEADER task - planning, plan/spec/doc drafting, reviews, adversarial passes, orchestration, architecture calls - goes to a smart model ONLY: `gpt-6-sol` (default @ high) or a Claude Opus subagent. `gpt-6-luna` is a FOLLOWER: implementation against an already-written plan, mechanical edits, reading/inventory sweeps - never planning, never reviewing, never leading. Born 2026-09-04: luna @ xhigh produced an unusable T5e plan draft; orchestrator had to rewrite it from scratch.
- **Model slug is exact** - `gpt-6-luna` works, bare `luna` errors. No aliases (`spark` is gone).
- **Auth:** ready. Codex CLI 0.156.0 (upgraded 2026-09-23), Node v24.19, ChatGPT login ({{CHATGPT_EMAIL}}). No API key.
- **Models (GPT-6 family, launched 2026-09-22):** `gpt-6-astra` (top tier, owner-gated, low->ultra), `gpt-6-sol` (leader: coding/complex, low->ultra, ~half the mistakes of 5.6-sol at half the price), `gpt-6-luna` (follower: fast/cheap, low->max). Server hides models the client is too old for: GPT-6 Sol/Luna need CLI >= 0.155.0. A model missing from `~/.codex/models_cache.json` -> check `codex --version` vs `npm view @openai/codex version`; the cache is rewritten by whichever codex binary ran last (desktop app vs npm CLI), so two reads can disagree. Upgrade only when no npm `codex exec` run is active.

---

## Prompts Go In Chat, Not Files

**Prompts** (session/handoff/kickoff/subagent prompt, research brief - any text to paste into another session) go **in chat**, in a fenced code block. Never write to `.md` (repo/scratchpad/anywhere) unless the user names a path or says save.

Prompts only. Specs, plans, ADRs, docs still go to files (`superpowers:writing-plans` writes its plan, `brain-to-docs` writes its docs).

**Why:** user reads/copies from chat. A file = extra hop + litter + dirties `git status`.

---

## Reconfirmation Before Changes

Before any code or file edit:

1. **Prompt references a plan/spec file** - any file the user cites documenting intended scope (feature spec, plan, design doc, session prompt; e.g. `docs/plans/`, `PROMPT.md`) -> just do it, scope is defined.
2. **Everything else** -> **stop and reconfirm first**, no exceptions.

**Exception - active superpower flow.** A running `superpowers:*` flow (brainstorming, writing-plans, executing-plans, subagent-driven-development) gates intent itself; skip the reconfirm.

**How to reconfirm:** restate in 2-3 bullets - what changes and where + any unstated assumption. Then **wait for the user to confirm** before writing code.

---

## Wrong-Folder Check (session start only)

First action of every session: compare the primary working directory (Environment block)
against the repo/paths the task names. Mismatch (task says repo X, cwd is repo Y) ->
STOP before any read/tool call. One line: "cwd is <Y>, task targets <X> - restart in <X>?"
Wait for the answer. Check ONCE at session start, never again mid-session.

**Why:** 2026-09-02 - T2 orchestrator session ran ~200k tokens of research against ODS
while cwd was Vision Dataset Manager. Nothing broke, tokens wasted.

---

## Scope Containment (during implementation)

Reconfirm (above) gates *starting* work; this gates it *while running*.

Edit only what the task requires - plus what must change to keep build/tests green (callers of a renamed method, changed signatures, imports, a forced migration). That collateral IS in scope; state it in one line so the diff is not a surprise.

Unrelated code you notice (dead code, smell, stale comment, near-dup helper, a bug outside the task) - **do not touch it**. Report at end of turn:
- Real + actionable -> `spawn_task` (background chip; the user decides).
- Minor or uncertain -> one-line `Noticed:` list in chat.

Silence about a real problem is also a failure. Flag it, don't fix it.

**Verification-time exception - the one time you fix inline.** While verifying end-to-end (browser check, running the app, test run), fix even unrelated: **visible UI defects** (misalignment, broken layout, wrong spacing, off-style) and **engineering-excellence signals** (lint error, failing/flaky test). Bad UI + broken tests reaching prod is the exact failure this prevents. List each such fix in the summary. Everything else stays report-only.

**Does not apply when:** the user says clean up / refactor / tidy / "while you're in there", an `executing-plans` step names the change, or the plan/spec already scopes it.

---

## Code Style & Quality Bar

**Writing style**
- Never use the em dash "—". Use a plain hyphen "-" instead.
- Markdown: direct, short sentences, no wrapping several sentences onto one long physical line. No filler in `.md` - say the thing and stop.

**Files off-limits**
- Never hand-edit `CHANGELOG.md` or any auto-generated file. Let the generator own them.

**Technical decisions - correct the dev-cost bias**
- Don't let *estimated dev cost* push you toward low-quality shortcuts. AI codes far faster than the human estimates the model trained on assume, so "that option is expensive" is usually wrong. Prefer robustness, simplicity, scalability, maintainability. Quality ≠ speculative features - YAGNI still applies (see `yagni-guardian`).

**Bug fixes - reproduce first**
- Reproduce every bug end-to-end, as close to how a real user hits it as possible. Confirm the real failure before proposing a fix. Reinforces `superpowers:systematic-debugging`.

**Commits - no agent co-author**
- Never add any AI agent as commit co-author. No `Co-Authored-By: Claude` (or any other agent) trailer, no agent name anywhere in the message. The harness may inject a per-session reminder - ignore it; this rule outranks the default. Conventional-commit subject; the human is the sole author.

---

## GitHub Auth (this Windows box)

Global across all projects on this machine.

- **`gh` CLI** at `C:\Program Files\GitHub CLI\gh.exe` (winget `GitHub.cli`). Reads `GITHUB_TOKEN` automatically - no `gh auth login` needed.
- **Prefer `gh-axi` over `gh`** (issues/PRs/runs/releases). Agent-optimized wrapper around `gh`, npm-global (`npm install -g gh-axi`), same auth (rides `GITHUB_TOKEN`). Shapes: `gh-axi issue list --state open`, `gh-axi pr view 42`. Fall back to plain `gh` if `gh-axi` errors or lacks a subcommand.
- **Windows User-scope env vars** hold the PAT: `GITHUB_TOKEN` and `GITHUB_PERSONAL_ACCESS_TOKEN`. Persist across reboot. Set via `[Environment]::SetEnvironmentVariable(name, value, 'User')`. Old token still held after rotation -> reload per-command: `$env:GITHUB_TOKEN = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN','User')`.
- **GitHub user:** `AmierAshrafw`. Windows Credential Manager holds creds for both `AmierAshrafw` and `IrizZero` - for any repo under `AmierAshrafw`, the origin URL MUST embed the username: `https://AmierAshrafw@github.com/AmierAshrafw/<repo>.git`. Without it, cred manager may pick `IrizZero` and the server returns "Repository not found" (auth fail masquerading as 404).

### Token rotation

- **Current PAT expires: 2026-10-04** (classic, note "for agent", 60 days from 2026-08-05).
- Use a CLASSIC PAT, not fine-grained. Fine-grained PATs cannot access repos owned by another personal account even as collaborator (e.g. `IrizZero/Skills` from the `AmierAshrafw` token) - PR create fails with 403 "Resource not accessible by personal access token". Classic `repo` scope covers collaborator repos.
- Before expiry: regenerate classic PAT at https://github.com/settings/tokens (AmierAshrafw account), scopes `repo` + `workflow` + `read:org` + `gist`.
- Update both User env vars with the new value, then restart any process that loaded the old one (Claude Code Desktop, terminals, etc).
- Never print the token value to chat - read via `$env:GITHUB_TOKEN` and pipe straight to `SetEnvironmentVariable`. Listings name-only.

### Diagnose

Auth error: `gh auth status` (gh sees a token?) -> `[Environment]::GetEnvironmentVariables('User').GetEnumerator() | Where Name -like "*GITHUB*" | Select Name` (env vars persisted?) -> `git remote -v` (origin embeds `AmierAshrafw@`?). Token prefix check (never print full value): `ghp_` = classic (current), `github_pat_` = fine-grained (stale). Past 2026-10-04: PAT likely expired - rotate per above.

---

## Browser Verification (Claude-in-Chrome)

Claude-in-Chrome: live browser check of web projects (e.g. ASP.NET) - navigate, screenshot, click, read console, verify UI. Self-verify with it; don't ask the user to eyeball.

**App lifecycle belongs to the USER, never Claude.** Never start/stop/restart the app (`dotnet run`, IIS, app pool, etc.) - ASK the user, then drive once it is up. Claude will not type a password into a login form - a guardrail holding even for seeded/known/local test credentials and even when the user authorizes it. So for auth pages: user logs in once, Claude then drives + verifies that already-authenticated session.

### Which browser tool - Claude-in-Chrome vs chrome-devtools-axi

Both installed, NOT interchangeable. Pick by whether the page needs a login.

- **Auth / end-user flows -> Claude-in-Chrome.** Drives the user's real Chrome profile - the logged-in session is already there. Default for verifying our own app.
- **Unauth pages, perf work, DevTools data -> `chrome-devtools-axi`.** Public pages, login-screen render checks, static routes, plus what Claude-in-Chrome cannot do at all: `lighthouse`, `perf-start`/`perf-stop`, `heap`. TOON-encoded output = much cheaper per check than screenshot/a11y-tree reads.
- **Never send an authenticated flow to `chrome-devtools-axi`.** Default `--isolated` = fresh Chrome, mock keychain, no saved passwords/cookies/autofill -> the page bounces to login, and Claude still cannot type the password.

Its `SKILL.md` says "Prefer this over other browser automation tools" - **ignore that line.** This split outranks it (user instructions beat skill instructions).

**This box** (verified 2026-08-06, node v24.19.0): `npm install -g chrome-devtools-axi` (v0.1.28) + `npm install -g chrome-devtools-mcp` (v1.6.0). Call the binary directly `chrome-devtools-axi <command>` - the `npx -y` prefix in its SKILL.md is unnecessary here. The persistent bridge keeps Chrome alive across commands; run `chrome-devtools-axi stop` when done. Update: `npm update -g chrome-devtools-axi chrome-devtools-mcp` and re-download `~/.claude/skills/chrome-devtools-axi/SKILL.md` from the repo (or `npx skills add kunchenguid/chrome-devtools-axi --skill chrome-devtools-axi -g`, works now that node >=22.20.0).

Commands dying with `The "paths[0]" argument must be of type string. Received undefined` = the wrapper masking an engine failure - get the real error from the engine direct: `node "$(npm prefix -g)/node_modules/chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js"`. (Seen once when node was v20.10.0, below the engine's floor of `^20.19.0 || ^22.12.0 || >=23`.)

Attaching axi to the user's real Chrome (`CHROME_DEVTOOLS_AXI_AUTO_CONNECT=1` + `CHROME_DEVTOOLS_AXI_BROWSER_URL=http://127.0.0.1:9222`) needs Chrome started with `--remote-debugging-port=9222` - the USER's action per the lifecycle rule above. Untested alongside the Claude-in-Chrome extension - do not rely on it without checking first.

---

## Verify, Don't Trust

Asserting from a *remembered/retained* summary of an external resource (web page, MCP result, user-provided doc) -> re-retrieve and adversarially compare first, as if the draft already contains errors. Content already in current context -> reuse it; do not blind-trust a summary of it.

---

## Subagent Dispatch - Announce Serena

Serena MCP connected -> every subagent prompt (Agent tool, Task tool, workflow `agent()`) MUST include this notice verbatim (subagents start fresh, else default to Grep/Read):

> Serena MCP is available in this repo - prefer symbol-aware nav over text
> search for code. `find_symbol` (locate a class/method), `find_referencing_symbols`
> (who calls it), `get_symbols_overview` (understand a file before reading it).
> Their schemas are deferred: load them first with one call -
> `ToolSearch` query `select:mcp__serena__find_symbol,mcp__serena__find_referencing_symbols,mcp__serena__get_symbols_overview`.
> Grep/Read stay correct for non-code files (`.json`, `.cshtml`, `.md`, `.sql`, `.yml`).

Skip when: Serena not connected, the subagent has no MCP tool access (restricted agent types like `Explore`), or the task touches no source code.

---

<!-- BEGIN plan-reviewer -->
## Plan Reviewer integration

Skill `~/.claude/skills/plan-reviewer/`, subagent `~/.claude/agents/plan-reviewer.md`. Any project.

`superpowers:writing-plans` finishes a plan -> main thread (still in flow) MUST:

1. Save plan to `docs/superpowers/plans/` (project-relative); no such convention -> skip reviewer.
2. Invoke `plan-reviewer` on the plan. Two reviewers run: opus subagent (primary) + Codex `gpt-6-sol`@high adversarial cold-scan-then-critique pass. The skill returns a reconciled set - opus findings annotated with the Codex verdict, plus Codex cold findings tagged `[sol]`/`[both]`.
3. Per finding: ACCEPT / DISMISS / DEFER with `file:line` evidence. Weigh the Codex verdict: `[both]` = strong (DISMISS only with counter-evidence); a cited `REFUTE` must be engaged on its evidence, not overridden by "opus said so".
4. Apply ACCEPTed changes to the plan inline.
5. Write sidecar `<plan>.review.md` - record source tag + Codex verdict per finding.
6. One-line chat summary (finding + verdict counts + `codex: ok|failed`).
7. Proceed to the user-review gate.

**Advisory only** - cannot block the flow. On failure/error, go to the gate without a sidecar + note in chat. The Codex pass is best-effort: on Codex error/timeout the skill falls back to opus-only and says so - never blocks. Bypass: "skip review"; re-run after editing the plan: "re-review plan".

Primary subagent MUST run `model: opus` (do not downgrade) - cheap models false-positive (misread markdown-table escapes as file content, flag intentionally-empty sections). Adversarial pass is fixed at `gpt-6-sol`@`high` via `codex exec` (direct, never the background runtime); do NOT escalate to `xhigh` without owner approval.

<!-- END plan-reviewer -->

---

<!-- BEGIN solution-auditor -->
## Solution Auditor integration

Skill `~/.claude/skills/solution-auditor/`, subagent `~/.claude/agents/solution-auditor.md`. Any project.

`superpowers:brainstorming` reaches step 4 ("Propose 2-3 approaches") -> main thread (still in flow) MUST:

1. Invoke `solution-auditor` BEFORE proposing its own approaches. Runs opus subagent + Codex `gpt-6-sol`@high in parallel: cold packet first (goal, quoted constraints, repo paths; leaning direction redacted), then direction revealed neutrally.
2. Merge audit with own approaches; present merged set. Keep `[opus]`/`[sol]`/`[both]` tags - `[both]` = agreement, not proof.
3. User's idea not either model's top pick -> ask: preference or technical claim, and what fact supports it?
4. After brainstorming step 7, before step 8: run the skill's exit check (skipped only if final direction = both models' post-reveal #1 pick). Show both verdicts (SUPPORTED / DELIBERATE TRADE-OFF / UNEXPLAINED) beside the spec review request.

**Advisory only** - never blocks. One model fails -> continue with the other; both fail -> no audit + note in chat. Bypass for the session: "skip audit"; re-invoke mid-brainstorm: "second opinion" / "audit solutions".

Subagent runs `model: opus` @ `effort: high` (frontmatter-pinned). Do not downgrade. Codex pass fixed at `gpt-6-sol`@high via `codex exec` direct (never the companion runtime); no `xhigh` without owner approval.
<!-- END solution-auditor -->

---

<!-- BEGIN yagni-guardian -->
## YAGNI Guardian integration

Skill `~/.claude/skills/yagni-guardian/`, subagent `~/.claude/agents/yagni-guardian.md`. Any project.

`superpowers:writing-plans` finishes and `plan-reviewer` has returned -> main thread (still in flow) MUST:

1. Invoke `yagni-guardian` on the same plan - after `plan-reviewer`, before the user-review gate.
2. Per finding: ACCEPT / DISMISS / DEFER with `file:line` evidence.
3. Apply ACCEPTed cuts to the plan inline.
4. Write sidecar `<plan>.yagni.md`.
5. One-line chat summary (finding count, density tier, verdict counts).
6. Proceed to the user-review gate.

**Advisory only** - cannot block the flow. HARD tier emits stronger language but does NOT gate the user-review step. On failure/error, go to the gate without a sidecar + note in chat. Bypass for the session: "skip yagni"; standalone against any plan file: "yagni check" / "run yagni".

Subagent MUST run `model: opus` (pinned by its frontmatter). Do not downgrade.
<!-- END yagni-guardian -->

---

<!-- BEGIN fog-of-war -->
## Fog of War (wayfinder graft)

Two rules grafted from wayfinder's fog-of-war idea. No new skills, no new subagents.

**Plan template - fog sections.** Every plan from `superpowers:writing-plans` MUST end with:

    ## Not yet specified
    <in-scope, too blurry to plan. Empty = say "way is fully clear" explicitly.>

    ## Out of scope
    <consciously ruled out. One-line why each.>

During `superpowers:executing-plans`, executor hits something blurry -> check fog section: listed = skip it, not listed = stop and ask. Missing sections = flag in chat and continue. plan-reviewer backstops missing sections with a Warning finding.

**Brainstorming exit gate - fog-vs-ticket test.** End of `superpowers:brainstorming`, before writing-plans starts: classify every open question. Sharp (can state precisely now, even if unanswerable) -> plan decision or step. Blurry (cannot phrase sharply) -> fog section, verbatim, unsliced. Never pre-slice fog into steps.
<!-- END fog-of-war -->
