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
   ```bash
   scp -r . keith@100.123.139.84:/volume1/docker/keith-website/
   ```
   > Adjust the username and destination path to match your Synology setup.

2. **SSH into the Synology**:
   ```bash
   ssh keith@100.123.139.84
   ```

3. **Navigate to the project folder and start the container**:
   ```bash
   cd /volume1/docker/keith-website
   docker compose up -d --build
   ```

4. **Visit the site** in your browser:
   ```
   http://100.123.139.84:8080
   ```

### Updating the site

Edit `index.html` locally, then re-run:
```bash
scp index.html keith@100.123.139.84:/volume1/docker/keith-website/
ssh keith@100.123.139.84 "cd /volume1/docker/keith-website && docker compose up -d --build"
```

### Stopping the container
```bash
docker compose down
```
