#!/usr/bin/env python3
"""Moat-guard: assert a Flutter-targeted artifact has zero web-only vocabulary.

A generated Flutter DESIGN.md (or an advisor Flutter consult) must never use
CSS/HTML idioms -- the stack moat depends on Flutter output staying in Widget /
Dart vocabulary. Run this against Flutter-targeted artifacts only. Do NOT run it
against stack-generic.md, which intentionally carries HTML/CSS + translation hints.

Usage: python check-flutter-css.py <file>
Exit 0 = clean; 1 = web-only vocab found (offenders printed); 2 = bad usage.
"""
import re
import sys

WEB_ONLY_PATTERNS = {
    "OKLCH": re.compile(r"\boklch\b", re.IGNORECASE),
    "container query": re.compile(r"@container\b|container-type\s*:", re.IGNORECASE),
    "cubic-bezier": re.compile(r"\bcubic-bezier\b", re.IGNORECASE),
    "css px/rem unit": re.compile(r"\b\d+(?:\.\d+)?(?:px|rem)\b", re.IGNORECASE),
    "html class attribute": re.compile(r"\bclass\s*="),
}


def scan(text):
    """Return sorted [(line_no, label, matched_fragment), ...]."""
    hits = []
    for label, pat in WEB_ONLY_PATTERNS.items():
        for m in pat.finditer(text):
            line_no = text.count("\n", 0, m.start()) + 1
            hits.append((line_no, label, m.group(0)))
    return sorted(hits)


def main(argv):
    if len(argv) != 2:
        print("usage: check-flutter-css.py <file>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as f:
        hits = scan(f.read())
    for line_no, label, frag in hits:
        print(f"{argv[1]}:{line_no}: web-only vocab [{label}]: {frag!r}")
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
