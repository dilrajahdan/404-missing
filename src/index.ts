/** Public data contains only the information required to display an official appeal. */
export type Appeal = {
  id: string
  provider: string
  name: string
  ageNow: number | null
  missingSince: string
  location: { country: string; region: string; city: string }
  officialUrl: string
  photoPath: string | null
  attribution: string
  checkedAt: string
  expiresAt: string
}

export type Area = { country: string; region?: string }
export type Directory = { label: string; url: string }
export type AppealResult = {
  version: 1
  status: 'ok' | 'unavailable'
  country: string
  region?: string
  match: 'region' | 'country' | 'none'
  reason?: 'no-local-provider' | 'no-current-appeal' | 'provider-unavailable'
  appeal: Appeal | null
  fallback: Directory
}

export function countryCode(input: string): string | null {
  const value = input.trim().toUpperCase()
  if (value === 'UK') return 'GB'
  return /^[A-Z]{2}$/.test(value) && !['XX', 'ZZ', 'EU', 'T1'].includes(value) ? value : null
}

export function directoryFor(country: string): Directory {
  if (country === 'GB') return { label: 'View official UK appeals', url: 'https://www.missingpeople.org.uk/appeal-search' }
  if (country === 'US') return { label: 'View official US appeals', url: 'https://www.missingkids.org/gethelpnow/search' }
  return { label: 'Find your local missing-child organisation', url: 'https://globalmissingkids.org/' }
}

export const providerInfo = [
  { id: 'ncmec', countries: ['US'], status: 'supported', access: 'Own approved NCMEC credentials, server only', url: 'https://www.missingkids.org/gethelpnow/search/poster-api-registration' },
  { id: 'missing-people', countries: ['GB'], status: 'partner-required', access: 'Official appeals link available. Public reusable API access has not been established.', url: 'https://www.missingpeople.org.uk/join-the-search/become-a-poster-or-safeguarding-briefing-partner' },
  { id: 'notfound', countries: ['GB', 'BE', 'CY', 'FR', 'GR', 'IT', 'ES'], status: 'registered-embed', access: 'UK demo rendered an appeal. Provider-owned iframe after website registration; no public JSON API. Production freshness needs verification.', url: 'https://notfound.org/en/faq' },
] as const
