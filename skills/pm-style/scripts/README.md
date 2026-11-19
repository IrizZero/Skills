# Counting a PM round

Two scripts that read the session transcripts on this computer and add up the tokens.
They only read and print. They use the standard library only.

| Script | What it prints |
|---|---|
| `measure.py` | Per PM session: span, token totals by type, cost units, context size at each owner prompt, the costliest owner turns, tool calls and their result sizes, reads and writes of the PM's paperwork, hands-on commands, cache gaps. Then the PM's subagents and the build sessions |
| `by_kind.py` | Per PM session: cost split by kind of work, and cost above and below 300,000 tokens of context |

## Run

Copy `config.example.json`, fill it in, then run from any folder:

```powershell
python -X utf8 measure.py my-config.json > measure-out.md
```

```powershell
python -X utf8 by_kind.py my-config.json
```

With no argument, or a config file that is missing or not valid JSON, a script prints a short usage text and exits with code 2.

`measure.py` prints about 300 lines, so send it to a file.
Its output quotes the first 150 characters of each owner prompt; keep that file out of any repo.

A transcript's file name is not the app's `local_...` id. Find it by its title in `<file name>\custom-title.json` next to the transcript.

## Config keys

Required:

- `pm_transcript_dir`: folder that holds the PM sessions' transcripts. A leading `~` is expanded.
- `pm_sessions`: label -> list of transcript file names (without `.jsonl`) of one PM session. A session that was reopened has several files; list them all.

Optional:

- `build_transcript_dir`: folder that holds the build and test sessions. Without it the build table is empty.
- `build_titles`: title text of a build or test session (as in its `custom-title.json`) -> short label.
- `module_name`: Python module the project runs with `-m`. Counted as a hands-on command.
- `utc_offset_hours`: hours added to transcript times when printing. Default 0.
- `paperwork_match`: regexes, joined with `|`. A read, a shell read or a Serena call that matches is a paperwork read in `measure.py`.
- `paperwork_group`: regexes, joined with `|`, each matching to the end of the path. They shorten a read's path to the group name in the per-file table.
- `hands_on_paths`: path fragments (forward slashes). A Read, Grep or Glob that touches one counts as hands-on in `by_kind.py`.
- `hands_on_excluded`: regexes. A touch that also matches one of these is not hands-on.
- `paperwork_write_pattern`: regex on the file path of an Edit or Write; a match is a paperwork write.
- `report_read_pattern`: regex on the file path of a Read; a match is a report read.
- `paperwork_read_pattern`: regex on a Read or Grep; a match is a paperwork read.

In JSON, write each backslash twice: `"docs[/\\\\]notes[/\\\\]"` is the regex `docs[/\\]notes[/\\]`, and `"step-\\d+"` is `step-\d+`.

## The rules behind the numbers

- **Cost units** are tokens weighted by plain price ratios: input 1, cache write 2 (1.25 for 5-minute entries), cache read 0.1, output 5. Every model gets the same weights, so a PM on a dearer model costs more than its units show.
- **Dedupe:** entries by `uuid` across a session's files, usage by `message.id`.
- **Kind of work:** each API message gets one kind from its tool calls. A message that mixes kinds takes the first that matches, in this order: hands-on, children, codex, paperwork writes, report reads, paperwork reads. So "hands-on" is a little high.
- **Tied to the config:** what counts as paperwork, report reads and hands-on file touches comes only from the config. Change it for another project.
