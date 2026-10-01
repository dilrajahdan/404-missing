# PR Strategy

Keep pull requests small enough that a maintainer can reason about safety,
provider permission and user impact.

## PR Types

| Type | Size target | Required checks |
| --- | --- | --- |
| Docs only | 1 topic | Link check, secret scan if templates changed. |
| Framework pattern | 1 framework | Consumer type check, SSR import test if applicable. |
| Provider research | 1 country or organisation | Official links, terms summary, no adapter code. |
| Provider adapter | 1 provider | Unit tests, withdrawal tests, outage tests, photo tests, docs. |
| Widget change | 1 behaviour | Widget tests, visual check at 390 and 1440 pixels. |
| Release | 1 version | Full test suite, package dry run, secret scan, public install smoke. |

## Branch Naming

```text
docs/<topic>
provider/<country-or-organisation>
framework/<framework>
widget/<short-change>
release/<version>
```

## PR Template

```md
## What changed

- 

## Why

- 

## Provider permission

- Provider:
- Official access link:
- Terms or written approval:
- Content storage allowed:
- Photo display allowed:
- Withdrawal behaviour:

## Safety checklist

- [ ] Credentials stay server-side.
- [ ] No real case records, names, images or screenshots committed.
- [ ] No stale case fallback after provider outage.
- [ ] Official attribution and reporting links preserved.
- [ ] Country fallback behaviour is explicit.
- [ ] API and photo responses keep `no-store` and `noindex`.

## Verification

- [ ] `npm test`
- [ ] `npm run check:secrets`
- [ ] `npm pack --dry-run --json`
- [ ] Real 404 page checked when UI changed.
- [ ] 390px and 1440px screenshots inspected when UI changed.

## Screenshots or video

Add screenshots, video or a contact sheet when the visual experience changed.
```

## Review Order

1. Provider permission:
   prove the adapter or docs use an official source and allowed route.

2. User safety:
   check freshness, withdrawal, attribution, reporting links and no stale
   fallback.

3. Developer experience:
   check the setup path is still short and framework-specific examples compile.

4. Tests:
   check failures prove the risk, not just string matches.

5. Package surface:
   check exports, package files and README links.

## Merge Rules

1. Do not merge provider adapters without documented provider access.
2. Do not merge real child records, photos or screenshots.
3. Do not merge a new framework adapter without SSR-safe import checks.
4. Do not merge docs that tell users to scrape, borrow keys or bypass terms.
5. Do not merge release changes without a package dry run and secret scan.
6. Prefer squash or fast-forward merges that keep each PR as one clear story.

## Release Strategy

1. Keep `main` releasable.
2. Tag only after tests, dry pack and public install smoke pass.
3. Include SHA256 checksums for release archives.
4. Verify anonymous download of the release artifact.
5. After publishing, update the README install line only if the version or asset
   name changed.

