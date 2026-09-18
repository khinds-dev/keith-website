# AGENTS.md

This file provides guidance to agents when working with code in this repository.

---

## ⛔ DEPLOYMENT HOLD — READ THIS FIRST

**Never deploy to the Synology NAS unless explicitly told to do so in that message.**

The user works across multiple machines. Only one of them has Tailscale access to the Synology (100.123.139.84). Running `scp` or `ssh` deployment commands from the wrong machine will fail or hang.

**This rule overrides everything else in this file, including the Deployment Order section below.**

The correct sequence is always:
1. Commit and push to GitHub — always safe to do.
2. **Stop. Do not SCP, do not SSH, do not run Docker commands.**
3. Wait for the user to explicitly say something like "deploy now", "go ahead and deploy", or "SCP to Synology".

No exceptions. Even if the work is complete, even if previous instructions say "commit and deploy", even if this is the last step of a phase — **stop after the push and wait.**

---

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

## Pace & Stopping Rule
- **Complete one phase or named section at a time, then stop.** After finishing a section, summarise what was done and wait for the user to say "continue" or start a fresh task. Never automatically start the next phase or section.
- **Double-check completed work before closing a phase.** At the end of every phase or named section, run a verification pass covering: (1) all new/modified files exist and have correct content; (2) every HTML page has `shared.css`, `nav.js`, correct nav links, and correct `class="active"` state; (3) the `Dockerfile` has a `COPY` line for every new page; (4) `sitemap.xml` includes every public page; (5) no broken internal links (no old nav hrefs like `/portfolio` or `/repos` remaining in nav blocks); (6) any cross-file consistency requirements (e.g. footer copyright, meta tags, canonical URLs). Fix any issues found before committing the phase.

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

---

## Website Redesign — Progress Tracker

This section tracks the full redesign brief agreed in the planning session. Update the status marker for each task as work is completed. A new agent session must read this section first and continue from the first incomplete task.

**Status key:** `[ ]` not started · `[-]` in progress · `[x]` done

---

### Phase 1 — Foundation (shared assets, no visible behaviour change)

- [x] Extract shared CSS into `css/shared.css` — design tokens (CSS custom properties), reset, navbar, hamburger, footer, base layout; update all existing pages to link to it
- [x] Extract shared hamburger/nav JS into `js/nav.js`; reference it from all pages and remove the copy-pasted inline script
- [x] Add global SEO basics to all existing pages: `<meta name="description">`, canonical `<link>`, Open Graph tags (`og:title`, `og:description`, `og:url`, `og:image`)
- [x] Create custom 404 page (`404.html` served by nginx `error_page 404`); update `nginx.conf`; copy in `Dockerfile`; match site visual style
- [x] Add `robots.txt` and `sitemap.xml` to the nginx-served root; update `nginx.conf` COPY and `Dockerfile`

---

### Phase 2 — New pages (additive only, no existing pages broken)

- [x] New nav: change links from [Home, Portfolio, Repos, Blog, Contact] → [Home, About, Work, Writing, Contact] across **all** page files; keep `/portfolio` and `/repos` URLs intact but update nav labels and active states; "Repos" becomes "GitHub" in the display label on the repos page header
- [x] Create `/about` (`about/index.html`) — personal background, career (electronic engineering → IBM software), how I work, interests outside tech; add `COPY` to `Dockerfile` and `nginx.conf` try_files support
- [x] Create `/work` (`work/index.html`) — professional experience timeline, IBM roles, technical areas, featured projects list; add `COPY` to `Dockerfile`
- [x] Create `/work/this-website` (`work/this-website/index.html`) — architecture write-up, full stack, infrastructure SVG diagram, deployment model; add `COPY` to `Dockerfile`
- [x] Create `/now` (`now/index.html`) — what Keith is currently building, learning, exploring, and doing outside work; "Last updated: [date]" at bottom; add `COPY` to `Dockerfile`
- [x] Create `/interests` (`interests/index.html`) — overview cards for aviation, football, travel, dogs, technology, history, film/sci-fi; personal tone; add `COPY` to `Dockerfile`

---

### Phase 3 — Existing page improvements

- [x] **Homepage** (`index.html`): tighten hero (shorter bio), add condensed Now section linking to `/now`, show latest 3 posts dynamically from API, show 2–3 featured projects, add beyond-code interests teaser; remove the skills matrix and full timeline (those live on `/about` and `/work`)
- [x] **Blog listing** (`blog/index.html`): add excerpt display on tiles (derive from first ~160 chars of body client-side); add reading time estimate; update nav to show "Writing" as active label
- [x] **Blog post** (`blog/post/index.html`): fix Markdown renderer — list wrapping bug (multiple `<li>` items each getting their own `<ul>`), ordered list support, heading IDs, correct fenced code language stripping; add dynamic Open Graph meta tags after post loads; update `<title>` format
- [x] **Repos page** (`repos/index.html`): improve empty/error/loading states; add a brief personal intro line; clean up mobile layout; update page header to say "GitHub" not "GitHub Repos"
- [x] **Contact page** (`contact/index.html`): update intro copy to match brief tone; add per-field inline validation error messages; prevent double-submit on fast re-click

---

### Phase 4 — CSS cleanup, accessibility, API improvements

- [x] Replace all remaining per-page duplicate CSS with references to `css/shared.css`; verify visual consistency across every page after extraction
- [x] Accessibility audit: fix heading hierarchy on every page; add missing `aria-label`s; ensure keyboard focus styles are visible; check colour contrast of muted text (`#57606a` on `#ffffff`); add meaningful `alt` text to all images
- [x] Responsive audit: fix layouts on mobile (≤480px) and tablet (≤768px) for homepage hero, work/experience timeline, blog post body, repos filter bar
- [x] **API** (`api/server.js`): add `excerpt` and `read_time` fields to `GET /api/posts` response — derived server-side from `body`, not stored; backward compatible
- [x] **API** (`api/server.js`): add `POST /api/contact` endpoint — validate name/email/message, store in a new `contacts` table (or forward via email if SMTP env vars are set); remove sole reliance on Formspree

---

### Phase 5 — Content & SEO

- [ ] Write genuine content for `/about` — career story, degree while working full-time, IBM journey, problem-solving approach, outside interests
- [ ] Write genuine content for `/now` — current work focus, personal projects in progress, learning areas, outside-work activities; include last updated date
- [ ] Write 2–3 project entries for `/work` beyond the website itself (pick from GitHub repos); write the `/work/this-website` architecture page properly
- [ ] Generate `sitemap.xml` listing all public pages with accurate `lastmod` dates; add JSON-LD `Person` structured data to homepage
- [ ] Write a short interests overview for `/interests` — genuine, personal, no filler

---

### Phase 6 — Final review & deployment

- [ ] Full cross-page visual consistency check — typography, spacing, nav active states, footer, responsive behaviour
- [ ] Verify all internal links work on every page (including new pages)
- [ ] Commit, push to GitHub, SCP all changed files to Synology, rebuild Docker containers
- [ ] Post-deploy verification: `curl` each route on the Synology to confirm 200s; check 404 page works; check blog API still returns posts

---

### Rollback point

The commit immediately before the redesign began is tagged **`pre-redesign`** (commit `f52dc58`).

To revert the entire site to that state:
```bash
git checkout pre-redesign
```

To revert and create a new branch from it:
```bash
git checkout -b rollback-branch pre-redesign
```

To hard-reset `main` back to that point (destructive — discards all redesign commits):
```bash
git checkout main
git reset --hard pre-redesign
git push --force origin main
```

The tag is pushed to GitHub (`origin/pre-redesign`) so it survives any local reset.

---

### Decisions & context (read before starting work)

- **Do not convert to React, Next.js, Vue, Astro or any framework.** Plain HTML/CSS/JS + Node/Express is the correct stack for this project.
- **Navigation after Phase 2:** Home · About · Work · Writing · Contact. GitHub is a sub-item or accessible via the Repos page; it does not need a primary nav slot.
- **`/blog` URL stays intact** (blog/index.html, blog/post/index.html); only the nav label and page heading change to "Writing". No redirects needed.
- **`/portfolio` stays intact** — the nav item is removed from primary nav (it folds into `/work`) but the URL must keep returning the existing page (no 404).
- **Markdown renderer stays custom** (no new npm dependencies) but must be fixed for the known bugs.
- **Contact form:** keep Formspree as primary for now; the API endpoint is a Phase 4 enhancement only.
- **Cloudflare tunnel token** is already committed in `docker-compose.yml` — do not rotate or redact it in code changes.
- **Profile photo** is `profile.jpg` in the root — reference as `/profile.jpg` from all pages.
