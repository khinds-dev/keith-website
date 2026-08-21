# AGENT.md

This file documents everything an AI agent needs to know to work effectively in this repository.

---

## Project overview

A personal landing page for Keith, served via Nginx inside a Docker container on a Synology NAS.

---

## Repository structure

```
index.html         — the landing page (placeholder content, ready to be personalised)
nginx.conf         — Nginx server config (serves static files on port 80 inside the container)
Dockerfile         — builds an nginx:alpine image with the site baked in
docker-compose.yml — runs the container, mapping port 8080 on the Synology to port 80 in the container
README.md          — deployment instructions
AGENT.md           — this file
```

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
| Site URL (local)| `http://100.123.139.84:8080` |
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
| Public hostname  | configured in Cloudflare Zero Trust dashboard → Networks → Tunnels → synology → Public Hostnames |

### Check tunnel logs
```powershell
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "sudo /var/packages/ContainerManager/target/usr/bin/docker logs keith-cloudflared 2>&1 | tail -20"
```

### Manage the tunnel hostname
To add or change the public URL (e.g. point `www.yourdomain.com` at the site):
1. Go to [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → **Networks** → **Tunnels**
2. Click the `synology` tunnel → **Edit** → **Public Hostname**
3. Add/edit: Subdomain + Domain → Service: `http://localhost:8080`

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

| Property   | Value                                      |
|------------|--------------------------------------------|
| Remote     | `github.com:khinds-dev/keith-website.git` |
| Branch     | `main`                                     |
| Git binary | `C:\Program Files\Git\bin\git.exe`        |

### Push changes
```powershell
& "C:\Program Files\Git\bin\git.exe" add -A
& "C:\Program Files\Git\bin\git.exe" commit -m "your message"
& "C:\Program Files\Git\bin\git.exe" push origin main
```
> `git` is not on the system PATH in the agent shell — always use the full path above.

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
