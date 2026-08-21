# keith-website

A simple personal landing page, served via Nginx in Docker on a Synology NAS.

## Project structure

```
index.html        — the landing page (edit this with your real content)
nginx.conf        — Nginx server configuration
Dockerfile        — builds the Nginx container image
docker-compose.yml — runs the container on the Synology
```

## Deploying to your Synology (100.123.139.84)

### Prerequisites
- Docker and Docker Compose installed on the Synology (via **Container Manager** or the legacy **Docker** package).
- SSH access enabled on the Synology.

### Steps

1. **Copy the files to your Synology** (from your local machine):
   ```powershell
   scp -O -P 83 index.html nginx.conf Dockerfile docker-compose.yml keithhinds@100.123.139.84:/volume1/docker/keith-website/
   ```

2. **SSH into the Synology**:
   ```bash
   ssh keithhinds@100.123.139.84 -p 83
   ```

3. **Navigate to the project folder and start the container**:
   ```bash
   cd /volume1/docker/keith-website
   sudo /var/packages/ContainerManager/target/usr/bin/docker compose up -d --build
   ```

4. **Visit the site** in your browser:
   ```
   http://100.123.139.84:8080
   ```

### Cloudflare Tunnel (public access)

The site is publicly accessible at `https://www.keithhinds.co.uk` via a Cloudflare Tunnel.

- Tunnel name: `Synology KmanDS220` in [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → **Networks** → **Tunnels & Mesh**
- Published application route: subdomain `www`, service `HTTP`, URL `keith-website:80`
- > ⚠️ Use `keith-website:80` (Docker service name) — NOT `localhost:8080`

---

### Updating the site

Edit `index.html` locally, then re-run:
```powershell
scp -O -P 83 index.html keithhinds@100.123.139.84:/volume1/docker/keith-website/
ssh -p 83 keithhinds@100.123.139.84 "cd /volume1/docker/keith-website && sudo /var/packages/ContainerManager/target/usr/bin/docker compose up -d --build"
```

### Stopping the container
```bash
sudo /var/packages/ContainerManager/target/usr/bin/docker compose down
```
