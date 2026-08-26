# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Project Facts & Environment
- **Local Dev OS**: Windows 10 with PowerShell.
- **Git binary**: Not in system `$PATH` — always invoke `& "C:\Program Files\Git\bin\git.exe"`.
- **OpenSSH binaries**: Located at `C:\Windows\System32\OpenSSH\ssh.exe` and `scp.exe`.
- **Git commit identity**: Must be `Keith Hinds <kman83@hotmail.co.uk>` to ensure GitHub commits are linked to `khinds-dev` contribution calendar.
- **PowerShell syntax**: Avoid `&&` (fails in PS 5.1) — use `; if ($?) { ... }`. Do not use `<` redirection.

## Architecture & Conventions
- **Routing**: Static vanilla HTML/CSS/JS served via `nginx:alpine`. Clean URLs are implemented via subdirectories containing `index.html` (e.g. `portfolio/index.html` served at `/portfolio`). Never use `.html` extensions in `href`.
- **New pages**: Whenever adding `<page-name>/index.html`, explicitly add a `COPY <page-name>/index.html ...` line to [`Dockerfile`](Dockerfile:14).
- **GitHub Activity Widget**: Uses `https://ghchart.rshah.org/khinds-dev` with client-side cache-busting timestamp `?ts=` in [`index.html`](index.html:457). Requires "Private contributions" enabled on GitHub if repository is private.

## Deployment to Synology NAS (`100.123.139.84`)
When asked to **deploy**, **push**, or **make changes live**:
1. Copy static files & directories via legacy SCP (`-O` is required, `-P 83`):
   ```powershell
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 index.html profile.jpg nginx.conf Dockerfile docker-compose.yml keithhinds@100.123.139.84:/volume1/docker/keith-website/
   & "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "mkdir -p /volume1/docker/keith-website/portfolio /volume1/docker/keith-website/contact"
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 portfolio/index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/portfolio/index.html
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 contact/index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/contact/index.html
   ```
2. Rebuild & restart Docker container (requires passwordless sudo rule on Synology and full docker path):
   ```powershell
   & "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "cd /volume1/docker/keith-website && sudo /var/packages/ContainerManager/target/usr/bin/docker compose up -d --build"
   ```
3. Commit and push to GitHub:
   ```powershell
   & "C:\Program Files\Git\bin\git.exe" add -A ; if ($?) { & "C:\Program Files\Git\bin\git.exe" commit -m "..." } ; if ($?) { & "C:\Program Files\Git\bin\git.exe" push origin main }
   ```

## Cloudflare Tunnel Gotchas
- Token-based tunnel (`keith-cloudflared` container, ID `a7eb6006-0c73-413a-aee0-ed634e6e1f04`).
- Internal routing must target `keith-website:80` (Docker service name), **NOT** `localhost:8080`.
