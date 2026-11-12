"""Prepare public SKU specifications from captured pages; never writes to Shopify."""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--inventory', required=True)
parser.add_argument('--captures', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args()
fields = []
for line in Path(args.inventory).read_text().splitlines():
    variant = json.loads(line)
    if '/ProductVariant/' not in variant.get('id', ''):
        continue
    raw = json.loads((Path(args.captures) / (variant['sku'] + '.json')).read_text())
    attributes = dict(raw['specifications'])
    serialized = json.dumps({'attributes': attributes}, ensure_ascii=False)
    assert not any(term in serialized.lower() for term in ['tvcmall', 'http://', 'https://']), variant['sku']
    fields.append({'ownerId': variant['id'], 'namespace': 'custom', 'key': 'technical_specifications', 'type': 'json', 'value': serialized})
Path(args.output).write_text('\n'.join(json.dumps({'metafields': fields[i:i+25]}, ensure_ascii=False) for i in range(0, len(fields), 25)) + '\n')
print(json.dumps({'variants': len(fields), 'batches': (len(fields)+24)//25}))
