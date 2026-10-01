"""Deployment gate for this single-page site and its deliberately unindexed 404."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import sys
import xml.etree.ElementTree as ET

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.tags = []; self.feed(text)
    def handle_starttag(self, tag, attrs): self.tags.append((tag, dict(attrs)))

root = Path(sys.argv[1])
canonical = 'https://dilrajahdan.github.io/404-missing/'
page = Page((root / 'index.html').read_text())
assert [a['href'] for t,a in page.tags if t == 'link' and a.get('rel') == 'canonical'] == [canonical]
assert [a['content'] for t,a in page.tags if t == 'meta' and a.get('property') == 'og:url'] == [canonical]
assert not any('noindex' in a.get('content','') for t,a in page.tags if a.get('name') == 'robots')
urls = [n.text for n in ET.parse(root / 'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert urls == [canonical], 'Sitemap must contain exactly the homepage canonical'
assert any(a.get('name') == 'robots' and a.get('content') == 'noindex' for _,a in Page((root/'404.html').read_text()).tags)
videos = [a for t,a in page.tags if t == 'video']
assert len(videos) == 2 and all('controls' in a and 'muted' not in a and 'autoplay' not in a for a in videos)
assert len([a for t,a in page.tags if t == 'track' and a.get('kind') == 'captions']) == 2
for t,a in page.tags:
    for key in ('src','href','poster'):
        ref = a.get(key,'')
        if not ref or urlparse(ref).scheme or ref.startswith('#') or ref == './a-missing-page': continue
        assert (root / ref).exists(), f'Missing asset: {ref}'
print('Site gate passed: canonical, sitemap, 404 noindex, media, captions and local assets')
