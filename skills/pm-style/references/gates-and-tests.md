# Gates and tests

## The gate routine

A gate should take the PM five to ten minutes.

1. Read the builder's report file. Read "noticed" and "what I could not check" first.
2. Check the claim with one command or one file range: the diff's file list, a hash against the reference, the status of the worktree, that nothing heavy is still running.
   A report is a claim, not proof.
3. Read the tester's table. Look at the two or three decisive pictures. Check the one number the verdict rests on.
4. **Scope check.** Re-read the Scope line. Write "Grows the goal: no", or name what grows it and take it to the owner before it is built.
5. **Number check.** Each number in your report: measured (how, on which input) or carried. A number measured on a round trip is not a number for one way; say which errors cancelled.
6. Verdict: passed, passed with named limits, or failed. A failure is reported as it is. Never make the test easier to improve a number, and never hide a miss.
7. The clerk updates the state page. Then the report to the owner.

## Proofs that make a gate cheap

- Ask for proofs that leave checkable files: hashes, a result file per pair, both sides named. The gate is then a comparison.
- Before touching shared code, a recount proof: the same result to the bit, before and after.
- A rule changed after seeing a result is argued from the logic of the thing, and both result pages are kept.
- A builder that names what it could not check shortens the gate. Sample its work; do not repeat it.

## Guard rails against fooling ourselves

- Set a threshold on one data set and test it on another.
- Keep one input untouched until the end, run it once, tune nothing afterwards.
- The code under test never reads the answers.
- Put a gate between "the test is made" and "the tool is built". Fix the test there, then freeze it. Check that the freeze commit is older than the blind files.
- A test set by the builder, or made by the same generator the tool was designed against, is not independent. Someone else sets it, with a stronger nuisance.
- When a control fails, ask the cause of every item near the line before any fix. A fresh run can fail in a new way; say so to the owner.
- Each side writes the other's limits: the builder writes what the PM's test cannot show.
- Ask how strict a "match" is before reporting "found N of M".
- Read where a score has its values, not only its ratio. A gap where the other curve peaks is "not answered", never "met".
- Check that a reference mark can be read in every input before it is fixed as truth.
- Read every unexpected finding before calling it a false alarm. Unplanned true finds are reported on their own.
- Timing: when repeated runs of one job differ by ten percent or more, a saving of a few percent cannot be seen. Say so.

## One cold review per round

- At the end of a round, one review by another model family, on an export of tracked files only.
- Give it the areas to attack and no conclusions.
- Check its claims about the code yourself before acting on them.
- Its findings are judged against the Scope line. What grows the goal goes on an "outside scope" list of at most three, for the owner to pick.

## A debate before a risky design

- At most two rounds.
- Between the rounds, read the code or the data the argument is about, or send a scout.
- Round two carries evidence and a counter-design, and asks for a verdict per item and a "still disagree" line.

## Checking a screen

- The builder uses the page as a person would. The tester clicks through it. The PM looks at one screenshot.
- Check a page on a real result of each kind, not only the happy one.
- Before calling a defect from a screenshot, check the element's state: a hidden pane can show black pictures or a stuck Play button that a visible one does not.

## Size the proof

- A proof of concept does not need a product's proof.
- Propose the short test first, with its machine time, and name what it leaves unproven. The owner can ask for more.
- Readers of pictures are the dearest part of a test. Use as few points and readers as the claim needs.
- Run the whole test suite once per stage, at the end, unless shared code changed.

## Commits at a gate

- Explicit paths only. No push unless the owner asks.
- Check every commit message against the owner's rules when it is written, not at push time.
