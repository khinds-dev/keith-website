# keith-website

Personal website and blog for Keith Hinds, served via Nginx + Node.js in Docker on a Synology NAS, publicly accessible via a Cloudflare Tunnel.

**Live site:** [https://www.keithhinds.co.uk](https://www.keithhinds.co.uk)

---

## Project structure

```
index.html               — Home / landing page
portfolio/index.html     — Portfolio page
contact/index.html       — Contact page
repos/index.html         — GitHub repositories page
blog/index.html          — Public blog post listing
blog/post/index.html     — Single blog post view
admin/index.html         — Password-protected blog admin editor

api/
  server.js              — Node.js/Express REST API (posts + image uploads)
  package.json           — API dependencies (Express, better-sqlite3, multer, jsonwebtoken)
  Dockerfile             — Node 20 Alpine image for the API container

nginx.conf               — Nginx config (static files + /api/* proxy to keith-api:3000)
Dockerfile               — Nginx Alpine image for the web container
docker-compose.yml       — Defines all three services: keith-website, keith-api, keith-cloudflared
```

---

## Stack

| Layer | Technology |
|---|---|
| Web server | nginx:alpine |
| API | Node.js 20 + Express |
| Database | SQLite (via better-sqlite3) |
| Image uploads | multer — stored in Docker volume |
| Auth | JWT (jsonwebtoken) — 8h session tokens |
| Deployment | Docker Compose on Synology NAS |
| Public access | Cloudflare Tunnel |

---

## Services

| Container | Purpose | Internal port |
|---|---|---|
| `keith-website` | Serves static HTML via nginx | 80 (mapped to host 8080) |
| `keith-api` | REST API for blog posts & uploads | 3000 (internal only) |
| `keith-cloudflared` | Cloudflare Tunnel to `keith-website:80` | — |

nginx proxies all `/api/*` requests to `keith-api:3000`. Everything else is served as static files.

---

## Blog API

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/login` | — | Exchange password for JWT token |
| `GET` | `/api/posts` | — | List published posts |
| `GET` | `/api/posts/:slug` | — | Get a single published post |
| `GET` | `/api/posts/all` | ✓ | List all posts (incl. drafts) |
| `POST` | `/api/posts` | ✓ | Create a post |
| `PUT` | `/api/posts/:id` | ✓ | Update a post |
| `DELETE` | `/api/posts/:id` | ✓ | Delete a post |
| `POST` | `/api/posts/:id/image` | ✓ | Upload a cover image |
| `DELETE` | `/api/posts/:id/image` | ✓ | Remove a cover image |
| `GET` | `/api/images/:filename` | — | Serve an uploaded image |

Post bodies support Markdown (headings, bold, italic, code blocks, lists, blockquotes, links).

---

## Environment variables

Set these in `/volume1/docker/keith-website/.env` on the Synology (never commit this file):

```
ADMIN_PASS=your-admin-password
JWT_SECRET=long-random-string-min-40-chars
```

| Variable | Default | Description |
|---|---|---|
| `ADMIN_PASS` | `changeme` | Password for `/admin` login |
| `JWT_SECRET` | `changeme-secret` | Secret used to sign JWT tokens — use `openssl rand -base64 48` to generate |
| `DB_PATH` | `/data/posts.db` | SQLite database file path |
| `IMAGES_DIR` | `/data/images` | Directory for uploaded cover images |
| `PORT` | `3000` | API listen port |

---

## Deploying to Synology (`100.123.139.84`)

### Prerequisites
- Docker / Container Manager installed on the Synology
- SSH access enabled (port 83)
- `.env` file created at `/volume1/docker/keith-website/.env` on the Synology

### Full deploy (first time or after structural changes)

**1. Copy all files:**
```powershell
& "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 -r api blog admin keithhinds@100.123.139.84:/volume1/docker/keith-website/
& "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 index.html profile.jpg nginx.conf Dockerfile docker-compose.yml keithhinds@100.123.139.84:/volume1/docker/keith-website/
& "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 portfolio/index.html contact/index.html repos/index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/
```

**2. Rebuild and restart:**
```powershell
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "cd /volume1/docker/keith-website && sudo /var/packages/ContainerManager/target/usr/bin/docker compose up -d --build"
```

### Updating a single file

```powershell
& "C:\Windows\System32\OpenSSH\scp.exe" -O -P 83 <file> keithhinds@100.123.139.84:/volume1/docker/keith-website/<file>
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "cd /volume1/docker/keith-website && sudo /var/packages/ContainerManager/target/usr/bin/docker compose up -d --build"
```

### Stopping the containers
```powershell
& "C:\Windows\System32\OpenSSH\ssh.exe" -p 83 keithhinds@100.123.139.84 "cd /volume1/docker/keith-website && sudo /var/packages/ContainerManager/target/usr/bin/docker compose down"
```

---

## Cloudflare Tunnel

- **Public URL:** `https://www.keithhinds.co.uk`
- **Tunnel name:** `Synology KmanDS220` — managed at [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → Networks → Tunnels & Mesh
- **Route:** subdomain `www`, service `HTTP`, URL `keith-website:80`
- ⚠️ Must use `keith-website:80` (Docker service name) — **not** `localhost:8080`

---

## Local development

The site has no build step. Open any `.html` file directly in a browser for static page edits.

For API development, install dependencies and run the server locally:

```bash
cd api
npm install
ADMIN_PASS=test JWT_SECRET=test-secret DB_PATH=./posts.db IMAGES_DIR=./images node server.js
```

API will be available at `http://localhost:3000`.
