# 404 Missing delivery plan

Claimed 2026-09-30. Executing branch: `codex/initial`.
Worktree: `/Users/superluvdub/workspace/projects/active/404-missing-worktrees/initial`.
Pilot worktrees: `SGSS Members-worktrees/404-missing` and `free-stencil-maker-web-worktrees/404-missing`.

## Decision
Extend the verified SGSS NCMEC integration into one small self-hosted library. First users are SGSS and Free Stencil Maker. Scope fits a first release within 14 days. This is an explicitly authorised public-interest project, not a new paid SaaS. Avoid a database, hosted key-sharing API, accounts, scraping, or case ingestion by visitors. Existing NotFound.org is a potential UK embed partner; its published interface is not a public API.

## Deliver
1. Verify official sources, actual NCMEC data shape and pilot failure.
2. Ship provider interface, NCMEC provider, strict bounded freshness, country/region selection, minimal Fetch API adapter and photo proxy.
3. Ship responsive custom element with Vue and React adapters; keep navigation and official appeals available with no JS, missing credentials or unavailable data.
4. Ship stdio MCP tools for provider information and integration snippets, without returning children's personal data or accepting credentials.
5. Install the same release archive in both pilots, build and exercise actual 404, image, official-link and home paths at 1440/390.
6. Secret-scan tracked history and release archive, merge tested work, deploy both pilots, verify live, then open the clean new repository and publish its release.

## Acceptance
- No provider credentials in browser code, responses, error logs, package or git history.
- No unbounded backup or stale-on-error; visible cards expire and revalidate on return to a tab.
- Country selection is explicit or supplied by a trusted host. Browser language is not treated as location. No silent cross-country fallback.
- Unknown/unsupported country returns an official directory, never a fabricated local appeal.
- Missing photos, feed errors and timeouts leave a usable 404 with a home link.
- 404 remains HTTP 404, never enters sitemaps; API/photo responses use no-store/noindex.
- Render assertions: no horizontal overflow at 390/1440, visible names and attribution, controls at least 44px high, keyboard focus visible.
- API, SSR import, provider failures/expiry/removal, request validation and MCP client round-trip tested. Use live data privately for contract checks; no case records/photos committed.

## Provider status
NCMEC credentials and actual 50-poster responses verified on both pilots. NCMEC terms remain separate from the source-code licence. UK partner approval remains an external dependency. No partner emails or registrations will be submitted in this task without a specific instruction to send them.
