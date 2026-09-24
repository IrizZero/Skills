---
name: decisions
description: Audit consequential choices made during the current task and surface only choices that deserve confirmation, correction, or a future revisit. Invoke explicitly with "$decisions", "review your decisions", or "what choices are you uncertain about" near the end of a task.
---

# Decision Audit

Review the work completed in the current task. Identify consequential choices, then report only those where reflection adds value. Do not manufacture doubt.

Use one block per decision, most consequential first:

```markdown
**<decision> - <KEEP | FIX | DEFER | ASK>**
- Chose: <choice made>
- Why: <reasoning at the time>
- If wrong: <observable failure mode>
- Do: <specific implication of the tag>
```

Apply tags as follows:

- `KEEP`: the decision still holds; state the evidence.
- `FIX`: the decision is now judged wrong; name the precise correction, but do not apply it unless requested.
- `DEFER`: it is acceptable now; name the event or evidence that should trigger reconsideration.
- `ASK`: user context is required; ask one specific question.

Keep the language short. If every meaningful choice is well-supported, say so directly.
