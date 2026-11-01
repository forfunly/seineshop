import {useLocale} from '~/lib/i18n';
/** Render only public technical data; sourcing metadata is never requested. */
export function getSpecificationRows(metafield) {
  let specs;
  try {
    specs = JSON.parse(metafield?.value || 'null');
  } catch {
    return [];
  }
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return [];
  const text = (value) =>
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const list = (value, separator = ', ') =>
    Array.isArray(value) ? value.map(text).filter(Boolean).join(separator) : '';
  const dimension = (value, unit) =>
    value &&
    ['length', 'width', 'height'].every((key) => Number.isFinite(value[key]))
      ? `${value.length} × ${value.width} × ${value.height} ${unit}`
      : '';
  /** @type {Array<[string, string]>} */
  const rows = [
    ['Model', text(specs.model)],
    ['Color', text(specs.color)],
    [
      'Phone output',
      list(specs.phone_output_w, ' / ') &&
        `${list(specs.phone_output_w, ' / ')} W`,
    ],
    [
      'Earbuds output',
      Number.isFinite(specs.earbuds_output_w)
        ? `${specs.earbuds_output_w} W`
        : '',
    ],
    [
      'Watch output',
      Number.isFinite(specs.watch_output_w) ? `${specs.watch_output_w} W` : '',
    ],
    ['Charging port', text(specs.port)],
    [
      'Input',
      Array.isArray(specs.input)
        ? specs.input
            .filter(
              (item) =>
                item &&
                Number.isFinite(item.voltage_v) &&
                Number.isFinite(item.current_a),
            )
            .map((item) => `${item.voltage_v} V / ${item.current_a} A`)
            .join('; ')
        : '',
    ],
    ['Materials', list(specs.materials)],
    ['Finish', text(specs.finish)],
    ['Dimensions', dimension(specs.dimensions_mm, 'mm')],
    [
      'Charging distance',
      Number.isFinite(specs.charging_distance_max_mm)
        ? `Up to ${specs.charging_distance_max_mm} mm`
        : '',
    ],
    ['Compatibility', list(specs.compatible_devices, '; ')],
    ['Features', list(specs.features, '; ')],
    ['Package contents', list(specs.package_contents)],
    ['Package size', dimension(specs.package_dimensions_cm, 'cm')],
    [
      'Gross package weight',
      Number.isFinite(specs.package_gross_weight_kg)
        ? `${specs.package_gross_weight_kg} kg`
        : '',
    ],
    ['Notes', list(specs.warnings, '; ')],
  ].filter(([, value]) => value);
  for (const [label, value] of Object.entries(specs.attributes || {})) {
    let display = text(value);
    const unit = ['Gross Weight', 'Volume Weight', 'Weight'].includes(label) ? 'kg' : ['Length', 'Width', 'Height', 'PackageLength', 'PackageWidth', 'PackageHeight'].includes(label) ? 'cm' : '';
    if (unit && /^\d+(\.\d+)?$/.test(display)) display = `${Number(display)} ${unit}`;
    if (display && !rows.some(([key]) => key.toLowerCase() === label.toLowerCase())) rows.push([label, display]);
  }
  return rows;
}

const packagingLabel = /weight|dimension|length|width|height|package size|packaging|packagequantity|carton/i;
const labels = {PackageLength: 'Carton length', PackageWidth: 'Carton width', PackageHeight: 'Carton height', PackageQuantity: 'Quantity per carton'};

/** @param {{metafield?: {value?: string}, extraRows?: Array<[string, string]>}} props */
export function ProductSpecifications({metafield, extraRows = []}) {
  const {t} = useLocale();
  const rows = getSpecificationRows(metafield);
  for (const row of extraRows) {
    if (!rows.some(([label]) => label.toLowerCase() === row[0].toLowerCase())) rows.push(row);
  }
  if (!rows.length) return null;
  /** @type {Array<[string, Array<[string, string]>]>} */
  const groups = [
    ['General', rows.filter(([label]) => !packagingLabel.test(label) && label !== 'Package contents')],
    ['Packaging & dimensions', rows.filter(([label]) => packagingLabel.test(label))],
    ['Package contents', rows.filter(([label]) => label === 'Package contents')],
  ];
  return <section className="product-specifications" aria-labelledby="technical-specifications">
    <h2 id="technical-specifications">{t('Technical specifications')}</h2>
    {groups.filter(([, entries]) => entries.length).map(([title, entries]) => (
      <table className="pdp-spec-table" key={title}>
        <caption>{t(title)}</caption>
        <tbody>{entries.map(([label, value]) => <tr key={label}>
          <th scope="row">{t(labels[label] || label)}</th>
          <td>{t(value)}</td>
        </tr>)}</tbody>
      </table>
    ))}
  </section>;
}
