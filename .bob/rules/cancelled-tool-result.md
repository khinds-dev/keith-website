# Rule: Treat CANCELED Tool Results as Failures

When any tool call returns a `CANCELED` status, empty stdout, or empty stderr with no other output:

1. **Do not treat the task as complete.** A cancelled result means the command did not finish — you have no confirmation of success.
2. **State it clearly and immediately.** Tell the user: "That command was cancelled/timed out — I can't confirm the result."
3. **Do not report subsequent steps as successful** based on prior steps if the verification step was cancelled.
4. **Retry with an appropriate explicit `timeout_seconds`** if the command is expected to be slow (e.g. SSH to Synology, Docker build verification). Do not rely on the default 300s timeout for short verification commands.

## Applies to
- SSH commands to the Synology NAS
- Docker build/restart verification
- Any `curl` or health-check command run remotely
- Any file operation tool that returns no output unexpectedly
