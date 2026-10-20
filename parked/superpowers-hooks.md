# Parked: superpowers flow hooks

Parked on 2026-10-20 together with `parked/skills`, `parked/agents` and `parked/codex-kit-skills`.
See `parked/README.md` for why and how to restore.

These are the instruction sections that wired solution-auditor, plan-reviewer, yagni-guardian and the fog-of-war plan rules into superpowers flows.
They were written for superpowers before 7.0.0 and reference its old brainstorming step numbers.

---

## Part 1: from `snapshot/CLAUDE.md` (Claude Code global instructions)

### Superpowers flow hooks

These fire inside `superpowers:*` flows. Each named skill carries its own procedure and main-thread duties; this section only says when to run it. All are advisory: a failure never blocks the flow, so note it in chat and continue.

- **When to use skills:** invoke a skill when it clearly fits the task, not on a 1% chance (this overrides using-superpowers).
  Brainstorming is for new features and design changes; small edits, config changes and bug fixes go through my confirm-before-editing gate instead.

- **Brainstorming step 4**, before you propose approaches: run `solution-auditor` and follow it, including its exit check between steps 7 and 8. "skip audit" turns it off for the session.
- **End of brainstorming**, before writing-plans starts: sort every open question. Sharp (you can state it precisely now, even if it is unanswerable) -> a plan decision or step. Blurry (you cannot phrase it sharply) -> the plan's fog section, verbatim and unsliced. Never pre-slice fog into steps.
- **Every plan from writing-plans ends with:**

      ## Not yet specified
      <in scope but too blurry to plan. If empty, say "way is fully clear".>

      ## Out of scope
      <consciously ruled out, one-line reason each>

  These sections are not placeholders: writing-plans' "No Placeholders" list and its self-review "add the task" step do not apply to items that belong in "Not yet specified".

- **After writing-plans saves a plan** (normally under `docs/superpowers/plans/`): run `plan-reviewer`, then `yagni-guardian` on the same plan, passing its path, then go to my review gate. Triage and record findings as each skill's verdict policy says. "skip review" and "skip yagni" turn them off.
- **During executing-plans**, when something is blurry: listed in the fog sections -> skip it; not listed -> stop and ask. A plan missing its fog sections -> flag it in chat and continue.

---

## Part 2: from the Codex global `AGENTS.md` (old box, before the plugin rename)

### Superpowers flow hooks

These fire inside `superpowers:*` flows. Each named skill carries its own procedure and main-thread duties; the blocks below only say when to run it. All are advisory: a failure never blocks the flow, so note it in chat and continue.
The blocks are marker-delimited because skill installers manage them; edit inside the markers, keep the markers.

<!-- BEGIN plan-reviewer -->
### Plan Reviewer integration

Skill `~/.agents/skills/plan-reviewer/`, custom agent `~/.codex/agents/plan-reviewer.toml`. Any project.

`superpowers:writing-plans` finishes a plan -> main thread (still in flow) MUST:

1. Save plan to `docs/superpowers/plans/` (project-relative); no such convention -> skip reviewer.
2. Invoke `plan-reviewer` on the plan.
3. Per finding: ACCEPT / DISMISS / DEFER with `file:line` evidence.
4. Apply ACCEPTed changes to the plan inline.
5. Write sidecar `<plan>.review.md`.
6. One-line chat summary (finding + verdict counts).
7. Proceed to the user-review gate.

**Advisory only** - cannot block the flow. On failure/error, go to the gate without a sidecar + note in chat. Bypass: "skip review"; re-run after editing the plan: "re-review plan".

The custom agent TOML pins `gpt-6-sol` with high reasoning and a read-only sandbox. Do not override it with an incompatible model alias.

<!-- END plan-reviewer -->

---

<!-- BEGIN solution-auditor -->
### Solution Auditor integration

Skill `~/.agents/skills/solution-auditor/`, custom agent `~/.codex/agents/solution-auditor.toml`. Any project.

`superpowers:brainstorming` reaches step 4 ("Propose 2-3 approaches") -> main thread (still in flow) MUST:

1. Invoke `solution-auditor` BEFORE proposing its own approaches. The agent gets a cold packet first (goal, quoted constraints, repo paths; leaning direction redacted), then the direction revealed neutrally.
2. Merge the audit with own approaches; present the merged set.
3. User's idea not the auditor's top pick -> ask: preference or technical claim, and what fact supports it?
4. After brainstorming step 7, before step 8: run the skill's exit check (skipped only if final direction = the auditor's post-reveal #1 pick). Show the verdict (SUPPORTED / DELIBERATE TRADE-OFF / UNEXPLAINED) beside the spec review request.

**Advisory only** - never blocks. Agent fails -> continue without an audit + note in chat. Bypass for the session: "skip audit"; re-invoke mid-brainstorm: "second opinion" / "audit solutions".

The custom agent TOML pins `gpt-6-sol` with high reasoning and a read-only sandbox. Do not override it with an incompatible model alias.
<!-- END solution-auditor -->

---

<!-- BEGIN yagni-guardian -->
### YAGNI Guardian integration

Skill `~/.agents/skills/yagni-guardian/`, custom agent `~/.codex/agents/yagni-guardian.toml`. Any project.

`superpowers:writing-plans` finishes and `plan-reviewer` has returned -> main thread (still in flow) MUST:

1. Invoke `yagni-guardian` on the same plan - after `plan-reviewer`, before the user-review gate.
2. Per finding: ACCEPT / DISMISS / DEFER with `file:line` evidence.
3. Apply ACCEPTed cuts to the plan inline.
4. Write sidecar `<plan>.yagni.md`.
5. One-line chat summary (finding count, density tier, verdict counts).
6. Proceed to the user-review gate.

**Advisory only** - cannot block the flow. HARD tier emits stronger language but does NOT gate the user-review step. On failure/error, go to the gate without a sidecar + note in chat. Bypass for the session: "skip yagni"; standalone against any plan file: "yagni check" / "run yagni".

The custom agent TOML pins `gpt-6-sol` with high reasoning and a read-only sandbox. Do not override it with an incompatible model alias.
<!-- END yagni-guardian -->

---

<!-- BEGIN fog-of-war -->
### Fog of War (wayfinder graft)

Two rules grafted from wayfinder's fog-of-war idea. No new skills, no new subagents.

**Plan template - fog sections.** Every plan from `superpowers:writing-plans` MUST end with:

    ## Not yet specified
    <in-scope, too blurry to plan. Empty = say "way is fully clear" explicitly.>

    ## Out of scope
    <consciously ruled out. One-line why each.>

During `superpowers:executing-plans`, executor hits something blurry -> check fog section: listed = skip it, not listed = stop and ask. Missing sections = flag in chat and continue. plan-reviewer backstops missing sections with a Warning finding.

**Brainstorming exit gate - fog-vs-ticket test.** End of `superpowers:brainstorming`, before writing-plans starts: classify every open question. Sharp (can state precisely now, even if unanswerable) -> plan decision or step. Blurry (cannot phrase sharply) -> fog section, verbatim, unsliced. Never pre-slice fog into steps.
<!-- END fog-of-war -->
