# Plan: add a `subtract` helper to calc

## Goal

Provide subtraction alongside the existing `add`, for callers that need it.

## Affected files

- src/calc.py
- tests/test_calc.py

## Steps

1. Add a new function `def subtract(a, b): return a - b` to `src/calc.py`.
   This is a brand-new function with no existing callers.
2. Add `test_subtract` to `tests/test_calc.py` asserting `subtract(5, 3) == 2`.
