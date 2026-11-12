import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import test from 'node:test';

const setup = `import importlib.util, json
spec = importlib.util.spec_from_file_location('importer', 'scripts/prepare-tvcmall-import.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
`;
function python(code) {
  return execFileSync('python3', ['-c', setup + code], {encoding: 'utf8'}).trim();
}

test('uses displayed ordinary USD quote rather than wholesale tiers', () => {
  assert.equal(python(`print(m.displayed_price({'basePrice':'$2.46','prices':[{'price':'$2.28'}]}))`), '2.46');
  assert.equal(python(`print(m.displayed_price({'pageText':'Customer No.: -- $1.01'}))`), '1.01');
  assert.equal(python(`
for value in ['€2.46', '$0', '$2.461', '2.46']:
    try: m.money(value)
    except ValueError: continue
    raise AssertionError(value)
print('rejected')`), 'rejected');
});

test('splits UTF-8 snapshots without losing SKU parameters', () => {
  assert.equal(python(`
snapshot = {'collection_url':'https://example.com', 'variants':{str(i):{'url':'https://example.com/'+str(i),'parameters':'参数'*9000} for i in range(6)}}
fields = m.snapshot_fields(snapshot)
manifest = fields[0][2]
restored = {}
for key, kind, value in fields[1:]:
    assert len(json.dumps(value, ensure_ascii=False).encode('utf-8')) <= 120000
    restored.update(value['variants'])
    assert 'custom.'+key in manifest['snapshot_parts']
assert restored == snapshot['variants']
assert set(manifest['variants']) == set(restored)
print('complete')`), 'complete');
});

test('sanitizes source HTML before public product description', () => {
  assert.equal(python(`
p = m.DescriptionParser()
p.feed('<h2>Source heading</h2><p onclick="bad()">Safe &amp; useful <strong>case</strong></p><script>bad()</script>')
print(''.join(p.parts))`), '<p>Safe &amp; useful <strong>case</strong></p>');
});
