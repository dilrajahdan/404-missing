# Simple Patterns

Pick the pattern that matches your app. Every pattern has the same two pieces:

```mermaid
flowchart LR
  A[404 route] --> B[MissingChild UI]
  B --> C[/api/missing-children]
  C --> D[createMissing404Handler]
  D --> E[Official provider or directory]
```

## Shared API Config

Use this once per app. The route syntax changes by framework, but the config
stays the same.

```ts
import { createMissing404Handler } from '@dappa/404-missing/server'
import { createFileTokenStore } from '@dappa/404-missing/node'

export const missingChildrenHandler = createMissing404Handler({
  defaultCountry: 'GB',
  ncmec: {
    clientId: process.env.NCMEC_CLIENT_ID || '',
    clientSecret: process.env.NCMEC_CLIENT_SECRET || '',
    tokenStore: createFileTokenStore('.data/private-404/ncmec-token.json'),
  },
})
```

For Netlify, swap the file store for `createNetlifyTokenStore(...)` from
`@dappa/404-missing/netlify`.

## React Or Next.js

0. Prerequisites:
   `@dappa/404-missing` installed and an API route mounted at
   `/api/missing-children`.

1. Add the 404 UI:

   ```tsx
   import { MissingChild } from '@dappa/404-missing/react'

   export default function NotFound() {
     return (
       <main>
         <h1>Page not found</h1>
         <a href="/">Back home</a>
         <MissingChild country="GB" />
       </main>
     )
   }
   ```

2. Check:
   open a real missing route. Passing result: the page response is HTTP 404 and
   the card calls `/api/missing-children/appeal`.

## Vue Or Nuxt

0. Prerequisites:
   `@dappa/404-missing` installed and an API route mounted at
   `/api/missing-children`.

1. Add the 404 UI:

   ```vue
   <script setup lang="ts">
   import MissingChild from '@dappa/404-missing/vue'

   defineProps<{ error?: { statusCode?: number } }>()
   </script>

   <template>
     <main>
       <h1>Page not found</h1>
       <a href="/">Back home</a>
       <MissingChild country="GB" />
     </main>
   </template>
   ```

2. Check:
   open a real missing route. Passing result: the selector and official fallback
   link are visible.

## Ember

0. Prerequisites:
   `@dappa/404-missing` installed, a same-origin API route mounted at
   `/api/missing-children` and an Ember route or template for not-found pages.

1. Register the custom element once from app code:

   ```js
   import { registerMissingChild } from '@dappa/404-missing/widget'

   registerMissingChild()
   ```

2. Add the element to the not-found template:

   ```hbs
   <main>
     <h1>Page not found</h1>
     <a href="/">Back home</a>
     <missing-child country="GB" endpoint="/api/missing-children">
       <a href="https://www.missingpeople.org.uk/appeal-search">Official UK appeals</a>
     </missing-child>
   </main>
   ```

3. Check:
   open the Ember not-found route. Passing result: the fallback link renders
   before the appeal request completes.

## Astro

0. Prerequisites:
   Astro SSR and an endpoint mounted at `/api/missing-children`.

1. Add the 404 UI:

   ```astro
   <main>
     <h1>Page not found</h1>
     <a href="/">Back home</a>
     <missing-child country="GB" endpoint="/api/missing-children">
       <a href="https://www.missingpeople.org.uk/appeal-search">Official UK appeals</a>
     </missing-child>
   </main>

   <script>
     import { registerMissingChild } from '@dappa/404-missing/widget'
     registerMissingChild()
   </script>
   ```

2. Check:
   build and visit a missing route through the server. Passing result: the
   official fallback is present even if the widget script loads slowly.

## HTML Or Any Framework

0. Prerequisites:
   A same-origin server or serverless API route.

1. Add the element:

   ```html
   <missing-child country="GB" endpoint="/api/missing-children">
     <a href="https://www.missingpeople.org.uk/appeal-search">Official UK appeals</a>
   </missing-child>
   <script type="module">
     import { registerMissingChild } from '/dist/widget.js'
     registerMissingChild()
   </script>
   ```

2. Check:
   open DevTools Network. Passing result:
   `/api/missing-children/appeal` returns `200` with `Cache-Control: no-store`.

## When You Need More Control

Use the lower-level API when you are adding a provider, changing the route base
path or writing a host-specific token store:

```ts
import { createFetchHandler, createMissingService, createNcmecProvider } from '@dappa/404-missing/server'

const handler = createFetchHandler(createMissingService({
  defaultCountry: 'GB',
  providers: [createNcmecProvider({ clientId, clientSecret, tokenStore })],
}), '/api/missing-children')
```

Most sites should not need this on day one.
