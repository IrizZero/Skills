# Close-out and learning

Read this when the owner says a project or a round is finished.

## Close-out steps

1. **Nothing running.** Every session idle, no background job. Say so.
2. **State page final.** The clerk writes it one last time: what is proven and how, what is not, the open items for the day the owner returns, where everything is (branch, folders, outputs).
3. **Limits written into the spec** as limits, with the evidence and what would lift them.
4. **Count the cost** with `scripts/` (see `scripts/README.md`): tokens per session, the PM's share, cost by kind of work, cost above and below 300,000 tokens of context. Put the table in the retrospective.
5. **Count the method:** wall-clock per stage, owner turns the method itself caused, PM messages that corrected the PM's own brief, what the gates caught that the stage reports did not say. Use "not measured" where there is no number.
6. **Write the retrospective** in the project's PM folder: the costliest mistakes, the smaller ones by kind, what worked, what to improve. Each with its evidence.
7. **Write the close-out proposal** for this skill from `templates/closeout-proposal.md` and put it to the owner.
8. **Commit and push only what the owner asks.** Check every unpushed commit message against the owner's rules before a push.

## From a lesson to a rule

A project lesson is specific. A rule in this skill is general. Most lessons do not become rules.

For each lesson in the project's lessons file, pick one:

- **Add** - a general rule that this skill does not hold yet. Write it in one or two lines, with no project detail.
- **Merge** - it sharpens a rule that is already here. Show the old line and the new one.
- **Drop** - it is about this project's technique or input, or it happened once at no real cost. It stays in the project's file.
- **Hook** - it was written down before and still broken, and a script can see it happen. Propose a reminder or a check, with what it would match.

Then check the proposal as a whole:

- Does it keep `SKILL.md` under 200 lines and each reference under 150? If not, say what goes out.
- Does any proposed rule excuse the PM's own mistake, or move the blame to a tool? Take it out or reword it.
- Is every rule something a PM can do, with a visible sign that it was done? "Be careful with numbers" is not a rule. "Mark each number measured or carried" is.
- Is anything in the proposal about one project (a client, a place, a file name)? Remove it. This folder is backed up to a public repo.

## The owner approves

- Show the proposal as a short table: add, merge, drop or hook, the wording, the lesson behind it.
- Change this skill only after the owner's OK, and only what was approved.
- After the change, add one line to `references/why.md` for each new or changed rule: the rule, the project, the date, the cost that taught it.
- Tell the owner the skill changed, so the backup can be run when they choose.

## Repeated mistakes

When a close-out finds a mistake that an existing rule already forbade, do not write the rule again in stronger words.
Ask why the rule did not hold: it was not read (move it to the core), it had no visible sign (give it one), or it needs a hook.
