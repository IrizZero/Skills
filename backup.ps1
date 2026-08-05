#!/usr/bin/env pwsh
# backup.ps1 - refresh this repo's snapshot FROM the current box's ~/.claude.
#
# Run this on the SOURCE box after you change your skills/agents/commands/config,
# so the repo mirrors your latest setup. Then review 'git status' and commit.
#
# Mirrors deletions: skills/agents/commands in the repo are replaced wholesale by
# the current ~/.claude versions. settings.json + CLAUDE.md are copied over as the
# reference snapshot (install-time logic decides how to merge them onto a target).
#
# Usage:
#   ./backup.ps1
#   ./backup.ps1 -ClaudeHome 'D:\alt\.claude'

param(
  [string]$ClaudeHome = (Join-Path $env:USERPROFILE ".claude")
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($g in @("skills","agents","commands")) {
  $src = Join-Path $ClaudeHome $g
  $dst = Join-Path $repo $g
  if (Test-Path $dst) { Remove-Item $dst -Recurse -Force -Confirm:$false }
  if (Test-Path $src) { Copy-Item $src $dst -Recurse -Force }
}
Copy-Item (Join-Path $ClaudeHome "settings.json") (Join-Path $repo "settings.json") -Force
Copy-Item (Join-Path $ClaudeHome "CLAUDE.md")      (Join-Path $repo "CLAUDE.md")      -Force

Write-Host "Snapshot refreshed from $ClaudeHome."
Write-Host "Review 'git status', then commit. Remember to bump counts in manifest.json if they changed."
