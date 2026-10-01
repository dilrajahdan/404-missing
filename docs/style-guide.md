# Style Guide

404 Missing has two audiences: website visitors who may be able to help, and
developers who need to integrate safely in a few minutes. The style should feel
calm, direct and trustworthy.

## Product Writing

1. Use plain English.
2. Say "appeal" or "official appeal", not "content".
3. Say "directory fallback" when no inline appeal is available.
4. Say "approved provider" when a provider has granted access.
5. Never imply partnership, endorsement or sponsorship unless a provider has
   explicitly approved that language.
6. Never describe provider records or photographs as open data.
7. Avoid drama, urgency theatre or guilt.
8. Keep reporting instructions pointed at the official appeal.

Preferred phrases:

```text
Help bring a child home.
View official appeal.
Browse current appeals with the official organisation.
We cannot show a current appeal right now. You can still help below.
```

Avoid:

```text
Powered by NCMEC
Official partner
Guaranteed local case
AI matched appeal
Our missing-child database
```

## Visual Style

The widget should feel like part of a real 404 page, not an advert.

1. Use inherited fonts by default.
2. Keep one clear action: the official appeal or directory link.
3. Preserve visible focus states.
4. Keep controls at least 44 pixels high.
5. Use restrained colours and high contrast.
6. Avoid animation that distracts from the appeal.
7. Avoid decorative imagery that could be confused with a real child photograph.
8. Let implementers theme with CSS variables instead of editing component code.

CSS variables:

```css
--missing-ink
--missing-surface
--missing-border
--missing-radius
--missing-action
--missing-action-ink
--missing-focus
--missing-font
--missing-photo-surface
```

## Documentation Style

1. Start with the shortest working path.
2. Use numbered steps for setup.
3. Put prerequisites in step 0.
4. Include exact file locations when framework docs need files.
5. End setup docs with "Check" steps and the passing result.
6. Keep deep details in satellite pages and link to them.
7. Use Mermaid diagrams when they make the flow easier to understand.
8. Keep provider limitations visible.

## Code Style

0. Prerequisites:
   Node 22 or newer and `npm ci`.

1. TypeScript:
   use strict TypeScript, exported types for public contracts and no `any` in
   new public APIs.

2. Runtime:
   keep the core Fetch-based. Framework adapters should wrap the same handler
   instead of owning provider logic.

3. Security:
   credentials stay server-side. Never expose provider tokens, raw provider
   errors, client secrets or private token store contents.

4. Freshness:
   do not persist case records or photos. Do not serve stale records after
   outage or withdrawal.

5. Provider adapters:
   implement `Provider`, return official HTTPS appeal URLs, preserve
   attribution and keep `expiresAt` within the allowed freshness window.

6. Browser code:
   import only public data helpers and widget code. Do not import provider
   adapters or MCP SDKs into browser bundles.

7. Tests:
   use synthetic records only. Never commit real case records, names, images or
   screenshots as fixtures.

8. Errors:
   return safe public states such as `unavailable`, `no-local-provider`,
   `no-current-appeal` or `provider-unavailable`. Do not leak provider internals.

9. Dependencies:
   keep dependencies small. A new runtime dependency needs a clear integration
   benefit and tests.

10. Formatting:
   keep code readable and close to existing style. Avoid broad refactors in
   provider or docs PRs.

## Public API Rules

1. Prefer additive changes.
2. Keep `AppealResult.version` stable unless the response shape changes.
3. Document new exports in `README.md` or a satellite doc.
4. Add consumer type checks for new package exports.
5. Keep lower-level escape hatches for advanced users, but make the common path
   config-first.

