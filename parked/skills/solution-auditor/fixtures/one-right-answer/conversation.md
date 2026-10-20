## Turn 1 - user
Ops wants the timeout on the rates API call configurable per environment instead of hard-coded. Let's brainstorm it.

## Turn 2 - assistant
Is the value the same for every call site, or does it differ per endpoint?

## Turn 3 - user
Same everywhere. There is only the one call, in src/client.py.

## Current direction (main thread, at step 4)
Add `rates_timeout_s: float = 10` to `Settings` and read it in `fetch_rates`.
