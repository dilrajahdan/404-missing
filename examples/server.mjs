import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createFileTokenStore } from '../dist/node.js'
import { createNcmecProvider, createMissingService, createFetchHandler } from '../dist/server.js'

const provider=createNcmecProvider({clientId:process.env.NCMEC_CLIENT_ID??'',clientSecret:process.env.NCMEC_CLIENT_SECRET??'',tokenStore:createFileTokenStore(resolve(process.env.MISSING_TOKEN_FILE??'.data/private-404/ncmec-token.json'))})
const handler=createFetchHandler(createMissingService({providers:[provider],defaultCountry:process.env.MISSING_DEFAULT_COUNTRY??'GB'}))
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>404 Missing · Demo</title><style>body{margin:0;background:#eeeee7;color:#202622;font:16px/1.5 system-ui}main{max-width:1100px;margin:12vh auto;padding:24px;display:grid;gap:40px}h1{font-size:clamp(36px,5vw,64px);line-height:1.05;letter-spacing:-.05em}a{color:inherit}nav a{display:inline-flex;min-height:44px;align-items:center}header{font-size:13px;letter-spacing:.1em;text-transform:uppercase}footer{font-size:12px;margin-top:32px}@media(min-width:900px){main{grid-template-columns:.8fr 1fr;align-items:start}}</style></head><body><main><div><header>404 Missing / working example</header><h1>Page not found.</h1><p>This page is missing. A moment of your time could help someone else find their way home.</p><nav><a href="/">Back home</a></nav><footer>Self-hosted. Official sources. No tracking.</footer></div><missing-child country="US"><a href="https://www.missingkids.org/gethelpnow/search">View official appeals</a></missing-child></main><script type="module">import {registerMissingChild} from '/dist/widget.js';registerMissingChild();</script></body></html>`
const server=createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost')
    if(url.pathname.startsWith('/api/')) {
      const r=await handler(new Request(url,{method:req.method}));res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));return
    }
    if(['/dist/widget.js','/dist/index.js'].includes(url.pathname)) {res.writeHead(200,{'content-type':'text/javascript'});res.end(await readFile(new URL('..'+url.pathname,import.meta.url)));return}
    res.writeHead(url.pathname==='/'?200:404,{'content-type':'text/html','cache-control':'no-store','x-robots-tag':'noindex'});res.end(html)
  }catch{res.writeHead(500);res.end('Unavailable')}
})
server.listen(Number(process.env.PORT??4319),'127.0.0.1',()=>console.log('404 Missing demo ready'))
