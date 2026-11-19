# How the desktop app shapes the method

These are facts about the Claude desktop app as seen in use, not choices.
Each has a date. Check one again before a design depends on it; the app changes.

## Starting sessions

- A session can start another session only on a turn the owner typed, or on a chain of wake-ups that follows one. (2026-10)
- On a wake-up turn the PM can start a session only in its own folder. A session in another folder, such as a worktree the PM made, needs a turn the owner typed. Ask for that go in the gate report. (2026-11)
- A work session cannot start sessions itself. It can start subagents, which is how a tester runs its readers. (2026-11)
  So a PM started by another PM could not start builders: the owner starts each PM.
- A round approved while a builder is still busy still needs one more owner turn to start. Say so when asking for the approval. (2026-11)
- `start_session` takes a `model`, and so does a subagent, so each role runs on its own model.
- A session started with `cwd` at a worktree the PM made uses that folder as it is.
- A session in a worktree loads the project's memory like any other. (2026-11)

## Messages and wake-ups

- A message to a session works from any turn, but waits until that session's current turn ends. Must-do items go in the brief.
- The PM is woken only when none of its sessions is still working.
- A wake-up note quotes only the start of the session's report. Read the report file, not the note.
- Never pull a whole session transcript. Read report files, logs by their last lines, documents by line range.

## Context

- A fresh session already holds about 100,000 tokens before it reads anything. (2026-11)
- After a long idle the app can compact the PM by itself. State that is only in the conversation is then lost; state in files is not.
- A cached context expires after about an hour. The next call writes the whole context again.
- A `get_usage` reading taken before a compaction is stale after it.

## This skill's hook

- The hook in this skill's frontmatter is registered when the skill is loaded and stays for the rest of that session only.
- A new PM session has no hook until it loads the skill. Work sessions never have it; their rules are in their brief.
- The hook only adds a reminder. It blocks nothing.

## The browser pane

- A local HTML file opened directly loads as a `data:` page, so files beside it fail. Serve it over loopback instead.
- Some ports are refused silently by the browser engine. A blank page on an odd port is the port, not the page.
- A pane that is hidden runs its page in the background: lazy pictures stay black, video may not play, transitions freeze.
- A viewport larger than the pane makes click positions and screenshots disagree.
- A page served on the same port as an earlier one can come back stale. Check the build you are looking at.

## Other tools

- Hooks of the owner can deny a whole command that only names a guarded file. Read such files with the Read tool, never by shell.
- Codex runs: load the `codex-exec` skill first.
