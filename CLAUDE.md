# Global AI Instructions

These rules apply to every project and every session.

---

## Owner / Identity

- **Owner:** amier (Amier Ashraf Hadi)
- **Email:** amierashraf.hadi@redplanet.com.my
- **Zoho Projects:** display name "amier"; portal `662990611` (Redplanet Solutions)

This is who you are working for. Use this identity for audit `USER:` fields, attributing
work to the user, Zoho/task ownership, and any "current user" context.

---

## How I Present Choices

- **Do NOT use the multiple-choice question widget (AskUserQuestion).** The user dislikes the "choiceless" picker UI. Present options and questions as **plain text** in the chat instead.
- **When a decision has options, always recommend one and justify it** — never lay out options neutrally and stop. Lead with the pick, give the technical reason. The user can override, but I make the call first.

---

## Reconfirmation Before Changes

Before writing any code or making file edits, apply this decision tree:

1. **Prompt references a plan/spec file** (e.g. `docs/plans/`, `PROMPT.md`, or any equivalent session-start prompt that was pre-written) -> just do it, the scope is already defined.
2. **Everything else** -> **stop and reconfirm first**, no exceptions.

**Exception — active superpower flow.** If a `superpowers:*` flow is already running (brainstorming, writing-plans, executing-plans, subagent-driven-development), skip the reconfirm. Those flows gate intent themselves; a second restate-and-wait round is pure duplication.

### How to reconfirm

Restate your understanding in **2-3 bullet points** covering:
- What you are going to change and where
- Any assumption you are making that the user has not explicitly stated

Then **wait for the user to confirm** before writing any code.

### What counts as a plan/spec file

Any file the user explicitly references in their prompt that documents the intended scope - a feature spec, a plan file, a design doc, a session prompt, etc. If the file exists and describes the task, skip the reconfirm.

---

## Scope Containment (during implementation)

The reconfirm rule above gates *starting* work. This one gates it *while running*.

Edit only what the task requires — plus whatever must change for the build/tests
to stay green (callers of a renamed method, call sites of a changed signature,
imports, a migration the model change forces). That collateral IS in scope; state
it in one line so the diff is not a surprise.

Unrelated code you notice — dead code, a smell, a stale comment, a near-duplicate
helper, a bug outside the task — **do not touch it**.

Report instead, at end of turn:
- Real + actionable → `spawn_task` (background chip; the user decides).
- Minor or uncertain → one-line `Noticed:` list in chat.

Staying silent about a real problem is a failure too. Flag it, don't fix it.

**Does not apply when:** the user says clean up / refactor / tidy / "while you're
in there", or an `executing-plans` step names the change, or the plan/spec file
already scopes it.

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

---

## Verify, Don't Trust

When analysis or summary depends on an external resource (web page, MCP
result, user-provided doc) and you are working from a *remembered* or
*retained* summary rather than the content in current context, re-retrieve
the resource and adversarially compare before asserting — fact-check as if
your draft already contains errors. If the content is already in context,
reuse it; do not blind-trust a summary of it.

---

## Subagent Dispatch — Announce Serena

When Serena MCP is connected in the current session, every subagent prompt
(Agent tool, Task tool, workflow `agent()`) MUST include a Serena notice.
Subagents start with a fresh context — they do not inherit the main thread's
knowledge that symbol-aware nav exists, so without the notice they default
to Grep/Read.

Include verbatim in the prompt:

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

The `plan-reviewer` skill is installed globally at `~/.claude/skills/plan-reviewer/` with a companion subagent at `~/.claude/agents/plan-reviewer.md`. Use it on any project.

When `superpowers:writing-plans` finishes producing a plan, the main thread (still running the writing-plans flow) MUST:

1. Save the plan to `docs/superpowers/plans/` (project-relative). If the project does not use this convention, skip the reviewer.
2. Invoke the `plan-reviewer` skill on the plan.
3. For each finding the skill returns, decide ACCEPT / DISMISS / DEFER with a justification that includes `file:line` evidence.
4. Apply ACCEPTed changes to the plan inline.
5. Write the sidecar review file at `<plan>.review.md`.
6. Print a one-line chat summary (counts of findings, counts of verdicts).
7. Proceed to the standard user-review gate.

The reviewer is **advisory only**. It cannot block the flow. If the reviewer fails or returns an error, proceed to the user-review gate without a sidecar and note the failure in chat.

The user may say "skip review" to bypass the reviewer entirely, or "re-review plan" to run it again after editing the plan.

The dispatched `plan-reviewer` subagent MUST run with `model: opus` - cheaper models have produced false positives (misreading markdown-table escapes as file content, flagging intentionally-empty sections). Do not downgrade.

<!-- END plan-reviewer -->


---

<!-- BEGIN solution-auditor -->
## Solution Auditor integration

The `solution-auditor` skill is installed globally at `~/.claude/skills/solution-auditor/` with a companion subagent at `~/.claude/agents/solution-auditor.md`. Use it on any project.

When `superpowers:brainstorming` reaches step 4 ("Propose 2-3 approaches"), the main thread (still running the brainstorming flow) MUST:

1. Invoke the `solution-auditor` skill BEFORE proposing its own 2-3 approaches.
2. Receive the auditor's structured output: 3-5 ranked alternatives + sycophancy tier.
3. Reconcile the auditor's alternatives with what the main thread was about to propose. Present the merged set to the user.
4. If sycophancy tier is HARD: do NOT proceed until the main thread emits one paragraph of technical justification for the current direction (no agreement language, no user-pleasing rationale). If no justification exists, drop the current direction and present the auditor's alternatives as the starting set.
5. If the user's original idea is NOT in the auditor's top-ranked alternatives: main thread MUST explicitly ask the user to confirm ("Auditor ranks X above your original Y -- do you have context that justifies Y?").
6. Proceed to brainstorming step 5 (present design) using the user's confirmed choice.

The auditor is **advisory only**. It cannot block the brainstorming flow except via the HARD-tier justification gate (item 4). If the auditor fails or returns an error, proceed to step 5 without an audit and note the failure in chat.

The user may say "skip audit" to bypass the auditor entirely for the current session, or "second opinion" / "audit solutions" to re-invoke mid-brainstorm if the direction shifts.

The dispatched `solution-auditor` subagent MUST run with `model: opus` -- cheaper models cannot be trusted to break sycophancy patterns reliably. Do not downgrade.
<!-- END solution-auditor -->

---

<!-- BEGIN yagni-guardian -->
## YAGNI Guardian integration

The `yagni-guardian` skill is installed globally at `~/.claude/skills/yagni-guardian/` with a companion subagent at `~/.claude/agents/yagni-guardian.md`. Use it on any project.

When `superpowers:writing-plans` finishes and the `plan-reviewer` pass has returned, the main thread (still running the writing-plans flow) MUST:

1. Invoke the `yagni-guardian` skill on the same plan, after `plan-reviewer` and before the user-review gate.
2. For each finding the skill returns, decide ACCEPT / DISMISS / DEFER with a justification that includes `file:line` evidence.
3. Apply ACCEPTed cuts to the plan inline.
4. Write the sidecar at `<plan>.yagni.md`.
5. Print a one-line chat summary (finding count, density tier, verdict counts).
6. Proceed to the standard user-review gate.

The guardian is **advisory only**. It cannot block the writing-plans flow. HARD tier emits stronger language but does NOT gate the user-review step. If the guardian fails or returns an error, proceed to the user-review gate without a sidecar and note the failure in chat.

The user may say "skip yagni" to bypass it for the current session, or "yagni check" / "run yagni" to invoke it standalone against any plan file.

The dispatched `yagni-guardian` subagent MUST run with `model: opus` — pinned by its frontmatter. Do not downgrade.
<!-- END yagni-guardian -->
