# 404 Missing

Pre-release: pilot verification is in progress. The release archive below will be published after both pilot sites pass the live appeal and photo checks.

Give a missing page a useful purpose: show a current missing-child appeal and link visitors to the official organisation.

Small, self-hosted and framework friendly. A Fetch API handler, a web component, Vue and React adapters, and a local MCP server for integration assistance. No shared API keys, database, visitor accounts or tracking.

```text
Your 404 page → your server → your approved provider
                    ↓
          current appeal or official directory
```

## Quick start: Nuxt 3 or 4

0. Use Node 22+. For inline US appeals, obtain your own [NCMEC approval](https://www.missingkids.org/gethelpnow/search/poster-api-registration). A UK official-directory link works without keys. Read [provider access and limitations](docs/providers.md).
1. Install the versioned release archive from the repository root:

   ```sh
   npm install https://github.com/dilrajahdan/404-missing/releases/download/v0.1.0/dappa-404-missing-0.1.0.tgz
   ```

   This is a GitHub release install. The package is not published to npm. Pilot projects can vendor the identical archive and use `file:vendor/dappa-404-missing-0.1.0.tgz`.
2. Set these environment variables on your server, never in public runtime config:

   ```dotenv
   NUXT_NCMEC_CLIENT_ID=your-own-approved-client-id
   NUXT_NCMEC_CLIENT_SECRET=your-own-approved-client-secret
   ```
3. Create `server/utils/missing-404.ts`. The lazy singleton is created at request time, so credentials are read in the running server:

   ```ts
   import { createNcmecProvider, createMissingService, createFetchHandler } from '@dappa/404-missing/server'
   import { createFileTokenStore } from '@dappa/404-missing/node'
   import { resolve } from 'node:path'

   let handler: ReturnType<typeof createFetchHandler> | undefined
   export function missingHandler() {
     return handler ??= createFetchHandler(createMissingService({
       defaultCountry: 'GB',
       providers: [createNcmecProvider({
         clientId: process.env.NUXT_NCMEC_CLIENT_ID || '',
         clientSecret: process.env.NUXT_NCMEC_CLIENT_SECRET || '',
         tokenStore: createFileTokenStore(resolve('.data/private-404/ncmec-token.json')),
       })],
     }))
   }
   ```
   Add `.data/` to `.gitignore`. This store requires a persistent Node filesystem outside the public directory. For Netlify, use the private Blobs store described below; other serverless hosts need their own durable token store. Do this before making authenticated requests.

4. Create `server/api/missing-children/[...path].get.ts`:

   ```ts
   import { defineEventHandler, sendWebResponse, toWebRequest } from 'h3'
   import { missingHandler } from '../../utils/missing-404'
   export default defineEventHandler(async event =>
     sendWebResponse(event, await missingHandler()(toWebRequest(event)))
   )
   ```

5. In `error.vue` (Nuxt 3) or `app/error.vue` (Nuxt 4), import the component and render it only for 404 errors. Keep the home link outside any client-only boundary:

   ```vue
   <script setup lang="ts">
   import MissingChild from '@dappa/404-missing/vue'
   defineProps<{ error: { statusCode: number } }>()
   </script>
   <template>
     <main>
       <h1>{{ error.statusCode === 404 ? 'Page not found' : 'Something went wrong' }}</h1>
       <a href="/">Back home</a>
       <MissingChild v-if="error.statusCode === 404" country="GB" />
     </main>
   </template>
   ```
6. Build and visit a genuinely nonexistent route. Check, in order: HTTP 404, visible home link, country selector, official directory link. Select United States and check a live photograph and the official appeal when credentials are configured. An unavailable provider should leave the official directory visible, with no old case. A GB directory without an inline photograph is the expected result until UK partner access is enabled.

## JSON API

```sh
curl 'https://your-site.example/api/missing-children/appeal?country=US&region=OH'
```

The result has `version`, `status`, `country`, optional `region`, `match`, `appeal` and `fallback`. `status: "unavailable"` is a valid HTTP 200 response with a directory link and a reason. Invalid area input returns 400. The data includes official attribution, `checkedAt` and `expiresAt`. No credentials or raw upstream errors leave the server.

`GET /api/missing-children/photo/:provider/:path` proxies an authorised image only while it belongs to a current snapshot. Photo responses and appeal responses use `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`. Preserve these through your CDN and service worker. HEAD is supported by the Fetch handler if the host forwards it.

`country` is a two-letter country code (`UK` is normalised to `GB`). The default is a site preference, not a detected visitor location. US region preference selects within the latest 100 posters; if none match it returns a clearly labelled country-level appeal. There is no automatic cross-country fallback. Use trusted host geolocation if you have it, or let visitors choose. Browser language and nationality are not physical location.

## Other frameworks

**React / Next.js:** use `import { MissingChild } from '@dappa/404-missing/react'` in your not-found page. Keep `<a href="/">Back home</a>` server rendered. Export the singleton Fetch handler as `GET` from `app/api/missing-children/[...path]/route.ts` using server-only environment variables. The React adapter is safe to import during SSR and registers its custom element after mounting.

**Astro:** render `<missing-child country="GB"><a href="https://www.missingpeople.org.uk/appeal-search">Official UK appeals</a></missing-child>`, then import and call `registerMissingChild` from `@dappa/404-missing/widget` in an Astro script. Mount the Fetch handler through an SSR endpoint. A fully static host needs a same-origin serverless API.

**HTML / any framework:** serve `dist/widget.js` and its sibling `dist/index.js`, then use:

```html
<missing-child country="US" endpoint="/api/missing-children">
  <a href="https://www.missingkids.org/gethelpnow/search">Official US appeals</a>
</missing-child>
<script type="module">
  import { registerMissingChild } from '/dist/widget.js';
  registerMissingChild();
</script>
```

The public browser bundle imports only the public data helpers. It does not import the server provider or the MCP SDK. Style with inherited fonts and CSS variables: `--missing-ink`, `--missing-surface`, `--missing-border`, `--missing-radius`, `--missing-action`, `--missing-action-ink`, `--missing-focus`, `--missing-font` and `--missing-photo-surface`.

## Reuse authentication across restarts

NCMEC limits newly issued tokens while earlier tokens are valid. A singleton alone is insufficient for production serverless deployments and process restarts. Pass a private `tokenStore` to `createNcmecProvider`. Reuse one store per approved account; do not share it across unrelated providers or applications without approval.

On a Node server, import `createFileTokenStore` from `@dappa/404-missing/node` and set `tokenStore: createFileTokenStore('/var/lib/your-app/private/ncmec-token.json')`. The application user must be able to write that private directory. The store uses 0600 files, atomic writes and a lock shared by workers. Keep the directory outside web roots, deployment bundles and git.

On Netlify, install `@netlify/blobs`, import `getStore` from it and `createNetlifyTokenStore` from `@dappa/404-missing/netlify`. Set `tokenStore: createNetlifyTokenStore(getStore({ name: '404-missing-private-auth', consistency: 'strong' }))`. This uses a private site-wide store, strong reads and conditional writes to serialize refreshes. Never expose that store through an HTTP route or use a deploy-scoped store that disappears on release. Use a separate local file store for development.

These stores persist access tokens, expiry and authentication cooldowns only. Case records and photos are never persisted. Authentication failures do not fall back to expired cases. If the provider has already imposed a token cooldown, wait for it to expire. Repeated token requests do not help.

## MCP

After installation, configure your MCP client:

```json
{
  "mcpServers": {
    "404-missing": {
      "command": "node",
      "args": ["/absolute/path/to/project/node_modules/@dappa/404-missing/dist/mcp.js"]
    }
  }
}
```

Tools: `list_providers` and `integration_guide` (`framework`: `nuxt`, `next`, `astro`, `html`; `country`: `GB`, `US`). They return setup guidance and source links. They do not read files, accept keys, call providers, expose case records or modify a project.

## UK and new providers

The UK fallback links directly to Missing People's current appeals. For inline UK data, seek an approved distribution feed. [NotFound.org](https://notfound.org/en) also has a working UK demo and a website registration flow for its own iframe. Use the exact registered embed and its full presentation if you take that route. Do not scrape it or reuse a demo/third-party key. See [research and next steps](docs/providers.md).

An additional provider implements `Provider` from `@dappa/404-missing/server`: `id`, `countries`, `getAppeals(area)`, optional `getPhoto(path)`. Its records must use the shared shape, an HTTPS official appeal URL and an expiry no longer than 60 seconds after checking the source. Provider identifiers and photo paths must use letters, digits, hyphens or underscores, with `/` separating path segments. Add it to the `providers` array. Honour withdrawal, licensing and source-controlled publicity decisions. Never accept visitor-submitted missing-person records.

## Development

```sh
npm ci
npm test
npm run demo
```

Open `http://127.0.0.1:4319/missing-page`. With no credentials, a directory fallback is expected. Set `NCMEC_CLIENT_ID` and `NCMEC_CLIENT_SECRET` in the demo process's environment to test live US appeals. The demo persists its token in ignored `.data/private-404/`; set `MISSING_TOKEN_FILE` to reuse another private store for the same approved account. Real cases are never test fixtures or bundled screenshots.

MIT for code. Provider records and photographs are not open data under this licence. No affiliation or endorsement by the organisations is implied. See [security and freshness limits](SECURITY.md).
