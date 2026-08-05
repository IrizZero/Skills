# gh-axi Test Run

Test document for verifying the `gh-axi` CLI on this repo.

## What is gh-axi

`gh-axi` is an agent-optimized wrapper around the GitHub `gh` CLI.
It uses the same auth (`GITHUB_TOKEN`) and the same command shapes,
but trims output for agent consumption.

- Installed globally via npm: `npm install -g gh-axi`
- Falls back to plain `gh` when a subcommand is missing

## Test flow exercised

1. Created branch `test/gh-axi`.
2. Added this file and committed it.
3. Pushed the branch to `origin`.
4. Opened a pull request with `gh-axi pr create`.
5. Inspected it with `gh-axi pr view` and `gh-axi pr list`.

## Result

Filled in after the PR is opened. See the PR description for the
command log and any deviations from the plan.
