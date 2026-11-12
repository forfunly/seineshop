"""Prepare (never execute) Shopify imports from verified browser captures."""
import argparse
import html
import json
import re
from decimal import Decimal
from html.parser import HTMLParser
from pathlib import Path


class DescriptionParser(HTMLParser):
    allowed = {'p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'br'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in {'h2', 'h5', 'script', 'style'}:
            self.skip += 1
        if not self.skip and tag in self.allowed:
            self.parts.append(f'<{tag}>')

    def handle_endtag(self, tag):
        if tag in {'h2', 'h5', 'script', 'style'}:
            self.skip = max(0, self.skip - 1)
        elif not self.skip and tag in self.allowed and tag != 'br':
            self.parts.append(f'</{tag}>')

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(html.escape(data))


def money(value):
    if not re.fullmatch(r'\$\d+(?:,\d{3})*(?:\.\d{1,2})?', value):
        raise ValueError(f'Unverified USD price: {value!r}')
    amount = Decimal(value[1:].replace(',', ''))
    if amount <= 0:
        raise ValueError('Nonpositive source price')
    return f'{amount:.2f}'


def displayed_price(record):
    # The visible primary quote can reflect the source's minimum order quantity.
    quote = record.get('basePrice')
    if not quote:
        match = re.search(r'Customer No\.:\s*--\s*(\$[\d,.]+)', record['pageText'])
        if not match:
            raise ValueError('Missing displayed primary price')
        quote = match[1]
    return money(quote)



def snapshot_fields(snapshot, max_bytes=120000):
    """Keep complete records below Shopify's UTF-8 JSON field size limit."""
    encode = lambda value: json.dumps(value, ensure_ascii=False)
    if len(encode(snapshot).encode('utf-8')) <= max_bytes:
        return [('source_snapshot', 'json', snapshot)]
    chunks, current = [], {}
    for sku, record in snapshot['variants'].items():
        candidate = {**current, sku: record}
        if len(encode({'variants': candidate}).encode('utf-8')) > max_bytes:
            if not current:
                raise ValueError('Single SKU snapshot exceeds metafield limit')
            chunks.append(current)
            current = {sku: record}
        else:
            current = candidate
        if len(encode({'variants': current}).encode('utf-8')) > max_bytes:
            raise ValueError('Single SKU snapshot exceeds metafield limit')
    if current:
        chunks.append(current)
    manifest = {**snapshot, 'variants': {}, 'snapshot_parts': []}
    fields = []
    for index, chunk in enumerate(chunks, 1):
        key = f'source_snapshot_part_{index:02d}'
        manifest['snapshot_parts'].append('custom.' + key)
        for sku, record in chunk.items():
            manifest['variants'][sku] = {'url': record['url'], 'snapshot_field': 'custom.' + key}
        fields.append((key, 'json', {'variants': chunk}))
    return [('source_snapshot', 'json', manifest), *fields]


def prepare(root, output):
    groups = {g['index']: g for g in json.loads((root / 'groups.json').read_text())}
    existing = json.loads((root / 'shopify-existing-1.json').read_text())['products']['nodes']
    existing_skus = {v['sku'] for p in existing for v in p['variants']['nodes']}
    imported_path = root / 'imported-products.json'
    if imported_path.exists():
        existing_skus.update(sku for p in json.loads(imported_path.read_text()).values() for sku in p['skus'])
    catalog_path = root / 'shopify-all-skus.jsonl'
    catalog = [json.loads(line) for line in catalog_path.read_text().splitlines()] if catalog_path.exists() else []
    existing_skus.update(row['sku'] for row in catalog if row.get('sku'))
    occupied_handles = {row['handle'] for row in catalog if row.get('handle')}
    if imported_path.exists():
        occupied_handles.update(p['handle'] for p in json.loads(imported_path.read_text()).values())
    qualifiers_path = root / 'handle-qualifiers.json'
    qualifiers = json.loads(qualifiers_path.read_text()) if qualifiers_path.exists() else {}
    seen, handles, rows, report, rejected = set(), set(), [], [], []
    for index, group in sorted(groups.items()):
        try:
            if set(group['skus']) & seen:
                continue
            if set(group['skus']) & existing_skus:
                continue  # Existing products use a separate non-destructive update.
            variants = [json.loads((root / 'products' / f'{sku}.json').read_text()) for sku in group['skus']]
            if len(variants) != group['expected']:
                raise ValueError('Incomplete variant group')
            base = variants[0]
            labels = []
            for v in variants:
                selected = [o['label'] for o in v['variants'] if o['selected']]
                labels.append(selected[0] if selected else 'Default Title')
            if len(set(labels)) != len(labels):
                raise ValueError('Ambiguous variant options')
            title = base['title'].strip()
            if len(variants) > 1 and title.endswith(' - ' + labels[0]):
                title = title[:-(len(labels[0]) + 3)]
            handle = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:220].rstrip('-')
            if str(index) in qualifiers:
                qualifier = qualifiers[str(index)]
                if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', qualifier):
                    raise ValueError('Invalid reviewed handle qualifier')
                handle += '-' + qualifier
            if handle in handles or handle in occupied_handles:
                raise ValueError('Handle collision requires review')
            parser = DescriptionParser()
            parser.feed(base['descriptionHtml'])
            description = ''.join(parser.parts).strip()
            if re.search(r'tvcmall|tvc-mall|https?://', title + description, re.I):
                raise ValueError('Source reference in public text')
            files, inputs, sourcing = [], [], {}
            option_name = 'Color' if len(variants) > 1 or labels[0] != 'Default Title' else 'Title'
            for v, label in zip(variants, labels):
                if v['sku'] not in v['pageText'] or not v['images']:
                    raise ValueError('Incomplete SKU capture')
                tiers = [{'minimum_quantity': int(t['minimumQuantity'].split()[0]), 'unit_price': money(t['price']), 'currency': 'USD'} for t in v['prices']]
                if tiers[0]['minimum_quantity'] != 1:
                    raise ValueError('MOQ greater than one requires purchase-rule review')
                specs = dict(v['specifications'])
                variant_files = []
                for n, url in enumerate(dict.fromkeys(v['images'])):
                    if not url.startswith('https://img.tvcmall.com/'):
                        raise ValueError('Unexpected image origin')
                    file = {'originalSource': url, 'contentType': 'IMAGE', 'filename': f"{v['sku']}-{n + 1}.webp", 'alt': v['title']}
                    files.append(file)
                    variant_files.append(file)
                item = {'sku': v['sku'], 'price': displayed_price(v), 'optionValues': [{'optionName': option_name, 'name': label}], 'file': variant_files[0], 'inventoryItem': {'cost': displayed_price(v)}}
                weight = specs.get('Gross Weight', '')
                if re.fullmatch(r'\d+(?:\.\d+)?kg', weight):
                    item['inventoryItem']['measurement'] = {'weight': {'value': float(weight[:-2]), 'unit': 'KILOGRAMS'}}
                if specs.get('EAN', '').isdigit():
                    item['barcodes'] = [{'value': specs['EAN']}]
                inputs.append(item)
                sourcing[v['sku']] = {'source_url': v['url'], 'unit_cost': displayed_price(v), 'currency': 'USD', 'retail_multiplier': 1, 'source_price_intervals': tiers, 'inventory_verified': False, 'minimum_order_quantity': int(re.search(r'MOQ:\s*(\d+)', v['pageText']).group(1)) if re.search(r'MOQ:\s*(\d+)', v['pageText']) else 1}
            if len(files) > 250:
                raise ValueError('Media batch requires splitting')
            snapshot = {'collection_url': 'https://www.tvcmall.com/c/iphone-duo-c131202/', 'variants': {v['sku']: v for v in variants}, 'wholesale_checkout_enabled': False}
            metafields = []
            for key, typ, value in [
                ('source_urls', 'list.url', [v['url'] for v in variants]),
                *snapshot_fields(snapshot),
                ('sourcing_record', 'json', sourcing),
                ('source_captured_at', 'date_time', max(v['capturedAt'] for v in variants)),
                ('source_detail_status', 'single_line_text_field', 'Browser detail complete; wholesale tiers stored only'),
                ('technical_specifications', 'json', {'attributes': dict(base['specifications'])}),
                ('compatible_models', 'list.single_line_text_field', ['iPhone Duo']),
            ]:
                metafields.append({'namespace': 'custom', 'key': key, 'type': typ, 'value': value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)})
            product = {'title': title, 'handle': handle, 'descriptionHtml': description, 'status': 'DRAFT', 'tags': ['iPhone Duo'], 'productOptions': [{'name': option_name, 'values': [{'name': label} for label in labels]}], 'variants': inputs, 'files': files, 'metafields': metafields}
            brand = dict(base['specifications']).get('Brand')
            if brand and brand != 'N/A':
                product['vendor'] = brand
            rows.append({'input': product})
            report.append({'index': index, 'handle': handle, 'skus': group['skus'], 'images': len(files), 'price': inputs[0]['price']})
            seen.update(group['skus'])
            handles.add(handle)
        except (ValueError, KeyError, TypeError) as error:
            rejected.append({'index': index, 'error': str(error)})
    (root / f'{output}.jsonl').write_text('\n'.join(json.dumps(row, ensure_ascii=False) for row in rows) + '\n')
    (root / f'{output}-review.json').write_text(json.dumps({'prepared': report, 'rejected': rejected}, ensure_ascii=False, indent=2))
    print(json.dumps({'prepared': len(rows), 'variants': len(seen), 'rejected': rejected}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--output', default='new-products')
    args = parser.parse_args()
    prepare(args.root, args.output)
