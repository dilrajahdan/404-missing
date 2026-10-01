import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, stat, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createFileTokenStore } from '../dist/node.js'
import { createNcmecProvider } from '../dist/server.js'

test('separate provider instances reuse a private durable token under concurrent refresh', async () => {
  const dir=await mkdtemp(join(tmpdir(),'404-missing-token-'))
  const file=join(dir,'private','token.json');let auths=0
  const fetch=async url=>url.endsWith('/Auth/Token')?(auths++,Response.json({accessToken:'synthetic-token',expiresIn:3600})):Response.json({posters:[]})
  try {
    const providers=Array.from({length:4},()=>createNcmecProvider({clientId:'synthetic',clientSecret:'synthetic',tokenStore:createFileTokenStore(file),fetch}))
    await Promise.all(providers.map(p=>p.getAppeals({country:'US'})))
    assert.equal(auths,1)
    assert.equal((await stat(file)).mode & 0o777,0o600)
    assert.equal((await stat(join(dir,'private'))).mode & 0o777,0o700)
    const restarted=createNcmecProvider({clientId:'synthetic',clientSecret:'synthetic',tokenStore:createFileTokenStore(file),fetch})
    await restarted.getAppeals({country:'US'});assert.equal(auths,1)
  }finally{await rm(dir,{recursive:true,force:true})}
})

test('Netlify CAS token store serializes workers and recovers an abandoned lease', async () => {
  const {createNetlifyTokenStore}=await import('../dist/netlify.js')
  const entries=new Map();let revision=0
  const store={
    async get(k){return entries.get(k)?.data??null},
    async getWithMetadata(k){return entries.get(k)??null},
    async setJSON(k,data,options){
      const old=entries.get(k)
      if(options?.onlyIfNew&&old || options?.onlyIfMatch&&old?.etag!==options.onlyIfMatch)return {modified:false}
      const etag=String(++revision);entries.set(k,{data,etag});return {modified:true,etag}
    }
  }
  await store.setJSON('ncmec-token-v1-lock',{until:Date.now()-1000})
  let auths=0
  const fetch=async url=>url.endsWith('/Auth/Token')?(auths++,Response.json({accessToken:'synthetic-token',expiresIn:3600})):Response.json({posters:[]})
  const providers=Array.from({length:4},()=>createNcmecProvider({clientId:'synthetic',clientSecret:'synthetic',tokenStore:createNetlifyTokenStore(store),fetch}))
  await Promise.all(providers.map(p=>p.getAppeals({country:'US'})))
  assert.equal(auths,1);assert.equal(entries.get('ncmec-token-v1-lock').data.until,0)
})

test('provider token cooldown survives a process restart without another authentication request', async () => {
  const dir=await mkdtemp(join(tmpdir(),'404-missing-cooldown-'));let requests=0
  const file=join(dir,'token.json')
  const fetch=async()=>{requests++;return Response.json({message:'Too many new token requests. Please try again after 5.25 hour(s).'},{status:429})}
  const options={clientId:'synthetic',clientSecret:'synthetic',tokenStore:createFileTokenStore(file),fetch}
  try {
    await assert.rejects(createNcmecProvider(options).getAppeals({country:'US'}))
    await assert.rejects(createNcmecProvider(options).getAppeals({country:'US'}))
    assert.equal(requests,1)
    assert.ok((await options.tokenStore.read()).retryAfter>Date.now()+5*3600*1000)
  }finally{await rm(dir,{recursive:true,force:true})}
})
