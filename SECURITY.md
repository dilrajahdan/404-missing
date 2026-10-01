# Security and appeal safety

Report security concerns using the repository's private vulnerability reporting when enabled. Do not put credentials, child records, photographs or private reports in public issues. Report information about a missing child directly to the organisation on the official appeal, never to this project.

Keep credentials on your server. Use your own approved provider account. Never prefix a credential with NUXT_PUBLIC_, NEXT_PUBLIC_, VITE_ or PUBLIC_. Do not reuse another site's account without the provider's permission. MCP tools are offline setup assistance and never accept credentials or distribute children's data to models.

The NCMEC adapter keeps only an in-memory snapshot for at most 60 seconds, shares concurrent requests, validates photo membership, and serves no expired backup. Empty results replace old results. Upstream failures produce a directory link, never a stale case. All API and photo responses use no-store and noindex. An upstream withdrawal may remain visible for the remaining snapshot lifetime, up to 60 seconds, plus source propagation delay. This is bounded freshness, not instant takedown. Browsers clear and refresh a card at expiry and on returning to the tab. Provider-owned embeds have their own freshness policies.

Do not introduce persistent case storage, stale-while-revalidate, CDN image optimisation or service-worker caching on these routes. Do not embed a child's case in static HTML, screenshots, build artifacts or repository history. Page navigation and an official directory should work even if the API or JavaScript fails. Preserve HTTP 404.

Photo requests have fixed upstream origins, redirects disabled, path validation and an image MIME allowlist. Tokens and raw upstream errors are never returned or logged. Terminate HTTPS at your host, rate-limit the public API there, restrict request sizes and monitor only aggregate status counts. The library does not provide fleet-wide rate limiting. Use singleton instances in each worker. Serverless cold starts and multiple processes can still cause extra provider requests.

No visitor IP addresses, precise location, cookies, localStorage, tracking or analytics are used by this package. The host site's existing analytics and access logs are separate. A country is an explicit visitor choice or the host's configured default. A host can use verified edge geolocation at its own boundary, but must not trust public request headers or infer physical location from browser language. Do not offer sighting collection, facial recognition or direct contact with families through this widget.

Dependency and publishing checks: npm test, npm audit, npm run check:secrets, inspect npm pack --dry-run, scan full git history, and check the actual tarball for known credentials before release.
