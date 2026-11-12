"""Read-only reconciliation of browser captures and a Shopify bulk readback."""
import argparse
import importlib.util
import json
from collections import Counter, defaultdict
from decimal import Decimal
from pathlib import Path

spec = importlib.util.spec_from_file_location('prepare_import', Path(__file__).with_name('prepare-tvcmall-import.py'))
prepare_import = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare_import)


def audit(root):
    groups = {g['index']: g for g in json.loads((root / 'groups.json').read_text())}
    expected = {sku for g in groups.values() for sku in g['skus']}
    rows = [json.loads(line) for line in (root / 'final-catalog-audit.jsonl').read_text().splitlines()]
    products = {r['id']: r for r in rows if r.get('id', '').startswith('gid://shopify/Product/')}
    variants = [r for r in rows if r.get('id', '').startswith('gid://shopify/ProductVariant/')]
    media = defaultdict(list)
    channels = defaultdict(set)
    for row in rows:
        if row.get('id', '').startswith('gid://shopify/MediaImage/'):
            media[row['__parentId']].append(row)
        if row.get('isPublished'):
            channels[row['__parentId']].add(row['publication']['id'])
    required = {'gid://shopify/Publication/' + p for p in ['216458985731', '216459378947', '216530551043']}
    issues = []
    counts = Counter(v['sku'] for v in variants)
    if set(counts) != expected:
        issues.append({'sku_difference': sorted(set(counts) ^ expected)})
    if any(n != 1 for n in counts.values()):
        issues.append({'duplicate_skus': [s for s, n in counts.items() if n != 1]})
    if len(products) != len(groups):
        issues.append({'group_product_counts': [len(groups), len(products)]})
    for product in products.values():
        if product['status'] != 'ACTIVE' or not required <= channels[product['id']]:
            issues.append({'publication': product['id']})
    for variant in variants:
        sku = variant['sku']
        if sku not in expected:
            continue
        source = json.loads((root / 'products' / f'{sku}.json').read_text())
        product = products[variant['__parentId']]
        sourcing = json.loads(product['sourcing']['value'])[sku]
        urls = json.loads(product['sourceUrls']['value'])
        price = Decimal(prepare_import.displayed_price(source))
        if Decimal(variant['price']) != price or Decimal(sourcing['unit_cost']) != price:
            issues.append({'price': sku})
        if source['url'] not in urls or sourcing['source_url'] != source['url']:
            issues.append({'source_url': sku})
        tiers = [{'minimum_quantity': int(t['minimumQuantity'].split()[0]), 'unit_price': prepare_import.money(t['price']), 'currency': 'USD'} for t in source['prices']]
        if tiers != sourcing['source_price_intervals']:
            issues.append({'wholesale_tiers': sku})
        if not variant['image'] or not media[variant['id']] or any(m['status'] != 'READY' for m in media[variant['id']]):
            issues.append({'variant_image': sku})
    snapshot_file = root / 'snapshot-audit.jsonl'
    snapshot_count = 0
    if snapshot_file.exists():
        for line in snapshot_file.read_text().splitlines():
            product = json.loads(line)
            snapshot = json.loads(product['snapshot']['value'])
            records = snapshot['variants']
            if snapshot.get('snapshot_parts'):
                records = {}
                for key in snapshot['snapshot_parts']:
                    alias = 'part' + str(int(key[-2:]))
                    records.update(json.loads(product[alias]['value'])['variants'])
            for sku, record in records.items():
                snapshot_count += 1
                if record != json.loads((root / 'products' / f'{sku}.json').read_text()):
                    issues.append({'raw_snapshot': sku})
        if snapshot_count != len(expected):
            issues.append({'snapshot_count': snapshot_count})
    result = {'groups': len(groups), 'products': len(products), 'variants': len(variants), 'channels_per_product': len(required), 'raw_snapshots_verified': snapshot_count, 'issues': issues}
    (root / 'final-audit-summary.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result))
    return not issues


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    args = parser.parse_args()
    raise SystemExit(0 if audit(args.root) else 1)
