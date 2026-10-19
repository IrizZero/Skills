---
name: codex-exec
description: How to run the Codex CLI on this Windows box. Load before any `codex exec` run (second opinion, review, investigation or implementation pass), and when a Codex run hangs, exits without edits or leaves odd diffs.
---

# codex exec on this box

The rules that decide which model may run (GPT-6 only, leader vs follower, sol above high and astra need the owner) live in `~/.claude/CLAUDE.md`.
`~/.claude/hooks/guard.js` enforces them. This skill is the how.
Auth, version, missing-model or model-cache problems: load the `box-runbook` skill.

## Command shape

```bash
codex exec -m gpt-6-sol -c model_reasoning_effort=high --sandbox read-only -o out.md "$(cat prompt.txt)" > run.log 2>&1 </dev/null
```

- Always pass `-m`. The default model in `~/.codex/config.toml` is owner-gated, so a bare run triggers an approval prompt.
- Models, exact slugs only: `gpt-6-sol`, `gpt-6-luna`, `gpt-6-astra` (bare `luna` errors; there are no aliases).
  Efforts: `low | medium | high | xhigh | max`, plus `ultra` on sol and astra (max reasoning with automatic task delegation). There is no `--effort` flag.
- Pass the prompt as an argument, never on stdin, and append `</dev/null`.
  The Bash tool's stdin is an open pipe, so Codex waits on it forever (`Reading additional input from stdin...`).
  A run that shows only that line after about 30 s is hung: kill it and relaunch.
- Long prompts: write them to a scratchpad file with Write and pass `"$(cat file)"`.
  A heredoc assigned to a variable (`PROMPT=$(cat <<'EOF' ... EOF)`, then `"$PROMPT"`) also works.
- `--sandbox read-only` for reviews and investigations, `workspace-write` for edits. The sandbox has no network.
- `-i <png>` attaches an image (repeat the flag for several). `codex_models_manager` cache errors on every run are benign.
- Never use the openai-codex plugin's background/companion runtime: it deadlocked on Windows (2026-08-15, 2026-08-17).
  The plugin was removed on 2026-09-28; do not reinstall it.

## Edit runs (workspace-write)

- Start the prompt with: "This is a NON-INTERACTIVE run: nobody can answer questions. Do NOT ask for confirmation - the task is already approved; make the edits and finish."
  Without it Codex often asks for confirmation and exits 0 with zero changes.
- Luna honours the repo's `AGENTS.md` reconfirm rule. For review or verification fixes, cite the plan section that authorizes them and say the orchestrator confirms the exact edits.
- The sandbox cannot write `.git` (`index.lock`), and MSBuild inside it gets cancelled (`MSB5021`).
  Tell Codex up front that git, builds and tests are off-limits. You stage (explicit paths), commit, build and test.
- Building while the app runs: `dotnet build -p:BaseOutputPath=<scratch>/build-out/` (same compile, no locked exe). Never kill the app.

## After every edit run

- Exit 0 does not mean it edited: check `git status` and `git diff --stat`.
- Inflated diff counts usually mean LF lines written into CRLF files.
  Normalize to CRLF, and tell Codex never to rewrite untouched lines or change their endings.
- Diff Luna's output against the plan yourself: independent extraction, per-file byte or line counts, insert boundaries.
  Luna has truncated a file and "verified" it with the same broken extractor, and has copied one file's content into ten files while reporting no differences.
  Tell it to use its patch tool, not scripted block extraction.
- Restoring a file from a scratch copy: use Git Bash `cp` (new mtime), not PowerShell `Copy-Item`, or incremental MSBuild may skip recompiling it.

## Background

Dated incidents and version history: auto-memory `feedback_codex_exec_stdin.md` and `reference_codex_cli_gpt6.md` (ODS project memory).
