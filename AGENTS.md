# Skills Repository Instructions

Apply the user's global `~/.codex/AGENTS.md` first.

## Repository layout

- `skills/`, `agents/`, and `commands/` are the canonical Claude Code backup sources. Preserve Claude-specific metadata and tool names there.
- `plugins/amier-workflow-kit/` is the canonical Codex and ChatGPT plugin source.
- `.agents/plugins/marketplace.json` is the repo-local marketplace used to test that plugin.
- `manifest.json`, `install.ps1`, `install.sh`, and `backup.ps1` describe or manage the Claude Code backup unless they explicitly say otherwise.
- Do not copy generated Codex imports back over the Claude sources. Adapt Codex behavior in the plugin or in the user's Codex deployment.

## Validation

- Validate every Codex skill with the built-in `skill-creator` validator.
- Parse plugin JSON and `agents/openai.yaml` metadata before treating the plugin as ready.
- Keep custom Codex agents in TOML format. Read-only reviewers must set `sandbox_mode = "read-only"`.
- Do not install `amier-workflow-kit` alongside unqualified standalone skills with the same names unless the overlap is intentional and tested.
