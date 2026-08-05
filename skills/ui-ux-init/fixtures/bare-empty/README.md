# Bare empty project

Single-line placeholder. Use to exercise the `skip` / `--skip-context` path —
subagent should NOT be dispatched; main thread should use the fixed neutral
defaults from spec §7.5.

## Expected ui-ux-init behavior
- Invoke with `--skip-context` flag, OR type `skip` at the inline paste prompt
- Subagent NOT dispatched
- 3 deterministic variants from spec §7.5:
  - A: sidebar-left + comfortable + filled+rounded + neutral (#475569)
  - B: topnav + compact + outline+sharp + neutral (#475569)
  - C: split-pane + spacious + ghost+soft-shadow + neutral (#475569)
- Same A/B/C every invocation
