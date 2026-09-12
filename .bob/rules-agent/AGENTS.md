# Agent Mode Guidance

- **Git Execution**: `git` is NOT on `$PATH`. Run commands using `& "C:\Program Files\Git\bin\git.exe"`.
- **Commit Identity**: Must be `Keith Hinds <kman83@hotmail.co.uk>`. Do not change or use IBM work email.
- **PowerShell Scripting**: Do not use `&&` or `<` redirection in commands. Use `; if ($?) { ... }`.
- **New Page Creation**: When creating `<page>/index.html`, add a corresponding `COPY <page>/index.html /usr/share/nginx/html/<page>/index.html` line to [`Dockerfile`](../../Dockerfile:14).
- **Navigation Links**: Use clean root-relative links (e.g. `href="/portfolio"`). Never link with `.html` extensions.
- **Deployment**: Synology SSH runs on port 83 and requires legacy SCP mode (`-O -P 83`). Docker commands on Synology must use `sudo /var/packages/ContainerManager/target/usr/bin/docker`.
- **Deployment Order**: Always **commit and push to GitHub first**, then SCP files to Synology, then rebuild Docker. Never deploy before committing.
- **Navigation Consistency**: All five nav links (Home, Portfolio, Repos, Blog, Contact) must appear in the hamburger menu on every page. `/admin` is excluded from public nav. When changing any nav, update all page files.
- **Blog API**: Posts use SQLite at `/data/posts.db`. Always include `body` in admin `SELECT` queries on posts — omitting it causes `undefined` in the editor. Uploaded images live in `/data/images/` and are served via `GET /api/images/:filename`.
- **Browser Caching**: After deploy, if the user can't see changes, verify with `curl -sL http://localhost:8080/<path>/` on the Synology before assuming a cache issue. If confirmed live, advise `Ctrl+Shift+R`.
