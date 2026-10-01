import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
test('MCP client initializes, discovers tools and requests a Nuxt integration', async () => {
  const client=new Client({name:'404-missing-test',version:'1.0.0'})
  const transport=new StdioClientTransport({command:process.execPath,args:['dist/mcp.js'],stderr:'pipe'})
  try {
    await client.connect(transport)
    const tools=await client.listTools();assert.equal(tools.tools.length,2)
    const info=await client.callTool({name:'list_providers',arguments:{}});assert.match(info.content[0].text,/partner-required/)
    const guide=await client.callTool({name:'integration_guide',arguments:{framework:'nuxt',country:'GB'}});assert.match(guide.content[0].text,/@dappa\/404-missing\/vue/)
    assert.match(guide.content[0].text,/private durable token store/)
    for (const framework of ['astro','html']) {
      const us=await client.callTool({name:'integration_guide',arguments:{framework,country:'US'}})
      assert.match(us.content[0].text,/href="https:\/\/www\.missingkids\.org\/gethelpnow\/search"/)
      assert.doesNotMatch(us.content[0].text,/href="https:\/\/www\.missingpeople\.org\.uk/)
    }
    const bad=await client.callTool({name:'integration_guide',arguments:{framework:'shell',country:'GB'}});assert.equal(bad.isError,true)
  } finally { await client.close() }
})
