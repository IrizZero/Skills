#!/usr/bin/env bash
# install.sh - deploy this repo's Claude config into ~/.claude  (macOS / Linux / bash)
#
# Additive + non-destructive: copies skills/, agents/, commands/ into ~/.claude/.
# Any existing same-named item is moved to ~/.claude/install-backups/<timestamp>/<group>/<name>
# before overwrite. Backups stay out of skills/ agents/ commands/, where the loaders would
# pick them up as extra skills. (~/.claude/backups/ is Claude Code's own folder - not used.)
# Does NOT touch settings.json or CLAUDE.md - those need a judgment merge (see README).
#
# Usage:
#   bash install.sh              # install
#   DRY_RUN=1 bash install.sh    # dry run, show actions only
#   CLAUDE_HOME=/alt/.claude bash install.sh
set -euo pipefail

CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
DRY="${DRY_RUN:-0}"

[ "$DRY" = 1 ] || mkdir -p "$CLAUDE_HOME"
installed=0; backed=0

for g in skills agents commands; do
  srcdir="$REPO/$g"
  [ -d "$srcdir" ] || continue
  destdir="$CLAUDE_HOME/$g"
  [ "$DRY" = 1 ] || mkdir -p "$destdir"
  for item in "$srcdir"/*; do
    [ -e "$item" ] || continue
    name="$(basename "$item")"
    dest="$destdir/$name"
    if [ -e "$dest" ]; then
      bakdir="$CLAUDE_HOME/install-backups/$STAMP/$g"
      if [ "$DRY" = 1 ]; then echo "[dry] backup $dest -> $bakdir/$name"
      else mkdir -p "$bakdir"; mv "$dest" "$bakdir/$name"; fi
      backed=$((backed+1))
    fi
    if [ "$DRY" = 1 ]; then echo "[dry] copy   $name -> $dest"
    else cp -r "$item" "$dest"; fi
    installed=$((installed+1))
  done
done

echo
echo "Installed $installed item(s) into $CLAUDE_HOME ($backed existing backed up)."
echo
echo "NEXT - needs judgment, NOT done by this script:"
echo "  1. settings.json: MERGE keys enabledPlugins, extraKnownMarketplaces, statusLine"
echo "     from $REPO/settings.json into $CLAUDE_HOME/settings.json."
echo "     Keep target's model / permissions / effortLevel. The statusLine value is a Windows"
echo "     PowerShell path - it will NOT work on macOS/Linux, so drop statusLine on this box."
echo "  2. CLAUDE.md: do NOT overwrite. Diff $REPO/CLAUDE.md vs $CLAUDE_HOME/CLAUDE.md and merge by hand."
echo "  3. Restart Claude Code so plugins reinstall from the marketplace config."
