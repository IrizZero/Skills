# Setting up, the spec and the briefs

## When PM style fits

Use it when the work is larger than one session can hold, or splits into stages with a clear hand-over between them.
Do not use it for a change that a handful of tool calls settles: the fixed cost is a spec, a brief and a check at every gate.

## Before any build session starts

1. **Talk it through with the owner first.** Restate the goal, find what is really wanted, say what is and is not possible.
   Lead with one concrete guess the owner can correct, and the smallest version of the work. Create nothing in this step.
2. **Send a scout to the real inputs** before the design is fixed and before any debate with another model.
   Wait for the first real file. Ten minutes of looking has saved a whole round more than once.
3. **Fill the inputs table** in the state page: each input, its conditions (light, time, source, size), and which pair or set is the fair one to work on.
4. **Research goes to a cheaper subagent, with your own beliefs listed.** Ask it to verify or correct them, with a source and a confidence for each. Re-read yourself only the sources the decision hangs on.
   Look up how the field does a thing before proposing your own way from first principles.
5. **Show the end product before it is built.** For anything with a screen, a mockup.
6. **One proposal, ending with "what your OK covers":** the branch, the folder, the downloads, the process. One approval then covers them.
7. **An outside source (a map, an API, a data set) is opened once before a round is built on it.** List what it actually holds inside the tool's reach.

## Setting up

1. The PM creates the worktree itself, in the folder the owner has agreed for worktrees, on a new branch.
2. The PM writes the spec and commits it on the branch before the first build session starts. The spec is the hand-over to the builder.
3. Measure before asserting anything about a work session's environment: `get_usage` on the session shows what it loaded.
4. Record the owner's own words beside your reading of them, in two fields. The builder reports what the reading does not settle.

## What the spec holds

- a `**Scope:**` line in the owner's own words; it changes only when the owner changes the goal;
- what the work claims and what it does not;
- the facts about the inputs, each marked measured (how) or carried (from where);
- each decision with its reason;
- acceptance in two parts: hard requirements, and results that are only reported;
- settings in real units (metres, seconds), not in pixels or samples of one input;
- a stop rule: what a session does when a hard requirement fails;
- the stages, and what each hands over;
- the working rules the sessions must follow;
- what is outside scope, including future goals the owner mentioned, parked in the owner's words.

An acceptance line that says "equal" or "the same" names what the tool can actually keep equal. Read where the compared values come from before writing it.

A design change after the last stage is a new spec section first, then a session. Never brief from chat.

## The builder's brief

- Short, pointing at the spec. It names the stage, what done looks like and where to stop.
- "Stop and report at the end of the stage. Do not start the next one."
- "If the spec is wrong, say so with numbers. Do not work around it." Name the one place where you expect trouble.
- "Before writing code, list any acceptance line you cannot meet as written."
- "Re-read the spec before your checks and before your report." The spec is the one channel; a message is only a pointer and may arrive late.
- "Stop at half your context window with a note of where you are."
- The report goes to a file on the branch, with these sections: what was built, differences from the spec, what I could not check, noticed, open questions and decisions for the PM (options and your pick), what the next session needs.
- The turn ends with a notice of at most 3 lines: done or blocked, the report path, whether a decision is needed.
- For a screen: "Use the page as a person would and list the defects you find."
- The commit rules of the owner apply in full. Put them in the brief: explicit paths, no push, and the owner's rule on commit messages.

## The tester's brief

- It carries the whole test plan: what is expected, which points or frames, the pass lines, what will be dropped and why.
- Everything is fixed and committed before any run. Name check points by a rule and by the tool's own step list, not by a scratch script.
- For a blind test: the reading is done before the tool runs, and file hashes are written first.
- A forbidden input or window is stated with its margins: say that a tool's own margins count.
- It hands back one table, two or three named pictures, and what it could not check.
- Its readers are its own subagents. The PM is woken once per stage, not once per reader.

## Sizing

- Expect one fresh build session per stage when a stage is a few thousand lines.
- A stage that may grow gets two sessions planned from the start, and the owner is asked for both starts at once.
- Set a stop clock by counting back from what must still happen after the run: the page, the tests, the checks, plus one whole unit of work.
- Never write "before you do X" to a session that is already working. It will read it after X.
