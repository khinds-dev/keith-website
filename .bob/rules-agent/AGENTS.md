# Agent Mode Guidance

- **Git Execution**: `git` is NOT on `$PATH`. Run commands using `& "C:\Program Files\Git\bin\git.exe"`.
- **Commit Identity**: Must be `Keith Hinds <kman83@hotmail.co.uk>`. Do not change or use IBM work email.
- **PowerShell Scripting**: Do not use `&&` or `<` redirection in commands. Use `; if ($?) { ... }`.
- **New Page Creation**: When creating `<page>/index.html`, add a corresponding `COPY <page>/index.html /usr/share/nginx/html/<page>/index.html` line to [`Dockerfile`](../../Dockerfile:14).
- **Navigation Links**: Use clean root-relative links (e.g. `href="/portfolio"`). Never link with `.html` extensions.
- **Deployment**: Synology SSH runs on port 83 and requires legacy SCP mode (`-O -P 83`). Docker commands on Synology must use `sudo /var/packages/ContainerManager/target/usr/bin/docker`.
