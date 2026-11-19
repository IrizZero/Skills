---
name: overtime
description: Turn the ODS work-hours rule off for today (/overtime) or back on (/overtime off). Manual-only; the overtime hook does the switching and the rule comes back by itself at midnight.
disable-model-invocation: true
argument-hint: "[off]"
---

The owner typed `/overtime $ARGUMENTS`.
The UserPromptSubmit hook `~/.claude/hooks/overtime.js` already acted on it when the command was submitted: `/overtime` (or `/overtime on`) turns ODS overtime on until midnight, `/overtime off` turns it off.
Never write, move or delete `~/.claude/state/ods-overtime.json` yourself: only the hook owns it, and `guard.js` denies agent writes.

Reply in one line with the state now in force:

- Read `~/.claude/state/ods-overtime.json` with the Read tool. If it exists and its `date` is today, say: "ODS overtime is ON until midnight: the work-hours rule is off in every ODS session today." Otherwise say: "ODS overtime is OFF: the work-hours rule applies."
- Outside an ODS checkout (`C:\git\ODS`, its worktrees, `C:\git\ODS-*`) the hook ignores the command: say that overtime only applies to ODS sessions.
- Any argument other than none, `on` or `off` changes nothing: say so and show the two forms.

Then carry on with whatever was in progress. This command changes no other rule.
