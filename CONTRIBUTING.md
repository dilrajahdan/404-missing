# Contributing

0. Use Node 22 or newer. Run `npm ci` in the repository root.
1. Run `npm test`. It tests the Fetch API contract, lifecycle, withdrawal, widget and MCP client round-trip without live credentials.
2. Run `npm run demo` and open `http://127.0.0.1:4319/missing-page`. Without credentials, the official directory is the expected passing state. Use your own approved credentials in your local environment to check a live appeal.
3. For a provider, implement the `Provider` interface, preserve official attribution and contact destinations, document approval and display rights, and prove withdrawal and outage handling. Do not scrape private or undocumented endpoints or circumvent access restrictions. Never commit real case records, images or credentials as fixtures.
4. Check the actual 404 in a browser at 390 and 1440 pixels: country selection, photo, official link and home link. Inspect screenshots. Exercise no-JavaScript and unavailable-provider states. Keep the HTTP status 404.
5. Open a focused pull request describing the problem, resulting behaviour and verification. Avoid real names in test evidence.

The first release supports English UI, country selection and US region preference within a bounded recent snapshot. Full translated UI, local partner feeds, regional upstream pagination and additional framework packages need verified requirements and tests, not placeholder connectors.
