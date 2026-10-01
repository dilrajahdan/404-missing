#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { providerInfo, directoryFor } from './index.js'

const server = new McpServer({ name: '404-missing', version: '0.1.0' })
const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
server.registerTool('list_providers', { description: 'Show missing-child provider coverage, access requirements and official documentation. No case data.', inputSchema: {}, annotations }, async () => ({ content: [{ type: 'text', text: JSON.stringify(providerInfo, null, 2) }] }))
server.registerTool('integration_guide', {
  description: 'Generate a framework integration guide. Does not modify files or receive credentials or case data.',
  inputSchema: { framework: z.enum(['nuxt', 'next', 'astro', 'html']), country: z.enum(['GB', 'US']).default('GB') }, annotations,
}, async ({ framework, country }) => {
  const directory = directoryFor(country)
  const common = `Install the release archive linked in https://github.com/dilrajahdan/404-missing. Keep your own approved NCMEC credentials in server environment variables. Use createNcmecProvider, createMissingService and createFetchHandler from @dappa/404-missing/server. Mount GET /api/missing-children/appeal and /api/missing-children/photo/**. Configure a private durable token store before requesting NCMEC tokens: use createFileTokenStore from @dappa/404-missing/node on persistent Node servers, or createNetlifyTokenStore with a private site-wide Netlify Blobs store. Never persist case data. Set defaultCountry to ${country}. Keep the 404 HTTP status and a server-rendered home link. UK inline case data needs partner access; the official UK appeals link works now. Do not send credentials or case records to this MCP server.\n`
  const snippets = {
    nuxt: `import MissingChild from '@dappa/404-missing/vue'\n<MissingChild country="${country}" />\nH3 server route: return sendWebResponse(event, await handler(toWebRequest(event))). See README for the complete singleton handler.`,
    next: `import { MissingChild } from '@dappa/404-missing/react'\n<MissingChild country="${country}" />\nExport the Fetch handler as GET in app/api/missing-children/[...path]/route.ts.`,
    astro: `<missing-child country="${country}"><a href="${directory.url}">${directory.label}</a></missing-child>\n<script>import { registerMissingChild } from '@dappa/404-missing/widget'; registerMissingChild();</script>\nMount the Fetch handler in an SSR endpoint.`,
    html: `<missing-child country="${country}"><a href="${directory.url}">${directory.label}</a></missing-child>\n<script type="module">import { registerMissingChild } from './dist/widget.js'; registerMissingChild();</script>\nServe dist/index.js beside widget.js. Host the server adapter on the same origin.`,
  }
  return { content: [{ type: 'text', text: common + snippets[framework] }] }
})
await server.connect(new StdioServerTransport())
