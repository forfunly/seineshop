"""Prepare additive detail media and private source records, without API writes."""
import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

parser = argparse.ArgumentParser()
parser.add_argument('--catalog', required=True)
parser.add_argument('--groups', required=True)
parser.add_argument('--scenes', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args()
rows = [json.loads(line) for line in Path(args.catalog).read_text().splitlines()]
products = {row['id']: row for row in rows if '/Product/' in row['id']}
skus = {row['sku']: row['__parentId'] for row in rows if '/ProductVariant/' in row['id']}
existing = defaultdict(list)
for row in rows:
    if '/ProductImage/' in row['id']:
        existing[row['__parentId']].append(row)
groups = {g['index']: g for g in json.loads(Path(args.groups).read_text())}
captures = defaultdict(dict)
for line in Path(args.scenes).read_text().splitlines():
    row = json.loads(line)
    captures[row['groupIndex']][row['url']] = row
assert set(groups) == set(captures), 'Every group must be checked before upload'
mutations, metadata = [], []
for index, records in captures.items():
    product_id = skus[groups[index]['skus'][0]]
    title = products[product_id]['title']
    assert not re.search(r'tvc[\s-]*mall|https?://', title, re.I)
    images = {}
    for record in records.values():
        for image in record['images']:
            parsed = urlparse(image['src'])
            # Supplier-specific authorization letters remain in the private record.
            if parsed.hostname == 'img.tvc-mall.com' and parsed.path.startswith('/uploads/authorizationimage/'):
                continue
            assert parsed.hostname == 'img.tvcmall.com' and '/scenes/' in parsed.path, image['src']
            images[parsed.path] = image['src']
    media = []
    for number, (path, url) in enumerate(images.items(), 1):
        filename = Path(path).stem
        if any(filename in image['url'] for image in existing[product_id]):
            continue
        media.append({'originalSource': url, 'mediaContentType': 'IMAGE', 'alt': f'Product detail — {title} ({number})'})
    assert len(existing[product_id]) + len(media) <= 250, product_id
    if media:
        mutations.append({'product': {'id': product_id}, 'media': media})
    metadata.append({'ownerId': product_id, 'namespace': 'custom', 'key': 'source_scene_images', 'type': 'json', 'value': json.dumps(list(records.values()), ensure_ascii=False)})
out = Path(args.output)
(out / 'scene-media-input.jsonl').write_text('\n'.join(map(json.dumps, mutations))+'\n')
(out / 'scene-metadata-input.jsonl').write_text('\n'.join(json.dumps({'metafields': metadata[i:i+25]}) for i in range(0, len(metadata),25))+'\n')
print(json.dumps({'products_checked':len(captures), 'products_with_new_images':len(mutations), 'new_images':sum(len(x['media']) for x in mutations)}))
