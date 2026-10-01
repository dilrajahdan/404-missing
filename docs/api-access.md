# API Access

This page explains how to request provider access without leaking keys, scraping
case records or implying endorsement.

## What To Ask For

Ask for permission to display current public appeals on 404 pages. Be clear that
404 Missing is self-hosted software. Each website operator uses its own approved
credentials or embed. The project does not run a shared public API, resell case
data or store photographs.

## Current Provider Paths

| Area | Provider | Best next step | Status in 404 Missing |
| --- | --- | --- | --- |
| United States | [NCMEC Poster API registration](https://www.missingkids.org/gethelpnow/search/poster-api-registration) | Apply for your own API credentials. | Supported server-side provider. |
| United Kingdom | [Missing People partner page](https://www.missingpeople.org.uk/join-the-search/become-a-poster-or-safeguarding-briefing-partner) | Ask about approved public appeal feed access for website display. | Official directory fallback now. Inline feed needs approval. |
| United Kingdom and Europe | [NotFound.org](https://notfound.org/en) and [FAQ](https://notfound.org/en/faq) | Register the website and use the issued iframe exactly as provided. | Registered embed route researched. Not a JSON API. |
| Global partner network | [Global Missing Children Network contact](https://globalmissingkids.org/contact-us/) | Ask ICMEC/GMCN about partner access or introductions to country organisations. | Future partner adapter. |
| International police notices | [INTERPOL Yellow Notices](https://www.interpol.int/How-we-work/Notices/Yellow-Notices) and [Terms of use](https://www.interpol.int/Who-we-are/Terms-of-use) | Research only unless written permission allows reproduction. | Not enabled. |

## NCMEC Steps

0. Prerequisites:
   a real website URL, a named contact, a plain description of how the 404 page
   will show appeals and an agreement that credentials stay server-side.

1. Open the [NCMEC Poster API registration page](https://www.missingkids.org/gethelpnow/search/poster-api-registration).

2. Use these paste-ready values as a starting point:

   ```text
   Application Name:
   404 Missing integration for <website name>

   Type of medium:
   Website 404 page. The page remains an HTTP 404 response and displays one current missing-child appeal or an official directory fallback.

   Distribution coverage area:
   <local, regional, national or site audience>

   How poster information will be distributed:
   The website server requests current appeal data using approved server-side credentials. The browser receives only the display fields needed for the appeal card. Provider photographs are proxied through a same-origin no-store route while they belong to the current response. We do not store case records or photographs on disk, and we link visitors to the official appeal for reporting.

   Technology-assisted use:
   This integration does not use facial recognition, automated identification or visitor-submitted case matching. It uses software only to display approved public appeal data on a website 404 page.
   ```

3. Store credentials only in server environment variables.

4. Configure a private durable token store before making requests.

5. Check:
   a missing page displays a current appeal only through your own server route.
   An unavailable provider displays the official directory instead of stale data.

## UK Steps

0. Prerequisites:
   a real website URL, a clear public-interest use case and a decision about
   whether you want a provider-owned embed or a custom styled API/feed.

1. For immediate coverage, link to the official [Missing People appeal search](https://www.missingpeople.org.uk/appeal-search).

2. For a custom card, contact Missing People through the [partner page](https://www.missingpeople.org.uk/join-the-search/become-a-poster-or-safeguarding-briefing-partner). Ask about public appeal distribution, not confidential safeguarding briefings.

3. For an embed route, register the website with [NotFound.org](https://notfound.org/en). Use the issued iframe as provided. Do not scrape it, copy a demo key or restyle the contents outside the provider's terms.

4. Check:
   until approved feed or embed access exists, the UK card must show the
   official directory fallback. An empty inline UK result is a pass when the
   official directory remains visible.

## Copy-Paste Email Template

```text
Subject: Request for approved missing-child appeal display access for 404 Missing

Hello <name or team>,

I am working on 404 Missing, an open-source, self-hosted toolkit that lets websites turn their 404 pages into a place where visitors can see a current missing-child appeal or an official appeal directory.

We would like to ask whether <organisation name> offers an approved API, data feed, iframe or partner route for displaying current public appeals on websites.

The intended use is:

1. A visitor lands on a website page that does not exist.
2. The page remains an HTTP 404 response.
3. The website shows one current appeal relevant to the site's country or region, or shows your official directory if no approved local appeal is available.
4. Any report, sighting or action goes through your official appeal link or reporting channel.

Our safety commitments are:

1. Each website operator uses its own approved credentials or registered embed.
2. Credentials stay server-side and are never shared with browsers, MCP tools or public configuration.
3. We do not store case records or photographs on disk.
4. We do not scrape private, demo or undocumented endpoints.
5. We do not use visitor-submitted case records.
6. We do not use facial recognition, automated identification or AI matching.
7. We preserve attribution and official reporting links.
8. We remove or stop displaying an appeal as soon as it is withdrawn or unavailable from the approved source.

Could you let us know:

1. Whether you have an approved public appeal API, feed, iframe or partner programme.
2. Which fields and photographs may be displayed publicly.
3. Required attribution, reporting links and safety language.
4. Caching, freshness and withdrawal requirements.
5. Rate limits and authentication requirements.
6. Whether each website/domain needs separate approval.
7. Whether open-source implementation code is acceptable if provider credentials and content remain private to each approved operator.

Project repository:
https://github.com/dilrajahdan/404-missing

Thank you,

<your name>
<role>
<organisation>
<website>
<email>
```

## Access Checklist

Before a provider becomes an enabled adapter, record these answers in
`docs/providers.md`:

1. Official source URL and contact route.
2. Written permission or public terms that cover this exact display use.
3. Allowed countries and regions.
4. Allowed fields and photographs.
5. Required attribution and reporting link.
6. Freshness, caching and withdrawal rules.
7. Rate limits and authentication.
8. Whether credentials are per website, per operator or per application.
9. Test plan for current appeal, no-current-appeal, withdrawal, outage and photo failure.
10. Confirmation that provider content is not relicensed by this MIT repository.

