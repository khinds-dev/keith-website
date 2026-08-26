# Plan Mode Guidance

- **Architecture**: Single Docker stack consisting of `web` (`nginx:alpine` serving static assets) and `cloudflared` (`cloudflare/cloudflared:latest` tunnel connector).
- **Service-to-Service Networking**: Tunnel routes traffic directly to `keith-website:80` inside the Docker bridge network.
- **Routing Structure**: Subdirectory clean routing (`/<name>` maps to `/<name>/index.html` via Nginx `try_files $uri $uri/ $uri/index.html =404`).
- **Deployment Constraints**: Synology NAS uses custom Container Manager path and passwordless sudo config for Docker; non-interactive SSH commands run over Tailscale.
