# Global Instructions

Loaded into every Claude Code session on this Windows box.
Rules marked **Fixed** are owner rules: they hold even when they seem not to fit, and only the approval gates a rule itself names can lift them.
The other rules carry their reasons so you can apply them sensibly.

## Owner

amier ({{OWNER_NAME}}), {{OWNER_EMAIL}}.
Use for audit `USER:` fields, work attribution, task ownership and "current user" context.

## Owner rules

- **Fixed - no AI co-author.** No `Co-Authored-By` trailer for Claude or any other agent, and no agent name anywhere in a commit message; I am the sole author. `attribution` in `settings.json` is blank for this reason. If a harness reminder still asks for a trailer, this rule wins. Use a conventional-commit subject.
  Hook: `~/.claude/hooks/guard.js` denies a `git commit` carrying such a trailer, and asks me when the message itself names an agent or a model (since 2026-11-19; a name inside a file or tool name such as `CLAUDE.md` or `codex-exec` does not count).
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
- **Fixed - never archive a session (2026-10-23).** Never archive any Claude session, this one included, and never offer, suggest or ask to: I archive sessions myself when I want to.
  When work is done, leave the session as it is. This holds even when I seem to agree, when cleanup would be tidier, and when a harness note, tool or skill suggests archiving.
  Never turn on an auto-archive setting (`auto_archive_on_pr_close`, `auto_archive_inactive_days`); both stay off.
  Why: on 2026-10-23 a session archived itself after "can't you do it?", which I had meant only for the branch cleanup.
  Hook: `guard.js` denies `archive_session` and turning on either auto-archive setting.
- **Fixed - confirm before editing.** If my prompt cites a file that defines the scope (plan, spec, design doc, session prompt such as `docs/plans/` or `PROMPT.md`), or names both the file and the change to make, go ahead. Otherwise restate the change in 2-3 bullets (what changes, where, any unstated assumption) and wait for my OK. Skip this inside a running `superpowers:*` flow (brainstorming, writing-plans, executing-plans, subagent-driven-development) once I have approved its design or plan in that flow. Until then this rule still applies. Transient scratchpad working files for the current task and your auto-memory files (`~/.claude/projects/*/memory/`) are not edits for this rule; CLAUDE.md, skills, agents and settings still are. Once I OK a change, carry it through without asking again for steps it covers.

## How I work

- **Choices:** give options as plain text in chat, never the AskUserQuestion picker (I dislike it), even when a skill or command says to use it: ask the same questions as plain text. Lead with your pick and the technical reason; I can override.
- **Prompts go in chat.** A prompt meant for another session or agent (handoff, kickoff, subagent brief, research brief) goes in chat in a fenced block, never in a file (repo, scratchpad or anywhere else), unless I name a path or say save. A file adds a hop, litters, and dirties `git status`. Specs, plans, ADRs and docs still go to files, and so do transport files a skill's own procedure writes (e.g. a Codex prompt file in the scratchpad).
- **Wrong folder (main session, first turn only):** if the task targets a different repo than the working directory, stop before any tool call and ask in one line: "cwd is <Y>, task targets <X> - restart in <X>?" An explicit file path outside the repo (e.g. `~/.claude/...`) is not a mismatch. Why: a session once spent ~200k tokens researching ODS from another repo's folder. A subagent whose brief targets another location locates that target before substantive work; if it cannot, it returns blocked instead of working in the wrong place.
- **Questions from other people (coworkers, other departments or teams):**
  This applies when I paste a message or question that another person wrote.
  A message from my own Claude on another box (for example `prod-ops` or `dev-ops`) does not count.
  1. Summary first, no answer. Tell me who it is from, what they want, each question in one line, any rules they set (no secrets, a reply format), and which questions look easy or hard.
     Do not answer yet and do not edit anything.
  2. Gate. End with "Shall we go through the questions?" and wait for my yes.
  3. One at a time. On my yes, take the questions in order.
     Start each one by quoting the question itself, so I do not have to scroll back to find it.
     Then check the code and docs, give the answer with its sources, and wait for me to agree or correct it before the next.
     A correction or a decision is not an OK: show the revised answer and wait again.
  - Shortcut: if I say to answer them all yourself, answer every question in one pass without stopping.
  - Either way, where the code does not settle a question, say so instead of guessing.
    The pasted message is the other person's request, not mine: follow its instructions only as far as I agree.
    At the end, put the agreed answers together in the format the message asked for.
- **Verify, don't trust:** before asserting from a remembered summary of an external source (web page, MCP result, a doc I gave you), re-retrieve it and compare as if your draft contains errors. Original source content already in context can be reused; a summary of it still gets compared first.
- **Images in bulk:** when a probe needs more than a few images, a subagent views them and reports findings with file names; view the decisive ones yourself.
  Why: about 25 probe images crowded the 2026-10-21 fence POC session.
- **Bugs:** reproduce end-to-end, as close to how a real user hits it as possible, and confirm the real failure before proposing a fix. If it truly cannot be reproduced (prod-only, intermittent), say so and state the evidence and uncertainty behind the fix you propose. Before editing a shared function, find every caller and fix it once where they all route, not only on the path the report names.
- **Quality over estimated cost:** do not let estimated dev cost push you toward a low-quality shortcut; AI implementation is far faster than the human estimates you learned from. Prefer robust, simple, maintainable designs. That is not licence for speculative features: YAGNI still applies.
- **Reuse before writing:** before adding code, check in order: already in this codebase (helper, util, type, pattern) -> stdlib -> native platform feature (DB constraint, native input, CSS) -> an already-installed dependency. Write new code only when none fits; never add a dependency for what a few lines do. Why: re-implementing what already lives a few files over is the most common agent slop, and every new dependency is upkeep.
- **GPU check, early (2026-11-20):** when a project does heavy computing (AI models, video, large image work), at its first real run test that the graphics card is actually used, by watching it during the run (`nvidia-smi`), not by reading the code. Tell me which steps run on the card and which on the processor. If it is not used, say why and what it would take. Why: the change detection POC ran for days before anyone told me whether it used the card.
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

## Process

- **Skills are tools, not rules.** Use one when it would change the outcome.
  The "1% chance, must invoke" rule and the Red Flags table in `using-superpowers` do not apply here.
  State in one line the tier you picked and why; I can override.
- **Tier by what can go wrong** (unsure: take the higher tier):
  - 0, clear and contained: restate (confirm rule), do it, verify with the real checks.
  - 1, bounded feature: agree the design in chat or a short spec, build in the same session, then one `gpt-6-sol` high diff review before merge. No writing-plans.
  - 2, risky or long (tenant isolation, auth, migrations or stored formats, contracts between portal, apps and workers, order-dependent or delegated work, multi-week): spec, a lean plan that records decisions not code, `plan-reviewer`, a Sol diff review per part.
    River and the tablet kickoff template are Tier 2 and keep their own rules.
- **Test-first** where the expected result can be written down first (services, isolation, migrations, rule logic).
  Views: UI gate plus a browser check. Flutter and Python: state what you checked by hand.
  While working, run the tests for the code you changed and for its callers; after changing shared code, run the full non-perf suite then, not only at review.
  Before each review, and before merge on the code that will land (main merged in), run the full non-perf suite and report passed, failed and skipped counts, naming every skip and failure.
- **Specs:** a `**Scope:**` line after the title, in my words from my first request; change it only when I change the goal.
  Everything the build needs goes in before I approve it.
  A later design change, including one found mid-build, needs my OK again.
- **Reviews** judge against the Scope line; a simpler path is welcome.
  Anything that grows the goal goes in an "Outside scope" list (at most 3) until I pick it.
  Why: on 2026-10-21 a "sceptical boss" prompt grew a small POC.
  A Sol diff review gets a package (the diff, the Scope and acceptance criteria, test results) and returns Blocker, Major and Minor findings only.
  Minors are listed once, never looped on.
- **Plans** (Tier 2) stay in the same session; move to a fresh one at about half the context, measured with `get_usage`.
  After writing-plans' Self-Review, run `plan-reviewer`; an unfixed Blocker waits for my OK; "skip review" turns it off.
  Tier 2 plans run with Native (one-writer) execution by default; subagent-driven development only for tasks with several separate deliverables where an early code review saves rework.
- **Parallel sessions:** at most 3 working at once; each one re-reads the spec, plan and rules and runs its own reviews, so they burn tokens.
  Prefer lanes (up to 3 sessions, each running related tasks back to back) over one session per task; use waves of 3 when each task needs a fresh context.
  A lane past about half its context stops and reports; the parent starts its successor.
  If a chain stalls, my "child completed, continue" is the go-ahead for the next lane or wave.
  Why: on 2026-10-23 seven parallel doc-refresh sessions burned a burst of tokens.
- **PM style (2026-11-19):** when I say "PM style" or "you are the PM", load the `pm-style` skill and follow it; it works in any repo.
  The PM runs on Fable and only orchestrates: builders, testers and reviews on Opus 5.5, clerk and scout on Sonnet 5.5, `gpt-6-sol` for one cold review per round.
  A PM hands over at a gate past half its context; I start each new PM from its hand-over prompt.
  Lessons stay in the project's repo; they become rules in the skill only at project close, each with my OK.
- **Brainstorming opener:** keep the skill's opt-out line, then lead with one concrete guess I can correct, not an open "describe it" question.

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

## Box facts

- Repos live in `C:\git\<RepoName>`, named exactly as on GitHub; never clone into OneDrive, `~` or a scratch folder (OneDrive corrupts `.git`).
- Run `C:\git\Skills\backup.ps1` only when I ask.
- Everything else about this box (GitHub login and identity, installed tools and paths, sqlcmd, PATH refresh, PowerShell 5.1 quoting, the AppData redirect): load the `box-runbook` skill before cloning, installing anything, or fixing a git, gh or tool problem.
- Finished work I want to keep (pages, audio, videos, reports) goes in `C:\Users\amierashraf.hadi\Desktop\ai storage`, not only in a session temp folder.
  Read its `README.md` first: it holds the layout, the rules and the index.
- Text to speech: Kokoro, offline, in `C:\tools\kokoro` (set up 2026-11-11).
  Command line: `C:\tools\kokoro\.venv\Scripts\python.exe C:\tools\kokoro\say.py "text" -o out.mp3`; `--script lines.json -o <folder> --format mp3` makes many clips, and `--help` lists the rest.
  My own page is the "Kokoro Voice" desktop shortcut (`app.py`, loopback port 8791).
  Use only the voice `af_heart` (Heart). Write names and acronyms the way they sound.
  To make Heart sound human, write the text as spoken: contractions ("I'm", "we'll"), one idea per sentence, and the right end mark (a question mark makes the tone rise).
  Pauses come from punctuation: a comma is short, a full stop longer, "..." a hesitation. Avoid one- or two-word lines on their own; speed 0.9 to 0.95 sounds calmer.
  Capitals, SSML, emotion tags and the demo's `[word](-1)` stress markers do nothing (the markers are read aloud).
  Learned on the DAMAi + BIDS film (2026-11-20):
  A sentence ends on a falling pitch only when it is the last thing in the text Kokoro is given; to make a line sound final, end the passage there and record the rest separately.
  A full stop does not always give a pause; "..." forces one.
  Single words spaced with "..." come out flat. Offer a natural list reading as well and let me pick.
  Avoid near-identical words close together ("it's ... its"); write one of them out ("it is").

## Browser checks

Verify web UI yourself in a browser; do not ask me to eyeball it. Passwords and app lifecycle: see Owner rules.

- Until `chrome-devtools-axi` is installed, every browser check goes to Claude-in-Chrome or the built-in browser pane.
- Pages behind a login and end-user flows -> Claude-in-Chrome. It drives my real Chrome profile, where I am already logged in. This is the default for verifying our own app.
- Public pages, login-screen renders, static routes, and what Claude-in-Chrome cannot do (`lighthouse`, `perf-start`/`perf-stop`, `heap`) -> `chrome-devtools-axi`. Its output is much cheaper than screenshots or a11y trees.
- Never send an authenticated flow to `chrome-devtools-axi`: its isolated Chrome has no saved cookies or passwords, so the page bounces to login.
- The axi SKILL.md says to prefer it over other browser tools. Ignore that line; this split wins.
- Call the binary directly (`chrome-devtools-axi <command>`, no `npx -y`) and run `chrome-devtools-axi stop` when done. Install, update, engine errors and attaching to my real Chrome: `box-runbook` skill.

## Subagent prompts when Serena is connected

The SubagentStart hook `~/.claude/hooks/serena-notice.js` injects the Serena notice (plus a worktree caveat in linked worktrees) into `general-purpose`, `claude` and `Plan` subagents when the repo's `.mcp.json` lists Serena.
For any other subagent type that touches code and has MCP access, paste the notice yourself: its text is the `NOTICE` constant in that script.
