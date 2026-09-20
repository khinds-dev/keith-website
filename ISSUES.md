# ISSUES.md — keithhinds.co.uk

> Tracking document for outstanding fixes, security vulnerabilities, and completed post-deployment tasks.
> Maintained in version control. Update status markers as work is completed.

---

## Status Summary

| Status | Count |
|--------|-------|
| ✅ Closed | 3 |
| 🔴 Open — High | 2 |
| 🟡 Open — Medium | 4 |
| 🟢 Open — Low | 2 |
| **Total** | **11** |

---

## Completed Items

Historical record of resolved issues. Do not remove entries — update the checkbox and add a resolution note.

- [x] **`www` → non-`www` 301 redirect** — Cloudflare redirect rule configured. Permanent (301), HTTPS preserved, paths and query strings forwarded correctly. All four entry points (`http://www`, `https://www`, `http://` bare, `https://` bare) resolve to `https://keithhinds.co.uk/`.
- [x] **"Always Use HTTPS" enabled** — Configured in Cloudflare SSL/TLS → Edge Certificates. HTTP requests are upgraded to HTTPS at the edge before reaching the origin.
- [x] **Core entry points verified** — All four protocol/subdomain combinations resolve correctly to `https://keithhinds.co.uk/` with no loops or errors confirmed via `curl`.

---

## Outstanding Issues

---

### SEC-01: Missing Strict-Transport-Security (HSTS)

- [ ] **Resolved**

**Severity:** 🔴 High
**Area:** Security — HTTP Headers

**Description:**
The `Strict-Transport-Security` (HSTS) response header is not present on any response from `keithhinds.co.uk`. Confirmed via `curl -sI https://keithhinds.co.uk/` — no `strict-transport-security` header is returned. Cloudflare does not add HSTS automatically; it must be explicitly enabled.

**Impact:**
Without HSTS, browsers do not know to enforce HTTPS for future visits. A user who previously visited over HTTP is not protected against SSL-stripping attacks or man-in-the-middle (MITM) interception on their next visit until the browser has received the header at least once. First-time visitors connecting over HTTP are not protected at all until "Always Use HTTPS" upgrades the request at the edge.

**Remediation Steps:**

Option A — Cloudflare (recommended, since Cloudflare handles TLS termination):

1. Log in to the Cloudflare dashboard.
2. Navigate to **SSL/TLS → Edge Certificates**.
3. Scroll to **HTTP Strict Transport Security (HSTS)**.
4. Click **Enable HSTS**.
5. Set the following values:
   - **Status:** Enabled
   - **Max Age:** `31536000` (12 months)
   - **Include Subdomains:** Enabled
   - **Preload:** Enabled (only after confirming the site will remain HTTPS permanently)
6. Save. Cloudflare will inject the header on all HTTPS responses.

Option B — nginx (alternative, adds the header at the origin level):

Add the following directive inside the `server {}` block in [`nginx.conf`](nginx.conf):

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

> **Note:** Do not enable `preload` unless you are certain the domain will remain HTTPS-only permanently. Removal from the preload list takes months.

---

### SEC-02: Missing X-Frame-Options Header

- [ ] **Resolved**

**Severity:** 🔴 High
**Area:** Security — HTTP Headers

**Description:**
The `X-Frame-Options` response header is absent from all responses. Confirmed via full header inspection — the header is not set in nginx and Cloudflare does not add it automatically.

**Impact:**
Without `X-Frame-Options`, any third-party site can embed `keithhinds.co.uk` pages inside an `<iframe>`. This enables clickjacking attacks, where a malicious page overlays a transparent iframe over a legitimate-looking UI to trick users into clicking elements on the target site without their knowledge.

**Remediation Steps:**

Add the following directive inside the `server {}` block in [`nginx.conf`](nginx.conf):

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
```

- Use `SAMEORIGIN` to allow framing only by pages on the same origin (e.g. your own admin page embedding a preview). This is the standard safe default.
- Use `DENY` instead to prohibit framing entirely if no same-origin framing is required.
- The `always` flag ensures the header is sent on all response codes, including error pages.

After adding, rebuild and redeploy the Docker container:

```bash
docker compose up -d --build
```

Verify with:

```bash
curl -sI https://keithhinds.co.uk/ | grep -i x-frame
```

Expected output: `x-frame-options: SAMEORIGIN`

---

### SEC-03: Missing X-Content-Type-Options Header

- [ ] **Resolved**

**Severity:** 🟡 Medium
**Area:** Security — HTTP Headers

**Description:**
The `X-Content-Type-Options: nosniff` header is not present in any response.

**Impact:**
Without this header, browsers may perform MIME-type sniffing — interpreting a response as a different content type than declared. This can allow an attacker who controls upload paths to serve a file that is executed as a script despite having a non-script MIME type.

**Remediation Steps:**

Add to the `server {}` block in [`nginx.conf`](nginx.conf):

```nginx
add_header X-Content-Type-Options "nosniff" always;
```

---

### SEC-04: Missing Referrer-Policy Header

- [ ] **Resolved**

**Severity:** 🟡 Medium
**Area:** Security — HTTP Headers

**Description:**
No `Referrer-Policy` header is set. Browsers will apply their default policy, which may send the full URL (including path and query string) as the `Referer` header to external sites.

**Impact:**
Query strings in URLs (e.g. `/blog/post?id=3`) may be leaked to third-party origins in the `Referer` header on outbound navigations or resource loads. This can expose user activity to analytics or CDN providers.

**Remediation Steps:**

Add to the `server {}` block in [`nginx.conf`](nginx.conf):

```nginx
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

This sends the full URL as referrer for same-origin requests, but only the origin (no path/query) for cross-origin requests, and nothing at all for downgrades (HTTPS → HTTP).

---

### SEC-05: Missing Permissions-Policy Header

- [ ] **Resolved**

**Severity:** 🟡 Medium
**Area:** Security — HTTP Headers

**Description:**
No `Permissions-Policy` header is present. There is no declared restriction on browser features such as camera, microphone, or geolocation.

**Impact:**
Without a `Permissions-Policy`, any script running on the page (including third-party scripts loaded in the future) could request access to sensitive browser features without restriction. Explicit opt-out is a defence-in-depth measure.

**Remediation Steps:**

Add to the `server {}` block in [`nginx.conf`](nginx.conf):

```nginx
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

Adjust the policy to permit any features that are intentionally used. The above disables all three for all origins.

---

### PERF-01: Nginx Trailing-Slash Redirect Emits HTTP Location (2-Hop Chain)

- [ ] **Resolved**

**Severity:** 🟡 Medium
**Area:** Redirects / Performance

**Description:**
When a clean URL without a trailing slash is requested (e.g. `https://keithhinds.co.uk/about`), nginx issues a `301` redirect with an absolute `Location: http://keithhinds.co.uk/about/` (HTTP, not HTTPS). Cloudflare intercepts this and issues a second `301` upgrading to HTTPS, resulting in two redirect hops before the browser reaches the `200` response.

Observed chain:
```
https://keithhinds.co.uk/about
  → 301 http://keithhinds.co.uk/about/   (nginx — absolute redirect, wrong scheme)
  → 301 https://keithhinds.co.uk/about/  (Cloudflare — HTTPS upgrade)
  → 200 https://keithhinds.co.uk/about/
```

**Impact:**
Two redirect hops on every clean-URL entry point increases page load time and wastes a round trip. It also causes the intermediate HTTP URL to appear in server logs.

**Remediation Steps:**

Add the following directive inside the `server {}` block in [`nginx.conf`](nginx.conf):

```nginx
absolute_redirect off;
```

With `absolute_redirect off`, nginx emits a relative `Location: /about/` instead of an absolute URL. Cloudflare serves this directly as HTTPS, collapsing the chain to a single hop:

```
https://keithhinds.co.uk/about
  → 301 https://keithhinds.co.uk/about/  (single hop)
  → 200
```

This also resolves the canonical tag mismatch (see CANON-01) and sitemap inconsistency (see SEO-01) if Option B is taken for those issues.

---

### CANON-01: Canonical Tag Trailing-Slash Mismatch

- [ ] **Resolved**

**Severity:** 🟢 Low
**Area:** SEO — Canonical Tags

**Description:**
All sub-pages declare a canonical `href` without a trailing slash (e.g. `https://keithhinds.co.uk/about`) but are actually served at the trailing-slash URL (`https://keithhinds.co.uk/about/`) due to nginx's trailing-slash redirect. The canonical URL and the served URL are inconsistent.

Affected pages and their current canonical values:

| Page served at | Canonical declared |
|---|---|
| `/about/` | `https://keithhinds.co.uk/about` |
| `/work/` | `https://keithhinds.co.uk/work` |
| `/blog/` | `https://keithhinds.co.uk/blog` |
| `/now/` | `https://keithhinds.co.uk/now` |
| `/interests/` | `https://keithhinds.co.uk/interests` |
| `/contact/` | `https://keithhinds.co.uk/contact` |
| `/blog/post/` | `https://keithhinds.co.uk/blog/post` |

**Impact:**
Search engines may index both URL forms as separate pages, or may ignore the canonical signal entirely if it points to a URL that itself redirects.

**Remediation Steps:**

Pick one of the two options and apply it consistently across all pages and the sitemap:

**Option A — Add trailing slashes to all canonical tags** (matches current served URLs):

In each affected `index.html`, update the canonical tag. Example for [`about/index.html`](about/index.html:8):

```html
<link rel="canonical" href="https://keithhinds.co.uk/about/" />
```

Repeat for `work`, `blog`, `now`, `interests`, `contact`, `blog/post`.

**Option B — Remove the trailing-slash redirect** (makes served URLs match current canonicals):

Add `absolute_redirect off;` to [`nginx.conf`](nginx.conf) (same as PERF-01). Served URLs will no longer redirect to a trailing-slash form, so `/about` is served directly as `/about`, matching the existing canonical tags.

---

### SEO-01: Sitemap URLs Do Not Match Served URL Form

- [ ] **Resolved**

**Severity:** 🟢 Low
**Area:** SEO — sitemap.xml

**Description:**
All `<loc>` entries in [`sitemap.xml`](sitemap.xml) use URLs without trailing slashes (e.g. `https://keithhinds.co.uk/about`) but nginx redirects those URLs to trailing-slash versions. Crawlers following sitemap entries will encounter a redirect on every non-root page.

**Impact:**
Each redirect wastes crawl budget and may slow indexing. The sitemap should reference the final canonical URL form to avoid unnecessary hops.

**Remediation Steps:**

Apply the same trailing-slash decision made for CANON-01.

- If **Option A** (add trailing slashes): update all `<loc>` entries in [`sitemap.xml`](sitemap.xml) to include the trailing slash, e.g.:
  ```xml
  <loc>https://keithhinds.co.uk/about/</loc>
  ```
- If **Option B** (`absolute_redirect off`): no sitemap changes needed — the existing no-slash URLs will be served directly.

---

## Future Audit Sections

Placeholder items for security enhancements not yet audited or scoped. Promote to full issues above once investigated.

### Content-Security-Policy (CSP)

- [ ] **Audit and implement CSP**

**Severity:** 🔴 High (when actioned)
**Area:** Security — HTTP Headers

**Notes:**
No `Content-Security-Policy` header is currently set. A CSP reduces the impact of XSS attacks by declaring which sources are permitted for scripts, styles, images, and connections. This site uses `'unsafe-inline'` scripts and styles and fetches from `ghchart.rshah.org` and Formspree, so a policy must be drafted to accommodate these before deployment.

Remediation template (to be refined after auditing all resource origins):

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https://ghchart.rshah.org data:; connect-src 'self' https://formspree.io; frame-ancestors 'none';" always;
```

Steps before enabling:
- [ ] Audit all external script/style/image/connect origins across every page
- [ ] Replace `'unsafe-inline'` with nonces or hashes where possible
- [ ] Test policy in report-only mode first (`Content-Security-Policy-Report-Only`)
- [ ] Deploy enforcing policy once report-only shows no violations

---

### Subresource Integrity (SRI)

- [ ] **Audit external resource loading for SRI coverage**

**Severity:** 🟡 Medium (when actioned)
**Area:** Security — Supply Chain

**Notes:**
Any `<script>` or `<link>` tags loading from external CDNs should include `integrity` and `crossorigin` attributes to guard against CDN compromise. Currently no external CDN assets are loaded, so this is a forward-looking placeholder.

Steps:
- [ ] Identify any future third-party scripts or stylesheets added to pages
- [ ] Generate SRI hashes using `openssl dgst -sha384 -binary <file> | openssl base64 -A`
- [ ] Add `integrity="sha384-..."` and `crossorigin="anonymous"` to the relevant tags

---

### Cookie Security Attributes

- [ ] **Audit any cookies set by the API for Secure and HttpOnly flags**

**Severity:** 🟡 Medium (when actioned)
**Area:** Security — Session Management

**Notes:**
The `keith-api` Node.js container may set cookies for session or auth purposes. Any cookies set should carry `Secure`, `HttpOnly`, and `SameSite=Strict` (or `Lax`) attributes.

Steps:
- [ ] Review `api/server.js` for any `Set-Cookie` headers or session middleware
- [ ] Confirm all cookies include `Secure; HttpOnly; SameSite=Strict`
- [ ] Verify no sensitive data is stored in non-HttpOnly cookies accessible to JS

---

### Blog Post Static Meta (SSR / Pre-render)

- [ ] **Improve static fallback meta on blog post pages**

**Severity:** 🟢 Low
**Area:** SEO — Meta Tags

**Notes:**
The blog post page (`/blog/post/`) has generic static `<title>Post — Keith Hinds</title>` and `<meta name="description" content="A post on the Keith Hinds blog.">` in the HTML source. These are the values crawlers see before JavaScript executes. The JS updates OG tags after the post loads, but the static canonical and description remain generic.

Options:
- [ ] Implement server-side rendering for post meta via the Node.js API (add a `/blog/post/:slug` route that returns a pre-populated HTML shell)
- [ ] Or accept as a known CSR limitation and ensure the fallback description is at least meaningful and not a duplicate across posts

---

*Last updated: 2026-09-20*
*Audit basis: post-deployment `curl` inspection of live `https://keithhinds.co.uk/` responses.*
