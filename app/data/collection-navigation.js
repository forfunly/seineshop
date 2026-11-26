import {DISCOVERY_SECTIONS, discoveryPath} from './discovery-navigation.js';

const APPLE_COLUMNS = [
  [['iPhone Accessories', 'iphone-accessories']],
  [['iPad Accessories', 'ipad-accessories']],
  [['iPod Accessories', 'ipod-accessories'], ['AirTag Accessories', 'apple-airtag-accessories'], ['Apple Pencil Accessories', 'apple-pencil-accessories'], ['Apple HomeView Accessories', 'apple-homeview-accessories']],
  [['MacBook Accessories', 'macbook-accessories']],
  [['AirPods Accessories', 'airpods-accessories']],
];

// Advance a series to live only when its collection has passed publication checks.
const SERIES = [
  {label: 'iPhone Duo Accessories', handle: 'iphone-duo', family: 'iphone-accessories', status: 'live'},
  {label: 'iPhone 18 Pro Max Accessories', handle: 'iphone-18-pro-max', family: 'iphone-accessories', status: 'live'},
  {label: 'iPhone 18 Pro Accessories', handle: 'iphone-18-pro', family: 'iphone-accessories', status: 'preview'},
];

export function publishedNavigationSeries(localPreview = false) {
  return SERIES.filter(({status}) => status === 'live' || (localPreview && status === 'preview'));
}

export function navigationColumns(category, localPreview) {
  const columns = category.handle === 'apple-accessories' ? APPLE_COLUMNS : category.children.map(({title, handle}) => [[title, handle]]);
  const series = publishedNavigationSeries(localPreview);
  return columns.map((column) => column.map(([title, handle]) => ({title, handle, series: series.filter(({family}) => family === handle)})));
}

export function collectionPrimaryNavigation(localPreview) {
  const discoveries = DISCOVERY_SECTIONS.map(({title, handle}) => [title, discoveryPath(handle)]);
  return [
    discoveries[0],
    ['Best Sellers', '/collections/best-sellers'],
    ...discoveries.slice(1, -1),
    ...publishedNavigationSeries(localPreview).map(({label, handle}) => [label.replace(/ Accessories$/, ''), `/collections/${handle}`]),
    discoveries.at(-1),
    ['Support Center', '/support'],
  ];
}
