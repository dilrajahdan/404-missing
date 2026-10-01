<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { directoryFor, countryCode } from '@dappa/404-missing'

withDefaults(defineProps<{ endpoint?: string; country?: string; region?: string }>(), { endpoint: '/api/missing-children', country: 'GB' })
let disposed = false
onMounted(async () => {
  const { registerMissingChild } = await import('@dappa/404-missing/widget')
  if (!disposed) registerMissingChild()
})
onBeforeUnmount(() => { disposed = true })
</script>

<template>
  <component :is="'missing-child'" :endpoint="endpoint" :country="country" :region="region" data-missing-404="0.1.0">
    <slot>
      <p>Help bring a child home.</p>
      <a :href="directoryFor(countryCode(country) || 'GB').url" rel="noopener noreferrer">{{ directoryFor(countryCode(country) || 'GB').label }}</a>
    </slot>
  </component>
</template>
