## Turn 1 - user
Signup is slow because we send the welcome email inline in the request. I want it async. Emails must not be lost if the app restarts.

## Turn 2 - assistant
Roughly what volume, and how many servers?

## Turn 3 - user
About 200 signups a day. One server.

## Current direction (main thread, at step 4)
n/a - no direction formed yet.
