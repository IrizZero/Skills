# Plan review - 2026-09-24-solution-auditor-redesign

Reviewers: opus plan-reviewer subagent. Codex `gpt-6-sol`@high pass **failed**: it hung for more than 25 minutes on repeated `code-mode host exited during handshake` tool-router errors and produced no output. Result: opus-only, no Codex verdicts.

| Finding | Source | Codex verdict | Decision | Evidence / action |
|---|---|---|---|---|
| B1 eval answers leak via repo grep | opus | none | ACCEPT | Task 6 Step 1 stages fixture code outside the repo; only staged paths are passed; Codex runs with `-C`; leak check added to grading. |
| W1 assertions need per-model raw outputs | opus | none | ACCEPT | Skill saves `<run>/sa-{opus,sol}-{cold,reveal,exit}.md`; Codex uses `-o`. |
| W2 Task 7 range orphans BEGIN marker | opus | none | ACCEPT | Verified markers at CLAUDE.md:229/246 and ~/.claude/CLAUDE.md:206/223; replace strictly between markers. |
| W3 remote is IrizZero/Skills | opus | none | ACCEPT | `git remote -v` = `https://github.com/IrizZero/Skills.git`; Task 9 expectation fixed. |
| W4 no rollback if eval gate fails | opus | none | ACCEPT | Task 6 Step 4 restores both installed files from HEAD~1. |
| W5 continuation mechanisms untested | opus | none | ACCEPT | New Task 2 smoke test (haiku agent + SendMessage; luna@low resume sandbox write attempt). Replaces the baseline run. |
| S1 IDs held only in main-thread memory | opus | none | ACCEPT | `<run>/sessions.md`; per-invocation `<run>` folder. |
| S2 prompt as argument can hit 32K cmdline limit | opus | none | ACCEPT | Codex gets "Read <file> and follow it." |
| S3 `effort:` frontmatter unverified | opus | none | DISMISS | code.claude.com/docs/en/model-config: "Frontmatter effort applies when that skill or subagent is active, overriding the session level". |
| S4 exit check on spec-review loops unclear | opus | none | ACCEPT | Run once; rerun only if the chosen direction changed. |
| S5 pressure-worse lacks src/db.py | opus | none | ACCEPT | Stub added to fixture, file list and evals.json. |
| N1 Codex can hang indefinitely | main thread (from the failed Codex pass) | n/a | ACCEPT | All skill Codex calls wrapped in `timeout 1200`; exit 124 = failure. |

Token cut applied (owner rule: no token waste): Task 2 baseline run of the old skill (7 opus calls) replaced by the cheap smoke test.
