# AGENTS.md

This file documents everything an AI agent needs to know to work effectively in this repository.

---

## Agent conventions

### "Push to Synology" / "Make my changes live"
When the user says anything like **"push to Synology"**, **"make my changes live"**, **"deploy"**, or equivalent, always perform the full deployment sequence:

1. Check which HTML/asset files exist locally (`*.html`, `profile.jpg`, etc.)
2. Copy **all** site files to the Synology via SCP:
   ```powershell
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 index.html profile.jpg nginx.conf Dockerfile docker-compose.yml keithhinds@100.123.139.84:/volume1/docker/keith-website/
   & "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "mkdir -p /volume1/docker/keith-website/portfolio /volume1/docker/keith-website/contact"
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 portfolio/index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/portfolio/index.html
   & "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 contact/index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/contact/index.html
   ```
3. Rebuild and restart the Docker container:
   ```powershell
   & "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "cd /volume1/docker/keith-website && sudo /var/packages/ContainerManager/target/usr/bin/docker compose up -d --build"
   ```
4. If any new HTML pages were added, ensure they are also listed as `COPY` instructions in the `Dockerfile` before deploying.
5. Commit and push any local changes (including `Dockerfile` if modified) to GitHub using the full git path.

---

## Project overview

A personal landing page for Keith, served via Nginx inside a Docker container on a Synology NAS.

---

## Repository structure

```
index.html              — the home page
portfolio/index.html    — the Portfolio page (served at /portfolio)
contact/index.html      — the Contact page (served at /contact)
nginx.conf              — Nginx server config (serves static files on port 80 inside the container)
Dockerfile              — builds an nginx:alpine image with the site baked in
docker-compose.yml      — runs the container, mapping port 8080 on the Synology to port 80 in the container
README.md               — deployment instructions
AGENTS.md               — this file
```

### URL / file conventions
- Each page lives in its own subdirectory as `index.html` so Nginx serves it at a clean URL (e.g. `/portfolio`, `/contact`).
- When adding a new page, create `<page-name>/index.html`, add a `COPY` line to the Dockerfile, and add a nav link in all existing pages pointing to `/<page-name>`.
- Never use `.html` extensions in `href` attributes — always use root-relative paths like `/portfolio`.

---

## Synology server

| Property        | Value                  |
|-----------------|------------------------|
| IP address      | `100.123.139.84`       |
| Network         | Tailscale (100.x range) |
| SSH port        | `83`                   |
| SSH user        | `keithhinds`           |
| SSH auth        | Key-based (no password required) — `~/.ssh/id_ed25519` is authorised |
| Docker path     | `/var/packages/ContainerManager/target/usr/bin/docker` |
| Project path    | `/volume1/docker/keith-website/` |
| Site URL (local)  | `http://100.123.139.84:8080`     |
| Site URL (public) | `https://keithhinds.co.uk` (apex) and `https://www.keithhinds.co.uk` (www) |
| Container name  | `keith-website`        |
| Tunnel container| `keith-cloudflared`    |

### Notes on the Synology environment
- SSH is on **port 83**, not the standard 22.
- Docker is installed via the **Container Manager** package, not as a system binary. Always use the full path: `/var/packages/ContainerManager/target/usr/bin/docker`.
- The `keithhinds` user is **not** in a docker group. Docker commands require `sudo`.
- A passwordless sudo rule for docker has been configured at `/etc/sudoers.d/keithhinds-docker`.
- The Docker socket (`/var/run/docker.sock`) is owned by `root:root` — there is no `docker` group on this system.
- The Synology SSH server does **not** support the SFTP subsystem. Use `scp -O` (legacy SCP mode) for file transfers.
- SSH commands issued non-interactively may appear to time out but often succeed — allow sufficient timeout (15–30s minimum).

---

## Cloudflare Tunnel

The site is exposed to the public internet via a Cloudflare Tunnel (`cloudflared`) running as a Docker container alongside the web server.

| Property         | Value |
|------------------|-------|
| Tunnel name      | `synology` |
| Token location   | hardcoded in `docker-compose.yml` under the `cloudflared` service `command:` |
| Container name   | `keith-cloudflared` |
| Tunnel name (dashboard) | `Synology KmanDS220` |
| Public URLs      | `https://keithhinds.co.uk` and `https://www.keithhinds.co.uk` |
| Public hostnames | configured in Cloudflare Zero Trust → Networks → Tunnels & Mesh → Synology KmanDS220 → **Published application routes** |

### Published application routes

Both the apex and www hostnames must have a route saved in the **Published application routes** tab of the tunnel. As of the current setup there are two routes:

| Subdomain | Domain | Service |
|-----------|--------|---------|
| *(blank)* | `keithhinds.co.uk` | `HTTP keith-website:80` |
| `www` | `keithhinds.co.uk` | `HTTP keith-website:80` |

> ⚠️ **Important — token-based tunnel quirk:** Because the tunnel runs via a token (not a config file), routes are managed entirely through the Cloudflare dashboard. The `cloudflared` container has no local `config.yml`. If routes are missing, the tunnel returns 404 for all requests regardless of what DNS records exist.

> ⚠️ **Adding a new route when the DNS record already exists:** Cloudflare will show "A DNS record with this name already exists" and block the route creation. The workaround is:
> 1. Delete the existing DNS record for that hostname in **DNS → Records**
> 2. Immediately switch to **Published application routes** and save the new route
> 3. Cloudflare will auto-recreate the DNS record correctly linked to the tunnel
> 4. If the DNS record is still missing afterwards, add it manually as a `CNAME` with name `@` (for apex) or `www`, target `a7eb6006-0c73-413a-aee0-ed634e6e1f04.cfargotunnel.com`, proxied.

> ⚠️ **Tunnel ID:** `a7eb6006-0c73-413a-aee0-ed634e6e1f04` — encoded in the token in `docker-compose.yml`. The cfargotunnel hostname is `a7eb6006-0c73-413a-aee0-ed634e6e1f04.cfargotunnel.com`.

### Check tunnel logs
```powershell
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "sudo /var/packages/ContainerManager/target/usr/bin/docker logs keith-cloudflared 2>&1 | tail -20"
```

### Manage the tunnel hostname
To add or change the public URL (e.g. point `www.yourdomain.com` at the site):
1. Go to [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → **Networks** → **Tunnels & Mesh**
2. Click the `Synology KmanDS220` tunnel → **Published application routes** tab
3. Add/edit: Subdomain + Domain → Service type: `HTTP` → URL: `keith-website:80`

> ⚠️ Do NOT use `localhost:8080` — inside Docker, `localhost` refers to the cloudflared container itself, not the web container. Use the Docker service name `keith-website:80` instead so cloudflared routes to the correct container over the shared Docker network.

---

## SSH & file transfer commands

### Test connectivity
```powershell
& "C:\Windows\System32\OpenSSH\ssh.exe" -o StrictHostKeyChecking=no -p 83 keithhinds@100.123.139.84 "echo connected"
```

### Copy files to Synology
```powershell
& "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 index.html nginx.conf Dockerfile docker-compose.yml keithhinds@100.123.139.84:/volume1/docker/keith-website/
```
> The `-O` flag is required — the Synology SSH server rejects the SFTP-based SCP protocol.

### Run a remote command
```powershell
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "<command>"
```

---

## Deployment

### First-time deploy
```powershell
# 1. Copy files
& "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 index.html nginx.conf Dockerfile docker-compose.yml keithhinds@100.123.139.84:/volume1/docker/keith-website/

# 2. Build and start
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "cd /volume1/docker/keith-website && sudo /var/packages/ContainerManager/target/usr/bin/docker compose up -d --build"
```

### Update the site (after editing index.html)
```powershell
& "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "cd /volume1/docker/keith-website && sudo /var/packages/ContainerManager/target/usr/bin/docker compose up -d --build"
```

### Stop the container
```powershell
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "cd /volume1/docker/keith-website && sudo /var/packages/ContainerManager/target/usr/bin/docker compose down"
```

### Check container status
```powershell
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "sudo /var/packages/ContainerManager/target/usr/bin/docker ps"
```

### Verify site is responding
```powershell
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080"
# Expected: 200
```

---

## Git / GitHub

| Property       | Value                                      |
|----------------|--------------------------------------------|
| Remote         | `github.com:khinds-dev/keith-website.git` |
| Branch         | `main`                                     |
| Git binary     | `C:\Program Files\Git\bin\git.exe`        |
| Configured user| `Keith Hinds`                              |
| Configured email| `kman83@hotmail.co.uk`                    |

### Push changes
```powershell
& "C:\Program Files\Git\bin\git.exe" add -A
& "C:\Program Files\Git\bin\git.exe" commit -m "your message"
& "C:\Program Files\Git\bin\git.exe" push origin main
```
> `git` is not on the system PATH in the agent shell — always use the full path above.

### Commit author & GitHub contributions
- The primary GitHub account for this project is `khinds-dev`.
- All commits in this repo must use `Keith Hinds <kman83@hotmail.co.uk>` so GitHub links them to the `khinds-dev` profile contribution calendar.
- If the repository is private, ensure **"Private contributions"** is enabled in the contribution settings on [github.com/khinds-dev](https://github.com/khinds-dev) for contributions to show publicly.

---

## GitHub Activity Widget

The landing page features a GitHub activity contribution widget:
- **Service**: `https://ghchart.rshah.org/khinds-dev` (renders GitHub-style SVG heatmap with multi-tier green colors `#eeeeee`, `#d6e685`, `#8cc665`, `#44a340`, `#1e6823`).
- **Cache-busting**: [`index.html`](index.html:454) includes a client-side script running on load that appends `?ts=` timestamp to the image `src` to bypass browser caching.
- **Backend caching**: The external chart generator (`ghchart.rshah.org`) caches responses upstream on its servers for several hours before re-scraping GitHub.

---

## Windows environment notes

- The agent shell is **PowerShell** on Windows 10.
- `git` is not on `$PATH` — use `C:\Program Files\Git\bin\git.exe`.
- `ssh` and `scp` are available at `C:\Windows\System32\OpenSSH\`.
- Use `; if ($?) { ... }` instead of `&&` for sequential dependent commands in PowerShell 5.1.
- SSH commands to the Synology commonly time out in the tool runner even when they succeed — check for expected output rather than relying solely on exit code.

---

## Content TODOs (for the site owner)

The following placeholders in [`index.html`](index.html) need to be filled in with real content:

- `h1` tag — replace "Keith" with full name if desired
- Bio paragraph — replace placeholder bio text
- GitHub link — replace `YOUR_USERNAME` with actual GitHub username
- LinkedIn link — replace `YOUR_PROFILE` with actual LinkedIn profile slug
- Avatar — replace the `👤` emoji `div` with a real photo (`<img>` tag) if desired
