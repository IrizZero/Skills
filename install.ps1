#!/usr/bin/env pwsh
# install.ps1 - deploy this repo's Claude config into ~/.claude  (Windows / PowerShell)
#
# Additive + non-destructive: copies skills/, agents/, commands/ into ~/.claude/.
# Any existing same-named item is moved to <name>.bak-<timestamp> before overwrite.
# Does NOT touch settings.json or CLAUDE.md - those need a judgment merge (see README).
#
# Usage:
#   ./install.ps1            # install
#   ./install.ps1 -WhatIf    # dry run, show actions only
#   ./install.ps1 -ClaudeHome 'D:\alt\.claude'

param(
  [string]$ClaudeHome = (Join-Path $env:USERPROFILE ".claude"),
  [switch]$WhatIf
)

$ErrorActionPreference = "Stop"
$repo  = Split-Path -Parent $MyInvocation.MyCommand.Path
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

if (-not (Test-Path $ClaudeHome)) {
  if ($WhatIf) { Write-Host "[dry] mkdir $ClaudeHome" }
  else { New-Item -ItemType Directory -Path $ClaudeHome | Out-Null; Write-Host "Created $ClaudeHome" }
}

$installed = 0; $backedUp = 0
foreach ($g in @("skills","agents","commands")) {
  $srcDir = Join-Path $repo $g
  if (-not (Test-Path $srcDir)) { continue }
  $destDir = Join-Path $ClaudeHome $g
  if (-not (Test-Path $destDir)) {
    if ($WhatIf) { Write-Host "[dry] mkdir $destDir" }
    else { New-Item -ItemType Directory -Path $destDir | Out-Null }
  }
  foreach ($item in Get-ChildItem $srcDir) {
    $dest = Join-Path $destDir $item.Name
    if (Test-Path $dest) {
      $bak = "$dest.bak-$stamp"
      if ($WhatIf) { Write-Host "[dry] backup $dest -> $bak" }
      else { Move-Item $dest $bak }
      $backedUp++
    }
    if ($WhatIf) { Write-Host "[dry] copy   $($item.Name) -> $dest" }
    else { Copy-Item $item.FullName $dest -Recurse -Force }
    $installed++
  }
}

Write-Host ""
Write-Host "Installed $installed item(s) into $ClaudeHome ($backedUp existing backed up)."
Write-Host ""
Write-Host "NEXT - needs judgment, NOT done by this script:"
Write-Host "  1. settings.json: MERGE keys enabledPlugins, extraKnownMarketplaces, statusLine"
Write-Host "     from '$repo\settings.json' into '$ClaudeHome\settings.json'."
Write-Host "     Keep target's model / permissions / effortLevel. The statusLine path is box-specific"
Write-Host "     (plugin-cache hash + Windows path) - drop it if it does not resolve here."
Write-Host "  2. CLAUDE.md: do NOT overwrite. Diff '$repo\CLAUDE.md' vs '$ClaudeHome\CLAUDE.md' and merge by hand."
Write-Host "  3. Restart Claude Code so plugins reinstall from the marketplace config."
