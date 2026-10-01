# Architecture

404 Missing is deliberately small. The website owns the route, the credentials
and the decision about which countries to support. The package provides the
boring, repeatable pieces.

## Request Flow

```mermaid
sequenceDiagram
  autonumber
  participant Browser
  participant Widget
  participant API as Same-origin API
  participant Store as Private token store
  participant Provider

  Browser->>Widget: Render 404 page
  Widget->>API: GET /appeal?country=US&region=OH
  API->>Store: Reuse valid provider token
  alt Token missing or expired
    API->>Provider: POST /Auth/Token
    Provider-->>API: Access token
    API->>Store: Persist token and expiry
  end
  API->>Provider: Fetch current appeals
  Provider-->>API: Provider records
  API-->>Widget: Normalised short-lived result
  Widget->>API: GET /photo/provider/path
  API->>Provider: Fetch photo only if path is in current snapshot
  Provider-->>API: Image stream
  API-->>Widget: no-store image response
```

## Boundaries

```mermaid
flowchart TB
  subgraph Public Browser
    A[Widget]
    B[Vue wrapper]
    C[React wrapper]
  end
  subgraph Your Server
    D[Fetch handler]
    E[Missing service]
    F[Provider adapters]
    G[Private token store]
  end
  subgraph Provider Systems
    H[Official API or directory]
  end
  A --> D
  B --> A
  C --> A
  D --> E
  E --> F
  F --> G
  F --> H
```

The browser receives display data only. Credentials, provider tokens and raw
provider errors stay on the server.

## Token Storage

Provider tokens are not case data. They still belong in private durable storage.

| Host | Store |
| --- | --- |
| Persistent Node server | `createFileTokenStore('/private/path/ncmec-token.json')` |
| Netlify | `createNetlifyTokenStore(getStore({ name: '404-missing-private-auth', consistency: 'strong' }))` |
| Other serverless hosts | Implement the `TokenStore` interface with durable private storage. |

The store records access token, expiry and authentication cooldown only. It does
not store cases or photographs.

## Adding A Provider

0. Prerequisites:
   Written permission or terms that clearly allow your use, including display,
   caching, update, withdrawal and photography rules.

1. Implement the provider contract:

   ```ts
   import type { Provider } from '@dappa/404-missing/server'

   export const provider: Provider = {
     id: 'official-source',
     countries: ['GB'],
     async getAppeals(area) {
       return []
     },
     async getPhoto(path) {
       return new Response(null, { status: 404 })
     },
   }
   ```

2. Return records with official HTTPS appeal URLs, attribution, `checkedAt` and
   `expiresAt`.

3. Keep `expiresAt` no more than 60 seconds after `checkedAt`.

4. Add the provider to `createMissingService({ providers: [...] })`.

5. Check withdrawal behaviour:
   remove a provider record upstream or simulate its disappearance. Passing
   result: the API does not return stale case data and the widget shows the
   official directory fallback.

## Localisation

The package accepts an explicit country and optional region. It does not detect
location by IP, browser language or nationality.

Good sources for country selection:

- a site default, such as `GB` for a UK site
- a trusted server-side geo result you already use
- a visible visitor choice

Avoid hidden guesses. The public impact depends on showing a relevant official
appeal without pretending to know more than the site actually knows.
