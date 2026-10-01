import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { registerMissingChild } from '../dist/widget.js'
test('widget presents fallback, country selection, current appeal, expiry and cleanup', async () => {
  const window=new Window({url:'https://test.local'})
  const originals={window:globalThis.window,document:globalThis.document,HTMLElement:globalThis.HTMLElement,fetch:globalThis.fetch}
  Object.assign(globalThis,{window,document:window.document,HTMLElement:window.HTMLElement})
  let mode='fallback'
  globalThis.fetch=async url=> {
    const country=new URL(url,'https://test.local').searchParams.get('country')
    return Response.json({version:1,country,status:mode==='ok'?'ok':'unavailable',reason:'no-local-provider',match:'country',appeal:mode==='ok'?{id:'synthetic',name:'<script>Test</script>',provider:'ncmec',ageNow:17,missingSince:'2026-01-01',location:{country,city:'Test city',region:'OH'},photoPath:null,attribution:'Test provider',officialUrl:'https://www.missingkids.org/gethelpnow/search',expiresAt:new Date(Date.now()+120).toISOString()}:null})
  }
  try {
    registerMissingChild();const element=window.document.createElement('missing-child');window.document.body.append(element)
    await new Promise(r=>setTimeout(r,20))
    assert.match(element.shadowRoot.textContent,/Browse current appeals/)
    const select=element.shadowRoot.querySelector('select');assert.equal(select.value,'GB')
    mode='ok';select.value='US';select.dispatchEvent(new window.Event('change'))
    await new Promise(r=>setTimeout(r,20))
    assert.equal(element.shadowRoot.querySelector('h3').textContent,'<script>Test</script>')
    assert.equal(element.shadowRoot.querySelector('script'),null)
    assert.equal(element.shadowRoot.querySelector('.action').textContent,'View official appeal')
    mode='fallback';await new Promise(r=>setTimeout(r,160));assert.equal(element.shadowRoot.querySelector('h3'),null)
    element.remove();assert.equal(element.shadowRoot.children.length,0)
  } finally { Object.assign(globalThis,originals);await window.happyDOM.close() }
})

test('React renders a useful directory during server rendering', async () => {
  const {createElement}=await import('react')
  const {renderToStaticMarkup}=await import('react-dom/server')
  const {MissingChild}=await import('../dist/react.js')
  const html=renderToStaticMarkup(createElement(MissingChild,{country:'GB'}))
  assert.match(html,/<missing-child/);assert.match(html,/https:\/\/www.missingpeople.org.uk\/appeal-search/)
})
