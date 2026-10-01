import { h } from 'vue'
import MissingChild from '@dappa/404-missing/vue'
import { getStore } from '@netlify/blobs'
import { createNetlifyTokenStore } from '@dappa/404-missing/netlify'

// Compile the actual package exports against the consumer frameworks and SDK.
h(MissingChild, { country: 'GB', region: 'London' })
createNetlifyTokenStore(getStore({ name: 'typecheck-only', consistency: 'strong' }))
