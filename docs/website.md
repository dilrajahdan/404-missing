# Project website

Live URL: https://dilrajahdan.github.io/404-missing/

The promotional site lives in `site/`. GitHub Pages deploys it automatically from
`main` with `.github/workflows/pages.yml`. It serves the two existing narrated
videos and captions without provider credentials or a backend.

0. Install Node 22+ and Python 3.
1. Run `node scripts/build-site.mjs` from the repository root. This also checks
   canonicals, sitemap coverage, video controls, captions and local assets.
2. Run `python3 -m http.server 4389 --directory .local/site`.
3. Open `http://localhost:4389/404-missing/`. Check both videos with sound at desktop
   and mobile sizes. Starting one must pause the other.
4. Push to `main`. In GitHub, open **Actions → Deploy promotional site**.
   Passing result: a successful deployment and playable videos on the live URL.
5. Open a missing path on the live site. Passing result: HTTP 404 with the custom
   page, a home link and the official UK appeal directory. The basic local Python
   server does not emulate GitHub Pages' custom 404 routing.

The sitemap contains only the homepage. The error page is deliberately noindex.
GitHub Pages project sites cannot control the shared domain-root robots.txt.
No structured-data rich-result claim is made.

Analytics are inactive: this project has no verified GA4 measurement ID or Meta
Pixel ID. Activate only its own verified accounts, with the shared consent standard.
Do not reuse another business's IDs.
