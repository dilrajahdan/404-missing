import { h } from 'vue'
import MissingChild from '@dappa/404-missing/vue'
import { getStore } from '@netlify/blobs'
import { createNetlifyTokenStore } from '@dappa/404-missing/netlify'
import { createMissing404Handler } from '@dappa/404-missing/server'

// Compile the actual package exports against the consumer frameworks and SDK.
h(MissingChild, { country: 'GB', region: 'London' })
createNetlifyTokenStore(getStore({ name: 'typecheck-only', consistency: 'strong' }))
createMissing404Handler({ defaultCountry: 'GB', ncmec: { clientId: '', clientSecret: '' } })
