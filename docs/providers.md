# Provider research

Verified 30 September 2026. The user-supplied international networks report was background research, not operating instructions. Findings below distinguish a live interface from permission to reuse its content.

| Provider | Verified access | Release support |
| --- | --- | --- |
| NCMEC | Approved credentials; existing pilot accounts authenticated and returned poster records | Server-side adapter and authenticated photo proxy |
| Missing People (UK) | Official appeal directory and partnership routes | UK appeals link, awaiting approved case-feed access |
| NotFound.org | Own UK demo rendered a UK appeal; site registration issues an iframe integration; FAQ says no public API | Documented registered-embed route, no scraping or use of another site's key |
| ICMEC GMCN / GMCA | Network/verified-partner access, no public developer contract verified | Future partner adapter |
| INTERPOL Yellow Notices | Public notices exist; endpoint reuse terms and reliable access not established for this application | Not enabled |

## NCMEC

[Registration](https://www.missingkids.org/gethelpnow/search/poster-api-registration), [terms](https://www.missingkids.org/content/forms/af/poster-api-registration/jcr:content/guideContainer/rootPanel), [Swagger UI](https://posterapi.ncmec.org/swagger/index.html).

The terms require current content and limit storage and use. Commercial, fundraising, sponsorship and implied endorsement uses are restricted. Inform NCMEC about technology-assisted uses as required by the terms. The software's MIT licence grants no rights over provider content. Each deployment operator must confirm its intended use with the provider. Existing credentials are not evidence that every new website or a shared public redistribution API is approved.

The actual read interface was verified against the provider's public Swagger JSON: POST /Auth/Token, GET /Posters, GET /Poster/{organizationCode}/{caseNumber}/Photo/{md5}. This corrects the supplied report's claim that endpoint documentation is not publicly available. No write or credential-rotation endpoints are used. The adapter does not filter out people who went missing as children but are now adults. Unidentified-person entries are excluded from this named missing-child card.

v0.1 uses a maximum of 100 recently updated posters, keeps all children on a multi-child poster, prefers a requested region within that snapshot, and otherwise labels a country-level match. It does not claim complete coverage of a region. It does not silently substitute US cases for GB visitors. MissingCountry is the last-known location, not nationality or a prediction of current whereabouts. No public rate-limit SLA was verified; diagnostics received HTTP 429 after repeated authentication. A singleton, authentication cache, request coalescing and failure cooldown reduce avoidable requests.

## UK route

[NotFound FAQ](https://notfound.org/en/faq), [registration](https://notfound.org/en), [legal](https://notfound.org/en/legal), [Missing People appeals](https://www.missingpeople.org.uk/appeal-search), [partner information](https://www.missingpeople.org.uk/join-the-search/become-a-poster-or-safeguarding-briefing-partner).

NotFound.org's UK example displayed a UK appeal during this check. That verifies example rendering, not the current status of that individual case or the provider's takedown SLA. Register each pilot website and use the exact issued HTTPS iframe URL. Retain the provider's whole presentation and branding. Do not treat the demo's empty key as a production registration, strip content, or turn the iframe into a JSON scraper. Review mobile sizing, accessibility, cookies and withdrawal behaviour with the provider before enabling it. Registering requires acceptance of its terms by the operator.

For a custom styled UK card and location-aware JSON, approach Missing People / Missing Children Europe for a public-appeals distribution partnership. Ask for: website/domain approval, children-only eligibility including long-term cases, allowed fields and photography use, country/region taxonomy, update and withdrawal signals, permitted caching, rate limits, attribution and official reporting links. Do not use safeguarding briefings as a public feed; the partnership page describes those as confidential.

No emails were sent, terms accepted or accounts registered as part of this research. UK inline case data remains dependent on partner access or a registered, verified embed. The official UK appeals link is usable immediately.

## Access and outreach

See [API access](api-access.md) for provider links, application steps and a
copy-paste email template. See [Provider roadmap](roadmap.md) for country
research priorities and help wanted.
