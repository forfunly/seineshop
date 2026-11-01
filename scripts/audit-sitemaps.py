"""Read-only audit of the deployed sitemap index and every referenced shard."""
import concurrent.futures
import json
import urllib.request
import urllib.error
import xml.etree.ElementTree as E
from pathlib import Path

BASE = 'https://www.seineshop.com'
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'i': 'http://www.google.com/schemas/sitemap-image/1.1', 'x': 'http://www.w3.org/1999/xhtml'}

def fetch(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=40) as response:
                return response.read()
        except urllib.error.HTTPError:
            raise
        except urllib.error.URLError:
            if attempt == 2:
                raise

def check(url):
    raw = fetch(url)
    root = E.fromstring(raw)
    locs = [n.text for n in root.findall('s:url/s:loc', NS)]
    assert len(locs) == len(set(locs)) and len(locs) <= 50000, url
    assert len(raw) < 52428800, url
    for node in root:
        assert len(node.findall('x:link', NS)) == 4, url
    return {'url': url, 'pages': len(locs), 'images': len(root.findall('s:url/i:image', NS)), 'bytes': len(raw)}

root = E.fromstring(fetch(BASE + '/sitemap.xml'))
urls = [n.text for n in root.findall('s:sitemap/s:loc', NS)]
assert urls and all('/sitemap.' in url for url in urls)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    rows = list(pool.map(check, urls))
assert all(row['images'] > 0 for row in rows if '.products-' in row['url'])
for path in ['/sitemaps/en/products-1.xml', '/sitemap/products/1.xml', '/sitemap-view', '/robots.txt']:
    fetch(BASE + path)
Path('../data/sitemap-live-audit.json').write_text(json.dumps(rows, indent=2))
print('PASS:', len(rows), 'shards;', sum(r['pages'] for r in rows), 'localized URLs;', sum(r['images'] for r in rows), 'images')
