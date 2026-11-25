// Navigation and empty collection routes share the same Shopify handles.
export const catalogSections = [
  ['New Arrivals', 'new-arrivals'],
  ['Best Sellers', 'best-sellers'],
  ['EU Top Rankings', 'eu-top-rankings'],
  ['Trending Products', 'trending-products'],
  ['Certified Products', 'certified-products'],
  ['Brand Directory', 'brands'],
  ['Handpicked Brands', 'handpicked-brands'],
];

export function catalogSection(handle) {
  return catalogSections.find(([, key]) => key === handle);
}
