// Navigation and empty collection routes share the same Shopify handles.
export const catalogSections = [
  ['New Arrivals', 'new-arrivals'],
  ['Best Sellers', 'best-sellers'],
  ['EU Top Rankings', 'eu-top-rankings'],
  ['Trending Products', 'trending-products'],
  ['Certified Products', 'certified-products'],
  ['Brand Distributor', 'brands'],
  ['Handpicked Brands', 'handpicked-brands'],
];

export function catalogSection(handle) {
  return catalogSections.find(([, key]) => key === handle);
}

// Each merchandising page declares its own navigation blocks and description.
export const catalogPresentation = {
  'new-arrivals': {kind: 'newest', description: 'Browse recently added products by category.', tabs: ['Leather Cases', 'Tempered Glass', 'TWS Earphones', 'Cell Phone Cables', 'Wireless Chargers', 'Car Chargers', 'Power Bank', 'Mounts & Stands', 'Consumer Electronics', 'Computer & Networking', 'Home & Garden']},
  'eu-top-rankings': {kind: 'ranking', description: 'Explore the products selected for this European market ranking.'},
  'trending-products': {kind: 'trending', description: 'Browse products selected for this trend feature.'},
  'certified-products': {kind: 'certificates', description: 'Browse selected products and check the certification details available on each product page.'},
  brands: {kind: 'directory', description: 'Explore the brands included in the Seine Shop catalog directory.'},
  'handpicked-brands': {kind: 'brands', description: 'Browse products from selected brands.'},
};

// Keep the overflow disclosure between feature links and the branded entry.
export const catalogNavGroups = {
  featured: catalogSections.slice(0, 4),
  overflow: catalogSections.slice(4, 6),
  brands: catalogSections.slice(6),
};

export function usesCatalogResults(handle) {
  return ['trending-products', 'eu-top-rankings'].includes(handle);
}


export function brandDirectory(products) {
  const brands = new Map();
  for (const product of products) {
    const label = product.vendor?.trim();
    if (!label) continue;
    if (!brands.has(label)) brands.set(label, {id: label, label, input: JSON.stringify({productVendor: label}), count: 0, categories: []});
    const entry = brands.get(label);
    entry.count++;
    if (product.productType && !entry.categories.includes(product.productType)) entry.categories.push(product.productType);
  }
  return [...brands.values()].sort((a, b) => a.label.localeCompare(b.label));
}
