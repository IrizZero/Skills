#!/usr/bin/env bash
# install.sh - deploy this repo's Claude config into ~/.claude  (macOS / Linux / bash)
#
# Additive + non-destructive: copies skills/, agents/, commands/ into ~/.claude/.
# Any existing same-named item is moved to ~/.claude/install-backups/<timestamp>/<group>/<name>
# before overwrite. Backups stay out of skills/ agents/ commands/, where the loaders would
# pick them up as extra skills. (~/.claude/backups/ is Claude Code's own folder - not used.)
# Does NOT touch settings.json or CLAUDE.md - those need a judgment merge (see README).
# Personal values are {{KEY}} placeholders in this repo; the installed copies get them
# filled from ~/.claude/personal.env (KEY=value lines) when that file exists.
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

PERSONAL="$CLAUDE_HOME/personal.env"

# Replace every {{KEY}} in file $1 with its value from $PERSONAL.
fill_placeholders() {
  local content new line key val pat
  content="$(cat "$1"; printf x)"; content="${content%x}"
  new=$content
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    case "$line" in ''|'#'*) continue ;; esac
    case "$line" in [A-Z]*=*) ;; *) echo "$PERSONAL has a bad line (want KEY=value): $line" >&2; exit 1 ;; esac
    key="${line%%=*}"; val="${line#*=}"
    [ -n "$val" ] || continue
    pat="{{$key}}"
    new=${new//"$pat"/"$val"}
  done < "$PERSONAL"
  [ "$new" = "$content" ] || printf '%s' "$new" > "$1"
}

[ "$DRY" = 1 ] || mkdir -p "$CLAUDE_HOME"
installed=0; backed=0; installed_list=""

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
    installed=$((installed+1)); installed_list="$installed_list$dest"$'\n'
  done
done

# Fill {{KEY}} placeholders in the installed copies. grep -I skips binary files.
unfilled=""
if [ "$DRY" = 1 ]; then echo "[dry] fill {{KEY}} placeholders from $PERSONAL"
else
  while IFS= read -r d; do
    [ -n "$d" ] || continue
    while IFS= read -r f; do
      [ -f "$PERSONAL" ] && fill_placeholders "$f"
      left="$(grep -ohE '\{\{[A-Z][A-Z0-9_]*\}\}' "$f" | sort -u | tr '\n' ' ' || true)"
      [ -z "$left" ] || unfilled="$unfilled  $f: $left"$'\n'
    done < <(grep -rlIF '{{' "$d" || true)
  done <<< "$installed_list"
fi

echo
echo "Installed $installed item(s) into $CLAUDE_HOME ($backed existing backed up)."
if [ -n "$unfilled" ]; then
  echo
  echo "UNFILLED placeholders - add these keys to $PERSONAL (see README 'Personal values'), then re-run:"
  printf '%s' "$unfilled"
fi
echo
echo "NEXT - needs judgment, NOT done by this script:"
echo "  1. settings.json: MERGE keys enabledPlugins, extraKnownMarketplaces, statusLine"
echo "     from $REPO/settings.json into $CLAUDE_HOME/settings.json."
echo "     Keep target's model / permissions / effortLevel. The statusLine value is a Windows"
echo "     PowerShell path - it will NOT work on macOS/Linux, so drop statusLine on this box."
echo "  2. CLAUDE.md: do NOT overwrite. Diff $REPO/CLAUDE.md vs $CLAUDE_HOME/CLAUDE.md and merge by hand."
echo "  3. Restart Claude Code so plugins reinstall from the marketplace config."
