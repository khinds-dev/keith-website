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
- **Services**: The stack has two containers — `keith-website` (nginx, static HTML) and `keith-api` (Node.js/Express, port 3000). nginx proxies all `/api/*` requests to `keith-api:3000`. A third container `keith-cloudflared` handles the Cloudflare tunnel.
- **Blog API**: Posts are stored in a SQLite DB at `/data/posts.db` (Docker volume `blog_data`). Uploaded images are stored at `/data/images/` on the same volume and served via `GET /api/images/:filename`. Always include `body` in any admin `SELECT` query on posts — omitting it causes `undefined` to appear in the editor textarea.

## Navigation
- Every page (Home, Portfolio, Repos, Blog, Contact) must include all five nav links in the hamburger menu, with the current page marked `class="active"`.
- The `/admin` page is intentionally excluded from public navigation.
- When adding or editing nav menus, update **all** page files to keep them consistent.

## Git Workflow Rules
- **Always `git pull` before making any changes.** Run `git pull origin main` at the start of every session and before starting any new task. This prevents merge conflicts caused by external commits.
- **Never use `git checkout --theirs` or `git checkout --ours` to resolve merge conflicts** — these silently discard one side's changes entirely. Always inspect the conflict manually, keep both sides' intended changes, then `git add` and continue.
- **Rebase conflicts during `git pull --rebase`**: if a conflict occurs, read the conflicted file carefully, merge the changes by hand, then `git add <file> && GIT_EDITOR=true git rebase --continue`.

## Deployment Order
**Always follow this order — pull first, commit, then deploy:**
1. **Pull latest changes before starting any work:**
   ```bash
   git pull origin main
   ```
2. **Commit and push to GitHub first:**
   ```powershell
   & "C:\Program Files\Git\bin\git.exe" add -A ; if ($?) { & "C:\Program Files\Git\bin\git.exe" commit -m "..." } ; if ($?) { & "C:\Program Files\Git\bin\git.exe" push origin main }
   ```
3. **Copy changed files to Synology** via legacy SCP (`-O` is required, `-P 83`). Copy only the files that changed. Common files:
   ```powershell
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 index.html profile.jpg nginx.conf Dockerfile docker-compose.yml keithhinds@100.123.139.84:/volume1/docker/keith-website/
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 portfolio/index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/portfolio/index.html
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 contact/index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/contact/index.html
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 repos/index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/repos/index.html
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 blog/index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/blog/index.html
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 blog/post/index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/blog/post/index.html
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 admin/index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/admin/index.html
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 api/server.js api/package.json keithhinds@100.123.139.84:/volume1/docker/keith-website/api/
   ```
4. **Create any new remote directories** before copying into them:
   ```powershell
   & "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "mkdir -p /volume1/docker/keith-website/<new-dir>"
   ```
5. **Rebuild & restart Docker containers** (requires passwordless sudo rule on Synology):
   ```powershell
   & "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "cd /volume1/docker/keith-website && sudo /var/packages/ContainerManager/target/usr/bin/docker compose up -d --build"
   ```

## Browser Caching
After deploying, changes may not be visible due to browser caching. Advise the user to hard refresh (`Ctrl+Shift+R`) or open an incognito window. If content is confirmed present via `curl` on the server but not visible in browser, it is always a cache issue.

To verify content is actually live before concluding the user has a cache issue:
```powershell
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "curl -sL http://localhost:8080/<path>/ | head -10"
```

## Cloudflare Tunnel Gotchas
- Token-based tunnel (`keith-cloudflared` container, ID `a7eb6006-0c73-413a-aee0-ed634e6e1f04`).
- Internal routing must target `keith-website:80` (Docker service name), **NOT** `localhost:8080`.
