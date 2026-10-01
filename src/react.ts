'use client'
import { createElement, useEffect } from 'react'
import { directoryFor, countryCode } from './index.js'
export function MissingChild({ endpoint = '/api/missing-children', country = 'GB', region }: { endpoint?: string; country?: string; region?: string }) {
  useEffect(() => {
    let disposed = false
    void import('./widget.js').then(({ registerMissingChild }) => { if (!disposed) registerMissingChild() })
    return () => { disposed = true }
  }, [])
  const fallback = directoryFor(countryCode(country) ?? 'GB')
  return createElement('missing-child', { endpoint, country, region, 'data-missing-404': '0.1.0' }, createElement('a', { href: fallback.url, rel: 'noopener noreferrer' }, fallback.label))
}
