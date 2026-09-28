#!/usr/bin/env pwsh
# backup.ps1 - refresh this repo's snapshot FROM the current box's ~/.claude.
#
# Run this on the SOURCE box after you change your skills/agents/commands/config,
# so the repo mirrors your latest setup. Then review 'git status' and commit.
#
# Mirrors deletions: skills/agents/commands in the repo are replaced wholesale by
# the current ~/.claude versions. settings.json + snapshot/CLAUDE.md are copied over as the
# reference snapshot (install-time logic decides how to merge them onto a target).
#
# This repo is public. Personal values (name, emails) live only in
# ~/.claude/personal.env (KEY=value lines). After copying, every real value in the
# snapshot is swapped for its {{KEY}} placeholder. No personal.env = no backup.
#
# Usage:
#   ./backup.ps1
#   ./backup.ps1 -ClaudeHome 'D:\alt\.claude'

param(
  [string]$ClaudeHome = (Join-Path $env:USERPROFILE ".claude")
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path

$personalFile = Join-Path $ClaudeHome "personal.env"
if (-not (Test-Path $personalFile)) {
  throw "Missing $personalFile - refusing to snapshot unredacted personal values. See README 'Personal values'."
}
$personal = [ordered]@{}
foreach ($line in Get-Content -LiteralPath $personalFile -Encoding UTF8) {
  if ($line -match '^\s*(#|$)') { continue }
  if ($line -notmatch '^([A-Z][A-Z0-9_]*)=(.*)$') { throw "$personalFile has a bad line (want KEY=value): $line" }
  if ($Matches[2] -ne '') { $personal[$Matches[1]] = $Matches[2] }
}

foreach ($g in @("skills","agents","commands")) {
  $src = Join-Path $ClaudeHome $g
  $dst = Join-Path $repo $g
  if (Test-Path $dst) { Remove-Item $dst -Recurse -Force -Confirm:$false }
  if (Test-Path $src) { Copy-Item $src $dst -Recurse -Force }
}
Copy-Item (Join-Path $ClaudeHome "settings.json") (Join-Path $repo "settings.json") -Force
# snapshot/, not the repo root: a root CLAUDE.md would load as this repo's project
# instructions and double the global one in every session here.
$snapDir = Join-Path $repo "snapshot"
if (-not (Test-Path $snapDir)) { New-Item -ItemType Directory -Path $snapDir | Out-Null }
Copy-Item (Join-Path $ClaudeHome "CLAUDE.md")      (Join-Path $snapDir "CLAUDE.md")   -Force

# Redact: real value -> {{KEY}}, case-insensitive, longest value first. Binary files skipped.
$keys = @($personal.Keys | Sort-Object { $personal[$_].Length } -Descending)
$utf8 = New-Object System.Text.UTF8Encoding($false)
$snapshot = @("skills","agents","commands","settings.json","snapshot") |
  ForEach-Object { Join-Path $repo $_ } | Where-Object { Test-Path -LiteralPath $_ }
foreach ($f in Get-ChildItem -LiteralPath $snapshot -Recurse -File -Force) {
  $text = [IO.File]::ReadAllText($f.FullName)
  if ($text.Contains([char]0)) { continue }
  $new = $text
  foreach ($k in $keys) {
    $new = [regex]::Replace($new, [regex]::Escape($personal[$k]), "{{$k}}", 'IgnoreCase')
  }
  if ($new -cne $text) {
    [IO.File]::WriteAllText($f.FullName, $new, $utf8)
    Write-Host "Redacted personal values in $($f.FullName.Substring($repo.Length + 1))"
  }
}

Write-Host "Snapshot refreshed from $ClaudeHome."
Write-Host "Review 'git status', then commit. Remember to bump counts in manifest.json if they changed."
