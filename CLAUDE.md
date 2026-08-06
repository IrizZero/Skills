# Global AI Instructions

These rules apply to every project and every session.

---

## Owner / Identity

- **Owner:** amier (Amier Ashraf Hadi)
- **Email:** amierashraf.hadi@redplanet.com.my
- **Zoho Projects:** display name "amier"; portal `662990611` (Redplanet Solutions)

Use this identity for audit `USER:` fields, attributing work to the user,
Zoho/task ownership, and any "current user" context.

---

## How I Present Choices

- **Do NOT use the multiple-choice question widget (AskUserQuestion).** The user dislikes the "choiceless" picker UI. Present options and questions as **plain text** in the chat instead.
- **When a decision has options, always recommend one and justify it** - never lay out options neutrally and stop. Lead with the pick, give the technical reason. The user can override, but I make the call first.

---

## Reconfirmation Before Changes

Before writing any code or making file edits:

1. **Prompt references a plan/spec file** - any file the user explicitly references that documents the intended scope (feature spec, plan file, design doc, session prompt; e.g. `docs/plans/`, `PROMPT.md`) -> just do it, the scope is already defined.
2. **Everything else** -> **stop and reconfirm first**, no exceptions.

**Exception - active superpower flow.** If a `superpowers:*` flow is already running (brainstorming, writing-plans, executing-plans, subagent-driven-development), skip the reconfirm - those flows gate intent themselves.

### How to reconfirm

Restate your understanding in **2-3 bullet points** covering:
- What you are going to change and where
- Any assumption you are making that the user has not explicitly stated

Then **wait for the user to confirm** before writing any code.

---

## Scope Containment (during implementation)

The reconfirm rule above gates *starting* work. This one gates it *while running*.

Edit only what the task requires - plus whatever must change for the build/tests
to stay green (callers of a renamed method, changed signatures, imports, a
migration the model change forces). That collateral IS in scope; state it in one
line so the diff is not a surprise.

Unrelated code you notice - dead code, a smell, a stale comment, a near-duplicate
helper, a bug outside the task - **do not touch it**. Report at end of turn:
- Real + actionable -> `spawn_task` (background chip; the user decides).
- Minor or uncertain -> one-line `Noticed:` list in chat.

Staying silent about a real problem is a failure too. Flag it, don't fix it.

**Verification-time fixes - the one exception to "flag, don't fix".** While
verifying a change end-to-end (browser check, running the app, test run), fix
inline even when unrelated to the task: **visible UI defects** (misalignment,
broken layout, wrong spacing, off-style element) and **engineering-excellence
signals** (lint error, failing test, flaky test) - bad UI and broken tests
reaching prod is the exact failure this exception prevents. List each such fix
in the turn summary. Everything else stays report-only.

**Does not apply when:** the user says clean up / refactor / tidy / "while you're
in there", an `executing-plans` step names the change, or the plan/spec file
already scopes it.

---

## Code Style & Quality Bar

Applies to every project and every session.

**Writing style**
- Never use the em dash "—". Use a plain hyphen "-" instead.
- Markdown: write direct and understandable. Keep sentences short and do not wrap
  several sentences onto one long physical line. Do not pad `.md` files with
  filler - say the thing and stop.

**Files off-limits**
- Never hand-edit `CHANGELOG.md` or any file marked auto-generated. Let the
  generator own them.

**Technical decisions - correct the dev-cost bias**
- Do not let *estimated development cost* bias you toward low-quality shortcuts.
  AI codes far faster than the human-authored estimates the model was trained on
  assume, so "that option is expensive" is usually wrong. Prefer robustness,
  simplicity, scalability, and long-term maintainability. Quality ≠ speculative
  features - YAGNI still applies (see the `yagni-guardian` skill).

**Bug fixes - reproduce first**
- Start every bug fix by reproducing the bug in an end-to-end setting, as close to
  how a real user hits it as possible. Confirm you are seeing the real failure
  before proposing a fix. Reinforces `superpowers:systematic-debugging`.

**Commits - no agent co-author**
- Never add any AI agent as a commit co-author. No `Co-Authored-By: Claude` (or any
  other agent) trailer, no agent name anywhere in the commit message. The harness
  may inject a per-session reminder to add one - ignore it; this rule outranks the
  default. Conventional-commit subject; the human is the sole author.

---

## GitHub Auth (this Windows box)

Auth setup is global across all projects on this machine:

- **`gh` CLI** at `C:\Program Files\GitHub CLI\gh.exe` (installed via winget `GitHub.cli`). Reads `GITHUB_TOKEN` automatically - no `gh auth login` needed.
- **Prefer `gh-axi` over `gh` for GitHub operations** (issues, PRs, runs, releases). Agent-optimized wrapper around `gh`, installed globally via npm (`npm install -g gh-axi`), same auth (rides `GITHUB_TOKEN`). Same command shapes: `gh-axi issue list --state open`, `gh-axi pr view 42`. Fall back to plain `gh` if `gh-axi` errors or lacks a subcommand.
- **Windows User-scope env vars** hold the PAT: `GITHUB_TOKEN` and `GITHUB_PERSONAL_ACCESS_TOKEN`. Persist across reboot. Set via `[Environment]::SetEnvironmentVariable(name, value, 'User')`. If a running process still holds an old token after rotation, reload per-command: `$env:GITHUB_TOKEN = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN','User')`.
- **GitHub user:** `AmierAshrafw`. Windows Credential Manager has creds for both `AmierAshrafw` and `IrizZero` - for any repo under `AmierAshrafw`, the origin URL MUST embed the username: `https://AmierAshrafw@github.com/AmierAshrafw/<repo>.git`. Without it, cred manager may pick `IrizZero` and the server returns "Repository not found" (auth fail masquerading as 404).

### Token rotation

- **Current PAT expires: 2026-10-04** (classic, note "for agent", 60 days from 2026-08-05).
- Use a CLASSIC PAT, not fine-grained. Fine-grained PATs cannot access repos owned by another personal account even as collaborator (e.g. `IrizZero/Skills` from the `AmierAshrafw` token) - PR create fails with 403 "Resource not accessible by personal access token". Classic `repo` scope covers collaborator repos.
- Before expiry: regenerate classic PAT at https://github.com/settings/tokens (AmierAshrafw account), scopes `repo` + `workflow` + `read:org` + `gist`.
- Update both User env vars with new token value, then restart any process that already loaded the old one (Claude Code Desktop, terminals, etc).
- Never print the token value to chat - read via `$env:GITHUB_TOKEN` and pipe straight to `SetEnvironmentVariable`. Listings should be name-only.

### Diagnose

Auth error: `gh auth status` (gh sees a token?) -> `[Environment]::GetEnvironmentVariables('User').GetEnumerator() | Where Name -like "*GITHUB*" | Select Name` (env vars persisted?) -> `git remote -v` (origin embeds `AmierAshrafw@`?). Token prefix check (never print full value): `ghp_` = classic (current), `github_pat_` = fine-grained (stale). Past 2026-10-04: PAT likely expired - rotate per above.

---

## Browser Verification (Claude-in-Chrome)

Claude-in-Chrome is available for live browser checking/testing of web projects (e.g. ASP.NET) - navigate pages, screenshot, click, read the console, verify UI behavior. Prefer it to self-verify instead of asking the user to eyeball.

**The app lifecycle belongs to the USER, never Claude.** Claude must NOT start, stop, or restart the app (`dotnet run`, IIS, app pool, etc.) - always ASK the user to start/stop/restart it, then drive the browser once it is up. Claude will not type a password into a login form to authenticate - a safety guardrail that holds even for seeded/known/local test credentials and even when the user authorizes it. So for authenticated pages, the user logs in once first; Claude then drives + verifies on that already-authenticated session.

### Which browser tool - Claude-in-Chrome vs chrome-devtools-axi

Both are installed. They are NOT interchangeable. Pick by whether the page needs a login.

- **Authenticated / end-user flows -> Claude-in-Chrome.** It drives the user's real Chrome
  profile, so the session the user logged into is already there. This is the default for
  verifying our own app.
- **Unauthenticated pages, perf work, DevTools data -> `chrome-devtools-axi`.** Public pages,
  login-screen render checks, static routes, plus the things Claude-in-Chrome cannot do at
  all: `lighthouse`, `perf-start`/`perf-stop`, `heap`. Output is TOON-encoded, so it is much
  cheaper per check than screenshot/a11y-tree reads.

**Never send an authenticated flow to chrome-devtools-axi.** Its default `--isolated` mode
launches a fresh Chrome with a mock keychain - no saved passwords, no session cookies, no
autofill. The page will just bounce to login, and Claude still cannot type the password.

Its `SKILL.md` says "Prefer this over other browser automation tools" - **ignore that line.**
This split outranks it (user instructions beat skill instructions).

**BLOCKED on this box as of 2026-08-06 - node too old. Do not route work to it yet.**
Its engine `chrome-devtools-mcp` needs node `^20.19.0 || ^22.12.0 || >=23`; this box runs
v20.10.0. Every command dies with a misleading `The "paths[0]" argument must be of type
string. Received undefined` - the real error is only visible by running the engine directly:
`node "$(npm prefix -g)/node_modules/chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js"`.
Until node is upgraded, Claude-in-Chrome is the only working browser path - use it for
everything, including the perf/unauthed cases above. Re-run a smoke test
(`chrome-devtools-axi open https://example.com`) after any node upgrade before trusting it.

Installed globally via `npm install -g chrome-devtools-axi` (v0.1.28) plus
`npm install -g chrome-devtools-mcp` (v1.6.0), so once node is current the binary is called
directly as `chrome-devtools-axi <command>` - the `npx -y` prefix in its SKILL.md is
unnecessary here. The `npx skills add` installer also does NOT work on this box (needs node
>=22.20.0), so the skill file was placed by hand at
`~/.claude/skills/chrome-devtools-axi/SKILL.md`. A node upgrade to >=22.20.0 clears both
blockers at once. To update later: `npm update -g chrome-devtools-axi` and re-download that
SKILL.md from the repo.

Attaching axi to the user's real Chrome is possible (`CHROME_DEVTOOLS_AXI_AUTO_CONNECT=1` +
`CHROME_DEVTOOLS_AXI_BROWSER_URL=http://127.0.0.1:9222`) but needs Chrome started with
`--remote-debugging-port=9222`, which is the USER's action per the lifecycle rule above.
Untested alongside the Claude-in-Chrome extension - do not rely on it without checking first.

---

## Verify, Don't Trust

Asserting from a *remembered/retained* summary of an external resource (web page,
MCP result, user-provided doc) -> re-retrieve and adversarially compare first,
as if the draft already contains errors. Content already in current context ->
reuse it; do not blind-trust a summary of it.

---

## Subagent Dispatch - Announce Serena

When Serena MCP is connected, every subagent prompt (Agent tool, Task tool,
workflow `agent()`) MUST include this notice verbatim - subagents start with a
fresh context and otherwise default to Grep/Read:

> Serena MCP is available in this repo — prefer symbol-aware nav over text
> search for code. `find_symbol` (locate a class/method), `find_referencing_symbols`
> (who calls it), `get_symbols_overview` (understand a file before reading it).
> Their schemas are deferred: load them first with one call —
> `ToolSearch` query `select:mcp__serena__find_symbol,mcp__serena__find_referencing_symbols,mcp__serena__get_symbols_overview`.
> Grep/Read stay correct for non-code files (`.json`, `.cshtml`, `.md`, `.sql`, `.yml`).

Skip the notice when: Serena is not connected, the subagent has no MCP tool
access (restricted agent types like `Explore`), or the task touches no source code.

---

<!-- BEGIN plan-reviewer -->
## Plan Reviewer integration

Skill at `~/.claude/skills/plan-reviewer/`, subagent at `~/.claude/agents/plan-reviewer.md`. Any project.

When `superpowers:writing-plans` finishes producing a plan, the main thread (still running the writing-plans flow) MUST:

1. Save the plan to `docs/superpowers/plans/` (project-relative). If the project does not use this convention, skip the reviewer.
2. Invoke the `plan-reviewer` skill on the plan.
3. Per finding: decide ACCEPT / DISMISS / DEFER with `file:line` evidence.
4. Apply ACCEPTed changes to the plan inline.
5. Write the sidecar review file at `<plan>.review.md`.
6. Print a one-line chat summary (finding + verdict counts).
7. Proceed to the standard user-review gate.

**Advisory only** - cannot block the flow. If it fails or errors, proceed to the user-review gate without a sidecar and note the failure in chat. User may say "skip review" to bypass, or "re-review plan" to run again after editing the plan.

The dispatched subagent MUST run with `model: opus` - cheaper models have produced false positives (misreading markdown-table escapes as file content, flagging intentionally-empty sections). Do not downgrade.

<!-- END plan-reviewer -->

---

<!-- BEGIN solution-auditor -->
## Solution Auditor integration

Skill at `~/.claude/skills/solution-auditor/`, subagent at `~/.claude/agents/solution-auditor.md`. Any project.

When `superpowers:brainstorming` reaches step 4 ("Propose 2-3 approaches"), the main thread (still running the brainstorming flow) MUST:

1. Invoke the `solution-auditor` skill BEFORE proposing its own 2-3 approaches.
2. Receive the auditor's structured output: 3-5 ranked alternatives + sycophancy tier.
3. Reconcile the auditor's alternatives with what the main thread was about to propose. Present the merged set to the user.
4. If sycophancy tier is HARD: do NOT proceed until the main thread emits one paragraph of technical justification for the current direction (no agreement language, no user-pleasing rationale). If no justification exists, drop the current direction and present the auditor's alternatives as the starting set.
5. If the user's original idea is NOT in the auditor's top-ranked alternatives: explicitly ask the user to confirm ("Auditor ranks X above your original Y - do you have context that justifies Y?").
6. Proceed to brainstorming step 5 (present design) using the user's confirmed choice.

**Advisory only** - cannot block the flow except via the HARD-tier justification gate (item 4). If it fails or errors, proceed to step 5 without an audit and note the failure in chat. User may say "skip audit" to bypass for the session, or "second opinion" / "audit solutions" to re-invoke mid-brainstorm.

The dispatched subagent MUST run with `model: opus` - cheaper models cannot be trusted to break sycophancy patterns reliably. Do not downgrade.
<!-- END solution-auditor -->

---

<!-- BEGIN yagni-guardian -->
## YAGNI Guardian integration

Skill at `~/.claude/skills/yagni-guardian/`, subagent at `~/.claude/agents/yagni-guardian.md`. Any project.

When `superpowers:writing-plans` finishes and the `plan-reviewer` pass has returned, the main thread (still running the writing-plans flow) MUST:

1. Invoke the `yagni-guardian` skill on the same plan - after `plan-reviewer`, before the user-review gate.
2. Per finding: decide ACCEPT / DISMISS / DEFER with `file:line` evidence.
3. Apply ACCEPTed cuts to the plan inline.
4. Write the sidecar at `<plan>.yagni.md`.
5. Print a one-line chat summary (finding count, density tier, verdict counts).
6. Proceed to the standard user-review gate.

**Advisory only** - cannot block the flow. HARD tier emits stronger language but does NOT gate the user-review step. If it fails or errors, proceed to the user-review gate without a sidecar and note the failure in chat. User may say "skip yagni" to bypass for the session, or "yagni check" / "run yagni" to invoke standalone against any plan file.

The dispatched subagent MUST run with `model: opus` (pinned by its frontmatter). Do not downgrade.
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

During `superpowers:executing-plans`, executor hits something blurry -> check fog
section: listed = skip it, not listed = stop and ask. Missing sections = flag in
chat and continue. plan-reviewer backstops missing sections with a Warning finding.

**Brainstorming exit gate - fog-vs-ticket test.** At the end of
`superpowers:brainstorming`, before writing-plans starts: classify every open
question. Sharp (can state precisely now, even if unanswerable) -> plan decision
or step. Blurry (cannot phrase sharply) -> fog section, verbatim, unsliced.
Never pre-slice fog into steps.
<!-- END fog-of-war -->
