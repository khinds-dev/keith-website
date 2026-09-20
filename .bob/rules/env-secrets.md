# Rule: Reading `.env` Secrets in Deploy Commands

## Context

This project stores machine-local secrets (Cloudflare API token, Zone ID) in a `.env` file at the workspace root. The file is gitignored and must never be committed.

## Constraint

Bob's built-in file tools (`read_file`, `apply_diff`, etc.) **cannot read `.env`** — access is blocked because it matches the gitignore pattern. Do not attempt to use file tools on `.env`.

## How to Read `.env` Values

Use PowerShell `Get-Content` with `Select-String` to extract individual values:

```powershell
$token = (Get-Content .env | Select-String '^CLOUDFLARE_TOKEN=').ToString().Split('=',2)[1]
$zone  = (Get-Content .env | Select-String '^CLOUDFLARE_ZONE_ID=').ToString().Split('=',2)[1]
```

Then use `$token` and `$zone` directly in subsequent commands (e.g. `Invoke-RestMethod`).

## If `.env` Is Missing or Values Are Blank

Warn the user immediately — do not skip or silently omit the step that requires the credential. The correct message is:

> `.env` not found or `CLOUDFLARE_TOKEN`/`CLOUDFLARE_ZONE_ID` is missing. Please populate `.env` before deploying — see the Deployment Order section in `AGENTS.md`.

## Variables Currently Stored

| Key | Purpose |
|-----|---------|
| `CLOUDFLARE_TOKEN` | Cloudflare API token — Zone Cache Purge permission on `keithhinds.co.uk` |
| `CLOUDFLARE_ZONE_ID` | Cloudflare Zone ID for `keithhinds.co.uk` |
